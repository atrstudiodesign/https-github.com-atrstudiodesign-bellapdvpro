import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, doc, getDoc, onSnapshot, writeBatch } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { CalendarDays, Wallet, Gift, Megaphone, ShieldCheck, LogIn } from 'lucide-react';

type Entry = { id: string; [key: string]: unknown };
type SectionKey = 'appointments' | 'commissions' | 'referrals' | 'marketing';
const sections: { key: SectionKey; title: string; empty: string; icon: typeof CalendarDays }[] = [
  { key: 'appointments', title: 'Meus agendamentos', empty: 'Nenhum agendamento atribuído.', icon: CalendarDays },
  { key: 'commissions', title: 'Minhas comissões', empty: 'Nenhuma comissão disponível.', icon: Wallet },
  { key: 'referrals', title: 'Minhas indicações', empty: 'Nenhuma indicação registrada.', icon: Gift },
  { key: 'marketing', title: 'Marketing autorizado', empty: 'Nenhuma campanha destinada a você.', icon: Megaphone },
];
function safeText(value: unknown) {
  return typeof value === 'string' || typeof value === 'number' ? String(value) : '';
}
export default function EmployeePortal() {
  const [state, setState] = useState<'loading'|'login'|'denied'|'active'|'error'>('loading');
  const [name, setName] = useState('');
  const [data, setData] = useState<Record<SectionKey, Entry[]>>({ appointments: [], commissions: [], referrals: [], marketing: [] });
  const [error, setError] = useState('');
  const inviteId = new URLSearchParams(window.location.search).get('convite');
  const [accepting, setAccepting] = useState(false);
  const acceptInvitation = async () => {
    const user = auth.currentUser;
    if (!user || user.isAnonymous || !inviteId) return;
    if (!user.email || !user.emailVerified) {
      setError('Confirme o e-mail desta conta no Firebase Authentication antes de aceitar o convite.');
      return;
    }
    setAccepting(true);
    try {
      await user.getIdToken(true);
      const invite = await getDoc(doc(db, 'staff_invites', inviteId));
      const item = invite.data();
      if (!item || item.status !== 'pending' || item.email !== user.email.toLowerCase()) {
        throw new Error('Convite inválido ou associado a outro e-mail.');
      }
      const batch = writeBatch(db);
      batch.update(doc(db, 'users', user.uid), { role: 'employee', companyId: item.companyId, staffInviteId: inviteId });
      batch.set(doc(db, 'staff_members', user.uid), {
        companyId: item.companyId, professionalId: item.professionalId,
        staffInviteId: inviteId, active: true, email: user.email.toLowerCase(),
        name: user.displayName || user.email.split('@')[0]
      });
      await batch.commit();
      window.location.reload();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Não foi possível aceitar o convite.');
    } finally { setAccepting(false); }
  };
  useEffect(() => {
    let cleanupSubscriptions: (() => void) | undefined;
    const unsubscribeAuth = onAuthStateChanged(auth, user => {
      cleanupSubscriptions?.();
      cleanupSubscriptions = undefined;
      setError('');
      setName('');
      setState('loading');
      setData({ appointments: [], commissions: [], referrals: [], marketing: [] });
      if (!user || user.isAnonymous) { setState('login'); return; }

      let sectionUnsubs: Array<() => void> = [];
      const stopSections = () => {
        sectionUnsubs.forEach(unsubscribe => unsubscribe());
        sectionUnsubs = [];
        setData({ appointments: [], commissions: [], referrals: [], marketing: [] });
      };
      const unsubStaff = onSnapshot(doc(db, 'staff_members', user.uid), snapshot => {
        const staff = snapshot.data();
        if (!snapshot.exists() || staff?.active !== true || typeof staff?.companyId !== 'string' || !staff.companyId) {
          stopSections();
          setState('denied');
          return;
        }
        setName(typeof staff.name === 'string' ? staff.name : user.displayName || 'Profissional');
        if (sectionUnsubs.length === 0) {
          sectionUnsubs = sections.map(section => onSnapshot(
            collection(db, 'staff_portal', user.uid, section.key),
            snapshot => setData(prev => ({ ...prev, [section.key]: snapshot.docs.map(item => ({ id: item.id, ...item.data() })) })),
            () => { stopSections(); setState('error'); setError('Não foi possível acessar dados individuais. Verifique as regras publicadas.'); }
          ));
        }
        setState('active');
      }, () => { stopSections(); setState('error'); setError('Não foi possível validar o vínculo com a empresa.'); });
      cleanupSubscriptions = () => { stopSections(); unsubStaff(); };
    });
    return () => { unsubscribeAuth(); cleanupSubscriptions?.(); };
  }, []);
  return <main className="min-h-screen bg-[#030817] text-white px-4 py-10">
    <div className="max-w-6xl mx-auto">
      <div className="flex justify-between gap-4 items-center border-b border-white/10 pb-6 mb-8">
        <div><span className="text-cyan-300 text-xs font-bold tracking-widest">BELLA PDV PRO</span><h1 className="text-3xl font-black mt-2">Portal do Funcionário</h1></div>
        <Link to="/landing" className="text-sm text-cyan-300 hover:text-white">Início</Link>
      </div>
      {state === 'loading' && <p className="text-slate-300">Validando seu acesso…</p>}
      {state === 'login' && <div className="rounded-2xl border border-white/10 bg-white/5 p-8"><LogIn className="text-cyan-300"/><p className="my-4">Entre com a conta autorizada pela empresa para consultar seus dados.</p><Link className="text-cyan-300 underline" to="/login">Entrar na minha conta</Link></div>}
      {inviteId && state !== 'active' && state !== 'loading' && state !== 'login' && (
        <div className="mb-6 rounded-2xl border border-cyan-500/25 bg-cyan-500/5 p-6">
          <h2 className="text-lg font-semibold text-white">Convite para acessar o portal</h2>
          <p className="mt-2 text-sm text-slate-300">Para aceitar, utilize a conta Firebase com o mesmo e-mail verificado informado pela empresa. Seu acesso ficará restrito ao painel individual.</p>
          <button type="button" disabled={accepting} onClick={() => void acceptInvitation()}
            className="mt-4 rounded-lg bg-cyan-500 px-4 py-2 text-sm font-bold text-slate-950 disabled:opacity-50">
            {accepting ? 'Validando vínculo…' : 'Aceitar convite'}
          </button>
        </div>
      )}
      {state === 'denied' && <div className="rounded-2xl border border-amber-400/20 p-8 bg-white/5"><ShieldCheck className="text-amber-300"/><h2 className="text-xl font-bold mt-3">Acesso não habilitado</h2><p className="text-slate-300 mt-2">Seu cadastro ainda não está vinculado como funcionário ativo. Solicite autorização ao responsável pela empresa.</p></div>}
      {state === 'error' && <p role="alert" className="text-amber-300">{error}</p>}
      {state === 'active' && <>
        <p className="text-slate-300 mb-7">Olá, {name}. Aqui aparecem somente as informações destinadas à sua conta. Dados financeiros gerais da empresa não são exibidos.</p>
        {error && <p role="status" className="mb-5 text-amber-300 text-sm">{error}</p>}
        <div className="grid sm:grid-cols-2 gap-5">
          {sections.map(section => <article key={section.key} className="bg-gradient-to-br from-[#10254B] to-[#0B1731] border border-cyan-400/15 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-5"><section.icon className="text-cyan-300"/><h2 className="font-bold text-lg">{section.title}</h2><span className="ml-auto text-xs rounded-full bg-white/10 px-2 py-1">{data[section.key].length}</span></div>
            {data[section.key].length === 0 ? <p className="text-slate-400 text-sm">{section.empty}</p> :
            <ul className="space-y-3">{data[section.key].slice(0,20).map(item => <li key={item.id} className="border-t border-white/10 pt-3">
              <p className="text-white text-sm font-medium">{safeText(item.title) || safeText(item.name) || safeText(item.service) || 'Registro'}</p>
              <p className="text-slate-400 text-xs mt-1">{[safeText(item.date),safeText(item.time),safeText(item.status)].filter(Boolean).join(' • ')}</p>
              {section.key === 'commissions' && typeof item.amount === 'number' && <p className="text-cyan-300 text-sm mt-1">{item.amount.toLocaleString('pt-BR',{style:'currency',currency:'BRL'})}</p>}
            </li>)}</ul>}
          </article>)}
        </div>
      </>}
    </div>
  </main>;
}
