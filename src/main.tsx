import { AnalyticsConsent } from './components/AnalyticsConsent';
import { StrictMode, ReactNode, Suspense, lazy, useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { SpeedInsights } from '@vercel/speed-insights/react';
import { Analytics } from '@vercel/analytics/react';
import { useAuthStore } from './store/auth';
import { LicenseRouteGuard } from './components/LicenseRouteGuard';
import { ErrorBoundary } from './components/ErrorBoundary';
import './index.css';
import { StartupScreen } from './components/StartupScreen';
import { Loader2 } from 'lucide-react';
import { getAuth, signInAnonymously } from 'firebase/auth';

const App = lazy(() => import('./App.tsx'));
const Landing = lazy(() => import('./pages/Landing.tsx'));
const Login = lazy(() => import('./pages/Login.tsx'));
const Legal = lazy(() => import('./pages/Legal.tsx'));
const HelpCenter = lazy(() => import('./pages/HelpCenter.tsx'));
const DemoShowcase = lazy(() => import('./pages/DemoShowcase.tsx'));
const Dashboard = lazy(() => import('./pages/Dashboard.tsx'));
const Professionals = lazy(() => import('./pages/Professionals.tsx'));
const Services = lazy(() => import('./pages/Services.tsx'));
const POS = lazy(() => import('./pages/POS.tsx'));
const Schedule = lazy(() => import('./pages/Schedule.tsx'));
const Settings = lazy(() => import('./pages/Settings.tsx'));
const Clients = lazy(() => import('./pages/Clients.tsx'));
const AdminPanel = lazy(() => import('./pages/Admin.tsx'));
const Finance = lazy(() => import('./pages/Finance.tsx'));
const Reports = lazy(() => import('./pages/Reports.tsx'));
const Loyalty = lazy(() => import('./pages/Loyalty.tsx'));
const Marketing = lazy(() => import('./pages/Marketing.tsx'));
const Queue = lazy(() => import('./pages/Queue.tsx'));
const Anamnesis = lazy(() => import('./pages/Anamnesis.tsx'));
const Packages = lazy(() => import('./pages/Packages.tsx'));
const Automations = lazy(() => import('./pages/Automations.tsx'));
const Integrations = lazy(() => import('./pages/Integrations.tsx'));
const CRM = lazy(() => import('./pages/CRM.tsx'));
const Totem = lazy(() => import('./pages/Totem.tsx'));
const Online = lazy(() => import('./pages/Online.tsx'));
const Marketplace = lazy(() => import('./pages/Marketplace.tsx'));
const Licensing = lazy(() => import('./pages/Licensing.tsx'));
const EmployeePortal = lazy(() => import('./pages/EmployeePortal.tsx'));

function PlatformAdminRoute({ children }: { children: ReactNode }) {
  const { user, isAuthReady } = useAuthStore();
  if (!isAuthReady) return <StartupScreen message="Validando permissão administrativa…" />;
  if (user?.isDemo || user?.isPlatformAdmin !== true) return <Navigate to="/" replace />;
  return <>{children}</>;
}

function ProtectedRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated, isAuthReady, authError, retryAuth } = useAuthStore();
  
  if (!isAuthReady) {
    return (
      <StartupScreen message="Validando sua sessão…" />
    );
  }

  if (authError) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#05070F] gap-4 px-5 text-center">
        <p className="text-slate-200 text-sm">{authError}</p>
        <button className="rounded-lg bg-cyan-600 px-5 py-2 text-white" onClick={() => void retryAuth()}>
          Tentar novamente
        </button>
      </div>
    );
  }

  if (!isAuthenticated) return <Navigate to="/landing" replace />;
  return <>{children}</>;
}

function PublicRouteWrapper({ children }: { children: ReactNode }) {
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    const authInstance = getAuth();
    const unsubscribe = authInstance.onAuthStateChanged((user) => {
      if (!user) {
        signInAnonymously(authInstance)
          .catch((err) => {
            console.error("Anonymous authentication failed:", err);
          })
          .finally(() => {
            setInitializing(false);
          });
      } else {
        setInitializing(false);
      }
    });

    return () => unsubscribe();
  }, []);

  if (initializing) {
    return (
      <StartupScreen message="Preparando conexão segura…" />
    );
  }

  return <>{children}</>;
}

const SuspenseLoader = () => (
  <div className="flex-1 flex items-center justify-center min-h-[500px]">
    <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
  </div>
);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <BrowserRouter>
        <AnalyticsConsent />
        <Suspense fallback={<StartupScreen />}>
          <Routes>
            <Route path="/landing" element={<Landing />} />
          <Route path="/demo" element={<DemoShowcase />} />
            <Route path="/legal/:page" element={<Legal />} />
            <Route path="/ajuda" element={<HelpCenter />} />
            <Route path="/ajuda/:topic" element={<HelpCenter />} />
            <Route path="/como-usar" element={<Navigate to="/ajuda/como-usar" replace />} />
            <Route path="/instalar/android" element={<Navigate to="/ajuda/instalar-android" replace />} />
            <Route path="/instalar/windows" element={<Navigate to="/ajuda/instalar-windows" replace />} />
            <Route path="/login" element={<Login />} />
            <Route path="/funcionario" element={<Suspense fallback={<StartupScreen />}><EmployeePortal /></Suspense>} />
            <Route path="/portal-funcionario" element={<Navigate to="/funcionario" replace />} />
            <Route path="/totem-view" element={<PublicRouteWrapper><Suspense fallback={<StartupScreen />}><Totem publicMode={true} /></Suspense></PublicRouteWrapper>} />
            <Route path="/menu-view" element={<PublicRouteWrapper><Suspense fallback={<StartupScreen />}><Online publicMode={true} /></Suspense></PublicRouteWrapper>} />
            <Route 
              path="/admin" 
              element={
                 <ProtectedRoute>
                    <PlatformAdminRoute><AdminPanel /></PlatformAdminRoute>
                 </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin/licensing" 
              element={
                 <ProtectedRoute>
                    <PlatformAdminRoute><Suspense fallback={<SuspenseLoader />}><Licensing /></Suspense></PlatformAdminRoute>
                 </ProtectedRoute>
              } 
            />
            <Route 
              path="/" 
              element={
                 <ProtectedRoute>
                    <App />
                 </ProtectedRoute>
              } 
            >
              <Route index element={<Suspense fallback={<SuspenseLoader />}><Dashboard /></Suspense>} />
              <Route path="pos" element={<Suspense fallback={<SuspenseLoader />}><POS /></Suspense>} />
              <Route path="schedule" element={<Suspense fallback={<SuspenseLoader />}><Schedule /></Suspense>} />
              <Route path="clients" element={<Suspense fallback={<SuspenseLoader />}><Clients /></Suspense>} />
              <Route path="settings" element={<Suspense fallback={<SuspenseLoader />}><Settings /></Suspense>} />
              <Route path="professionals" element={<Suspense fallback={<SuspenseLoader />}><Professionals /></Suspense>} />
              <Route path="services" element={<Suspense fallback={<SuspenseLoader />}><Services /></Suspense>} />
              <Route path="finance" element={<Suspense fallback={<SuspenseLoader />}><Finance /></Suspense>} />
              <Route path="reports" element={<Suspense fallback={<SuspenseLoader />}><Reports /></Suspense>} />
              <Route path="loyalty" element={<Suspense fallback={<SuspenseLoader />}><Loyalty /></Suspense>} />
              <Route path="marketing" element={<Suspense fallback={<SuspenseLoader />}><Marketing /></Suspense>} />
              <Route path="crm" element={<LicenseRouteGuard featureKey="crm" inlineBlocked errorMessage="O CRM/Funil não está habilitado na licença desta empresa. Solicite a liberação do módulo ao administrador."><Suspense fallback={<SuspenseLoader />}><CRM /></Suspense></LicenseRouteGuard>} />
              <Route path="automations" element={<LicenseRouteGuard featureKey="aiAssistant" errorMessage="O módulo de Automações requer o assistente Bella IA."><Suspense fallback={<SuspenseLoader />}><Automations /></Suspense></LicenseRouteGuard>} />
              <Route path="integrations" element={<LicenseRouteGuard featureKey="whatsapp" errorMessage="O módulo de Integrações requer o addon do WhatsApp Premium."><Suspense fallback={<SuspenseLoader />}><Integrations /></Suspense></LicenseRouteGuard>} />
              <Route path="queue" element={<Suspense fallback={<SuspenseLoader />}><Queue /></Suspense>} />
              <Route path="anamnesis" element={<Suspense fallback={<SuspenseLoader />}><Anamnesis /></Suspense>} />
              <Route path="packages" element={<Suspense fallback={<SuspenseLoader />}><Packages /></Suspense>} />
              <Route path="totem" element={<Suspense fallback={<SuspenseLoader />}><Totem /></Suspense>} />
              <Route path="online" element={<Suspense fallback={<SuspenseLoader />}><Online /></Suspense>} />
              <Route path="marketplace" element={<LicenseRouteGuard featureKey="marketplace" errorMessage="O Marketplace Centralizado é exclusivo para parceiros do plano Ouro."><Suspense fallback={<SuspenseLoader />}><Marketplace /></Suspense></LicenseRouteGuard>} />
            </Route>
          </Routes>
        </Suspense>
      </BrowserRouter>
      <SpeedInsights />
      <Analytics />
    </ErrorBoundary>
  </StrictMode>
)
