import React, { useState, useEffect } from 'react';
import { useNicheStore } from '../store/niche';
import { useCatalogStore } from '../store/catalog';
import { useAppointmentStore } from '../store/appointments';
import { useProfessionalStore } from '../store/professionals';
import { Globe, Copy, ExternalLink, Share2, Palette, Box, Check, ArrowLeft, Calendar as CalendarIcon, User, ChevronRight, Sparkles, Smile, Trash2, Loader2 } from 'lucide-react';
import { toast, Toaster } from 'sonner';
import { db, auth } from '../lib/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';

export default function Online({ publicMode = false }: { publicMode?: boolean }) {
  const { currentNiche, setNiche, getConfig } = useNicheStore();
  const config = getConfig();

  const { items, setItems } = useCatalogStore();
  const { addAppointment } = useAppointmentStore();
  const { professionals } = useProfessionalStore();

  const isActuallyPublic = publicMode || window.location.pathname === '/menu-view';
  const urlParams = new URLSearchParams(window.location.search);
  const merchantIdParam = urlParams.get('merchant');
  const nicheParam = urlParams.get('niche');

  const [activeColor, setActiveColor] = useState('#3b82f6');
  const [allowAutoRegister, setAllowAutoRegister] = useState(true);
  const [onlinePayments, setOnlinePayments] = useState(true);
  const [loading, setLoading] = useState(false);

  // Load custom niche if specified in public URL
  useEffect(() => {
    if (nicheParam) {
      setNiche(nicheParam as any);
    }
  }, [nicheParam, setNiche]);

  // Load catalog in public mode if unauthenticated or visiting public route
  useEffect(() => {
    let isSubscribed = true;
    const fetchPublicCatalog = async () => {
      const merchantUid = merchantIdParam || localStorage.getItem('last_merchant_uid') || 'public';
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
    };

    if (isActuallyPublic) {
      fetchPublicCatalog();
    }
  }, [setItems, isActuallyPublic, merchantIdParam]);

  // Mobile WebApp Simulator UI State
  const [previewScreen, setPreviewScreen] = useState<'catalog' | 'cart' | 'booking' | 'success'>('catalog');
  const [cart, setCart] = useState<any[]>([]);
  const [selectedPro, setSelectedPro] = useState('Sem Preferência');
  const [selectedDay, setSelectedDay] = useState('Amanhã');
  const [selectedTime, setSelectedTime] = useState('10:00');
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');

  const merchantUid = (!auth.currentUser || auth.currentUser.isAnonymous) 
    ? (merchantIdParam || localStorage.getItem('last_merchant_uid') || 'public') 
    : (auth.currentUser.uid);

  const handleCopyLink = () => {
    const url = `${window.location.origin}/menu-view?merchant=${merchantUid}&niche=${config.type}`;
    navigator.clipboard.writeText(url);
    toast.success('Link do Catálogo copiado para área de transferência!');
  };

  // Niche Fallback Services if Catalog DB is empty
  const defaultNicheServices: Record<string, Array<{ name: string; price: number; duration: string }>> = {
    barbershop: [
      { name: 'Corte Degradê Navalhado', price: 45, duration: '30 min' },
      { name: 'Barboterapia Toalha Quente', price: 35, duration: '40 min' },
      { name: 'Sobrancelha Navalha', price: 15, duration: '15 min' }
    ],
    clinic: [
      { name: 'Limpeza de Pele Profunda', price: 120, duration: '60 min' },
      { name: 'Drenagem Linfática Corporal', price: 150, duration: '50 min' },
      { name: 'Peeling Químico', price: 190, duration: '45 min' }
    ],
    salon: [
      { name: 'Escova + Hidratação Absoluta', price: 110, duration: '60 min' },
      { name: 'Pé e Mão Completo', price: 75, duration: '75 min' },
      { name: 'Corte Feminino Premium', price: 120, duration: '45 min' }
    ],
    tattoo: [
      { name: 'Sessão Flash Art (Até 7cm)', price: 180, duration: '60 min' },
      { name: 'Piercing Orelha incluso joia', price: 90, duration: '20 min' },
      { name: 'Aplicação de Anestésico Tópico', price: 50, duration: '15 min' }
    ],
    spa: [
      { name: 'Massagem Relaxante Clássica', price: 160, duration: '50 min' },
      { name: 'Terapia das Pedras Quentes', price: 210, duration: '80 min' },
      { name: 'Banho de Ofurô de Lavanda', price: 250, duration: '60 min' }
    ]
  };

  const currentNicheType = config.type || 'barbershop';
  const realServices = items.filter(i => i.type === 'service');
  
  // Use real catalog items if they exist, otherwise load template services
  const displayCatalog = realServices.length > 0 
    ? realServices 
    : defaultNicheServices[currentNicheType].map((s, idx) => ({
        id: `tpl-${currentNicheType}-${idx}`,
        name: s.name,
        price: s.price,
        duration: s.duration
      }));

  const addToCart = (product: any) => {
    // Avoid duplicates in simplified demo cart
    if (cart.some(i => i.id === product.id)) {
      toast.info('Este serviço já está na sua sacola de agendamento.');
      return;
    }
    setCart([...cart, product]);
    toast.success(`${product.name} adicionado ao carrinho!`);
  };

  const removeFromCart = (productId: string) => {
    setCart(cart.filter(i => i.id !== productId));
  };

  const handleBookNow = async () => {
    if (!clientName || !clientPhone) {
      toast.error('Informe seu Nome e Celular para confirmar.');
      return;
    }

    const compiledServiceNames = cart.map(i => i.name).join(', ');
    const toastId = toast.loading('Processando seu agendamento...');
    
    try {
      // Create live appointment linked back to Agenda
      await addAppointment({
        id: `online-${Date.now()}`,
        client: clientName,
        clientPhone: clientPhone,
        service: compiledServiceNames,
        time: selectedTime,
        date: new Date().toISOString().split('T')[0], // Book for today/tomorrow
        employee: selectedPro,
        status: 'pending'
      });

      toast.success('Agendamento Enviado com Sucesso!', {
        id: toastId,
        description: 'As automações de confirmação foram encaminhadas via WhatsApp.'
      });

      setPreviewScreen('success');
    } catch (error: any) {
      console.error(error);
      toast.error(`Erro ao salvar agendamento: ${error.message || error}`, { id: toastId });
    }
  };

  const resetSimulator = () => {
    setCart([]);
    setClientName('');
    setClientPhone('');
    setSelectedPro('Sem Preferência');
    setPreviewScreen('catalog');
  };

  const cartTotal = cart.reduce((sum, i) => sum + i.price, 0);

  const renderMobileMenu = () => {
     return (
        <div className="flex-1 flex flex-col h-full bg-[#030712] relative overflow-hidden text-white font-sans">
           {loading ? (
              <div className="flex-1 flex flex-col items-center justify-center p-4">
                 <Loader2 className="w-8 h-8 text-blue-500 animate-spin mb-2" />
                 <p className="text-xs text-slate-400">Sincronizando catálogo...</p>
              </div>
           ) : (
              <>
                 {previewScreen === 'catalog' && (
                    <div className="flex flex-col h-full relative overflow-y-auto pb-20">
                       {/* Banner */}
                       <div className="p-5 text-center text-white relative flex flex-col items-center justify-center border-b border-white/5" style={{ backgroundColor: activeColor }}>
                          <Sparkles className="w-5 h-5 absolute top-4 right-4 text-white/50 animate-pulse" />
                          <h4 className="text-lg font-bold tracking-tight">{config.title}</h4>
                          <p className="text-[11px] opacity-90 mt-1 uppercase tracking-wider font-semibold">Agende Online</p>
                       </div>

                       <div className="p-3 text-xs font-bold text-slate-400 uppercase tracking-widest px-4 pt-4">Nossos Serviços</div>
                       <div className="p-3 px-4 space-y-3 flex-1 overflow-y-auto">
                          {displayCatalog.map((item: any) => (
                             <div 
                                key={item.id} 
                                onClick={() => addToCart(item)}
                                className="bg-[#121A2E]/80 border border-white/5 rounded-xl p-3 shadow hover:border-white/20 transition-all cursor-pointer flex items-center gap-3 relative group"
                             >
                                <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center"><Box className="w-5 h-5 text-slate-300" /></div>
                                <div className="flex-1 min-w-0">
                                   <h5 className="font-bold text-white text-xs truncate">{item.name}</h5>
                                   <div className="flex items-center gap-2 mt-1">
                                      <span className="text-xs font-bold" style={{ color: activeColor }}>R$ {item.price?.toFixed(2)}</span>
                                      <span className="text-[10px] text-slate-500">⏱ {item.duration || '30 min'}</span>
                                   </div>
                                </div>
                                <div className="w-7 h-7 rounded-lg bg-white/5 group-hover:bg-cyan-500/10 flex items-center justify-center text-slate-400 group-hover:text-cyan-400 text-lg font-light transition-all">+</div>
                             </div>
                          ))}
                       </div>

                       {cart.length > 0 && (
                          <div className="absolute bottom-4 left-4 right-4 z-20">
                             <button 
                                onClick={() => setPreviewScreen('cart')}
                                className="w-full py-3.5 rounded-xl font-bold text-xs text-white shadow-xl flex items-center justify-center gap-2 border border-white/10 hover:brightness-110 transition-all cursor-pointer"
                                style={{ backgroundColor: activeColor }}
                             >
                                Carrinho ({cart.length}) • R$ {cartTotal.toFixed(2)}
                             </button>
                          </div>
                       )}
                    </div>
                 )}

                 {previewScreen === 'cart' && (
                    <div className="flex flex-col h-full bg-[#030712]">
                       <div className="p-4 bg-[#080E1C] border-b border-white/5 flex items-center gap-3">
                          <button onClick={() => setPreviewScreen('catalog')} className="text-slate-400 hover:text-white p-1 rounded hover:bg-white/5 cursor-pointer">
                             <ArrowLeft className="w-5 h-5" />
                          </button>
                          <h4 className="text-sm font-bold text-white flex-1">Sua Sacola</h4>
                          <button onClick={() => setCart([])} className="text-slate-500 hover:text-red-400 p-1 rounded hover:bg-white/5 cursor-pointer" title="Limpar tudo">
                             <Trash2 className="w-4 h-4" />
                          </button>
                       </div>

                       <div className="flex-1 p-4 overflow-y-auto space-y-3">
                          {cart.map((item) => (
                             <div key={item.id} className="bg-[#121A2E]/80 border border-white/5 p-3 rounded-xl flex items-center justify-between">
                                <div>
                                   <h5 className="text-xs font-bold text-white">{item.name}</h5>
                                   <span className="text-xs font-bold mt-1 block" style={{ color: activeColor }}>R$ {item.price?.toFixed(2)}</span>
                                </div>
                                <button 
                                  onClick={(e) => { e.stopPropagation(); removeFromCart(item.id); }} 
                                  className="text-slate-600 hover:text-red-400 p-1.5 hover:bg-white/5 rounded cursor-pointer"
                                >
                                   ✕
                                </button>
                             </div>
                          ))}

                          {cart.length === 0 && (
                             <div className="text-center py-20">
                                <Smile className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                                <p className="text-slate-500 text-xs">Sua sacola está vazia.</p>
                                <button onClick={() => setPreviewScreen('catalog')} className="text-xs text-cyan-400 underline font-bold mt-2 inline-block cursor-pointer">Procurar Serviços</button>
                             </div>
                          )}
                       </div>

                       {cart.length > 0 && (
                          <div className="p-4 bg-[#080E1C] border-t border-white/5 space-y-3">
                             <div className="flex justify-between text-xs font-semibold text-slate-300">
                                <span>Subtotal:</span>
                                <span className="text-white font-bold">R$ {cartTotal.toFixed(2)}</span>
                             </div>
                             <button 
                                onClick={() => setPreviewScreen('booking')}
                                className="w-full py-3 rounded-xl text-xs font-bold text-white flex items-center justify-center gap-1.5 transition-all hover:brightness-110 cursor-pointer"
                                style={{ backgroundColor: activeColor }}
                             >
                                <CalendarIcon className="w-4 h-4" /> Agendar Horário Online
                             </button>
                          </div>
                       )}
                    </div>
                 )}

                 {previewScreen === 'booking' && (
                    <div className="flex flex-col h-full bg-[#030712] overflow-y-auto pb-4">
                       <div className="p-4 bg-[#080E1C] border-b border-white/5 flex items-center gap-3">
                          <button onClick={() => setPreviewScreen('cart')} className="text-slate-400 hover:text-white p-1 rounded hover:bg-white/5 cursor-pointer">
                             <ArrowLeft className="w-5 h-5" />
                          </button>
                          <h4 className="text-sm font-bold text-white flex-1">Escolher Dia & Hora</h4>
                       </div>

                       <div className="p-4 space-y-4">
                          {/* Select Professional */}
                          <div>
                             <label className="text-[10px] text-slate-400 block mb-1.5 uppercase font-bold tracking-wider">Profissional:</label>
                             <div className="grid grid-cols-2 gap-2">
                                {['Sem Preferência', professionals[0]?.name || 'Ana Silva'].map(pro => (
                                   <button 
                                      key={pro}
                                      type="button"
                                      onClick={() => setSelectedPro(pro)}
                                      className={`py-2 px-3 text-left rounded-lg text-xs font-semibold border truncate transition-all cursor-pointer ${
                                         selectedPro === pro 
                                         ? 'bg-blue-600/10 border-blue-500 text-blue-400' 
                                         : 'bg-[#121A2E]/80 border-white/5 text-slate-300'
                                      }`}
                                   >
                                      {pro}
                                   </button>
                                ))}
                             </div>
                          </div>

                          {/* Day Select */}
                          <div>
                             <label className="text-[10px] text-slate-400 block mb-1.5 uppercase font-bold tracking-wider">Selecione o Dia:</label>
                             <div className="flex gap-2">
                                {['Hoje', 'Amanhã', 'Qua', 'Qui'].map(day => (
                                   <button 
                                      key={day}
                                      type="button"
                                      onClick={() => setSelectedDay(day)}
                                      className={`flex-1 py-2 text-center rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                                         selectedDay === day 
                                         ? 'bg-blue-600/10 border-blue-500 text-blue-400' 
                                         : 'bg-[#121A2E]/80 border-white/5 text-slate-300'
                                      }`}
                                   >
                                      {day}
                                   </button>
                                ))}
                             </div>
                          </div>

                          {/* Time Slots */}
                          <div>
                             <label className="text-[10px] text-slate-400 block mb-1.5 uppercase font-bold tracking-wider">Horários Disponíveis:</label>
                             <div className="grid grid-cols-3 gap-1.5">
                                {['09:00', '10:00', '11:00', '14:00', '15:30', '17:00'].map(t => (
                                   <button 
                                      key={t}
                                      type="button"
                                      onClick={() => setSelectedTime(t)}
                                      className={`py-2 text-center rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                                         selectedTime === t 
                                         ? 'bg-blue-600/10 border-blue-500 text-blue-400' 
                                         : 'bg-[#121A2E]/80 border-white/5 text-slate-300'
                                      }`}
                                   >
                                      {t}
                                   </button>
                                ))}
                             </div>
                          </div>

                          {/* User Details */}
                          <div className="border-t border-white/5 pt-3 space-y-2">
                             <div>
                                <label className="text-[10px] text-slate-400 block mb-1 uppercase font-bold tracking-wider">Seu Nome:</label>
                                <input 
                                   type="text" 
                                   value={clientName}
                                   onChange={(e) => setClientName(e.target.value)}
                                   placeholder="Ex: João da Silva"
                                   className="w-full bg-[#121A2E]/80 border border-white/5 text-xs rounded-lg p-2 px-3 text-white outline-none focus:border-blue-500 transition-colors"
                                />
                             </div>
                             <div>
                                <label className="text-[10px] text-slate-400 block mb-1 uppercase font-bold tracking-wider">Seu WhatsApp / Celular:</label>
                                <input 
                                   type="tel" 
                                   value={clientPhone}
                                   onChange={(e) => setClientPhone(e.target.value)}
                                   placeholder="Ex: (11) 99888-7766"
                                   className="w-full bg-[#121A2E]/80 border border-white/5 text-xs rounded-lg p-2 px-3 text-white outline-none focus:border-blue-500 transition-colors"
                                />
                             </div>
                          </div>

                          {/* Book Trigger Button */}
                          <button 
                             onClick={handleBookNow}
                             className="w-full py-3.5 rounded-xl font-bold text-xs text-white shadow-xl flex items-center justify-center gap-1.5 transition-all hover:brightness-110 mt-2 cursor-pointer"
                             style={{ backgroundColor: activeColor }}
                          >
                             <Check className="w-4 h-4" /> Confirmar Meu Horário
                          </button>
                       </div>
                    </div>
                 )}

                 {previewScreen === 'success' && (
                    <div className="flex flex-col h-full bg-[#030712] p-6 text-center justify-center">
                       <div className="w-14 h-14 bg-emerald-500/25 rounded-full flex items-center justify-center text-emerald-400 mx-auto mb-4 animate-bounce">
                          <Check className="w-8 h-8" />
                       </div>
                       
                       <h4 className="text-base font-bold text-white mb-1">Horário Marcado!</h4>
                       <p className="text-xs text-slate-400 mb-6 leading-relaxed">Seu agendamento foi registrado com sucesso e está agendado em nosso banco de dados central.</p>

                       <div className="bg-[#121A2E]/80 border border-white/5 p-4 rounded-xl text-left text-xs mb-8 space-y-1.5">
                          <div className="text-slate-400 uppercase text-[9px] font-bold tracking-wider">AGENDAMENTO ONLINE</div>
                          <div className="text-white font-bold text-xs truncate">📦 {cart.map(i => i.name).join(', ')}</div>
                          <div className="text-slate-300">📅 Dia: <span className="text-white font-semibold">{selectedDay} • {selectedTime}</span></div>
                          <div className="text-slate-300">👤 Profissional: <span className="text-white font-semibold">{selectedPro}</span></div>
                       </div>

                       <button 
                          onClick={resetSimulator}
                          className="w-full py-3 rounded-xl border border-white/10 text-slate-300 font-bold hover:bg-white/5 text-xs transition-colors cursor-pointer"
                       >
                          Voltar ao Menu
                       </button>
                    </div>
                 )}
              </>
           )}
        </div>
     );
  };

  const currentPublicLink = `${window.location.origin}/menu-view?merchant=${merchantUid}&niche=${config.type}`;

  if (isActuallyPublic) {
    return (
      <div className="fixed inset-0 z-50 bg-[#05070F] flex flex-col items-center justify-center md:p-6 overflow-hidden">
        <Toaster theme="dark" position="top-right" />
        <div className="w-full h-full md:max-w-[400px] md:h-[800px] md:rounded-[40px] md:border-[12px] md:border-[#1E293B] md:shadow-2xl overflow-hidden relative bg-[#030712] flex flex-col">
          {renderMobileMenu()}
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-8 relative h-full bg-[#050B14]">
      <div className="max-w-5xl mx-auto">
        <div className="mb-0">
           <h1 className="text-3xl font-display font-semibold tracking-tight text-white mb-2">Catálogo & Agendamento Online</h1>
           <p className="text-slate-400 font-medium">Personalize seu link público para clientes acessarem seus serviços e realizarem o autoagendamento online.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
           <div className="space-y-6">
              <div className="bg-[#0C1627] border border-[#1A2C47] rounded-2xl p-6">
                 <h2 className="text-lg font-semibold text-white mb-4">Seu Link Público Real</h2>
                 
                 <div className="flex items-center gap-3 mb-6">
                    <div className="flex-1 bg-[#050B14] border border-[#1A2C47] rounded-lg px-4 py-3 text-slate-300 font-mono text-sm truncate select-all">
                       {currentPublicLink}
                    </div>
                    <button onClick={handleCopyLink} className="p-3 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors cursor-pointer" title="Copiar Link">
                       <Copy className="w-5 h-5" />
                    </button>
                    <a 
                      href={currentPublicLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-3 border border-[#1A2C47] hover:bg-[#1A2C47]/50 text-white rounded-lg transition-colors flex items-center justify-center"
                      title="Abrir Link"
                    >
                       <ExternalLink className="w-5 h-5" />
                    </a>
                 </div>

                 <div className="space-y-4 border-t border-[#1A2C47] pt-6">
                    <h3 className="text-sm font-medium text-slate-300 flex items-center gap-2">
                       <Palette className="w-5 h-5 text-cyan-400 animate-pulse" /> 
                       Paleta de Cores do Menu
                    </h3>
                    
                    <div>
                       <label className="text-xs text-slate-400 block mb-2">Escolha a cor de acentuação do WebApp do Cliente:</label>
                       <div className="flex gap-3">
                          {[
                            { hex: '#3b82f6', name: 'Original Blue' },
                            { hex: '#10b981', name: 'Emerald' },
                            { hex: '#f59e0b', name: 'Golden Amber' },
                            { hex: '#ec4899', name: 'Lovely Pink' },
                            { hex: '#8b5cf6', name: 'Amethyst Purple' }
                          ].map(color => (
                             <div 
                                key={color.hex} 
                                onClick={() => {
                                  setActiveColor(color.hex);
                                  toast.success(`Paleta ${color.name} aplicada ao preview!`);
                                }}
                                className={`w-10 h-10 rounded-full cursor-pointer border-4 transition-all duration-300 flex items-center justify-center ${
                                  activeColor === color.hex ? 'border-white scale-110 shadow-md' : 'border-transparent opacity-70 hover:opacity-150'
                                }`} 
                                style={{ backgroundColor: color.hex }}
                             >
                               {activeColor === color.hex && <Check className="w-4 h-4 text-white" />}
                             </div>
                          ))}
                       </div>
                    </div>
                 </div>

                 <div className="space-y-4 border-t border-[#1A2C47] pt-6 mt-6">
                    <h3 className="text-sm font-medium text-slate-300 flex items-center gap-2"><Box className="w-5 h-5 text-emerald-400" /> Regras de Negócio e Pedidos</h3>
                    
                    <label className="flex items-center gap-3 p-3.5 border border-[#1A2C47] rounded-xl cursor-pointer hover:border-emerald-500/50 transition-colors">
                       <input 
                         type="checkbox" 
                         checked={onlinePayments} 
                         onChange={(e) => setOnlinePayments(e.target.checked)}
                         className="accent-emerald-500 w-4 h-4" 
                       />
                       <div className="text-sm text-white">Aceitar pagamentos online antecipados (Pix/Cartão)</div>
                    </label>
                    
                    <label className="flex items-center gap-3 p-3.5 border border-[#1A2C47] rounded-xl cursor-pointer hover:border-[#3b82f6]/50 transition-colors">
                       <input 
                         type="checkbox" 
                         checked={allowAutoRegister} 
                         onChange={(e) => setAllowAutoRegister(e.target.checked)}
                         className="accent-blue-500 w-4 h-4" 
                       />
                       <div className="text-sm text-white">Permitir auto-agendamento e criar o cliente no CRM</div>
                    </label>
                 </div>

              </div>
           </div>

           {/* Mobile Interactive Simulator */}
           <div className="bg-[#0C1627] border border-[#1A2C47] rounded-2xl overflow-hidden flex flex-col relative h-[680px] shadow-2xl shadow-blue-900/10">
              <div className="bg-[#050B14] p-3 text-center text-xs text-slate-400 border-b border-[#1A2C47] font-mono flex items-center justify-between">
                 <div className="flex items-center gap-2 font-semibold">
                    <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-ping"></span>
                    Simulador do Celular do Cliente
                 </div>
                 <div className="text-[10px] bg-white/5 py-1 px-2 rounded font-sans text-slate-300">Dispositivo Virtual</div>
              </div>

              <div className="flex-1 overflow-y-auto hide-scrollbar bg-slate-900/60 p-4 flex items-center justify-center">
                 <div className="w-[325px] h-[580px] bg-[#0E1726] rounded-3xl shadow-2xl border-[6px] border-slate-700/80 overflow-hidden relative flex flex-col shadow-cyan-950/20">
                    {renderMobileMenu()}
                 </div>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}
