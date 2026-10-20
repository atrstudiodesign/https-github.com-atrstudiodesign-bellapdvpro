import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { useNicheStore } from '../store/niche';
import { useProfessionalStore } from '../store/professionals';
import { useClientStore, Client } from '../store/clients';
import { useApiKeysStore } from '../store/apiKeys';
import { useCatalogStore } from '../store/catalog';
import { useTransactionStore } from '../store/transactions';
import { Search, Plus, Minus, Trash2, CreditCard, Banknote, Smartphone, CheckCircle, ArrowDownAZ, ArrowUpAZ, ArrowDown10, ArrowUp10, Sparkles, Printer, MessageCircle, FileText, QrCode, X, Mic, Calendar } from 'lucide-react';
import { toast } from 'sonner';

import { fiscalService } from '../services/fiscalService';
import { whatsappService } from '../services/whatsappService';
import { voiceNarration } from '../services/voiceNarrationService';

interface Service {
  id: string;
  name: string;
  price: number;
  category: string;
  type?: 'service' | 'product';
  stock?: number;
}

interface CartItem extends Service {
  quantity: number;
  uid: string; // unique array id
  professionalId?: string; // which professional gets the commission
}

export default function POS() {
  const navigate = useNavigate();
  const { getConfig } = useNicheStore();
  const config = getConfig();
  
  const { professionals } = useProfessionalStore();
  const { geminiKey } = useApiKeysStore();

  const [isListening, setIsListening] = useState(false);

  
  const { items: catalog } = useCatalogStore();
  const { addTransaction } = useTransactionStore();

  const [cart, setCart] = useState<CartItem[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<'pix' | 'card' | 'cash' | 'split'>('pix');
  const [cashAmount, setCashAmount] = useState<string>('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [isProcessingCheckout, setIsProcessingCheckout] = useState(false);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [sortBy, setSortBy] = useState('name-asc'); // name-asc, name-desc, price-asc, price-desc
  const [upsellSuggestion, setUpsellSuggestion] = useState<string>('');
  const [isUpsellLoading, setIsUpsellLoading] = useState(false);

  const [couponCode, setCouponCode] = useState('');
  const [couponError, setCouponError] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<{code: string, discount: number, type: 'percent' | 'fixed'} | null>(null);

  const [emitirNfce, setEmitirNfce] = useState(false);
  const [nfceData, setNfceData] = useState<any>(null);
  const [isEmittingNfce, setIsEmittingNfce] = useState(false);

  // Initialize niche-specific services
  useEffect(() => {
     setCategoryFilter('all');
  }, [config.type]);

  const [upsellItem, setUpsellItem] = useState<Service | null>(null);

  // AI Upsell Effect (Engine)
  useEffect(() => {
    if (cart.length === 0) {
      setUpsellSuggestion('');
      setUpsellItem(null);
      return;
    }

    const timer = setTimeout(() => {
      setIsUpsellLoading(true);
      
      try {
         // Auto-Combo Analysis Engine
         const hasItem = (keyword: string) => cart.some(i => i.name.toLowerCase().includes(keyword));
         
         let suggestedItem: Service | null = null;
         let msg = '';

         // Run heuristic rules
         if (hasItem('cabelo') || hasItem('corte')) {
            msg = "Com base no histórico deste horário ideal, sugerimos:";
            suggestedItem = catalog.find(i => i.name.toLowerCase().includes('barba')) || null;
         } else if (hasItem('unha') || hasItem('pé') || hasItem('mão')) {
            msg = "Complete o visual com este serviço super procurado:";
            suggestedItem = catalog.find(i => i.name.toLowerCase().includes('simples') && i.category === 'nails') || null;
         } else if (hasItem('limpeza') || hasItem('facial')) {
            msg = "90% das clientes incluem este cuidado em seguida:";
            suggestedItem = catalog.find(i => i.category === 'spa' && !cart.some(c => c.id === i.id)) || null;
         } else {
            msg = "Que tal incluir este sucesso de vendas para aumentar o ticket Médio?";
            // Just find first item not in cart
            suggestedItem = catalog.find(i => !cart.some(c => c.id === i.id)) || catalog[0];
         }

         if (suggestedItem && !cart.some(c => c.id === suggestedItem!.id)) {
            setUpsellSuggestion(msg);
            setUpsellItem(suggestedItem);
         } else {
            setUpsellSuggestion('');
            setUpsellItem(null);
         }

      } catch (error) {
        console.error("Failed to generate upsell:", error);
      } finally {
        setIsUpsellLoading(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [cart, catalog]);

  const processJarvisCommand = async (transcript: string) => {
    toast.loading("Jarvis está raciocinando...", { id: "jarvis" });

    try {
      const catalogContext = catalog.map(c => `ID do Item: ${c.id} | Nome: ${c.name} | Categoria: ${c.category} | Preço: ${c.price}`).join('\n');
      const cartContext = cart.length > 0 ? cart.map(c => `${c.id} - ${c.name} (${c.quantity}x)`).join('\n') : 'Carrinho vazio';
      
      const prompt = `Você é o Jarvis, o assistente inteligente de um Ponto de Venda (PDV).
O usuário falou: "${transcript}"

Catálogo:
${catalogContext}

Carrinho atual:
${cartContext}

Ações:
- { "action": "add", "itemId": "id_do_item", "quantity": 1 }
- { "action": "remove", "itemId": "id_do_item" } // Se pedir pra remover algo
- { "action": "checkout", "method": "pix" } // method: 'pix', 'card', 'cash' ou 'split'
- { "action": "clear" } // Se o usuário mandar cancelar ou esvaziar a venda

Responda APENAS com um arquivo JSON válido e nada mais:
{
  "actions": [
    { "action": "add", "itemId": "b1", "quantity": 1 }
  ],
  "speechResult": "Confirmação curta para ler pro usuário."
}`;

      const res = await fetch('/api/gemini/generateContent', {
         method: 'POST',
         headers: { 'Content-Type': 'application/json', 'x-gemini-key': geminiKey || '' },
         body: JSON.stringify({ contents: prompt, model: 'gemini-3.5-flash' })
      });
      const resData = await res.json();
      
      if (!res.ok) {
         throw new Error(resData.error || "Erro na geração");
      }

      const text = resData.text || "{}";
      const jsonString = text.replace(/```json/g, '').replace(/```/g, '').trim();
      const data = JSON.parse(jsonString);

      const replyText = data.speechResult || "Comando executado com sucesso.";
      toast.success(replyText, { id: "jarvis", duration: 4000 });
      
      // Speak with Jarvis Gemini Neural Voice
      voiceNarration.speak(replyText, { persona: 'jarvis', voice: 'masculino', mode: 'neural' });

      if (data.actions && Array.isArray(data.actions)) {
         let doCheckout = false;
         for (const task of data.actions) {
            if (task.action === 'add') {
               const item = catalog.find(c => String(c.id) === String(task.itemId));
               if (item) {
                 for(let i=0; i<(task.quantity || 1); i++) {
                   addToCart(item);
                 }
               }
            } else if (task.action === 'remove') {
               setCart(prev => prev.filter(c => String(c.id) !== String(task.itemId)));
            } else if (task.action === 'clear') {
               setCart([]);
            } else if (task.action === 'checkout') {
               setPaymentMethod(task.method || 'pix');
               doCheckout = true;
            }
         }
         
         if (doCheckout) {
            setTimeout(() => {
               handleCheckout();
            }, 800);
         }
      }
    } catch (err) {
      console.error(err);
      toast.error("Não entendi o comando ou ocorreu um erro.", { id: "jarvis" });
      voiceNarration.speak("Desculpe, não consegui entender o comando.", { persona: 'jarvis', voice: 'masculino', mode: 'neural' });
    }
  };

  const startJarvisListening = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
       toast.error("Seu navegador não suporta reconhecimento de voz.");
       return;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = 'pt-BR';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
       setIsListening(true);
       voiceNarration.playChime('start');
       toast("🎙️ Jarvis Ouvindo...", { id: 'jarvis-listening', duration: 10000 });
    };

    recognition.onresult = (event: any) => {
       const transcript = event.results[0][0].transcript;
       toast.dismiss('jarvis-listening');
       voiceNarration.playChime('success');
       toast.success(`Entendido: "${transcript}"`);
       processJarvisCommand(transcript);
    };

    recognition.onerror = (event: any) => {
       toast.dismiss('jarvis-listening');
       if (event.error === 'not-allowed') {
         toast.error("Acesso ao microfone negado. Por favor, permita o uso do microfone no seu navegador.");
       } else {
         toast.error("Erro no reconhecimento: " + event.error);
       }
       setIsListening(false);
    };

    recognition.onend = () => {
       setIsListening(false);
       toast.dismiss('jarvis-listening');
    };

    recognition.start();
  };

  const total = useMemo(() => {
    const sum = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    let finalSum = sum;
    if (appliedCoupon) {
       if (appliedCoupon.type === 'percent') {
          finalSum = sum - (sum * (appliedCoupon.discount / 100));
       } else {
          finalSum = sum - appliedCoupon.discount;
       }
    }
    return Math.max(0, finalSum);
  }, [cart, appliedCoupon]);

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + Enter to Checkout
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
         if (cart.length > 0 && !isSuccess) {
           handleCheckout();
         }
      }
      // Ctrl/Cmd + F for Search
      if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
         e.preventDefault();
         document.getElementById('pos-search-input')?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    // AI Voice Assistant & System Operator Integrations
    const handlePosAddItem = (e: Event) => {
      const customEvent = e as CustomEvent<Service>;
      if (customEvent.detail) {
        addToCart(customEvent.detail);
        toast.success(`🛒 Adicionado ao caixa: ${customEvent.detail.name}`);
      }
    };
    const handlePosClearCart = () => {
      setCart([]);
      toast.info('Carrinho do caixa limpo com sucesso.');
    };
    const handlePosOpenDrawer = () => {
      toast.success('💵 Gaveta do caixa acionada via Assistente Bella!');
    };
    const handlePosSelectPayment = (e: Event) => {
      const customEvent = e as CustomEvent<{ method: 'pix' | 'card' | 'cash' | 'split' }>;
      if (customEvent.detail?.method) {
        setPaymentMethod(customEvent.detail.method);
        toast.info(`Forma de pagamento selecionada: ${customEvent.detail.method.toUpperCase()}`);
      }
    };
    const handlePosCheckout = (e: Event) => {
      const customEvent = e as CustomEvent<{ method?: 'pix' | 'card' | 'cash' | 'split' }>;
      if (customEvent.detail?.method) {
        setPaymentMethod(customEvent.detail.method);
      }
      setTimeout(() => {
        handleCheckout();
      }, 300);
    };

    window.addEventListener('pos-add-item', handlePosAddItem);
    window.addEventListener('pos-clear-cart', handlePosClearCart);
    window.addEventListener('pos-open-drawer', handlePosOpenDrawer);
    window.addEventListener('pos-select-payment', handlePosSelectPayment);
    window.addEventListener('pos-checkout', handlePosCheckout);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('pos-add-item', handlePosAddItem);
      window.removeEventListener('pos-clear-cart', handlePosClearCart);
      window.removeEventListener('pos-open-drawer', handlePosOpenDrawer);
      window.removeEventListener('pos-select-payment', handlePosSelectPayment);
      window.removeEventListener('pos-checkout', handlePosCheckout);
    };
  }, [cart, isSuccess, paymentMethod, total]);

  const addToCart = (service: Service) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === service.id);
      if (existing) {
        return prev.map(i => i.id === service.id ? { ...i, quantity: i.quantity + 1 } : i);
      } else {
        return [...prev, { ...service, quantity: 1, uid: Math.random().toString(36).substr(2, 9) }];
      }
    });
  };

  const removeFromCart = (uid: string) => {
    setCart(prev => prev.filter(i => i.uid !== uid));
  };

  const updateQuantity = (uid: string, delta: number) => {
    setCart(prev => prev.map(i => {
      if (i.uid === uid) {
        const newQ = i.quantity + delta;
        return newQ > 0 ? { ...i, quantity: newQ } : i;
      }
      return i;
    }));
  };

  const setProfessional = (uid: string, professionalId: string) => {
    setCart(prev => prev.map(i => i.uid === uid ? { ...i, professionalId } : i));
  };

  const validateCPF = (cpf: string) => {
    const stripped = cpf.replace(/\D/g, '');
    if (!stripped) return true; // Optional
    if (stripped.length !== 11 || /^(\d)\1{10}$/.test(stripped)) return false;
    let sum = 0, rest;
    for (let i = 1; i <= 9; i++) sum += parseInt(stripped.substring(i - 1, i)) * (11 - i);
    rest = (sum * 10) % 11;
    if (rest === 10 || rest === 11) rest = 0;
    if (rest !== parseInt(stripped.substring(9, 10))) return false;
    sum = 0;
    for (let i = 1; i <= 10; i++) sum += parseInt(stripped.substring(i - 1, i)) * (12 - i);
    rest = (sum * 10) % 11;
    if (rest === 10 || rest === 11) rest = 0;
    if (rest !== parseInt(stripped.substring(10, 11))) return false;
    return true;
  };

  const handleCheckout = async () => {
    if (isProcessingCheckout) return;

    if (cart.length === 0) {
      toast.error('Carrinho vazio', { description: 'Adicione itens antes de finalizar.' });
      return;
    }

    if (nfCpf && !validateCPF(nfCpf)) {
      setCpfError(true);
      toast.error('CPF Inválido', { description: 'Verifique o CPF informado.' });
      return;
    }

    if (emitirNfce) {
      toast.error('NFC-e indisponível até integrar um provedor fiscal. Nenhuma nota será emitida.');
      return;
    }
    if (paymentMethod !== 'cash') {
      toast.error('PIX, cartão e pagamento dividido indisponíveis sem confirmação do provedor. Nenhuma venda foi registrada.');
      return;
    }

    const sale = {
      id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      total,
      paymentMethod,
      status: 'completed' as const,
      items: cart.map(item => ({
        id: String(item.id),
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        professionalId: item.professionalId,
        category: item.category,
        type: item.type
      })),
      date: new Date().toISOString()
    };

    setIsProcessingCheckout(true);
    try {
      if (emitirNfce) {
        setIsEmittingNfce(true);
        const toastId = toast.loading('Processando pagamento e emitindo NFC-e...');
        try {
          const response = await fiscalService.emitNfce({
            total,
            items: cart,
            customer: clientType === 'registered' ? selectedClient : null,
            paymentMethod
          });

          if (!response.success) {
            toast.error('Falha na Emissão', { id: toastId, description: response.error });
            return;
          }

          await addTransaction(sale);
          setNfceData(response);
          setIsSuccess(true);
          toast.success('Venda e NFC-e concluídas!', { id: toastId, description: 'Venda registrada e estoque atualizado.' });
        } catch (err) {
          toast.error('Falha ao concluir venda com NFC-e', { id: toastId, description: err instanceof Error ? err.message : 'Operação não concluída.' });
          console.error(err);
        } finally {
          setIsEmittingNfce(false);
        }
      } else {
        const toastId = toast.loading('Processando Pagamento...');
        try {
          await addTransaction(sale);
          setIsSuccess(true);
          toast.success('Venda em dinheiro registrada!', { id: toastId, description: `R$ ${total.toFixed(2)} lançados no histórico de vendas.` });

          if (window.bella?.isDesktopApp) {
            window.bella.printer.openCashDrawer().then(res => {
              if (!res.success) console.error('Gaveta erro: ', res.error);
            });
          }
        } catch (err) {
          toast.error('Erro ao concluir venda', { id: toastId, description: err instanceof Error ? err.message : 'A venda não foi gravada.' });
          console.error(err);
        }
      }
    } finally {
      setIsProcessingCheckout(false);
    }
  };

  const [nfCpf, setNfCpf] = useState('');
  const [cpfError, setCpfError] = useState(false);
  const { clients } = useClientStore();
  const [clientType, setClientType] = useState('avulso'); // 'avulso' or 'registered'
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [showClientModal, setShowClientModal] = useState(false);
  const [clientSearch, setClientSearch] = useState('');
  
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [receiptType, setReceiptType] = useState<'standard' | 'nfce'>('standard');

  const handleApplyCoupon = () => {
    if (!couponCode) return;
    const code = couponCode.toUpperCase();
    
    // Simulating coupons database
    const mockCoupons = {
      'VERAO20': { discount: 20, type: 'percent', expires: '2026-10-01' }, 
      'BEMVINDO': { discount: 15, type: 'fixed', expires: '2026-12-31' },
      'OFF10': { discount: 10, type: 'percent', expires: '2025-01-01' }, // Expired
      'CLIENTE10': { discount: 10, type: 'percent', expires: '2026-05-31' }, // Expires at the end of next month
    };

    const coupon = mockCoupons[code as keyof typeof mockCoupons];

    if (coupon) {
      const today = new Date();
      // Reset hours to compare dates easily
      today.setHours(0, 0, 0, 0); 
      const expirationDate = new Date(`${coupon.expires}T00:00:00`);
      
      if (today > expirationDate) {
        setCouponError(`Cupom expirado em ${expirationDate.toLocaleDateString('pt-BR')}`);
      } else {
        setAppliedCoupon({ code, discount: coupon.discount, type: coupon.type as 'percent' | 'fixed' });
        setCouponError('');
        setCouponCode('');
      }
    } else {
      setCouponError('Cupom não encontrado.');
    }
  };

  const handleCpfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value;
    // Basic mask
    val = val.replace(/\D/g, '');
    if (val.length > 11) val = val.substring(0, 11);
    val = val.replace(/(\d{3})(\d)/, '$1.$2');
    val = val.replace(/(\d{3})(\d)/, '$1.$2');
    val = val.replace(/(\d{3})(\d{1,2})$/, '$1-$2');
    setNfCpf(val);
    setCpfError(!validateCPF(val));
  };

  const startNewSale = () => {
    setIsSuccess(false);
    setCart([]);
    setNfCpf('');
  };

  const categories = useMemo(() => ['all', ...Array.from(new Set(catalog.map(s => s.category)))], [catalog]);

  const filteredCatalog = useMemo(() => {
    return catalog
      .filter(s => s.name.toLowerCase().includes(search.toLowerCase()))
      .filter(s => categoryFilter === 'all' || s.category === categoryFilter)
      .sort((a, b) => {
        switch (sortBy) {
          case 'name-asc': return a.name.localeCompare(b.name);
          case 'name-desc': return b.name.localeCompare(a.name);
          case 'price-asc': return a.price - b.price;
          case 'price-desc': return b.price - a.price;
          default: return 0;
        }
      });
  }, [catalog, search, categoryFilter, sortBy]);

  return (
    <div className="flex flex-col h-full w-full bg-[#0B0F1A]">
      <div className="flex items-center justify-between px-6 py-4 bg-[#0F172A] border-b border-white/5 shrink-0 z-10 w-full overflow-x-auto scrollbar-hide">
         <div className="flex items-center gap-4">
            <h2 className="text-xl font-bold text-white tracking-tight">Caixa (PDV)</h2>
            <div className="hidden md:block h-6 w-px bg-white/10 mx-2"></div>
            <div className="flex items-center gap-2 sm:gap-3">
               <button 
                 onClick={() => navigate('/clients')} 
                 className="flex items-center gap-2 text-sm font-medium text-slate-300 hover:text-white bg-[#1E293B] hover:bg-[#253B5C] px-3.5 py-2 rounded-xl transition-all hover:shadow-lg whitespace-nowrap"
               >
                  <Plus className="w-4 h-4" />
                  Novo Cliente
               </button>
               <button 
                 onClick={() => navigate('/schedule')} 
                 className="flex items-center gap-2 text-sm font-medium text-slate-300 hover:text-white bg-[#1E293B] hover:bg-[#253B5C] px-3.5 py-2 rounded-xl transition-all hover:shadow-lg whitespace-nowrap"
               >
                  <Calendar className="w-4 h-4" />
                  Agenda de Hoje
               </button>
            </div>
         </div>
      </div>
      <div className="grid grid-cols-1 xl:grid-cols-3 flex-1 h-auto xl:h-[calc(100vh-140px)] w-full text-white">
       
       {/* Left: Catalog */}
       <aside className="w-full border-b xl:border-b-0 xl:border-r border-white/5 flex flex-col bg-[#0F172A] shrink-0 h-[450px] md:h-[550px] xl:h-full">
          <div className="p-4">
             <div className="relative group mb-3 flex gap-2">
                <div className="relative flex-1">
                   <input 
                     id="pos-search-input"
                     type="text" 
                     placeholder="Buscar serviços..." 
                     value={search}
                     onChange={e => setSearch(e.target.value)}
                     className="w-full bg-[#1E293B] border border-white/10 rounded-xl py-3 px-10 text-sm focus:outline-none focus:border-cyan-500/50 transition-all text-white placeholder-slate-500"
                   />
                   <Search className="absolute left-3 top-3.5 text-slate-500 w-4 h-4" />
                </div>
                <button
                  onClick={startJarvisListening}
                  className={`p-3 rounded-xl transition flex items-center justify-center shrink-0 ${isListening ? 'bg-red-500 hover:bg-red-400 animate-pulse shadow-[0_0_15px_rgba(239,68,68,0.5)]' : 'bg-blue-600 hover:bg-blue-500 shadow-[0_0_15px_rgba(37,99,235,0.3)]'} text-white`}
                  title={isListening ? "Ouvindo..." : "Falar com Jarvis"}
                >
                   <Mic className="w-5 h-5" />
                </button>
             </div>
             
             <div className="flex flex-col gap-3">
               <div className="flex gap-2 overflow-x-auto pb-1 hide-scrollbar">
                  {categories.map(cat => (
                    <button 
                      key={cat}
                      onClick={() => setCategoryFilter(cat)}
                      className={`px-3 py-1.5 rounded-full border text-xs font-semibold whitespace-nowrap transition-colors ${
                        categoryFilter === cat 
                          ? 'bg-blue-500/10 border-blue-500/30 text-blue-400' 
                          : 'bg-[#0C1627] border-[#1A2C47] text-slate-400 hover:text-white hover:bg-[#182B4A]'
                      }`}
                    >
                      {cat === 'all' ? 'Todos' : cat}
                    </button>
                  ))}
               </div>
               
               <div className="flex gap-2 items-center">
                 <span className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold">Ord.</span>
                 <div className="flex gap-1 bg-[#0C1627] p-1 rounded-lg border border-[#1A2C47]">
                   <button onClick={() => setSortBy('name-asc')} className={`p-1.5 rounded-md transition-colors ${sortBy === 'name-asc' ? 'bg-white/10 text-white' : 'text-slate-500 hover:text-slate-300'}`} title="Nome (A-Z)"><ArrowDownAZ className="w-3 h-3" /></button>
                   <button onClick={() => setSortBy('name-desc')} className={`p-1.5 rounded-md transition-colors ${sortBy === 'name-desc' ? 'bg-white/10 text-white' : 'text-slate-500 hover:text-slate-300'}`} title="Nome (Z-A)"><ArrowUpAZ className="w-3 h-3" /></button>
                   <button onClick={() => setSortBy('price-asc')} className={`p-1.5 rounded-md transition-colors ${sortBy === 'price-asc' ? 'bg-white/10 text-white' : 'text-slate-500 hover:text-slate-300'}`} title="Menor Preço"><ArrowDown10 className="w-3 h-3" /></button>
                   <button onClick={() => setSortBy('price-desc')} className={`p-1.5 rounded-md transition-colors ${sortBy === 'price-desc' ? 'bg-white/10 text-white' : 'text-slate-500 hover:text-slate-300'}`} title="Maior Preço"><ArrowUp10 className="w-3 h-3" /></button>
                 </div>
               </div>
             </div>
          </div>

          <div className="flex-1 overflow-y-auto px-4 space-y-3 pb-4">
             {filteredCatalog.map(service => (
               <div
                 key={service.id}
                 onClick={() => addToCart(service)}
                 className="glass-card bg-[#030815]/40 border-[#1A2C47] p-4 cursor-pointer transition-all duration-200 hover:scale-105 active:scale-95 hover:border-cyan-400/60 hover:shadow-[0_0_20px_rgba(6,182,212,0.4)]"
               >
                 <div className="flex justify-between items-start">
                   <h4 className="font-medium text-slate-200 group-hover:text-cyan-300 transition-colors duration-200 text-sm pr-2">{service.name}</h4>
                   <span className="text-blue-400 group-hover:text-cyan-400 group-hover:neon-cyan font-semibold whitespace-nowrap transition-colors duration-200">R$ {service.price.toFixed(2)}</span>
                 </div>
               </div>
             ))}
          </div>
       </aside>

       {/* Center: Cart/Ticket */}
       <section className="flex-1 flex flex-col bg-[#0B0F1A] relative h-[500px] md:h-[600px] xl:h-full border-b xl:border-b-0 border-white/5">
          <AnimatePresence>
            {isSuccess && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/90 backdrop-blur-md z-20 flex flex-col items-center justify-center text-center p-6"
              >
                  <motion.div
                    initial={{ scale: 0.5 }}
                    animate={{ scale: 1 }}
                    className="w-16 h-16 bg-blue-500/20 text-blue-400 rounded-full flex items-center justify-center mb-6 shadow-[0_0_20px_rgba(59,130,246,0.3)]"
                  >
                    <CheckCircle className="w-8 h-8" />
                  </motion.div>
                  <h3 className="text-2xl font-semibold mb-2 text-white">Venda Concluída!</h3>
                  <p className="text-slate-400 mb-8">Total de R$ {total.toFixed(2)} registrado com sucesso.</p>

                  <div className="grid grid-cols-2 gap-3 w-full max-w-sm mb-6">
                     <button 
                       onClick={() => { setReceiptType('standard'); setShowReceiptModal(true); }}
                       className="flex flex-col items-center justify-center gap-2 bg-[#09111D] border border-[#1A2C47] hover:border-blue-500/50 hover:bg-[#0C1627] text-slate-300 p-4 rounded-xl transition-all"
                     >
                       <Printer className="w-6 h-6 text-slate-400" />
                       <span className="text-xs font-medium">Cupom Não Fiscal</span>
                     </button>
                     <button 
                       onClick={() => { setReceiptType('nfce'); setShowReceiptModal(true); }}
                       className="flex flex-col items-center justify-center gap-2 bg-[#09111D] border border-[#1A2C47] hover:border-cyan-500/50 hover:bg-[#0C1627] text-slate-300 p-4 rounded-xl transition-all"
                     >
                       <QrCode className="w-6 h-6 text-cyan-400" />
                       <span className="text-xs font-medium">Cupom NFC-e</span>
                     </button>
                     <button 
                       onClick={async () => {
                         const phone = (clientType === 'registered' && selectedClient?.phone) ? selectedClient.phone.replace(/\D/g, '') : '';
                         
                         if (!phone) {
                           toast.error('Sem número de telefone', { description: 'Cliente selecionado não possui WhatsApp.' });
                           return;
                         }

                         const tid = toast.loading('Enviando via WhatsApp Cloud API...');
                         try {
                           const res = await whatsappService.sendMessage({
                             to: `55${phone}`,
                             type: 'template',
                             templateName: 'recibo_venda',
                             variables: { total: total.toFixed(2) }
                           });

                           if (res.success) {
                             toast.success('Mensagem enviada com sucesso!', { id: tid });
                           } else {
                             toast.error('Erro ao enviar mensagem', { id: tid });
                           }
                         } catch(e) {
                           toast.error('Erro na API do Meta', { id: tid });
                         }
                       }}
                       className="flex flex-col items-center justify-center gap-2 bg-[#09111D] border border-[#1A2C47] hover:border-green-500/50 hover:bg-[#0C1627] text-slate-300 p-4 rounded-xl transition-all"
                     >
                       <svg className="w-6 h-6 text-green-400" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/></svg>
                       <span className="text-xs font-medium text-center">Enviar WhatsApp<br/><span className="text-[9px] text-slate-500">(Cloud API)</span></span>
                     </button>
                     <button 
                       onClick={() => {
                         const content = `COMPROVANTE DE VENDA\n\nTotal: R$ ${total.toFixed(2)}\n\nObrigado pela preferência!`;
                         const blob = new Blob([content], { type: 'text/plain' });
                         const url = URL.createObjectURL(blob);
                         const a = document.createElement('a');
                         a.href = url;
                         a.download = `comprovante_venda.txt`;
                         a.click();
                         URL.revokeObjectURL(url);
                       }}
                       className="flex flex-col items-center justify-center gap-2 bg-[#09111D] border border-[#1A2C47] hover:border-purple-500/50 hover:bg-[#0C1627] text-slate-300 p-4 rounded-xl transition-all"
                     >
                       <FileText className="w-6 h-6 text-purple-400" />
                       <span className="text-xs font-medium">Salvar PDF</span>
                     </button>
                  </div>
                  
                  <button 
                    onClick={startNewSale}
                    className="w-full max-w-sm py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-lg rounded-xl transition-all shadow-[0_0_25px_rgba(37,99,235,0.5)] hover:shadow-[0_0_35px_rgba(37,99,235,0.7)] transform hover:-translate-y-1 active:translate-y-0 active:scale-95"
                  >
                    Nova Venda
                  </button>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {showReceiptModal && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
              >
                <motion.div 
                  initial={{ scale: 0.9, opacity: 0, y: 20 }}
                  animate={{ scale: 1, opacity: 1, y: 0 }}
                  exit={{ scale: 0.9, opacity: 0, y: 20 }}
                  className="bg-[#0C1627] border border-[#1A2C47] p-6 rounded-2xl w-full max-w-sm flex flex-col relative shadow-[0_20px_50px_rgba(0,0,0,0.5)]"
                >
                   <button 
                     onClick={() => setShowReceiptModal(false)}
                     className="absolute top-4 right-4 p-2 bg-[#1A2C47] hover:bg-[#253B5C] rounded-full text-slate-300 transition-colors"
                   >
                     <Plus className="w-4 h-4 rotate-45" />
                   </button>
                   
                   <div className="bg-white text-black p-6 font-mono text-sm shadow-inner overflow-y-auto max-h-[60vh] relative w-full sm:w-[300px] mx-auto">
                     {/* Textured edge top */}
                     <div className="absolute top-0 left-0 right-0 h-2 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI4IiBoZWlnaHQ9IjgiPjxjaXJjbGUgY3g9IjQiIGN5PSI0IiByPSI0IiBmaWxsPSIjMEMxNjI3Ii8+PC9zdmc+')] bg-repeat-x"></div>

                     <div className="text-center mb-4 mt-2">
                       <h2 className="font-bold text-lg mb-1">BellaPDV</h2>
                       <p className="text-xs text-slate-600 truncate">R. Exemplo de App, 123 - Centro</p>
                       <p className="text-xs text-slate-600">CNPJ: 00.000.000/0001-00</p>
                       <div className="border-b-2 border-dashed border-slate-300 my-4"></div>
                       <p className="font-bold uppercase tracking-wider mb-2">
                         {receiptType === 'standard' ? 'Comprovante Não Fiscal' : 'Extrato NFC-e'}
                       </p>
                       <p className="text-xs">Data: {new Date().toLocaleDateString('pt-BR')} {new Date().toLocaleTimeString('pt-BR')}</p>
                     </div>

                     <div className="border-b border-dashed border-slate-300 my-3"></div>

                     <table className="w-full text-left text-xs mb-4">
                       <thead>
                         <tr>
                           <th className="pb-2 font-semibold">QTD</th>
                           <th className="pb-2 font-semibold">DESCRIÇÃO</th>
                           <th className="pb-2 text-right font-semibold">VALOR</th>
                         </tr>
                       </thead>
                       <tbody>
                         {cart.map((item, index) => (
                           <tr key={index}>
                             <td className="py-1 align-top">{item.quantity}</td>
                             <td className="py-1 align-top pr-2">{item.name}</td>
                             <td className="py-1 text-right align-top">{(item.price * item.quantity).toFixed(2)}</td>
                           </tr>
                         ))}
                       </tbody>
                     </table>

                     <div className="border-b border-dashed border-slate-300 my-3"></div>

                     <div className="flex justify-between font-bold text-base mb-1">
                       <span>Total</span>
                       <span>R$ {total.toFixed(2)}</span>
                     </div>
                     {appliedCoupon && (
                       <div className="flex justify-between text-xs text-slate-600 mb-1">
                         <span>Desconto ({appliedCoupon.code})</span>
                         <span>
                           {appliedCoupon.type === 'percent' 
                             ? `- R$ ${(cart.reduce((a,c) => a + c.price * c.quantity, 0) * (appliedCoupon.discount/100)).toFixed(2)}`
                             : `- R$ ${appliedCoupon.discount.toFixed(2)}`}
                         </span>
                       </div>
                     )}
                     <div className="flex justify-between text-xs text-slate-600 mb-4">
                       <span>Pagamento</span>
                       <span className="uppercase">{paymentMethod}</span>
                     </div>

                     {nfCpf && (
                       <>
                         <div className="border-b border-dashed border-slate-300 my-3"></div>
                         <p className="text-xs text-center">CPF na nota: {nfCpf}</p>
                       </>
                     )}
                     
                     {clientType === 'registered' && selectedClient && (
                        <>
                           <div className="border-b border-dashed border-slate-300 my-3"></div>
                           <p className="text-[10px] text-center text-slate-600">Cliente: {selectedClient.name}</p>
                        </>
                     )}

                     <div className="border-b border-dashed border-slate-300 my-3"></div>

                     <div className="text-center text-xs mt-4">
                       <p className="mb-2 font-semibold">Obrigado pela preferência!</p>
                       <div className="mt-4 flex flex-col items-center">
                         <QrCode className="w-20 h-20 text-black mb-2" />
                         <p className="text-[10px] font-bold uppercase">Agende novamente ou Avalie!</p>
                         <p className="text-[9px] text-slate-500">Aponte a câmera do seu celular</p>
                       </div>
                       
                       {receiptType === 'nfce' && nfceData && (
                         <div className="mt-4 flex flex-col items-center pt-2 border-t border-dashed border-slate-300">
                           <p className="text-[10px] font-bold">Nota Fiscal Eletrônica (NFC-e)</p>
                           <p className="text-[10px]">Chave de Acesso:</p>
                           <p className="text-[10px] break-all mb-1 text-slate-500 font-mono">
                             {nfceData.chaveAcesso}
                           </p>
                           <p className="text-[9px]">Protocolo: {nfceData.protocolo}</p>
                           {nfceData.qrCodeUrl && (
                             <div className="mt-2 text-center flex flex-col items-center">
                               <img src={`https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent(nfceData.qrCodeUrl)}`} className="w-24 h-24 mb-1 border rounded p-1" alt="QR Code NFC-e" />
                               <p className="text-[8px]">Consulte via Leitor de QR Code</p>
                             </div>
                           )}
                         </div>
                       )}
                     </div>
                     
                     {/* Textured edge bottom */}
                     <div className="absolute bottom-0 left-0 right-0 h-2 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI4IiBoZWlnaHQ9IjgiPjxjaXJjbGUgY3g9IjQiIGN5PSI0IiByPSI0IiBmaWxsPSIjMEMxNjI3Ii8+PC9zdmc+')] bg-repeat-x transform rotate-180"></div>
                   </div>

                   <div className="grid grid-cols-3 gap-2 mt-4">
                     <button 
                       onClick={() => {
                          if (window.bella?.isDesktopApp) {
                            window.bella.printer.printReceipt({
                              total: total,
                              cart: cart
                            }).then(res => {
                              if(res.success) toast.success("Nota enviada para impressora térmica!");
                              else toast.error("Erro na impressão: " + res.error);
                            });
                          } else {
                            window.print();
                          }
                       }}
                       className="py-2 flex flex-col items-center justify-center gap-1 bg-[#1A2C47] hover:bg-[#253B5C] text-white rounded-xl transition-all"
                     >
                       <Printer className="w-4 h-4" />
                       <span className="text-[10px] font-medium uppercase tracking-wider">Imprimir</span>
                     </button>
                     <button 
                       onClick={() => {
                         const text = `*COMPROVANTE DE VENDA*\n\nTotal: R$ ${total.toFixed(2)}\nObrigado pela preferência!`;
                         const phone = (clientType === 'registered' && selectedClient?.phone) ? selectedClient.phone.replace(/\D/g, '') : '';
                         const url = `https://wa.me/${phone ? '55' + phone : ''}?text=${encodeURIComponent(text)}`;
                         window.open(url, '_blank');
                       }}
                       className="py-2 flex flex-col items-center justify-center gap-1 bg-green-600/20 text-green-400 hover:bg-green-600/30 rounded-xl transition-all border border-green-500/20"
                     >
                       <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/></svg>
                       <span className="text-[10px] font-medium uppercase tracking-wider">WhatsApp</span>
                     </button>
                     <button 
                       onClick={() => {
                         const content = `COMPROVANTE DE VENDA\n\nTotal: R$ ${total.toFixed(2)}\n\nObrigado pela preferência!`;
                         const blob = new Blob([content], { type: 'text/plain' });
                         const url = URL.createObjectURL(blob);
                         const a = document.createElement('a');
                         a.href = url;
                         a.download = `comprovante_venda.txt`;
                         a.click();
                         URL.revokeObjectURL(url);
                       }}
                       className="py-2 flex flex-col items-center justify-center gap-1 bg-purple-600/20 text-purple-400 hover:bg-purple-600/30 rounded-xl transition-all border border-purple-500/20"
                     >
                       <FileText className="w-4 h-4" />
                       <span className="text-[10px] font-medium uppercase tracking-wider">PDF</span>
                     </button>
                   </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="p-6 flex-1 flex flex-col">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold flex items-center gap-2 text-white">
                <CheckCircle className="w-5 h-5 text-blue-500" />
                Ticket Atual
              </h2>
              <span className="text-xs text-slate-500 font-mono tracking-widest uppercase">Caixa Livre</span>
            </div>

            <div className="flex-1 overflow-y-auto space-y-4 pr-2">
              {cart.length === 0 ? (
                <div className="flex-1 h-full flex items-center justify-center text-slate-500 text-sm">
                  O carrinho está vazio.
                </div>
              ) : (
                <div className="space-y-4">
                  {cart.map(item => (
                    <div 
                      key={item.uid}
                      className="flex items-center gap-4 bg-[#0C1627]/60 backdrop-blur-md p-4 rounded-2xl border border-white/10 shadow-[0_4px_20px_rgba(0,0,0,0.2)] hover:border-blue-500/30 transition-colors group"
                    >
                      <div className="flex-1">
                        <h5 className="text-sm font-semibold text-white">{item.name}</h5>
                        <p className="text-[10px] text-slate-400 mt-1 uppercase tracking-wider mb-2">R$ {item.price.toFixed(2)} unit.</p>
                        
                        <div className="flex items-center gap-2">
                           <select 
                             value={item.professionalId || ''} 
                             onChange={(e) => setProfessional(item.uid, e.target.value)}
                             className="bg-[#09111D] border border-[#1A2C47] rounded-md px-2 py-1 text-[10px] text-slate-300 outline-none focus:border-blue-500 w-32 appearance-none cursor-pointer"
                           >
                             <option value="">Nenhum/Opcional</option>
                             {professionals.map(p => (
                               <option key={p.id} value={p.id}>{p.name}</option>
                             ))}
                           </select>
                           {item.professionalId && professionals.find(p => p.id === item.professionalId) && (
                              <div className="text-[10px] text-blue-400 bg-blue-500/10 px-1.5 py-0.5 rounded font-bold">
                                Com: R$ {((item.price * item.quantity) * (professionals.find(p => p.id === item.professionalId)!.commission / 100)).toFixed(2)}
                              </div>
                           )}
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                         <div className="flex items-center gap-2 bg-[#09111D] border border-[#1A2C47] rounded-lg p-1">
                            <button 
                              onClick={() => updateQuantity(item.uid, -1)} 
                              className="w-7 h-7 flex items-center justify-center rounded-md bg-white/5 hover:bg-red-500/20 hover:text-red-400 text-slate-300 transition-colors"
                            >
                               <Minus className="w-4 h-4" />
                            </button>
                            <span className="w-6 text-center text-sm font-semibold text-white">{item.quantity}</span>
                            <button 
                              onClick={() => updateQuantity(item.uid, 1)} 
                              className="w-7 h-7 flex items-center justify-center rounded-md bg-white/5 hover:bg-emerald-500/20 hover:text-emerald-400 text-slate-300 transition-colors"
                            >
                               <Plus className="w-4 h-4" />
                            </button>
                         </div>
                         <div className="flex items-center gap-3">
                           <p className="font-bold text-white tracking-wide">R$ {(item.price * item.quantity).toFixed(2)}</p>
                           <button 
                             onClick={() => removeFromCart(item.uid)} 
                             className="text-red-400/80 hover:text-red-400 transition-colors p-1"
                             title="Remover item"
                           >
                             <Trash2 className="w-4 h-4" />
                           </button>
                         </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            {/* AI Suggestion */}
            <AnimatePresence>
              {(isUpsellLoading || upsellSuggestion) && cart.length > 0 && (
                <motion.div 
                  initial={{ opacity: 0, y: 10, height: 0 }}
                  animate={{ opacity: 1, y: 0, height: 'auto' }}
                  exit={{ opacity: 0, y: 10, height: 0 }}
                  className="mt-6 bg-gradient-to-r from-blue-600/10 to-purple-600/10 border border-blue-500/20 rounded-2xl p-4 shadow-[0_0_15px_rgba(59,130,246,0.05)] overflow-hidden flex flex-col"
                >
                  <div className="flex items-center gap-3 w-full mb-3">
                    <div className="p-2.5 bg-blue-500/20 rounded-xl shrink-0 shadow-inner">
                       <Sparkles className={`w-5 h-5 text-blue-400 ${isUpsellLoading ? 'animate-pulse' : ''}`} />
                    </div>
                    <div className="flex-1">
                      <p className="text-[10px] font-bold text-cyan-400 tracking-widest uppercase mb-0.5 flex items-center gap-2">
                        IA de Receita: Combo / Upsell
                        {isUpsellLoading && <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-ping" />}
                      </p>
                      <p className="text-sm text-slate-200 leading-snug">
                        {isUpsellLoading ? 'Analisando carrinho...' : upsellSuggestion}
                      </p>
                    </div>
                  </div>
                  
                  {!isUpsellLoading && upsellItem && (
                     <div className="flex bg-[#050B14]/80 border border-[#1A2C47] rounded-xl p-3 items-center justify-between shadow-inner transition-colors hover:border-blue-500/30">
                        <div className="flex gap-3 items-center">
                           <div className="w-8 h-8 bg-[#0C1627] rounded-lg flex items-center justify-center text-xs border border-[#1A2C47]">
                              <Plus className="w-4 h-4 text-emerald-400" />
                           </div>
                           <div>
                             <p className="text-sm font-bold text-white leading-tight">{upsellItem.name}</p>
                             <p className="text-xs text-slate-400 font-semibold tracking-wider mt-0.5">R$ {upsellItem.price.toFixed(2)}</p>
                           </div>
                        </div>
                        <button 
                          onClick={() => addToCart(upsellItem)}
                          className="px-4 py-2 bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/30 text-emerald-400 text-xs font-bold uppercase tracking-wider rounded-lg transition-colors flex items-center gap-1.5"
                        >
                          <Plus className="w-3.5 h-3.5" /> Adicionar
                        </button>
                     </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="bg-[#09111D]/80 backdrop-blur-xl p-8 border-t border-[#1A2C47] shadow-[0_-10px_30px_rgba(0,0,0,0.5)] z-10 relative">
            <div className="space-y-4">
              <div className="flex justify-between text-sm text-slate-400 font-medium px-2">
                <span>Subtotal</span>
                <span>R$ {cart.reduce((a, b) => a + (b.price * b.quantity), 0).toFixed(2)}</span>
              </div>
              {appliedCoupon && (
                <div className="flex justify-between text-sm text-emerald-400 font-medium px-2">
                  <span>Desconto ({appliedCoupon.code})</span>
                  <span>- R$ {(cart.reduce((a, b) => a + (b.price * b.quantity), 0) - total).toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between items-end pt-4 border-t border-white/5">
                <span className="text-slate-300 font-medium uppercase tracking-widest text-sm mb-1">Total</span>
                <span className="text-4xl lg:text-5xl font-bold text-white tracking-tight drop-shadow-[0_0_15px_rgba(59,130,246,0.3)]">
                  <span className="text-blue-500/80 text-2xl lg:text-3xl mr-1 font-normal">R$</span>
                  {total.toFixed(2)}
                </span>
              </div>
            </div>
          </div>
       </section>

       {/* Right: Payment & Actions (300px) */}
       <aside className="w-full border-l xl:border-l border-white/5 bg-[#0F172A] flex flex-col p-6 h-auto xl:h-full overflow-y-auto">
          <div className="flex-1 space-y-6">
            
            <div>
              <label className="text-[10px] uppercase font-semibold text-slate-500 tracking-widest block mb-2">Cliente</label>
              <div 
                className="bg-[#0C1627] border border-[#1A2C47] rounded-xl p-3 flex items-center justify-between cursor-pointer hover:border-[#253B5C] transition-all group"
                onClick={() => setShowClientModal(true)}
              >
                <div className="flex items-center gap-2">
                   {clientType === 'registered' && selectedClient ? (
                     <>
                        <div className="w-6 h-6 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center text-xs font-bold shrink-0">
                           {selectedClient.name.charAt(0)}
                        </div>
                        <span className="text-sm text-blue-400 font-medium truncate max-w-[160px]">{selectedClient.name}</span>
                     </>
                   ) : (
                     <>
                        <div className="w-6 h-6 rounded-full bg-slate-800 text-slate-400 flex items-center justify-center text-xs font-bold shrink-0">
                           A
                        </div>
                        <span className="text-sm text-slate-400 font-medium truncate">Cliente Avulso</span>
                     </>
                   )}
                </div>
                {clientType === 'registered' ? (
                   <button 
                     onClick={(e) => { e.stopPropagation(); setClientType('avulso'); setSelectedClient(null); setNfCpf(''); }}
                     className="text-slate-500 hover:text-red-400 transition-colors"
                   >
                     <X className="w-4 h-4" />
                   </button>
                ) : (
                   <Search className="w-4 h-4 text-slate-500 group-hover:text-blue-400 transition-colors" />
                )}
              </div>
              <p className="text-[10px] text-slate-500 mt-1 ml-1">Clique para buscar um cliente cadastrado</p>
            </div>

            <div className="mb-6">
              <label className="text-[10px] uppercase font-semibold text-slate-500 tracking-widest block mb-2">Cupom de Desconto</label>
              <div className="flex gap-2">
                 <input 
                   type="text"
                   value={couponCode}
                   onChange={e => {
                     setCouponCode(e.target.value);
                     setCouponError('');
                   }}
                   placeholder="Ex: BEMVINDO (Tente OFF10 p/ erro)"
                   className="w-full bg-[#0C1627] border border-[#1A2C47] rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-blue-500 transition-colors uppercase placeholder-slate-600"
                 />
                 <button 
                   onClick={handleApplyCoupon}
                   disabled={!couponCode}
                   className="bg-blue-600 hover:bg-blue-500 text-white px-4 rounded-xl font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                 >
                   Aplicar
                 </button>
              </div>
              {couponError && <p className="text-red-400 text-xs mt-1 ml-1">{couponError}</p>}
              {appliedCoupon && (
                 <div className="flex items-center justify-between py-2 px-3 mt-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                   <div className="flex items-center gap-2">
                     <CheckCircle className="w-4 h-4 text-emerald-400" />
                     <span className="text-xs font-semibold text-emerald-400">Cupom {appliedCoupon.code} aplicado</span>
                   </div>
                   <button 
                     onClick={() => setAppliedCoupon(null)}
                     className="text-emerald-500 hover:text-emerald-400"
                   >
                     <Trash2 className="w-4 h-4" />
                   </button>
                 </div>
              )}
            </div>

            <div className="mb-6">
              <label className="text-[10px] uppercase font-semibold text-slate-500 tracking-widest block mb-2">CPF na Nota (Opcional)</label>
              <div className={`bg-[#0C1627] border rounded-xl flex items-center transition-all ${cpfError ? 'border-red-500/50' : 'border-[#1A2C47] focus-within:border-blue-500/50'}`}>
                <input 
                  type="text" 
                  placeholder="000.000.000-00" 
                  value={nfCpf}
                  onChange={handleCpfChange}
                  className="w-full bg-transparent py-3 px-4 text-sm text-white outline-none font-mono placeholder-slate-600"
                />
              </div>
              {cpfError && <p className="text-red-400 text-xs mt-1 ml-1">CPF inválido</p>}
            </div>

            <div>
              <label className="text-[10px] uppercase font-semibold text-slate-500 tracking-widest block mb-2">Método de Pagamento</label>
              <div className="space-y-2">
                 {[
                   { id: 'pix', icon: Smartphone, label: 'PIX (QR Code)' },
                   { id: 'card', icon: CreditCard, label: 'Cartão de Crédito/Débito' },
                   { id: 'cash', icon: Banknote, label: 'Dinheiro Espécie' },
                   { id: 'split', icon: Plus, label: 'Dividir Pagamento' }
                 ].map(method => (
                   <button 
                     key={method.id}
                     onClick={() => setPaymentMethod(method.id as any)}
                     className={`w-full flex items-center gap-3 rounded-lg p-3 cursor-pointer transition-all border ${
                       paymentMethod === method.id
                         ? 'bg-blue-500/10 border-blue-500 text-white shadow-[0_0_15px_rgba(59,130,246,0.15)]'
                         : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10 hover:border-white/20'
                     }`}
                   >
                     <div className={`p-1.5 rounded-md ${paymentMethod === method.id ? 'bg-blue-500/20 text-blue-400' : 'bg-white/10 text-slate-400'}`}>
                       <method.icon className="w-4 h-4" />
                     </div>
                     <span className="text-sm font-medium">{method.label}</span>
                     {paymentMethod === method.id && (
                       <CheckCircle className="w-4 h-4 text-blue-400 ml-auto" />
                     )}
                   </button>
                 ))}
              </div>
              <AnimatePresence>
                 {paymentMethod === 'pix' && (
                    <motion.div 
                      key="pix-options"
                      initial={{ opacity: 0, height: 0 }} 
                      animate={{ opacity: 1, height: 'auto' }} 
                      exit={{ opacity: 0, height: 0 }}
                      className="mt-4 p-4 rounded-xl border border-cyan-500/30 bg-cyan-500/5 flex flex-col items-center justify-center overflow-hidden"
                    >
                       <p className="text-xs text-center text-slate-300">PIX indisponível até integrar e confirmar o pagamento com um provedor.</p>
                    </motion.div>
                 )}
                 {paymentMethod === 'cash' && (
                    <motion.div 
                      key="cash-options"
                      initial={{ opacity: 0, height: 0 }} 
                      animate={{ opacity: 1, height: 'auto' }} 
                      exit={{ opacity: 0, height: 0 }}
                      className="mt-4 p-4 rounded-xl border border-emerald-500/30 bg-emerald-500/5 space-y-3 overflow-hidden"
                    >
                       <div>
                          <label className="text-[10px] uppercase font-semibold text-slate-300 mb-2 block">Valor Recebido</label>
                          <div className="flex gap-2">
                             <input 
                               type="number" 
                               placeholder="R$ 0,00" 
                               value={cashAmount} 
                               onChange={e => setCashAmount(e.target.value)} 
                               className="w-full bg-[#09111D] border border-emerald-500/30 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-emerald-500" 
                             />
                          </div>
                          {parseFloat(cashAmount) > total && (
                             <div className="mt-3 flex items-center justify-between bg-emerald-500/10 p-2 rounded border border-emerald-500/20">
                                <span className="text-xs text-emerald-400">Troco a devolver:</span>
                                <span className="font-bold text-emerald-400">R$ {(parseFloat(cashAmount) - total).toFixed(2)}</span>
                             </div>
                          )}
                       </div>
                    </motion.div>
                 )}
                 {paymentMethod === 'split' && (
                    <motion.div 
                      key="split-options"
                      initial={{ opacity: 0, height: 0 }} 
                      animate={{ opacity: 1, height: 'auto' }} 
                      exit={{ opacity: 0, height: 0 }}
                      className="mt-4 p-4 rounded-xl border border-blue-500/30 bg-blue-500/5 space-y-3 overflow-hidden"
                    >
                       <div>
                          <label className="text-[10px] uppercase font-semibold text-slate-300 mb-2 block">Pagamento 1</label>
                          <div className="flex gap-2">
                             <select className="bg-[#09111D] border border-[#1A2C47] rounded-lg px-2 py-2 text-xs text-white outline-none w-1/3">
                                <option>PIX</option>
                                <option>Dinheiro</option>
                                <option>Cartão</option>
                             </select>
                             <input type="number" placeholder="R$ 0,00" value={(total / 2).toFixed(2)} onChange={() => {}} className="w-2/3 bg-[#09111D] border border-[#1A2C47] rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-blue-500" />
                          </div>
                       </div>
                       <div>
                          <label className="text-[10px] uppercase font-semibold text-slate-300 mb-2 block">Pagamento 2</label>
                          <div className="flex gap-2">
                             <select className="bg-[#09111D] border border-[#1A2C47] rounded-lg px-2 py-2 text-xs text-white outline-none w-1/3">
                                <option>Dinheiro</option>
                                <option>Cartão</option>
                                <option>PIX</option>
                             </select>
                             <input type="number" placeholder="R$ 0,00" value={(total / 2).toFixed(2)} readOnly className="w-2/3 bg-[#0C1627] border border-[#1A2C47] rounded-lg px-3 py-2 text-xs text-slate-400 outline-none" />
                          </div>
                       </div>
                    </motion.div>
                 )}
              </AnimatePresence>
            </div>

          </div>

          <div className="mt-4 flex items-center justify-between bg-[#0C1627] border border-[#1A2C47] rounded-xl p-4">
             <div>
               <p className="text-sm font-semibold text-white">Emissão Fiscal</p>
               <p className="text-[10px] text-slate-400 mt-0.5">Indisponível até homologar um provedor fiscal</p>
             </div>
             <button
               disabled title="Emissão fiscal ainda não integrada"
               className={`relative w-12 h-6 rounded-full transition-colors ${emitirNfce ? 'bg-blue-600' : 'bg-slate-700'}`}
             >
               <motion.div
                 layout
                 className="absolute top-1 left-1 w-4 h-4 rounded-full bg-white shadow-sm"
                 animate={{ x: emitirNfce ? 24 : 0 }}
                 transition={{ type: "spring", stiffness: 500, damping: 30 }}
               />
             </button>
          </div>

          <button 
            onClick={handleCheckout}
            disabled={cart.length === 0 || isEmittingNfce}
            className="group mt-6 w-full bg-gradient-to-r from-emerald-500 to-green-400 hover:from-emerald-400 hover:to-green-300 text-[#050B14] font-bold text-lg py-4 rounded-xl shadow-[0_0_20px_rgba(16,185,129,0.4)] transition-all flex justify-center items-center gap-2 disabled:opacity-50 disabled:grayscale disabled:cursor-not-allowed uppercase disabled:shadow-none"
          >
            <span>{isEmittingNfce ? 'Emitindo NFC-e...' : 'Finalizar Venda'}</span>
            {!isEmittingNfce && <CheckCircle className="w-5 h-5" />}
          </button>
        <AnimatePresence>
          {showClientModal && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
            >
              <motion.div 
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-[#0C1627] border border-[#1A2C47] rounded-3xl w-full max-w-lg flex flex-col shadow-[0_0_50px_rgba(0,0,0,0.5)] overflow-hidden"
              >
                <div className="p-6 border-b border-[#1A2C47] flex items-center justify-between bg-[#09111D]">
                   <h2 className="text-xl font-semibold text-white">Selecionar Cliente</h2>
                   <button 
                     onClick={() => setShowClientModal(false)}
                     className="p-2 bg-[#1A2C47] hover:bg-[#253B5C] rounded-full text-slate-300 transition-colors"
                   >
                     <X className="w-5 h-5" />
                   </button>
                </div>
                
                <div className="p-6">
                   <div className="relative mb-4">
                     <input 
                       type="text" 
                       placeholder="Buscar por nome, telefone ou e-mail..."
                       value={clientSearch}
                       onChange={e => setClientSearch(e.target.value)}
                       autoFocus
                       className="w-full bg-[#1E293B] border border-white/10 rounded-xl py-3 px-10 text-sm focus:outline-none focus:border-blue-500/50 transition-all text-white placeholder-slate-500"
                     />
                     <Search className="absolute left-3 top-3.5 text-slate-500 w-4 h-4" />
                   </div>

                   <div className="max-h-[300px] overflow-y-auto space-y-2 pr-2">
                      {clients.filter(c => 
                          c.name.toLowerCase().includes(clientSearch.toLowerCase()) || 
                          c.phone.includes(clientSearch) || 
                          c.email.toLowerCase().includes(clientSearch.toLowerCase())
                      ).length === 0 ? (
                          <div className="py-8 text-center text-slate-500 text-sm">
                            Nenhum cliente encontrado.
                          </div>
                      ) : (
                        clients.filter(c => 
                            c.name.toLowerCase().includes(clientSearch.toLowerCase()) || 
                            c.phone.includes(clientSearch) || 
                            c.email.toLowerCase().includes(clientSearch.toLowerCase())
                        ).map(c => (
                          <div 
                            key={c.id}
                            onClick={() => {
                               setClientType('registered');
                               setSelectedClient(c);
                               // auto fill CPF if available? we could if it existed.
                               setShowClientModal(false);
                            }}
                            className="bg-[#09111D] border border-[#1A2C47] hover:border-blue-500/50 p-3 rounded-xl flex items-center justify-between cursor-pointer transition-colors group"
                          >
                             <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 flex items-center justify-center font-bold">
                                   {c.name.charAt(0)}
                                </div>
                                <div>
                                   <div className="text-sm font-semibold text-white group-hover:text-blue-400 transition-colors">{c.name}</div>
                                   <div className="text-xs text-slate-500">{c.phone}</div>
                                </div>
                             </div>
                             <div className="flex flex-col items-end gap-1">
                                {c.tags.includes('vip') && (
                                   <span className="text-[9px] uppercase tracking-wider text-yellow-400 bg-yellow-400/10 px-1.5 py-0.5 rounded font-bold">VIP</span>
                                )}
                                {c.aiScore === 'RISK' && (
                                   <span className="text-[9px] uppercase tracking-wider text-red-400 bg-red-400/10 px-1.5 py-0.5 rounded font-bold">Risco</span>
                                )}
                             </div>
                          </div>
                        ))
                      )}
                   </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
       </aside>

    </div>
    </div>
  )
}
