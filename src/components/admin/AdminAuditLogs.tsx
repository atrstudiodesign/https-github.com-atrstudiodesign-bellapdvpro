import { useEffect, useMemo, useState } from 'react';
import { collection, getDocs, limit, orderBy, query } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { toast } from 'sonner';

type Event = { id: string; category: string; action: string; actorUid: string; tenantId: string; result: string; createdAt: string; requestId: string };
const columns: (keyof Event)[] = ['createdAt', 'category', 'action', 'actorUid', 'tenantId', 'result', 'requestId'];
export function AdminAuditLogs() {
  const [events, setEvents] = useState<Event[]>([]);
  const [filter, setFilter] = useState('todos');
  const [term, setTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const refresh = async () => {
    setLoading(true);
    try {
      const snap = await getDocs(query(collection(db, 'admin_audit_logs'), orderBy('createdAt', 'desc'), limit(500)));
      setEvents(snap.docs.map(d => { const v = d.data(); const field = (k: string) => typeof v[k] === 'string' ? v[k] as string : ''; return { id: d.id, category: field('category'), action: field('action'), actorUid: field('actorUid'), tenantId: field('tenantId'), result: field('result'), requestId: field('requestId'), createdAt: v.createdAt?.toDate?.()?.toISOString?.() || field('createdAt') }; }));
      setLoaded(true);
    } catch (e) { console.error(e); toast.error('Não foi possível consultar os logs reais.'); }
    finally { setLoading(false); }
  };
  useEffect(() => { void refresh(); }, []);
  const filtered = useMemo(() => events.filter(e => (filter === 'todos' || e.category === filter) && (!term || columns.some(k => e[k].toLowerCase().includes(term.toLowerCase())))), [events, filter, term]);
  const exportCsv = () => {
    if (!loaded || filtered.length === 0) return;
    const safe = (value: string) => '"' + value.replace(/^[=+@-]/, "'").replace(/"/g, '""') + '"';
    const csv = [columns.join(','), ...filtered.map(e => columns.map(k => safe(e[k])).join(','))].join('\r\n');
    const url = URL.createObjectURL(new Blob(['\uFEFF', csv], { type: 'text/csv;charset=utf-8' }));
    const a = document.createElement('a'); a.href = url; a.download = 'bella-auditoria.csv'; a.click(); URL.revokeObjectURL(url);
  };
  return <div className="space-y-5"><h2 className="text-2xl font-semibold text-white">Logs de Auditoria</h2><p className="text-slate-400 text-sm">Somente registros reais da coleção admin_audit_logs. Consulta limitada aos 500 eventos recentes. Ingestão server-side ainda pendente.</p><div className="flex flex-wrap gap-3"><select aria-label="Categoria" value={filter} onChange={e => setFilter(e.target.value)} className="bg-slate-900 text-white p-2 rounded">{['todos','login','venda','webhook','erro','admin'].map(x => <option key={x} value={x}>{x}</option>)}</select><input aria-label="Pesquisar logs" value={term} onChange={e => setTerm(e.target.value)} placeholder="Buscar evento ou empresa" className="bg-slate-900 text-white p-2 rounded"/><button onClick={() => void refresh()} disabled={loading} className="bg-white/10 text-white p-2 rounded">Atualizar</button><button onClick={exportCsv} disabled={!loaded || !filtered.length} className="bg-indigo-600 text-white p-2 rounded disabled:opacity-40">Exportar CSV</button></div><div className="overflow-x-auto rounded border border-white/10"><table className="min-w-full text-sm text-slate-200"><thead><tr>{columns.map(x => <th key={x} className="text-left p-3">{x}</th>)}</tr></thead><tbody>{filtered.map(e => <tr key={e.id} className="border-t border-white/10">{columns.map(k => <td key={k} className="p-3">{e[k] || '—'}</td>)}</tr>)}</tbody></table>{!loading && !filtered.length && <p className="p-4 text-slate-400">Nenhum evento real disponível.</p>}</div></div>;
}
