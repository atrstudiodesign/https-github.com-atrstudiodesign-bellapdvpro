import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { useAuthStore } from '../store/auth';
import { useNicheStore, NicheType, NICHE_CONFIGS } from '../store/niche';
import { Scissors, HeartPulse, Sparkles, Activity, Calendar, Users, ShoppingCart, BarChart3, Loader2 } from 'lucide-react';
import { Logo } from '../components/ui/Logo';
import { AtrStudioBadge } from '../components/ui/AtrStudioBadge';
import { auth } from '../lib/firebase';
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';

export default function Login() {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [selectedNiche, setSelectedNiche] = useState<NicheType>('barbershop');
  const [isLoading, setIsLoading] = useState(true);

  const { login } = useAuthStore();
  const { setNiche } = useNicheStore();
  const navigate = useNavigate();

  useEffect(() => {
    // 🔥 WHITE-LABEL (POR EMPRESA / DOMÍNIO) SIMULATION
    const simulateCompanyFetch = async () => {
       const domain = window.location.host;
       // Mock fetch company by domain with delay
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
  }, []);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const endpoint = isRegister ? '/api/auth/register' : '/api/auth/login';
      const body = isRegister 
        ? { email, password, name: companyName, niche: selectedNiche }
        : { email, password };

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      
      const data = await res.json();
      
      if (data.token) {
        if (isRegister) {
           setNiche(selectedNiche);
        } else if (data.company?.niche) {
           setNiche(data.company.niche as NicheType);
        }
        login(data.user, data.token, data.company);
        navigate('/');
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleSocialAuth = async (provider: string) => {
    if (provider === 'Google') {
      try {
        const provider = new GoogleAuthProvider();
        const result = await signInWithPopup(auth, provider);
        const user = result.user;
        
        // Setup mock user for Zustand using Firebase output
        const mockUser = {
          id: user.uid,
          name: user.displayName || 'Google User',
          email: user.email || '',
          role: 'owner',
          avatar: user.photoURL || undefined
        };
        
        login(mockUser as any, await user.getIdToken(), {
          id: '1',
          name: 'Empresa via Google',
          niche: isRegister ? selectedNiche : undefined
        });
        navigate('/');
        return;
      } catch (error) {
        console.error("Firebase Google Login Error:", error);
      }
    }

    try {
      const endpoint = isRegister ? '/api/auth/register' : '/api/auth/login';
      const body = isRegister 
        ? { email: `${provider.toLowerCase()}@example.com`, password: 'social-login', name: companyName || `${provider} User`, niche: selectedNiche }
        : { email: `${provider.toLowerCase()}@example.com`, password: 'social-login' };

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      
      const data = await res.json();
      
      if (data.token) {
        if (isRegister) {
           setNiche(selectedNiche);
        } else if (data.company?.niche) {
           setNiche(data.company.niche as NicheType);
        }
        login(data.user, data.token, data.company);
        navigate('/');
      }
    } catch (error) {
      console.error(`Error with ${provider} login:`, error);
    }
  };

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

  const nicheOptions = [
    { id: 'barbershop', label: 'Barbearia', icon: Scissors },
    { id: 'clinic', label: 'Clínica', icon: HeartPulse },
    { id: 'salon', label: 'Salão de Beleza', icon: Sparkles },
    { id: 'spa', label: 'Spa / Casa de Massagem', icon: Activity },
  ] as const;

  return (
    <div className="min-h-screen flex bg-[#0A0A0A] items-center justify-center relative font-sans text-slate-300">
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="w-full max-w-[400px] px-6"
      >
        <div className="flex flex-col items-center mb-8">
          <Logo size="lg" className="mb-6 justify-center" />
          <h1 className="text-white text-2xl font-medium tracking-tight">
            {isRegister ? 'Criar sua conta' : 'Acesse o BellaPDV'}
          </h1>
          <p className="text-slate-500 text-sm mt-2">
            {isRegister ? 'Insira seus dados para começar.' : 'Bem-vindo de volta, faça login para continuar.'}
          </p>
        </div>

        <div className="bg-[#121212] border border-[#27272A] rounded-2xl p-6 md:p-8 shadow-2xl">
          <div className="flex flex-col gap-3 mb-6">
            <button type="button" onClick={() => handleSocialAuth('Google')} className="flex justify-center items-center gap-2 w-full py-2.5 bg-white border border-transparent text-black hover:bg-gray-100 transition-colors rounded-xl font-medium text-sm">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Continuar com Google
            </button>
            <button type="button" onClick={() => handleSocialAuth('Apple')} className="flex justify-center items-center gap-2 w-full py-2.5 bg-[#18181B] border border-[#27272A] text-white hover:bg-[#27272A] transition-colors rounded-xl font-medium text-sm">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                 <path d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.126 3.822 3.08 1.567-.052 2.164-.96 4.098-.96 1.905 0 2.45.96 4.128.932 1.696-.027 2.716-1.503 3.73-2.955 1.168-1.745 1.646-3.435 1.674-3.523-.037-.015-3.3-1.265-3.324-5.021-.023-3.136 2.58-4.636 2.695-4.708-1.468-2.146-3.743-2.435-4.551-2.47-1.895-.213-3.774 1.077-4.83 1.077m-.62 13.916Z" fill="#FFF"/>
                 <path d="M14.954 4.542c.846-1.026 1.417-2.457 1.263-3.882-1.228.05-2.732.817-3.598 1.843-.77.893-1.442 2.36-.168 3.743 1.36.035 2.766-.676 3.503-1.704Z" fill="#FFF"/>
              </svg>
              Continuar com Apple
            </button>
            <button type="button" onClick={() => handleSocialAuth('Microsoft')} className="flex justify-center items-center gap-2 w-full py-2.5 bg-[#18181B] border border-[#27272A] text-white hover:bg-[#27272A] transition-colors rounded-xl font-medium text-sm">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M11.4 24H0V12.6h11.4V24zM24 24H12.6V12.6H24V24zM11.4 11.4H0V0h11.4v11.4zM24 11.4H12.6V0H24v11.4z" fill="#00a4ef"/>
              </svg>
              Continuar com Microsoft
            </button>
          </div>

          <div className="relative flex items-center py-2 mb-6">
            <div className="flex-grow border-t border-[#27272A]"></div>
            <span className="flex-shrink-0 mx-4 text-slate-500 text-xs">ou continue com e-mail</span>
            <div className="flex-grow border-t border-[#27272A]"></div>
          </div>

          <form onSubmit={handleAuth} className="space-y-4">
            {isRegister && (
              <>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5 ml-1">Nome da Empresa</label>
                  <input 
                    type="text" 
                    required
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className="w-full bg-[#0A0A0A] border border-[#27272A] rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-white focus:ring-1 focus:ring-white transition-all text-sm"
                    placeholder="Barbearia do João"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5 ml-1">Tipo de Negócio</label>
                  <div className="grid grid-cols-2 gap-2 mt-1">
                    {nicheOptions.map((opt) => {
                      const isSelected = selectedNiche === opt.id;
                      const Icon = opt.icon;
                      return (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => setSelectedNiche(opt.id as NicheType)}
                          className={`flex flex-col items-center justify-center gap-1.5 p-3 border rounded-xl transition-all duration-200 ${
                            isSelected 
                              ? 'bg-transparent border-white text-white'
                              : 'bg-transparent border-[#27272A] text-slate-500 hover:border-slate-600 hover:text-slate-300'
                          }`}
                        >
                          <Icon className="w-4 h-4 mb-1" />
                          <span className="text-[10px] font-semibold text-center">{opt.label}</span>
                        </button>
                      )
                    })}
                  </div>
                </div>
              </>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5 ml-1">E-mail</label>
              <input 
                type="email" 
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-[#0A0A0A] border border-[#27272A] rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-white focus:ring-1 focus:ring-white transition-all text-sm"
                placeholder="nome@empresa.com"
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-1.5 mx-1">
                <label className="block text-xs font-semibold text-slate-400">Senha</label>
                {!isRegister && (
                  <button type="button" className="text-xs text-blue-400 hover:text-blue-300 transition-colors font-medium">Esqueceu a senha?</button>
                )}
              </div>
              <input 
                type="password" 
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-[#0A0A0A] border border-[#27272A] rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-white focus:ring-1 focus:ring-white transition-all text-sm"
                placeholder="••••••••"
              />
            </div>

            <button 
              type="submit"
              className="w-full py-2.5 mt-2 bg-white text-black hover:bg-gray-100 rounded-xl font-semibold transition-all duration-200 text-sm"
            >
              {isRegister ? 'Criar Conta' : 'Entrar'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-500">
            {isRegister ? 'Já tem uma conta?' : 'Não tem uma conta?'}
            <button 
              onClick={() => setIsRegister(!isRegister)}
              className="text-white hover:underline transition-colors font-medium ml-1.5"
            >
              {isRegister ? 'Fazer login' : 'Criar uma'}
            </button>
          </p>
          
          <div className="mt-8 pt-6 border-t border-[#27272A] text-center flex flex-col items-center">
             <AtrStudioBadge size="sm" />
          </div>
        </div>
      </motion.div>
    </div>
  );
}
