import React, { useEffect, useState } from 'react';
import { useAuthStore } from '../store/auth';
import { auth } from '../lib/firebase';
import { toast } from 'sonner';
import { ArrowRight, Box, Calendar, Clock, GitBranch, Play, Plus, Smartphone, Zap, X, Filter } from 'lucide-react';
import { useNicheStore } from '../store/niche';
import { AnimatePresence, motion } from 'motion/react';

const INITIAL_FLOWS = [
  {
     id: '1',
     name: 'Recuperação de Churn',
     trigger: 'Cliente Inativo (30 dias)',
     condition: 'Qualquer',
     action: 'Message WPP: Saudade e Promo',
     status: 'active',
     stats: 142
  },
  {
     id: '2',
     name: 'Lembrete de Agendamento',
     trigger: 'Agenda (2h Antes)',
     condition: 'Status não for Cancelado',
     action: 'Message WPP: Confirmação',
     status: 'active',
     stats: 830
  },
  {
     id: '3',
     name: 'Boas Vindas (Novo Cliente)',
     trigger: 'PDV (Primeira Venda)',
     condition: 'Valor > 100',
     action: 'Message WPP: Avaliação',
     status: 'paused',
     stats: 0
  }
];

export default function Automations() {
  const { getConfig } = useNicheStore();
  const config = getConfig();
  
  const owner = useAuthStore(state => state.user);
  const [flows, setFlows] = useState<typeof INITIAL_FLOWS>([]);
  const [loadingFlows, setLoadingFlows] = useState(false);
  const [savingFlows, setSavingFlows] = useState(false);
  useEffect(() => {
    let alive = true;
    if (!owner?.companyId || !auth.currentUser) { setFlows([]); return; }
    setLoadingFlows(true);
    (async () => {
      try {
        const token = await auth.currentUser!.getIdToken();
        const result = await fetch('/api/automations/flows', { headers: { Authorization: 'Bearer ' + token } });
        if (!result.ok) throw new Error('Falha ao carregar automações do servidor');
        const payload = await result.json();
        if (alive) setFlows(payload.flows.map((f: any) => ({ ...f, status: 'paused', stats: 0 })));
      } catch {
        if (alive) { setFlows([]); toast.error('Não foi possível carregar automações. Nenhum dado local foi usado como substituto.'); }
      } finally { if (alive) setLoadingFlows(false); }
    })();
    return () => { alive = false; };
  }, [owner?.companyId, owner?.id]);
  const saveDrafts = async (next: typeof INITIAL_FLOWS): Promise<boolean> => {
    if (!owner?.companyId || !auth.currentUser) {
      toast.error('É necessário entrar na empresa para salvar automações.');
      return false;
    }
    setSavingFlows(true);
    try {
      const token = await auth.currentUser.getIdToken();
      const response = await fetch('/api/automations/flows', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
        body: JSON.stringify({ flows: next })
      });
      if (!response.ok) throw new Error('Persistência indisponível');
      const payload = await response.json();
      setFlows(payload.flows.map((f: any) => ({ ...f, status: 'paused', stats: 0 })));
      return true;
    } catch {
      toast.error('Falha ao salvar no servidor. As alterações não foram confirmadas.');
      return false;
    } finally { setSavingFlows(false); }
  };
  const [viewMode, setViewMode] = useState<'list' | 'builder'>('list');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newFlow, setNewFlow] = useState({ name: '', trigger: 'Agenda (Marcada)', condition: 'Qualquer', action: 'Message WPP: Promoção 10%' });
  const [builderNodes, setBuilderNodes] = useState<any[]>([]);
  const [builderFlowName, setBuilderFlowName] = useState('');
  const [editingFlowId, setEditingFlowId] = useState<string | null>(null);

  const openVisualBuilder = (flow?: typeof INITIAL_FLOWS[0]) => {
     if (flow) {
        setEditingFlowId(flow.id);
        setBuilderFlowName(flow.name);
        setBuilderNodes([
           { id: '1', type: 'trigger', label: flow.trigger },
           flow.condition && flow.condition !== 'Qualquer' && flow.condition !== 'Nenhum' ? { id: '2', type: 'condition', label: flow.condition } : null,
           { id: '3', type: 'action', label: flow.action },
        ].filter(Boolean));
     } else {
        setEditingFlowId(null);
        setBuilderFlowName('');
        setBuilderNodes([{ id: '1', type: 'trigger', label: 'Selecionar Gatilho' }]);
     }
     setViewMode('builder');
  };

  const saveVisualFlow = async () => {
      const toastId = toast.loading('Salvando rascunho do fluxo...');
      
      const triggerNode = builderNodes.find(n => n.type === 'trigger');
      const conditionNode = builderNodes.find(n => n.type === 'condition');
      const actionNode = builderNodes.find(n => n.type === 'action');

      if (!triggerNode || !actionNode || triggerNode.label === 'Selecionar Gatilho' || actionNode.label === 'Selecionar Ação') {
          toast.error('O fluxo precisa ter pelo menos um Gatilho e uma Ação.', { id: toastId });
          return;
      }

      {
          const saved = await saveDrafts([...(editingFlowId ? flows.filter(f => f.id !== editingFlowId) : flows), { 
              id: editingFlowId || crypto.randomUUID(), 
              name: builderFlowName || 'Novo Fluxo Visual', 
              trigger: triggerNode.label, 
              condition: conditionNode ? conditionNode.label : 'Qualquer', 
              action: actionNode.label, 
              status: 'paused', 
              stats: 0 
          }]);
          if (!saved) { toast.dismiss(toastId); return; }
          setViewMode('list');
          setEditingFlowId(null);
          toast.success('Rascunho visual salvo no servidor.', { id: toastId, description: 'O envio automático depende de um worker real.' });
      }
  };


  const handleCreateFlow = async (e: React.FormEvent) => {
    e.preventDefault();
    if(!newFlow.name) return;
    
    const toastId = toast.loading('Salvando rascunho...');
    {
      const saved = await saveDrafts([...flows, { id: crypto.randomUUID(), name: newFlow.name, trigger: newFlow.trigger, condition: newFlow.condition, action: newFlow.action, status: 'paused', stats: 0 }]);
      if (!saved) { toast.dismiss(toastId); return; }
      setIsModalOpen(false);
      setNewFlow({ name: '', trigger: 'Agenda (Marcada)', condition: 'Qualquer', action: 'Message WPP: Promoção 10%' });
      toast.success('Rascunho salvo.', { id: toastId, description: 'Execução automática não configurada.' });
    }
  };


  const removeDraft = async (id: string) => {
    if (await saveDrafts(flows.filter(f => f.id !== id))) toast.info('Rascunho excluído do servidor.');
  };

  const toggleStatus = (_id: string) => {
    toast.warning('Ainda não há worker conectado: os fluxos são apenas rascunhos.');
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#050B14] relative">
      <AnimatePresence>
        {isModalOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div
               initial={{ scale: 0.95, opacity: 0 }}
               animate={{ scale: 1, opacity: 1 }}
               exit={{ scale: 0.95, opacity: 0 }}
               className="bg-[#0C1627] border border-[#1A2C47] rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden"
            >
               <div className="p-6 border-b border-[#1A2C47] flex items-center justify-between bg-[#09111D]">
                 <h3 className="text-xl font-semibold text-white">Criar Rascunho de Automação</h3>
                 <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white p-2 rounded-lg hover:bg-white/5 transition-colors">
                   <X className="w-5 h-5" />
                 </button>
               </div>
               
               <form onSubmit={handleCreateFlow} id="new-flow-form" className="p-6 space-y-4">
                  <div>
                    <label className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-2 block">Nome da Automação</label>
                    <input 
                      type="text" 
                      value={newFlow.name}
                      onChange={(e) => setNewFlow({...newFlow, name: e.target.value})}
                      required
                      placeholder="Ex: Oferta Pós-Serviço"
                      className="w-full bg-[#09111D] border border-[#1A2C47] rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-purple-500 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-2 block">Gatilho (Trigger)</label>
                    <select 
                      value={newFlow.trigger}
                      onChange={(e) => setNewFlow({...newFlow, trigger: e.target.value})}
                      className="w-full bg-[#09111D] border border-[#1A2C47] rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-purple-500 transition-colors"
                    >
                       <option value="Cliente sem retorno 30 dias">Cliente sem retorno (30 dias)</option>
                       <option value="Cliente aniversário">Cliente aniversariante (Data aniversario)</option>
                       <option value="Após atendimento">Após atendimento finalizado (Pós-venda)</option>
                       <option value="Compra produto">Compra de produto específico</option>
                       <option value="Plano vencendo">Plano de recorrência vencendo</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-2 block">Condição (Se)</label>
                    <select 
                      value={newFlow.condition}
                      onChange={(e) => setNewFlow({...newFlow, condition: e.target.value})}
                      className="w-full bg-[#09111D] border border-[#1A2C47] rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-purple-500 transition-colors"
                    >
                       <option>Qualquer</option>
                       <option>Status = VIP</option>
                       <option>Frequência &gt; 5x</option>
                       <option>Ticket Médio &gt; 120</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-2 block">Ação (Event Task)</label>
                    <select 
                      value={newFlow.action}
                      onChange={(e) => setNewFlow({...newFlow, action: e.target.value})}
                      className="w-full bg-[#09111D] border border-[#1A2C47] rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-purple-500 transition-colors"
                    >
                       <option value="Enviar WhatsApp">Enviar WhatsApp inteligente</option>
                       <option value="Criar tarefa">Criar tarefa no CRM</option>
                       <option value="Gerar cupom">Gerar cupom de cashback</option>
                       <option value="Notificar funcionário">Notificar funcionário (Push)</option>
                    </select>
                  </div>
               </form>
               
               <div className="p-6 border-t border-[#1A2C47] flex gap-3 bg-[#09111D]">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-3 bg-transparent border border-[#1A2C47] text-slate-300 hover:bg-white/5 font-semibold rounded-xl transition-all">Cancelar</button>
                  <button type="submit" form="new-flow-form" className="flex-1 py-3 bg-purple-600 hover:bg-purple-500 text-white font-semibold rounded-xl transition-all shadow-[0_0_15px_rgba(147,51,234,0.3)]">Salvar Rascunho</button>
               </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex-none h-24 border-b border-[#1A2C47] px-8 flex items-center justify-between bg-[#0C1627] sticky top-0 z-20">
        <div>
          <h1 className="text-2xl font-display font-semibold text-white tracking-tight">Motor de Automações</h1>
          <p className="text-sm text-slate-400 mt-1">Rascunhos persistidos no servidor. Envio automático depende da homologação do provedor.</p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2 bg-gradient-to-r from-cyan-400 to-purple-500 hover:scale-105 transition-all text-black px-5 py-2.5 rounded-xl font-bold uppercase tracking-widest text-xs shadow-[0_0_15px_rgba(34,211,238,0.3)]">
          <Plus className="w-4 h-4" />
          Criar Rascunho
        </button>
      </div>

      <div className="flex-1 overflow-auto p-8">
        <div className="max-w-6xl mx-auto flex flex-col lg:flex-row gap-8">
           
           {/* SIDEBAR WIDGETS */}
           <div className="w-full lg:w-72 flex flex-col gap-6">
              <div className="glass-card p-6 border-[#1A2C47]">
                 <div className="w-10 h-10 bg-purple-500/20 rounded-xl flex items-center justify-center text-purple-400 mb-4">
                    <Zap className="w-5 h-5" />
                 </div>
                 <h3 className="text-lg font-semibold text-white mb-1">Eventos Ativos</h3>
                 <p className="text-sm text-slate-400 mb-4">Execuções externas aguardando integração homologada.</p>
                 <div className="text-3xl font-display font-bold text-white">0 <span className="text-sm text-purple-400 font-sans">execuções confirmadas</span></div>
              </div>

              <div className="glass-card p-6 border-[#1A2C47]">
                 <h4 className="font-semibold text-white mb-4">Triggers Disponíveis</h4>
                 <div className="space-y-3">
                    <div className="flex items-center gap-3 p-2 bg-black/20 rounded border border-white/5 opacity-70">
                       <Box className="w-4 h-4 text-blue-400" /> <span className="text-sm text-slate-300 font-medium">PDV (Nova Venda)</span>
                    </div>
                    <div className="flex items-center gap-3 p-2 bg-black/20 rounded border border-white/5 opacity-70">
                       <Calendar className="w-4 h-4 text-emerald-400" /> <span className="text-sm text-slate-300 font-medium">Agenda (Marcada)</span>
                    </div>
                    <div className="flex items-center gap-3 p-2 bg-black/20 rounded border border-white/5 opacity-70">
                       <Clock className="w-4 h-4 text-amber-400" /> <span className="text-sm text-slate-300 font-medium">Inatividade (Churn)</span>
                    </div>
                 </div>
              </div>
           </div>

           {/* CONTENT AREA */}
           <div className="flex-1 flex flex-col gap-4">
              {viewMode === 'list' ? (
                <>
                  {flows.map((flow) => (
                     <div key={flow.id} className="bg-[#0C1627] border border-[#1A2C47] rounded-2xl p-6 flex items-center justify-between group hover:border-purple-500/50 transition-colors cursor-pointer" onClick={() => toggleStatus(flow.id)}>
                        
                        <div className="flex-1 flex items-center gap-8">
                           <div className="flex flex-col">
                              <h3 className="text-white font-semibold text-lg">{flow.name}</h3>
                              <p className="text-xs text-slate-400 mt-1 flex items-center gap-1"><Play className="w-3 h-3 text-emerald-400" /> Rascunho · sem execuções</p>
                           </div>

                           <div className="flex flex-wrap items-center gap-2 bg-[#050B14] p-3 rounded-xl border border-white/5 px-4">
                               <div className="flex items-center gap-1.5 text-slate-300 text-xs font-medium bg-black/40 px-2 py-1 rounded">
                                  <span className="w-4 h-4 rounded-sm bg-slate-800 flex items-center justify-center border border-slate-700 text-[9px]">T</span> {flow.trigger}
                               </div>
                               {flow.condition && flow.condition !== 'Qualquer' && flow.condition !== 'Nenhum' && (
                                  <div className="flex items-center gap-1 opacity-80">
                                     <Filter className="w-3 h-3 text-cyan-500" />
                                     <div className="flex items-center gap-1.5 text-slate-300 text-xs font-medium bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 px-2 py-1 rounded shadow-[0_0_10px_rgba(6,182,212,0.1)]">
                                        Se: {flow.condition}
                                     </div>
                                  </div>
                               )}
                               <ArrowRight className="w-4 h-4 text-purple-500" />
                               <div className="flex items-center gap-1.5 text-slate-300 text-xs font-medium bg-black/40 px-2 py-1 rounded">
                                  <span className="w-4 h-4 rounded-sm bg-emerald-900/30 text-emerald-400 flex items-center justify-center border border-emerald-500/30"><Smartphone className="w-2 h-2" /></span> {flow.action}
                               </div>
                           </div>
                        </div>

                        <div className="flex items-center gap-4 ml-6">
                           <button onClick={(e) => { e.stopPropagation(); openVisualBuilder(flow); }} className="px-3 py-1.5 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/20 rounded-lg text-xs font-medium transition-colors">
                              Editar Visual
                           </button>
                           <button onClick={(e) => { e.stopPropagation(); removeDraft(flow.id); }} className="px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-300 border border-red-500/20 rounded-lg text-xs font-medium transition-colors">
                              Excluir
                           </button>
                           {flow.status === 'active' ? (
                              <div className="w-12 h-6 bg-emerald-500 rounded-full relative cursor-pointer flex items-center px-1 shadow-[0_0_10px_rgba(16,185,129,0.3)]">
                                 <div className="w-4 h-4 bg-white rounded-full absolute right-1 shadow" />
                              </div>
                           ) : (
                              <div className="w-12 h-6 bg-slate-700 rounded-full relative cursor-pointer flex items-center px-1">
                                 <div className="w-4 h-4 bg-slate-400 rounded-full absolute left-1 shadow" />
                              </div>
                           )}
                        </div>
                     </div>
                  ))}
                  
                  <div className="border border-dashed border-[#1A2C47] rounded-2xl p-8 flex flex-col items-center justify-center text-center mt-4">
                     <GitBranch className="w-10 h-10 text-slate-600 mb-4" />
                     <h4 className="text-white font-medium mb-1">Pipeline Visual Disponível</h4>
                     <p className="text-slate-500 text-sm mb-6">O construtor drag-and-drop foi liberado. Construa novos fluxos visualmente.</p>
                     <button onClick={() => openVisualBuilder()} className="px-6 py-2 bg-slate-800 hover:bg-slate-700 text-white font-medium rounded-lg transition-colors border border-slate-600">
                        Abrir Construtor Visual
                     </button>
                  </div>
                </>
              ) : (
                <div className="bg-[#0C1627] border border-[#1A2C47] rounded-2xl p-8 min-h-[500px] flex flex-col items-center justify-center relative overflow-hidden">
                   <div className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '24px 24px' }}></div>
                   
                   <div className="w-full max-w-md z-10 flex flex-col items-center">
                      <div className="w-full flex justify-between items-center mb-10 bg-black/40 p-3 rounded-xl border border-white/10 backdrop-blur-sm">
                         <input 
                            type="text" 
                            className="bg-transparent border-none text-white font-medium outline-none" 
                            value={builderFlowName} 
                            onChange={(e) => setBuilderFlowName(e.target.value)} 
                            placeholder="Nome do Fluxo Visual..." 
                         />
                         <div className="flex gap-2">
                            <button onClick={() => setViewMode('list')} className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded text-xs transition-colors">Voltar</button>
                            <button onClick={saveVisualFlow} className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded text-xs transition-colors shadow">Salvar</button>
                         </div>
                      </div>

                      {/* Visual Pipeline Nodes */}
                      <div className="w-full flex flex-col items-center space-y-6">
                         {builderNodes.map((node, index) => (
                            <React.Fragment key={index}>
                               {index > 0 && (
                                  <div className="w-0.5 h-6 bg-slate-600"></div>
                               )}
                               <motion.div drag dragMomentum={false} dragConstraints={{ top: 0, bottom: 0, left: 0, right: 0 }} className={`w-full p-4 rounded-xl border flex flex-col gap-2 cursor-grab active:cursor-grabbing backdrop-blur-sm ${
                                  node.type === 'trigger' ? 'bg-purple-900/20 border-purple-500/50' : 
                                  node.type === 'condition' ? 'bg-amber-900/20 border-amber-500/50' : 
                                  'bg-emerald-900/20 border-emerald-500/50'
                               }`}>
                                  <div className="flex items-center justify-between">
                                     <div className="flex items-center gap-2">
                                        {node.type === 'trigger' && <Zap className="w-4 h-4 text-purple-400" />}
                                        {node.type === 'condition' && <Filter className="w-4 h-4 text-amber-400" />}
                                        {node.type === 'action' && <Play className="w-4 h-4 text-emerald-400" />}
                                        <span className={`text-xs font-bold uppercase tracking-widest ${
                                           node.type === 'trigger' ? 'text-purple-400' :
                                           node.type === 'condition' ? 'text-amber-400' :
                                           'text-emerald-400'
                                        }`}>
                                           {node.type === 'trigger' ? 'Quando' : node.type === 'condition' ? 'Se' : 'Então'}
                                        </span>
                                     </div>
                                  </div>
                                  <select 
                                     value={node.label}
                                     onChange={(e) => {
                                        const newNodes = [...builderNodes];
                                        newNodes[index] = { ...node, label: e.target.value };
                                        setBuilderNodes(newNodes);
                                     }}
                                     className="bg-black/30 border border-white/10 rounded-lg p-2 text-sm text-white outline-none w-full appearance-none select-none focus:border-blue-500 transition-colors"
                                  >
                                     {node.type === 'trigger' && (
                                        <>
                                           <option>Selecionar Gatilho</option>
                                           <option value="Cliente sem retorno 30 dias">Cliente sem retorno (30 dias)</option>
                                           <option value="Cliente aniversário">Cliente aniversário</option>
                                           <option value="Após atendimento">Após atendimento</option>
                                           <option value="Compra produto">Compra de produto</option>
                                           <option value="Plano vencendo">Plano vencendo</option>
                                        </>
                                     )}
                                     {node.type === 'condition' && (
                                        <>
                                           <option>Qualquer</option>
                                           <option>Status = VIP</option>
                                           <option>Frequência &gt; 5x</option>
                                        </>
                                     )}
                                     {node.type === 'action' && (
                                        <>
                                           <option>Selecionar Ação</option>
                                           <option value="Enviar WhatsApp">Enviar WhatsApp</option>
                                           <option value="Criar tarefa">Criar tarefa CRM</option>
                                           <option value="Gerar cupom">Gerar cupom</option>
                                           <option value="Notificar funcionário">Notificar funcionário</option>
                                        </>
                                     )}
                                  </select>
                               </motion.div>
                            </React.Fragment>
                         ))}

                         <div className="w-0.5 h-6 bg-slate-600"></div>
                         
                         <button 
                            onClick={() => {
                               // simple add logic (forces action if none, else condition)
                               if (!builderNodes.find(n => n.type === 'action')) {
                                  setBuilderNodes([...builderNodes, { id: '3', type: 'action', label: 'Selecionar Ação' }]);
                               } else if (!builderNodes.find(n => n.type === 'condition')) {
                                  // insert condition before action
                                  const newNodes = [...builderNodes];
                                  const actionIdx = newNodes.findIndex(n => n.type === 'action');
                                  newNodes.splice(actionIdx, 0, { id: '2', type: 'condition', label: 'Qualquer' });
                                  setBuilderNodes(newNodes);
                               }
                            }}
                            className="bg-slate-800 hover:bg-slate-700 text-slate-300 w-10 h-10 rounded-full flex items-center justify-center border border-slate-600 transition-colors"
                         >
                            <Plus className="w-5 h-5" />
                         </button>
                      </div>
                   </div>
                </div>
              )}
           </div>
           
        </div>
      </div>
    </div>
  );
}
