import { useState, useEffect } from 'react';
import { useNicheStore } from '../store/niche';
import { useProfessionalStore, Professional } from '../store/professionals';
import { useAuthStore } from '../store/auth';
import { useNavigate } from 'react-router-dom';
import { User, Mail, Phone, Calendar, MoreVertical, Plus, Star, ArrowUpRight, Scissors, Edit, Trash2, X, Download, Share2, Percent } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import { auth, db } from '../lib/firebase';
import { addDoc, collection, onSnapshot, query, where } from 'firebase/firestore';

export default function Professionals() {
  const { getConfig } = useNicheStore();
  const config = getConfig();
  const isDemo = useAuthStore(state => state.user?.isDemo === true);
  const account = useAuthStore(state => state.user);
  const [staffInvites, setStaffInvites] = useState<Array<{ id: string; email: string; professionalId: string; status: string }>>([]);
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  
  const { professionals, addProfessional, updateProfessional, deleteProfessional } = useProfessionalStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
  const [currentProf, setCurrentProf] = useState<Partial<Professional>>({});

  useEffect(() => {
    if (!account?.id || isDemo || account.companyId && account.companyId !== account.id) {
      setStaffInvites([]);
      return;
    }
    const q = query(collection(db, 'staff_invites'), where('companyId', '==', account.id));
    const unsubscribe = onSnapshot(q, snapshot => setStaffInvites(snapshot.docs.map(item => ({
      id: item.id,
      email: String(item.data().email || ''),
      professionalId: String(item.data().professionalId || ''),
      status: String(item.data().status || 'pending')
    }))), () => setStaffInvites([]));
    return unsubscribe;
  }, [account?.id, account?.companyId, isDemo]);

  const requestStaffInvite = async (professional: Professional) => {
    const email = professional.email?.trim().toLowerCase();
    if (isDemo || !account || account.companyId && account.companyId !== account.id) {
      toast.error('Convites disponíveis apenas ao proprietário da empresa.');
      return;
    }
    if (!email || !/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(email)) {
      toast.error('Cadastre um e-mail válido no profissional antes de solicitar acesso.');
      return;
    }
    if (staffInvites.some(invite => invite.email === email && invite.status === 'pending')) {
      toast.info('Já existe uma solicitação pendente para este e-mail.');
      return;
    }
    if (!auth.currentUser || auth.currentUser.uid !== account.id) {
      toast.error('Faça login como proprietário para solicitar o vínculo.');
      return;
    }
    try {
      await addDoc(collection(db, 'staff_invites'), {
        companyId: account.id,
        ownerUid: account.id,
        professionalId: professional.id,
        email,
        status: 'pending',
        createdAt: new Date().toISOString()
      });
      toast.success('Solicitação registrada. O acesso só será liberado após aprovação e vínculo seguro no Firebase.');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Não foi possível registrar a solicitação.');
    }
  };

  const [newsIndex, setNewsIndex] = useState(0);
  const breakingNews = [
     "João Pedro: Em atendimento (Corte Degradê)",
     "Marcos Silva: Pausa para o almoço (Retorno 14h)",
     "Sílvia: Aguardando próximo cliente (14:30)",
     "Ana Souza: Faltou hoje (Remarcando clientes)"
  ];

  useEffect(() => {
     const interval = setInterval(() => {
        setNewsIndex(i => (i + 1) % breakingNews.length);
     }, 4000);
     return () => clearInterval(interval);
  }, [breakingNews.length]);

  const handleOpenModal = (mode: 'add' | 'edit', prof: Partial<Professional> = {}) => {
    setModalMode(mode);
    setCurrentProf(mode === 'add' ? { name: '', role: '', email: '', phone: '', status: 'active', rating: 5.0, services: 0, revenue: 0, commission: 50 } : prof);
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!currentProf.name?.trim()) {
      toast.error('Informe o nome do profissional.');
      return;
    }
    try {
      if (modalMode === 'add') {
        await addProfessional({
          ...currentProf,
          id: crypto.randomUUID(),
          name: currentProf.name.trim()
        } as Professional);
      } else {
        if (!currentProf.id) throw new Error('Profissional inválido.');
        await updateProfessional(currentProf as Professional);
      }
      setIsModalOpen(false);
      toast.success('Profissional salvo.');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Não foi possível salvar o profissional.');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(`Tem certeza que deseja excluir este ${config.terminology.employee}?`)) return;
    try {
      await deleteProfessional(id);
      toast.success('Profissional excluído.');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Não foi possível excluir o profissional.');
    }
  };

  const activeProfessionals = professionals.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));

  const [activeModalProf, setActiveModalProf] = useState<Professional | null>(null);
  const [activeModalType, setActiveModalType] = useState<'schedule' | 'services' | 'report' | null>(null);

  const handleOpenActionModal = (type: 'schedule' | 'services' | 'report', prof: Professional) => {
    setActiveModalProf(prof);
    setActiveModalType(type);
  };

  const handleCloseActionModal = () => {
    setActiveModalProf(null);
    setActiveModalType(null);
  };

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto h-full relative">
      <AnimatePresence>
        {isModalOpen && (
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
              className="bg-[#0C1627] border border-[#1A2C47] rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col"
            >
              <div className="p-6 border-b border-[#1A2C47] flex items-center justify-between bg-[#09111D]">
                <h3 className="text-xl font-semibold text-white">
                  {modalMode === 'add' ? `Novo ${config.terminology.employee}` : `Editar ${config.terminology.employee}`}
                </h3>
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="text-slate-400 hover:text-white p-2 rounded-lg hover:bg-white/5 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="p-6 space-y-4">
                 <div className="grid grid-cols-2 gap-4">
                    <div>
                       <label className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-2 block">Nome Completo</label>
                       <input 
                         type="text" 
                         value={currentProf.name || ''}
                         onChange={(e) => setCurrentProf({ ...currentProf, name: e.target.value })}
                         placeholder="Ex: João da Silva"
                         className="w-full bg-[#09111D] border border-[#1A2C47] rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-blue-500 transition-colors"
                       />
                    </div>
                    <div>
                       <label className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-2 block">Cargo / Especialidade</label>
                       <input 
                         type="text" 
                         value={currentProf.role || ''}
                         onChange={(e) => setCurrentProf({ ...currentProf, role: e.target.value })}
                         placeholder="Ex: Barbeiro Sênior"
                         className="w-full bg-[#09111D] border border-[#1A2C47] rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-blue-500 transition-colors"
                       />
                    </div>
                 </div>
                 <div className="grid grid-cols-3 gap-4">
                    <div className="col-span-2">
                       <label className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-2 block">E-mail</label>
                       <input 
                         type="email" 
                         value={currentProf.email || ''}
                         onChange={(e) => setCurrentProf({ ...currentProf, email: e.target.value })}
                         placeholder="Ex: joao@email.com"
                         className="w-full bg-[#09111D] border border-[#1A2C47] rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-blue-500 transition-colors"
                       />
                    </div>
                    <div>
                       <label className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-2 block flex items-center gap-1">
                          Comissão Base (%)
                       </label>
                       <div className="relative">
                         <Percent className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                         <input 
                           type="number" 
                           value={currentProf.commission || 0}
                           onChange={(e) => setCurrentProf({ ...currentProf, commission: Number(e.target.value) })}
                           placeholder="50"
                           className="w-full bg-[#09111D] border border-[#1A2C47] rounded-xl pl-10 pr-4 py-3 text-sm text-white outline-none focus:border-blue-500 transition-colors"
                         />
                       </div>
                    </div>
                 </div>
                 <div className="grid grid-cols-2 gap-4">
                    <div>
                       <label className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-2 block">Telefone</label>
                       <input 
                         type="text" 
                         value={currentProf.phone || ''}
                         onChange={(e) => setCurrentProf({ ...currentProf, phone: e.target.value })}
                         placeholder="(11) 99999-9999"
                         className="w-full bg-[#09111D] border border-[#1A2C47] rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-blue-500 transition-colors"
                       />
                    </div>
                    <div>
                       <label className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-2 block">Status</label>
                       <select 
                         value={currentProf.status || 'active'}
                         onChange={(e) => setCurrentProf({ ...currentProf, status: e.target.value })}
                         className="w-full bg-[#09111D] border border-[#1A2C47] rounded-xl px-4 py-3 text-sm text-slate-300 outline-none focus:border-blue-500 transition-colors"
                       >
                          <option value="active">Ativo</option>
                          <option value="away">Afastado</option>
                          <option value="inactive">Inativo</option>
                       </select>
                    </div>
                 </div>
              </div>

              <div className="p-6 border-t border-[#1A2C47] flex gap-3 bg-[#09111D]">
                 <button 
                   onClick={() => setIsModalOpen(false)}
                   className="flex-1 py-3 bg-transparent border border-[#1A2C47] text-slate-300 hover:bg-white/5 font-semibold rounded-xl transition-all"
                 >
                   Cancelar
                 </button>
                 <button 
                   onClick={handleSave}
                   className="flex-1 py-3 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl transition-all shadow-[0_0_15px_rgba(37,99,235,0.3)]"
                 >
                   Salvar {config.terminology.employee}
                 </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {activeModalProf && activeModalType && (
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
              className="bg-[#0C1627] border border-[#1A2C47] rounded-3xl w-full max-w-2xl flex flex-col shadow-[0_0_50px_rgba(0,0,0,0.5)] overflow-hidden max-h-[85vh] overflow-y-auto"
            >
              <div className="p-6 border-b border-[#1A2C47] flex items-center justify-between bg-[#09111D] sticky top-0 z-10">
                <div>
                   <h2 className="text-xl font-semibold text-white">
                     {activeModalType === 'schedule' ? 'Agenda Ocupada' : 'Relatório de Serviços'}
                   </h2>
                   <p className="text-sm text-slate-400 mt-1">
                     Profissional: <strong className="text-white">{activeModalProf.name}</strong> 
                     {activeModalType === 'services' && ' | Este Mês'}
                   </p>
                </div>
                <button 
                  onClick={handleCloseActionModal}
                  className="p-2 bg-[#1A2C47] hover:bg-[#253B5C] rounded-full text-slate-300 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-6">
                {activeModalType === 'schedule' && (
                  <div className="space-y-4">
                     <p className="text-slate-400 text-sm mb-4">Próximos agendamentos (Hoje e Amanhã):</p>
                     
                     <div className="flex flex-col gap-3">
                        <div className="p-4 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between">
                           <div className="flex items-center gap-4">
                              <div className="h-10 w-10 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold">
                                09h
                              </div>
                              <div>
                                 <p className="font-semibold text-white text-sm">Corte Degradê + Barba</p>
                                 <p className="text-xs text-slate-400">Cliente: João Pedro</p>
                              </div>
                           </div>
                           <span className="text-xs font-semibold text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded-md">Confirmado</span>
                        </div>
                        
                        <div className="p-4 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between">
                           <div className="flex items-center gap-4">
                              <div className="h-10 w-10 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
                                11h
                              </div>
                              <div>
                                 <p className="font-semibold text-white text-sm">Platinado Global</p>
                                 <p className="text-xs text-slate-400">Cliente: Marcos Silva</p>
                              </div>
                           </div>
                           <span className="text-xs font-semibold text-amber-400 bg-amber-400/10 px-2 py-1 rounded-md">Aguardando</span>
                        </div>
                        
                        <div className="p-4 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between opacity-50">
                           <div className="flex items-center gap-4">
                              <div className="h-10 w-10 rounded-lg bg-red-500/20 text-red-400 flex items-center justify-center font-bold">
                                14h
                              </div>
                              <div>
                                 <p className="font-semibold text-white text-sm">Limpeza de Pele</p>
                                 <p className="text-xs text-slate-400">Cliente: Carlos A.</p>
                              </div>
                           </div>
                           <span className="text-xs font-semibold text-red-400 bg-red-400/10 px-2 py-1 rounded-md">Cancelado</span>
                        </div>
                     </div>
                  </div>
                )}

                {activeModalType === 'services' && (
                  <div className="space-y-6">
                     <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 rounded-xl bg-gradient-to-br from-blue-500/20 to-blue-600/10 border border-blue-500/20">
                           <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">Total de Serviços Formados</p>
                           <h3 className="text-2xl font-bold text-white">{activeModalProf.services}</h3>
                        </div>
                        <div className="p-4 rounded-xl bg-gradient-to-br from-emerald-500/20 to-emerald-600/10 border border-emerald-500/20">
                           <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">Total de Receita Gerada</p>
                           <h3 className="text-2xl font-bold text-emerald-400">R$ {activeModalProf.revenue.toFixed(2)}</h3>
                        </div>
                     </div>
                     
                     <div className="space-y-3 mt-6">
                        <h3 className="text-sm font-semibold text-white">Serviços mais realizados</h3>
                        
                        <div className="flex flex-col gap-2">
                           <div className="p-3 bg-white/5 rounded-lg border border-white/10 flex justify-between items-center text-sm text-slate-300">
                              <span>Corte Degradê</span>
                              <span className="font-bold text-white">45%</span>
                           </div>
                           <div className="p-3 bg-white/5 rounded-lg border border-white/10 flex justify-between items-center text-sm text-slate-300">
                              <span>Barba Tradicional</span>
                              <span className="font-bold text-white">35%</span>
                           </div>
                           <div className="p-3 bg-white/5 rounded-lg border border-white/10 flex justify-between items-center text-sm text-slate-300">
                              <span>Combo (Corte + Barba)</span>
                              <span className="font-bold text-white">20%</span>
                           </div>
                        </div>
                     </div>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex items-center justify-between bg-[#0C1627] p-6 rounded-2xl border border-[#1A2C47]">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-white mb-1">
            {config.terminology.employee}s
          </h1>
          <p className="text-slate-400 text-sm">Gerencie sua equipe, comissões e horários.</p>
        </div>
        
        <div className="flex items-center gap-4">
           {isDemo && <div className="hidden md:flex items-center gap-2 bg-[#09111D] border border-blue-500/20 px-5 py-2.5 rounded-lg max-w-[350px] overflow-hidden relative shadow-[0_0_15px_rgba(59,130,246,0.1)]">
              <div className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse shrink-0" />
              <AnimatePresence mode="popLayout">
                 <motion.span 
                   key={newsIndex}
                   initial={{ y: 20, opacity: 0 }}
                   animate={{ y: 0, opacity: 1 }}
                   exit={{ y: -20, opacity: 0 }}
                   transition={{ duration: 0.3 }}
                   className="text-sm text-blue-400 font-bold truncate"
                 >
                    {breakingNews[newsIndex]}
                 </motion.span>
              </AnimatePresence>
           </div>}

           <button 
             onClick={() => handleOpenModal('add')}
             className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-xl flex items-center gap-2 font-semibold transition-all shadow-[0_0_15px_rgba(37,99,235,0.3)] shrink-0"
           >
             <Plus className="w-5 h-5" />
             Novo {config.terminology.employee}
           </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {activeProfessionals.map((prof) => (
          <div key={prof.id} className="glass-card p-6 border-[#1A2C47] flex flex-col group hover:border-[#253B5C] transition-colors relative overflow-hidden">
            <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
               <button 
                 onClick={() => handleOpenModal('edit', prof)}
                 className="p-2 bg-[#1A2C47] text-slate-300 hover:text-white rounded-lg transition-colors cursor-pointer"
               >
                  <Edit className="w-4 h-4" />
               </button>
               <button 
                 onClick={() => handleDelete(prof.id)}
                 className="p-2 bg-red-500/10 text-red-400 hover:bg-red-500/20 rounded-lg transition-colors cursor-pointer"
               >
                  <Trash2 className="w-4 h-4" />
               </button>
            </div>
            
            <div className="flex items-center gap-4 mb-6">
               <div className="w-16 h-16 rounded-2xl bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-2xl shadow-[0_0_15px_rgba(59,130,246,0.2)]">
                  {prof.name.charAt(0)}
               </div>
               <div>
                  <h3 className="text-lg font-bold text-white leading-tight">{prof.name}</h3>
                  <p className="text-sm text-slate-400 font-medium">{prof.role}</p>
                  <div className="flex items-center gap-1 mt-1 text-yellow-400 text-xs font-bold">
                    <Star className="w-3 h-3 fill-current" /> {prof.rating.toFixed(1)}
                  </div>
               </div>
            </div>

            <div className="space-y-3 mb-6">
               <div className="flex items-center gap-3 text-sm text-slate-300">
                  <Phone className="w-4 h-4 text-slate-500" />
                  {prof.phone}
               </div>
               <div className="flex items-center gap-3 text-sm text-slate-300">
                  <Mail className="w-4 h-4 text-slate-500" />
                  {prof.email}
               </div>
            </div>

            {!isDemo && account?.id === (account.companyId || account.id) && (
              <div className="mb-4">
                <button type="button" onClick={() => void requestStaffInvite(prof)}
                  className="rounded-lg border border-cyan-500/30 bg-cyan-500/10 px-3 py-2 text-xs font-semibold text-cyan-300 hover:bg-cyan-500/20">
                  <Mail className="mr-2 inline h-4 w-4" />
                  Solicitar acesso ao portal
                </button>
                <p className="mt-2 text-xs text-slate-400">
                  {staffInvites.find(item => item.professionalId === prof.id)?.status === 'pending'
                    ? 'Aguardando aprovação administrativa e vínculo no Firebase.'
                    : 'A solicitação não concede login automaticamente.'}
                </p>
              </div>
            )}

            <div className="grid grid-cols-3 gap-2 mb-6">
               <div className="bg-[#0C1627] rounded-xl p-2 md:p-3 border border-[#1A2C47]">
                  <p className="text-[9px] text-slate-500 uppercase tracking-widest font-bold mb-1">Serviços</p>
                  <p className="text-sm border-white/10 font-bold text-white">{prof.services}</p>
               </div>
               <div className="bg-[#0C1627] rounded-xl p-2 md:p-3 border border-[#1A2C47]">
                  <p className="text-[9px] text-slate-500 uppercase tracking-widest font-bold mb-1">Gerado</p>
                  <p className="text-sm font-bold text-emerald-400">R$ {(prof.revenue / 1000).toFixed(1)}k</p>
               </div>
               <div className="bg-[#0C1627] rounded-xl p-2 md:p-3 border border-[#1A2C47]">
                  <p className="text-[9px] text-slate-500 uppercase tracking-widest font-bold mb-1">Comissão</p>
                  <p className="text-sm font-bold text-blue-400">{prof.commission}%</p>
               </div>
            </div>

            <div className="flex gap-2 mt-auto">
               <button 
                 onClick={() => handleOpenActionModal('report', prof)}
                 className="flex-1 bg-white/5 border border-white/10 hover:bg-white/10 text-white py-2 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-1.5"
               >
                  <Download className="w-3.5 h-3.5" /> Relatório
               </button>
               <button 
                 onClick={() => {
                   const text = `*Relatório de Comissões - ${prof.name}*\nServiços: ${prof.services}\nFaturado: R$ ${prof.revenue.toFixed(2)}\nComissão(${prof.commission}%): R$ ${(prof.revenue * (prof.commission/100)).toFixed(2)}\n\nAcesse o sistema para mais detalhes.`;
                   window.open(`https://wa.me/?text=${encodeURIComponent(text)}`);
                 }}
                 className="flex-1 bg-green-500/10 border border-green-500/20 hover:bg-green-500/20 text-green-400 py-2 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-1.5"
               >
                  <Share2 className="w-3.5 h-3.5" /> Enviar
               </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
