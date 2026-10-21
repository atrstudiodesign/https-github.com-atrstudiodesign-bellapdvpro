import { useEffect, useMemo, useState } from 'react';
import { collection, onSnapshot, type DocumentData } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuthStore } from '../../store/auth';

type RecordRow = { id: string; data: DocumentData };
type Stream = { rows: RecordRow[]; loading: boolean; error: string | null };

function useAdminCollection(name: string, enabled: boolean): Stream {
  const [state, setState] = useState<Stream>({ rows: [], loading: true, error: null });
  useEffect(() => {
    if (!enabled) { setState({ rows: [], loading: false, error: null }); return; }
    setState({ rows: [], loading: true, error: null });
    return onSnapshot(collection(db, name), snapshot => {
      setState({ rows: snapshot.docs.map(item => ({ id: item.id, data: item.data() })), loading: false, error: null });
    }, error => setState({ rows: [], loading: false, error: error.message }));
  }, [name, enabled]);
  return state;
}

function getDate(value: unknown): number {
  if (!value) return NaN;
  if (typeof value === 'object' && value !== null && 'toMillis' in value && typeof value.toMillis === 'function') return value.toMillis();
  return Date.parse(String(value));
}

export default function CommercialOverview() {
  const { user } = useAuthStore();
  const allowed = user?.isPlatformAdmin === true && !user?.isDemo;
  const users = useAdminCollection('users', allowed);
  const licenses = useAdminCollection('company_licenses', allowed);
  const visits = useAdminCollection('visitor_events', allowed);
  const events = useAdminCollection('commercial_events', allowed);
  const [filter, setFilter] = useState('');
  const [status, setStatus] = useState('all');
  const eventCount = (name: string) => events.rows.filter(item => item.data.event === name).length;
  const visitorIds = new Set(visits.rows.map(item => String(item.data.visitorId))).size;
  const recentEvents = [...events.rows].sort((a,b) => getDate(b.data.occurredAt) - getDate(a.data.occurredAt)).slice(0,30);
  const licenseIndex = useMemo(() => new Map(licenses.rows.map(row => [row.id, row.data])), [licenses.rows]);
  const records = useMemo(() => users.rows.map(row => {
    const license = licenseIndex.get(row.data.companyId || row.id);
    const state = license?.status || 'unconfirmed';
    const until = getDate(license?.expireDate);
    return {
      id: row.id, name: String(row.data.companyName || row.data.name || 'Empresa sem nome'),
      email: String(row.data.email || ''), status: state,
      plan: String(license?.plan || 'Não definido'),
      trialEnds: Number.isFinite(until) ? new Date(until).toLocaleDateString('pt-BR') : '—',
      expired: state === 'trial' && Number.isFinite(until) && until < Date.now(),
      lastLogin: Number.isFinite(getDate(row.data.lastLogin)) ? new Date(getDate(row.data.lastLogin)).toLocaleString('pt-BR') : '—'
    };
  }), [users.rows, licenseIndex]);
  const visible = records.filter(row => (status === 'all' || (status === 'expired' ? row.expired : row.status === status)) && (row.name + ' ' + row.email).toLowerCase().includes(filter.toLowerCase()));
  const trialCount = records.filter(x => x.status === 'trial' && !x.expired).length;
  const expiredCount = records.filter(x => x.expired).length;
  const activeCount = records.filter(x => x.status === 'active').length;
  const missingCount = records.filter(x => x.status === 'unconfirmed').length;
  if (!allowed) return <p className="text-red-300">Acesso exclusivo do Super Admin autenticado.</p>;
  return <section className="space-y-6">
    <div><h2 className="text-2xl font-bold text-white">Funil comercial e assinaturas</h2><p className="mt-2 text-sm text-slate-400">Atualização automática do Firestore. Os status representam registros de licença; pagamento confirmado exige conciliação com o provedor financeiro.</p></div>
    {(users.error || licenses.error || visits.error || events.error) && <div role="alert" className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-red-200">Falha de sincronização: {users.error || licenses.error || visits.error || events.error}</div>}
    {(users.loading || licenses.loading) && <p className="text-cyan-300">Sincronizando empresas e licenças…</p>}
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {[
        ['Empresas cadastradas', records.length],
        ['Trial válido', trialCount],
        ['Trial expirado', expiredCount],
        ['Licenças ativas', activeCount],
        ['Visitas com consentimento', visits.rows.length],
        ['Visitantes distintos', visitorIds],
        ['Cadastros registrados', eventCount('account_created')],
        ['Inícios de trial', eventCount('trial_started')]
      ].map(([label, value]) => <div key={String(label)} className="rounded-xl border border-white/10 bg-white/5 p-5"><p className="text-xs text-slate-400">{label}</p><p className="mt-3 text-3xl font-bold text-white">{value}</p></div>)}
    </div>
    <div className="rounded-xl border border-white/10 bg-white/5 p-4"><h3 className="mb-3 font-semibold text-white">Últimos eventos de conta (horário registrado no servidor)</h3>
      {recentEvents.length ? <div className="space-y-2">{recentEvents.map(item => <p key={item.id} className="text-xs text-slate-300">{item.data.event} · {String(item.data.companyId)} · {Number.isFinite(getDate(item.data.occurredAt)) ? new Date(getDate(item.data.occurredAt)).toLocaleString('pt-BR') : 'Pendente de sincronização'}</p>)}</div> : <p className="text-sm text-slate-400">Nenhum evento registrado ou acesso não autorizado.</p>}
    </div>
    <p className="text-sm text-amber-200">Eventos de visita só são coletados com consentimento. A quantidade de visitantes depende do identificador Firebase e não representa pessoas únicas verificadas. Sem licença verificada: {missingCount} · Pagamentos confirmados exigem webhook autenticado do provedor financeiro. Não são contabilizados como conversões.</p>
    <div className="flex flex-wrap gap-3">
      <input aria-label="Buscar empresa ou e-mail" className="min-w-0 flex-1 rounded-lg border border-white/10 bg-slate-900 px-4 py-3 text-white" placeholder="Buscar empresa ou e-mail" value={filter} onChange={e => setFilter(e.target.value)} />
      <select aria-label="Filtrar por situação" className="rounded-lg border border-white/10 bg-slate-900 px-4 py-3 text-white" value={status} onChange={e => setStatus(e.target.value)}>
        <option value="all">Todas</option><option value="trial">Trial</option><option value="expired">Trial expirado</option><option value="active">Ativa</option><option value="unconfirmed">Sem licença</option><option value="expired-license">Outra situação</option>
      </select>
    </div>
    <div className="overflow-x-auto rounded-xl border border-white/10"><table className="w-full min-w-[700px] text-left text-sm"><thead className="bg-white/5 text-slate-300"><tr>{['Empresa','E-mail','Plano','Licença','Fim do trial','Último login'].map(x => <th key={x} className="p-3">{x}</th>)}</tr></thead><tbody>{visible.map(row => <tr key={row.id} className="border-t border-white/10"><td className="p-3 font-medium text-white">{row.name}</td><td className="p-3">{row.email}</td><td className="p-3">{row.plan}</td><td className="p-3">{row.expired ? 'Trial expirado' : row.status}</td><td className="p-3">{row.trialEnds}</td><td className="p-3">{row.lastLogin}</td></tr>)}</tbody></table>{!visible.length && !users.loading && <p className="p-6 text-center text-slate-400">Nenhum registro correspondente.</p>}</div>
  </section>;
}
