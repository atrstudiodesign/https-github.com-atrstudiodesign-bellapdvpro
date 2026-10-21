import React, { ReactNode, useState, useEffect } from 'react';
import { NavLink, useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/auth';
import { isSuperAdminEmail } from '../../lib/superAdmins';
import { useNicheStore } from '../../store/niche';
import { useSubscriptionStore } from '../../store/subscription';
import { motion, AnimatePresence } from 'motion/react';
import { 
  LayoutDashboard, 
  Scissors, 
  Calendar, 
  Users, 
  Settings, 
  LogOut,
  Bell,
  Search,
  ShoppingCart,
  ShoppingBag,
  Receipt,
  UserCircle,
  Briefcase,
  DollarSign,
  BarChart3,
  Gift,
  Bot,
  Shield,
  Clock,
  HeartPulse,
  AlertTriangle,
  Lock,
  Sparkles,
  X,
  MonitorSmartphone,
  Globe,
  Smartphone,
  Menu
} from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { Logo } from '../ui/Logo';
import { AtrStudioBadge } from '../ui/AtrStudioBadge';
import { GlobalSearch } from './GlobalSearch';
import { DemoTopBanner } from '../demo/DemoTopBanner';
import { DemoLeadCaptureModal } from '../demo/DemoLeadCaptureModal';
import { useDemoModalStore } from '../../services/demoService';
import { ArrowRight, Flame } from 'lucide-react';
import { toast } from 'sonner';
const AndroidApkModal = React.lazy(() =>
  import('../pwa/AndroidApkModal').then((module) => ({ default: module.AndroidApkModal }))
);

export function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(clsx(inputs));
}

export function DashboardLayout({ children }: { children: ReactNode }) {
  const { logout, user } = useAuthStore();
  const { openDemoModal } = useDemoModalStore();
  const { getConfig } = useNicheStore();
  const config = getConfig();
  const navigate = useNavigate();
  const location = useLocation();
  const { status, setStatus, getRestrictedRoutes } = useSubscriptionStore();
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [isInstallModalOpen, setIsInstallModalOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    });
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
      }
    } else {
      setIsInstallModalOpen(true);
    }
  };

  const handleAction1 = () => {
    setIsAiModalOpen(false);
    toast.success('Campanha de WhatsApp disparada', {
      description: '12 mensagens em lote sendo enviadas. Retorno estimado: R$ 450.',
    });
  };

  const handleAction2 = () => {
    setIsAiModalOpen(false);
    toast.success('Agenda remanejada com sucesso', {
      description: '3 clientes antecipados. Você salvou 2h livres de Sílvia amanhã!',
    });
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
    { icon: Receipt, label: 'Frente de Caixa', path: '/pos', badge: 'F2' },
    { icon: Calendar, label: 'Agenda', path: '/schedule' },
    { icon: Users, label: `${config.terminology.client}s`, path: '/clients' },
    { icon: HeartPulse, label: 'CRM / Funil', path: '/crm' },
    { icon: UserCircle, label: `${config.terminology.employee}s`, path: '/professionals' },
    { icon: Briefcase, label: `${config.terminology.service}s`, path: '/services' },
    ...(config.features.hasAnamnesis ? [{ icon: HeartPulse, label: 'Prontuário Eletrônico', path: '/anamnesis' }] : []),
    ...(config.features.hasQueue ? [{ icon: Users, label: 'Fila de Atendimento', path: '/queue' }] : []),
    ...(config.features.hasPackages ? [{ icon: Briefcase, label: 'Pacotes & Sessões', path: '/packages' }] : []),
    { icon: DollarSign, label: 'Caixa & Financeiro', path: '/finance' },
    { icon: BarChart3, label: 'Relatórios', path: '/reports' },
    { icon: Gift, label: 'Fidelidade', path: '/loyalty' },
    { icon: Globe, label: 'Catálogo & App', path: '/online' },
    { icon: MonitorSmartphone, label: 'Totem de Autoatendimento', path: '/totem' },
    { icon: Bot, label: 'Marketing IA', path: '/marketing' },
    { icon: Sparkles, label: 'Automações', path: '/automations' },
    { icon: Shield, label: 'Integrações', path: '/integrations' },
    { icon: ShoppingBag, label: 'Marketplace', path: '/marketplace' },
    { icon: Settings, label: 'Configurações', path: '/settings' },
  ];

  const restrictedRoutes = getRestrictedRoutes();
  const isCurrentRestricted = restrictedRoutes.includes(location.pathname);

  return (
    <div className="flex h-[100dvh] bg-[#0B0F1A] text-slate-300 overflow-hidden w-full pb-[64px] md:pb-0">
      {/* Mobile Drawer Navigation */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 md:hidden"
            />
            
            {/* Drawer */}
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 bottom-0 left-0 w-[280px] bg-[#0F172A] z-50 border-r border-white/5 flex flex-col md:hidden shadow-2xl h-full"
            >
              {/* Drawer Header */}
              <div className="p-6 flex items-center justify-between border-b border-white/5 h-20">
                <div className="flex flex-col gap-0.5">
                  <Logo size="sm" />
                  <span className="text-[9px] text-slate-500 pl-11 uppercase tracking-widest">{config.title || 'Outro Negócio'}</span>
                </div>
                <button 
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-1 rounded-lg hover:bg-white/5 text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Drawer Scrollable Navigation */}
              <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto hide-scrollbar">
                {navItems.map((item) => {
                   const isRestrictedByDunning = restrictedRoutes.includes(item.path);
                   
                   const featureMap: Record<string, string> = {
                      '/marketing': 'ia',
                      '/automations': 'automacoes',
                      '/crm': 'crm',
                      '/reports': 'relatorios',
                      '/schedule': 'agenda',
                      '/pos': 'pdv',
                   };
                   
                   const featureKey = featureMap[item.path];
                   const isRestrictedByPlan = (featureKey && user) ? !user.planFeatures.includes(featureKey) : false;
                   const isRestricted = isRestrictedByDunning || isRestrictedByPlan;

                   return isRestricted ? (
                      <div key={item.path} className="flex items-center justify-between px-3 py-2.5 rounded-lg text-sm text-slate-600 opacity-50 cursor-not-allowed border border-transparent">
                        <div className="flex items-center gap-3">
                           <item.icon className="w-[18px] h-[18px]" />
                           <span className="tracking-wide line-through text-slate-500">{item.label}</span>
                        </div>
                        <Lock className="w-3.5 h-3.5 text-slate-500/50" />
                      </div>
                   ) : (
                      <NavLink
                        key={item.path}
                        to={item.path}
                        onClick={() => setIsMobileMenuOpen(false)}
                        className={({ isActive }) =>
                          cn(
                            "flex items-center justify-between px-3 py-2.5 rounded-lg transition-all duration-200 group text-sm border border-transparent",
                            isActive 
                              ? "bg-cyan-500/10 text-cyan-400 border-cyan-500/30 font-medium" 
                              : "text-slate-400 hover:text-white hover:bg-white/5"
                          )
                        }
                      >
                        <div className="flex items-center gap-3">
                           <item.icon className="w-[18px] h-[18px]" />
                           <span className="tracking-wide">{item.label}</span>
                        </div>
                        {item.badge && (
                           <span className="text-[10px] bg-white/5 border border-white/10 px-1.5 py-0.5 rounded text-slate-500">
                             {item.badge}
                           </span>
                        )}
                      </NavLink>
                   )
                })}
              </nav>

              {/* Drawer Footer */}
              <div className="p-4 border-t border-white/5 flex flex-col gap-2">
                {!user?.isDemo && (user?.isPlatformAdmin || isSuperAdminEmail(user?.email)) && (
                  <Link 
                    to="/admin"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-purple-400 hover:bg-purple-500/10 border border-purple-500/20 transition-all bg-white/5"
                  >
                    <Shield className="w-5 h-5" />
                    <span className="tracking-wide font-medium">{user?.isPlatformAdmin ? 'Painel Admin' : 'Super admin pendente'}</span>
                  </Link>
                )}
                <button 
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    setIsInstallModalOpen(true);
                  }}
                  className="w-full flex items-center justify-between px-3 py-2.5 text-sm rounded-lg text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 transition-all font-medium mb-1 shadow-sm"
                >
                  <div className="flex items-center gap-2.5">
                    <Smartphone className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span className="tracking-wide">Instalar App Android</span>
                  </div>
                  <span className="text-[10px] bg-emerald-500/20 border border-emerald-500/30 px-1.5 py-0.5 rounded text-emerald-300 font-bold uppercase">
                    APK
                  </span>
                </button>
                <button 
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    handleLogout();
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 text-sm rounded-lg text-slate-500 hover:text-white hover:bg-white/5 transition-all duration-200"
                >
                  <LogOut className="w-[18px] h-[18px]" />
                  <span className="tracking-wide">Sair</span>
                </button>
                <div className="pt-2 px-1 flex justify-center border-t border-white/5 mt-1">
                  <AtrStudioBadge size="sm" />
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside className="hidden md:flex w-[260px] bg-[#0F172A] border-r border-white/5 flex-col z-20 flex-shrink-0">
        <div className="p-6 flex flex-col gap-1 border-b border-white/5 h-20 justify-center">
          <Logo size="sm" />
          <span className="text-[10px] text-slate-500 pl-11 -mt-1 uppercase tracking-widest">{config.title || 'Outro Negócio'}</span>
        </div>

        <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto hide-scrollbar">
          {navItems.map((item) => {
             const isRestrictedByDunning = restrictedRoutes.includes(item.path);
             
             // Mapping paths to feature keys defined in auth.ts
             const featureMap: Record<string, string> = {
                '/marketing': 'ia',
                '/automations': 'automacoes',
                '/crm': 'crm',
                '/reports': 'relatorios',
                '/schedule': 'agenda',
                '/pos': 'pdv',
             };
             
             const featureKey = featureMap[item.path];
             const isRestrictedByPlan = (featureKey && user) ? !user.planFeatures.includes(featureKey) : false;
             
             const isRestricted = isRestrictedByDunning || isRestrictedByPlan;

             return isRestricted ? (
                <div key={item.path} className="flex items-center justify-between px-3 py-2.5 rounded-lg text-sm text-slate-600 opacity-50 cursor-not-allowed border border-transparent" title={isRestrictedByPlan ? "Upgrade seu plano para acessar" : "Bloqueado por inadimplência"}>
                  <div className="flex items-center gap-3">
                     <item.icon className="w-[18px] h-[18px]" />
                     <span className="tracking-wide line-through">{item.label}</span>
                  </div>
                  <Lock className="w-3.5 h-3.5 text-slate-500/50" />
                </div>
             ) : (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) =>
                    cn(
                      "flex items-center justify-between px-3 py-2.5 rounded-lg transition-all duration-200 group text-sm border border-transparent",
                      isActive 
                        ? "bg-cyan-500/10 text-cyan-400 border-cyan-500/30 font-medium" 
                        : "text-slate-400 hover:text-white hover:bg-white/5"
                    )
                  }
                >
                  <div className="flex items-center gap-3">
                     <item.icon className={cn("w-[18px] h-[18px]")} />
                     <span className="tracking-wide">{item.label}</span>
                  </div>
                  {item.badge && (
                     <span className="text-[10px] bg-white/5 border border-white/10 px-1.5 py-0.5 rounded text-slate-500">
                       {item.badge}
                     </span>
                  )}
                </NavLink>
             )
          })}
        </nav>

        <div className="p-4 border-t border-white/5 flex flex-col gap-2">
          <button
            onClick={() => setIsInstallModalOpen(true)}
            className="w-full flex items-center justify-between px-3 py-2 text-xs rounded-lg text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 transition-all font-medium shadow-sm"
            title="Instalar App Android ou Gerar APK"
          >
            <div className="flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-emerald-400 shrink-0" />
              <span className="tracking-wide">App Android / APK</span>
            </div>
            <span className="text-[9px] bg-emerald-500/20 border border-emerald-500/30 px-1.5 py-0.5 rounded text-emerald-300 font-bold uppercase">
              Instalar
            </span>
          </button>
          {!user?.isDemo && (user?.isPlatformAdmin || isSuperAdminEmail(user?.email)) && (
            <Link 
              to="/admin"
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-purple-400 hover:bg-purple-500/10 border border-purple-500/20 transition-all bg-white/5"
            >
              <Shield className="w-5 h-5" />
              <span className="tracking-wide font-medium">{user?.isPlatformAdmin ? 'Painel Admin' : 'Super admin pendente'}</span>
            </Link>
          )}
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 text-sm rounded-lg text-slate-500 hover:text-white hover:bg-white/5 transition-all duration-200"
          >
            <LogOut className="w-[18px] h-[18px]" />
            <span className="tracking-wide">Sair</span>
          </button>
          <div className="pt-2 px-1 flex justify-center border-t border-white/5 mt-1">
            <AtrStudioBadge size="sm" />
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 relative h-full overflow-y-auto overflow-x-hidden hide-scrollbar">
        {/* Top Header - Context Banners based on Status */}
        <header className="h-[72px] bg-[#0B0F1A] border-b border-white/5 flex items-center justify-between px-4 md:px-6 z-10 shrink-0">
           
           <div className="flex items-center gap-2 md:gap-4">
              {/* Mobile Menu Button */}
              <button 
                onClick={() => setIsMobileMenuOpen(true)}
                className="md:hidden p-2 rounded-xl bg-white/5 border border-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer"
                title="Abrir Menu"
              >
                <Menu className="w-5 h-5" />
              </button>

              {/* Logo fallback for mobile header if side menu is closed */}
              <div className="md:hidden flex items-center">
                 <Logo size="sm" hideText={true} />
              </div>

              {user?.isDemo && (
                 <div className="flex items-center gap-2">
                   <div className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-cyan-500/15 via-blue-500/15 to-purple-500/15 text-cyan-300 rounded-full border border-cyan-500/30 font-medium text-xs shadow-sm">
                      <Sparkles className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
                      <span className="hidden sm:inline">Modo Demo (Acesso Limitado)</span>
                      <span className="sm:hidden">Modo Demo</span>
                   </div>
                   <button
                     onClick={() => openDemoModal('Barra de Navegação Superior')}
                     className="hidden sm:flex px-2.5 py-1 rounded-full bg-gradient-to-r from-emerald-400 to-cyan-400 hover:opacity-90 text-slate-950 font-black text-[11px] shadow-sm items-center gap-1 transition-transform hover:scale-105 active:scale-95 cursor-pointer"
                   >
                     <span>Desbloquear 15 Dias Grátis</span>
                     <ArrowRight className="w-3 h-3" />
                   </button>
                 </div>
              )}

              {status === 'TRIAL' && !user?.isDemo && (
                 <div className="flex items-center gap-1.5 px-3 py-1.5 md:px-4 md:py-2 bg-blue-500/10 text-blue-400 rounded-full border border-blue-500/30 font-medium text-xs md:text-sm">
                    <Clock className="w-4 h-4 shrink-0" />
                    <span className="hidden xs:inline">Trial gratuito - <span className="font-semibold">0h 6m</span></span>
                    <span className="xs:hidden">Trial <span className="font-semibold">0h 6m</span></span>
                 </div>
              )}
              {status === 'WARNING' && (
                 <div className="flex items-center gap-2 px-3 py-1.5 md:px-4 md:py-2 bg-yellow-500/10 text-yellow-500 rounded-full border border-yellow-500/30 font-medium text-xs md:text-sm shadow-[0_0_15px_rgba(234,179,8,0.1)]">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span className="hidden md:inline">Sua assinatura venceu. <span className="font-semibold">Pague agora para evitar bloqueio.</span></span>
                    <span className="md:hidden">Assinatura Vencida</span>
                 </div>
              )}
              {status === 'BLOCK_PARTIAL' && (
                 <div className="flex items-center gap-2 px-3 py-1.5 md:px-4 md:py-2 bg-red-500/10 text-red-500 rounded-full border border-red-500/30 font-medium text-xs md:text-sm shadow-[0_0_15px_rgba(239,68,68,0.2)]">
                    <Lock className="w-4 h-4 shrink-0" />
                    <span className="hidden md:inline">Acesso Limitado. <span className="font-semibold">Recursos avançados bloqueados.</span></span>
                    <span className="md:hidden">Acesso Limitado</span>
                 </div>
              )}
              {status === 'BLOCK_TOTAL' && (
                 <div className="flex items-center gap-2 px-3 py-1.5 md:px-4 md:py-2 bg-red-600/20 text-red-400 rounded-full border border-red-500/50 font-bold text-xs md:text-sm shadow-[0_0_15px_rgba(239,68,68,0.4)]">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span className="uppercase tracking-widest">SISTEMA SUSPENSO</span>
                  </div>
               )}
              {status === 'ACTIVE' && (
                 <div className="text-xs md:text-sm font-medium text-slate-500 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]"></span> <span className="hidden xs:inline">SaaS Ativo</span>
                 </div>
              )}
           </div>

           {/* Global Search Component */}
           <div className="flex-1 max-w-xs md:max-w-sm lg:max-w-md mx-1 sm:mx-3">
              <GlobalSearch />
           </div>
           
           <div className="flex items-center gap-2 md:gap-4 shrink-0">
              <button 
                 onClick={() => setIsInstallModalOpen(true)} 
                 className="flex items-center gap-1.5 sm:gap-2 px-2.5 py-1.5 sm:px-3 sm:py-1.5 border border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 rounded-lg text-xs sm:text-sm font-medium transition-all shadow-[0_0_12px_rgba(16,185,129,0.15)] shrink-0"
                 title="Instalar App Android ou Gerar APK"
              >
                 <Smartphone className="w-4 h-4 text-emerald-400 shrink-0" />
                 <span className="hidden sm:inline">App Android</span>
                 <span className="sm:hidden font-bold">APK</span>
                 <span className="hidden md:inline-block text-[9px] bg-emerald-500/25 px-1.5 py-0.5 rounded text-emerald-300 font-bold uppercase tracking-wider">
                    APK
                 </span>
              </button>
              
              <button onClick={() => setIsAiModalOpen(true)} className="flex items-center gap-2 px-3 py-1.5 md:px-4 md:py-2 bg-gradient-to-r from-cyan-400 to-purple-500 text-black font-semibold rounded-lg shadow-[0_0_15px_rgba(34,211,238,0.3)] hover:scale-105 transition-all outline-none text-xs md:text-sm">
                 <Sparkles className="w-4 h-4 shrink-0" />
                 <span className="hidden sm:inline">Gerar ação com IA</span>
                 <span className="sm:hidden">Ação IA</span>
              </button>

              {/* DEV TOGGLE FOR PRESENTATION */}
              {user?.role === 'admin' && (
                 <div className="hidden lg:flex flex-col gap-1">
                    <select 
                      value={status} 
                      onChange={(e: any) => setStatus(e.target.value)}
                      className="bg-[#09111D] border border-blue-500/50 text-blue-400 rounded px-2 py-0.5 text-[10px] outline-none opacity-50 hover:opacity-100 transition-opacity"
                    >
                       <option value="ACTIVE">⚡ Dunning: Ativo</option>
                       <option value="WARNING">⚡ Dunning: Warning</option>
                       <option value="BLOCK_PARTIAL">⚡ Dunning: Lock Parc.</option>
                       <option value="BLOCK_TOTAL">⚡ Dunning: Lock Total</option>
                    </select>

                    <select
                      value={user?.planFeatures.length === 2 ? 'basico' : user?.planFeatures.length === 4 ? 'pro' : 'premium'}
                      onChange={(e) => {
                         const val = e.target.value;
                         const features = 
                            val === 'basico' ? ['pdv', 'agenda'] :
                            val === 'pro' ? ['pdv', 'agenda', 'whatsapp', 'relatorios'] :
                            ['pdv', 'agenda', 'whatsapp', 'relatorios', 'ia', 'automacoes', 'crm'];
                         useAuthStore.getState().setUser({ ...user, planFeatures: features });
                      }}
                      className="bg-[#09111D] border border-purple-500/50 text-purple-400 rounded px-2 py-0.5 text-[10px] outline-none opacity-50 hover:opacity-100 transition-opacity"
                    >
                       <option value="premium">👑 Plano: Premium (All)</option>
                       <option value="pro">👑 Plano: Pro</option>
                       <option value="basico">👑 Plano: Básico</option>
                    </select>

                    <select
                      value={user?.role || 'client'}
                      onChange={(e) => {
                         useAuthStore.getState().setUser({ ...user, role: e.target.value as 'admin' | 'client' });
                      }}
                      className="bg-[#09111D] border border-emerald-500/50 text-emerald-400 rounded px-2 py-0.5 text-[10px] outline-none opacity-50 hover:opacity-100 transition-opacity"
                    >
                       <option value="admin">👨‍💻 Role: Admin</option>
                       <option value="client">👤 Role: Cliente</option>
                    </select>
                 </div>
              )}

              {status !== 'ACTIVE' && status !== 'TRIAL' ? (
                <button className="text-xs md:text-sm font-bold bg-amber-500 hover:bg-amber-400 text-black px-3 py-1.5 rounded-lg transition-colors">
                  PAGAR
                </button>
              ) : (
                <Link to="/settings" className="text-xs md:text-sm font-semibold text-blue-400 hover:text-blue-300 transition-colors shrink-0">
                  Conta
                </Link>
              )}
           </div>
        </header>

        {/* Top Demo Banner if user is in demo mode */}
        {user?.isDemo && <DemoTopBanner />}

        {/* Scrollable Area */}
        <div className="flex-1 overflow-auto p-8 relative bg-[#010308]/50">
           {isCurrentRestricted ? (
              <div className="h-full flex flex-col items-center justify-center text-center">
                 <div className="w-24 h-24 bg-red-500/10 rounded-full flex items-center justify-center mb-6">
                    <Lock className="w-12 h-12 text-red-500" />
                 </div>
                 <h2 className="text-3xl font-display font-semibold text-white mb-2">Acesso Restrito</h2>
                 <p className="text-slate-400 max-w-md mx-auto mb-8">Esta área foi bloqueada devido ao atraso no pagamento da sua assinatura. Regularize para acessar os módulos de relatórios, marketing e financeiro novamente.</p>
                 <button className="px-6 py-3 bg-red-600 hover:bg-red-500 text-white font-bold uppercase tracking-widest text-sm rounded-xl shadow-[0_0_20px_rgba(239,68,68,0.4)]">
                    Regularizar Agora
                 </button>
              </div>
           ) : (
              children
           )}
        </div>


        {/* AUTOPILOT WIDGET */}
        {!isCurrentRestricted && (
           <div className="absolute bottom-[88px] md:bottom-6 right-6 z-50 flex items-center gap-4">
              <div className="bg-[#050B14]/90 backdrop-blur border border-purple-500/30 rounded-2xl p-4 shadow-[0_0_20px_rgba(168,85,247,0.15)] flex items-center gap-4 cursor-pointer hover:border-purple-500/60 transition-colors" onClick={() => setIsAiModalOpen(true)}>
                 <div className="flex flex-col">
                    <span className="text-[10px] uppercase font-bold tracking-widest text-purple-400">Modo Autopilot</span>
                    <span className="text-xs text-slate-300">Sistema operando sozinho</span>
                 </div>
                 <div className="w-12 h-6 bg-purple-500 rounded-full relative cursor-pointer flex items-center px-1 shadow-[0_0_10px_rgba(168,85,247,0.4)]">
                    <div className="w-4 h-4 bg-white rounded-full absolute right-1 shadow animate-pulse" />
                 </div>
              </div>
           </div>
        )}

        {/* AI ACTION MODAL */}
        <AnimatePresence>
          {isAiModalOpen && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
              onClick={() => setIsAiModalOpen(false)}
            >
               <motion.div 
                 initial={{ scale: 0.9, opacity: 0 }}
                 animate={{ scale: 1, opacity: 1 }}
                 exit={{ scale: 0.9, opacity: 0 }}
                 onClick={(e) => e.stopPropagation()}
                 className="bg-[#0F172A] border border-cyan-500/30 rounded-2xl w-full max-w-2xl shadow-[0_0_30px_rgba(34,211,238,0.15)] overflow-hidden flex flex-col relative"
               >
                  <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
                     <Bot className="w-32 h-32 text-cyan-500" />
                  </div>
                  <div className="p-6 border-b border-white/5 flex items-center justify-between rounded-t-2xl bg-[#09111D] relative z-10">
                    <h3 className="text-xl font-semibold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500 flex items-center gap-2">
                       <Sparkles className="w-5 h-5 text-cyan-400" /> IA Manager - Autopilot
                    </h3>
                    <button 
                      onClick={() => setIsAiModalOpen(false)}
                      className="text-slate-400 hover:text-white p-2 rounded-lg hover:bg-white/5 transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                  
                  <div className="p-6 space-y-6 relative z-10">
                     <p className="text-slate-300 text-sm">
                       O motor de IA analisou seu negócio em tempo real. Escolha uma das ações emergenciais sugeridas para executar agora:
                     </p>
                     
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-[#1E293B] border border-green-500/20 hover:border-green-500/50 cursor-pointer rounded-xl p-4 flex flex-col gap-2 transition-colors">
                           <div className="flex items-center gap-2 text-green-400 font-semibold text-sm">
                              <HeartPulse className="w-4 h-4" /> Resgate de Churn
                           </div>
                           <p className="text-slate-400 text-xs leading-relaxed mb-2">
                              Existem 12 clientes vips que não retornam há mais de 60 dias. Enviar cupom via WhatsApp com 1 clique.
                           </p>
                           <button onClick={(e) => { e.stopPropagation(); handleAction1(); }} className="mt-auto py-2 bg-green-500/10 hover:bg-green-500/20 text-green-400 font-semibold text-sm rounded-lg border border-green-500/30 transition-all text-center">
                              Disparar Campanha
                           </button>
                        </div>

                        <div className="bg-[#1E293B] border border-cyan-500/20 hover:border-cyan-500/50 cursor-pointer rounded-xl p-4 flex flex-col gap-2 transition-colors">
                           <div className="flex items-center gap-2 text-cyan-400 font-semibold text-sm">
                              <Calendar className="w-4 h-4" /> Otimizar Agenda
                           </div>
                           <p className="text-slate-400 text-xs leading-relaxed mb-2">
                              Amanhã temos 3 buracos na agenda de Sílvia. Antecipar clientes da lista de espera automaticamente.
                           </p>
                           <button onClick={(e) => { e.stopPropagation(); handleAction2(); }} className="mt-auto py-2 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 font-semibold text-sm rounded-lg border border-cyan-500/30 transition-all text-center">
                              Remanejar Clientes
                           </button>
                        </div>
                     </div>
                  </div>
               </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ANDROID APK & PWA INSTALL MODAL */}
        <AndroidApkModal
          isOpen={isInstallModalOpen}
          onClose={() => setIsInstallModalOpen(false)}
          deferredPrompt={deferredPrompt}
        />

        {/* Floating Lead Capture CTA for Demo Mode */}
        {user?.isDemo && (
          <div className="fixed bottom-20 md:bottom-6 right-4 sm:right-6 z-40 animate-bounce">
            <button
              onClick={() => openDemoModal('Botão Flutuante Demo')}
              className="px-4 py-2.5 rounded-full bg-gradient-to-r from-cyan-400 via-[#087CFF] to-[#8545FF] text-slate-950 font-extrabold text-xs shadow-[0_0_25px_rgba(0,217,255,0.4)] flex items-center gap-2 hover:scale-105 active:scale-95 transition-all cursor-pointer border border-cyan-300/40"
            >
              <Flame className="w-4 h-4 fill-slate-950 text-slate-950" />
              <span>15 Dias Free • Promo R$ 29,90</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Demo Lead Capture & Conversion Modal */}
        <DemoLeadCaptureModal />
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 h-[64px] bg-[#0F172A] border-t border-white/5 z-50 flex items-center justify-around px-2" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
        {[
          { icon: LayoutDashboard, label: 'Início', path: '/' },
          { icon: Clock, label: 'Fila', path: '/queue' },
          { icon: Users, label: 'Clientes', path: '/clients' },
          { icon: Settings, label: 'Ajustes', path: '/settings' }
        ].map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              cn(
                "flex flex-col items-center justify-center w-full h-full gap-1 text-[10px] uppercase tracking-wider font-semibold transition-colors rounded-lg",
                isActive ? "text-cyan-400" : "text-slate-500 hover:text-slate-300"
              )
            }
          >
            <item.icon className="w-5 h-5" />
            <span className="mt-0.5">{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
