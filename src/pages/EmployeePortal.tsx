import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, doc, onSnapshot } from 'firebase/firestore';
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
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, user => {
      setState('loading');
      setData({ appointments: [], commissions: [], referrals: [], marketing: [] });
      if (!user || user.isAnonymous) { setState('login'); return; }
      const unsubStaff = onSnapshot(doc(db, 'staff_members', user.uid), snapshot => {
        const staff = snapshot.data();
        if (!snapshot.exists() || staff?.active !== true || typeof staff?.companyId !== 'string' || !staff.companyId) {
          setState('denied'); setData({ appointments: [], commissions: [], referrals: [], marketing: [] }); return;
        }
        setName(typeof staff.name === 'string' ? staff.name : user.displayName || 'Profissional');
        setState('active');
      }, () => { setState('error'); setError('Não foi possível validar o vínculo com a empresa.'); });
      // Firebase rules apply per document: only this UID may read the portal.
      const unsubSections = sections.map(section => onSnapshot(
        collection(db, 'staff_portal', user.uid, section.key),
        snapshot => setData(prev => ({ ...prev, [section.key]: snapshot.docs.map(item => ({ id: item.id, ...item.data() })) })),
        () => { setError('Alguns dados não estão disponíveis. Verifique se as regras foram publicadas e seu acesso está ativo.'); }
      ));
      return () => { unsubStaff(); unsubSections.forEach(unsub => unsub()); };
    });
    return () => { unsubscribeAuth(); };
  }, []);
  return <main className="min-h-screen bg-[#030817] text-white px-4 py-10">
    <div className="max-w-6xl mx-auto">
      <div className="flex justify-between gap-4 items-center border-b border-white/10 pb-6 mb-8">
        <div><span className="text-cyan-300 text-xs font-bold tracking-widest">BELLA PDV PRO</span><h1 className="text-3xl font-black mt-2">Portal do Funcionário</h1></div>
        <Link to="/landing" className="text-sm text-cyan-300 hover:text-white">Início</Link>
      </div>
      {state === 'loading' && <p className="text-slate-300">Validando seu acesso…</p>}
      {state === 'login' && <div className="rounded-2xl border border-white/10 bg-white/5 p-8"><LogIn className="text-cyan-300"/><p className="my-4">Entre com a conta autorizada pela empresa para consultar seus dados.</p><Link className="text-cyan-300 underline" to="/login">Entrar na minha conta</Link></div>}
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
