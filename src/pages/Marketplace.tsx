import React, { useState, useEffect } from 'react';
import { 
  ShoppingBag, 
  Puzzle, 
  Settings2, 
  Sliders, 
  Activity, 
  CheckCircle2, 
  X, 
  Zap, 
  Coins, 
  ShieldAlert, 
  Layers, 
  Search, 
  Plus, 
  Key, 
  Database, 
  Clock, 
  Flame, 
  ArrowRight, 
  Check, 
  XSquare, 
  AlertCircle,
  HelpCircle,
  Mail,
  ChevronRight,
  TrendingUp,
  SlidersHorizontal,
  FileSpreadsheet,
  Grid,
  Bot,
  Percent,
  RefreshCw,
  Globe,
  Palette,
  Shield,
  Trash2,
  Users,
  Building,
  DollarSign
} from 'lucide-react';
import { 
  AreaChart, Area, BarChart, Bar, 
  XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, PieChart, Pie, Cell 
} from 'recharts';
import { toast } from 'sonner';
import { 
  collection, 
  doc, 
  setDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  onSnapshot, 
  getDocs, 
  query 
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuthStore } from '../store/auth';

// ==========================================
// INTERFACES & DATA SCHEMAS
// ==========================================

interface AppItem {
  id: string;
  name: string;
  description: string;
  category: string;
  rating: number;
  price: string;
  monthlyCost: number;
  planRequired: 'Bronze' | 'Prata' | 'Ouro' | 'Grátis';
  installCount: number;
  isNative: boolean;
  version: string;
  author: string;
}

interface InstalledApp {
  appId: string;
  status: 'active' | 'inactive';
  apiKey?: string;
  apiSecret?: string;
  installedAt: string;
  premiumAgreement: boolean;
}

interface AddonRequest {
  id: string;
  companyId: string;
  companyName: string;
  addon: string;
  addonName: string;
  status: 'pending' | 'analyzing' | 'approved' | 'active' | 'rejected';
  plan: string;
  requestedAt: string;
  cost: number;
}

interface AutomationFlow {
  id: string;
  name: string;
  trigger: string;
  actions: string[];
  enabled: boolean;
  executedCount: number;
  lastExecuted: string;
}

interface CompanyLicense {
  id: string;
  name: string;
  plan: 'Bronze' | 'Prata' | 'Ouro';
  status: 'active' | 'trial' | 'expired';
  expireDate: string;
  aiUsage: number; // in %
  waUsage: number; // messages sent
  unitsCount: number;
  maxUsers: number;
}

const CATEGORIES = [
  'Todos', 'Financeiro', 'Marketing', 'Automação', 'WhatsApp', 'IA', 'CRM', 
  'Fiscal', 'Gestão', 'Produtividade', 'Integrações', 'Agendamento', 
  'Fidelização', 'Analytics', 'RH'
];

const APP_LIST: AppItem[] = [
  {
    id: 'whatsapp_premium',
    name: 'WhatsApp Business',
    description: 'Envio automático de lembretes de agendamentos e cobranças no WhatsApp oficial do salão.',
    category: 'WhatsApp',
    rating: 4.85,
    price: 'Extra',
    monthlyCost: 19.90,
    planRequired: 'Grátis',
    installCount: 1420,
    isNative: true,
    version: '2.4.1',
    author: 'Bella Native'
  },
  {
    id: 'campaigns_auto',
    name: 'Campanhas Automáticas',
    description: 'Disparos automatizados e segmentados de campanhas promocionais e cupons de retorno.',
    category: 'Marketing',
    rating: 4.7,
    price: 'Grátis',
    monthlyCost: 0,
    planRequired: 'Prata',
    installCount: 980,
    isNative: true,
    version: '1.2.0',
    author: 'Bella Native'
  },
  {
    id: 'crm_avancado',
    name: 'CRM Avançado',
    description: 'Funil e régua de relacionamento para reatar com clientes inativos há 30, 60 ou 90 dias.',
    category: 'CRM',
    rating: 4.9,
    price: 'Incluso',
    monthlyCost: 0,
    planRequired: 'Prata',
    installCount: 820,
    isNative: true,
    version: '3.1.0',
    author: 'Bella Native'
  },
  {
    id: 'bella_ia_marketing',
    name: 'IA Marketing e Assistente',
    description: 'Inteligência generativa para sugerir posts, analisar feedbacks sob medida e prever faturamento.',
    category: 'IA',
    rating: 4.95,
    price: 'Extra',
    monthlyCost: 39.90,
    planRequired: 'Ouro',
    installCount: 1100,
    isNative: true,
    version: '4.0.2',
    author: 'Bella Native'
  },
  {
    id: 'cashback_loyalty',
    name: 'Cashback e Fidelidade',
    description: 'Programa de pontos personalizável para presentear clientes fiéis e gerar créditos virtuais.',
    category: 'Fidelização',
    rating: 4.88,
    price: 'Grátis',
    monthlyCost: 0,
    planRequired: 'Grátis',
    installCount: 2310,
    isNative: true,
    version: '1.5.0',
    author: 'Bella Native'
  },
  {
    id: 'white_label',
    name: 'White Label Customizer',
    description: 'Personalização completa com seu próprio domínio, logo, cores e app submetido nas lojas.',
    category: 'Gestão',
    rating: 4.93,
    price: 'Extra',
    monthlyCost: 99.90,
    planRequired: 'Ouro',
    installCount: 310,
    isNative: true,
    version: '2.0.0',
    author: 'Bella Native'
  },
  {
    id: 'agendamento_widget',
    name: 'Agendamento Premium',
    description: 'Widget de auto-atendimento para link da bio do Instagram, site próprio ou Facebook.',
    category: 'Agendamento',
    rating: 4.78,
    price: 'Incluso',
    monthlyCost: 0,
    planRequired: 'Grátis',
    installCount: 3450,
    isNative: true,
    version: '5.1.2',
    author: 'Bella Native'
  },
  // External
  {
    id: 'asaas',
    name: 'Asaas Gateways',
    description: 'Faturamento via Pix automatizado, geração de boletos rápidos e split de pagamentos.',
    category: 'Financeiro',
    rating: 4.6,
    price: 'Incluso',
    monthlyCost: 0,
    planRequired: 'Prata',
    installCount: 1450,
    isNative: false,
    version: '2.1.0',
    author: 'Asaas Brasil'
  },
  {
    id: 'mercado_pago',
    name: 'Mercado Pago Checkout',
    description: 'Pagamentos online ou presenciais integrados diretamente à sua conta bancária.',
    category: 'Financeiro',
    rating: 4.5,
    price: 'Grátis',
    monthlyCost: 0,
    planRequired: 'Grátis',
    installCount: 2200,
    isNative: false,
    version: '1.2.4',
    author: 'Mercado Pago'
  },
  {
    id: 'stripe',
    name: 'Stripe Payments',
    description: 'Infraestrutura global de pagamentos seguros por cartão de crédito e Apple Pay.',
    category: 'Financeiro',
    rating: 4.82,
    price: 'Incluso',
    monthlyCost: 0,
    planRequired: 'Ouro',
    installCount: 512,
    isNative: false,
    version: '3.0.1',
    author: 'Stripe Global'
  },
  {
    id: 'google_calendar',
    name: 'Google Calendar e Agenda',
    description: 'Sincronização instantânea bidirecional dos agendamentos entre Bella ERP e Google.',
    category: 'Agendamento',
    rating: 4.7,
    price: 'Grátis',
    monthlyCost: 0,
    planRequired: 'Grátis',
    installCount: 4100,
    isNative: false,
    version: '1.1.2',
    author: 'Google LLC'
  }
];

const areaData = [
  { name: 'Jan', MRR: 4500, Premium: 1200 },
  { name: 'Fev', MRR: 5200, Premium: 1800 },
  { name: 'Mar', MRR: 6100, Premium: 2100 },
  { name: 'Abr', MRR: 7800, Premium: 3200 },
  { name: 'Mai', MRR: 9500, Premium: 4500 },
  { name: 'Jun', MRR: 12400, Premium: 6100 }
];

export default function Marketplace() {
  const userId = useAuthStore(state => state.user?.id);
  const isDemo = useAuthStore(state => state.user?.isDemo === true);
  const isPlatformAdmin = useAuthStore(state => state.user?.isPlatformAdmin === true);
  const storageKey = (name: string) => `bella_marketplace_${userId || 'signed-out'}_${name}`;
  const [activeTab, setActiveTab] = useState<'store' | 'recursos' | 'builder' | 'superadmin'>('store');
  const [selectedCategory, setSelectedCategory] = useState<string>('Todos');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Local storage cache or dynamic states
  const [installedApps, setInstalledApps] = useState<InstalledApp[]>(() => {
    try {
      localStorage.removeItem('bella_marketplace_installed');
      const saved = localStorage.getItem(storageKey('installed'));
      if (saved) return JSON.parse(saved);
    } catch {}
    return isDemo ? [
      { appId: 'whatsapp_premium', status: 'active', installedAt: '2026-06-01', premiumAgreement: true },
      { appId: 'campaigns_auto', status: 'active', installedAt: '2026-06-10', premiumAgreement: false }
    ] : [];
  });

  const [addonRequests, setAddonRequests] = useState<AddonRequest[]>(() => {
    try {
      localStorage.removeItem('bella_marketplace_requests');
      const saved = localStorage.getItem(storageKey('requests'));
      if (saved) return JSON.parse(saved);
    } catch {}
    return isDemo ? [
      { id: 'req_1', companyId: 'comp_99', companyName: 'Bella Studio Moema', addon: 'bella_ia_marketing', addonName: 'IA Marketing e Assistente', status: 'pending', plan: 'Pro', requestedAt: '2026-06-19 14:12', cost: 39.90 },
      { id: 'req_2', companyId: 'comp_102', companyName: 'Studio Glamour Jardins', addon: 'whatsapp_premium', addonName: 'WhatsApp Business', status: 'pending', plan: 'Básico', requestedAt: '2026-06-19 12:45', cost: 19.90 },
      { id: 'req_3', companyId: 'comp_77', companyName: 'Barbearia Navalha de Ouro', addon: 'white_label', addonName: 'White Label Customizer', status: 'approved', plan: 'Premium', requestedAt: '2026-06-18 10:20', cost: 99.90 }
    ] : [];
  });

  const [automations, setAutomations] = useState<AutomationFlow[]>(() => {
    try {
      localStorage.removeItem('bella_marketplace_automations');
      const saved = localStorage.getItem(storageKey('automations'));
      if (saved) return JSON.parse(saved);
    } catch {}
    return isDemo ? [
      { id: 'auto_1', name: 'Alerta Automático de Cliente Sumido', trigger: 'Cliente inativo há 30 dias', actions: ['Criar Cupom de 15%', 'Disparar WhatsApp'], enabled: true, executedCount: 124, lastExecuted: '2026-06-19 18:22' },
      { id: 'auto_2', name: 'NPS de Avaliação de Visita', trigger: 'Serviço finalizado no PDV', actions: ['Enviar WhatsApp com Link Google Reviews'], enabled: true, executedCount: 382, lastExecuted: '2026-06-19 20:02' }
    ] : [];
  });

  const [licenses, setLicenses] = useState<CompanyLicense[]>([]);

  // License enumeration requires the verified platform admin claim.
  useEffect(() => {
    if (!isPlatformAdmin) { setLicenses([]); return; }
    const unsubscribe = onSnapshot(collection(db, 'company_licenses'), (snapshot) => {
      const loaded: CompanyLicense[] = snapshot.docs.map(docSnap => {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          name: data.name || '',
          plan: data.plan || 'Bronze',
          status: data.status || 'active',
          expireDate: data.expireDate || '',
          aiUsage: typeof data.aiUsage === 'number' ? data.aiUsage : 0,
          waUsage: typeof data.waUsage === 'number' ? data.waUsage : 0,
          unitsCount: typeof data.unitsCount === 'number' ? data.unitsCount : 1,
          maxUsers: typeof data.maxUsers === 'number' ? data.maxUsers : 5,
        };
      });
      setLicenses(loaded);
    }, error => console.error('Erro ao ler licenças:', error));
    return () => unsubscribe();
  }, [isPlatformAdmin]);

  // CRUD state of licenses (Cérebro Comercial)
  const [editingLicense, setEditingLicense] = useState<CompanyLicense | null>(null);
  const [isLicenseFormOpen, setIsLicenseFormOpen] = useState(false);
  const [licFormId, setLicFormId] = useState('');
  const [licFormName, setLicFormName] = useState('');
  const [licFormPlan, setLicFormPlan] = useState<'Bronze' | 'Prata' | 'Ouro'>('Bronze');
  const [licFormStatus, setLicFormStatus] = useState<'active' | 'trial' | 'expired'>('active');
  const [licFormExpireDate, setLicFormExpireDate] = useState('2026-12-31');
  const [licFormAiUsage, setLicFormAiUsage] = useState(0);
  const [licFormWaUsage, setLicFormWaUsage] = useState(0);
  const [licFormUnitsCount, setLicFormUnitsCount] = useState(1);
  const [licFormMaxUsers, setLicFormMaxUsers] = useState(5);

  const handleSaveLicense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!licFormId.trim() || !licFormName.trim()) {
      toast.error('O ID da empresa e o nome são campos obrigatórios!');
      return;
    }

    const licenseData: CompanyLicense = {
      id: licFormId.trim(),
      name: licFormName.trim(),
      plan: licFormPlan,
      status: licFormStatus,
      expireDate: licFormExpireDate,
      aiUsage: Number(licFormAiUsage) || 0,
      waUsage: Number(licFormWaUsage) || 0,
      unitsCount: Number(licFormUnitsCount) || 1,
      maxUsers: Number(licFormMaxUsers) || 5
    };

    try {
      await setDoc(doc(db, 'company_licenses', licenseData.id), licenseData);
      toast.success(editingLicense ? 'Licença atualizada no Firestore com sucesso!' : 'Nova licença salva no Firestore!');
      resetLicenseForm();
    } catch (err: any) {
      toast.error('Erro ao salvar no Firestore: ' + err.message);
    }
  };

  const handleEditLicenseClick = (lic: CompanyLicense) => {
    setEditingLicense(lic);
    setLicFormId(lic.id);
    setLicFormName(lic.name);
    setLicFormPlan(lic.plan);
    setLicFormStatus(lic.status);
    setLicFormExpireDate(lic.expireDate);
    setLicFormAiUsage(lic.aiUsage);
    setLicFormWaUsage(lic.waUsage);
    setLicFormUnitsCount(lic.unitsCount);
    setLicFormMaxUsers(lic.maxUsers);
    setIsLicenseFormOpen(true);
  };

  const handleDeleteLicenseClick = async (id: string) => {
    if (!confirm('Deseja realmente excluir esta licença do Firestore?')) return;
    try {
      await deleteDoc(doc(db, 'company_licenses', id));
      toast.success('Licença deletada no Firestore com sucesso!');
    } catch (err: any) {
      toast.error('Erro ao deletar licença: ' + err.message);
    }
  };

  const resetLicenseForm = () => {
    setEditingLicense(null);
    setLicFormId('');
    setLicFormName('');
    setLicFormPlan('Bronze');
    setLicFormStatus('active');
    setLicFormExpireDate('2026-12-31');
    setLicFormAiUsage(0);
    setLicFormWaUsage(0);
    setLicFormUnitsCount(1);
    setLicFormMaxUsers(5);
    setIsLicenseFormOpen(false);
  };

  // White label sub-configs inside state
  const [wlConfig, setWlConfig] = useState({
    logo: 'https://images.unsplash.com/photo-1599305445671-ac291c95aba9?auto=format&fit=crop&h=100&q=80',
    domain: 'sistema.bellaestetica.com.br',
    colors: '#06B6D4',
    subdomain: 'bellaestetica.bellapdv.com.br',
    favicon: 'https://images.unsplash.com/photo-1599305445671-ac291c95aba9?auto=format&fit=crop&h=32&q=80'
  });

  // Flow designer inputs
  const [newFlowName, setNewFlowName] = useState('');
  const [selectedTrigger, setSelectedTrigger] = useState('Cliente inativo há 30 dias');
  const [selectedActions, setSelectedActions] = useState<string[]>(['Criar Cupom de 15%']);

  // Log notifications state
  useEffect(() => {
    try {
      if (userId) localStorage.setItem(storageKey('installed'), JSON.stringify(installedApps));
    } catch {}
  }, [installedApps, userId]);

  useEffect(() => {
    try {
      if (userId) localStorage.setItem(storageKey('requests'), JSON.stringify(addonRequests));
    } catch {}
  }, [addonRequests, userId]);

  useEffect(() => {
    try {
      if (userId) localStorage.setItem(storageKey('automations'), JSON.stringify(automations));
    } catch {}
  }, [automations, userId]);

  // Request activation of addon handler
  const requestAddonActivation = (addonId: string, addonName: string, cost: number) => {
    if (!isDemo) { toast.error('Solicitações de add-ons ainda não são enviadas ao administrador.'); return; }
    // Check if progress already requested
    const exists = addonRequests.find(r => r.addon === addonId && (r.status === 'pending' || r.status === 'analyzing'));
    if (exists) {
      toast.error('Este recurso já possui uma solicitação em andamento!');
      return;
    }

    // Check if already active
    const activeExists = addonRequests.find(r => r.addon === addonId && r.status === 'active');
    if (activeExists) {
      toast.info('Recurso já ativo no seu estabelecimento!');
      return;
    }

    const newReq: AddonRequest = {
      id: 'req_' + Date.now(),
      companyId: 'comp_current',
      companyName: 'Bella Studio Moema',
      addon: addonId,
      addonName,
      status: 'pending',
      plan: 'Prata',
      requestedAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
      cost
    };

    setAddonRequests(p => [newReq, ...p]);
    toast.success('Solicitação de ativação enviada!', {
      description: `Módulo "${addonName}" foi enviado para análise na Central Super Admin.`
    });
  };

  // Superadmin approvals & actions
  const changeRequestStatus = (id: string, nextStatus: 'pending' | 'analyzing' | 'approved' | 'active' | 'rejected') => {
    if (!isDemo) { toast.error('Aprovação e cobrança indisponíveis até integrar o gateway.'); return; }
    setAddonRequests(prev => prev.map(req => {
      if (req.id === id) {
        if (nextStatus === 'approved') {
          // Send automatic notification & update billing
          toast.success(`Solicitação Aprovada! Cobrança automática de R$${req.cost.toFixed(2)} gerada via gateway.`);
          // Automatically add app to installed with status native
          const appModel = APP_LIST.find(a => a.id === req.addon);
          if (appModel) {
            setInstalledApps(ia => [
              ...ia.filter(x => x.appId !== req.addon),
              { appId: req.addon, status: 'active', installedAt: '2026-06-19', premiumAgreement: true }
            ]);
          }
        } else if (nextStatus === 'rejected') {
          toast.error('Solicitação de recurso recusada pelo administrador.');
        }
        return { ...req, status: nextStatus };
      }
      return req;
    }));
  };

  const createAutomationFlow = () => {
    if (!newFlowName.trim()) {
      toast.error('Por favor, informe o nome do fluxo.');
      return;
    }

    const newFlow: AutomationFlow = {
      id: 'auto_' + Date.now(),
      name: newFlowName,
      trigger: selectedTrigger,
      actions: [...selectedActions],
      enabled: true,
      executedCount: 0,
      lastExecuted: 'Nunca executado'
    };

    setAutomations(prev => [newFlow, ...prev]);
    setNewFlowName('');
    toast.info('Rascunho salvo neste navegador. Execução automática não configurada.');
  };

  const handleDeleteFlow = (id: string) => {
    setAutomations(p => p.filter(x => x.id !== id));
    toast.success('Automação removida.');
  };

  const handleToggleFlow = (id: string) => {
    setAutomations(p => p.map(x => x.id === id ? { ...x, enabled: !x.enabled } : x));
  };

  // Calculations for Admin Stats Card with exact BellaPDV Pro plan prices
  const totalSubscribers = licenses.length;
  const mrrFromPlans = licenses.reduce((sum, item) => {
    const p = (item.plan || '').toLowerCase();
    if (p.includes('ouro') || p.includes('premium')) return sum + 249.90;
    if (p.includes('prata') || p.includes('pro')) return sum + 149.90;
    return sum + 89.90; // Plano Básico / Bronze (R$ 89,90)
  }, 0);
  const mrrFromAddons = addonRequests.filter(r => r.status === 'approved' || r.status === 'active').reduce((sum, item) => sum + item.cost, 0);
  const totalMrr = mrrFromPlans + mrrFromAddons;

  const filteredApps = APP_LIST.filter(app => {
    const matchesCategory = selectedCategory === 'Todos' || app.category === selectedCategory;
    const matchesSearch = app.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          app.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="flex-1 bg-[#090D1A] min-h-screen text-slate-100 flex flex-col overflow-auto font-sans">
      
      {/* Top Header Glow Frame */}
      <div className="relative border-b border-cyan-500/10 bg-gradient-to-r from-[#0C1224] to-[#0A0E1A] py-10 px-6 md:px-12 shadow-[0_4px_30px_rgba(0,0,0,0.5)] overflow-hidden">
        <div className="absolute right-0 top-0 w-[500px] h-[500px] bg-cyan-500/5 blur-[140px] rounded-full pointer-events-none" />
        <div className="absolute left-1/4 bottom-0 w-[400px] h-[400px] bg-indigo-500/5 blur-[120px] rounded-full pointer-events-none" />
        
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-3">
            <div className="flex items-center gap-2.5 text-xs text-cyan-400 font-bold uppercase tracking-widest">
              <Zap className="w-4 h-4 animate-bounce" />
              <span>Plataforma Unificada Bella ERP</span>
            </div>
            <h1 className="text-3xl md:text-5xl font-extrabold text-white tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-100 to-cyan-400">
              Bella Hub & Marketplace
            </h1>
            <p className="text-sm text-slate-400 max-w-2xl leading-relaxed">
              Expanda suas potencialidades comerciais integrando gateways, ferramentas de marketing inteligência generativa e customizadores corporativos.
            </p>
          </div>

          <div className="bg-[#121A30]/50 backdrop-blur-xl border border-cyan-500/20 px-6 py-5 rounded-2xl flex items-center gap-5 shadow-2xl">
            <div className="p-3.5 rounded-xl bg-cyan-950/50 text-cyan-400 border border-cyan-500/20 shadow-inner">
              <Coins className="w-7 h-7" />
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Custos Gerenciamento</span>
              <span className="text-2xl font-black text-white">R$ {(installedApps.reduce((acc, current) => {
                const match = APP_LIST.find(a => a.id === current.appId);
                return acc + (match?.monthlyCost || 0);
              }, 0)).toFixed(2)} <span className="text-xs font-semibold text-slate-400">/ mês</span></span>
              <span className="text-[11px] text-cyan-300 font-medium">{installedApps.length} Recursos ativos em produção</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Tabs Navigation */}
      <div className="bg-[#0A0F1E] border-b border-white/5 sticky top-0 z-40 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 md:px-8 flex items-center justify-between overflow-x-auto select-none">
          <div className="flex items-center space-x-1 py-1">
            <button
              id="tab-store"
              onClick={() => setActiveTab('store')}
              className={`flex items-center gap-2.5 py-4 px-5 border-b-2 font-semibold text-xs uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer ${
                activeTab === 'store' 
                  ? 'border-cyan-500 text-cyan-400 bg-cyan-500/5' 
                  : 'border-transparent text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <ShoppingBag className="w-4 h-4" />
              App Store Marketplace
            </button>
            <button
              id="tab-recursos"
              onClick={() => setActiveTab('recursos')}
              className={`flex items-center gap-2.5 py-4 px-5 border-b-2 font-semibold text-xs uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer ${
                activeTab === 'recursos' 
                  ? 'border-cyan-500 text-cyan-400 bg-cyan-500/5' 
                  : 'border-transparent text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Settings2 className="w-4 h-4" />
              Recursos Extras / Add-ons
            </button>
            <button
              id="tab-builder"
              onClick={() => setActiveTab('builder')}
              className={`flex items-center gap-2.5 py-4 px-5 border-b-2 font-semibold text-xs uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer ${
                activeTab === 'builder' 
                  ? 'border-cyan-500 text-cyan-400 bg-cyan-500/5' 
                  : 'border-transparent text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Sliders className="w-4 h-4" />
              Bella AI Flow Builder
            </button>
            <button
              id="tab-superadmin"
              onClick={() => setActiveTab('superadmin')}
              className={`flex items-center gap-2.5 py-4 px-5 border-b-2 font-semibold text-xs uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer ${
                activeTab === 'superadmin' 
                  ? 'border-indigo-500 text-indigo-400 bg-indigo-500/5' 
                  : 'border-transparent text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <ShieldAlert className="w-4 h-4 text-indigo-400" />
              Console Super Admin
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6 md:p-8 flex-1 w-full flex flex-col">
        
        {/* ==========================================
            TAB: APP STORE STOREFRONT
            ========================================== */}
        {activeTab === 'store' && (
          <div className="space-y-8 flex-1">
            
            {/* Automatic AI Recommendation Promotion */}
            <div className="bg-gradient-to-r from-cyan-950/70 via-[#0e172a] to-slate-950 border border-cyan-500/30 rounded-2xl p-6 relative overflow-hidden shadow-2xl flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="absolute -left-10 -bottom-10 w-40 h-40 bg-cyan-400/10 blur-3xl rounded-full" />
              <div className="flex items-start gap-4 z-10">
                <div className="p-3 bg-gradient-to-tr from-cyan-400 to-indigo-500 text-black font-extrabold rounded-xl shadow-lg">
                  <Bot className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] bg-cyan-500/10 text-cyan-400 px-2 py-0.5 rounded font-extrabold uppercase tracking-wide">Dica Inteligente Bella AI</span>
                    <span className="text-xs text-slate-400">Análise de métricas em tempo real</span>
                  </div>
                  <h3 className="text-base font-extrabold text-white">Detectamos 1.250 clientes em sua base com baixo uso de CRM</h3>
                  <p className="text-xs text-slate-400 max-w-xl">
                    Seu estabelecimento possui um potencial estimado de <strong className="text-cyan-300 font-bold">+18% de recorrência de faturamento</strong> se ativar a automação do CRM Avançado integrada ao WhatsApp oficial.
                  </p>
                </div>
              </div>
              <button 
                onClick={() => requestAddonActivation('crm_avancado', 'CRM Avançado', 0)}
                className="z-10 px-5 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-black text-xs font-black rounded-xl transition-all shadow-md flex items-center gap-2 hover:scale-[1.02] cursor-pointer"
              >
                Ativar CRM Avançado
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            <div className="flex flex-col lg:flex-row gap-8 items-start">
              
              {/* Category sidebar */}
              <aside className="w-full lg:w-[220px] bg-[#0E1528]/80 border border-white/5 rounded-2xl p-4 space-y-2 flex-shrink-0">
                <span className="text-[10px] uppercase font-bold text-slate-500 pl-2">Filtrar por Categoria</span>
                <div className="flex flex-wrap lg:flex-col gap-1">
                  {CATEGORIES.map(cat => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`w-full text-left px-3.5 py-2 rounded-xl text-xs font-semibold transition-all flex items-center justify-between cursor-pointer ${
                        selectedCategory === cat
                          ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/20 font-bold'
                          : 'text-slate-400 hover:text-white hover:bg-white/5 border border-transparent'
                      }`}
                    >
                      <span>{cat}</span>
                      {cat === 'Todos' && (
                        <span className="text-[10px] bg-[#141E34] px-1.5 py-0.5 rounded text-slate-500 font-bold">{APP_LIST.length}</span>
                      )}
                    </button>
                  ))}
                </div>
              </aside>

              {/* Grid content list split */}
              <div className="flex-1 space-y-6 w-full">
                <div className="flex flex-col sm:flex-row gap-4 justify-between items-stretch sm:items-center bg-[#0E1528] rounded-xl border border-white/5 p-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Pesquisar aplicativos e integrações integradas..."
                      className="w-full bg-[#141C30] border border-white/10 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-slate-500 outline-none focus:border-cyan-500/50 transition-all font-medium"
                    />
                  </div>
                  <span className="text-xs text-slate-400 whitespace-nowrap pl-2">
                    Exibindo <strong>{filteredApps.length}</strong> de {APP_LIST.length} módulos
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {filteredApps.map((app) => {
                    const isInstalled = installedApps.some(i => i.appId === app.id);
                    const isRequested = addonRequests.some(r => r.addon === app.id && r.status === 'pending');
                    const isActive = addonRequests.some(r => r.addon === app.id && r.status === 'active') || isInstalled;

                    return (
                      <div 
                        key={app.id}
                        className="bg-[#0E1528] rounded-2xl border border-white/5 overflow-hidden flex flex-col justify-between hover:border-cyan-500/25 transition-all shadow-xl relative"
                      >
                        <div className="p-5 space-y-4 flex-1">
                          
                          {/* Badge header */}
                          <div className="flex items-center justify-between">
                            <span className="bg-[#142036] text-cyan-400 border border-cyan-500/10 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider font-mono">
                              {app.category}
                            </span>
                            <div className="flex items-center gap-1">
                              <span className="text-xs text-amber-400">★</span>
                              <span className="text-[10px] text-slate-400 font-semibold">{app.rating.toFixed(1)}</span>
                            </div>
                          </div>

                          <div className="space-y-1.5">
                            <h3 className="text-sm font-bold text-white flex items-center gap-2">
                              {app.name}
                              {app.isNative && (
                                <span className="text-[8px] bg-cyan-500/10 border border-cyan-500/20 px-1 py-0.2 rounded text-cyan-400 font-mono font-black tracking-wider">NAT</span>
                              )}
                            </h3>
                            <p className="text-xs text-slate-400 leading-relaxed truncate-2-lines min-h-[32px]">
                              {app.description}
                            </p>
                          </div>

                          <div className="pt-3 border-t border-white/5 flex items-center justify-between text-[11px] text-slate-500 font-mono">
                            <span>Req: <strong>{app.planRequired}</strong></span>
                            <span>Custo: {app.monthlyCost > 0 ? `R$${app.monthlyCost}/mê` : 'Isento'}</span>
                          </div>
                        </div>

                        <div className="bg-[#0A0F1E] border-t border-white/5 px-5 py-3 flex items-center justify-between">
                          <span className="text-xs text-white font-bold">
                            {app.monthlyCost > 0 ? `R$ ${app.monthlyCost.toFixed(2)}/m` : 'Incluso'}
                          </span>

                          {isActive ? (
                            <span className="text-[11px] text-emerald-400 font-bold flex items-center gap-1.5">
                              <Check className="w-3.5 h-3.5" /> Ativo
                            </span>
                          ) : isRequested ? (
                            <span className="text-[11px] text-amber-400 font-bold flex items-center gap-1.5 animate-pulse">
                              <RefreshCw className="w-3 h-3 animate-spin" /> Análise/Pendente
                            </span>
                          ) : (
                            <button
                              onClick={() => {
                                if (app.monthlyCost > 0) {
                                  requestAddonActivation(app.id, app.name, app.monthlyCost);
                                } else {
                                  toast.error('Ativação ainda indisponível. Este módulo depende de habilitação real no servidor.');
                                }
                              }}
                              className="px-3.5 py-1.5 bg-cyan-500 hover:bg-cyan-400 text-black text-xs font-bold rounded-lg transition-all cursor-pointer"
                            >
                              {app.monthlyCost > 0 ? 'Solicitar Código' : 'Ativar Agora'}
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ==========================================
            TAB: CLIENT EXTRA RESOURCES & WORKFLOW FLAGS
            ========================================== */}
        {activeTab === 'recursos' && (
          <div className="space-y-6 flex-1">
            <div className="border-b border-white/5 pb-4">
              <h2 className="text-xl font-bold text-white">Central de Recursos Adicionais</h2>
              <p className="text-xs text-slate-400">Aqui os clientes gerenciam e solicitam a expansão de recursos e funcionalidades específicas.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                { key: 'whatsapp_premium', name: 'WhatsApp Business API', cost: 19.90, desc: 'Faturamento central e disparos automatizados oficiais.', enabled: true },
                { key: 'bella_ia_marketing', name: 'Bella AI Redatora', cost: 39.90, desc: 'Automação na redação de conteúdos promocionais.', enabled: false },
                { key: 'white_label', name: 'White Label Enterprise', cost: 99.90, desc: 'Subdomínio personalizado e logo proprietária do salão.', enabled: false },
                { key: 'multitesta', name: 'Múltiplas Unidades', cost: 49.90, desc: 'Gerenciamento de estoque e equipe de filiais no mesmo painel.', enabled: false },
                { key: 'fiscal_nfce', name: 'Módulo Emissor NFC-e / CFS', cost: 29.90, desc: 'Geração direta integrada de comprovantes fiscais autorizados.', enabled: false },
                { key: 'app_mobile_client', name: 'App Mobile Exclusivo', cost: 49.90, desc: 'Aplicativo próprio do salão para agendamentos na App Store.', enabled: false }
              ].map(resource => {
                const reqState = addonRequests.find(r => r.addon === resource.key);
                let badgeText = "Disponível";
                let badgeClass = "bg-slate-500/10 text-slate-400 border border-slate-500/25";

                if (reqState) {
                  if (reqState.status === 'pending') {
                    badgeText = "Solicitado";
                    badgeClass = "bg-amber-500/10 text-amber-400 border border-amber-500/20 animate-pulse";
                  } else if (reqState.status === 'analyzing') {
                    badgeText = "Em Análise";
                    badgeClass = "bg-purple-500/10 text-purple-400 border border-purple-500/20";
                  } else if (reqState.status === 'approved') {
                    badgeText = "Aprovado";
                    badgeClass = "bg-blue-500/10 text-blue-400 border border-blue-500/20";
                  } else if (reqState.status === 'active' || installedApps.some(i => i.appId === resource.key)) {
                    badgeText = "Ativo";
                    badgeClass = "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20";
                  } else if (reqState.status === 'rejected') {
                    badgeText = "Recusado";
                    badgeClass = "bg-red-500/10 text-red-400 border border-red-500/20";
                  }
                } else if (installedApps.some(i => i.appId === resource.key)) {
                  badgeText = "Ativo";
                  badgeClass = "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20";
                }

                return (
                  <div key={resource.key} className="bg-[#0E1528] rounded-2xl border border-white/5 p-5 flex flex-col justify-between space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-slate-400 font-mono font-medium">Extra Addon</span>
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${badgeClass}`}>
                          {badgeText}
                        </span>
                      </div>
                      <h3 className="text-sm font-bold text-white">{resource.name}</h3>
                      <p className="text-xs text-slate-400 leading-relaxed">{resource.desc}</p>
                    </div>

                    <div className="pt-3 border-t border-white/5 flex items-center justify-between">
                      <div className="flex flex-col">
                        <span className="text-[9px] uppercase font-mono font-semibold text-slate-500">Preço Licença</span>
                        <span className="text-xs font-bold text-white">R$ {resource.cost.toFixed(2)} / mês</span>
                      </div>

                      {badgeText === "Ativo" ? (
                        <button 
                          disabled
                          className="px-3.5 py-1.5 bg-[#141C30]/50 border border-emerald-500/10 text-emerald-400 text-xs font-bold rounded-lg cursor-not-allowed select-none"
                        >
                          Módulo Ativo
                        </button>
                      ) : badgeText === "Solicitado" || badgeText === "Em Análise" ? (
                        <button 
                          disabled
                          className="px-3.5 py-1.5 bg-[#141C30]/40 border border-[#22D3EE]/10 text-[#22D3EE] text-xs font-bold rounded-lg cursor-not-allowed select-none animate-pulse"
                        >
                          Aguardando Liberação
                        </button>
                      ) : (
                        <button
                          onClick={() => requestAddonActivation(resource.key, resource.name, resource.cost)}
                          className="px-3.5 py-1.5 bg-[#06B6D4]/10 hover:bg-[#06B6D4]/25 border border-[#06B6D4]/30 text-[#22D3EE] text-xs font-bold rounded-lg transition-all cursor-pointer"
                        >
                          Solicitar Ativação
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ==========================================
            TAB: BELLA AI FLOW AUTOMATION BUILDER
            ========================================== */}
        {activeTab === 'builder' && (
          <div className="space-y-8 flex-1">
            <div className="border-b border-white/5 pb-4">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Sliders className="w-5 h-5 text-cyan-400" />
                Bella AI Flow Builder
              </h2>
              <p className="text-xs text-slate-400">Desenhe automações sem usar códigos, baseadas em triggers condicionais inteligentes e fluxos sequenciais do tipo Zapier/n8n.</p>
            </div>

            {/* Automation creation row */}
            <div className="bg-[#0E1528] rounded-2xl border border-white/5 p-6 space-y-6">
              <h3 className="text-xs font-extrabold uppercase tracking-widest text-[#22D3EE] border-b border-white/5 pb-3">
                Novo Fluxo de Trabalho Automatizado
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* 1. Nome do fluxo */}
                <div className="space-y-2">
                  <label className="text-[11px] uppercase font-bold text-slate-400">Nome identificador do fluxo</label>
                  <input
                    type="text"
                    value={newFlowName}
                    onChange={(e) => setNewFlowName(e.target.value)}
                    placeholder="Ex: Enviar Cupom pós Encontro de 45 dias"
                    className="w-full bg-[#141C30] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white outline-none focus:border-cyan-500/50"
                  />
                  <p className="text-[10px] text-slate-500 leading-normal">Um apelido simples para identificar no dashboard do salão.</p>
                </div>

                {/* 2. Seleção de gatilho */}
                <div className="space-y-2 bg-[#0A0F1E] border border-white/5 rounded-xl p-4">
                  <span className="text-[9px] font-extrabold bg-cyan-500/10 text-cyan-400 px-2.5 py-0.5 rounded font-mono uppercase">SE (GATILHO / TRIGGER)</span>
                  <div className="pt-2">
                    <select
                      value={selectedTrigger}
                      onChange={(e) => setSelectedTrigger(e.target.value)}
                      className="w-full bg-[#141C30] border border-white/10 rounded-lg px-3 py-2 text-xs text-white outline-none"
                    >
                      <option value="Cliente inativo há 30 dias">Cliente não retorna em 30 dias</option>
                      <option value="Serviço finalizado no PDV">Serviço de cabelo finalizado no caixa (PDV)</option>
                      <option value="Aniversário de cliente hoje">Aniversário do cliente cadastrado</option>
                      <option value="Lembrete de checkout faltante">Dívida pendente aberta ou atrasada</option>
                    </select>
                  </div>
                </div>

                {/* 3. Seleção de acções */}
                <div className="space-y-2 bg-[#0A0F1E] border border-white/5 rounded-xl p-4">
                  <span className="text-[9px] font-extrabold bg-indigo-500/10 text-indigo-400 px-2.5 py-0.5 rounded font-mono uppercase">ENTÃO (AÇÕES / EXECUTE)</span>
                  <div className="pt-2 space-y-1.5 max-h-[140px] overflow-y-auto">
                    {[
                      'Disparar WhatsApp', 
                      'Criar Cupom de 15%', 
                      'Notificar Gerente por Push', 
                      'Sincronizar Google Agenda',
                      'Incluir tag VIP no Perfil'
                    ].map(act => (
                      <label key={act} className="flex items-center gap-2.5 text-xs text-slate-300 font-medium cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={selectedActions.includes(act)}
                          onChange={() => {
                            if (selectedActions.includes(act)) {
                              setSelectedActions(p => p.filter(x => x !== act));
                            } else {
                              setSelectedActions(p => [...p, act]);
                            }
                          }}
                          className="rounded border-white/15 bg-white/5 text-cyan-500 focus:ring-0"
                        />
                        <span>{act}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-white/5 flex justify-end">
                <button
                  onClick={createAutomationFlow}
                  className="px-5 py-2 bg-cyan-500 hover:bg-cyan-400 text-black text-xs font-bold rounded-xl transition-all shadow-md flex items-center gap-2 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  Salvar e Ativar Fluxo
                </button>
              </div>
            </div>

            {/* List of active flow automations */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-white">Fluxos Configurados & Rodando</h3>
              <div className="grid grid-cols-1 gap-4">
                {automations.map(flow => (
                  <div key={flow.id} className="bg-[#0E1528] rounded-2xl border border-white/5 p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div className="space-y-3">
                      <div className="flex flex-wrap items-center gap-2.5">
                        <h4 className="text-sm font-bold text-white">{flow.name}</h4>
                        <span className={`px-2 py-0.2 rounded text-[9px] font-bold font-mono uppercase ${
                          flow.enabled ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-slate-500/10 text-slate-500'
                        }`}>
                          {flow.enabled ? 'Ativo / Monitorando' : 'Pausado'}
                        </span>
                      </div>

                      <div className="flex flex-col sm:flex-row gap-x-6 gap-y-1.5 text-xs text-slate-400">
                        <p className="flex items-center gap-1.5">
                          <span className="text-[10px] bg-cyan-500/15 text-cyan-300 font-mono px-1 rounded uppercase font-extrabold">Se:</span> {flow.trigger}
                        </p>
                        <p className="flex items-center gap-1.5">
                          <span className="text-[10px] bg-indigo-500/15 text-indigo-300 font-mono px-1 rounded uppercase font-extrabold">Então:</span> {flow.actions.join(' → ')}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 self-end md:self-auto border-t md:border-t-0 border-white/5 pt-3 md:pt-0 w-full md:w-auto justify-between md:justify-end">
                      <div className="text-left md:text-right flex flex-col font-mono text-[11px] text-slate-500">
                        <span>Disparos efetuados: <strong>{flow.executedCount}</strong></span>
                        <span>Último gatilho: {flow.lastExecuted}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleToggleFlow(flow.id)}
                          className="px-3 py-1.5 hover:bg-white/5 border border-white/10 rounded-lg text-[11px] font-bold text-slate-300 cursor-pointer"
                        >
                          {flow.enabled ? 'Pausar' : 'Ativar'}
                        </button>
                        <button
                          onClick={() => handleDeleteFlow(flow.id)}
                          className="p-1.5 hover:bg-red-500/15 text-slate-500 hover:text-red-400 rounded-lg border border-transparent hover:border-red-500/20 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ==========================================
            TAB: CONSOLE SUPER ADMIN BELLA (Enterprise Hub)
            ========================================== */}
        {activeTab === 'superadmin' && (
          <div className="space-y-8 flex-1">
            <div className="border-b border-white/5 pb-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <Shield className="w-5 h-5 text-indigo-400" />
                  Console de Operações Super Admin
                </h2>
                <p className="text-xs text-slate-400 mt-1">Painel centralizado corporativo exclusivo para monitorar assinaturas, autorizar addons e configurar White Label.</p>
              </div>
              <span className="bg-indigo-950/40 border border-indigo-500/30 text-indigo-300 font-mono px-3 py-1 rounded text-xs">
                Acesso: <strong>Enterprise Master</strong>
              </span>
            </div>

            {/* Section 1: KPI Panels */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { title: 'Receita MRR Geral', value: `R$ ${(totalMrr).toFixed(2)}`, trend: '+14% este mês', icon: DollarSign, color: 'text-indigo-400' },
                { title: 'Receita de Addons Extra', value: `R$ ${(mrrFromAddons).toFixed(2)}`, trend: 'Disparos SMS / IA', icon: Coins, color: 'text-cyan-400' },
                { title: 'Churn da Plataforma', value: '1.2%', trend: 'Métrica excelente', icon: TrendingUp, color: 'text-emerald-400' },
                { title: 'LTV Estimado', value: 'R$ 1.540', trend: 'Base de 30 dias', icon: Activity, color: 'text-purple-400' }
              ].map(stat => (
                <div key={stat.title} className="bg-[#0E1528] rounded-2xl border border-white/5 p-5 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">{stat.title}</span>
                    <stat.icon className={`w-4 h-4 ${stat.color}`} />
                  </div>
                  <div>
                    <h4 className="text-xl font-extrabold text-white font-mono">{stat.value}</h4>
                    <p className="text-[10px] text-slate-500 mt-0.5">{stat.trend}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Split row: Addon approvals (Tabela de Solicitações) & Central de Licenciamento */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              {/* Tabela de Solicitações de Recursos */}
              <div className="lg:col-span-2 bg-[#0E1528] rounded-2xl border border-white/5 p-6 space-y-4">
                <div className="space-y-1">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <FolderOpenIcon className="w-4 h-4 text-cyan-400" />
                    Solicitações de Recursos Pendentes
                  </h3>
                  <p className="text-xs text-slate-500">Módulos extras premium solicitados pelos estabelecimentos e aguardando ativação fiscal comercial.</p>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left font-sans text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-white/5 text-slate-500 font-bold">
                        <th className="py-2.5">Empresa / Estabelecimento</th>
                        <th className="py-2.5">Recurso Premium</th>
                        <th className="py-2.5">Preço</th>
                        <th className="py-2.5">Data/Hora</th>
                        <th className="py-2.5">Status</th>
                        <th className="py-2.5 text-right">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {addonRequests.map(req => (
                        <tr key={req.id} className="hover:bg-white/5">
                          <td className="py-3 font-semibold text-white">{req.companyName}</td>
                          <td className="py-3 font-mono text-cyan-400">{req.addonName}</td>
                          <td className="py-3 font-mono">R$ {req.cost.toFixed(2)}</td>
                          <td className="py-3 text-slate-400">{req.requestedAt}</td>
                          <td className="py-3">
                            <span className={`px-2 py-0.2 rounded text-[10px] font-bold uppercase ${
                              req.status === 'pending' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20 animate-pulse' :
                              req.status === 'approved' || req.status === 'active' ? 'bg-emerald-500/10 text-emerald-400' :
                              'bg-slate-500/10 text-slate-400'
                            }`}>
                              {req.status === 'pending' ? 'Pendente' : req.status === 'approved' ? 'Aprovado' : 'Ativo'}
                            </span>
                          </td>
                          <td className="py-3 text-right space-x-1.5 self-center">
                            {req.status === 'pending' && (
                              <>
                                <button
                                  onClick={() => changeRequestStatus(req.id, 'approved')}
                                  className="px-2.5 py-1 bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold text-[10px] rounded"
                                >
                                  Aprovar / Cobrar
                                </button>
                                <button
                                  onClick={() => changeRequestStatus(req.id, 'rejected')}
                                  className="px-2.5 py-1 bg-red-500/20 hover:bg-red-500/30 text-red-400 font-extrabold text-[10px] rounded"
                                >
                                  Negar
                                </button>
                              </>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Central de Licenciamento (Cérebro Comercial) */}
              <div className="bg-[#0E1528] rounded-2xl border border-white/5 p-6 space-y-5">
                <div className="space-y-1">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Grid className="w-4 h-4 text-indigo-400" />
                    Central de Licenciamento Bella
                  </h3>
                  <p className="text-xs text-slate-500">Controle de limites operacionais, consumo da IA nativa & status comercial de estabelecimento.</p>
                </div>

                {/* Form to Create/Edit license - Displays inline or when button clicked */}
                <div className="bg-[#11182c] border border-cyan-500/10 p-4 rounded-xl space-y-3">
                  <div className="flex items-center justify-between border-b border-white/5 pb-2">
                    <h4 className="text-xs font-extrabold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5 font-mono">
                      <Zap className="w-3.5 h-3.5" />
                      {editingLicense ? 'Editar Ativação' : 'Novo Credenciamento'}
                    </h4>
                    {(isLicenseFormOpen || editingLicense) && (
                      <button 
                        onClick={resetLicenseForm}
                        className="text-[10px] text-slate-400 hover:text-white cursor-pointer font-bold underline"
                      >
                        Cancelar
                      </button>
                    )}
                  </div>

                  {(!isLicenseFormOpen && !editingLicense) ? (
                    <button
                      onClick={() => setIsLicenseFormOpen(true)}
                      className="w-full py-2 bg-gradient-to-r from-cyan-500 to-indigo-500 hover:from-cyan-400 hover:to-indigo-400 text-black text-xs font-black rounded-lg transition-all flex items-center justify-center gap-1.5 shadow cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Novo Estabelecimento
                    </button>
                  ) : (
                    <form onSubmit={handleSaveLicense} className="space-y-3 pt-1">
                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <label className="text-[9px] uppercase font-bold text-slate-400 block">ID Único</label>
                          <input
                            type="text"
                            value={licFormId}
                            onChange={(e) => setLicFormId(e.target.value)}
                            disabled={!!editingLicense}
                            placeholder="comp_99"
                            required
                            className="w-full bg-[#141d34] border border-white/10 rounded px-2.5 py-1.5 text-xs text-white disabled:opacity-50 font-mono"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[9px] uppercase font-bold text-slate-400 block">Nome Estabelecimento</label>
                          <input
                            type="text"
                            value={licFormName}
                            onChange={(e) => setLicFormName(e.target.value)}
                            placeholder="Ex: Studio Bella"
                            required
                            className="w-full bg-[#141d34] border border-white/10 rounded px-2.5 py-1.5 text-xs text-white"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <label className="text-[9px] uppercase font-bold text-slate-400 block">Plano Ativo</label>
                          <select
                            value={licFormPlan}
                            onChange={(e) => setLicFormPlan(e.target.value as any)}
                            className="w-full bg-[#141d34] border border-white/10 rounded px-2 py-1.5 text-xs text-white"
                          >
                            <option value="Bronze">Plano Básico / Bronze (R$ 89,90/m • Promo R$ 29,90)</option>
                            <option value="Prata">Plano Pro / Prata (R$ 149,90/m)</option>
                            <option value="Ouro">Plano Premium / Ouro (R$ 249,90/m)</option>
                          </select>
                        </div>
                        <div className="space-y-1">
                          <label className="text-[9px] uppercase font-bold text-slate-400 block">Status Comercial</label>
                          <select
                            value={licFormStatus}
                            onChange={(e) => setLicFormStatus(e.target.value as any)}
                            className="w-full bg-[#141d34] border border-white/10 rounded px-2 py-1.5 text-xs text-white"
                          >
                            <option value="active">Ativo (Active)</option>
                            <option value="trial">Avaliação (Trial)</option>
                            <option value="expired">Expirado (Expired)</option>
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <label className="text-[9px] uppercase font-bold text-slate-400 block">Filiais</label>
                          <input
                            type="number"
                            min="1"
                            value={licFormUnitsCount}
                            onChange={(e) => setLicFormUnitsCount(Number(e.target.value))}
                            className="w-full bg-[#141d34] border border-white/10 rounded px-2 py-1.5 text-xs text-white"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[9px] uppercase font-bold text-slate-400 block">Máx Usuários</label>
                          <input
                            type="number"
                            min="1"
                            value={licFormMaxUsers}
                            onChange={(e) => setLicFormMaxUsers(Number(e.target.value))}
                            className="w-full bg-[#141d34] border border-white/10 rounded px-2 py-1.5 text-xs text-white"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <label className="text-[9px] uppercase font-bold text-slate-400 block">Consumo IA (%)</label>
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={licFormAiUsage}
                            onChange={(e) => setLicFormAiUsage(Number(e.target.value))}
                            className="w-full bg-[#141d34] border border-white/10 rounded px-2 py-1 text-xs text-white"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[9px] uppercase font-bold text-slate-400 block">Disparos WhatsApp</label>
                          <input
                            type="number"
                            min="0"
                            value={licFormWaUsage}
                            onChange={(e) => setLicFormWaUsage(Number(e.target.value))}
                            className="w-full bg-[#141d34] border border-white/10 rounded px-2 py-1 text-xs text-white"
                          />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[9px] uppercase font-bold text-slate-400 block">Data de Vencimento</label>
                        <input
                          type="date"
                          value={licFormExpireDate}
                          onChange={(e) => setLicFormExpireDate(e.target.value)}
                          className="w-full bg-[#141d34] border border-white/10 rounded px-2 py-1 text-xs text-white font-mono"
                        />
                      </div>

                      <div className="flex gap-2 pt-2">
                        <button
                          type="submit"
                          className="flex-1 py-1.5 bg-cyan-500 hover:bg-cyan-400 text-black text-xs font-black rounded transition-all cursor-pointer"
                        >
                          Salvar Contrato
                        </button>
                        <button
                          type="button"
                          onClick={resetLicenseForm}
                          className="py-1.5 px-3 bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-bold rounded transition-all cursor-pointer"
                        >
                          Fechar
                        </button>
                      </div>
                    </form>
                  )}
                </div>

                <div className="space-y-4 pt-2">
                  {licenses.map(lic => (
                    <div key={lic.id} className="bg-[#090F1E] border border-white/5 p-4 rounded-xl space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <h4 className="text-xs font-bold text-white">{lic.name}</h4>
                          <span className={`px-1.5 py-0.2 rounded text-[8px] font-bold uppercase tracking-wider font-mono ${
                            lic.status === 'active' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                            lic.status === 'trial' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                            'bg-red-500/10 text-red-400 border border-red-500/20'
                          }`}>
                            {lic.status}
                          </span>
                        </div>
                        <span className="bg-slate-800 text-slate-300 font-mono text-[9px] px-1.5 py-0.2 rounded uppercase">
                          Plano: {lic.plan}
                        </span>
                      </div>

                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-[11px] text-slate-400">
                          <span>Consumo WhatsApp</span>
                          <span>{lic.waUsage} msg disparadas</span>
                        </div>
                        <div className="w-full bg-[#141C30] h-1.5 rounded-full overflow-hidden">
                          <div className="bg-indigo-500 h-full" style={{ width: `${Math.min(100, (lic.waUsage / 5000) * 100)}%` }} />
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-[11px] text-slate-400">
                          <span>Uso IA Assistente</span>
                          <span>{lic.aiUsage}%</span>
                        </div>
                        <div className="w-full bg-[#141C30] h-1.5 rounded-full overflow-hidden">
                          <div className="bg-cyan-500 h-full" style={{ width: `${lic.aiUsage}%` }} />
                        </div>
                      </div>

                      <div className="pt-2 border-t border-white/5 flex items-center justify-between text-[10px] text-slate-500 font-sans">
                        <span>Filiais: <strong>{lic.unitsCount}</strong> (Max Us: {lic.maxUsers})</span>
                        <span>Vencimento: <strong>{lic.expireDate}</strong></span>
                      </div>

                      <div className="flex items-center justify-end gap-2 pt-1.5 border-t border-white/5">
                        <button
                          onClick={() => handleEditLicenseClick(lic)}
                          className="px-2 py-1 bg-cyan-500/10 hover:bg-cyan-500/20 text-[#22D3EE] font-bold text-[10px] rounded transition-all cursor-pointer"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => handleDeleteLicenseClick(lic.id)}
                          className="px-2 py-1 bg-red-500/10 hover:bg-red-500/20 text-red-400 font-bold text-[10px] rounded transition-all cursor-pointer"
                        >
                          Excluir
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Split row: White label customizer & Receita Analytics */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              
              {/* White Label Enterprise Customizer */}
              <div className="bg-[#0E1528] rounded-2xl border border-white/5 p-6 space-y-5">
                <div className="space-y-1">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Globe className="w-4 h-4 text-cyan-400" />
                    Configurações White Label Enterprise
                  </h3>
                  <p className="text-xs text-slate-500 font-sans">Forneça personalização completa de subdomínio e branding visual com facilidade técnica para salões credenciados.</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase font-bold text-slate-400">Logomarca Própria URL</label>
                    <input
                      type="text"
                      className="w-full bg-[#141C30] border border-white/10 rounded-lg px-2.5 py-1.5 text-xs font-mono text-white"
                      value={wlConfig.logo}
                      onChange={(e) => setWlConfig({ ...wlConfig, logo: e.target.value })}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase font-bold text-slate-400">Domínio Próprio Customizado</label>
                    <input
                      type="text"
                      className="w-full bg-[#141C30] border border-white/10 rounded-lg px-2.5 py-1.5 text-xs font-mono text-white"
                      value={wlConfig.domain}
                      onChange={(e) => setWlConfig({ ...wlConfig, domain: e.target.value })}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase font-bold text-slate-400">Cores CSS Primárias</label>
                    <input
                      type="text"
                      className="w-full bg-[#141C30] border border-white/10 rounded-lg px-2.5 py-1.5 text-xs font-mono text-white"
                      value={wlConfig.colors}
                      onChange={(e) => setWlConfig({ ...wlConfig, colors: e.target.value })}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase font-bold text-slate-400">Subdomínio Plataforma Bella</label>
                    <input
                      type="text"
                      className="w-full bg-[#141C30] border border-white/10 rounded-lg px-2.5 py-1.5 text-xs font-mono text-white"
                      value={wlConfig.subdomain}
                      onChange={(e) => setWlConfig({ ...wlConfig, subdomain: e.target.value })}
                    />
                  </div>
                </div>

                <div className="pt-3 border-t border-white/5 flex items-center justify-between">
                  <span className="text-[11px] text-slate-400 flex items-center gap-1.5">
                    <Palette className="w-3.5 h-3.5 text-cyan-400" />
                    Layout visual atualizado em tempo real no servidor DNS.
                  </span>
                  <button
                    onClick={() => {
                      toast.success('White Label Salvo!', { description: 'Domínio apontado e emparelhado com sucesso na CDN Bella.' });
                    }}
                    className="px-4 py-1.5 bg-cyan-500 hover:bg-cyan-400 text-black text-xs font-bold rounded-lg transition-all cursor-pointer"
                  >
                    Salvar Branding
                  </button>
                </div>
              </div>

              {/* Receita por Addons / Modulo Graph Analytics */}
              <div className="bg-[#0E1528] rounded-2xl border border-white/5 p-6 space-y-4">
                <div className="space-y-1">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-indigo-400" />
                    Projeção de Faturamento Addons & Up-Sells (6 meses)
                  </h3>
                  <p className="text-xs text-slate-500">Métricas analíticas consolidadas de faturamento proveniente de addons premium extra e White Label.</p>
                </div>

                <div className="h-[200px] w-full pt-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={areaData}>
                      <defs>
                        <linearGradient id="colorMRR" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#06B6D4" stopOpacity={0.4}/>
                          <stop offset="95%" stopColor="#06B6D4" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#2D3748" opacity={0.3} />
                      <XAxis dataKey="name" stroke="#718096" fontSize={10} />
                      <YAxis stroke="#718096" fontSize={10} />
                      <Tooltip contentStyle={{ backgroundColor: '#0F172A', border: '1px solid #1E293B', borderRadius: '8px' }} />
                      <Area type="monotone" dataKey="MRR" stroke="#06B6D4" fillOpacity={1} fill="url(#colorMRR)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

// Helpers for Lucide SVG replacements
function FolderOpenIcon(props: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={props.className}
    >
      <path d="m6 14 1.45-2.9A2 2 0 0 1 9.24 10H20a2 2 0 0 1 1.94 2.5l-1.55 6a2 2 0 0 1-1.94 1.5H4a2 2 0 0 1-2-2V5c0-1.1.9-2 2-2h3.93a2 2 0 0 1 1.66.9l.82 1.2a2 2 0 0 0 1.66.9H18a2 2 0 0 1 2 2v2" />
    </svg>
  );
}
