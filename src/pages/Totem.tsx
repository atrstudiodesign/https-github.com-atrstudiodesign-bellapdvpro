import React, { useState, useEffect } from 'react';
import { useNicheStore } from '../store/niche';
import { useCatalogStore } from '../store/catalog';
import { useAppointmentStore } from '../store/appointments';
import { useQueueStore } from '../store/queue';
import { Smartphone, MonitorPlay, QrCode, CreditCard, ChevronRight, CheckCircle2, ArrowLeft, Printer, Box, Check, Sparkles, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast, Toaster } from 'sonner';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuthStore } from '../store/auth';

export default function Totem({ publicMode = false }: { publicMode?: boolean }) {
  const { getConfig } = useNicheStore();
  const config = getConfig();
  const isDemo = useAuthStore(state => state.user?.isDemo === true);
  const { items, setItems } = useCatalogStore();
  const { addAppointment } = useAppointmentStore();
  const { addQueueItem } = useQueueStore();

  const isActuallyPublic = publicMode || window.location.pathname === '/totem-view';

  const [activeScreen, setActiveScreen] = useState<'config' | 'preview'>(isActuallyPublic ? 'preview' : 'config');
  const [totemMode, setTotemMode] = useState('Check-in / Fila de Espera');
  const [loading, setLoading] = useState(false);

  // Shared Kiosk Interactive State
  const [kioskStep, setKioskStep] = useState<'welcome' | 'indent' | 'services' | 'printing' | 'ticket'>('welcome');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [selectedService, setSelectedService] = useState<any>(null);
  const [ticketNumber, setTicketNumber] = useState('A-001');

  // Load catalog and niche in public mode from URL query parameters or fallback
  useEffect(() => {
    const authInstance = getAuth();
    let isSubscribed = true;

    const urlParams = new URLSearchParams(window.location.search);
    const searchNiche = urlParams.get('niche');
    if (searchNiche) {
      useNicheStore.getState().setNiche(searchNiche as any);
    }

    const unsubscribeAuth = onAuthStateChanged(authInstance, async (firebaseUser) => {
      // If unauthenticated or in public mode, load via the URL parameter or the last known merchant's ID stored in localStorage
      if (!firebaseUser || isActuallyPublic) {
        const merchantUid = urlParams.get('merchant') || localStorage.getItem('last_merchant_uid') || 'public';
        if (merchantUid !== 'public') {
          setLoading(true);
          try {
            const q = query(collection(db, 'catalog'), where('ownerId', '==', merchantUid));
            const snapshot = await getDocs(q);
            if (isSubscribed) {
              const catalogItems = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
              setItems(catalogItems);
            }
          } catch (err) {
            console.error('Error fetching public catalog:', err);
          } finally {
            if (isSubscribed) setLoading(false);
          }
        }
      }
    });

    return () => {
      isSubscribed = false;
      unsubscribeAuth();
    };
  }, [setItems, isActuallyPublic]);

  // Niche Fallback Services if Catalog DB is empty
  const defaultNicheServices: Record<string, Array<{ id: string; name: string; price: number; duration: string }>> = {
    barbershop: [
      { id: 'tot-s1', name: 'Corte Degradê Moderno', price: 45, duration: '30 min' },
      { id: 'tot-s2', name: 'Barba Toalha Quente', price: 35, duration: '40 min' },
      { id: 'tot-s3', name: 'Sobrancelha na Navalha', price: 15, duration: '15 min' }
    ],
    clinic: [
      { id: 'tot-s1', name: 'Limpeza de Pele Profunda', price: 120, duration: '60 min' },
      { id: 'tot-s2', name: 'Drenagem Linfática Corporal', price: 150, duration: '50 min' },
      { id: 'tot-s3', name: 'Peeling Químico Express', price: 190, duration: '45 min' }
    ],
    salon: [
      { id: 'tot-s1', name: 'Escova + Hidratação Absoluta', price: 110, duration: '60 min' },
      { id: 'tot-s2', name: 'Pé e Mão Completo', price: 75, duration: '75 min' },
      { id: 'tot-s3', name: 'Corte Feminino Premium', price: 120, duration: '45 min' }
    ],
    tattoo: [
      { id: 'tot-s1', name: 'Sessão Flash Art (Até 7cm)', price: 180, duration: '60 min' },
      { id: 'tot-s2', name: 'Piercing Orelha incluso joia', price: 90, duration: '20 min' },
      { id: 'tot-s3', name: 'Aplicação de Anestésico Tópico', price: 50, duration: '15 min' }
    ],
    spa: [
      { id: 'tot-s1', name: 'Massagem Relaxante Clássica', price: 160, duration: '50 min' },
      { id: 'tot-s2', name: 'Terapia das Pedras Quentes', price: 210, duration: '80 min' },
      { id: 'tot-s3', name: 'Banho de Ofurô de Lavanda', price: 250, duration: '60 min' }
    ]
  };

  const currentNicheType = config.type || 'barbershop';
  const realCatalogServices = items.filter(i => i.type === 'service');
  
  const displayServices = realCatalogServices.length > 0 
    ? realCatalogServices.map(i => ({ id: i.id, name: i.name, price: i.price, duration: i.duration || '30 min' }))
    : (isDemo ? defaultNicheServices[currentNicheType] : []);

  const handleStartTotem = () => {
    setKioskStep('indent');
  };

  const handleIdentifySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName || !customerPhone) {
      toast.error('Por favor, informe seu Nome e Celular para prosseguir.');
      return;
    }
    setKioskStep('services');
  };

  const handleSelectService = async (service: any) => {
    setSelectedService(service);
    setKioskStep('printing');

    const codeLetter = currentNicheType === 'barbershop' ? 'B' : currentNicheType === 'salon' ? 'S' : 'A';
    const seq = Math.floor(Math.random() * 100) + 10;
    const generatedTicket = `${codeLetter}-${seq}`;
    setTicketNumber(generatedTicket);

    // Save selection directly into 'queue' collection in Firestore (bypassing auth)
    try {
      await addQueueItem({
        clientName: customerName,
        clientPhone: customerPhone,
        serviceId: service.id,
        serviceName: service.name,
        estimatedWaitMinutes: Math.floor(Math.random() * 15) + 5,
        professionalId: 'sem-pref',
        professionalName: 'Sem Preferência'
      });
    } catch (err) {
      console.error('Error saving queue selection:', err);
    }

    // Simulate printer feedback and proceed to printed ticket
    setTimeout(() => {
      setKioskStep('ticket');

      // Also create a pending appointment for shared state visual sync
      addAppointment({
        id: `totem-${Date.now()}`,
        client: customerName,
        clientPhone: customerPhone,
        service: service.name,
        time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        date: new Date().toISOString().split('T')[0],
        employee: 'Sem Preferência',
        status: 'pending'
      }).then(() => {
         toast.success('Senha de autoatendimento registrada na Fila de Espera!');
      });
    }, 2000);
  };

  const handleResetKiosk = () => {
    setCustomerName('');
    setCustomerPhone('');
    setSelectedService(null);
    setKioskStep('welcome');
  };

  // Shared Touch Layout UI Renderer
  const renderSharedKioskUI = (isPopup: boolean) => {
    return (
      <div className="w-full h-full flex flex-col bg-slate-950 font-sans text-slate-100 overflow-y-auto">
        {loading && (
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
            <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
          </div>
        )}
        <AnimatePresence mode="wait">
          {kioskStep === 'welcome' && (
            <motion.div 
              key="welcome"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="flex-1 flex flex-col items-center justify-center p-6 text-center"
            >
              <div className="w-24 h-24 bg-cyan-500/10 text-cyan-400 rounded-full flex items-center justify-center mb-6 shadow-2xl relative border border-cyan-500/25">
                 <Smartphone className="w-10 h-10 animate-bounce" />
                 <Sparkles className="w-5 h-5 text-yellow-400 absolute top-0 right-0 animate-pulse" />
              </div>

              <h2 className={`font-bold text-white tracking-tight ${isPopup ? 'text-4xl mb-4' : 'text-2xl mb-2'}`}>
                {config.title}
              </h2>
              <p className={`text-slate-400 max-w-md ${isPopup ? 'text-lg mb-10' : 'text-xs mb-6'}`}>
                Toque abaixo para fazer o seu Check-In, retirar uma senha ou solicitar um serviço na recepção.
              </p>

              <button 
                 onClick={handleStartTotem}
                 className={`w-full max-w-sm ${isPopup ? 'py-5 text-xl rounded-2xl' : 'py-3 text-sm rounded-xl'} bg-cyan-500 text-black font-bold uppercase tracking-wider shadow-[0_0_35px_rgba(6,182,212,0.4)] hover:scale-105 active:scale-95 transition-all cursor-pointer`}
              >
                 TOCAR PARA INICIAR
              </button>

              <div className="mt-8 flex items-center gap-1.5 text-slate-500 text-xs font-semibold">
                 <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                 Suporte a Autoatendimento Ativo
              </div>
            </motion.div>
          )}

          {kioskStep === 'indent' && (
            <motion.div 
              key="indent"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex-1 flex flex-col justify-center p-6"
            >
              <div className="flex items-center gap-3 mb-6">
                 <button onClick={handleResetKiosk} className="p-2 hover:bg-white/10 rounded-full text-slate-400">
                    <ArrowLeft className="w-5 h-5" />
                 </button>
                 <span className="text-xs uppercase font-bold text-slate-400 tracking-widest">Identificação</span>
              </div>

              <h3 className={`font-bold text-white mb-2 ${isPopup ? 'text-2xl' : 'text-lg'}`}>Insira seus dados</h3>
              <p className="text-xs text-slate-400 mb-6 font-medium">Precisamos do seu contato para atualizações sobre o seu status de atendimento.</p>

              <form onSubmit={handleIdentifySubmit} className="space-y-4">
                 <div>
                    <label className="text-[10px] text-slate-400 block mb-1 uppercase font-bold tracking-wider">Qual o seu Nome?</label>
                    <input 
                       type="text" 
                       required
                       value={customerName}
                       onChange={(e) => setCustomerName(e.target.value)}
                       placeholder="Ex: Roberto de Alencar"
                       className="w-full bg-[#121A2E]/80 border border-white/10 text-sm rounded-xl p-3 px-4 text-white outline-none focus:border-cyan-500 transition-colors"
                    />
                 </div>
                 <div>
                    <label className="text-[10px] text-slate-400 block mb-1 uppercase font-bold tracking-wider">Seu WhatsApp / Celular:</label>
                    <input 
                       type="tel" 
                       required
                       value={customerPhone}
                       onChange={(e) => setCustomerPhone(e.target.value)}
                       placeholder="Ex: (11) 98888-7766"
                       className="w-full bg-[#121A2E]/80 border border-white/10 text-sm rounded-xl p-3 px-4 text-white outline-none focus:border-cyan-500 transition-colors"
                    />
                 </div>

                 <button 
                    type="submit"
                    className="w-full py-4 bg-cyan-600 text-white font-bold text-sm tracking-wider rounded-xl hover:bg-cyan-500 transition-colors flex items-center justify-center gap-2 mt-6 uppercase shadow-lg shadow-cyan-900/20"
                 >
                    Continuar <ChevronRight className="w-4 h-4" />
                 </button>
              </form>
            </motion.div>
          )}

          {kioskStep === 'services' && (
            <motion.div 
              key="services"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex-1 flex flex-col justify-center p-6"
            >
              <div className="flex items-center gap-3 mb-6">
                 <button onClick={() => setKioskStep('indent')} className="p-2 hover:bg-white/10 rounded-full text-slate-400">
                    <ArrowLeft className="w-5 h-5" />
                 </button>
                 <span className="text-xs uppercase font-bold text-slate-400 tracking-widest">Escolha o serviço</span>
              </div>

              <h4 className="font-bold text-white mb-2 text-base">Olá, {customerName}!</h4>
              <p className="text-xs text-slate-400 mb-4 font-medium font-sans">Toque no serviço ou procedimento de sua preferência para emitir o seu bilhete de check-in:</p>

              <div className="space-y-3 max-h-[280px] overflow-y-auto pr-1">
                 {displayServices.map((service: any) => (
                    <div 
                       key={service.id}
                       onClick={() => handleSelectService(service)}
                       className="bg-[#121A2E]/80 border border-white/5 rounded-xl p-3 shadow hover:border-cyan-500/50 hover:bg-cyan-500/[0.02] cursor-pointer flex items-center justify-between transition-all group"
                    >
                       <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center group-hover:bg-cyan-500/10 transition-colors">
                             <Box className="w-5 h-5 text-slate-300 group-hover:text-cyan-400" />
                          </div>
                          <div>
                             <h5 className="font-bold text-white text-xs text-left">{service.name}</h5>
                             <span className="text-[10px] text-slate-500">⏱ {service.duration}</span>
                          </div>
                       </div>
                       <div className="text-right">
                          <span className="text-xs font-bold text-cyan-400 block">R$ {service.price?.toFixed(2)}</span>
                       </div>
                    </div>
                 ))}
                 {displayServices.length === 0 && (
                    <div className="text-center py-6">
                       <p className="text-xs text-slate-500">Nenhum serviço do catálogo disponível no momento.</p>
                    </div>
                 )}
              </div>
            </motion.div>
          )}

          {kioskStep === 'printing' && (
            <motion.div 
               key="printing"
               initial={{ opacity: 0, scale: 0.9 }}
               animate={{ opacity: 1, scale: 1 }}
               className="flex-1 flex flex-col items-center justify-center p-6 text-center"
            >
               <div className="w-16 h-16 bg-cyan-700/10 text-cyan-400 rounded-full flex items-center justify-center mb-6 animate-spin">
                  <Printer className="w-7 h-7" />
               </div>
               <h4 className="text-base font-bold text-white mb-2">Imprimindo sua Senha...</h4>
               <p className="text-xs text-slate-400 animate-pulse">Aguarde, sua via de atendimento está sendo gerada e sincronizada em tempo real.</p>
            </motion.div>
          )}

          {kioskStep === 'ticket' && (
            <motion.div 
               key="ticket"
               initial={{ opacity: 0, y: 30 }}
               animate={{ opacity: 1, y: 0 }}
               className="flex-1 flex flex-col justify-center p-6 text-center"
            >
               <div className="w-12 h-12 bg-emerald-500/10 text-emerald-400 rounded-full flex items-center justify-center mb-4 mx-auto">
                  <Check className="w-6 h-6 animate-bounce" />
               </div>

               <h4 className="text-base font-bold text-white mb-2">Check-In Realizado!</h4>
               <p className="text-xs text-slate-400 mb-6">Retire sua via impressa do totem e aguarde ser chamado no painel.</p>

               {/* Virtual Paper Ticket Animation */}
               <div className="bg-white text-slate-900 p-5 rounded-xl shadow-2xl text-left font-mono text-xs max-w-xs mx-auto mb-6 relative border-t-8 border-cyan-500 animate-slideUp">
                  <div className="absolute top-0 right-4 p-2 bg-slate-100 text-slate-500 text-[10px] uppercase tracking-wide">TOTEM</div>
                  <div className="text-center border-b border-dashed border-slate-300 pb-3 mb-3">
                     <h5 className="font-extrabold tracking-tight text-slate-800 text-sm">{config.title.toUpperCase()}</h5>
                     <p className="text-[10px] text-slate-500">Senha de Recepção</p>
                  </div>
                  
                  <div className="text-center py-4">
                     <span className="text-4xl font-extrabold tracking-widest text-cyan-600 font-mono">{ticketNumber}</span>
                  </div>

                  <div className="space-y-1.5 border-t border-dashed border-slate-300 pt-3 text-[10px]">
                     <div><span className="text-slate-400">Cliente:</span> <span className="font-bold text-slate-700">{customerName}</span></div>
                     <div><span className="text-slate-400">Serviço:</span> <span className="font-bold text-slate-700">{selectedService?.name}</span></div>
                     <div><span className="text-slate-400">Emissão:</span> <span className="font-bold text-slate-700">{new Date().toLocaleTimeString('pt-BR')}</span></div>
                  </div>
               </div>

               <button 
                  onClick={handleResetKiosk}
                  className="w-full py-3.5 bg-[#121A2E] hover:bg-white/5 border border-white/10 text-slate-300 font-bold text-xs uppercase tracking-wider rounded-xl transition-colors"
               >
                  Concluir e Voltar
               </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  };

  // If we are in publicMode, directly return the full-page tablet kiosk view without sidebars or tabs
  if (isActuallyPublic) {
    return (
      <div className="fixed inset-0 z-50 bg-slate-950 flex flex-col items-center justify-center p-4">
        <Toaster theme="dark" position="top-right" />
        <motion.div 
           initial={{ opacity: 0, scale: 0.95 }}
           animate={{ opacity: 1, scale: 1 }}
           className="max-w-2xl w-full h-[650px] bg-[#0E1726] rounded-3xl shadow-2xl border border-white/10 overflow-hidden relative flex flex-col shadow-cyan-950/20"
        >
          {renderSharedKioskUI(true)}
        </motion.div>
      </div>
    );
  }

  if (activeScreen === 'preview') {
    return (
       <div className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-center p-4">
          <button 
             onClick={() => setActiveScreen('config')} 
             className="absolute top-6 right-6 p-4 bg-white/10 hover:bg-red-600 text-white rounded-full transition-colors z-50 flex items-center gap-2 font-bold text-xs uppercase"
          >
             ✕ Sair do Kiosk
          </button>
          
          <motion.div 
             initial={{ opacity: 0, scale: 0.92 }}
             animate={{ opacity: 1, scale: 1 }}
             className="max-w-xl w-full h-[620px] bg-[#0E1726] rounded-[3rem] shadow-2xl border border-white/10 overflow-hidden relative flex flex-col shadow-cyan-950/20"
          >
            {renderSharedKioskUI(true)}
          </motion.div>
       </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-8 relative h-full bg-[#050B14]">
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
           <h1 className="text-3xl font-display font-semibold tracking-tight text-white mb-2">Totem de Autoatendimento</h1>
           <p className="text-slate-400 font-medium font-sans">Configure o modo Kiosk presencial para tabletes e monitores touch acoplados à sua recepção.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
           <div className="lg:col-span-1 space-y-6">
              <div className="bg-[#0C1627] border border-[#1A2C47] rounded-2xl p-6">
                 <h2 className="text-lg font-semibold text-white mb-4 font-sans">Configuração do Totem</h2>
                 
                 <div className="space-y-4">
                    <div>
                       <label className="text-sm font-medium text-slate-300 block mb-2 font-sans">Modo de Operação</label>
                       <select 
                         value={totemMode} 
                         onChange={(e) => setTotemMode(e.target.value)}
                         className="w-full bg-[#050B14] border border-[#1A2C47] text-white rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-cyan-500"
                       >
                           <option>Check-in / Fila de Espera</option>
                           <option>Pagamento Rápido (Auto-Checkout)</option>
                           <option>Catálogo + Pedidos</option>
                       </select>
                    </div>

                    <div>
                       <label className="text-sm font-medium text-slate-300 block mb-2 font-sans">Hardware Conectado</label>
                       <div className="space-y-2">
                           <label className="flex items-center gap-3 p-3 border border-[#1A2C47] rounded-lg cursor-pointer hover:border-cyan-500/50">
                              <input type="checkbox" defaultChecked className="accent-cyan-500" />
                              <div className="flex items-center gap-2 text-sm text-white">
                                 <CreditCard className="w-4 h-4 text-slate-400" />
                                 Maquininha de Cartão (TEF)
                              </div>
                           </label>
                           <label className="flex items-center gap-3 p-3 border border-[#1A2C47] rounded-lg cursor-pointer hover:border-cyan-500/50">
                              <input type="checkbox" defaultChecked className="accent-cyan-500" />
                              <div className="flex items-center gap-2 text-sm text-white">
                                 <QrCode className="w-4 h-4 text-slate-400" />
                                 Leitor de QR Code / Código de Barras
                              </div>
                           </label>
                       </div>
                    </div>

                    <div className="pt-4 space-y-3">
                       <button onClick={() => {
                          const id = toast.loading('Gerando link seguro...');
                          const url = `${window.location.origin}/totem-view?merchant=${getAuth().currentUser?.uid || localStorage.getItem('last_merchant_uid') || 'public'}&niche=${config.type}`;
                          setTimeout(() => {
                             navigator.clipboard.writeText(url);
                             toast.success('Link Seguro do Kiosk Copiado para Área de Transferência!', { id });
                          }, 1000);
                       }} className="w-full py-3 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-all cursor-pointer">
                          <CheckCircle2 className="w-5 h-5" />
                          Copiar Link Kiosk
                       </button>

                       <button onClick={() => {
                          toast.info('Entrando no Modo Kiosk em Tela Cheia!');
                          setActiveScreen('preview');
                       }} className="w-full py-3 bg-[#1A2C47] hover:bg-[#253B5C] text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-all cursor-pointer">
                          <MonitorPlay className="w-5 h-5" />
                          Testar em Tela Cheia
                       </button>
                    </div>
                 </div>
              </div>
           </div>

           <div className="lg:col-span-2">
              <div className="bg-slate-900 border border-[#1A2C47] rounded-3xl p-4 h-[630px] flex items-center justify-center relative overflow-hidden shadow-2xl">
                 {/* Tablet Frame Simulation */}
                 <div className="absolute inset-2 border-8 border-slate-800 rounded-[2rem] bg-slate-950 overflow-hidden flex flex-col justify-center shadow-lg">
                    {renderSharedKioskUI(false)}
                 </div>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}
