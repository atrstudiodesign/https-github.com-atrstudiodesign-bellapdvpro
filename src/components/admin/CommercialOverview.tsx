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
  const [filter, setFilter] = useState('');
  const [status, setStatus] = useState('all');
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
    {(users.error || licenses.error) && <div role="alert" className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-red-200">Falha de sincronização: {users.error || licenses.error}</div>}
    {(users.loading || licenses.loading) && <p className="text-cyan-300">Sincronizando empresas e licenças…</p>}
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {[
        ['Empresas cadastradas', records.length],
        ['Trial válido', trialCount],
        ['Trial expirado', expiredCount],
        ['Licenças ativas', activeCount]
      ].map(([label, value]) => <div key={String(label)} className="rounded-xl border border-white/10 bg-white/5 p-5"><p className="text-xs text-slate-400">{label}</p><p className="mt-3 text-3xl font-bold text-white">{value}</p></div>)}
    </div>
    <p className="text-sm text-amber-200">Sem licença verificada: {missingCount} · Visitas anônimas e pagamentos confirmados: aguardam integração de analytics e webhooks de cobrança. Não são contabilizados como conversões.</p>
    <div className="flex flex-wrap gap-3">
      <input aria-label="Buscar empresa ou e-mail" className="min-w-0 flex-1 rounded-lg border border-white/10 bg-slate-900 px-4 py-3 text-white" placeholder="Buscar empresa ou e-mail" value={filter} onChange={e => setFilter(e.target.value)} />
      <select aria-label="Filtrar por situação" className="rounded-lg border border-white/10 bg-slate-900 px-4 py-3 text-white" value={status} onChange={e => setStatus(e.target.value)}>
        <option value="all">Todas</option><option value="trial">Trial</option><option value="expired">Trial expirado</option><option value="active">Ativa</option><option value="unconfirmed">Sem licença</option><option value="expired-license">Outra situação</option>
      </select>
    </div>
    <div className="overflow-x-auto rounded-xl border border-white/10"><table className="w-full min-w-[700px] text-left text-sm"><thead className="bg-white/5 text-slate-300"><tr>{['Empresa','E-mail','Plano','Licença','Fim do trial','Último login'].map(x => <th key={x} className="p-3">{x}</th>)}</tr></thead><tbody>{visible.map(row => <tr key={row.id} className="border-t border-white/10"><td className="p-3 font-medium text-white">{row.name}</td><td className="p-3">{row.email}</td><td className="p-3">{row.plan}</td><td className="p-3">{row.expired ? 'Trial expirado' : row.status}</td><td className="p-3">{row.trialEnds}</td><td className="p-3">{row.lastLogin}</td></tr>)}</tbody></table>{!visible.length && !users.loading && <p className="p-6 text-center text-slate-400">Nenhum registro correspondente.</p>}</div>
  </section>;
}
