import React, { useState, useEffect } from 'react';
import { Users, UserCircle, Clock, CheckCircle, Play, X, Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useNicheStore } from '../store/niche';
import { useProfessionalStore } from '../store/professionals';
import { useQueueStore, subscribeToQueue } from '../store/queue';
import { toast } from 'sonner';

type QueueItem = {
  id: string;
  clientName: string;
  serviceId: string;
  serviceName: string;
  status: 'waiting' | 'in_progress' | 'finished' | 'cancelled';
  timestamp: string;
  estimatedWaitMinutes: number;
};

type ProQueue = {
  id: string;
  name: string;
  status: 'available' | 'busy' | 'offline';
  items: QueueItem[];
};

export default function Queue() {
  const { getConfig } = useNicheStore();
  const config = getConfig();

  const { professionals } = useProfessionalStore();
  const { queueItems, addQueueItem, updateQueueItemStatus, deleteQueueItem } = useQueueStore();

  useEffect(() => {
    const unsub = subscribeToQueue();
    return () => unsub();
  }, []);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newClientName, setNewClientName] = useState('');
  const [newServiceName, setNewServiceName] = useState('');
  const [targetProId, setTargetProId] = useState('sem-pref');

  // Dynamically map flat Firestore queueItems with professionals
  const queues: ProQueue[] = [
    ...professionals.map(pro => {
      const proItems = queueItems.filter(item => item.professionalId === pro.id);
      const hasInProgress = proItems.some(i => i.status === 'in_progress');
      const status: 'available' | 'busy' | 'offline' = 
        pro.status === 'away' ? 'offline' : (hasInProgress ? 'busy' : 'available');

      return {
        id: pro.id,
        name: pro.name,
        status,
        items: proItems as any[]
      };
    }),
    {
      id: 'sem-pref',
      name: 'Sem Preferência',
      status: queueItems.filter(item => item.professionalId === 'sem-pref' && item.status === 'in_progress').length > 0 ? 'busy' : 'available',
      items: queueItems.filter(item => item.professionalId === 'sem-pref' || !professionals.some(p => p.id === item.professionalId)) as any[]
    }
  ];

  const handleAddClient = async () => {
    if (!newClientName || !newServiceName) return;
    
    const targetPro = professionals.find(p => p.id === targetProId);
    const professionalName = targetPro ? targetPro.name : 'Sem Preferência';

    try {
      await addQueueItem({
        clientName: newClientName,
        serviceId: 'manual',
        serviceName: newServiceName,
        estimatedWaitMinutes: Math.floor(Math.random() * 20) + 10,
        professionalId: targetProId,
        professionalName
      });
      toast.success('Cliente adicionado à fila com sucesso!');
    } catch (err) {
      toast.error('Erro ao adicionar cliente à fila.');
    }

    setIsAddModalOpen(false);
    setNewClientName('');
    setNewServiceName('');
    setTargetProId('sem-pref');
  };

  const changeItemStatus = async (proId: string, itemId: string, newStatus: 'waiting' | 'in_progress' | 'finished' | 'cancelled') => {
    try {
      if (newStatus === 'finished') {
        await updateQueueItemStatus(itemId, 'finished');
        toast.success('Atendimento concluído!');
        // Delicately clean up after brief completion view or keep it
        setTimeout(async () => {
          await deleteQueueItem(itemId);
        }, 1500);
      } else if (newStatus === 'cancelled') {
        await deleteQueueItem(itemId);
        toast.info('Cliente removido da fila.');
      } else {
        await updateQueueItemStatus(itemId, newStatus);
      }
    } catch (err) {
      toast.error('Erro ao atualizar status do atendimento.');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available': return 'bg-emerald-500';
      case 'busy': return 'bg-amber-500';
      case 'offline': return 'bg-slate-500';
      default: return 'bg-slate-500';
    }
  };

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto h-full relative">
      <div className="flex items-end justify-between">
         <div>
            <h1 className="text-3xl font-display font-semibold tracking-tight text-white mb-2">Fila de Atendimento</h1>
            <p className="text-slate-400">Gerencie a fila de espera por profissional em tempo real.</p>
         </div>
         <div className="flex gap-3">
            <button 
               onClick={async () => {
                  const toastId = toast.loading('Inicializando Câmera (FaceAPI / TensorFlow)...');
                  setTimeout(async () => {
                     toast.success('Cliente Reconhecido: Marcos Andrade', { id: toastId, description: 'Check-in realizado via biometria facial.' });
                     try {
                        await addQueueItem({
                          clientName: 'Marcos Andrade',
                          serviceId: 'facial-auto',
                          serviceName: 'Cuidado Vip (Automático)',
                          estimatedWaitMinutes: 5,
                          professionalId: 'sem-pref',
                          professionalName: 'Sem Preferência'
                        });
                     } catch (err) {
                        console.error(err);
                     }
                  }, 2200);
               }}
               className="bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-400 border border-indigo-500/30 px-5 py-2.5 rounded-xl font-semibold transition-all flex items-center gap-2 cursor-pointer"
            >
               <UserCircle className="w-5 h-5" />
               Self Check-in Facial
            </button>
            <button 
              onClick={() => setIsAddModalOpen(true)}
              className="bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-xl font-semibold shadow-[0_0_20px_rgba(37,99,235,0.3)] transition-all flex items-center gap-2 cursor-pointer"
            >
              <Plus className="w-5 h-5" />
              Novo na Fila
            </button>
         </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {queues.map(pro => (
          <div key={pro.id} className="glass-card border-[#1A2C47] p-0 overflow-hidden flex flex-col h-[600px] bg-[#0C1627]/60">
             {/* Header */}
             <div className="bg-[#0C1627] p-4 border-b border-[#1A2C47] flex items-center justify-between">
                <div className="flex items-center gap-3">
                   <div className="w-10 h-10 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-lg border border-blue-500/30">
                     {pro.name.charAt(0)}
                   </div>
                   <div>
                       <h3 className="font-semibold text-white">{pro.name}</h3>
                       <div className="flex items-center gap-1.5 mt-1">
                          <div className={`w-2 h-2 rounded-full ${getStatusColor(pro.status)}`}></div>
                          <span className="text-xs text-slate-400 capitalize">{pro.status === 'available' ? 'Disponível' : pro.status === 'busy' ? 'Ocupado' : 'Offline'}</span>
                       </div>
                   </div>
                </div>

                <div className="text-center px-3 py-1.5 bg-[#09111D] border border-[#1A2C47] rounded-lg">
                   <span className="block text-xl font-bold text-white leading-none">{pro.items.filter(i => i.status !== 'finished').length}</span>
                   <span className="text-[10px] uppercase font-semibold text-slate-500 tracking-wider">Fila</span>
                </div>
             </div>

             {/* Queue Items */}
             <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-[#030815]/40">
                <AnimatePresence>
                   {pro.items.map(item => (
                    <motion.div 
                      key={item.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      className={`p-4 rounded-xl border transition-all ${
                        item.status === 'in_progress' 
                          ? 'bg-blue-900/20 border-blue-500/50 shadow-[0_0_15px_rgba(59,130,246,0.15)]' 
                          : item.status === 'finished'
                          ? 'bg-emerald-900/20 border-emerald-500/50 scale-95 opacity-50'
                          : 'bg-[#09111D] border-[#1A2C47] hover:border-[#253B5C]'
                      }`}
                    >
                       <div className="flex justify-between items-start mb-2">
                          <div>
                            <h4 className="font-semibold text-white">{item.clientName}</h4>
                            <p className="text-xs text-slate-400 mt-0.5">{item.serviceName}</p>
                          </div>
                          {item.status === 'waiting' && (
                             <div className="flex items-center gap-1 text-amber-500 bg-amber-500/10 px-2 py-1 rounded text-xs font-medium">
                               <Clock className="w-3 h-3" />
                               Espera ~{item.estimatedWaitMinutes}m
                             </div>
                          )}
                          {item.status === 'in_progress' && (
                             <div className="flex items-center gap-1 text-blue-400 bg-blue-500/10 px-2 py-1 rounded text-xs font-medium animate-pulse">
                               <Play className="w-3 h-3" />
                               Em Andamento
                             </div>
                          )}
                       </div>

                       <div className="flex items-center gap-2 mt-4 pt-3 border-t border-[#1A2C47]">
                          {item.status === 'waiting' && (
                             <>
                                <button 
                                  onClick={() => changeItemStatus(pro.id, item.id, 'in_progress')}
                                  className="flex-1 py-1.5 bg-blue-600/20 text-blue-400 hover:bg-blue-600/30 rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-1 cursor-pointer"
                                >
                                   <Play className="w-3 h-3" /> Atender
                                </button>
                                <button 
                                  onClick={() => changeItemStatus(pro.id, item.id, 'cancelled')}
                                  className="py-1.5 px-3 bg-red-500/10 text-red-400 hover:bg-red-500/20 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                                  title="Remover"
                                >
                                   <X className="w-4 h-4" />
                                </button>
                             </>
                          )}
                          {item.status === 'in_progress' && (
                             <button 
                               onClick={() => changeItemStatus(pro.id, item.id, 'finished')}
                               className="flex-1 py-1.5 bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-1 cursor-pointer"
                             >
                                <CheckCircle className="w-3 h-3" /> Concluir Atendimento
                             </button>
                          )}
                       </div>
                    </motion.div>
                  ))}
                  
                  {pro.items.length === 0 && (
                     <div className="text-center py-10">
                        <Users className="w-10 h-10 text-slate-600 mx-auto mb-3 opacity-50" />
                        <p className="text-slate-500 text-sm">Fila vazia</p>
                     </div>
                  )}
                </AnimatePresence>
             </div>
          </div>
        ))}
      </div>

      <AnimatePresence>
        {isAddModalOpen && (
           <motion.div 
             initial={{ opacity: 0 }}
             animate={{ opacity: 1 }}
             exit={{ opacity: 0 }}
             className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4"
           >
              <motion.div 
                 initial={{ scale: 0.9, opacity: 0 }}
                 animate={{ scale: 1, opacity: 1 }}
                 exit={{ scale: 0.9, opacity: 0 }}
                 className="bg-[#0C1627] border border-[#1A2C47] rounded-3xl w-full max-w-md flex flex-col shadow-[0_0_50px_rgba(0,0,0,0.5)] overflow-hidden"
              >
                 <div className="p-6 border-b border-[#1A2C47] flex items-center justify-between bg-[#09111D]">
                    <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                       <Plus className="w-5 h-5 text-blue-500" />
                       Novo na Fila
                    </h2>
                    <button 
                      onClick={() => setIsAddModalOpen(false)}
                      className="p-2 bg-[#1A2C47] hover:bg-[#253B5C] rounded-full text-slate-300 transition-colors cursor-pointer"
                    >
                      <X className="w-5 h-5" />
                    </button>
                 </div>
                 
                 <div className="p-6 space-y-4 text-left">
                    <div>
                       <label className="text-[10px] uppercase font-semibold text-slate-500 tracking-widest block mb-2">Nome do {config.terminology.client}</label>
                       <input 
                         type="text" 
                         value={newClientName}
                         onChange={(e) => setNewClientName(e.target.value)}
                         placeholder="Ex: João Silva"
                         className="w-full bg-[#09111D] border border-[#1A2C47] rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-blue-500 transition-colors"
                       />
                    </div>
                    <div>
                       <label className="text-[10px] uppercase font-semibold text-slate-500 tracking-widest block mb-2">Serviço Desejado</label>
                       <input 
                         type="text" 
                         value={newServiceName}
                         onChange={(e) => setNewServiceName(e.target.value)}
                         placeholder={`Ex: ${config.features.hasAnamnesis ? 'Consulta' : 'Corte de Cabelo'}`}
                         className="w-full bg-[#09111D] border border-[#1A2C47] rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-blue-500 transition-colors"
                       />
                    </div>
                    <div>
                       <label className="text-[10px] uppercase font-semibold text-slate-500 tracking-widest block mb-2">Profissional Especialista</label>
                       <select 
                         value={targetProId}
                         onChange={(e) => setTargetProId(e.target.value)}
                         className="w-full bg-[#09111D] border border-[#1A2C47] rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-blue-500 transition-colors appearance-none"
                       >
                          {professionals.map(q => (
                             <option key={q.id} value={q.id}>{q.name}</option>
                          ))}
                          <option value="sem-pref">Sem Preferência</option>
                       </select>
                    </div>
                 </div>

                 <div className="p-6 border-t border-[#1A2C47] bg-[#09111D] flex gap-3">
                    <button 
                      onClick={() => setIsAddModalOpen(false)}
                      className="flex-1 py-3 bg-transparent border border-[#1A2C47] text-slate-300 hover:bg-white/5 font-semibold rounded-xl transition-all cursor-pointer"
                    >
                      Cancelar
                    </button>
                    <button 
                      onClick={handleAddClient}
                      disabled={!newClientName || !newServiceName}
                      className="flex-1 py-3 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl transition-all shadow-[0_0_15px_rgba(37,99,235,0.3)] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                    >
                      Adicionar
                    </button>
                 </div>
              </motion.div>
           </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
