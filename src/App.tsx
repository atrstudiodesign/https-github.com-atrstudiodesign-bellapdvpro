import { Outlet } from 'react-router-dom';
import { DashboardLayout } from './components/layout/DashboardLayout';
import { useEffect, useState } from 'react';
import { Loader2, Wifi, WifiOff } from 'lucide-react';
import { Toaster, toast } from 'sonner';
import { doc, getDocFromServer } from 'firebase/firestore';
import { db } from './lib/firebase';
import { BellaAiWidget } from './components/BellaAiWidget';
import { useAuthStore } from './store/auth';
import { useSubscriptionStore, SubscriptionStatus } from './store/subscription';
import { subscribeToCompanyLicense, subscribeToFeatureFlags } from './services/billing';

export default function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  
  const { user } = useAuthStore();
  const { setStatus } = useSubscriptionStore();

  useEffect(() => {
    if (!user?.id) return;

    let previousStatus: string | null = null;
    let previousFlagsKeys: string | null = null;

    // 🔄 Real-time subscription to company license status
    const unsubLicense = subscribeToCompanyLicense(user.id, (license) => {
      if (!license) return;

      console.log('Real-time License Update:', license);
      
      let subStatus: SubscriptionStatus = 'ACTIVE';
      if (license.status === 'expired') {
        subStatus = 'BLOCK_TOTAL';
      } else if (license.status === 'trial') {
        subStatus = 'TRIAL';
      }

      setStatus(subStatus);

      // Trigger user-friendly notifications when the license state changes
      if (previousStatus && previousStatus !== license.status) {
        if (license.status === 'expired') {
          toast.error('Assinatura Expirada', {
            description: 'Sua licença expirou. Algumas funcionalidades foram bloqueadas.',
            duration: 6000
          });
        } else if (license.status === 'active') {
          toast.success('Assinatura Regularizada', {
            description: 'Sua licença está ativa e regularizada com sucesso!',
            duration: 5000
          });
        } else if (license.status === 'trial') {
          toast.info('Modo de Demonstração', {
            description: `Você está na licença Trial/Demonstração expira em ${license.expireDate}.`,
            duration: 5000
          });
        }
      }
      previousStatus = license.status;
    });

    // 🔄 Real-time subscription to feature flags / active modules
    const unsubFlags = subscribeToFeatureFlags(user.id, (flags) => {
      if (!flags) return;

      console.log('Real-time Feature Flags Update:', flags);

      // Get list of active modules
      const activeModules = Object.entries(flags)
        .filter(([key, val]) => val === true && key !== 'companyId')
        .map(([key]) => key);

      const flagsKeysStr = activeModules.sort().join(',');

      // Trigger user-friendly notification on live module configuration update
      if (previousFlagsKeys !== null && previousFlagsKeys !== flagsKeysStr) {
        toast.info('Módulos Atualizados', {
          description: `Os módulos e permissões ativos da sua empresa foram atualizados pelo administrador em tempo real.`,
          duration: 5000
        });
      }
      previousFlagsKeys = flagsKeysStr;
    });

    return () => {
      unsubLicense();
      unsubFlags();
    };
  }, [user?.id, setStatus]);

  useEffect(() => {
    // 🌍 Monitor de Rede (Online/Offline Real)
    const handleOnline = () => {
      setIsOnline(true);
      toast.success('Conexão Restabelecida', { description: 'Sincronizando fila offline com o servidor...' });
    };
    
    // Test Firebase connection
    const testConnection = async () => {
      try {
        await getDocFromServer(doc(db, 'test', 'connection'));
        console.log("Firebase connected successfully");
      } catch (error) {
        if(error instanceof Error && error.message.includes('the client is offline')) {
          console.error("Please check your Firebase configuration.");
        }
      }
    };
    testConnection();
    
    const handleOffline = () => {
      setIsOnline(false);
      toast.error('Sem Conexão', { description: 'Modo Offline Ativado. Os dados estão sendo salvos localmente.' });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // 🔥 WHITE-LABEL (POR EMPRESA / DOMÍNIO) SIMULATION
    const simulateCompanyFetch = async () => {
       const domain = window.location.host;
       await new Promise(resolve => setTimeout(resolve, 800));

       const company = {
         id: "bella-studio",
         name: "Bella Studio",
         primaryColor: "#3b82f6",
         secondaryColor: "#0ea5e9",
         domain: domain
       };
       
       document.documentElement.style.setProperty("--primary", company.primaryColor);
       document.documentElement.style.setProperty("--secondary", company.secondaryColor);
       setIsLoading(false);
    };
    
    simulateCompanyFetch();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#05070F]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
          <p className="text-slate-400 font-medium text-sm animate-pulse">Carregando ambiente...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Toaster theme="dark" position="top-right" />
      
      {!isOnline && (
        <div className="fixed bottom-[80px] md:bottom-4 left-1/2 -translate-x-1/2 z-50 bg-red-500/90 text-white px-4 py-2 rounded-full shadow-lg border border-red-400 flex items-center gap-2 text-sm font-semibold backdrop-blur-sm">
          <WifiOff className="w-4 h-4" />
          Modo Offline (Salvando Localmente)
        </div>
      )}
      {isOnline && window.bella?.isDesktopApp && (
        <div className="fixed bottom-[80px] md:bottom-4 left-4 z-50 bg-indigo-500/20 text-indigo-300 px-3 py-1.5 rounded-full border border-indigo-500/30 flex items-center gap-2 text-xs font-semibold backdrop-blur-sm">
          <Wifi className="w-3.5 h-3.5" />
          App Desktop Conectado
        </div>
      )}

      <DashboardLayout>
        <Outlet />
      </DashboardLayout>

      <BellaAiWidget />
    </>
  );
}
