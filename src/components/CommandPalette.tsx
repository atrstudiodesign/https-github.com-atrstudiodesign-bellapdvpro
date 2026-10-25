import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { Command } from 'cmdk';
import { useNavigate } from 'react-router-dom';
import { 
  Search, 
  X, 
  UserPlus, 
  CalendarPlus, 
  ShoppingCart, 
  MessageSquare, 
  UserCheck, 
  Gift, 
  Megaphone, 
  LayoutDashboard, 
  Scissors, 
  Calendar, 
  Users, 
  Briefcase, 
  DollarSign, 
  BarChart3, 
  Bot, 
  Clock, 
  HeartPulse, 
  Package, 
  MonitorSmartphone, 
  Globe, 
  Store, 
  Compass, 
  Share2, 
  Shield, 
  KeyRound, 
  Settings, 
  HelpCircle, 
  Tag, 
  Phone, 
  Sparkles,
  ArrowRight,
  Flame,
  CheckCircle2
} from 'lucide-react';
import { useCommandPaletteStore } from '../store/commandPalette';
import { useClientStore, Client } from '../store/clients';
import { useCatalogStore, CatalogItem } from '../store/catalog';
import { useAuthStore } from '../store/auth';
import { useNicheStore } from '../store/niche';
import { toast } from 'sonner';

// Sample fallback clients when store is empty in demo sessions
const DEMO_FALLBACK_CLIENTS: Client[] = [
  {
    id: 'demo-c1',
    name: 'Paula Torres',
    email: 'paula.torres@gmail.com',
    phone: '(11) 98421-0492',
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
    lastVisit: '2026-10-16',
    lastService: 'Corte Degradê Navalhado',
    classification: 'NOVO CLIENTE',
    totalSpent: 45,
    status: 'active',
    tags: ['cabelo'],
    aiScore: 'REGULAR'
  }
];

// Sample fallback catalog items when catalog store is empty
const DEMO_FALLBACK_SERVICES: CatalogItem[] = [
  { id: 'demo-s1', name: 'Corte Degradê Moderno', category: 'Cabelo', price: 45.00, duration: '45 min', type: 'service' },
  { id: 'demo-s2', name: 'Barba com Toalha Quente', category: 'Barba', price: 35.00, duration: '30 min', type: 'service' },
  { id: 'demo-s3', name: 'Combo Corte + Barba Premium', category: 'Combo', price: 70.00, duration: '1h 15min', type: 'service' },
  { id: 'demo-s4', name: 'Limpeza de Pele Profunda', category: 'Estética', price: 120.00, duration: '60 min', type: 'service' },
  { id: 'demo-s5', name: 'Escova Modeladora + Lavagem', category: 'Cabelo', price: 90.00, duration: '45 min', type: 'service' },
  { id: 'demo-s6', name: 'Pomada Modeladora Matte', category: 'Produtos', price: 55.00, stock: 15, type: 'product' }
];

export function CommandPalette() {
  const { isOpen, close, toggle, setIsOpen } = useCommandPaletteStore();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');

  // Stores
  const storeClients = useClientStore((s) => s.clients);
  const storeItems = useCatalogStore((s) => s.items);
  const isDemo = useAuthStore((s) => s.user?.isDemo === true);
  const { getConfig } = useNicheStore();
  const config = getConfig();

  // Unified clients list
  const clients = useMemo(() => {
    return isDemo && storeClients.length === 0 ? DEMO_FALLBACK_CLIENTS : storeClients;
  }, [storeClients, isDemo]);

  // Unified services list
  const services = useMemo(() => {
    return isDemo && storeItems.length === 0 ? DEMO_FALLBACK_SERVICES : storeItems;
  }, [storeItems, isDemo]);

  // Currency formatter
  const formatMoney = useMemo(() => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
  }, []);

  // Global Ctrl+K / Cmd+K keyboard listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.key === 'k' || e.key === 'K') && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        toggle();
      } else if (e.key === 'Escape' && isOpen) {
        e.preventDefault();
        close();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, toggle, close]);

  // Reset search when closed
  useEffect(() => {
    if (!isOpen) {
      setSearch('');
    }
  }, [isOpen]);

  // Action executor helper
  const handleSelect = useCallback((action: () => void) => {
    close();
    action();
  }, [close]);

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-[9999] flex items-start justify-center pt-14 sm:pt-20 md:pt-28 px-3 sm:px-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150"
      onClick={close}
    >
      <div 
        className="w-full max-w-2xl bg-[#090D18] border border-cyan-500/20 rounded-2xl shadow-[0_25px_60px_-15px_rgba(0,0,0,0.9),0_0_35px_rgba(0,217,255,0.12)] overflow-hidden flex flex-col max-h-[82vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <Command 
          label="Command Palette" 
          value={search}
          onValueChange={setSearch}
          className="flex flex-col h-full bg-transparent text-slate-100"
        >
          {/* Top Search Bar */}
          <div className="flex items-center gap-3 px-4 py-3.5 border-b border-white/10 bg-white/[0.02]">
            <Search className="w-5 h-5 text-cyan-400 shrink-0 animate-pulse" />
            <Command.Input 
              value={search}
              onValueChange={setSearch}
              placeholder="O que você precisa? Navegue, busque clientes ou dispare ações..."
              className="flex-1 bg-transparent text-sm sm:text-base text-slate-100 placeholder-slate-500 focus:outline-none"
              autoFocus
            />
            {search && (
              <button 
                type="button" 
                onClick={() => setSearch('')}
                className="p-1 text-slate-400 hover:text-slate-200 rounded-lg hover:bg-white/5 transition-colors"
                title="Limpar busca"
              >
                <X className="w-4 h-4" />
              </button>
            )}
            <kbd className="hidden sm:inline-flex items-center px-2 py-0.5 text-[10px] font-mono text-slate-400 bg-white/5 border border-white/10 rounded-md">
              ESC
            </kbd>
          </div>

          {/* Results List */}
          <Command.List className="flex-1 overflow-y-auto p-2 scrollbar-thin scrollbar-thumb-white/10 hover:scrollbar-thumb-cyan-500/30">
            <Command.Empty className="py-12 px-4 text-center">
              <div className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-3 text-slate-400">
                <Search className="w-6 h-6 text-slate-500" />
              </div>
              <p className="text-sm font-medium text-slate-300">Nenhum resultado encontrado para "{search}"</p>
              <p className="text-xs text-slate-500 mt-1">Tente buscar por "cliente", "venda", "agenda", "financeiro" ou nome de um serviço.</p>
            </Command.Empty>

            {/* AÇÕES DE CRM */}
            <Command.Group 
              heading="Ações Rápidas de CRM" 
              className="px-2 py-1.5 text-[11px] font-semibold text-cyan-400 tracking-wider uppercase [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-cyan-400/90"
            >
              <Command.Item
                value="novo cliente cadastrar lead crm adicionar contato"
                onSelect={() => handleSelect(() => {
                  navigate('/clients?action=new');
                  toast.info('Abrindo cadastro de novo cliente...');
                })}
                className="flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl text-sm text-slate-200 cursor-pointer transition-colors data-[selected=true]:bg-cyan-500/15 data-[selected=true]:text-cyan-300 group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/15 text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/25">
                    <UserPlus className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-medium text-slate-100 group-hover:text-cyan-200">Cadastrar Novo Cliente</div>
                    <div className="text-xs text-slate-400">Inserir contato no CRM com dados completos</div>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-slate-400">
                  <span className="hidden sm:inline">CRM</span>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-cyan-400" />
                </div>
              </Command.Item>

              <Command.Item
                value="novo agendamento marcar horario agenda marcar horario atendimento"
                onSelect={() => handleSelect(() => {
                  navigate('/schedule?action=new');
                  toast.info('Abrindo grade para novo agendamento...');
                })}
                className="flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl text-sm text-slate-200 cursor-pointer transition-colors data-[selected=true]:bg-cyan-500/15 data-[selected=true]:text-cyan-300 group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-cyan-500/15 text-cyan-400 flex items-center justify-center shrink-0 border border-cyan-500/25">
                    <CalendarPlus className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-medium text-slate-100 group-hover:text-cyan-200">Novo Agendamento</div>
                    <div className="text-xs text-slate-400">Reservar data, horário e profissional</div>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-slate-400">
                  <span className="hidden sm:inline">Agenda</span>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-cyan-400" />
                </div>
              </Command.Item>

              <Command.Item
                value="nova venda pdv frente de caixa iniciar venda registrar pagamento"
                onSelect={() => handleSelect(() => {
                  navigate('/pos?action=new');
                  toast.info('Frente de Caixa pronta para nova venda.');
                })}
                className="flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl text-sm text-slate-200 cursor-pointer transition-colors data-[selected=true]:bg-cyan-500/15 data-[selected=true]:text-cyan-300 group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-500/15 text-blue-400 flex items-center justify-center shrink-0 border border-blue-500/25">
                    <ShoppingCart className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-medium text-slate-100 group-hover:text-cyan-200">Nova Venda no PDV</div>
                    <div className="text-xs text-slate-400">Abrir caixa, bipar ou selecionar itens</div>
                  </div>
                </div>
                <kbd className="hidden sm:inline-flex items-center px-1.5 py-0.5 text-[10px] font-mono text-slate-400 bg-white/5 border border-white/10 rounded">
                  Ctrl+N
                </kbd>
              </Command.Item>

              <Command.Item
                value="whatsapp disparar mensagem notificacao integracao meta api"
                onSelect={() => handleSelect(() => {
                  navigate('/integrations');
                  toast.info('Acessando integração do WhatsApp...');
                })}
                className="flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl text-sm text-slate-200 cursor-pointer transition-colors data-[selected=true]:bg-cyan-500/15 data-[selected=true]:text-cyan-300 group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-green-500/15 text-green-400 flex items-center justify-center shrink-0 border border-green-500/25">
                    <MessageSquare className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-medium text-slate-100 group-hover:text-cyan-200">Disparar WhatsApp Business</div>
                    <div className="text-xs text-slate-400">Mensagens pós-venda, lembretes e automações</div>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-slate-400">
                  <ArrowRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-cyan-400" />
                </div>
              </Command.Item>

              <Command.Item
                value="fila de espera totem recepção ordem de chegada adicionar cliente"
                onSelect={() => handleSelect(() => {
                  navigate('/queue?action=new');
                  toast.info('Acessando fila de atendimento...');
                })}
                className="flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl text-sm text-slate-200 cursor-pointer transition-colors data-[selected=true]:bg-cyan-500/15 data-[selected=true]:text-cyan-300 group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-amber-500/15 text-amber-400 flex items-center justify-center shrink-0 border border-amber-500/25">
                    <UserCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-medium text-slate-100 group-hover:text-cyan-200">Adicionar à Fila de Espera</div>
                    <div className="text-xs text-slate-400">Ordem de chegada e atendimento por totem</div>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-slate-400">
                  <ArrowRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-cyan-400" />
                </div>
              </Command.Item>

              <Command.Item
                value="campanha de marketing comunicacao clientes inativos recuperacao fidelidade"
                onSelect={() => handleSelect(() => {
                  navigate('/marketing');
                })}
                className="flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl text-sm text-slate-200 cursor-pointer transition-colors data-[selected=true]:bg-cyan-500/15 data-[selected=true]:text-cyan-300 group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-purple-500/15 text-purple-400 flex items-center justify-center shrink-0 border border-purple-500/25">
                    <Megaphone className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-medium text-slate-100 group-hover:text-cyan-200">Criar Campanha de Marketing</div>
                    <div className="text-xs text-slate-400">Recuperar clientes ausentes e aniversariantes</div>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-slate-400">
                  <ArrowRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-cyan-400" />
                </div>
              </Command.Item>
            </Command.Group>

            <Command.Separator className="h-px bg-white/10 my-1" />

            {/* BASE DE CLIENTES (CRM) */}
            {clients.length > 0 && (
              <Command.Group 
                heading="Clientes (CRM)" 
                className="px-2 py-1.5 text-[11px] font-semibold text-emerald-400 tracking-wider uppercase [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-emerald-400/90"
              >
                {clients.slice(0, 6).map((client) => (
                  <Command.Item
                    key={client.id}
                    value={`cliente ${client.name} ${client.phone || ''} ${client.email || ''} ${client.classification || ''}`}
                    onSelect={() => handleSelect(() => {
                      navigate(`/clients?search=${encodeURIComponent(client.name)}`);
                    })}
                    className="flex items-center justify-between gap-3 px-3 py-2 rounded-xl text-sm text-slate-200 cursor-pointer transition-colors data-[selected=true]:bg-cyan-500/15 data-[selected=true]:text-cyan-300 group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-7 h-7 rounded-full bg-slate-800 text-slate-300 flex items-center justify-center font-bold text-xs shrink-0 border border-white/10">
                        {client.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <div className="font-medium text-slate-100 truncate group-hover:text-cyan-200 flex items-center gap-2">
                          <span>{client.name}</span>
                          {client.classification === 'VIP' && (
                            <span className="px-1.5 py-0.2 text-[9px] bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded font-semibold">
                              VIP
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-slate-400 truncate flex items-center gap-2">
                          {client.phone && <span>{client.phone}</span>}
                          {client.lastService && <span className="text-slate-500">• {client.lastService}</span>}
                        </div>
                      </div>
                    </div>
                    <div className="text-xs text-slate-400 shrink-0">
                      Ver no CRM
                    </div>
                  </Command.Item>
                ))}
              </Command.Group>
            )}

            <Command.Separator className="h-px bg-white/10 my-1" />

            {/* NAVEGAÇÃO NAS PÁGINAS */}
            <Command.Group 
              heading="Navegação do Sistema" 
              className="px-2 py-1.5 text-[11px] font-semibold text-slate-400 tracking-wider uppercase [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-slate-400"
            >
              <Command.Item
                value="dashboard painel geral inicio indicadores metricas faturamento"
                onSelect={() => handleSelect(() => navigate('/'))}
                className="flex items-center justify-between gap-3 px-3 py-2 rounded-xl text-sm text-slate-200 cursor-pointer transition-colors data-[selected=true]:bg-cyan-500/15 data-[selected=true]:text-cyan-300 group"
              >
                <div className="flex items-center gap-3">
                  <LayoutDashboard className="w-4 h-4 text-slate-400 group-hover:text-cyan-400" />
                  <span>Dashboard (Painel Principal)</span>
                </div>
                <kbd className="hidden sm:inline-flex items-center px-1.5 py-0.5 text-[10px] font-mono text-slate-400 bg-white/5 border border-white/10 rounded">
                  Alt+D
                </kbd>
              </Command.Item>

              <Command.Item
                value="pos pdv frente de caixa vendas carrinho pagamento"
                onSelect={() => handleSelect(() => navigate('/pos'))}
                className="flex items-center justify-between gap-3 px-3 py-2 rounded-xl text-sm text-slate-200 cursor-pointer transition-colors data-[selected=true]:bg-cyan-500/15 data-[selected=true]:text-cyan-300 group"
              >
                <div className="flex items-center gap-3">
                  <ShoppingCart className="w-4 h-4 text-slate-400 group-hover:text-cyan-400" />
                  <span>PDV (Frente de Caixa)</span>
                </div>
                <kbd className="hidden sm:inline-flex items-center px-1.5 py-0.5 text-[10px] font-mono text-slate-400 bg-white/5 border border-white/10 rounded">
                  Ctrl+P / F2
                </kbd>
              </Command.Item>

              <Command.Item
                value="agenda schedule horarios agendamentos calendario grade reservas"
                onSelect={() => handleSelect(() => navigate('/schedule'))}
                className="flex items-center justify-between gap-3 px-3 py-2 rounded-xl text-sm text-slate-200 cursor-pointer transition-colors data-[selected=true]:bg-cyan-500/15 data-[selected=true]:text-cyan-300 group"
              >
                <div className="flex items-center gap-3">
                  <Calendar className="w-4 h-4 text-slate-400 group-hover:text-cyan-400" />
                  <span>Agenda & Calendário</span>
                </div>
                <kbd className="hidden sm:inline-flex items-center px-1.5 py-0.5 text-[10px] font-mono text-slate-400 bg-white/5 border border-white/10 rounded">
                  Alt+A
                </kbd>
              </Command.Item>

              <Command.Item
                value="clientes crm base de clientes contatos historico"
                onSelect={() => handleSelect(() => navigate('/clients'))}
                className="flex items-center justify-between gap-3 px-3 py-2 rounded-xl text-sm text-slate-200 cursor-pointer transition-colors data-[selected=true]:bg-cyan-500/15 data-[selected=true]:text-cyan-300 group"
              >
                <div className="flex items-center gap-3">
                  <Users className="w-4 h-4 text-slate-400 group-hover:text-cyan-400" />
                  <span>Clientes (CRM Completo)</span>
                </div>
                <kbd className="hidden sm:inline-flex items-center px-1.5 py-0.5 text-[10px] font-mono text-slate-400 bg-white/5 border border-white/10 rounded">
                  Alt+C
                </kbd>
              </Command.Item>

              <Command.Item
                value="profissionais equipe especialistas colaboradores barbeiros cabeleireiros"
                onSelect={() => handleSelect(() => navigate('/professionals'))}
                className="flex items-center justify-between gap-3 px-3 py-2 rounded-xl text-sm text-slate-200 cursor-pointer transition-colors data-[selected=true]:bg-cyan-500/15 data-[selected=true]:text-cyan-300 group"
              >
                <div className="flex items-center gap-3">
                  <Scissors className="w-4 h-4 text-slate-400 group-hover:text-cyan-400" />
                  <span>Profissionais & Equipe</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-slate-600" />
              </Command.Item>

              <Command.Item
                value="servicos catalogo produtos estoque precos procedimentos"
                onSelect={() => handleSelect(() => navigate('/services'))}
                className="flex items-center justify-between gap-3 px-3 py-2 rounded-xl text-sm text-slate-200 cursor-pointer transition-colors data-[selected=true]:bg-cyan-500/15 data-[selected=true]:text-cyan-300 group"
              >
                <div className="flex items-center gap-3">
                  <Briefcase className="w-4 h-4 text-slate-400 group-hover:text-cyan-400" />
                  <span>Serviços & Catálogo</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-slate-600" />
              </Command.Item>

              <Command.Item
                value="financeiro fluxo de caixa dre receitas despesas relatorio financeiro"
                onSelect={() => handleSelect(() => navigate('/finance'))}
                className="flex items-center justify-between gap-3 px-3 py-2 rounded-xl text-sm text-slate-200 cursor-pointer transition-colors data-[selected=true]:bg-cyan-500/15 data-[selected=true]:text-cyan-300 group"
              >
                <div className="flex items-center gap-3">
                  <DollarSign className="w-4 h-4 text-slate-400 group-hover:text-cyan-400" />
                  <span>Financeiro & Fluxo de Caixa</span>
                </div>
                <kbd className="hidden sm:inline-flex items-center px-1.5 py-0.5 text-[10px] font-mono text-slate-400 bg-white/5 border border-white/10 rounded">
                  Alt+F
                </kbd>
              </Command.Item>

              <Command.Item
                value="relatorios gerenciais metricas graficos estatisticas"
                onSelect={() => handleSelect(() => navigate('/reports'))}
                className="flex items-center justify-between gap-3 px-3 py-2 rounded-xl text-sm text-slate-200 cursor-pointer transition-colors data-[selected=true]:bg-cyan-500/15 data-[selected=true]:text-cyan-300 group"
              >
                <div className="flex items-center gap-3">
                  <BarChart3 className="w-4 h-4 text-slate-400 group-hover:text-cyan-400" />
                  <span>Relatórios Gerenciais</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-slate-600" />
              </Command.Item>

              <Command.Item
                value="crm funil de vendas leads conversao retencao"
                onSelect={() => handleSelect(() => navigate('/crm'))}
                className="flex items-center justify-between gap-3 px-3 py-2 rounded-xl text-sm text-slate-200 cursor-pointer transition-colors data-[selected=true]:bg-cyan-500/15 data-[selected=true]:text-cyan-300 group"
              >
                <div className="flex items-center gap-3">
                  <Flame className="w-4 h-4 text-amber-400 group-hover:text-cyan-400" />
                  <span>Funil de Vendas (CRM)</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-slate-600" />
              </Command.Item>

              <Command.Item
                value="fidelidade cashback pontos recompensas"
                onSelect={() => handleSelect(() => navigate('/loyalty'))}
                className="flex items-center justify-between gap-3 px-3 py-2 rounded-xl text-sm text-slate-200 cursor-pointer transition-colors data-[selected=true]:bg-cyan-500/15 data-[selected=true]:text-cyan-300 group"
              >
                <div className="flex items-center gap-3">
                  <Gift className="w-4 h-4 text-slate-400 group-hover:text-cyan-400" />
                  <span>Fidelidade & Cashback</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-slate-600" />
              </Command.Item>

              <Command.Item
                value="automacoes bella ia inteligencia artificial piloto automatico"
                onSelect={() => handleSelect(() => navigate('/automations'))}
                className="flex items-center justify-between gap-3 px-3 py-2 rounded-xl text-sm text-slate-200 cursor-pointer transition-colors data-[selected=true]:bg-cyan-500/15 data-[selected=true]:text-cyan-300 group"
              >
                <div className="flex items-center gap-3">
                  <Bot className="w-4 h-4 text-cyan-400 group-hover:text-cyan-300" />
                  <span>Automações com Bella IA</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-slate-600" />
              </Command.Item>

              <Command.Item
                value="anamnese fichas questionarios saude clinica"
                onSelect={() => handleSelect(() => navigate('/anamnesis'))}
                className="flex items-center justify-between gap-3 px-3 py-2 rounded-xl text-sm text-slate-200 cursor-pointer transition-colors data-[selected=true]:bg-cyan-500/15 data-[selected=true]:text-cyan-300 group"
              >
                <div className="flex items-center gap-3">
                  <HeartPulse className="w-4 h-4 text-rose-400 group-hover:text-cyan-400" />
                  <span>Fichas de Anamnese</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-slate-600" />
              </Command.Item>

              <Command.Item
                value="pacotes sessoes combos recorrencia tratamentos"
                onSelect={() => handleSelect(() => navigate('/packages'))}
                className="flex items-center justify-between gap-3 px-3 py-2 rounded-xl text-sm text-slate-200 cursor-pointer transition-colors data-[selected=true]:bg-cyan-500/15 data-[selected=true]:text-cyan-300 group"
              >
                <div className="flex items-center gap-3">
                  <Package className="w-4 h-4 text-slate-400 group-hover:text-cyan-400" />
                  <span>Pacotes de Procedimentos</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-slate-600" />
              </Command.Item>

              <Command.Item
                value="totem autoatendimento recepcaoview fila presencial"
                onSelect={() => handleSelect(() => navigate('/totem'))}
                className="flex items-center justify-between gap-3 px-3 py-2 rounded-xl text-sm text-slate-200 cursor-pointer transition-colors data-[selected=true]:bg-cyan-500/15 data-[selected=true]:text-cyan-300 group"
              >
                <div className="flex items-center gap-3">
                  <MonitorSmartphone className="w-4 h-4 text-slate-400 group-hover:text-cyan-400" />
                  <span>Totem de Autoatendimento</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-slate-600" />
              </Command.Item>

              <Command.Item
                value="cardapio online vitrine digital menu servicos publico"
                onSelect={() => handleSelect(() => navigate('/online'))}
                className="flex items-center justify-between gap-3 px-3 py-2 rounded-xl text-sm text-slate-200 cursor-pointer transition-colors data-[selected=true]:bg-cyan-500/15 data-[selected=true]:text-cyan-300 group"
              >
                <div className="flex items-center gap-3">
                  <Globe className="w-4 h-4 text-slate-400 group-hover:text-cyan-400" />
                  <span>Vitrine / Cardápio Online</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-slate-600" />
              </Command.Item>

              <Command.Item
                value="marketplace bella centralizado descobrir busca publica"
                onSelect={() => handleSelect(() => navigate('/marketplace'))}
                className="flex items-center justify-between gap-3 px-3 py-2 rounded-xl text-sm text-slate-200 cursor-pointer transition-colors data-[selected=true]:bg-cyan-500/15 data-[selected=true]:text-cyan-300 group"
              >
                <div className="flex items-center gap-3">
                  <Store className="w-4 h-4 text-slate-400 group-hover:text-cyan-400" />
                  <span>Marketplace Centralizado</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-slate-600" />
              </Command.Item>

              <Command.Item
                value="explorar estabelecimentos marketplace publico saloes barbearias busca"
                onSelect={() => handleSelect(() => navigate('/explorar'))}
                className="flex items-center justify-between gap-3 px-3 py-2 rounded-xl text-sm text-slate-200 cursor-pointer transition-colors data-[selected=true]:bg-cyan-500/15 data-[selected=true]:text-cyan-300 group"
              >
                <div className="flex items-center gap-3">
                  <Compass className="w-4 h-4 text-cyan-400 group-hover:text-cyan-300" />
                  <span>Explorar Estabelecimentos (Público)</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-slate-600" />
              </Command.Item>

              <Command.Item
                value="divulgar meu estabelecimento cadastrar publicacao vitrine"
                onSelect={() => handleSelect(() => navigate('/divulgar'))}
                className="flex items-center justify-between gap-3 px-3 py-2 rounded-xl text-sm text-slate-200 cursor-pointer transition-colors data-[selected=true]:bg-cyan-500/15 data-[selected=true]:text-cyan-300 group"
              >
                <div className="flex items-center gap-3">
                  <Share2 className="w-4 h-4 text-emerald-400 group-hover:text-cyan-300" />
                  <span>Divulgar Estabelecimento no Marketplace</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-slate-600" />
              </Command.Item>

              <Command.Item
                value="configuracoes da empresa dados logo notificacoes recibo"
                onSelect={() => handleSelect(() => navigate('/settings'))}
                className="flex items-center justify-between gap-3 px-3 py-2 rounded-xl text-sm text-slate-200 cursor-pointer transition-colors data-[selected=true]:bg-cyan-500/15 data-[selected=true]:text-cyan-300 group"
              >
                <div className="flex items-center gap-3">
                  <Settings className="w-4 h-4 text-slate-400 group-hover:text-cyan-400" />
                  <span>Configurações do Sistema</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-slate-600" />
              </Command.Item>

              <Command.Item
                value="licencas modulos planos assinatura status"
                onSelect={() => handleSelect(() => navigate('/admin/licensing'))}
                className="flex items-center justify-between gap-3 px-3 py-2 rounded-xl text-sm text-slate-200 cursor-pointer transition-colors data-[selected=true]:bg-cyan-500/15 data-[selected=true]:text-cyan-300 group"
              >
                <div className="flex items-center gap-3">
                  <KeyRound className="w-4 h-4 text-amber-400 group-hover:text-cyan-400" />
                  <span>Módulos & Licenciamento</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-slate-600" />
              </Command.Item>

              <Command.Item
                value="ajuda central de suporte tutoriais atalhos duvidas"
                onSelect={() => handleSelect(() => navigate('/ajuda'))}
                className="flex items-center justify-between gap-3 px-3 py-2 rounded-xl text-sm text-slate-200 cursor-pointer transition-colors data-[selected=true]:bg-cyan-500/15 data-[selected=true]:text-cyan-300 group"
              >
                <div className="flex items-center gap-3">
                  <HelpCircle className="w-4 h-4 text-slate-400 group-hover:text-cyan-400" />
                  <span>Central de Ajuda & Tutoriais</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-slate-600" />
              </Command.Item>
            </Command.Group>

            <Command.Separator className="h-px bg-white/10 my-1" />

            {/* SERVIÇOS DO CATÁLOGO */}
            {services.length > 0 && (
              <Command.Group 
                heading="Serviços & Procedimentos" 
                className="px-2 py-1.5 text-[11px] font-semibold text-blue-400 tracking-wider uppercase [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-blue-400/90"
              >
                {services.slice(0, 5).map((service) => (
                  <Command.Item
                    key={service.id}
                    value={`servico ${service.name} ${service.category || ''} ${service.price || ''}`}
                    onSelect={() => handleSelect(() => {
                      navigate(`/services?search=${encodeURIComponent(service.name)}`);
                    })}
                    className="flex items-center justify-between gap-3 px-3 py-2 rounded-xl text-sm text-slate-200 cursor-pointer transition-colors data-[selected=true]:bg-cyan-500/15 data-[selected=true]:text-cyan-300 group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-7 h-7 rounded-lg bg-blue-500/15 text-blue-400 flex items-center justify-center font-bold text-xs shrink-0 border border-blue-500/25">
                        <Tag className="w-3.5 h-3.5" />
                      </div>
                      <div className="min-w-0">
                        <div className="font-medium text-slate-100 truncate group-hover:text-cyan-200">
                          {service.name}
                        </div>
                        <div className="text-xs text-slate-400 truncate flex items-center gap-2">
                          {service.category && <span>{service.category}</span>}
                          {service.duration && <span className="text-slate-500">• {service.duration}</span>}
                        </div>
                      </div>
                    </div>
                    <div className="font-mono text-xs font-semibold text-emerald-400 shrink-0">
                      {formatMoney.format(service.price || 0)}
                    </div>
                  </Command.Item>
                ))}
              </Command.Group>
            )}
          </Command.List>

          {/* Footer Guide */}
          <div className="px-4 py-2.5 border-t border-white/10 bg-black/40 flex items-center justify-between text-[11px] text-slate-400">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1">
                <kbd className="px-1 py-0.5 bg-white/10 border border-white/10 rounded text-[9px] font-mono text-slate-300">↑</kbd>
                <kbd className="px-1 py-0.5 bg-white/10 border border-white/10 rounded text-[9px] font-mono text-slate-300">↓</kbd>
                navegar
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-1 py-0.5 bg-white/10 border border-white/10 rounded text-[9px] font-mono text-slate-300">↵</kbd>
                selecionar
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-1 py-0.5 bg-white/10 border border-white/10 rounded text-[9px] font-mono text-slate-300">esc</kbd>
                fechar
              </span>
            </div>
            <div className="hidden sm:flex items-center gap-1 text-slate-500">
              <span>Bella PDV Pro</span>
              <span className="text-cyan-500">•</span>
              <span>Command Palette</span>
            </div>
          </div>
        </Command>
      </div>
    </div>
  );
}
