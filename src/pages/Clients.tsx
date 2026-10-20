import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useNicheStore } from '../store/niche';
import { useClientStore, Client } from '../store/clients';
import { Search, Plus, MoreVertical, Phone, Mail, MapPin, X, Calendar, ShoppingBag, Sparkles, AlertTriangle, MessageCircle, Star, Clock, Gift, Crown, Activity } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuthStore } from '../store/auth';

const mockHistory = [
  { id: 'h1', date: '2025-05-18', type: 'appointment', details: 'Corte Degradê + Barba', value: 80.00 },
  { id: 'h2', date: '2025-05-02', type: 'purchase', details: 'Pomada Modeladora', value: 45.00 },
  { id: 'h3', date: '2025-04-15', type: 'appointment', details: 'Corte Social', value: 40.00 },
];

export default function Clients() {
  const { getConfig } = useNicheStore();
  const config = getConfig();
  const isDemo = useAuthStore(state => state.user?.isDemo === true);
  const { clients, addClient, updateClient } = useClientStore();
  const [searchParams] = useSearchParams();
  const queryParam = searchParams.get('q') || '';
  const actionParam = searchParams.get('action');
  
  const [search, setSearch] = useState(queryParam);
  const [filter, setFilter] = useState('all'); // all, active, inactive, vip
  const [selectedClient, setSelectedClient] = useState<any | null>(null);
  const [isNewClientModalOpen, setIsNewClientModalOpen] = useState(actionParam === 'new');
  const [isEditClientModalOpen, setIsEditClientModalOpen] = useState(false);
  const [newClient, setNewClient] = useState({ name: '', email: '', phone: '', location: '', status: 'active', tags: [] as string[], birthday: '' });
  const [editingClient, setEditingClient] = useState({ id: '', name: '', email: '', phone: '', location: '', status: 'active', tags: [] as string[], birthday: '' });

  useEffect(() => {
    if (queryParam) {
      setSearch(queryParam);
    }
    if (actionParam === 'new') {
      setIsNewClientModalOpen(true);
    }
  }, [queryParam, actionParam]);

  const [newsIndex, setNewsIndex] = useState(0);
  const breakingNews = isDemo ? [
     "3 clientes aguardando na recepção (Tempo Médio: 12 min)",
     "Maria Souza (VIP) confirmou agendamento para 15:30",
     "João Pedro cancelou. Horário de 14:00 da Sílvia liberou!",
     "Apenas mais 1 selo para Beatriz ganhar Fidelidade!"
  ] : ['Cadastre clientes e agendamentos para acompanhar sua operação.'];

  useEffect(() => {
     const interval = setInterval(() => {
        setNewsIndex(i => (i + 1) % breakingNews.length);
     }, 4000);
     return () => clearInterval(interval);
  }, [breakingNews.length]);

  const handleAddClient = () => {
    if (!newClient.name || (!newClient.email && !newClient.phone)) return;
    addClient({ ...newClient, id: Date.now().toString(), lastVisit: '---', aiScore: 'REGULAR', status: newClient.status as any });
    setIsNewClientModalOpen(false);
    setNewClient({ name: '', email: '', phone: '', location: '', status: 'active', tags: [], birthday: '' });
  };

  const handleOpenEditModal = (client: any) => {
    setEditingClient(client);
    setIsEditClientModalOpen(true);
  };

  const handleSaveEditClient = () => {
    if (!editingClient.name || (!editingClient.email && !editingClient.phone)) return;
    updateClient(editingClient.id, editingClient as any);
    setIsEditClientModalOpen(false);
    if (selectedClient && selectedClient.id === editingClient.id) {
       setSelectedClient({ ...selectedClient, ...editingClient });
    }
  };

  const filteredClients = clients.map((c: any) => {
    // Motor IA: Churn e Score Dinâmico
    let computedScoreStr = c.aiScore;
    let computedScoreNum = 0;
    
    if (c.lastVisit && c.lastVisit !== '---') {
       const daysSinceVisit = Math.floor((new Date().getTime() - new Date(c.lastVisit).getTime()) / (1000 * 60 * 60 * 24));
       if (daysSinceVisit > 30) computedScoreNum += 40;
       if (daysSinceVisit > 15) computedScoreNum += 20;
       if (c.status === 'inactive') computedScoreNum += 40;
       
       if (computedScoreNum >= 60) computedScoreStr = 'RISK';
       else if (computedScoreNum >= 20 || c.tags.includes('vip')) computedScoreStr = 'VIP';
       else computedScoreStr = 'REGULAR';
    }

    return { ...c, computedScoreNum, computedScoreStr };
  }).filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(search.toLowerCase()) || c.email.toLowerCase().includes(search.toLowerCase()) || c.phone.toLowerCase().includes(search.toLowerCase());
    let matchesFilter = true;
    if (filter === 'active') matchesFilter = c.status === 'active';
    if (filter === 'inactive') matchesFilter = c.status === 'inactive';
    if (filter === 'vip') matchesFilter = c.tags.includes('vip');
    if (filter === 'mensalista') matchesFilter = c.tags.includes('mensalista');
    if (filter === 'dia_da_beleza') matchesFilter = c.tags.includes('dia_da_beleza');
    if (filter === 'birthday') {
      const currentMonth = new Date().getMonth() + 1;
      const bMonth = c.birthday ? parseInt(c.birthday.split('-')[1]) : -1;
      matchesFilter = bMonth === currentMonth;
    }
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="flex flex-col gap-6 h-full relative">
       
       {/* NEW CLIENT MODAL */}
       <AnimatePresence>
          {isNewClientModalOpen && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
            >
               <motion.div 
                 initial={{ scale: 0.9, opacity: 0 }}
                 animate={{ scale: 1, opacity: 1 }}
                 exit={{ scale: 0.9, opacity: 0 }}
                 className="bg-[#0C1627] border border-[#1A2C47] rounded-3xl w-full max-w-lg flex flex-col shadow-[0_0_50px_rgba(0,0,0,0.5)] overflow-hidden"
               >
                  <div className="p-6 border-b border-[#1A2C47] flex items-center justify-between bg-[#09111D]">
                     <h2 className="text-xl font-semibold text-white">Novo {config.terminology.client}</h2>
                     <button 
                       onClick={() => setIsNewClientModalOpen(false)}
                       className="p-2 bg-[#1A2C47] hover:bg-[#253B5C] rounded-full text-slate-300 transition-colors"
                     >
                       <X className="w-5 h-5" />
                     </button>
                  </div>
                  
                  <div className="p-6 space-y-4">
                     <div>
                        <label className="text-[10px] uppercase font-semibold text-slate-500 tracking-widest block mb-2">Nome Completo *</label>
                        <input 
                          type="text" 
                          value={newClient.name}
                          onChange={(e) => setNewClient({...newClient, name: e.target.value})}
                          placeholder="Ex: João da Silva"
                          className="w-full bg-[#09111D] border border-[#1A2C47] rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-blue-500 transition-colors"
                        />
                     </div>
                     <div className="grid grid-cols-2 gap-4">
                        <div>
                           <label className="text-[10px] uppercase font-semibold text-slate-500 tracking-widest block mb-2">Celular / WhatsApp *</label>
                           <input 
                             type="text" 
                             value={newClient.phone}
                             onChange={(e) => setNewClient({...newClient, phone: e.target.value})}
                             placeholder="(11) 99999-9999"
                             className="w-full bg-[#09111D] border border-[#1A2C47] rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-blue-500 transition-colors"
                           />
                        </div>
                        <div>
                           <label className="text-[10px] uppercase font-semibold text-slate-500 tracking-widest block mb-2">Data de Nascimento</label>
                           <input 
                             type="date" 
                             value={newClient.birthday}
                             onChange={(e) => setNewClient({...newClient, birthday: e.target.value})}
                             className="w-full bg-[#09111D] border border-[#1A2C47] rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-blue-500 transition-colors"
                           />
                        </div>
                     </div>
                     <div>
                        <label className="text-[10px] uppercase font-semibold text-slate-500 tracking-widest block mb-2">E-mail</label>
                        <input 
                          type="email" 
                          value={newClient.email}
                          onChange={(e) => setNewClient({...newClient, email: e.target.value})}
                          placeholder="Ex: joao@email.com"
                          className="w-full bg-[#09111D] border border-[#1A2C47] rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-blue-500 transition-colors"
                        />
                     </div>
                     <div>
                        <label className="text-[10px] uppercase font-semibold text-slate-500 tracking-widest block mb-2">Endereço</label>
                        <input 
                          type="text" 
                          value={newClient.location}
                          onChange={(e) => setNewClient({...newClient, location: e.target.value})}
                          placeholder="Ex: Pinheiros, SP"
                          className="w-full bg-[#09111D] border border-[#1A2C47] rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-blue-500 transition-colors"
                        />
                     </div>
                  </div>

                  <div className="p-6 border-t border-[#1A2C47] bg-[#09111D] flex gap-3">
                     <button 
                       onClick={() => setIsNewClientModalOpen(false)}
                       className="flex-1 py-3 bg-transparent border border-[#1A2C47] text-slate-300 hover:bg-white/5 font-semibold rounded-xl transition-all"
                     >
                       Cancelar
                     </button>
                     <button 
                       onClick={handleAddClient}
                       className="flex-1 py-3 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl transition-all shadow-[0_0_15px_rgba(37,99,235,0.3)]"
                     >
                       Salvar Cliente
                     </button>
                  </div>
               </motion.div>
            </motion.div>
          )}
       </AnimatePresence>

       {/* EDIT CLIENT MODAL */}
       <AnimatePresence>
          {isEditClientModalOpen && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
            >
               <motion.div 
                 initial={{ scale: 0.9, opacity: 0 }}
                 animate={{ scale: 1, opacity: 1 }}
                 exit={{ scale: 0.9, opacity: 0 }}
                 className="bg-[#0C1627] border border-[#1A2C47] rounded-3xl w-full max-w-lg flex flex-col shadow-[0_0_50px_rgba(0,0,0,0.5)] overflow-hidden"
               >
                  <div className="p-6 border-b border-[#1A2C47] flex items-center justify-between bg-[#09111D]">
                     <h2 className="text-xl font-semibold text-white">Editar {config.terminology.client}</h2>
                     <button 
                       onClick={() => setIsEditClientModalOpen(false)}
                       className="p-2 bg-[#1A2C47] hover:bg-[#253B5C] rounded-full text-slate-300 transition-colors"
                     >
                       <X className="w-5 h-5" />
                     </button>
                  </div>
                  
                  <div className="p-6 space-y-4">
                     <div>
                        <label className="text-[10px] uppercase font-semibold text-slate-500 tracking-widest block mb-2">Nome Completo *</label>
                        <input 
                          type="text" 
                          value={editingClient.name}
                          onChange={(e) => setEditingClient({...editingClient, name: e.target.value})}
                          placeholder="Ex: João da Silva"
                          className="w-full bg-[#09111D] border border-[#1A2C47] rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-blue-500 transition-colors"
                        />
                     </div>
                     <div className="grid grid-cols-2 gap-4">
                        <div>
                           <label className="text-[10px] uppercase font-semibold text-slate-500 tracking-widest block mb-2">Celular / WhatsApp *</label>
                           <input 
                             type="text" 
                             value={editingClient.phone}
                             onChange={(e) => setEditingClient({...editingClient, phone: e.target.value})}
                             placeholder="(11) 99999-9999"
                             className="w-full bg-[#09111D] border border-[#1A2C47] rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-blue-500 transition-colors"
                           />
                        </div>
                        <div>
                           <label className="text-[10px] uppercase font-semibold text-slate-500 tracking-widest block mb-2">Data de Nascimento</label>
                           <input 
                             type="date" 
                             value={editingClient.birthday}
                             onChange={(e) => setEditingClient({...editingClient, birthday: e.target.value})}
                             className="w-full bg-[#09111D] border border-[#1A2C47] rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-blue-500 transition-colors"
                           />
                        </div>
                     </div>
                     <div>
                        <label className="text-[10px] uppercase font-semibold text-slate-500 tracking-widest block mb-2">E-mail</label>
                        <input 
                          type="email" 
                          value={editingClient.email}
                          onChange={(e) => setEditingClient({...editingClient, email: e.target.value})}
                          placeholder="Ex: joao@email.com"
                          className="w-full bg-[#09111D] border border-[#1A2C47] rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-blue-500 transition-colors"
                        />
                     </div>
                     <div>
                        <label className="text-[10px] uppercase font-semibold text-slate-500 tracking-widest block mb-2">Endereço</label>
                        <input 
                          type="text" 
                          value={editingClient.location}
                          onChange={(e) => setEditingClient({...editingClient, location: e.target.value})}
                          placeholder="Ex: Pinheiros, SP"
                          className="w-full bg-[#09111D] border border-[#1A2C47] rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-blue-500 transition-colors"
                        />
                     </div>
                  </div>

                  <div className="p-6 border-t border-[#1A2C47] bg-[#09111D] flex gap-3">
                     <button 
                       onClick={() => setIsEditClientModalOpen(false)}
                       className="flex-1 py-3 bg-transparent border border-[#1A2C47] text-slate-300 hover:bg-white/5 font-semibold rounded-xl transition-all"
                     >
                       Cancelar
                     </button>
                     <button 
                       onClick={handleSaveEditClient}
                       className="flex-1 py-3 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl transition-all shadow-[0_0_15px_rgba(37,99,235,0.3)]"
                     >
                       Salvar Alterações
                     </button>
                  </div>
               </motion.div>
            </motion.div>
          )}
       </AnimatePresence>

       {/* CLIENT PROFILE / HISTORY MODAL */}
       <AnimatePresence>
          {selectedClient && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
            >
               <motion.div 
                 initial={{ scale: 0.9, opacity: 0 }}
                 animate={{ scale: 1, opacity: 1 }}
                 exit={{ scale: 0.9, opacity: 0 }}
                 className="bg-[#0C1627] border border-[#1A2C47] rounded-3xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-[0_0_50px_rgba(0,0,0,0.5)] overflow-hidden"
               >
                  <div className="p-6 border-b border-[#1A2C47] flex items-center justify-between bg-[#09111D]">
                     <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-full bg-blue-500/20 border-2 border-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.3)] flex items-center justify-center text-blue-400 text-xl font-bold">
                          {selectedClient.name.charAt(0)}
                        </div>
                        <div>
                          <h2 className="text-xl font-semibold text-white">{selectedClient.name}</h2>
                          <div className="text-sm text-slate-400 flex items-center gap-3 mt-1">
                            <span className="flex items-center gap-1"><Phone className="w-3 h-3" /> {selectedClient.phone}</span>
                            <span className="flex items-center gap-1"><Mail className="w-3 h-3" /> {selectedClient.email}</span>
                          </div>
                        </div>
                     </div>
                     <div className="flex items-center gap-2">
                       <button 
                         onClick={() => handleOpenEditModal(selectedClient)}
                         className="px-3 py-1.5 bg-[#1A2C47] hover:bg-[#253B5C] rounded-lg text-slate-300 transition-colors text-sm font-semibold"
                       >
                         Editar
                       </button>
                       <button 
                         onClick={() => setSelectedClient(null)}
                         className="p-2 bg-[#1A2C47] hover:bg-[#253B5C] rounded-full text-slate-300 transition-colors"
                       >
                         <X className="w-5 h-5" />
                       </button>
                     </div>
                  </div>
                  
                  <div className="flex-1 overflow-y-auto p-6 space-y-6">
                     {isDemo && <div className="bg-[#1A2C47]/20 border border-[#1A2C47] rounded-xl p-6">
                        <div className="flex items-center gap-2 mb-4">
                           <Sparkles className="w-5 h-5 text-indigo-400" />
                           <h3 className="text-lg font-semibold text-white">Score de Risco de Churn (IA)</h3>
                        </div>
                        {(() => {
                           const daysSinceLastVisit = 45; 
                           const purchases = mockHistory.length;
                           const isVIP = selectedClient?.tags?.includes('vip');
                           
                           let riskScore = (daysSinceLastVisit * 1.5) - (purchases * 5);
                           if (isVIP) riskScore -= 20;
                           if (selectedClient?.tags?.includes('mensalista')) riskScore -= 30;
                           if (riskScore < 0) riskScore = 0;
                           if (riskScore > 100) riskScore = 100;
                           
                           let riskLevel = 'Baixo';
                           let riskColor = 'text-emerald-400';
                           let riskBg = 'bg-emerald-500/10 border-emerald-500/20';
                           
                           if (riskScore >= 70) {
                              riskLevel = 'Alto';
                              riskColor = 'text-red-400';
                              riskBg = 'bg-red-500/10 border-red-500/20';
                           } else if (riskScore >= 40) {
                              riskLevel = 'Médio';
                              riskColor = 'text-yellow-400';
                              riskBg = 'bg-yellow-500/10 border-yellow-500/20';
                           }

                           return (
                              <div className="flex items-center justify-between">
                                 <div>
                                    <div className="text-sm text-slate-400 mb-1">Status de Retenção</div>
                                    <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border ${riskBg} ${riskColor} text-xs font-bold uppercase tracking-widest`}>
                                       {riskLevel === 'Alto' && <AlertTriangle className="w-3.5 h-3.5" />}
                                       {riskLevel} Risco
                                    </div>
                                    <div className="text-xs text-slate-500 mt-2">
                                       Fatores: {daysSinceLastVisit} dias ausente, {purchases} compras totais{isVIP ? ', Cliente VIP' : ''}.
                                    </div>
                                 </div>
                                 <div className="text-center">
                                    <div className="text-3xl font-bold tracking-tight text-white mb-0.5">{Math.round(riskScore)}<span className="text-lg text-slate-500">%</span></div>
                                    <div className="text-[10px] uppercase font-bold tracking-widest text-slate-500">Probabilidade de Churn</div>
                                 </div>
                              </div>
                           );
                        })()}
                     </div>}

                     <div>
                        <h3 className="text-lg font-semibold text-white mb-4">Histórico Recente</h3>
                        
                        <div className="space-y-4">
                        {(isDemo ? mockHistory : []).map(item => (
                          <div key={item.id} className="bg-[#09111D] border border-[#1A2C47] rounded-xl p-4 flex items-center justify-between">
                             <div className="flex items-center gap-4">
                                <div className={`p-3 rounded-lg ${item.type === 'appointment' ? 'bg-cyan-500/10 text-cyan-400' : 'bg-purple-500/10 text-purple-400'}`}>
                                  {item.type === 'appointment' ? <Calendar className="w-5 h-5" /> : <ShoppingBag className="w-5 h-5" />}
                                </div>
                                <div>
                                   <div className="text-white font-medium">{item.details}</div>
                                   <div className="text-xs text-slate-400 mt-1">{item.date} • {item.type === 'appointment' ? 'Agendamento' : 'Compra'}</div>
                                </div>
                             </div>
                             <div className="text-lg font-semibold text-blue-400">
                                R$ {item.value.toFixed(2)}
                             </div>
                          </div>
                        ))}
                     </div>
                  </div>
                  </div>
               </motion.div>
            </motion.div>
          )}
       </AnimatePresence>

       <div className="flex justify-between items-center bg-[#0C1627] p-4 rounded-2xl border border-[#1A2C47]">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">{config.terminology.client}s</h1>
            <p className="text-slate-400 text-sm">Gerencie seus {config.terminology.client.toLowerCase()}s e histórico</p>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-2 bg-[#09111D] border border-blue-500/20 px-4 py-2 rounded-lg max-w-[300px] overflow-hidden relative">
               <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
               <AnimatePresence mode="popLayout">
                  <motion.span 
                    key={newsIndex}
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: -20, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="text-xs text-blue-400 font-medium truncate"
                  >
                     {breakingNews[newsIndex]}
                  </motion.span>
               </AnimatePresence>
            </div>

            <button 
              onClick={() => setIsNewClientModalOpen(true)}
              className="px-4 py-2 bg-blue-500 hover:bg-blue-400 text-black font-semibold uppercase tracking-wider text-xs rounded-lg transition shadow-[0_0_10px_rgba(59,130,246,0.4)] flex items-center gap-2 shrink-0"
            >
              <Plus className="w-4 h-4" />
              Novo {config.terminology.client}
            </button>
          </div>
       </div>

       <div className="flex flex-col sm:flex-row gap-4 items-center">
          <div className="relative flex-1 w-full">
             <input 
               type="text" 
               placeholder="Buscar por nome, e-mail ou telefone..." 
               value={search}
               onChange={e => setSearch(e.target.value)}
               className="w-full bg-[#0C1627] border border-[#1A2C47] rounded-xl py-3 px-10 text-sm focus:outline-none focus:border-blue-500/50 transition-all text-white placeholder-gray-500"
             />
             <Search className="absolute left-3 top-3.5 text-slate-500 w-4 h-4" />
          </div>
          <div className="flex gap-2 w-full sm:w-auto overflow-x-auto pb-2 sm:pb-0 scrollbar-hide">
            <button onClick={() => setFilter('all')} className={`px-4 py-3 rounded-xl border text-sm font-semibold transition-all whitespace-nowrap ${filter === 'all' ? 'bg-blue-500/10 border-blue-500/50 text-blue-400' : 'bg-[#0C1627] border-[#1A2C47] text-slate-400 hover:bg-[#182B4A]'}`}>Todos</button>
            <button onClick={() => setFilter('active')} className={`px-4 py-3 rounded-xl border text-sm font-semibold transition-all whitespace-nowrap ${filter === 'active' ? 'bg-blue-500/10 border-blue-500/50 text-blue-400' : 'bg-[#0C1627] border-[#1A2C47] text-slate-400 hover:bg-[#182B4A]'}`}>Ativos</button>
            <button onClick={() => setFilter('vip')} className={`px-4 py-3 rounded-xl border text-sm font-semibold transition-all whitespace-nowrap ${filter === 'vip' ? 'bg-blue-500/10 border-blue-500/50 text-blue-400' : 'bg-[#0C1627] border-[#1A2C47] text-slate-400 hover:bg-[#182B4A]'}`}>VIPs</button>
            <button onClick={() => setFilter('mensalista')} className={`px-4 py-3 rounded-xl border text-sm font-semibold transition-all whitespace-nowrap ${filter === 'mensalista' ? 'bg-blue-500/10 border-blue-500/50 text-blue-400' : 'bg-[#0C1627] border-[#1A2C47] text-slate-400 hover:bg-[#182B4A]'}`}>Mensalistas</button>
            <button onClick={() => setFilter('birthday')} className={`px-4 py-3 rounded-xl border text-sm font-semibold transition-all whitespace-nowrap ${filter === 'birthday' ? 'bg-blue-500/10 border-blue-500/50 text-blue-400' : 'bg-[#0C1627] border-[#1A2C47] text-slate-400 hover:bg-[#182B4A]'}`}>Aniversariantes</button>
            <button onClick={() => setFilter('dia_da_beleza')} className={`px-4 py-3 rounded-xl border text-sm font-semibold transition-all whitespace-nowrap ${filter === 'dia_da_beleza' ? 'bg-blue-500/10 border-blue-500/50 text-blue-400' : 'bg-[#0C1627] border-[#1A2C47] text-slate-400 hover:bg-[#182B4A]'}`}>Dia da Beleza</button>
          </div>
       </div>

       <div className="flex-1 overflow-y-auto w-full">
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-8">
               {filteredClients.map((client) => (
                 <div
                   key={client.id}
                   className="bg-[#0C1627] border border-[#1A2C47] rounded-2xl p-5 hover:border-blue-500/30 transition-all duration-200 hover:-translate-y-1 hover:shadow-lg group"
                 >
                   <div className="flex justify-between items-start mb-4">
                     <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-white/10 border border-[#253B5C] flex items-center justify-center text-white font-semibold">
                          {client.name.charAt(0)}
                        </div>
                        <div>
                          <h3 className="font-semibold text-white group-hover:text-blue-400 transition-colors">{client.name}</h3>
                          <div className="flex gap-2 items-center mt-1">
                            {client.status === 'active' ? (
                               <div className="group/tag relative flex items-center">
                                 <span className="flex items-center gap-1 text-[10px] uppercase font-bold tracking-wider text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20 cursor-default">
                                   <Activity className="w-3 h-3" /> Ativo
                                 </span>
                                 <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max px-3 py-1.5 bg-[#0C1627] border border-[#1A2C47] text-slate-300 text-xs rounded-lg opacity-0 group-hover/tag:opacity-100 transition-opacity pointer-events-none z-50 shadow-xl whitespace-nowrap">
                                    Cliente prestando serviços regularmente
                                 </div>
                               </div>
                            ) : (
                               <div className="group/tag relative flex items-center">
                                 <span className="flex items-center gap-1 text-[10px] uppercase font-bold tracking-wider text-slate-400 bg-slate-500/10 px-2 py-0.5 rounded border border-slate-500/20 cursor-default">
                                   Inativo
                                 </span>
                                 <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max px-3 py-1.5 bg-[#0C1627] border border-[#1A2C47] text-slate-300 text-xs rounded-lg opacity-0 group-hover/tag:opacity-100 transition-opacity pointer-events-none z-50 shadow-xl whitespace-nowrap">
                                    Nenhuma visita nos últimos meses
                                 </div>
                               </div>
                            )}
                            {client.tags.includes('vip') && (
                               <div className="group/tag relative flex items-center">
                                 <span className="flex items-center gap-1 text-[10px] uppercase font-bold tracking-wider text-yellow-400 bg-yellow-400/10 px-2 py-0.5 rounded border border-yellow-500/20 cursor-default shadow-[0_0_15px_rgba(250,204,21,0.15)]">
                                   <Crown className="w-3 h-3" /> VIP
                                 </span>
                                 <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max px-3 py-1.5 bg-[#0C1627] border border-yellow-500/30 text-yellow-400 text-xs rounded-lg opacity-0 group-hover/tag:opacity-100 transition-opacity pointer-events-none z-50 shadow-xl whitespace-nowrap">
                                   Cliente de alto valor. Prioridade máxima!
                                 </div>
                               </div>
                            )}
                            {client.tags.includes('mensalista') && (
                               <div className="group/tag relative flex items-center">
                                 <span className="flex items-center gap-1 text-[10px] uppercase font-bold tracking-wider text-purple-400 bg-purple-400/10 px-2 py-0.5 rounded border border-purple-500/20 cursor-default shadow-[0_0_15px_rgba(168,85,247,0.15)]">
                                   <Clock className="w-3 h-3" /> Mensalista
                                 </span>
                                 <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max px-3 py-1.5 bg-[#0C1627] border border-purple-500/30 text-purple-400 text-xs rounded-lg opacity-0 group-hover/tag:opacity-100 transition-opacity pointer-events-none z-50 shadow-xl whitespace-nowrap">
                                   Plano mensal ativo. Serviços pré-pagos.
                                 </div>
                               </div>
                            )}
                            {client.tags.includes('dia_da_beleza') && (
                               <div className="group/tag relative flex items-center">
                                 <span className="flex items-center gap-1 text-[10px] uppercase font-bold tracking-wider text-pink-400 bg-pink-400/10 px-2 py-0.5 rounded border border-pink-500/20 cursor-default shadow-[0_0_15px_rgba(236,72,153,0.15)]">
                                   <Star className="w-3 h-3" /> Dia da Beleza
                                 </span>
                                 <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max px-3 py-1.5 bg-[#0C1627] border border-pink-500/30 text-pink-400 text-xs rounded-lg opacity-0 group-hover/tag:opacity-100 transition-opacity pointer-events-none z-50 shadow-xl whitespace-nowrap">
                                   Inscrita no evento &quot;Dia da Beleza&quot;.
                                 </div>
                               </div>
                            )}
                            {client.birthday && parseInt(client.birthday.split('-')[1]) === new Date().getMonth() + 1 && (
                               <div className="group/tag relative flex items-center">
                                 <span className="flex items-center gap-1 text-[10px] uppercase font-bold tracking-wider text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded border border-emerald-500/20 cursor-default shadow-[0_0_15px_rgba(52,211,153,0.15)]">
                                   <Gift className="w-3 h-3" /> Aniversariante
                                 </span>
                                 <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max px-3 py-1.5 bg-[#0C1627] border border-emerald-500/30 text-emerald-400 text-xs rounded-lg opacity-0 group-hover/tag:opacity-100 transition-opacity pointer-events-none z-50 shadow-xl whitespace-nowrap">
                                   Faz aniversário neste mês!
                                 </div>
                               </div>
                            )}
                          </div>
                        </div>
                     </div>
                     <div className="flex items-center gap-2">
                       <button 
                         onClick={(e) => {
                           e.stopPropagation();
                           if (client.phone) {
                             window.open(`https://wa.me/55${client.phone.replace(/\\D/g, '')}`, '_blank');
                           }
                         }}
                         className="text-green-500 hover:text-green-400 bg-green-500/10 hover:bg-green-500/20 p-1.5 rounded-lg transition-colors border border-green-500/20"
                         title="Enviar WhatsApp"
                       >
                         <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/></svg>
                       </button>
                       <button className="text-slate-500 hover:text-white transition-colors p-1">
                         <MoreVertical className="w-5 h-5" />
                       </button>
                     </div>
                   </div>
                   
                   <div className="space-y-2 text-sm">
                     <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-slate-500">
                           <Sparkles className="w-3.5 h-3.5" /> AI Score
                        </div>
                        {client.computedScoreStr === 'VIP' && (
                           <div className="group/score relative">
                              <span className="text-[10px] uppercase font-bold tracking-widest text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20 cursor-help">Alto Valor (VIP)</span>
                              <div className="absolute bottom-full right-0 mb-2 w-48 px-3 py-1.5 bg-[#0C1627] border border-[#1A2C47] text-slate-300 text-xs rounded-lg opacity-0 group-hover/score:opacity-100 transition-opacity pointer-events-none z-50 shadow-xl">
                                A IA detectou alto retorno!
                              </div>
                           </div>
                        )}
                        {client.computedScoreStr === 'REGULAR' && (
                           <div className="group/score relative">
                              <span className="text-[10px] uppercase font-bold tracking-widest text-blue-400 bg-blue-500/10 px-2.5 py-1 rounded-full border border-blue-500/20 cursor-help">Frequente</span>
                              <div className="absolute bottom-full right-0 mb-2 w-48 px-3 py-1.5 bg-[#0C1627] border border-[#1A2C47] text-slate-300 text-xs rounded-lg opacity-0 group-hover/score:opacity-100 transition-opacity pointer-events-none z-50 shadow-xl">
                                Comportamento padrão com visitas regulares.
                              </div>
                           </div>
                        )}
                        {client.computedScoreStr === 'RISK' && (
                           <div className="group/score relative">
                              <span className="text-[10px] uppercase font-bold tracking-widest text-red-400 bg-red-500/10 px-2.5 py-1 rounded-full border border-red-500/20 flex items-center gap-1 cursor-help"><AlertTriangle className="w-3 h-3" /> Risco de Churn ({client.computedScoreNum || 0}%)</span>
                              <div className="absolute bottom-full right-0 mb-2 w-48 px-3 py-1.5 bg-[#0C1627] border border-[#1A2C47] text-slate-300 text-xs rounded-lg opacity-0 group-hover/score:opacity-100 transition-opacity pointer-events-none z-50 shadow-xl">
                                Risco do cliente não retornar. Possível churn!
                              </div>
                           </div>
                        )}
                     </div>
                     <div className="flex items-center gap-3 text-slate-400 pt-2 border-t border-[#1A2C47]/50">
                        <Mail className="w-4 h-4 text-slate-500" />
                        <span className="truncate">{client.email}</span>
                     </div>
                     <div className="flex items-center gap-3 text-slate-400">
                        <Phone className="w-4 h-4 text-slate-500" />
                        <span>{client.phone}</span>
                        {client.phone && (
                          <a 
                            href={`https://wa.me/55${client.phone.replace(/\D/g, '')}`} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="ml-auto text-[#25D366] hover:text-emerald-400 p-1 bg-[#25D366]/10 rounded hover:bg-[#25D366]/20 transition-colors"
                            onClick={(e) => e.stopPropagation()}
                            title="Conversar no WhatsApp"
                          >
                             <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/></svg>
                          </a>
                        )}
                     </div>
                     <div className="flex items-center gap-3 text-slate-400">
                        <MapPin className="w-4 h-4 text-slate-500" />
                        <span>{client.location}</span>
                     </div>
                   </div>
                   
                   <div className="mt-4 pt-4 border-t border-white/5 flex justify-between items-center text-xs text-slate-500">
                      <span>Última visita:</span>
                      <span className="text-slate-300 font-medium">{client.lastVisit}</span>
                   </div>
                      
                   <div className="mt-4 grid grid-cols-2 gap-2">
                       <button 
                         onClick={(e) => {
                           e.stopPropagation();
                           if (client.phone) {
                             window.open(`https://wa.me/55${client.phone.replace(/\D/g, '')}`, '_blank');
                           }
                         }}
                         className="flex items-center justify-center gap-2 py-2 px-3 bg-[#25D366]/10 hover:bg-[#25D366]/20 text-[#25D366] border border-[#25D366]/20 rounded-lg transition-colors text-xs font-semibold"
                       >
                         <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/></svg>
                         WhatsApp
                       </button>
                       <button 
                         onClick={() => setSelectedClient(client)}
                         className="flex items-center justify-center gap-2 py-2 px-3 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/20 rounded-lg transition-colors text-xs font-semibold"
                       >
                         Ver Perfil
                       </button>
                   </div>
                 </div>
               ))}
            </div>
            {filteredClients.length === 0 && (
              <div className="col-span-full py-12 flex flex-col items-center justify-center text-slate-500">
                 <p>Nenhum resultado encontrado para a busca.</p>
              </div>
            )}
       </div>

    </div>
  )
}
