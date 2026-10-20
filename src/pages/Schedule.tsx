import React, { useState } from 'react';
import { useNicheStore } from '../store/niche';
import { ChevronLeft, ChevronRight, Clock, User, Scissors, X, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { format, addDays, startOfWeek, isSameDay, differenceInHours } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';
import { useAuthStore } from '../store/auth';

interface Appointment {
  id: string;
  client: string;
  service: string;
  employee: string;
  time: string;
  status: 'confirmed' | 'pending' | 'finished';
}

const mockAppointments: Appointment[] = [
  { id: '1', client: 'Ana Paula Souza', service: 'Corte + Escova', employee: 'Sílvia', time: '09:00', status: 'confirmed' },
  { id: '2', client: 'Juliana Martins', service: 'Mechas', employee: 'Sílvia', time: '10:30', status: 'confirmed' },
  { id: '3', client: 'Beatriz Lima', service: 'Coloração', employee: 'João', time: '14:00', status: 'pending' },
  { id: '4', client: 'Carla Mendes', service: 'Tratamento Capilar', employee: 'Sílvia', time: '15:30', status: 'confirmed' },
];

import { useAppointmentStore } from '../store/appointments';

export default function Schedule() {
  const { getConfig } = useNicheStore();
  const config = getConfig();
  const isDemo = useAuthStore(state => state.user?.isDemo === true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  
  const { appointments, deleteAppointment } = useAppointmentStore();

  const handleCancelAppointment = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await deleteAppointment(id);
    toast.success('Agendamento removido. Nenhuma notificação externa foi enviada.');
  };

  
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 7 }).map((_, i) => addDays(weekStart, i));

  return (
    <div className="flex-1 flex gap-6 h-full overflow-hidden relative">
      <div className="flex-1 flex flex-col gap-4 overflow-hidden h-full">
         {/* NEW APPOINTMENT MODAL */}
       <AnimatePresence>
          {isDemo && isAiModalOpen && (
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
                 className="bg-[#0F172A] border border-cyan-500/30 rounded-2xl w-full max-w-lg shadow-[0_0_30px_rgba(34,211,238,0.15)] overflow-hidden flex flex-col relative"
               >
                  <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
                     <Sparkles className="w-32 h-32 text-cyan-500" />
                  </div>
                  <div className="p-6 border-b border-white/5 flex items-center justify-between rounded-t-2xl bg-[#09111D] relative z-10">
                    <h3 className="text-xl font-semibold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500 flex items-center gap-2">
                       <Sparkles className="w-5 h-5 text-cyan-400" /> IA Otimização de Agenda
                    </h3>
                    <button 
                      onClick={() => setIsAiModalOpen(false)}
                      className="text-slate-400 hover:text-white p-2 rounded-lg hover:bg-white/5 transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                  
                  <div className="p-6 space-y-4 relative z-10">
                     <p className="text-slate-300 text-sm">
                       Analisei sua agenda de hoje e encontrei as seguintes oportunidades para maximizar sua receita:
                     </p>
                     
                     <div className="bg-[#1E293B] border border-cyan-500/20 rounded-xl p-4 flex flex-col gap-2">
                        <div className="flex items-center gap-2 text-cyan-400 font-semibold text-sm">
                           <Clock className="w-4 h-4" /> Encaixe Inteligente (11:30 - 13:00)
                        </div>
                        <p className="text-slate-400 text-xs leading-relaxed">
                           Sílvia tem um intervalo ocioso de 1h30m. Há 3 clientes na lista de espera para serviços rápidos (Sobrancelha / Corte).
                        </p>
                        <button 
                          className="mt-2 py-2 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 font-semibold text-sm rounded-lg border border-cyan-500/30 transition-all w-full text-center"
                          onClick={() => setIsAiModalOpen(false)}
                        >
                          Sugerir Encaixe por WhatsApp
                        </button>
                     </div>

                     <div className="bg-[#1E293B] border border-purple-500/20 rounded-xl p-4 flex flex-col gap-2">
                        <div className="flex items-center gap-2 text-purple-400 font-semibold text-sm">
                           <Clock className="w-4 h-4" /> Remanejamento (14:00)
                        </div>
                        <p className="text-slate-400 text-xs leading-relaxed">
                           João tem um agendamento pendente que pode atrasar a fila. Recomendo mover Beatriz Lima para 14:30 e liberar espaço para um cliente VIP.
                        </p>
                     </div>
                  </div>
               </motion.div>
            </motion.div>
          )}
       </AnimatePresence>

       {/* NEW APPOINTMENT MODAL */}
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
                 className="bg-[#0C1627] border border-[#1A2C47] rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col"
               >
                  <div className="p-6 border-b border-[#1A2C47] flex items-center justify-between bg-[#09111D]">
                    <h3 className="text-xl font-semibold text-white">Criar Nova Agenda</h3>
                    <button 
                      onClick={() => setIsModalOpen(false)}
                      className="text-slate-400 hover:text-white p-2 rounded-lg hover:bg-white/5 transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                  
                  <div className="p-6 space-y-4">
                     <div>
                        <label className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-2 block">{config.terminology.client}</label>
                        <input 
                          type="text" 
                          placeholder={`Buscar ou cadastrar ${config.terminology.client.toLowerCase()}...`}
                          className="w-full bg-[#09111D] border border-[#1A2C47] rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-blue-500 transition-colors"
                        />
                     </div>
                     <div className="grid grid-cols-2 gap-4">
                        <div>
                           <label className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-2 block">{config.terminology.service}</label>
                           <select className="w-full bg-[#09111D] border border-[#1A2C47] rounded-xl px-4 py-3 text-sm text-slate-300 outline-none focus:border-blue-500 transition-colors">
                              <option>Selecione...</option>
                              <option>Corte Degradê</option>
                              <option>Barba Tradicional</option>
                           </select>
                        </div>
                        <div>
                           <label className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-2 block">{config.terminology.employee}</label>
                           <select className="w-full bg-[#09111D] border border-[#1A2C47] rounded-xl px-4 py-3 text-sm text-slate-300 outline-none focus:border-blue-500 transition-colors">
                              <option>Qualquer um</option>
                              <option>João Silva</option>
                              <option>Marcos Paulo</option>
                           </select>
                        </div>
                     </div>
                     <div className="grid grid-cols-2 gap-4">
                        <div>
                           <label className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-2 block">Data</label>
                           <input 
                             type="date"
                             defaultValue={format(currentDate, 'yyyy-MM-dd')}
                             className="w-full bg-[#09111D] border border-[#1A2C47] rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-blue-500 transition-colors"
                           />
                        </div>
                        <div>
                           <label className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-2 block">Horário</label>
                           <input 
                             type="time" 
                             className="w-full bg-[#09111D] border border-[#1A2C47] rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-blue-500 transition-colors"
                           />
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
                       onClick={() => setIsModalOpen(false)}
                       className="flex-1 py-3 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl transition-all shadow-[0_0_15px_rgba(37,99,235,0.3)]"
                     >
                       Confirmar Agendamento
                     </button>
                  </div>
               </motion.div>
            </motion.div>
          )}
       </AnimatePresence>

       <div className="flex justify-between items-center bg-[#0C1627] p-4 rounded-2xl border border-[#1A2C47]">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Agenda</h1>
            <p className="text-slate-400 text-sm">Gerencie {config.terminology.appointment.toLowerCase()}s e equipes</p>
          </div>
          
          <div className="flex items-center gap-4">
             <button className="px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition">Hoje</button>
             <div className="flex items-center gap-2">
                <button 
                  onClick={() => setCurrentDate(d => addDays(d, -1))}
                  className="p-2 border border-slate-700 rounded-lg hover:bg-gray-800"
                >
                   <ChevronLeft className="w-5 h-5" />
                </button>
                <span className="font-medium min-w-[120px] text-center capitalize">
                   {format(currentDate, "dd 'de' MMMM", { locale: ptBR })}
                </span>
                 <button 
                  onClick={() => setCurrentDate(d => addDays(d, 1))}
                  className="p-2 border border-slate-700 rounded-lg hover:bg-gray-800"
                >
                   <ChevronRight className="w-5 h-5" />
                </button>
             </div>
             
             <button 
                onClick={() => setIsModalOpen(true)}
                className="px-4 py-2 bg-blue-500 hover:bg-blue-400 text-black font-semibold uppercase tracking-wider text-xs rounded-lg transition shadow-[0_0_10px_rgba(59,130,246,0.4)] ml-4"
              >
                Novo Agendamento
             </button>
             {isDemo && <button
                onClick={() => setIsAiModalOpen(true)}
                className="px-4 py-2 bg-gradient-to-r from-cyan-400 to-purple-500 text-black font-semibold uppercase tracking-wider text-xs rounded-lg transition shadow-[0_0_15px_rgba(34,211,238,0.3)] ml-2 flex items-center gap-2"
              >
                <Sparkles className="w-4 h-4" /> IA Otimizar Agenda
             </button>}
          </div>
       </div>

       <div className="flex gap-2">
          {weekDays.map(date => {
             const isSelected = isSameDay(date, currentDate);
             return (
               <button
                 key={date.toString()}
                 onClick={() => {
                   setCurrentDate(date);
                   setIsModalOpen(true);
                 }}
                 className={`flex-1 p-3 rounded-xl border flex flex-col items-center justify-center gap-1 transition-all ${
                   isSelected 
                     ? 'bg-blue-500/20 border-blue-500/50 text-blue-400 shadow-[0_0_10px_rgba(59,130,246,0.2)]'
                     : 'bg-[#0C1627] border-[#1A2C47] text-slate-500 hover:bg-[#182B4A]'
                 }`}
               >
                  <span className="text-xs font-medium uppercase">{format(date, 'eee', { locale: ptBR })}</span>
                  <span className="text-xl font-semibold">{format(date, 'dd')}</span>
               </button>
             )
          })}
       </div>

       <div className="flex-1 overflow-y-auto glass-card p-2">
          <div className="flex flex-col gap-2">
             <AnimatePresence>
                {appointments.map((app, i) => {
                  const appDate = new Date(currentDate);
                  const [hours, minutes] = app.time.split(':').map(Number);
                  appDate.setHours(hours, minutes, 0, 0);
                  const canCancel = differenceInHours(appDate, new Date()) >= 24;

                  return (
                  <motion.div
                    key={app.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ delay: i * 0.05 }}
                    className="flex items-center gap-4 p-4 rounded-xl hover:bg-gray-800/50 border border-transparent hover:border-slate-700 transition group"
                  >
                     <div className="flex flex-col items-center justify-center w-20 border-r border-slate-800 shrink-0">
                        <span className="text-lg font-semibold text-gray-200">{app.time}</span>
                        <span className="text-xs text-slate-500 flex items-center gap-1"><Clock className="w-3 h-3"/> {app.status === 'confirmed' ? 'Conf.' : 'Pend.'}</span>
                     </div>
                     
                     <div className="flex-1 grid grid-cols-3 gap-4">
                        <div>
                           <p className="text-xs text-slate-500 mb-1">{config.terminology.client}</p>
                           <div className="flex items-center gap-2">
                              <User className="w-4 h-4 text-slate-400" />
                              <span className="font-medium text-gray-200">{app.client}</span>
                           </div>
                        </div>
                        <div>
                           <p className="text-xs text-slate-500 mb-1">{config.terminology.service}</p>
                           <div className="flex items-center gap-2">
                              <Scissors className="w-4 h-4 text-blue-400" />
                              <span className="text-slate-300">{app.service}</span>
                           </div>
                        </div>
                        <div>
                           <p className="text-xs text-slate-500 mb-1">{config.terminology.employee}</p>
                           <div className="flex items-center gap-2">
                              <div className="w-5 h-5 rounded-full bg-gray-700 font-semibold text-[10px] flex items-center justify-center">{app.employee.charAt(0)}</div>
                              <span className="text-slate-400">{app.employee}</span>
                           </div>
                        </div>
                     </div>
                     
                     <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-2">
                         {canCancel && (
                           <button 
                             onClick={(e) => handleCancelAppointment(app.id, e)}
                             className="p-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-lg transition-colors flex items-center gap-1 text-xs px-2 font-medium" 
                             title="Cancelar Agendamento"
                           >
                             <X className="w-3 h-3" /> Cancelar
                           </button>
                         )}
                         <button className="p-1.5 bg-green-500/10 hover:bg-green-500/20 text-green-400 border border-green-500/20 rounded-lg transition-colors" title="Enviar WhatsApp" onClick={(e) => e.stopPropagation()}>
                           {/* Using a generic SVG path for WhatsApp if icon isn't imported, or simple text. Assuming Phone icon is not available, I'll use text for now to avoid broken imports. To be safe, I'm just putting an emoji or simply 'WA'. Actually, let me check the imports. */}
                           <span className="text-[10px] uppercase font-bold px-1">WA</span>
                         </button>
                         <div className={`px-3 py-1 rounded-full text-[10px] font-medium tracking-wide uppercase ${app.status === 'confirmed' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/50' : 'bg-amber-500/20 text-amber-400 border border-amber-500/50'}`}>
                            {app.status === 'confirmed' ? 'Confirmado' : 'Pendente'}
                         </div>
                     </div>
                  </motion.div>
                )})}
             </AnimatePresence>
          </div>
       </div>

      </div>

      {/* NOTIFICATIONS SIDEBAR */}
      <div className="w-80 flex flex-col bg-[#0C1627] border border-[#1A2C47] rounded-2xl overflow-hidden shrink-0 shadow-xl h-full hidden lg:flex">
         <div className="p-4 border-b border-[#1A2C47] bg-[#09111D] flex justify-between items-center">
            <h3 className="font-semibold text-white tracking-tight flex items-center gap-2">
               <Clock className="w-4 h-4 text-purple-400" />
               Feed em Tempo Real
            </h3>
            <span className="bg-red-500/20 text-red-400 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-widest border border-red-500/50 animate-pulse">Ao Vivo</span>
         </div>
         <div className="p-4 overflow-y-auto flex-1 space-y-3 hide-scrollbar relative">
            <div className="absolute top-0 left-6 bottom-0 w-px bg-white/5" />
            
            <div className="relative pl-6">
               <div className="absolute left-[-5px] top-1 w-3 h-3 bg-emerald-500 rounded-full border border-black shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
               <p className="text-xs text-slate-500 uppercase font-semibold tracking-wider mb-1">Há 2 min</p>
               <div className="bg-[#15233A] border border-emerald-500/20 p-3 rounded-xl">
                  <p className="text-sm text-slate-200"><strong>Ana Paula</strong> acaba de confirmar seu agendamento (Corte + Escova) via WhatsApp.</p>
               </div>
            </div>

            <div className="relative pl-6">
               <div className="absolute left-[-5px] top-1 w-3 h-3 bg-blue-500 rounded-full border border-black shadow-[0_0_10px_rgba(59,130,246,0.5)]" />
               <p className="text-xs text-slate-500 uppercase font-semibold tracking-wider mb-1">Há 15 min</p>
               <div className="bg-[#15233A] border border-white/5 p-3 rounded-xl">
                  <p className="text-sm text-slate-200">Novo agendamento recebido via Link: <strong>Carlos Santos</strong> às 16:00.</p>
               </div>
            </div>

            <div className="relative pl-6 opacity-60">
               <div className="absolute left-[-5px] top-1 w-3 h-3 bg-purple-500 rounded-full border border-black" />
               <p className="text-xs text-slate-500 uppercase font-semibold tracking-wider mb-1">Há 1 hora</p>
               <div className="bg-[#15233A] border border-white/5 p-3 rounded-xl">
                  <p className="text-sm text-slate-200">A Automação de Churn enviou mensagem para <strong>3 clientes inativos</strong>.</p>
               </div>
            </div>

            <div className="relative pl-6 opacity-60">
               <div className="absolute left-[-5px] top-1 w-3 h-3 bg-amber-500 rounded-full border border-black" />
               <p className="text-xs text-slate-500 uppercase font-semibold tracking-wider mb-1">Ontem</p>
               <div className="bg-[#15233A] border border-white/5 p-3 rounded-xl">
                  <p className="text-sm text-slate-200"><strong>Beatriz Lima</strong> respondeu a avaliação do atendimento com nota 5.</p>
               </div>
            </div>
         </div>
      </div>

    </div>
  )
}
