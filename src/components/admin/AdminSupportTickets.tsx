import { useEffect, useState } from 'react';
import { addDoc, collection, doc, getDocs, orderBy, query, serverTimestamp, updateDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { toast } from 'sonner';

type Ticket = { id: string; subject: string; companyId: string; status: string; priority: string; assignedTo: string; createdAt?: { toDate?: () => Date } };
type Reply = { id: string; body: string; author: string; createdAt?: { toDate?: () => Date } };

export function AdminSupportTickets() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [replies, setReplies] = useState<Reply[]>([]);
  const [subject, setSubject] = useState('');
  const [companyId, setCompanyId] = useState('');
  const [priority, setPriority] = useState('normal');
  const [message, setMessage] = useState('');
  const [assignedTo, setAssignedTo] = useState('');
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const refresh = async () => {
    setLoading(true);
    try {
      const snap = await getDocs(query(collection(db, 'support_tickets'), orderBy('createdAt', 'desc')));
      setTickets(snap.docs.map(d => ({ id: d.id, ...d.data() } as Ticket)));
    } catch (e) { console.error(e); toast.error('Não foi possível consultar os tickets. Verifique permissões e regras Firestore.'); }
    finally { setLoading(false); }
  };
  useEffect(() => { void refresh(); }, []);
  useEffect(() => {
    if (!selected) { setReplies([]); return; }
    let live = true;
    getDocs(query(collection(db, 'support_tickets', selected, 'messages'), orderBy('createdAt', 'asc')))
      .then(s => { if (live) setReplies(s.docs.map(d => ({ id: d.id, ...d.data() } as Reply))); })
      .catch(() => toast.error('Falha ao carregar histórico do ticket.'));
    return () => { live = false; };
  }, [selected]);
  const create = async () => {
    if (!subject.trim() || !companyId.trim()) { toast.error('Informe assunto e ID da empresa.'); return; }
    setBusy(true);
    try {
      const created = await addDoc(collection(db, 'support_tickets'), { subject: subject.trim().slice(0, 160), companyId: companyId.trim(), status: 'open', priority, assignedTo: '', createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
      setSubject(''); setCompanyId(''); setSelected(created.id);
      toast.success('Ticket gravado no Firestore.'); await refresh();
    } catch (e) { console.error(e); toast.error('Falha ao gravar ticket.'); } finally { setBusy(false); }
  };
  const change = async (fields: Record<string, string>) => {
    if (!selected) return;
    setBusy(true);
    try {
      await updateDoc(doc(db, 'support_tickets', selected), { ...fields, updatedAt: serverTimestamp() });
      setTickets(old => old.map(t => t.id === selected ? { ...t, ...fields } : t));
      toast.success('Ticket atualizado no Firestore.');
    } catch (e) { console.error(e); toast.error('Não foi possível atualizar o ticket.'); } finally { setBusy(false); }
  };
  const reply = async () => {
    if (!selected || !message.trim()) return;
    setBusy(true);
    try {
      await addDoc(collection(db, 'support_tickets', selected, 'messages'), { body: message.trim().slice(0, 4000), author: 'admin', createdAt: serverTimestamp() });
      await updateDoc(doc(db, 'support_tickets', selected), { updatedAt: serverTimestamp() });
      const snap = await getDocs(query(collection(db, 'support_tickets', selected, 'messages'), orderBy('createdAt', 'asc')));
      setReplies(snap.docs.map(d => ({ id: d.id, ...d.data() } as Reply)));
      setMessage(''); toast.success('Resposta registrada no histórico. Nenhuma notificação externa foi enviada.');
    } catch (e) { console.error(e); toast.error('Falha ao salvar resposta.'); } finally { setBusy(false); }
  };
  const current = tickets.find(t => t.id === selected);
  const filtered = tickets.filter(t => filter === 'all' || t.status === filter);
  const field = 'w-full rounded-lg bg-slate-900 border border-white/10 text-white p-2.5 text-sm';
  return <div className="space-y-5">
    <div><h2 className="text-2xl font-semibold text-white">Suporte Técnico Interno</h2><p className="text-slate-400 text-sm">Tickets e mensagens persistidos no Firestore. Notificações externas ainda não integradas.</p></div>
    <div className="rounded-xl border border-white/10 p-5 space-y-3"><h3 className="text-white font-semibold">Abrir ticket real</h3><div className="grid grid-cols-1 md:grid-cols-3 gap-3"><input aria-label="Assunto" className={field} placeholder="Assunto" value={subject} onChange={e => setSubject(e.target.value)} maxLength={160}/><input aria-label="ID da empresa" className={field} placeholder="ID da empresa no Firebase" value={companyId} onChange={e => setCompanyId(e.target.value)}/><select aria-label="Prioridade" className={field} value={priority} onChange={e => setPriority(e.target.value)}><option value="low">Baixa</option><option value="normal">Normal</option><option value="high">Alta</option><option value="urgent">Urgente</option></select></div><button disabled={busy} onClick={create} className="bg-indigo-600 text-white rounded-lg px-4 py-2 disabled:opacity-50">Criar ticket</button></div>
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5"><div className="rounded-xl border border-white/10 p-4 space-y-3"><div className="flex justify-between items-center gap-3"><h3 className="text-white font-semibold">Tickets ({filtered.length})</h3><div className="flex gap-2"><select aria-label="Filtrar tickets" className={field} value={filter} onChange={e => setFilter(e.target.value)}><option value="all">Todos</option><option value="open">Abertos</option><option value="in_progress">Em andamento</option><option value="resolved">Resolvidos</option><option value="closed">Fechados</option></select><button onClick={() => void refresh()} className="text-cyan-400 text-sm">Atualizar</button></div></div>{loading ? <p className="text-slate-400">Carregando...</p> : filtered.length === 0 ? <p className="text-slate-400 text-sm">Nenhum ticket encontrado.</p> : filtered.map(t => <button key={t.id} onClick={() => { setSelected(t.id); setAssignedTo(t.assignedTo || ''); }} className={'w-full text-left p-3 rounded-lg border '+(selected === t.id ? 'border-indigo-500 bg-indigo-500/10' : 'border-white/10')}><p className="text-white font-medium">{t.subject}</p><p className="text-slate-400 text-xs">Empresa: {t.companyId} · {t.status} · {t.priority}</p></button>)}</div>
    <div className="rounded-xl border border-white/10 p-4 space-y-3">{!current ? <p className="text-slate-400 text-sm">Selecione um ticket para ver histórico e ações.</p> : <><h3 className="text-white font-semibold">{current.subject}</h3><div className="flex gap-2"><select aria-label="Status" className={field} value={current.status} disabled={busy} onChange={e => void change({ status: e.target.value })}><option value="open">Aberto</option><option value="in_progress">Em andamento</option><option value="resolved">Resolvido</option><option value="closed">Fechado</option></select><select aria-label="Prioridade do ticket" className={field} value={current.priority} disabled={busy} onChange={e => void change({ priority: e.target.value })}><option value="low">Baixa</option><option value="normal">Normal</option><option value="high">Alta</option><option value="urgent">Urgente</option></select></div><div className="flex gap-2"><input className={field} placeholder="Responsável (identificador)" value={assignedTo} onChange={e => setAssignedTo(e.target.value)}/><button disabled={busy} onClick={() => void change({ assignedTo: assignedTo.trim() })} className="px-3 bg-indigo-600 text-white rounded">Atribuir</button></div><div className="max-h-64 overflow-y-auto space-y-2">{replies.length === 0 ? <p className="text-slate-500 text-sm">Nenhuma mensagem.</p> : replies.map(m => <div key={m.id} className="bg-white/5 rounded p-3"><p className="text-cyan-400 text-xs">{m.author}</p><p className="text-slate-200 text-sm whitespace-pre-wrap">{m.body}</p></div>)}</div><textarea aria-label="Resposta" className={field} rows={3} value={message} onChange={e => setMessage(e.target.value)} placeholder="Registrar resposta interna" maxLength={4000}/><button disabled={busy || !message.trim()} onClick={reply} className="bg-indigo-600 text-white rounded px-4 py-2 disabled:opacity-50">Salvar resposta</button></>}</div></div>
  </div>;
}
