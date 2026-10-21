import { useState, useMemo, useEffect } from 'react';
import CommercialOverview from '../components/admin/CommercialOverview';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Users, Activity, Crown, Sparkles, Bot, Trash2, Link as LinkIcon, 
  Search, CheckCircle2, RefreshCw, XCircle, ArrowLeft, CalendarDays, 
  AlertTriangle, Lock, Monitor, Shield, LogOut, ExternalLink, Zap,
  BarChart3, PieChart, MessageSquare, Send, Save, CreditCard, LayoutDashboard, Globe, Palette
} from 'lucide-react';
import { Logo } from '../components/ui/Logo';
import { useAuthStore } from '../store/auth';
import { isSuperAdminEmail } from '../lib/superAdmins';
import { toast } from 'sonner';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { db } from '../lib/firebase';
import { collection, query, getDocs, doc, setDoc, updateDoc } from 'firebase/firestore';
import { migrateCompanyLicenses } from '../services/migration';

const mockCompanyGrowth = [
  { name: 'Jan', empresas: 120 },
  { name: 'Fev', empresas: 150 },
  { name: 'Mar', empresas: 180 },
  { name: 'Abr', empresas: 220 },
  { name: 'Mai', empresas: 284 },
];

type Client = {
  id: string;
  name: string;
  sub?: string;
  email: string;
  plan: string;
  status: string;
  expire: string;
  active: boolean;
  dunningStep?: number;
  dunningStatus?: string;
  riskScore?: number;
  niche?: string;
  geminiKey?: string;
  evolutionUrl?: string;
  evolutionKey?: string;
  asaasKey?: string;
};

export default function AdminPanel() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('commercial');
  const [clients, setClients] = useState<Client[]>([]);
  const [licenses, setLicenses] = useState<Record<string, any>>({});
  const [flags, setFlags] = useState<Record<string, any>>({});
  const [editingLicenseCompany, setEditingLicenseCompany] = useState<Client | null>(null);
  const [licensingSearch, setLicensingSearch] = useState('');
  const [isClientsLoaded, setIsClientsLoaded] = useState(false);
  const [isMigrating, setIsMigrating] = useState(false);

  // Licensing Modal States
  const [licPlan, setLicPlan] = useState<'Bronze' | 'Prata' | 'Ouro'>('Bronze');
  const [licStatus, setLicStatus] = useState<'active' | 'trial' | 'expired'>('trial');
  const [licExpireDate, setLicExpireDate] = useState('2026-12-31');
  const [licMaxUsers, setLicMaxUsers] = useState(5);
  const [licUnitsCount, setLicUnitsCount] = useState(1);
  const [licAiUsage, setLicAiUsage] = useState(0);
  const [licWaUsage, setLicWaUsage] = useState(0);

  const [flagPdv, setFlagPdv] = useState(false);
  const [flagAgenda, setFlagAgenda] = useState(false);
  const [flagCrm, setFlagCrm] = useState(false);
  const [flagWhatsapp, setFlagWhatsapp] = useState(false);
  const [flagAiAssistant, setFlagAiAssistant] = useState(false);
  const [flagCashback, setFlagCashback] = useState(false);
  const [flagWhiteLabel, setFlagWhiteLabel] = useState(false);
  const [flagMarketplace, setFlagMarketplace] = useState(false);
  const [flagMobileApp, setFlagMobileApp] = useState(false);

  useEffect(() => {
    if (editingLicenseCompany) {
      const lic = licenses[editingLicenseCompany.id] || {
        plan: 'Bronze',
        status: 'trial',
        expireDate: '2026-12-31',
        maxUsers: 5,
        unitsCount: 1,
        aiUsage: 0,
        waUsage: 0
      };
      const flg = flags[editingLicenseCompany.id] || {};

      setLicPlan(lic.plan || 'Bronze');
      setLicStatus(lic.status || 'trial');
      setLicExpireDate(lic.expireDate || '2026-12-31');
      setLicMaxUsers(lic.maxUsers || 5);
      setLicUnitsCount(lic.unitsCount || 1);
      setLicAiUsage(lic.aiUsage || 0);
      setLicWaUsage(lic.waUsage || 0);

      setFlagPdv(!!flg.pdv);
      setFlagAgenda(!!flg.agenda);
      setFlagCrm(!!flg.crm);
      setFlagWhatsapp(!!flg.whatsapp);
      setFlagAiAssistant(!!flg.aiAssistant);
      setFlagCashback(!!flg.cashback);
      setFlagWhiteLabel(!!flg.whiteLabel);
      setFlagMarketplace(!!flg.marketplace);
      setFlagMobileApp(!!flg.mobileApp);
    }
  }, [editingLicenseCompany]);

  useEffect(() => {
    // Fetch all users/companies from Firestore
    const fetchCompanies = async () => {
      try {
        const usersSnapshot = await getDocs(collection(db, 'users'));
        const clientsData = usersSnapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            name: data.name || 'Empresa',
            email: data.email || '',
            plan: data.plan || 'Trial',
            status: data.status || 'Trial',
            expire: data.expire || '2026-12-31',
            active: data.status !== 'Cancelado' && data.status !== 'Bloqueado',
            niche: data.niche,
            geminiKey: data.geminiKey,
            evolutionUrl: data.evolutionUrl,
            evolutionKey: data.evolutionKey,
            asaasKey: data.asaasKey,
          } as Client;
        });
        setClients(clientsData);

        // Fetch companion schemas
        const licensesSnapshot = await getDocs(collection(db, 'company_licenses'));
        const activeLicenses: Record<string, any> = {};
        licensesSnapshot.forEach(docSnap => {
          activeLicenses[docSnap.id] = docSnap.data();
        });
        setLicenses(activeLicenses);

        const flagsSnapshot = await getDocs(collection(db, 'feature_flags'));
        const activeFlags: Record<string, any> = {};
        flagsSnapshot.forEach(docSnap => {
          activeFlags[docSnap.id] = docSnap.data();
        });
        setFlags(activeFlags);

      } catch (err) {
        console.error("No permission to read users, or error:", err);
      } finally {
        setIsClientsLoaded(true);
      }
    };
    
    // Attempt admin-level fetch
    if (user?.isPlatformAdmin) {
       fetchCompanies();
    } else if (!isSuperAdminEmail(user?.email)) {
       toast.error("Acesso restrito a administradores do SaaS.");
       navigate('/');
    }
  }, [user, navigate]);

  const handleInlineUpdateLicense = async (companyId: string, updatedFields: Record<string, any>) => {
    try {
      await setDoc(doc(db, 'company_licenses', companyId), updatedFields, { merge: true });
      
      setLicenses(prev => ({
        ...prev,
        [companyId]: {
          ...(prev[companyId] || {
             plan: 'Bronze',
             status: 'trial',
             expireDate: '2026-12-31',
             maxUsers: 5,
             unitsCount: 1,
             aiUsage: 0,
             waUsage: 0
          }),
          ...updatedFields
        }
      }));

      if (updatedFields.plan || updatedFields.status !== undefined || updatedFields.expireDate) {
         const userUpdates: Record<string, any> = {};
         if (updatedFields.plan) userUpdates.plan = updatedFields.plan;
         if (updatedFields.status) {
            userUpdates.status = updatedFields.status === 'active' ? 'Ativo' : updatedFields.status === 'expired' ? 'Cancelado' : 'Trial';
         }
         if (updatedFields.expireDate) userUpdates.expire = updatedFields.expireDate;
         
         await updateDoc(doc(db, 'users', companyId), userUpdates);

         setClients(prev => prev.map(c => c.id === companyId ? {
            ...c,
            ...(updatedFields.plan ? { plan: updatedFields.plan } : {}),
            ...(updatedFields.status ? { status: updatedFields.status === 'active' ? 'Ativo' : updatedFields.status === 'expired' ? 'Cancelado' : 'Trial' } : {}),
            ...(updatedFields.expireDate ? { expire: updatedFields.expireDate } : {})
         } : c));
      }
      toast.success("Licença atualizada!");
    } catch (err) {
      console.error("Failed to update license inline:", err);
      toast.error("Erro ao atualizar campo.");
    }
  };

  const handleInlineUpdateFlag = async (companyId: string, flagKey: string, flagValue: boolean) => {
    try {
      const flagsData = {
        [flagKey]: flagValue,
        companyId: companyId
      };
      await setDoc(doc(db, 'feature_flags', companyId), flagsData, { merge: true });
      
      setFlags(prev => ({
        ...prev,
        [companyId]: {
          ...(prev[companyId] || {}),
          ...flagsData
        }
      }));
      toast.success("Módulo atualizado!");
    } catch (err) {
      console.error("Failed to update flag inline:", err);
      toast.error("Erro ao configurar módulo.");
    }
  };

  const [isCompanyModalOpen, setIsCompanyModalOpen] = useState(false);
  const [editingCompany, setEditingCompany] = useState<Partial<Client> | null>(null);

  const [paymentLinks, setPaymentLinks] = useState({
    basic: "https://asaas.com/c/basico",
    pro: "https://asaas.com/c/pro",
    premium: "https://asaas.com/c/premium"
  });
  const [editingLink, setEditingLink] = useState<{ id: string, name: string, price: string, url: string } | null>(null);
  const [newLinkUrl, setNewLinkUrl] = useState("");

  const [activeSupportTicket, setActiveSupportTicket] = useState(1);
  const [tickets, setTickets] = useState([
    { id: 1, title: 'Problema no Webhook Asaas', client: 'Barber Prime', time: '10:42 AM', preview: 'Estou recebendo o erro 401 ao tentar...', tag: 'Urgente', status: 'Aberto', 
      messages: [
        { sender: 'client', text: 'Olá, desde a atualização de ontem meu webhook do Asaas está retornando 401 Unauthorized e os pagamentos não sincronizam no painel. O que eu faço?', time: '10:42 AM' }
      ],
      aiSuggestion: 'Identifiquei que a API key deste cliente foi rotacionada no painel de segurança. Sugiro enviar a instrução para renovar o token do Asaas em Configurações > Integrações.'
    },
    { id: 2, title: 'Dúvida sobre IA', client: 'Studio Elegance', time: 'Ontem', preview: 'Como configuro a mensagem automática?', tag: 'Dúvida', status: 'Resolvido',
      messages: [
        { sender: 'client', text: 'Como configuro a mensagem automática da IA?', time: 'Ontem' },
        { sender: 'admin', text: 'Vá em Configurações > Automações e habilite a IA WhatsApp.', time: 'Ontem' }
      ],
      aiSuggestion: ''
    }
  ]);
  const [replyText, setReplyText] = useState('');

  const currentStats = useMemo(() => {
    let mrr = 0;
    let active = 0;
    let trials = 0;
    let churn = 0; // This would normally be recent cancelations.

    clients.forEach(c => {
      if (c.status === 'Trial') {
        trials++;
      } else if (c.status === 'Ativo' || c.status === 'Premium' || c.status === 'Básico') {
        active++;
        // Very simple logic, can be customized later with real prices
        if (c.plan === 'Premium') mrr += 199.90;
        if (c.plan === 'Pro') mrr += 99.90;
        if (c.plan === 'Básico') mrr += 49.90;
      } else if (c.status === 'Cancelado') {
        churn++;
      }
    });

    return {
      mrr: mrr.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
      active,
      trials,
      churn
    };
  }, [clients]);

  const activeTicketObj = tickets.find(t => t.id === activeSupportTicket);

  const handleSendReply = () => {
     if (!replyText.trim()) {
        toast.error("Digite uma resposta primeiro.");
        return;
     }
     setTickets(tickets.map(t => {
        if (t.id === activeSupportTicket) {
           return {
              ...t,
              status: 'Respondido',
              messages: [...t.messages, { sender: 'admin', text: replyText, time: 'Agora' }]
           };
        }
        return t;
     }));
     setReplyText('');
     toast.success("Resposta enviada para o cliente com sucesso!");
  };

  const [featureFlags, setFeatureFlags] = useState({
    ai: true,
    whatsapp: true,
    cashbook: true,
    whitelabel: true
  });

  const [whiteLabelConfig, setWhiteLabelConfig] = useState({
    domain: "app.suamarca.com.br",
    color: "#4F46E5"
  });

  if (!user?.isPlatformAdmin) {
    return (
      <div className="min-h-screen bg-[#030815] text-slate-300 flex flex-col items-center justify-center font-sans">
        <Lock className="w-16 h-16 text-red-500 mb-4" />
        <h1 className="text-3xl font-bold text-white mb-2">Acesso Restrito</h1>
        <p className="text-slate-500 mb-6 text-center max-w-md">{isSuperAdminEmail(user?.email)
          ? 'Conta reconhecida. A permissão admin ainda precisa ser ativada no Firebase. Entre novamente após a ativação.'
          : 'Área exclusiva para administradores da plataforma.'}</p>
        <button onClick={() => navigate('/')} className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition-colors">Voltar</button>
      </div>
    );
  }

  const handleImpersonate = (clientId: number | string, clientName: string) => {
    toast.success(`Iniciando sessão como: ${clientName}...`, {
      description: "Você está sendo redirecionado (Modo Impersonate)."
    });
    setTimeout(() => {
       navigate('/');
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-[#05080F] text-slate-300 flex font-sans">
      {/* Sidebar */}
      <aside className="w-64 h-screen bg-[#070B14] border-r border-white/10 p-4 sticky top-0 flex-col shrink-0 hidden md:flex">
        <div className="h-14 flex items-center gap-2 px-2 mb-6">
           <Logo size="md" hideText />
           <h1 className="text-xl font-bold text-white tracking-tight">
             Bella<span className="text-cyan-400">Admin</span>
           </h1>
        </div>
        <nav className="flex-1 space-y-1">
           {[
             { id: 'commercial', label: 'Visitantes e conversões', icon: BarChart3 },
             { id: 'dashboard', label: 'Dashboard legado', icon: Activity },
             { id: 'licenciamento', label: 'Central de Licenciamento', icon: Shield },
             { id: 'licensing_dedicated', label: 'Licenciamento Avançado ↗', icon: ExternalLink },
             { id: 'empresas', label: 'Empresas', icon: Users },
             { id: 'assinaturas', label: 'Assinaturas', icon: Crown },
             { id: 'analytics', label: 'Analytics', icon: Sparkles },
             { id: 'campanhas', label: 'Campanhas', icon: Zap },
             { id: 'ia_admin', label: 'IA Administrativa', icon: Bot },
             { id: 'suporte', label: 'Suporte', icon: Shield },
             { id: 'logs', label: 'Logs', icon: Monitor },
             { id: 'onboarding', label: 'Onboarding', icon: CheckCircle2 },
             { id: 'segurança', label: 'Segurança', icon: Lock },
             { id: 'configurações', label: 'Configurações', icon: AlertTriangle }
           ].map(tab => {
             const Icon = tab.icon;
             return (
               <button 
                 key={tab.id}
                 onClick={() => {
                   if (tab.id === 'licensing_dedicated') {
                     navigate('/admin/licensing');
                   } else {
                     setActiveTab(tab.id);
                   }
                 }}
                 className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-all ${
                   activeTab === tab.id 
                     ? 'bg-cyan-500/10 text-white' 
                     : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
                 }`}
               >
                 <Icon className="w-5 h-5" />
                 {tab.label}
               </button>
             );
           })}
        </nav>
        <div className="pt-4 border-t border-white/10 mt-auto">
           <button onClick={() => navigate('/')} className="w-full flex items-center gap-3 text-sm text-slate-400 hover:text-white transition-colors px-3 py-2 rounded-xl hover:bg-red-500/10 hover:text-red-400">
             <LogOut className="w-5 h-5" /> Sair do Painel
           </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 h-screen overflow-auto">
        <div className="p-8 max-w-[1200px] mx-auto">
        <AnimatePresence mode="wait">
           {activeTab === 'commercial' && <motion.div key="commercial"><CommercialOverview /></motion.div>}
           {activeTab === 'dashboard' && (
              <motion.div key="dash" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
                 <h2 className="text-2xl font-display font-semibold text-white tracking-tight">System Overview</h2>
                 
                 <div className="grid grid-cols-4 gap-6">
                    <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-[0_0_40px_rgba(0,255,255,0.08)] relative overflow-hidden group hover:border-cyan-500/30 transition-colors">
                       <span className="text-gray-400 text-sm">MRR</span>
                       <h2 className="text-3xl font-bold text-white tracking-tight mt-2">{currentStats.mrr}</h2>
                       <span className="text-cyan-400 text-sm mt-1 inline-block">Real Time Data</span>
                    </div>
                    <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-[0_0_40px_rgba(0,255,255,0.08)] relative overflow-hidden group hover:border-cyan-500/30 transition-colors">
                       <span className="text-gray-400 text-sm">Clientes Ativos</span>
                       <h2 className="text-3xl font-bold text-white tracking-tight mt-2">{currentStats.active}</h2>
                       <span className="text-cyan-400 text-sm mt-1 inline-block">Planos Pagos</span>
                    </div>
                    <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-[0_0_40px_rgba(0,255,255,0.08)] relative overflow-hidden group hover:border-cyan-500/30 transition-colors">
                       <span className="text-gray-400 text-sm">Trials</span>
                       <h2 className="text-3xl font-bold text-white tracking-tight mt-2">{currentStats.trials}</h2>
                       <span className="text-cyan-400 text-sm mt-1 inline-block">Testando Plataforma</span>
                    </div>
                    <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-[0_0_40px_rgba(239,68,68,0.1)] relative overflow-hidden group hover:border-red-500/30 transition-colors">
                       <span className="text-gray-400 text-sm">Churn</span>
                       <h2 className="text-3xl font-bold text-white tracking-tight mt-2">{currentStats.churn}</h2>
                       <span className="text-red-400 text-sm mt-1 inline-block">Cancelamentos Atuais</span>
                    </div>
                 </div>

                 {/* GRAFICO AQUI */}
                 <div className="bg-[#0A0A0A] p-6 rounded-xl border border-white/10 mt-6 shadow-[0_0_20px_rgba(0,0,0,0.5)]">
                     <h3 className="text-lg font-bold text-white mb-6">Crescimento de Assinantes</h3>
                     <div className="h-[250px] w-full">
                         <ResponsiveContainer width="100%" height="100%">
                             <AreaChart data={mockCompanyGrowth}>
                                 <CartesianGrid strokeDasharray="3 3" stroke="#1A2C47" />
                                 <XAxis dataKey="name" stroke="#64748B" />
                                 <YAxis stroke="#64748B" />
                                 <Tooltip contentStyle={{ backgroundColor: '#0F172A', borderColor: '#1E293B', color: '#fff' }} />
                                 <Area type="monotone" dataKey="empresas" stroke="#06b6d4" fill="#06b6d4" fillOpacity={0.2} />
                             </AreaChart>
                         </ResponsiveContainer>
                     </div>
                 </div>

                 {/* Recent Activity Mini-logs */}
                 <div className="mt-8">
                   <h3 className="text-sm font-semibold text-white mb-4 uppercase tracking-widest">Logs em Tempo Real</h3>
                   <div className="bg-[#0A0A0A] border border-white/10 rounded-xl overflow-hidden text-xs font-mono text-slate-400 divide-y divide-white/5">
                      <div className="p-3 flex items-center gap-4 hover:bg-white/5"><span className="text-emerald-400">SUCCESS</span><span>bella-studio</span><span>Assinatura Pro confirmada via webhook Asaas</span></div>
                      <div className="p-3 flex items-center gap-4 hover:bg-white/5"><span className="text-yellow-400">WARNING</span><span>clinica-uniao</span><span>Tentativa de falha no cartão de crédito (Dunning iniciado)</span></div>
                      <div className="p-3 flex items-center gap-4 hover:bg-white/5"><span className="text-blue-400">INFO</span><span>system</span><span>Nova empresa "Barbearia do João" iniciou trial de 14 dias</span></div>
                   </div>
                 </div>
              </motion.div>
           )}

           {activeTab === 'licenciamento' && (
              <motion.div key="licenciamento" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                 <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                       <h2 className="text-2xl font-display font-semibold text-white tracking-tight flex items-center gap-2">
                          <Shield className="w-6 h-6 text-cyan-400" /> Central de Licenciamento SaaS
                       </h2>
                       <p className="text-sm text-slate-400 text-xs mt-0.5 font-sans">Controle de Planos (Bronze, Prata, Ouro), Limites de Consumo e Módulos Ativos de todas as empresas integradas.</p>
                    </div>
                    <div className="flex items-center gap-3">
                       <div className="relative">
                          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                          <input 
                             type="text" 
                             value={licensingSearch} 
                             onChange={(e) => setLicensingSearch(e.target.value)} 
                             placeholder="Buscar empresa..." 
                             className="bg-[#0C1425] border border-white/10 rounded-xl py-2 pl-9 pr-4 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 w-64 transition-all"
                           />
                        </div>
                        <button
                           disabled={isMigrating}
                           onClick={async () => {
                              if (!window.confirm("Deseja realmente iniciar a migração em massa no Firestore? Isso irá popular a coleção 'company_licenses' para todas as empresas existentes.")) {
                                 return;
                              }
                              setIsMigrating(true);
                              const toastId = toast.loading("Executando migração no Firestore...");
                              try {
                                 const res = await migrateCompanyLicenses();
                                 if (res.success) {
                                    toast.success("Migração Concluída com Sucesso!", {
                                       description: `Processados: ${res.totalProcessed} | Migrados: ${res.migratedCount} | Erros: ${res.errors.length}`,
                                       duration: 6000
                                    });
                                    
                                    // Live reload the tables
                                    const licensesSnapshot = await getDocs(collection(db, 'company_licenses'));
                                    const activeLicenses: Record<string, any> = {};
                                    licensesSnapshot.forEach(docSnap => {
                                      activeLicenses[docSnap.id] = docSnap.data();
                                    });
                                    setLicenses(activeLicenses);
                                    
                                    const flagsSnapshot = await getDocs(collection(db, 'feature_flags'));
                                    const activeFlags: Record<string, any> = {};
                                    flagsSnapshot.forEach(docSnap => {
                                      activeFlags[docSnap.id] = docSnap.data();
                                    });
                                    setFlags(activeFlags);
                                 } else {
                                    toast.error("Erro durante a migração", {
                                       description: res.errors[0]?.error || "Erro desconhecido",
                                       duration: 6000
                                    });
                                 }
                              } catch (err: any) {
                                 toast.error("Erro na migração", {
                                    description: err.message || String(err),
                                 });
                              } finally {
                                 setIsMigrating(false);
                                 toast.dismiss(toastId);
                              }
                           }}
                           className="flex items-center gap-1.5 py-2 px-3.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 disabled:bg-slate-800 disabled:text-slate-600 text-white font-sans text-xs font-bold transition-all cursor-pointer shadow-lg shadow-cyan-500/10"
                        >
                           <Zap className="w-3.5 h-3.5 fill-current" />
                           {isMigrating ? "Migrando..." : "Migrar Licenças"}
                        </button>
                        <div style={{ display: 'none' }}>
                           <input

                          />
                       </div>
                       <button 
                          onClick={async () => {
                             const loadingId = toast.loading("Sincronizando banco de dados...");
                             try {
                                const licensesSnapshot = await getDocs(collection(db, 'company_licenses'));
                                const activeLicenses: Record<string, any> = {};
                                licensesSnapshot.forEach(docSnap => {
                                  activeLicenses[docSnap.id] = docSnap.data();
                                });
                                setLicenses(activeLicenses);

                                const flagsSnapshot = await getDocs(collection(db, 'feature_flags'));
                                const activeFlags: Record<string, any> = {};
                                flagsSnapshot.forEach(docSnap => {
                                  activeFlags[docSnap.id] = docSnap.data();
                                });
                                setFlags(activeFlags);
                                toast.success("Módulos e licenças atualizados!");
                             } catch (err) {
                                toast.error("Falha ao ler dados.");
                             } finally {
                                toast.dismiss(loadingId);
                             }
                          }}
                          className="p-2 ml-1 rounded-xl bg-[#0C1425] border border-white/10 text-slate-300 hover:text-white hover:bg-[#15233D] transition-all cursor-pointer font-sans"
                       >
                          <RefreshCw className="w-4 h-4" />
                       </button>
                    </div>
                 </div>

                 {/* Summary Dashboard Panels */}
                 <div className="grid grid-cols-1 md:grid-cols-4 gap-6 font-sans">
                    <div className="bg-[#090F1E]/50 border border-white/5 rounded-2xl p-5">
                       <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider font-mono">Total de Contratos</span>
                       <h3 className="text-2xl font-black text-white mt-1">{clients.length}</h3>
                    </div>
                    <div className="bg-[#090F1E]/50 border border-cyan-500/20 rounded-2xl p-5 relative overflow-hidden">
                       <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-500/5 rounded-full blur-xl"></div>
                       <span className="text-[10px] text-cyan-400 font-bold uppercase tracking-wider font-mono">Controle Ouro</span>
                       <h3 className="text-2xl font-black text-white mt-1">
                          {clients.filter(c => (licenses[c.id]?.plan || '').toLowerCase() === 'ouro').length}
                       </h3>
                    </div>
                    <div className="bg-[#090F1E]/50 border border-purple-500/20 rounded-2xl p-5 relative overflow-hidden">
                       <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/5 rounded-full blur-xl"></div>
                       <span className="text-[10px] text-purple-400 font-bold uppercase tracking-wider font-mono">Controle Prata</span>
                       <h3 className="text-2xl font-black text-white mt-1">
                          {clients.filter(c => (licenses[c.id]?.plan || '').toLowerCase() === 'prata').length}
                       </h3>
                    </div>
                    <div className="bg-[#090F1E]/50 border border-amber-500/20 rounded-2xl p-5 relative overflow-hidden">
                       <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full blur-xl"></div>
                       <span className="text-[10px] text-amber-400 font-bold uppercase tracking-wider font-mono">Controle Bronze / Trial</span>
                       <h3 className="text-2xl font-black text-white mt-1">
                          {clients.filter(c => {
                             const plan = (licenses[c.id]?.plan || '').toLowerCase();
                             return plan === 'bronze' || !plan;
                          }).length}
                       </h3>
                    </div>
                 </div>

                 {/* Licensing Enterprise List Table */}
                 <div className="bg-[#070B14] border border-white/10 rounded-2xl overflow-hidden shadow-2xl font-sans">
                    <table className="w-full text-left text-sm">
                       <thead className="bg-[#0D1527] border-b border-white/10 text-slate-400 text-[10px] uppercase font-bold tracking-widest font-mono">
                          <tr>
                             <th className="px-6 py-4">Empresa</th>
                             <th className="px-6 py-4">Plano de Licença</th>
                             <th className="px-6 py-4">Status / Expira</th>
                             <th className="px-6 py-4">Limites Consumo</th>
                             <th className="px-6 py-4">Módulos Ativos</th>
                             <th className="px-6 py-4 text-right">Licenciamento</th>
                          </tr>
                       </thead>
                       <tbody className="divide-y divide-white/5">
                          {clients
                             .filter(c => c.name.toLowerCase().includes(licensingSearch.toLowerCase()) || c.email.toLowerCase().includes(licensingSearch.toLowerCase()))
                             .map(c => {
                                const companyLic = licenses[c.id] || {
                                   plan: 'Bronze',
                                   status: 'trial',
                                   expireDate: '2026-12-31',
                                   maxUsers: 5,
                                   unitsCount: 1,
                                   aiUsage: 0,
                                   waUsage: 0
                                };
                                const compFlags = flags[c.id] || {};

                                // Count how many flags are true
                                const activeFlagsCount = Object.values(compFlags).filter(v => v === true).length;





                                 return (
                                   <tr key={c.id} className="hover:bg-white/5 transition-colors">
                                      <td className="px-6 py-4 text-slate-300">
                                         <div className="font-bold text-white text-base">{c.name}</div>
                                         <div className="text-xs text-slate-500 font-mono mt-0.5">{c.email}</div>
                                      </td>
                                      <td className="px-6 py-4">
                                         <div className="flex flex-col gap-1">
                                            <select
                                               value={companyLic.plan || 'Bronze'}
                                               onChange={(e) => handleInlineUpdateLicense(c.id, { plan: e.target.value })}
                                               className="bg-[#0D1527] border border-white/10 rounded-xl py-1 px-2.5 text-xs text-white focus:outline-none focus:border-cyan-500 font-bold cursor-pointer transition-colors"
                                            >
                                               <option value="Bronze">Bronze</option>
                                               <option value="Prata">Prata</option>
                                               <option value="Ouro">Ouro</option>
                                            </select>
                                            <span className="text-[8px] text-slate-500 text-center uppercase font-mono tracking-wider">Inline</span>
                                         </div>
                                      </td>
                                      <td className="px-6 py-4 text-xs font-sans">
                                         <div className="space-y-1.5 min-w-[124px]">
                                            <select
                                               value={companyLic.status || 'trial'}
                                               onChange={(e) => handleInlineUpdateLicense(c.id, { status: e.target.value })}
                                               className="w-full bg-[#0D1527] border border-white/10 rounded-lg py-1 px-1.5 text-[10px] text-white focus:outline-none focus:border-cyan-500 font-bold cursor-pointer transition-colors"
                                            >
                                               <option value="active">✓ Ativado</option>
                                               <option value="trial">⚡ Teste/Trial</option>
                                               <option value="expired">✗ Expirado</option>
                                            </select>
                                            <div className="relative">
                                               <input
                                                  type="date"
                                                  value={companyLic.expireDate || '2026-12-31'}
                                                  onChange={(e) => handleInlineUpdateLicense(c.id, { expireDate: e.target.value })}
                                                  className="w-full bg-[#0D1527] border border-white/10 rounded-lg py-1 px-1.5 text-[10px] text-slate-300 focus:outline-none focus:border-cyan-500 font-mono transition-colors"
                                               />
                                            </div>
                                         </div>
                                      </td>
                                      <td className="px-6 py-4 text-xs space-y-1">
                                         <div className="space-y-1 w-36 bg-[#0D1527]/30 border border-white/5 rounded-xl p-2 font-mono text-[9px]">
                                            <div className="flex items-center justify-between gap-1">
                                               <span className="text-slate-500 text-[8px] uppercase tracking-wider">Users:</span>
                                               <input
                                                  type="number"
                                                  value={companyLic.maxUsers ?? 5}
                                                  onChange={(e) => handleInlineUpdateLicense(c.id, { maxUsers: parseInt(e.target.value) || 0 })}
                                                  className="bg-[#0D1527] border border-white/10 rounded px-1 px-1.5 text-[10px] text-slate-300 w-12 text-center focus:outline-none focus:border-cyan-500 transition-colors"
                                               />
                                            </div>
                                            <div className="flex items-center justify-between gap-1">
                                               <span className="text-slate-500 text-[8px] uppercase tracking-wider">Filiais:</span>
                                               <input
                                                  type="number"
                                                  value={companyLic.unitsCount ?? 1}
                                                  onChange={(e) => handleInlineUpdateLicense(c.id, { unitsCount: parseInt(e.target.value) || 0 })}
                                                  className="bg-[#0D1527] border border-white/10 rounded px-1 px-1.5 text-[10px] text-slate-300 w-12 text-center focus:outline-none focus:border-cyan-500 transition-colors"
                                               />
                                            </div>
                                            <div className="flex items-center justify-between gap-1">
                                               <span className="text-slate-500 text-[8px] uppercase tracking-wider">Uso IA:</span>
                                               <input
                                                  type="number"
                                                  value={companyLic.aiUsage ?? 0}
                                                  onChange={(e) => handleInlineUpdateLicense(c.id, { aiUsage: parseInt(e.target.value) || 0 })}
                                                  className="bg-[#0D1527] border border-white/10 rounded px-1 px-1.5 text-[10px] text-cyan-400 font-bold w-12 text-center focus:outline-none focus:border-cyan-500 transition-colors"
                                               />
                                            </div>
                                            <div className="flex items-center justify-between gap-1">
                                               <span className="text-slate-500 text-[8px] uppercase tracking-wider">Uso WA:</span>
                                               <input
                                                  type="number"
                                                  value={companyLic.waUsage ?? 0}
                                                  onChange={(e) => handleInlineUpdateLicense(c.id, { waUsage: parseInt(e.target.value) || 0 })}
                                                  className="bg-[#0D1527] border border-white/10 rounded px-1 px-1.5 text-[10px] text-emerald-400 font-bold w-12 text-center focus:outline-none focus:border-cyan-500 transition-colors"
                                               />
                                            </div>
                                         </div>
                                      </td>
                                      <td className="px-6 py-4 text-xs text-slate-300">
                                         <div className="flex flex-wrap gap-1 max-w-[240px]">
                                            {[
                                               { key: 'whatsapp', label: 'WA-API', colorActive: 'bg-pink-500/15 border-pink-500/40 text-pink-400', colorInactive: 'bg-white/5 border-white/5 text-slate-600' },
                                               { key: 'aiAssistant', label: 'IA ASSIST', colorActive: 'bg-purple-500/15 border-purple-500/40 text-purple-400', colorInactive: 'bg-white/5 border-white/5 text-slate-600' },
                                               { key: 'crm', label: 'CRM', colorActive: 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400', colorInactive: 'bg-white/5 border-white/5 text-slate-600' },
                                               { key: 'pdv', label: 'PDV', colorActive: 'bg-cyan-500/15 border-cyan-500/40 text-cyan-400', colorInactive: 'bg-white/5 border-white/5 text-slate-600' },
                                               { key: 'agenda', label: 'AGENDA', colorActive: 'bg-yellow-500/15 border-yellow-500/40 text-yellow-400', colorInactive: 'bg-white/5 border-white/5 text-slate-600' },
                                               { key: 'whiteLabel', label: 'WHITE', colorActive: 'bg-indigo-500/15 border-indigo-500/40 text-indigo-400', colorInactive: 'bg-white/5 border-white/5 text-slate-600' },
                                               { key: 'cashback', label: 'CASHBACK', colorActive: 'bg-rose-500/15 border-rose-500/40 text-rose-400', colorInactive: 'bg-white/5 border-white/5 text-slate-600' },
                                               { key: 'marketplace', label: 'MARKET', colorActive: 'bg-blue-500/15 border-blue-500/40 text-blue-400', colorInactive: 'bg-white/5 border-white/5 text-slate-600' }
                                            ].map((m) => {
                                               const isActive = !!compFlags[m.key];
                                               return (
                                                  <button
                                                     key={m.key}
                                                     onClick={() => handleInlineUpdateFlag(c.id, m.key, !isActive)}
                                                     title={`Clique para ${isActive ? 'desabilitar' : 'habilitar'} ${m.label}`}
                                                     className={`px-1.5 py-0.5 rounded text-[8px] border font-mono font-black tracking-tight cursor-pointer transition-all hover:scale-105 active:scale-95 ${
                                                        isActive ? m.colorActive : m.colorInactive
                                                     }`}
                                                  >
                                                     {m.label}
                                                  </button>
                                               );
                                            })}
                                         </div>
                                      </td>
                                      <td className="px-6 py-4 text-right">
                                         <button 
                                            onClick={() => setEditingLicenseCompany(c)}
                                            className="px-3 py-1 bg-gradient-to-r from-cyan-500/10 to-indigo-500/10 border border-cyan-500/30 hover:from-cyan-500/20 hover:to-indigo-500/20 rounded-xl text-cyan-400 font-extrabold text-xs font-mono uppercase tracking-wider flex items-center gap-1 ml-auto cursor-pointer transition-all"
                                         >
                                            <Lock className="w-3 h-3" /> Config
                                         </button>
                                      </td>
                                   </tr>

                                );
                             })}
                       </tbody>
                    </table>
                 </div>
              </motion.div>
           )}

           {activeTab === 'empresas' && (
              <motion.div key="empresas" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                 <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-display font-semibold text-white tracking-tight">Gerenciamento de Empresas</h2>
                    <button 
                      onClick={() => { setEditingCompany(null); setIsCompanyModalOpen(true); }}
                      className="px-4 py-2 bg-white text-black text-sm font-semibold rounded-lg hover:bg-slate-200 transition-colors"
                    >
                       + Nova Empresa
                    </button>
                 </div>

                 <div className="bg-[#0A0A0A] border border-white/10 rounded-xl overflow-hidden">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-[#111] border-b border-white/10 text-slate-400 text-xs uppercase tracking-widest">
                         <tr>
                            <th className="px-6 py-4 font-semibold">Empresa / Email</th>
                            <th className="px-6 py-4 font-semibold">Plano</th>
                            <th className="px-6 py-4 font-semibold">Status</th>
                            <th className="px-6 py-4 font-semibold">MRR</th>
                            <th className="px-6 py-4 font-semibold text-right">Ação Rápida</th>
                         </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                         {clients.map(c => (
                            <tr key={c.id} className="hover:bg-white/5 transition-colors">
                               <td className="px-6 py-4">
                                  <div className="font-semibold text-white">{c.name}</div>
                                  <div className="text-xs text-slate-500 mt-0.5">{c.email}</div>
                               </td>
                               <td className="px-6 py-4">
                                  <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-widest border ${
                                     c.plan === 'Trial' ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' : 'bg-white/5 text-slate-300 border-white/10'
                                  }`}>
                                    {c.plan}
                                  </span>
                               </td>
                               <td className="px-6 py-4">
                                  <div className={`flex items-center gap-1.5 text-xs font-semibold ${
                                    c.status === 'Trial' ? 'text-indigo-400' : c.status === 'Ativo' ? 'text-emerald-400' : 'text-red-400'
                                  }`}>
                                    <div className={`w-1.5 h-1.5 rounded-full ${c.status === 'Trial' ? 'bg-indigo-400' : c.status === 'Ativo' ? 'bg-emerald-400' : 'bg-red-400'}`} />
                                    {c.status}
                                  </div>
                               </td>
                               <td className="px-6 py-4 font-mono text-slate-300">
                                  {c.plan === 'Trial' ? '-' : c.plan === 'Básico' ? 'R$ 89' : 'R$ 149'}
                               </td>
                               <td className="px-6 py-4 text-right">
                                 <div className="flex items-center justify-end gap-2">
                                    <button 
                                      onClick={() => { setEditingCompany(c); setIsCompanyModalOpen(true); }}
                                      className="px-3 py-1.5 bg-white/5 border border-white/10 hover:border-white/30 hover:bg-white/10 rounded-lg text-slate-300 font-semibold text-xs flex items-center gap-2 transition-all"
                                    >
                                       Editar
                                    </button>
                                    <button onClick={() => handleImpersonate(c.id, c.name)} className="px-3 py-1.5 bg-blue-500/10 border border-blue-500/20 hover:bg-blue-500/20 rounded-lg text-blue-400 font-semibold text-xs flex items-center justify-end gap-2 transition-all">
                                       <ExternalLink className="w-3 h-3" /> Impersonate
                                    </button>
                                 </div>
                               </td>
                            </tr>
                         ))}
                      </tbody>
                    </table>
                 </div>
              </motion.div>
           )}

           {activeTab === 'assinaturas' && (
              <motion.div key="financeiro" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                 <h2 className="text-2xl font-display font-semibold text-white tracking-tight">Assinaturas & Faturamento Master</h2>
                 <p className="text-sm text-slate-400 mb-6">Controle absoluto das assinaturas, faturamento e cupons.</p>

                 <div className="grid grid-cols-2 gap-6">
                    <div className="bg-[#0A0A0A] border border-white/10 p-6 rounded-xl">
                       <h3 className="text-lg font-semibold text-white mb-4">Planos de Pagamento Activos</h3>
                       <div className="space-y-4">
                          <div className="flex justify-between items-center pb-4 border-b border-white/5">
                             <div>
                                <p className="text-sm font-semibold text-white">Plano Básico</p>
                                <p className="text-xs text-slate-400">R$ 89,90/mês <span className="text-emerald-400 font-semibold">• Promo: R$ 29,90/mês (3 meses) • 15 dias teste</span></p>
                                <a href={paymentLinks.basic} target="_blank" rel="noreferrer" className="text-[10px] text-blue-400 hover:underline mt-1 inline-block truncate max-w-[200px]">{paymentLinks.basic}</a>
                             </div>
                             <button onClick={() => { setEditingLink({ id: 'basic', name: 'Plano Básico', price: '89,90', url: paymentLinks.basic }); setNewLinkUrl(paymentLinks.basic); }} className="text-xs px-3 py-1.5 rounded bg-white/5 text-slate-300 hover:text-white border border-white/10">Editar Link</button>
                          </div>
                          <div className="flex justify-between items-center pb-4 border-b border-white/5">
                             <div>
                                <p className="text-sm font-semibold text-white">Plano Pro</p>
                                <p className="text-xs text-slate-500">R$ 149,90/mês</p>
                                <a href={paymentLinks.pro} target="_blank" rel="noreferrer" className="text-[10px] text-blue-400 hover:underline mt-1 inline-block truncate max-w-[200px]">{paymentLinks.pro}</a>
                             </div>
                             <button onClick={() => { setEditingLink({ id: 'pro', name: 'Plano Pro', price: '149,90', url: paymentLinks.pro }); setNewLinkUrl(paymentLinks.pro); }} className="text-xs px-3 py-1.5 rounded bg-white/5 text-slate-300 hover:text-white border border-white/10">Editar Link</button>
                          </div>
                          <div className="flex justify-between items-center">
                             <div>
                                <p className="text-sm font-semibold text-white">Plano Premium</p>
                                <p className="text-xs text-slate-500">R$ 249,90/mês</p>
                                <a href={paymentLinks.premium} target="_blank" rel="noreferrer" className="text-[10px] text-blue-400 hover:underline mt-1 inline-block truncate max-w-[200px]">{paymentLinks.premium}</a>
                             </div>
                             <button onClick={() => { setEditingLink({ id: 'premium', name: 'Plano Premium', price: '249,90', url: paymentLinks.premium }); setNewLinkUrl(paymentLinks.premium); }} className="text-xs px-3 py-1.5 rounded bg-white/5 text-slate-300 hover:text-white border border-white/10">Editar Link</button>
                          </div>
                       </div>
                    </div>

                    <div className="bg-[#0A0A0A] border border-white/10 p-6 rounded-xl">
                       <h3 className="text-lg font-semibold text-white mb-4">Motor de Recuperação (Dunning)</h3>
                       <p className="text-sm text-slate-400 mb-6">Configurações globais de bloqueio de clientes inadimplentes.</p>
                       <div className="space-y-3">
                          <label className="flex items-center gap-3">
                             <input type="checkbox" className="w-4 h-4 bg-transparent border-white/20 rounded focus:ring-0" defaultChecked />
                             <span className="text-sm text-slate-300">Aviso inicial (Dia 1) via Email e Plataforma</span>
                          </label>
                          <label className="flex items-center gap-3">
                             <input type="checkbox" className="w-4 h-4 bg-transparent border-white/20 rounded focus:ring-0" defaultChecked />
                             <span className="text-sm text-slate-300">Bloqueio parcial (Apenas PDV/Consultas) (Dia 5)</span>
                          </label>
                          <label className="flex items-center gap-3">
                             <input type="checkbox" className="w-4 h-4 bg-transparent border-white/20 rounded focus:ring-0" defaultChecked />
                             <span className="text-sm text-red-400 font-semibold">Bloqueio total (Hard Wall) (Dia 7)</span>
                          </label>
                       </div>
                    </div>
                 </div>
              </motion.div>
           )}

           {activeTab === 'analytics' && (
              <motion.div key="analytics" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                 <h2 className="text-2xl font-display font-semibold text-white tracking-tight">Analytics Master</h2>
                 <p className="text-sm text-slate-400 mb-6">Métricas do Produto, Negócio, LTV, CAC e Retenção.</p>
                 
                 <div className="grid grid-cols-4 gap-6 mb-6">
                    <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-[0_0_20px_rgba(255,255,255,0.02)]">
                       <span className="text-gray-400 text-sm">Custo Aquisição (CAC)</span>
                       <h2 className="text-2xl font-bold text-white tracking-tight mt-2">R$ 142,50</h2>
                       <span className="text-emerald-400 text-sm mt-1 inline-block">-12% vs last month</span>
                    </div>
                    <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-[0_0_20px_rgba(255,255,255,0.02)]">
                       <span className="text-gray-400 text-sm">LTV Médio</span>
                       <h2 className="text-2xl font-bold text-white tracking-tight mt-2">R$ 2.450</h2>
                       <span className="text-emerald-400 text-sm mt-1 inline-block">+5% vs last month</span>
                    </div>
                    <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-[0_0_20px_rgba(255,255,255,0.02)]">
                       <span className="text-gray-400 text-sm">Retenção (M3)</span>
                       <h2 className="text-2xl font-bold text-white tracking-tight mt-2">86%</h2>
                       <span className="text-emerald-400 text-sm mt-1 inline-block">+2pp vs last month</span>
                    </div>
                    <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-[0_0_20px_rgba(255,255,255,0.02)]">
                       <span className="text-gray-400 text-sm">Tempo Médio Uso</span>
                       <h2 className="text-2xl font-bold text-white tracking-tight mt-2">4h 12m</h2>
                       <span className="text-emerald-400 text-sm mt-1 inline-block">+14m hoje</span>
                    </div>
                 </div>

                 <div className="grid grid-cols-2 gap-6">
                    <div className="bg-[#0A0A0A] border border-white/10 p-6 rounded-xl">
                       <h3 className="text-lg font-semibold text-white mb-6">Funil Trial → Pago (Últimos 30 dias)</h3>
                       <div className="space-y-4">
                          <div>
                             <div className="flex justify-between text-sm mb-1"><span className="text-slate-300">Início de Trial</span><span className="text-white font-bold">450</span></div>
                             <div className="w-full bg-white/5 rounded-full h-3"><div className="bg-indigo-500 h-3 rounded-full" style={{ width: '100%' }}></div></div>
                          </div>
                          <div>
                             <div className="flex justify-between text-sm mb-1"><span className="text-slate-300">Configurou PDV</span><span className="text-white font-bold">320 (71%)</span></div>
                             <div className="w-full bg-white/5 rounded-full h-3"><div className="bg-blue-500 h-3 rounded-full" style={{ width: '71%' }}></div></div>
                          </div>
                          <div>
                             <div className="flex justify-between text-sm mb-1"><span className="text-slate-300">Fez primeira venda</span><span className="text-white font-bold">250 (55%)</span></div>
                             <div className="w-full bg-white/5 rounded-full h-3"><div className="bg-cyan-500 h-3 rounded-full" style={{ width: '55%' }}></div></div>
                          </div>
                          <div>
                             <div className="flex justify-between text-sm mb-1"><span className="text-slate-300">Converteu Pago</span><span className="text-white font-bold">185 (41%)</span></div>
                             <div className="w-full bg-white/5 rounded-full h-3"><div className="bg-emerald-500 h-3 rounded-full" style={{ width: '41%' }}></div></div>
                          </div>
                       </div>
                    </div>
                    <div className="bg-[#0A0A0A] border border-white/10 p-6 rounded-xl">
                       <h3 className="text-lg font-semibold text-white mb-6">Features Mais Usadas</h3>
                       <div className="space-y-4">
                          <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/5">
                             <div className="flex items-center gap-3"><Monitor className="w-5 h-5 text-indigo-400" /><span className="text-slate-300">PDV / Frente de Caixa</span></div>
                             <span className="text-white font-bold text-sm">89%</span>
                          </div>
                          <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/5">
                             <div className="flex items-center gap-3"><Users className="w-5 h-5 text-blue-400" /><span className="text-slate-300">Gestão de Clientes</span></div>
                             <span className="text-white font-bold text-sm">62%</span>
                          </div>
                          <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/5">
                             <div className="flex items-center gap-3"><CalendarDays className="w-5 h-5 text-purple-400" /><span className="text-slate-300">Agendamentos</span></div>
                             <span className="text-white font-bold text-sm">45%</span>
                          </div>
                          <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/5">
                             <div className="flex items-center gap-3"><Bot className="w-5 h-5 text-cyan-400" /><span className="text-slate-300">IA Generativa (Descrições)</span></div>
                             <span className="text-white font-bold text-sm">28%</span>
                          </div>
                       </div>
                    </div>
                 </div>
              </motion.div>
           )}

           {activeTab === 'ia_admin' && (
              <motion.div key="ia_admin" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                 <div className="flex items-center justify-between">
                    <div>
                       <h2 className="text-2xl font-display font-semibold text-white tracking-tight">IA Administrativa e Alertas</h2>
                       <p className="text-sm text-slate-400 mb-6">OpenAI & Gemini: Monitoramento ativo de anomalias, risco de churn e oportunidades de upgrade na base.</p>
                    </div>
                    <button onClick={() => {
                        const loadingToast = toast.loading("A IA está analisando a base de dados...");
                        setTimeout(() => {
                           toast.dismiss(loadingToast);
                           toast.success("Novos insights gerados com sucesso!");
                        }, 2500);
                      }} className="px-4 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-lg hover:bg-indigo-500 transition-colors flex items-center gap-2">
                       <Bot className="w-4 h-4" /> Gerar Novos Insights Base
                    </button>
                 </div>

                 <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-4">
                       <h3 className="text-lg font-semibold text-white border-b border-white/10 pb-3">Alertas Críticos (Risco)</h3>
                       
                       <div className="bg-[#0A0A0A] border border-red-500/30 p-5 rounded-xl relative overflow-hidden">
                          <div className="absolute top-0 right-0 p-2"><AlertTriangle className="w-5 h-5 text-red-500" /></div>
                          <div className="flex items-center gap-3 mb-2">
                             <div className="w-8 h-8 rounded-full bg-red-500/10 flex items-center justify-center text-red-500 font-bold">SE</div>
                             <span className="font-semibold text-white">Studio Elegance</span>
                          </div>
                          <p className="text-sm text-slate-300">Empresa com risco alto de cancelamento. Queda de 45% nos logins nas últimas duas semanas e nenhuma venda registrada nos últimos 4 dias.</p>
                          <div className="mt-4 flex gap-2">
                             <button className="text-xs bg-red-500/10 hover:bg-red-500/20 text-red-400 px-3 py-1.5 rounded transition-colors font-semibold">Tentar Contato</button>
                             <button className="text-xs bg-white/5 hover:bg-white/10 text-slate-300 px-3 py-1.5 rounded transition-colors">Ignorar</button>
                          </div>
                       </div>
                       
                       <div className="bg-[#0A0A0A] border border-orange-500/30 p-5 rounded-xl relative overflow-hidden">
                          <div className="absolute top-0 right-0 p-2"><AlertTriangle className="w-5 h-5 text-orange-500" /></div>
                          <div className="flex items-center gap-3 mb-2">
                             <div className="w-8 h-8 rounded-full bg-orange-500/10 flex items-center justify-center text-orange-500 font-bold">BC</div>
                             <span className="font-semibold text-white">Barbearia Central</span>
                          </div>
                          <p className="text-sm text-slate-300">Problemas de integração: Falhas repetidas no Webhook de pagamentos nas últimas 24 horas.</p>
                          <div className="mt-4 flex gap-2">
                             <button className="text-xs bg-white/5 hover:bg-white/10 text-slate-300 px-3 py-1.5 rounded transition-colors">Ver Logs de Pagamento</button>
                          </div>
                       </div>
                    </div>
                    
                    <div className="space-y-4">
                       <h3 className="text-lg font-semibold text-white border-b border-white/10 pb-3">Oportunidades & Crescimento</h3>
                       
                       <div className="bg-[#0A0A0A] border border-emerald-500/30 p-5 rounded-xl relative overflow-hidden">
                          <div className="absolute top-0 right-0 p-2"><Sparkles className="w-5 h-5 text-emerald-500" /></div>
                          <div className="flex items-center gap-3 mb-2">
                             <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500 font-bold">BP</div>
                             <span className="font-semibold text-white">Barber Prime</span>
                          </div>
                          <p className="text-sm text-slate-300">Crescimento acelerado detectado: Aumento de 120% no faturamento via PIX esta semana. Ideal para oferecer o Plano Premium com Webhooks priorizados.</p>
                          <div className="mt-4 flex gap-2">
                             <button className="text-xs bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 px-3 py-1.5 rounded transition-colors font-semibold">Oferecer Upgrade</button>
                          </div>
                       </div>
                       
                       <div className="bg-[#0A0A0A] border border-blue-500/30 p-5 rounded-xl relative overflow-hidden">
                          <div className="absolute top-0 right-0 p-2"><Sparkles className="w-5 h-5 text-blue-500" /></div>
                          <div className="flex items-center gap-3 mb-2">
                             <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500 font-bold">CB</div>
                             <span className="font-semibold text-white">Clínica Beauty</span>
                          </div>
                          <p className="text-sm text-slate-300">Uso intenso de agendamentos. A IA sugere oferecer módulo de automação de WhatsApp complementar.</p>
                          <div className="mt-4 flex gap-2">
                             <button className="text-xs bg-white/5 hover:bg-white/10 text-slate-300 px-3 py-1.5 rounded transition-colors">Ver Perfil</button>
                          </div>
                       </div>
                    </div>
                 </div>
              </motion.div>
           )}

           {activeTab === 'suporte' && (
              <motion.div key="suporte" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                 <div className="flex items-center justify-between">
                    <div>
                       <h2 className="text-2xl font-display font-semibold text-white tracking-tight">Suporte Técnico Interno</h2>
                       <p className="text-sm text-slate-400">Tickets, conversas e logs de suporte com IA sugerindo respostas.</p>
                    </div>
                    <button className="px-4 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-lg hover:bg-indigo-500 transition-colors flex items-center gap-2">
                       <MessageSquare className="w-4 h-4" /> Novo Ticket
                    </button>
                 </div>
                 
                 <div className="grid grid-cols-12 gap-6 h-[500px]">
                    <div className="col-span-4 bg-[#0A0A0A] border border-white/10 rounded-xl overflow-hidden flex flex-col">
                       <div className="p-4 border-b border-white/10 bg-[#111]">
                          <input type="text" placeholder="Buscar chamados..." className="w-full bg-white/5 border border-white/10 rounded p-2 text-sm text-white focus:outline-none focus:border-indigo-500" />
                       </div>
                       
                          {tickets.map((t: any) => (
                             <div 
                                key={t.id} 
                                onClick={() => setActiveSupportTicket(t.id)}
                                className={`p-4 border-b border-white/5 cursor-pointer transition-colors ${activeSupportTicket === t.id ? 'bg-white/5 border-l-2 border-l-indigo-500' : 'hover:bg-white/5'}`}
                             >
                                <div className="flex justify-between items-start mb-1">
                                   <span className="font-semibold text-white text-sm truncate pr-2">{t.title}</span>
                                   <span className="text-[10px] text-slate-400 whitespace-nowrap">{t.time}</span>
                                </div>
                                <p className="text-xs text-slate-400 truncate">{t.preview}</p>
                                <div className="mt-2 flex gap-2">
                                   <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${t.tag === 'Urgente' ? 'bg-red-500/10 text-red-400' : 'bg-blue-500/10 text-blue-400'}`}>{t.tag}</span>
                                   <span className="text-[10px] px-2 py-0.5 rounded bg-white/10 text-slate-300">{t.client}</span>
                                </div>
                             </div>
                          ))}
                       
                       <div className="p-4 border-b border-white/10 bg-[#111] flex justify-between items-center">
                          <div>
                             <h3 className="font-semibold text-white">Problema no Webhook Asaas</h3>
                             <p className="text-xs text-slate-400">Ticket #1042 • Solicitante: Barber Prime</p>
                          </div>
                          <span className="text-xs px-3 py-1 rounded-full bg-yellow-500/10 text-yellow-500 font-bold uppercase">Aberto</span>
                       </div>
                       <div className="flex-1 p-6 overflow-y-auto space-y-4">
                          <div className="flex flex-col items-start max-w-[80%]">
                             <div className="bg-white/5 text-slate-300 p-3 rounded-xl rounded-tl-sm text-sm border border-white/5">
                                Olá, desde a atualização de ontem meu webhook do Asaas está retornando 401 Unauthorized e os pagamentos não sincronizam no painel. O que eu faço?
                             </div>
                             <span className="text-[10px] text-slate-500 mt-1 ml-1">10:42 AM</span>
                          </div>
                          <div className="my-4 pt-4 border-t border-white/5 relative">
                             <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#0A0A0A] px-3 font-semibold text-[10px] text-indigo-400 flex items-center gap-1 uppercase tracking-widest">
                                <Bot className="w-3 h-3" /> IA Sugere
                             </div>
                             <div className="bg-indigo-500/10 border border-indigo-500/20 p-3 rounded-lg text-sm text-indigo-200 mt-2">
                                "Identifiquei que a API key deste cliente foi rotacionada no painel de segurança. Sugiro enviar a instrução para renovar o token do Asaas em Configurações &gt; Integrações."
                                <button onClick={() => {
                                   setReplyText("Identifiquei que a API key foi rotacionada no painel de segurança. Por favor, vá em Configurações > Integrações para renovar o token.");
                                }} className="block mt-2 text-xs bg-indigo-500 hover:bg-indigo-400 text-white px-3 py-1.5 rounded transition-colors font-semibold">Usar Resposta Sugerida</button>
                             </div>
                          </div>
                       </div>
                       <div className="p-4 border-t border-white/10 bg-[#111]">
                          <div className="flex gap-2">
                             <textarea id="ticket-reply" value={replyText} onChange={e => setReplyText(e.target.value)} onKeyDown={(e) => { if(e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendReply(); } }} placeholder="Digite sua resposta..." className="flex-1 bg-white/5 border border-white/10 rounded-lg p-3 text-sm text-white focus:outline-none focus:border-indigo-500 resize-none h-12" />
                             <button onClick={handleSendReply} className="h-12 px-4 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white flex items-center justify-center transition-colors">
                                <Send className="w-5 h-5" />
                             </button>
                          </div>
                       </div>
                    </div>
                 </div>
              </motion.div>
           )}

           {activeTab === 'logs' && (
              <motion.div key="logs" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                 <div className="flex items-center justify-between">
                    <div>
                       <h2 className="text-2xl font-display font-semibold text-white tracking-tight">Logs de Auditoria Full</h2>
                       <p className="text-sm text-slate-400">Histórico rastreável de todas as ações importantes do sistema.</p>
                    </div>
                    <button onClick={() => {
                       toast.success("Exportação iniciada. O arquivo CSV será baixado em instantes.");
                    }} className="px-4 py-2 bg-white/5 border border-white/10 text-white text-sm font-semibold rounded-lg hover:bg-white/10 transition-colors flex items-center gap-2">
                       <BarChart3 className="w-4 h-4" /> Exportar CSV
                    </button>
                 </div>

                 <div className="flex gap-2">
                    <button className="px-3 py-1.5 bg-white/10 border border-white/20 rounded-md text-sm text-white font-medium">Todos</button>
                    <button className="px-3 py-1.5 bg-[#0C1627] border border-white/5 rounded-md text-sm text-slate-400 hover:bg-white/5 transition-colors">Logins</button>
                    <button className="px-3 py-1.5 bg-[#0C1627] border border-white/5 rounded-md text-sm text-slate-400 hover:bg-white/5 transition-colors">Vendas</button>
                    <button className="px-3 py-1.5 bg-[#0C1627] border border-white/5 rounded-md text-sm text-slate-400 hover:bg-white/5 transition-colors">Webhooks</button>
                    <button className="px-3 py-1.5 bg-[#0C1627] border border-white/5 rounded-md text-sm text-slate-400 hover:bg-white/5 transition-colors text-red-400">Errors</button>
                 </div>

                 <div className="bg-[#0A0A0A] border border-white/10 rounded-xl overflow-hidden">
                    <table className="w-full text-sm text-left">
                       <thead className="text-xs text-slate-500 uppercase bg-[#111] border-b border-white/10">
                          <tr>
                             <th className="px-4 py-3 font-semibold">Data/Hora</th>
                             <th className="px-4 py-3 font-semibold">Ação / Evento</th>
                             <th className="px-4 py-3 font-semibold">Empresa / Usuário</th>
                             <th className="px-4 py-3 font-semibold">IP / Dispositivo</th>
                             <th className="px-4 py-3 font-semibold">Status</th>
                          </tr>
                       </thead>
                       <tbody className="divide-y divide-white/5 text-slate-300">
                          <tr className="hover:bg-white/5 transition-colors">
                             <td className="px-4 py-3 whitespace-nowrap text-xs">Hoje, 14:32:05</td>
                             <td className="px-4 py-3">
                                <div className="font-semibold text-white">SALE_CREATED</div>
                                <div className="text-xs text-slate-500">Valor: R$ 150,00 • Método: PIX</div>
                             </td>
                             <td className="px-4 py-3">
                                <div className="text-white">Beauty Clinic</div>
                                <div className="text-xs text-slate-500">ana.silva@beauty.com</div>
                             </td>
                             <td className="px-4 py-3 whitespace-nowrap text-xs text-slate-500">189.45.XX.XX<br/>Mac OS Chrome</td>
                             <td className="px-4 py-3"><span className="px-2 py-1 rounded bg-emerald-500/10 text-emerald-400 text-[10px] font-bold uppercase tracking-widest">Success</span></td>
                          </tr>
                          <tr className="hover:bg-white/5 transition-colors">
                             <td className="px-4 py-3 whitespace-nowrap text-xs">Hoje, 14:15:10</td>
                             <td className="px-4 py-3">
                                <div className="font-semibold text-white">WEBHOOK_RECEIVED</div>
                                <div className="text-xs text-slate-500">Asaas • billing.payment.confirmed</div>
                             </td>
                             <td className="px-4 py-3">
                                <div className="text-white">Studio Elegance</div>
                                <div className="text-xs text-slate-500">Sistema</div>
                             </td>
                             <td className="px-4 py-3 whitespace-nowrap text-xs text-slate-500">10.0.X.X<br/>API Server</td>
                             <td className="px-4 py-3"><span className="px-2 py-1 rounded bg-emerald-500/10 text-emerald-400 text-[10px] font-bold uppercase tracking-widest">Success</span></td>
                          </tr>
                          <tr className="hover:bg-white/5 transition-colors bg-red-500/5">
                             <td className="px-4 py-3 whitespace-nowrap text-xs">Hoje, 13:42:21</td>
                             <td className="px-4 py-3">
                                <div className="font-semibold text-red-400">LOGIN_FAILED</div>
                                <div className="text-xs text-red-500/70">Senha incorreta (Tentativa 3)</div>
                             </td>
                             <td className="px-4 py-3">
                                <div className="text-white">Barber Prime</div>
                                <div className="text-xs text-slate-500">admin@barber.com</div>
                             </td>
                             <td className="px-4 py-3 whitespace-nowrap text-xs text-slate-500">45.2.XX.XX<br/>Windows Firefox</td>
                             <td className="px-4 py-3"><span className="px-2 py-1 rounded bg-red-500/10 text-red-400 text-[10px] font-bold uppercase tracking-widest">Error</span></td>
                          </tr>
                          <tr className="hover:bg-white/5 transition-colors">
                             <td className="px-4 py-3 whitespace-nowrap text-xs">Hoje, 11:05:00</td>
                             <td className="px-4 py-3">
                                <div className="font-semibold text-white">FEATURE_ENABLED</div>
                                <div className="text-xs text-slate-500">Módulo: White-label</div>
                             </td>
                             <td className="px-4 py-3">
                                <div className="text-white">Global</div>
                                <div className="text-xs text-indigo-400">Admin_Marcel</div>
                             </td>
                             <td className="px-4 py-3 whitespace-nowrap text-xs text-slate-500">192.168.X.X<br/>Mac OS Safari</td>
                             <td className="px-4 py-3"><span className="px-2 py-1 rounded bg-yellow-500/10 text-yellow-500 text-[10px] font-bold uppercase tracking-widest">Warning</span></td>
                          </tr>
                       </tbody>
                    </table>
                 </div>
              </motion.div>
           )}

           {activeTab === 'campanhas' && (
              <motion.div key="campanhas" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                 <div className="flex items-center justify-between">
                    <div>
                       <h2 className="text-2xl font-display font-semibold text-white tracking-tight">Central de Campanhas Master</h2>
                       <p className="text-sm text-slate-400">Dispare E-mails ou WhatsApp para segmentos específicos da sua base de clientes da plataforma.</p>
                    </div>
                    <div className="flex gap-2">
                       <button onClick={() => toast.success("Rascunho salvo com sucesso!")} className="px-4 py-2 bg-[#1a1a1a] text-white text-sm font-semibold rounded-lg hover:bg-[#222] border border-white/10 transition-colors flex items-center gap-2">
                          <Save className="w-4 h-4" /> Salvar Rascunho
                       </button>
                       <button onClick={() => {
                          const t = toast.loading("Enviando campanha...");
                          setTimeout(() => { toast.dismiss(t); toast.success("Campanha enviada!"); }, 2000);
                       }} className="px-4 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-lg hover:bg-indigo-500 transition-colors flex items-center gap-2">
                          <Zap className="w-4 h-4" /> Enviar Campanha
                       </button>
                    </div>
                 </div>

                 <div className="grid grid-cols-3 gap-6">
                    <div className="col-span-2 bg-[#0A0A0A] border border-white/10 p-6 rounded-xl space-y-4">
                       <div>
                          <label className="text-sm font-semibold text-slate-300 block mb-1">Título da Campanha</label>
                          <input type="text" placeholder="Ex: Promoção Dia das Mães" className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-white focus:outline-none focus:border-indigo-500" />
                       </div>
                       
                       <div>
                          <label className="text-sm font-semibold text-slate-300 block mb-1">Público Alvo (Segmento)</label>
                          <select className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-white focus:outline-none focus:border-indigo-500 appearance-none">
                             <option>Todos os Clientes Ativos</option>
                             <option>Clientes Plano Free</option>
                             <option>Clientes Premium</option>
                             <option>Clientes em Risco de Churn (IA)</option>
                          </select>
                       </div>

                       <div>
                          <div className="flex justify-between items-end mb-1">
                             <label className="text-sm font-semibold text-slate-300">Mensagem</label>
                             <button className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-semibold"><Bot className="w-3 h-3" /> Gerar com IA</button>
                          </div>
                          <textarea placeholder="Digite sua mensagem. Use {nome} para personalizar." rows={5} className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-white focus:outline-none focus:border-indigo-500 resize-none" />
                       </div>
                       
                       <div>
                           <label className="text-sm font-semibold text-slate-300 block mb-2">Canal de Disparo</label>
                           <div className="flex gap-4">
                              <label className="flex items-center gap-2 cursor-pointer bg-white/5 border border-white/10 rounded-lg p-3 flex-1">
                                 <input type="radio" name="channel" className="w-4 h-4 text-emerald-500 bg-transparent border-white/20 focus:ring-0 focus:ring-offset-0" defaultChecked />
                                 <span className="text-sm text-white font-medium">WhatsApp</span>
                              </label>
                              <label className="flex items-center gap-2 cursor-pointer bg-white/5 border border-white/10 rounded-lg p-3 flex-1">
                                 <input type="radio" name="channel" className="w-4 h-4 text-indigo-500 bg-transparent border-white/20 focus:ring-0 focus:ring-offset-0" />
                                 <span className="text-sm text-white font-medium">E-mail</span>
                              </label>
                           </div>
                       </div>
                    </div>

                    <div className="col-span-1 space-y-4">
                       <h3 className="text-lg font-semibold text-white">Últimas Campanhas</h3>
                       <div className="bg-[#111] border border-white/10 p-4 rounded-xl cursor-pointer hover:border-indigo-500/50 transition-colors">
                          <h4 className="text-white font-semibold mb-1">Promoção Black Friday</h4>
                          <p className="text-xs text-slate-500 mb-3">Público: Todas as contas Free/Trial</p>
                          <div className="flex items-center justify-between">
                             <span className="text-[10px] uppercase tracking-widest font-bold px-2 py-1 bg-emerald-500/10 text-emerald-400 rounded">Enviada</span>
                             <span className="text-xs text-slate-400">Há 2 meses</span>
                          </div>
                       </div>
                       <div className="bg-[#111] border border-white/10 p-4 rounded-xl cursor-pointer hover:border-indigo-500/50 transition-colors">
                          <h4 className="text-white font-semibold mb-1">Aviso Atualização Motor IA</h4>
                          <p className="text-xs text-slate-500 mb-3">Público: Todas (Master)</p>
                          <div className="flex items-center justify-between">
                             <span className="text-[10px] uppercase tracking-widest font-bold px-2 py-1 bg-emerald-500/10 text-emerald-400 rounded">Enviada</span>
                             <span className="text-xs text-slate-400">Há 1 semana</span>
                          </div>
                       </div>
                       <div className="bg-dashed border-2 border-white/10 border-dashed p-4 rounded-xl flex items-center justify-center h-24 hover:bg-white/5 transition-colors cursor-pointer">
                          <span className="text-sm text-slate-400 font-medium">Ver Histórico Completo</span>
                       </div>
                    </div>
                 </div>
              </motion.div>
           )}

           {activeTab === 'onboarding' && (
              <motion.div key="onboarding" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                 <div className="flex items-center justify-between">
                    <div>
                       <h2 className="text-2xl font-display font-semibold text-white tracking-tight">Onboarding Manager</h2>
                       <p className="text-sm text-slate-400">Acompanhe empresas no processo de setup: quem terminou e quem abandonou.</p>
                    </div>
                 </div>

                 <div className="bg-[#0A0A0A] border border-white/10 p-6 rounded-xl">
                    <h3 className="text-lg font-semibold text-white mb-6">Etapas de Setup Ativas</h3>
                    <div className="space-y-6">
                       <div>
                          <div className="flex justify-between items-center mb-2">
                             <div className="flex items-center gap-2">
                                <div className="w-6 h-6 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center text-xs font-bold text-emerald-400"><CheckCircle2 className="w-4 h-4" /></div>
                                <span className="text-sm font-semibold text-white">Criou uma conta</span>
                             </div>
                             <span className="text-sm text-slate-400 font-medium">450 usu. (100%)</span>
                          </div>
                          <div className="w-full bg-white/5 rounded-full h-2"><div className="bg-indigo-500 h-2 rounded-full" style={{ width: '100%' }}></div></div>
                       </div>
                       
                       <div>
                          <div className="flex justify-between items-center mb-2">
                             <div className="flex items-center gap-2">
                                <div className="w-6 h-6 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center text-xs font-bold">2</div>
                                <span className="text-sm font-semibold text-white">Configurou o perfil e logo</span>
                             </div>
                             <span className="text-sm text-slate-400 font-medium">380 usu. (84%)</span>
                          </div>
                          <div className="w-full bg-white/5 rounded-full h-2"><div className="bg-indigo-500 h-2 rounded-full" style={{ width: '84%' }}></div></div>
                       </div>

                       <div>
                          <div className="flex justify-between items-center mb-2">
                             <div className="flex items-center gap-2">
                                <div className="w-6 h-6 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center text-xs font-bold">3</div>
                                <span className="text-sm font-semibold text-white">Cadastrou primeiro serviço/produto</span>
                             </div>
                             <span className="text-sm text-slate-400 font-medium">320 usu. (71%)</span>
                          </div>
                          <div className="w-full bg-white/5 rounded-full h-2"><div className="bg-indigo-500 h-2 rounded-full" style={{ width: '71%' }}></div></div>
                       </div>

                       <div>
                          <div className="flex justify-between items-center mb-2">
                             <div className="flex items-center gap-2">
                                <div className="w-6 h-6 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center text-xs font-bold">4</div>
                                <span className="text-sm font-semibold text-white">Realizou a primeira venda/agendamento</span>
                             </div>
                             <span className="text-sm text-slate-400 font-medium">250 usu. (55%)</span>
                          </div>
                          <div className="w-full bg-white/5 rounded-full h-2"><div className="bg-indigo-500 h-2 rounded-full" style={{ width: '55%' }}></div></div>
                       </div>
                    </div>
                 </div>

                 <div className="bg-[#0A0A0A] border border-white/10 p-6 rounded-xl">
                    <h3 className="text-lg font-semibold text-white mb-4">Abandonos Recentes (Parados na Etapa 2)</h3>
                    <div className="space-y-3">
                       <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/5">
                          <div>
                             <p className="font-semibold text-white text-sm">Studio Elegance</p>
                             <p className="text-xs text-slate-400">Criou conta há 2 dias. Não cadastrou produtos.</p>
                          </div>
                          <button onClick={() => toast.success("Email com tutorial de fluxo inicial enviado para Studio Elegance!")} className="px-3 py-1.5 bg-indigo-600/10 text-indigo-400 hover:bg-indigo-600/20 text-xs font-bold rounded transition-colors">Enviar Email de Ajuda</button>
                       </div>
                       <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/5">
                          <div>
                             <p className="font-semibold text-white text-sm">Barbearia Root</p>
                             <p className="text-xs text-slate-400">Criou conta ontem. Parou no logo.</p>
                          </div>
                          <button onClick={() => toast.success("Email com tutorial de fluxo inicial enviado para Barbearia Root!")} className="px-3 py-1.5 bg-indigo-600/10 text-indigo-400 hover:bg-indigo-600/20 text-xs font-bold rounded transition-colors">Enviar Email de Ajuda</button>
                       </div>
                    </div>
                 </div>
              </motion.div>
           )}

           {activeTab === 'segurança' && (
              <motion.div key="segurança" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                 <h2 className="text-2xl font-display font-semibold text-white tracking-tight">Segurança Enterprise & Acessos</h2>
                 <p className="text-sm text-slate-400 mb-6">Controle de MFA, rate limits, logins suspeitos e IP Tracking.</p>

                 <div className="bg-[#0A0A0A] border border-white/10 p-6 rounded-xl max-w-2xl">
                    <h3 className="text-lg font-semibold text-white mb-6">Políticas de Segurança Globais</h3>
                    
                    <div className="space-y-4">
                       <div className="flex items-center justify-between p-3 bg-[#111] rounded border border-white/5">
                          <div>
                             <p className="text-sm font-semibold text-white">MFA Obrigatório para Admins</p>
                             <p className="text-xs text-slate-500">Força autenticação de 2 fatores (TOTP)</p>
                          </div>
                          <div className="w-10 h-5 bg-indigo-500 rounded-full relative cursor-pointer shadow-[0_0_10px_rgba(99,102,241,0.3)]">
                             <div className="w-4 h-4 bg-white rounded-full absolute right-0.5 top-0.5" />
                          </div>
                       </div>
                       <div className="flex items-center justify-between p-3 bg-[#111] rounded border border-white/5">
                          <div>
                             <p className="text-sm font-semibold text-white">Rate Limiting (Enterprise API)</p>
                             <p className="text-xs text-slate-500">100 req/s por tenant</p>
                          </div>
                          <div className="w-10 h-5 bg-indigo-500 rounded-full relative cursor-pointer shadow-[0_0_10px_rgba(99,102,241,0.3)]">
                             <div className="w-4 h-4 bg-white rounded-full absolute right-0.5 top-0.5" />
                          </div>
                       </div>
                    </div>
                 </div>
              </motion.div>
           )}

           {activeTab === 'configurações' && (
              <motion.div key="configurações" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 pb-20">
                 <div className="flex items-center justify-between">
                    <div>
                       <h2 className="text-2xl font-display font-semibold text-white tracking-tight">System Configuration & White-Label</h2>
                       <p className="text-sm text-slate-400">Gerencie recursos globais, planos VIP e personalização da plataforma.</p>
                    </div>
                    <button onClick={() => toast.success("Configurações e personalização White-Label atualizadas em todos os tenants!")} className="px-4 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-lg hover:bg-indigo-500 transition-colors flex items-center gap-2">
                       <Save className="w-4 h-4" /> Salvar Configurações
                    </button>
                 </div>

                 <div className="grid grid-cols-2 gap-6">
                    <div className="bg-[#0A0A0A] border border-white/10 p-6 rounded-xl">
                       <h3 className="text-lg font-semibold text-white mb-6">Feature Flags (Global)</h3>
                       
                       <div className="space-y-4">
                          <div className="flex items-center justify-between p-3 bg-[#111] rounded border border-white/5">
                             <div>
                                <p className="text-sm font-semibold text-white">IA e Módulos Criativos (OpenAI/Gemini)</p>
                                <p className="text-xs text-slate-500">Libera a geração de descrições e assistente.</p>
                             </div>
                             <div className="w-10 h-5 bg-indigo-500 rounded-full relative cursor-pointer shadow-[0_0_10px_rgba(99,102,241,0.3)]">
                                <div className="w-4 h-4 bg-white rounded-full absolute right-0.5 top-0.5" />
                             </div>
                          </div>
  
                          <div className="flex items-center justify-between p-3 bg-[#111] rounded border border-white/5">
                             <div>
                                <p className="text-sm font-semibold text-white">Integração WhatsApp Nativa</p>
                                <p className="text-xs text-slate-500">Agendamentos e confirmações via WABA API.</p>
                             </div>
                             <div className="w-10 h-5 bg-indigo-500 rounded-full relative cursor-pointer shadow-[0_0_10px_rgba(99,102,241,0.3)]">
                                <div className="w-4 h-4 bg-white rounded-full absolute right-0.5 top-0.5" />
                             </div>
                          </div>

                          <div className="flex items-center justify-between p-3 bg-[#111] rounded border border-white/5">
                             <div>
                                <p className="text-sm font-semibold text-white">Sistema de Cashbook/Fiado</p>
                                <p className="text-xs text-slate-500">Ativa o módulo de controle de fiados.</p>
                             </div>
                             <div className="w-10 h-5 bg-indigo-500 rounded-full relative cursor-pointer shadow-[0_0_10px_rgba(99,102,241,0.3)]">
                                <div className="w-4 h-4 bg-white rounded-full absolute right-0.5 top-0.5" />
                             </div>
                          </div>
  
                          <div className="flex items-center justify-between p-3 bg-[#111] rounded border border-white/5 border-l-2 border-l-emerald-500">
                             <div>
                                <p className="text-sm font-semibold text-white">White-Label Ativo</p>
                                <p className="text-xs text-slate-500">Permite clientes Premium alterarem a marca.</p>
                             </div>
                             <div className="w-10 h-5 bg-emerald-500 rounded-full relative cursor-pointer shadow-[0_0_10px_rgba(16,185,129,0.3)]">
                                <div className="w-4 h-4 bg-white rounded-full absolute right-0.5 top-0.5" />
                             </div>
                          </div>
                       </div>
                    </div>

                    <div className="bg-[#0A0A0A] border border-white/10 p-6 rounded-xl relative overflow-hidden">
                       <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none"><Crown className="w-24 h-24 text-emerald-500" /></div>
                       <h3 className="text-lg font-semibold text-white mb-1 flex items-center gap-2"><Palette className="w-5 h-5 text-emerald-400" /> Editor White-Label Master</h3>
                       <p className="text-xs text-slate-400 mb-6">Configuração padrão injetada para Tenants White-Label</p>

                       <div className="space-y-4 relative z-10">
                          <div>
                             <label className="text-sm font-semibold text-slate-300 block mb-1">Domínio Base App</label>
                             <div className="flex">
                                <span className="bg-white/5 border border-r-0 border-white/10 rounded-l-lg p-2.5 text-slate-500 text-sm">https://</span>
                                <input type="text" value={whiteLabelConfig.domain} onChange={e => setWhiteLabelConfig({ ...whiteLabelConfig, domain: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-r-lg p-2.5 text-sm text-white focus:outline-none focus:border-indigo-500" />
                             </div>
                          </div>
                          <div>
                             <label className="text-sm font-semibold text-slate-300 block mb-1">Cor Primária (Hex)</label>
                             <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg border border-white/20" style={{ backgroundColor: whiteLabelConfig.color }}></div>
                                <input type="text" value={whiteLabelConfig.color} onChange={e => setWhiteLabelConfig({ ...whiteLabelConfig, color: e.target.value })} className="flex-1 bg-white/5 border border-white/10 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-indigo-500 font-mono tracking-wider uppercase" />
                             </div>
                          </div>
                          <div>
                             <label className="text-sm font-semibold text-slate-300 block mb-1">Upload da Logo Default (Dark Mode)</label>
                             <div className="border border-dashed border-white/20 rounded-lg p-4 flex flex-col items-center justify-center bg-white/5 hover:bg-white/10 transition-colors cursor-pointer">
                                <Logo className="w-8 h-8 text-indigo-500 mb-2" />
                                <span className="text-xs text-slate-400">Clique para alterar (SVG/PNG)</span>
                             </div>
                          </div>
                       </div>
                    </div>
                 </div>
              </motion.div>
           )}
        </AnimatePresence>

        <AnimatePresence>
          {editingLink && (
            <motion.div 
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               exit={{ opacity: 0 }}
               className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
            >
               <motion.div 
                  initial={{ scale: 0.95, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.95, opacity: 0 }}
                  className="bg-[#0A0A0A] border border-[#1A2C47] rounded-xl w-full max-w-md p-6"
               >
                  <div className="flex justify-between items-start mb-6">
                     <div>
                        <h3 className="text-xl font-bold text-white mb-1">Editar Link - {editingLink.name}</h3>
                        <p className="text-sm text-slate-400">Insira o novo link de pagamento do Asaas para o plano de R$ {editingLink.price}.</p>
                     </div>
                     <button onClick={() => setEditingLink(null)} className="text-slate-500 hover:text-white transition-colors">
                        <XCircle className="w-5 h-5" />
                     </button>
                  </div>
                  
                  <div className="space-y-6">
                     <div>
                        <label className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-2 block">Link de Pagamento (URL)</label>
                        <div className="flex gap-2">
                           <input 
                             type="url" 
                             value={newLinkUrl}
                             onChange={e => setNewLinkUrl(e.target.value)}
                             placeholder="https://asaas.com/c/..."
                             className="w-full bg-[#111] border border-white/10 rounded-lg p-3 text-white focus:outline-none focus:border-indigo-500 transition-colors"
                           />
                           <button 
                             onClick={() => {
                                setPaymentLinks(prev => ({ ...prev, [editingLink.id]: newLinkUrl }));
                                toast.success('Link de pagamento atualizado com sucesso!');
                                setEditingLink(null);
                             }} 
                             className="px-4 py-3 rounded-lg font-semibold bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-400 border border-indigo-500/20 transition-colors text-sm whitespace-nowrap"
                           >
                              Salvar Link
                           </button>
                        </div>
                     </div>

                     <div className="pt-4 border-t border-white/5">
                        <label className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-2 block">Atribuir cliente a este plano</label>
                        <div className="flex gap-2">
                           <select 
                             id="assign-client-select"
                             className="w-full bg-[#111] border border-white/10 rounded-lg p-3 text-white focus:outline-none focus:border-indigo-500 transition-colors appearance-none"
                           >
                              <option value="">Selecione um cliente...</option>
                              {clients.map(c => (
                                 <option key={c.id} value={c.id}>{c.name} ({c.plan})</option>
                              ))}
                           </select>
                           <button 
                             onClick={() => {
                                const select = document.getElementById('assign-client-select') as HTMLSelectElement;
                                const clientId = parseInt(select.value);
                                if (!clientId) {
                                   toast.error('Selecione um cliente primeiro.');
                                   return;
                                }
                                const targetPlanName = editingLink.id === 'basic' ? 'Básico' : editingLink.id === 'pro' ? 'Pro' : 'Premium';
                                setClients(clients.map(c => String(c.id) === String(clientId) ? { ...c, plan: targetPlanName } : c));
                                toast.success(`Plano do cliente alterado para ${targetPlanName}!`);
                                select.value = '';
                             }} 
                             className="px-4 py-3 rounded-lg font-semibold bg-white/10 hover:bg-white/20 text-white transition-colors text-sm whitespace-nowrap"
                           >
                              Alterar Plano
                           </button>
                        </div>
                        <p className="text-[10px] text-slate-500 mt-2">Isso mudará o plano do cliente selecionado para {editingLink.name}.</p>
                     </div>
                  </div>

                  <div className="flex justify-end mt-8">
                     <button onClick={() => setEditingLink(null)} className="px-4 py-2 rounded-lg font-semibold text-slate-400 hover:text-white transition-colors text-sm">Fechar</button>
                  </div>
               </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {editingLicenseCompany && (
             <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
             >
                <motion.div 
                   initial={{ scale: 0.95, opacity: 0 }}
                   animate={{ scale: 1, opacity: 1 }}
                   exit={{ scale: 0.95, opacity: 0 }}
                   className="bg-[#0A0D15] border border-white/10 rounded-2xl w-full max-w-2xl p-6 my-8 font-sans shadow-2xl relative"
                >
                   <div className="flex justify-between items-start mb-6">
                      <div>
                         <span className="text-[10px] text-cyan-400 font-bold uppercase tracking-widest font-mono">Controle Administrativo</span>
                         <h3 className="text-xl font-bold text-white mb-1">Licença: {editingLicenseCompany.name}</h3>
                         <p className="text-xs text-slate-400">Configure os parâmetros de plano, limites operacionais e habilitadores de código.</p>
                      </div>
                      <button onClick={() => setEditingLicenseCompany(null)} className="text-slate-400 hover:text-white transition-colors cursor-pointer">
                         <XCircle className="w-5 h-5" />
                      </button>
                   </div>

                   <div className="grid grid-cols-1 md:grid-cols-2 gap-5 overflow-y-auto max-h-[60vh] pr-2">
                      {/* Left: Metadata and Plan limits */}
                      <div className="space-y-4">
                         <h4 className="text-xs font-black uppercase text-slate-400 tracking-wider font-mono border-b border-white/5 pb-1 flex items-center gap-1.5">
                            <Crown className="w-3.5 h-3.5 text-yellow-500" /> Plano & Status Geral
                         </h4>

                         <div className="space-y-4 bg-white/5 p-4 rounded-xl border border-white/5">
                            <div>
                               <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5 font-mono">Assinatura de Nível</label>
                               <select 
                                  value={licPlan} 
                                  onChange={(e: any) => setLicPlan(e.target.value)}
                                  className="w-full bg-[#111622] text-sm text-slate-200 border border-white/10 rounded-lg p-2.5 focus:outline-none focus:border-cyan-500 transition-colors"
                               >
                                  <option value="Bronze">Bronze (Básico)</option>
                                  <option value="Prata">Prata (Médio)</option>
                                  <option value="Ouro">Ouro (Ilimitado / Partner)</option>
                               </select>
                            </div>

                            <div>
                               <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5 font-mono">Status da Licença</label>
                               <select 
                                  value={licStatus} 
                                  onChange={(e: any) => setLicStatus(e.target.value)}
                                  className="w-full bg-[#111622] text-sm text-slate-200 border border-white/10 rounded-lg p-2.5 focus:outline-none focus:border-cyan-500 transition-colors"
                               >
                                  <option value="active">✓ Ativa (Pago)</option>
                                  <option value="trial">⚡ Teste Grátis (Trial)</option>
                                  <option value="expired">✗ Expirada/Bloqueada</option>
                               </select>
                            </div>

                            <div>
                               <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5 font-mono">Vencimento da Licença</label>
                               <input 
                                  type="date" 
                                  value={licExpireDate}
                                  onChange={(e) => setLicExpireDate(e.target.value)}
                                  className="w-full bg-[#111622] text-sm text-slate-200 border border-white/10 rounded-lg p-2.5 focus:outline-none focus:border-cyan-500 transition-colors font-mono"
                               />
                            </div>
                         </div>

                         <h4 className="text-xs font-black uppercase text-slate-400 tracking-wider font-mono border-b border-white/5 pb-1 flex items-center gap-1.5 mt-2">
                            <Bot className="w-3.5 h-3.5 text-cyan-400" /> Limites de Consumo
                         </h4>

                         <div className="grid grid-cols-2 gap-4">
                            <div>
                               <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 font-mono">Max Usuários</label>
                               <input 
                                  type="number" 
                                  value={licMaxUsers}
                                  onChange={(e) => setLicMaxUsers(parseInt(e.target.value) || 0)}
                                  className="w-full bg-[#111622] text-sm text-slate-200 border border-white/10 rounded-lg p-2 focus:outline-none focus:border-cyan-500 transition-colors font-mono"
                               />
                            </div>
                            <div>
                               <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 font-mono">Max Unidades</label>
                               <input 
                                  type="number" 
                                  value={licUnitsCount}
                                  onChange={(e) => setLicUnitsCount(parseInt(e.target.value) || 0)}
                                  className="w-full bg-[#111622] text-sm text-slate-200 border border-white/10 rounded-lg p-2 focus:outline-none focus:border-cyan-500 transition-colors font-mono"
                               />
                            </div>
                         </div>

                         <div className="grid grid-cols-1 gap-4">
                            <div>
                               <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 font-mono">Controle Consumo IA (Requisições Realizadas)</label>
                               <input 
                                  type="number" 
                                  value={licAiUsage}
                                  onChange={(e) => setLicAiUsage(parseInt(e.target.value) || 0)}
                                  className="w-full bg-[#111622] text-sm text-slate-200 border border-white/10 rounded-lg p-2 focus:outline-none focus:border-cyan-500 transition-colors font-mono"
                               />
                            </div>
                         </div>
                      </div>

                      {/* Right: Feature flags switches */}
                      <div className="space-y-4">
                         <h4 className="text-xs font-black uppercase text-slate-400 tracking-wider font-mono border-b border-white/5 pb-1 flex items-center gap-1.5">
                            <Zap className="w-3.5 h-3.5 text-pink-500" /> Módulos Habilitados
                         </h4>

                         <div className="space-y-2 bg-white/5 p-4 rounded-xl border border-white/5 max-h-[340px] overflow-y-auto">
                            {[
                               { id: 'whatsapp', name: 'WhatsApp Dashboard (WA-API)', description: 'Dashboard de campanhas e inteligência de leads por whatsapp.', state: flagWhatsapp, setter: setFlagWhatsapp },
                               { id: 'aiAssistant', name: 'Assistente de Inteligência Artificial', description: 'Atendimento inteligente com Gemini AI integrado.', state: flagAiAssistant, setter: setFlagAiAssistant },
                               { id: 'crm', name: 'Módulo CRM Pipelines', description: 'Funil de vendas, jornada de atendimento de clientes.', state: flagCrm, setter: setFlagCrm },
                               { id: 'pdv', name: 'Controle de Caixa PDV', description: 'Vendas rápidas presenciais e fechamento de caixa.', state: flagPdv, setter: setFlagPdv },
                               { id: 'agenda', name: 'Agenda para Clientes', description: 'Agendamentos automotivos, de beleza ou de eventos.', state: flagAgenda, setter: setFlagAgenda },
                               { id: 'cashback', name: 'Cashback e Fidelidade', description: 'Geração de cupons automatizados e moedas de retorno.', state: flagCashback, setter: setFlagCashback },
                               { id: 'whiteLabel', name: 'White-Label Custom App', description: 'PWA customizado hospedado no domínio do parceiro.', state: flagWhiteLabel, setter: setFlagWhiteLabel },
                               { id: 'marketplace', name: 'Marketplace de Plugins', description: 'Habilidade de estender recursos de terceiros facilmente.', state: flagMarketplace, setter: setFlagMarketplace },
                               { id: 'mobileApp', name: 'Mobile App Customizer', description: 'Construção nativa reativa para o smartphone do cliente.', state: flagMobileApp, setter: setFlagMobileApp }
                            ].map((item) => (
                               <label key={item.id} className="flex items-start gap-3 p-2 hover:bg-white/5 rounded-lg cursor-pointer transition-all border border-transparent hover:border-white/5">
                                  <input 
                                     type="checkbox" 
                                     checked={item.state} 
                                     onChange={(e) => item.setter(e.target.checked)}
                                     className="mt-1 accent-indigo-500 w-4 h-4 rounded cursor-pointer"
                                  />
                                  <div>
                                     <div className="text-xs font-bold text-white leading-none mb-1">{item.name}</div>
                                     <div className="text-[10px] text-slate-500 leading-tight">{item.description}</div>
                                  </div>
                               </label>
                            ))}
                         </div>
                      </div>
                   </div>

                   <div className="flex justify-end gap-3 mt-8 border-t border-white/10 pt-4">
                      <button 
                         onClick={() => setEditingLicenseCompany(null)} 
                         className="px-4 py-2 bg-white/5 hover:bg-white/10 text-slate-300 font-bold rounded-lg text-xs font-mono uppercase transition-colors"
                      >
                         Cancelar
                      </button>
                      <button 
                         onClick={async () => {
                            if (!editingLicenseCompany) return;
                            const id = editingLicenseCompany.id;
                            const loadingToast = toast.loading("Salvando licenciamento no Firestore...");
                            try {
                               const licData = {
                                  plan: licPlan,
                                  status: licStatus,
                                  expireDate: licExpireDate,
                                  maxUsers: licMaxUsers,
                                  unitsCount: licUnitsCount,
                                  aiUsage: licAiUsage,
                                  waUsage: licWaUsage
                               };

                               const flagsData = {
                                  companyId: id,
                                  pdv: flagPdv,
                                  agenda: flagAgenda,
                                  crm: flagCrm,
                                  whatsapp: flagWhatsapp,
                                  aiAssistant: flagAiAssistant,
                                  cashback: flagCashback,
                                  whiteLabel: flagWhiteLabel,
                                  marketplace: flagMarketplace,
                                  mobileApp: flagMobileApp
                               };

                               // Perform parallel Firestore updates
                               await setDoc(doc(db, 'company_licenses', id), licData, { merge: true });
                               await setDoc(doc(db, 'feature_flags', id), flagsData, { merge: true });

                               // Sync directly with primary users collection
                               await updateDoc(doc(db, 'users', id), {
                                  plan: licPlan,
                                  status: licStatus === 'active' ? 'Ativo' : licStatus === 'expired' ? 'Cancelado' : 'Trial',
                                  expire: licExpireDate
                                });

                               // Update state cache immediately
                               setLicenses(prev => ({ ...prev, [id]: licData }));
                               setFlags(prev => ({ ...prev, [id]: flagsData }));
                               setClients(prev => prev.map(c => c.id === id ? {
                                  ...c,
                                  plan: licPlan,
                                  status: licStatus === 'active' ? 'Ativo' : licStatus === 'expired' ? 'Cancelado' : 'Trial',
                                  expire: licExpireDate
                               } : c));

                               toast.success("Licença e Módulos atualizados com sucesso!");
                               setEditingLicenseCompany(null);
                            } catch (err) {
                               console.error("Error saving license:", err);
                               toast.error("Erro ao registrar no Firestore.");
                            } finally {
                               toast.dismiss(loadingToast);
                            }
                         }}
                         className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-indigo-500 hover:from-cyan-400 hover:to-indigo-400 text-black font-black rounded-lg text-xs font-mono uppercase tracking-wider shadow-[0_0_20px_rgba(6,182,212,0.4)] transition-all cursor-pointer"
                      >
                         ✓ Salvar Alterações
                      </button>
                   </div>
                </motion.div>
             </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {isCompanyModalOpen && (
            <motion.div 
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               exit={{ opacity: 0 }}
               className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
            >
               <motion.div 
                  initial={{ scale: 0.95, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.95, opacity: 0 }}
                  className="bg-[#0A0A0A] border border-[#1A2C47] rounded-xl w-full max-w-xl p-6 my-8"
               >
                  <div className="flex justify-between items-start mb-6">
                     <div>
                        <h3 className="text-xl font-bold text-white mb-1">{editingCompany ? 'Editar Empresa' : 'Nova Empresa'}</h3>
                        <p className="text-sm text-slate-400">{editingCompany ? 'Atualize as informações da empresa selecionada.' : 'Adicione uma nova empresa ao sistema mantendo o controle centralizado.'}</p>
                     </div>
                     <button onClick={() => {setIsCompanyModalOpen(false); setEditingCompany(null)}} className="text-slate-500 hover:text-white transition-colors">
                        <XCircle className="w-5 h-5" />
                     </button>
                  </div>
                  
                  <div className="space-y-4">
                     <div className="grid grid-cols-2 gap-4">
                       <div>
                          <label className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-2 block">Nome da Empresa</label>
                          <input 
                            type="text" 
                            defaultValue={editingCompany?.name || ''}
                            id="company-name"
                            className="w-full bg-[#111] border border-white/10 rounded-lg p-3 text-white focus:outline-none focus:border-indigo-500 transition-colors"
                          />
                       </div>
                       <div>
                          <label className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-2 block">E-mail</label>
                          <input 
                            type="email" 
                            defaultValue={editingCompany?.email || ''}
                            id="company-email"
                            className="w-full bg-[#111] border border-white/10 rounded-lg p-3 text-white focus:outline-none focus:border-indigo-500 transition-colors"
                          />
                       </div>
                     </div>
                     <div className="grid grid-cols-2 gap-4">
                       <div>
                          <label className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-2 block">Plano</label>
                          <select 
                            defaultValue={editingCompany?.plan || 'Trial'}
                            id="company-plan"
                            className="w-full bg-[#111] border border-white/10 rounded-lg p-3 text-white focus:outline-none focus:border-indigo-500 transition-colors appearance-none"
                          >
                             <option value="Trial">Trial</option>
                             <option value="Básico">Básico</option>
                             <option value="Pro">Pro</option>
                             <option value="Premium">Premium</option>
                          </select>
                       </div>
                       <div>
                          <label className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-2 block">Status</label>
                          <select 
                            defaultValue={editingCompany?.status || 'Trial'}
                            id="company-status"
                            className="w-full bg-[#111] border border-white/10 rounded-lg p-3 text-white focus:outline-none focus:border-indigo-500 transition-colors appearance-none"
                          >
                             <option value="Trial">Trial</option>
                             <option value="Ativo">Ativo</option>
                             <option value="Inadimplente">Inadimplente</option>
                             <option value="Cancelado">Cancelado</option>
                             <option value="Suspenso">Suspenso</option>
                             <option value="Bloqueado">Bloqueado</option>
                          </select>
                       </div>
                     </div>

                     <div className="pt-4 border-t border-white/5">
                        <label className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-4 block">Nicho de Atuação</label>
                        <select
                           defaultValue={editingCompany?.niche || 'beauty'}
                           id="company-niche"
                           className="w-full bg-[#111] border border-white/10 rounded-lg p-3 text-white focus:outline-none focus:border-indigo-500 transition-colors appearance-none mb-4"
                        >
                           <option value="beauty">Salão / Barbearia (Beleza)</option>
                           <option value="health">Clínica (Saúde/Odonto)</option>
                           <option value="auto">Oficina Mecânica</option>
                           <option value="pet">Petshop / Vet</option>
                        </select>
                     </div>

                     <div className="pt-4 border-t border-white/5">
                        <label className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-4 block">Chaves de API & Integrações</label>
                        <div className="space-y-4">
                           <div>
                              <p className="text-xs font-medium text-slate-300 mb-2">Google Gemini (IA)</p>
                              <input 
                                 type="text" 
                                 id="company-gemini-key"
                                 defaultValue={editingCompany?.geminiKey || ''}
                                 placeholder="AIzaSy..."
                                 className="w-full bg-[#111] border border-white/10 rounded-lg p-3 text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors"
                              />
                           </div>
                           <div>
                              <p className="text-xs font-medium text-slate-300 mb-2">Evolution API (WhatsApp) - URL e Chave</p>
                              <div className="grid grid-cols-2 gap-2">
                                 <input 
                                    type="text" 
                                    id="company-evolution-url"
                                    defaultValue={editingCompany?.evolutionUrl || ''}
                                    placeholder="https://..."
                                    className="w-full bg-[#111] border border-white/10 rounded-lg p-3 text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors"
                                 />
                                 <input 
                                    type="text" 
                                    id="company-evolution-key"
                                    defaultValue={editingCompany?.evolutionKey || ''}
                                    placeholder="Global API Key"
                                    className="w-full bg-[#111] border border-white/10 rounded-lg p-3 text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors"
                                 />
                              </div>
                           </div>
                           <div>
                              <p className="text-xs font-medium text-slate-300 mb-2">Asaas API (Cobranças)</p>
                              <input 
                                 type="text" 
                                 id="company-asaas-key"
                                 defaultValue={editingCompany?.asaasKey || ''}
                                 placeholder="$aact_..."
                                 className="w-full bg-[#111] border border-white/10 rounded-lg p-3 text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors"
                              />
                           </div>
                        </div>
                     </div>

                     <div className="pt-4 border-t border-white/5">
                        <label className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-4 block">Feature Flags Específicas</label>
                        <div className="grid grid-cols-2 gap-3">
                           {['IA Generativa', 'WhatsApp Nativo', 'Automações', 'White-label', 'API Premium'].map(feature => (
                             <div key={feature} className="flex items-center gap-3 p-2 bg-white/5 border border-white/5 rounded-lg">
                               <input type="checkbox" id={`flag-${feature.replace(/\s+/g, '-')}`} defaultChecked={editingCompany ? true : false} className="w-4 h-4 rounded bg-[#111] border-white/20 text-indigo-500 focus:ring-indigo-500 focus:ring-offset-0" />
                               <span className="text-sm font-medium text-slate-300">{feature}</span>
                             </div>
                           ))}
                        </div>
                     </div>
                  </div>

                  <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-white/10">
                     <button onClick={() => {setIsCompanyModalOpen(false); setEditingCompany(null)}} className="px-4 py-2 rounded-lg font-semibold text-slate-400 hover:text-white transition-colors text-sm">Cancelar</button>
                     <button 
                       onClick={async () => {
                          const name = (document.getElementById('company-name') as HTMLInputElement).value;
                          const email = (document.getElementById('company-email') as HTMLInputElement).value;
                          const plan = (document.getElementById('company-plan') as HTMLSelectElement).value;
                          const status = (document.getElementById('company-status') as HTMLSelectElement).value;
                          const niche = (document.getElementById('company-niche') as HTMLSelectElement).value;
                          const geminiKey = (document.getElementById('company-gemini-key') as HTMLInputElement).value;
                          const evolutionUrl = (document.getElementById('company-evolution-url') as HTMLInputElement).value;
                          const evolutionKey = (document.getElementById('company-evolution-key') as HTMLInputElement).value;
                          const asaasKey = (document.getElementById('company-asaas-key') as HTMLInputElement).value;
                          
                          if (!name || !email) {
                             toast.error('Preencha os campos obrigatórios (nome e email)!');
                             return;
                          }

                          const clientData = {
                             name, email, plan, status, niche, geminiKey, evolutionUrl, evolutionKey, asaasKey
                          };

                          try {
                             if (editingCompany && editingCompany.id) {
                                await updateDoc(doc(db, 'users', editingCompany.id), clientData);
                                setClients(clients.map(c => c.id === editingCompany.id ? { ...c, ...clientData } : c));
                                toast.success('Empresa atualizada com sucesso!');
                             } else {
                                const newId = Date.now().toString();
                                const fullData = { ...clientData, expire: '2026-05-01', active: true };
                                await setDoc(doc(db, 'users', newId), fullData);
                                setClients([{ id: newId, ...fullData }, ...clients]);
                                toast.success('Empresa criada com sucesso!');
                             }
                          } catch (err) {
                             console.error(err);
                             toast.error('Erro ao salvar no Firestore!');
                          }

                          setIsCompanyModalOpen(false);
                          setEditingCompany(null);
                       }} 
                       className="px-4 py-2 rounded-lg font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition-colors text-sm flex items-center gap-2"
                     >
                        <CheckCircle2 className="w-4 h-4" />
                        {editingCompany ? 'Salvar Alterações' : 'Criar Empresa'}
                     </button>
                  </div>
               </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
        </div>
      </main>
    </div>
  )
}
