import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, 
  X, 
  Users, 
  Briefcase, 
  DollarSign, 
  Receipt, 
  ArrowRight, 
  Calendar, 
  ShoppingCart,
  Sparkles,
  Phone,
  Mail,
  Tag,
  Clock,
  ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useClientStore, Client } from '../../store/clients';
import { useCatalogStore, CatalogItem } from '../../store/catalog';
import { useTransactionStore, Transaction } from '../../store/transactions';
import { useNicheStore } from '../../store/niche';

// Sample fallback clients when store is empty (e.g. freshly loaded or demo session)
const DEMO_FALLBACK_CLIENTS: Client[] = [
  {
    id: 'demo-c1',
    name: 'Paula Torres',
    email: 'paula.torres@gmail.com',
    phone: '(11) 98421-0492',
    location: 'São Paulo - SP',
    lastVisit: '2026-10-14',
    lastService: 'Loiro Supremo + Reconstrução',
    classification: 'VIP',
    totalSpent: 1850,
    status: 'active',
    tags: ['vip', 'mechas'],
    aiScore: 'VIP'
  },
  {
    id: 'demo-c2',
    name: 'Beto Vasconcelos',
    email: 'beto.vascon@outlook.com',
    phone: '(11) 97128-5023',
    location: 'São Paulo - SP',
    lastVisit: '2026-10-15',
    lastService: 'Design Barbaterapia',
    classification: 'ATIVO',
    totalSpent: 420,
    status: 'active',
    tags: ['barba', 'mensalista'],
    aiScore: 'REGULAR'
  },
  {
    id: 'demo-c3',
    name: 'Mariana Siqueira',
    email: 'mariana.siqueira@gmail.com',
    phone: '(11) 99312-7744',
    location: 'Campinas - SP',
    lastVisit: '2026-10-10',
    lastService: 'Limpeza de Pele Profunda',
    classification: 'VIP',
    totalSpent: 960,
    status: 'active',
    tags: ['vip', 'estetica'],
    aiScore: 'VIP'
  },
  {
    id: 'demo-c4',
    name: 'Carlos Eduardo Silva',
    email: 'carlos.silva@uol.com.br',
    phone: '(11) 98111-2233',
    location: 'São Paulo - SP',
    lastVisit: '2026-10-16',
    lastService: 'Corte Degradê Navalhado',
    classification: 'NOVO CLIENTE',
    totalSpent: 45,
    status: 'active',
    tags: ['cabelo'],
    aiScore: 'REGULAR'
  },
  {
    id: 'demo-c5',
    name: 'Fernanda Albuquerque',
    email: 'fernanda.alb@gmail.com',
    phone: '(11) 97654-3210',
    location: 'São Bernardo - SP',
    lastVisit: '2026-09-02',
    lastService: 'Escova Modeladora + Tratamento',
    classification: 'RISCO DE PERDA',
    totalSpent: 310,
    status: 'active',
    tags: ['recuperacao'],
    aiScore: 'RISK'
  }
];

// Sample fallback services when catalog is empty
const DEMO_FALLBACK_SERVICES: CatalogItem[] = [
  { id: 'demo-s1', name: 'Corte Degradê Moderno', category: 'Cabelo', price: 45.00, duration: '45 min', type: 'service' },
  { id: 'demo-s2', name: 'Barba com Toalha Quente', category: 'Barba', price: 35.00, duration: '30 min', type: 'service' },
  { id: 'demo-s3', name: 'Combo Corte + Barba Premium', category: 'Combo', price: 70.00, duration: '1h 15min', type: 'service' },
  { id: 'demo-s4', name: 'Limpeza de Pele Profunda', category: 'Estética', price: 120.00, duration: '60 min', type: 'service' },
  { id: 'demo-s5', name: 'Escova Modeladora + Lavagem', category: 'Cabelo', price: 90.00, duration: '45 min', type: 'service' },
  { id: 'demo-s6', name: 'Drenagem Linfática Facial', category: 'Estética', price: 150.00, duration: '50 min', type: 'service' },
  { id: 'demo-s7', name: 'Pomada Modeladora Matte', category: 'Produtos', price: 55.00, stock: 15, type: 'product' },
  { id: 'demo-s8', name: 'Óleo Hidratante de Barba', category: 'Produtos', price: 40.00, stock: 8, type: 'product' }
];

// Sample fallback financial records when transactions store is empty
const DEMO_FALLBACK_TRANSACTIONS: Transaction[] = [
  {
    id: 'tx-1025',
    total: 70.00,
    paymentMethod: 'pix',
    status: 'completed',
    date: new Date(Date.now() - 3600000).toISOString(),
    items: [{ id: '1', name: 'Combo Corte + Barba Premium', price: 70.00, quantity: 1 }]
  },
  {
    id: 'tx-1024',
    total: 120.00,
    paymentMethod: 'card',
    status: 'completed',
    date: new Date(Date.now() - 14400000).toISOString(),
    items: [{ id: '2', name: 'Limpeza de Pele Profunda', price: 120.00, quantity: 1 }]
  },
  {
    id: 'tx-1023',
    total: 45.00,
    paymentMethod: 'pix',
    status: 'completed',
    date: new Date(Date.now() - 86400000).toISOString(),
    items: [{ id: '3', name: 'Corte Degradê Moderno', price: 45.00, quantity: 1 }]
  },
  {
    id: 'tx-1022',
    total: 150.00,
    paymentMethod: 'card',
    status: 'completed',
    date: new Date(Date.now() - 172800000).toISOString(),
    items: [{ id: '4', name: 'Drenagem Linfática Facial', price: 150.00, quantity: 1 }]
  },
  {
    id: 'tx-1021',
    total: 95.00,
    paymentMethod: 'cash',
    status: 'completed',
    date: new Date(Date.now() - 259200000).toISOString(),
    items: [
      { id: '5', name: 'Barba com Toalha Quente', price: 35.00, quantity: 1 },
      { id: '6', name: 'Pomada Modeladora Matte', price: 55.00, quantity: 1 }
    ]
  }
];

type SearchCategory = 'all' | 'clients' | 'services' | 'finance';

interface GlobalSearchProps {
  className?: string;
}

export function GlobalSearch({ className = '' }: GlobalSearchProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [activeTab, setActiveTab] = useState<SearchCategory>('all');
  const [selectedIndex, setSelectedIndex] = useState(0);

  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsContainerRef = useRef<HTMLDivElement>(null);

  // Connect to Zustand stores
  const storeClients = useClientStore((s) => s.clients);
  const storeItems = useCatalogStore((s) => s.items);
  const storeTransactions = useTransactionStore((s) => s.transactions);
  const { getConfig } = useNicheStore();
  const config = getConfig();

  // Combine store data with fallback demo data so search is always populated
  const clients = useMemo(() => {
    return storeClients.length > 0 ? storeClients : DEMO_FALLBACK_CLIENTS;
  }, [storeClients]);

  const services = useMemo(() => {
    return storeItems.length > 0 ? storeItems : DEMO_FALLBACK_SERVICES;
  }, [storeItems]);

  const transactions = useMemo(() => {
    return storeTransactions.length > 0 ? storeTransactions : DEMO_FALLBACK_TRANSACTIONS;
  }, [storeTransactions]);

  // Global Keyboard shortcut: Cmd+K / Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      } else if (e.key === 'Escape' && isOpen) {
        e.preventDefault();
        setIsOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  // Auto focus input when modal opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
        inputRef.current?.select();
      }, 50);
    } else {
      setQuery('');
      setSelectedIndex(0);
      setActiveTab('all');
    }
  }, [isOpen]);

  const moneyFormatter = useMemo(() => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
  }, []);

  const formatPaymentMethod = (method: string) => {
    switch (method.toLowerCase()) {
      case 'pix': return 'PIX';
      case 'card': return 'Cartão';
      case 'cash': return 'Dinheiro';
      case 'split': return 'Múltiplo';
      default: return method.toUpperCase();
    }
  };

  // Filter clients
  const filteredClients = useMemo(() => {
    if (!query.trim()) return clients.slice(0, 4);
    const q = query.toLowerCase().trim();
    return clients.filter((c) => 
      c.name.toLowerCase().includes(q) ||
      (c.phone && c.phone.includes(q)) ||
      (c.email && c.email.toLowerCase().includes(q)) ||
      (c.lastService && c.lastService.toLowerCase().includes(q)) ||
      (c.tags && c.tags.some(t => t.toLowerCase().includes(q))) ||
      (c.classification && c.classification.toLowerCase().includes(q))
    ).slice(0, 8);
  }, [clients, query]);

  // Filter services and products
  const filteredServices = useMemo(() => {
    if (!query.trim()) return services.slice(0, 4);
    const q = query.toLowerCase().trim();
    return services.filter((s) => 
      s.name.toLowerCase().includes(q) ||
      (s.category && s.category.toLowerCase().includes(q)) ||
      (s.type && s.type.toLowerCase().includes(q))
    ).slice(0, 8);
  }, [services, query]);

  // Filter financial records
  const filteredTransactions = useMemo(() => {
    if (!query.trim()) return transactions.slice(0, 4);
    const q = query.toLowerCase().trim();
    return transactions.filter((t) => {
      const idMatch = t.id.toLowerCase().includes(q) || `ticket #${t.id}`.toLowerCase().includes(q);
      const methodMatch = t.paymentMethod.toLowerCase().includes(q) || formatPaymentMethod(t.paymentMethod).toLowerCase().includes(q);
      const itemMatch = t.items?.some(i => i.name.toLowerCase().includes(q));
      const valueMatch = t.total.toString().includes(q) || moneyFormatter.format(t.total).toLowerCase().includes(q);
      return idMatch || methodMatch || itemMatch || valueMatch;
    }).slice(0, 8);
  }, [transactions, query, moneyFormatter]);

  // Quick navigation actions
  const quickActions = useMemo(() => {
    const list = [
      {
        id: 'action-pos',
        title: 'Frente de Caixa (PDV)',
        description: 'Abrir terminal de vendas e emissão rápida',
        path: '/pos',
        icon: Receipt,
        keywords: ['pdv', 'caixa', 'venda', 'frente', 'f2']
      },
      {
        id: 'action-schedule',
        title: 'Agenda de Atendimentos',
        description: 'Visualizar compromissos e horários marcados',
        path: '/schedule',
        icon: Calendar,
        keywords: ['agenda', 'horario', 'atendimento', 'marcar', 'calendario']
      },
      {
        id: 'action-clients-new',
        title: `Cadastrar Novo ${config.terminology.client || 'Cliente'}`,
        description: 'Adicionar ficha de contato e histórico',
        path: '/clients?action=new',
        icon: Users,
        keywords: ['cliente', 'novo', 'cadastrar', 'cadastro']
      },
      {
        id: 'action-services-new',
        title: `Cadastrar Novo ${config.terminology.service || 'Serviço'}`,
        description: 'Configurar preço, duração e categoria',
        path: '/services?action=new',
        icon: Briefcase,
        keywords: ['servico', 'catalogo', 'produto', 'preco']
      },
      {
        id: 'action-finance',
        title: 'Caixa & Fluxo Financeiro',
        description: 'Visualizar entradas, relatórios e demonstrativo',
        path: '/finance',
        icon: DollarSign,
        keywords: ['financeiro', 'fluxo', 'dre', 'relatorio', 'faturamento', 'dinheiro']
      }
    ];

    if (!query.trim()) return list;
    const q = query.toLowerCase().trim();
    return list.filter(a => 
      a.title.toLowerCase().includes(q) ||
      a.description.toLowerCase().includes(q) ||
      a.keywords.some(k => k.includes(q))
    );
  }, [config.terminology.client, config.terminology.service, query]);

  // Flattened items list for keyboard navigation
  const flatSelectableList = useMemo(() => {
    const items: Array<{
      id: string;
      category: 'client' | 'service' | 'finance' | 'action';
      onSelect: () => void;
    }> = [];

    if (activeTab === 'all' || activeTab === 'clients') {
      filteredClients.forEach(c => {
        items.push({
          id: `client-${c.id}`,
          category: 'client',
          onSelect: () => {
            setIsOpen(false);
            navigate(`/clients?q=${encodeURIComponent(c.name)}`);
          }
        });
      });
    }

    if (activeTab === 'all' || activeTab === 'services') {
      filteredServices.forEach(s => {
        items.push({
          id: `service-${s.id}`,
          category: 'service',
          onSelect: () => {
            setIsOpen(false);
            navigate(`/services?q=${encodeURIComponent(s.name)}`);
          }
        });
      });
    }

    if (activeTab === 'all' || activeTab === 'finance') {
      filteredTransactions.forEach(t => {
        items.push({
          id: `finance-${t.id}`,
          category: 'finance',
          onSelect: () => {
            setIsOpen(false);
            navigate('/finance');
          }
        });
      });
    }

    if (activeTab === 'all' && quickActions.length > 0) {
      quickActions.forEach(a => {
        items.push({
          id: a.id,
          category: 'action',
          onSelect: () => {
            setIsOpen(false);
            navigate(a.path);
          }
        });
      });
    }

    return items;
  }, [activeTab, filteredClients, filteredServices, filteredTransactions, quickActions, navigate]);

  // Reset selected index when filtered list changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [activeTab, query]);

  // Keyboard navigation inside list
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (flatSelectableList.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev + 1) % flatSelectableList.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev - 1 + flatSelectableList.length) % flatSelectableList.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (flatSelectableList[selectedIndex]) {
        flatSelectableList[selectedIndex].onSelect();
      }
    }
  }, [flatSelectableList, selectedIndex]);

  // Total results count
  const totalCount = filteredClients.length + filteredServices.length + filteredTransactions.length;

  return (
    <>
      {/* Search Trigger Button in Top Navigation */}
      <div className={`relative flex items-center ${className}`}>
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="w-full flex items-center justify-between gap-3 px-3 py-2 bg-[#0F172A]/80 hover:bg-[#1E293B] border border-white/10 hover:border-cyan-500/40 rounded-xl text-xs md:text-sm text-slate-400 hover:text-slate-200 transition-all group shadow-inner focus:outline-none focus:ring-1 focus:ring-cyan-500/50"
          title="Buscar no sistema (Ctrl+K ou ⌘K)"
          aria-label="Buscar clientes, serviços e registros financeiros"
        >
          <div className="flex items-center gap-2.5 truncate">
            <Search className="w-4 h-4 text-slate-400 group-hover:text-cyan-400 transition-colors shrink-0" />
            <span className="truncate text-slate-400 group-hover:text-slate-300">
              Buscar clientes, serviços, vendas...
            </span>
          </div>

          <kbd className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-mono text-slate-400 bg-white/5 border border-white/10 rounded group-hover:border-cyan-500/30 transition-colors shrink-0">
            <span className="text-[9px]">⌘</span>K
          </kbd>
        </button>
      </div>

      {/* Global Search Dialog Modal */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-[120] bg-black/80 backdrop-blur-md flex items-start justify-center p-3 sm:p-6 md:pt-20"
            onClick={() => setIsOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.96, opacity: 0, y: -10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.96, opacity: 0, y: -10 }}
              transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
              onClick={(e) => e.stopPropagation()}
              onKeyDown={handleKeyDown}
              className="bg-[#0C1425] border border-white/15 rounded-2xl w-full max-w-2xl shadow-[0_20px_50px_rgba(0,0,0,0.7)] overflow-hidden flex flex-col max-h-[85vh]"
            >
              {/* Header / Input Field */}
              <div className="p-4 border-b border-white/10 flex items-center gap-3 bg-[#09101E] shrink-0">
                <Search className="w-5 h-5 text-cyan-400 shrink-0" />
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Buscar clientes, serviços, catálogo, tickets, valores..."
                  className="w-full bg-transparent text-white placeholder:text-slate-500 text-sm md:text-base outline-none focus:outline-none tracking-tight"
                />
                {query ? (
                  <button
                    type="button"
                    onClick={() => {
                      setQuery('');
                      inputRef.current?.focus();
                    }}
                    className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
                    title="Limpar busca"
                  >
                    <X className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className="hidden sm:inline-block text-[11px] font-mono text-slate-400 bg-white/5 border border-white/10 px-2 py-0.5 rounded hover:text-white transition-colors"
                  >
                    ESC
                  </button>
                )}
              </div>

              {/* Segmented Filter Controls */}
              <div className="flex items-center gap-1.5 px-4 py-2.5 border-b border-white/5 bg-[#0A101C] overflow-x-auto hide-scrollbar shrink-0 text-xs">
                <button
                  type="button"
                  onClick={() => setActiveTab('all')}
                  className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors ${
                    activeTab === 'all'
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                  }`}
                >
                  Todos {totalCount > 0 && <span className="ml-1 opacity-70">({totalCount})</span>}
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('clients')}
                  className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                    activeTab === 'clients'
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                  }`}
                >
                  <Users className="w-3.5 h-3.5" />
                  Clientes ({filteredClients.length})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('services')}
                  className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                    activeTab === 'services'
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                  }`}
                >
                  <Briefcase className="w-3.5 h-3.5" />
                  Serviços ({filteredServices.length})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('finance')}
                  className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                    activeTab === 'finance'
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                  }`}
                >
                  <DollarSign className="w-3.5 h-3.5" />
                  Financeiro ({filteredTransactions.length})
                </button>
              </div>

              {/* Scrollable Results Container */}
              <div
                ref={resultsContainerRef}
                className="flex-1 overflow-y-auto p-3 space-y-4 max-h-[60vh] hide-scrollbar"
              >
                {/* Empty State */}
                {flatSelectableList.length === 0 && (
                  <div className="py-12 text-center flex flex-col items-center justify-center px-4">
                    <div className="w-12 h-12 rounded-full bg-slate-800/60 border border-white/10 flex items-center justify-center text-slate-400 mb-3">
                      <Search className="w-5 h-5 text-slate-400" />
                    </div>
                    <p className="text-white font-medium text-sm">
                      Nenhum resultado encontrado {query && <span>para &quot;{query}&quot;</span>}
                    </p>
                    <p className="text-slate-400 text-xs mt-1 max-w-sm">
                      Verifique se digitou corretamente ou tente buscar por nome do cliente, serviço ou método de pagamento como PIX.
                    </p>
                  </div>
                )}

                {/* 1. Clientes Section */}
                {(activeTab === 'all' || activeTab === 'clients') && filteredClients.length > 0 && (
                  <div className="space-y-1">
                    <div className="px-2 py-1 text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5 text-cyan-400" /> Clientes
                      </span>
                      <span className="text-[10px] text-slate-500">{filteredClients.length} cadastrados</span>
                    </div>

                    <div className="space-y-1">
                      {filteredClients.map((client) => {
                        const itemFlatId = `client-${client.id}`;
                        const isSelected = flatSelectableList[selectedIndex]?.id === itemFlatId;

                        return (
                          <div
                            key={client.id}
                            onClick={() => {
                              setIsOpen(false);
                              navigate(`/clients?q=${encodeURIComponent(client.name)}`);
                            }}
                            className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between gap-3 ${
                              isSelected
                                ? 'bg-cyan-500/10 border-cyan-500/40 text-white'
                                : 'bg-[#0F172A]/40 border-white/5 hover:bg-white/5 text-slate-300'
                            }`}
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center shrink-0 text-xs font-bold">
                                {client.name.charAt(0).toUpperCase()}
                              </div>
                              <div className="min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="font-medium text-sm text-white truncate">
                                    {client.name}
                                  </span>
                                  {client.classification && (
                                    <span className="text-[11px] text-cyan-400 font-medium">
                                      · {client.classification}
                                    </span>
                                  )}
                                </div>
                                <div className="text-xs text-slate-400 truncate flex items-center gap-2 mt-0.5">
                                  {client.phone && <span>{client.phone}</span>}
                                  {client.email && (
                                    <>
                                      <span aria-hidden="true">·</span>
                                      <span className="truncate">{client.email}</span>
                                    </>
                                  )}
                                  {client.lastService && (
                                    <>
                                      <span aria-hidden="true">·</span>
                                      <span className="text-slate-400 truncate">Último: {client.lastService}</span>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              {client.totalSpent !== undefined && client.totalSpent > 0 && (
                                <span className="text-xs text-slate-400 font-mono tabular-nums">
                                  {moneyFormatter.format(client.totalSpent)}
                                </span>
                              )}
                              <ChevronRight className="w-4 h-4 text-slate-500" />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* 2. Serviços Section */}
                {(activeTab === 'all' || activeTab === 'services') && filteredServices.length > 0 && (
                  <div className="space-y-1">
                    <div className="px-2 py-1 text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <Briefcase className="w-3.5 h-3.5 text-blue-400" /> Serviços & Catálogo
                      </span>
                      <span className="text-[10px] text-slate-500">{filteredServices.length} itens</span>
                    </div>

                    <div className="space-y-1">
                      {filteredServices.map((service) => {
                        const itemFlatId = `service-${service.id}`;
                        const isSelected = flatSelectableList[selectedIndex]?.id === itemFlatId;

                        return (
                          <div
                            key={service.id}
                            onClick={() => {
                              setIsOpen(false);
                              navigate(`/services?q=${encodeURIComponent(service.name)}`);
                            }}
                            className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between gap-3 ${
                              isSelected
                                ? 'bg-blue-500/10 border-blue-500/40 text-white'
                                : 'bg-[#0F172A]/40 border-white/5 hover:bg-white/5 text-slate-300'
                            }`}
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center shrink-0">
                                <Briefcase className="w-4 h-4" />
                              </div>
                              <div className="min-w-0">
                                <div className="font-medium text-sm text-white truncate">
                                  {service.name}
                                </div>
                                <div className="text-xs text-slate-400 truncate flex items-center gap-2 mt-0.5">
                                  <span>{service.category || 'Geral'}</span>
                                  {service.duration && (
                                    <>
                                      <span aria-hidden="true">·</span>
                                      <span className="flex items-center gap-1">
                                        <Clock className="w-3 h-3 text-slate-500" />
                                        {service.duration}
                                      </span>
                                    </>
                                  )}
                                  {service.type && (
                                    <>
                                      <span aria-hidden="true">·</span>
                                      <span className="capitalize">{service.type === 'service' ? 'Serviço' : 'Produto'}</span>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              <span className="text-sm font-semibold text-emerald-400 font-mono tabular-nums">
                                {moneyFormatter.format(service.price)}
                              </span>
                              <ChevronRight className="w-4 h-4 text-slate-500" />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* 3. Registros Financeiros Section */}
                {(activeTab === 'all' || activeTab === 'finance') && filteredTransactions.length > 0 && (
                  <div className="space-y-1">
                    <div className="px-2 py-1 text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <DollarSign className="w-3.5 h-3.5 text-emerald-400" /> Registros Financeiros & Vendas
                      </span>
                      <span className="text-[10px] text-slate-500">{filteredTransactions.length} registros</span>
                    </div>

                    <div className="space-y-1">
                      {filteredTransactions.map((tx) => {
                        const itemFlatId = `finance-${tx.id}`;
                        const isSelected = flatSelectableList[selectedIndex]?.id === itemFlatId;
                        const itemsSummary = tx.items?.map(i => i.name).join(', ') || 'Venda PDV';
                        const formattedDate = tx.date ? new Date(tx.date).toLocaleDateString('pt-BR') : 'Hoje';

                        return (
                          <div
                            key={tx.id}
                            onClick={() => {
                              setIsOpen(false);
                              navigate('/finance');
                            }}
                            className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between gap-3 ${
                              isSelected
                                ? 'bg-emerald-500/10 border-emerald-500/40 text-white'
                                : 'bg-[#0F172A]/40 border-white/5 hover:bg-white/5 text-slate-300'
                            }`}
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                                <Receipt className="w-4 h-4" />
                              </div>
                              <div className="min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="font-medium text-sm text-white truncate">
                                    Ticket #{tx.id.slice(0, 8)}
                                  </span>
                                  <span className="text-xs text-slate-400">
                                    · {formatPaymentMethod(tx.paymentMethod)}
                                  </span>
                                  <span className="text-[11px] text-emerald-400">
                                    · Concluído
                                  </span>
                                </div>
                                <div className="text-xs text-slate-400 truncate flex items-center gap-2 mt-0.5">
                                  <span className="truncate">{itemsSummary}</span>
                                  <span aria-hidden="true">·</span>
                                  <span className="text-slate-500 shrink-0">{formattedDate}</span>
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              <span className="text-sm font-bold text-white font-mono tabular-nums">
                                {moneyFormatter.format(tx.total)}
                              </span>
                              <ChevronRight className="w-4 h-4 text-slate-500" />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* 4. Quick Actions Shortcuts */}
                {activeTab === 'all' && quickActions.length > 0 && (
                  <div className="space-y-1 pt-2 border-t border-white/5">
                    <div className="px-2 py-1 text-[11px] font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-purple-400" /> Ações Rápidas do Sistema
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {quickActions.map((action) => {
                        const isSelected = flatSelectableList[selectedIndex]?.id === action.id;
                        const ActionIcon = action.icon;

                        return (
                          <div
                            key={action.id}
                            onClick={() => {
                              setIsOpen(false);
                              navigate(action.path);
                            }}
                            className={`p-2.5 rounded-xl border cursor-pointer transition-all flex items-center gap-3 ${
                              isSelected
                                ? 'bg-purple-500/15 border-purple-500/40 text-white'
                                : 'bg-[#0F172A]/40 border-white/5 hover:bg-white/5 text-slate-300'
                            }`}
                          >
                            <div className="w-7 h-7 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-slate-300 shrink-0">
                              <ActionIcon className="w-3.5 h-3.5 text-cyan-400" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="font-medium text-xs text-white truncate">
                                {action.title}
                              </div>
                              <div className="text-[11px] text-slate-400 truncate">
                                {action.description}
                              </div>
                            </div>
                            <ArrowRight className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Modal Footer with Keyboard Navigation hints */}
              <div className="p-3 border-t border-white/10 bg-[#09101E] flex items-center justify-between text-[11px] text-slate-400 shrink-0">
                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-1">
                    <kbd className="px-1.5 py-0.5 bg-white/5 border border-white/10 rounded font-mono text-[10px]">↑↓</kbd>
                    <span>navegar</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <kbd className="px-1.5 py-0.5 bg-white/5 border border-white/10 rounded font-mono text-[10px]">↵</kbd>
                    <span>selecionar</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <kbd className="px-1.5 py-0.5 bg-white/5 border border-white/10 rounded font-mono text-[10px]">ESC</kbd>
                    <span>fechar</span>
                  </span>
                </div>

                <div className="hidden sm:flex items-center gap-1 text-slate-500">
                  <span>BellaPDV Busca Global</span>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
