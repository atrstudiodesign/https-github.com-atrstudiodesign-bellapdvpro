import React, { useState, useEffect, useRef } from 'react';
import { logBellaEvent } from '../services/analytics';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'motion/react';
import { useAuthStore } from '../store/auth';
import { useNicheStore, NicheType } from '../store/niche';
import { 
  Scissors, 
  HeartPulse, 
  Sparkles, 
  Activity, 
  Loader2, 
  Zap, 
  Lock, 
  Mail, 
  Building2, 
  CheckCircle2,
  ArrowRight
} from 'lucide-react';
import { Logo } from '../components/ui/Logo';
import { AtrStudioBadge } from '../components/ui/AtrStudioBadge';
import { auth, db } from '../lib/firebase';
import { hasPlatformAdminClaim, isSuperAdminEmail } from '../lib/superAdmins';
import { trackTrialStartClick, trackLeadGenerated, trackEvent, setAnalyticsUser, trackLeadCaptureAttempt } from '../services/analyticsService';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut,
  updateProfile,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  sendPasswordResetEmail,
  type ConfirmationResult
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { toast } from 'sonner';

export default function Login() {
  const [searchParams] = useSearchParams();
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [selectedNiche, setSelectedNiche] = useState<NicheType>('barbershop');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isDemoLoading = false;
  const [loginError, setLoginError] = useState('');
  const trialFormRef = useRef({ active: false, dirty: false, complete: false });
  trialFormRef.current = { ...trialFormRef.current, active: isRegister, dirty: !!(email || companyName || password) };
  useEffect(() => () => { const f = trialFormRef.current; if (f.active && f.dirty && !f.complete) void logBellaEvent('form_abandoned', { source: 'signup_form' }); }, []);
  const [phoneMode, setPhoneMode] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [phoneCode, setPhoneCode] = useState('');
  const [phoneConfirmation, setPhoneConfirmation] = useState<ConfirmationResult | null>(null);

  const { retryAuth, isAuthenticated } = useAuthStore();
  const { setNiche } = useNicheStore();
  const navigate = useNavigate();

  const [lastFieldFocused, setLastFieldFocused] = useState<string>('none');
  const [hasTrackedSignupStart, setHasTrackedSignupStart] = useState<boolean>(false);
  const isRegisteredSuccessRef = React.useRef(false);

  const getFieldsCompleted = () => {
    const fields: string[] = [];
    if (companyName.trim()) fields.push('company_name');
    if (selectedNiche) fields.push('niche');
    if (email.trim()) fields.push('email');
    if (password.trim()) fields.push('password');
    return fields;
  };

  useEffect(() => {
    // Prefill the registration from the read-only demo CTA.
    if (searchParams.get('signup') === 'true') {
      setIsRegister(true);
      setEmail(searchParams.get('email') || '');
      setCompanyName(searchParams.get('company') || '');
    }

    // If demo param is present, activate demo mode immediately
    if (searchParams.get('demo') === 'true') {
      navigate('/demo', { replace: true });
      return;
    }

    // If already authenticated, redirect to app
    if (isAuthenticated) {
      navigate('/', { replace: true });
      return;
    }

    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchParams, isAuthenticated, navigate]);

  // Track initial signup attempt when registration form is first opened
  useEffect(() => {
    if (isRegister && !hasTrackedSignupStart) {
      setHasTrackedSignupStart(true);
      trackLeadCaptureAttempt({
        form_name: 'signup_form',
        step: 'start',
        status: 'started',
        source: searchParams.get('source') || 'signup_page',
        plan_name: searchParams.get('plan') || 'Plano Básico',
        has_company: !!companyName.trim(),
        has_email: !!email.trim()
      });
    }
  }, [isRegister, hasTrackedSignupStart, searchParams, companyName, email]);

  // Track abandonment on page exit (beforeunload or navigating away)
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (isRegister && !isRegisteredSuccessRef.current && (companyName.trim() || email.trim())) {
        trackLeadCaptureAttempt({
          form_name: 'signup_form',
          step: 'abandoned',
          status: 'abandoned',
          last_field_focused: lastFieldFocused,
          fields_completed: getFieldsCompleted(),
          fields_count: getFieldsCompleted().length,
          has_company: !!companyName.trim(),
          has_email: !!email.trim(),
          selected_niche: selectedNiche,
          plan_name: searchParams.get('plan') || 'Plano Básico',
          source: searchParams.get('source') || 'signup_page'
        });
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [isRegister, companyName, email, lastFieldFocused, selectedNiche, searchParams]);

  const handleQuickDemoLogin = () => {
    trackLeadGenerated({
      leadType: 'instant_demo',
      source: 'login_quick_demo_button'
    });
    // Demo is a static, public, read-only showcase; no anonymous Firebase login.
    navigate('/demo');
  };

  const fillTestCredentials = () => {
    setEmail('demo@bellapdv.com');
    setPassword('demo123456');
    toast.info('Credenciais de demonstração preenchidas!', {
      description: 'E-mail: demo@bellapdv.com | Senha: ••••••. Clique em "Entrar no Sistema" ou no botão de Demonstração Instantânea.',
      duration: 4000
    });
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();

    if (email.trim().toLowerCase() === 'demo@bellapdv.com') {
      handleQuickDemoLogin();
      return;
    }

    if (!email || !password) {
      if (isRegister) {
        trackLeadCaptureAttempt({
          form_name: 'signup_form',
          step: 'validation_failed',
          status: 'error',
          error_reason: 'missing_email_or_password',
          last_field_focused: !email ? 'email' : 'password',
          fields_completed: getFieldsCompleted(),
          fields_count: getFieldsCompleted().length,
          has_company: !!companyName.trim(),
          has_email: !!email.trim(),
          selected_niche: selectedNiche,
          plan_name: searchParams.get('plan') || 'Plano Básico'
        });
      }
      toast.error('Preencha o e-mail e a senha.');
      return;
    }

    if (password.length < 6) {
      if (isRegister) {
        trackLeadCaptureAttempt({
          form_name: 'signup_form',
          step: 'validation_failed',
          status: 'error',
          error_reason: 'password_too_short',
          last_field_focused: 'password',
          fields_completed: getFieldsCompleted(),
          fields_count: getFieldsCompleted().length,
          has_company: !!companyName.trim(),
          has_email: !!email.trim(),
          selected_niche: selectedNiche,
          plan_name: searchParams.get('plan') || 'Plano Básico'
        });
      }
      toast.error('A senha deve ter no mínimo 6 caracteres.');
      return;
    }

    if (isRegister && !companyName.trim()) {
      trackLeadCaptureAttempt({
        form_name: 'signup_form',
        step: 'validation_failed',
        status: 'error',
        error_reason: 'missing_company',
        last_field_focused: 'company_name',
        fields_completed: getFieldsCompleted(),
        fields_count: getFieldsCompleted().length,
        has_company: false,
        has_email: !!email.trim(),
        selected_niche: selectedNiche,
        plan_name: searchParams.get('plan') || 'Plano Básico'
      });
      toast.error('Informe o nome da sua empresa.');
      return;
    }

    if (isRegister) {
      trackLeadCaptureAttempt({
        form_name: 'signup_form',
        step: 'submit_attempt',
        status: 'in_progress',
        last_field_focused: lastFieldFocused,
        fields_completed: getFieldsCompleted(),
        fields_count: getFieldsCompleted().length,
        has_company: !!companyName.trim(),
        has_email: !!email.trim(),
        selected_niche: selectedNiche,
        plan_name: searchParams.get('plan') || 'Plano Básico'
      });
    }

    setLoginError('');
    setIsSubmitting(true);
    try {
      let firebaseUser = auth.currentUser;
      let uid = firebaseUser?.uid || '';

      if (isRegister) {
        void logBellaEvent('signup_started', { source: 'signup_form' });
        // --- REGISTRO ---
        const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
        firebaseUser = cred.user;
        uid = cred.user.uid;
        await updateProfile(cred.user, { displayName: companyName.trim() });

        // Backend register sync
        const companyData = {
          id: uid,
          name: companyName.trim(),
          niche: selectedNiche
        };

        // Persistent company provisioning must be handled by a verified backend.
        const newUser = {
          id: uid,
          email: email.trim(),
          name: companyName.trim() || email.trim().split('@')[0],
          role: 'client' as const,
          planFeatures: ['pdv', 'agenda']
        };

        const expire15Days = new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        try {
          await setDoc(doc(db, 'users', uid), {
            ...newUser,
            companyName: companyName.trim(),
            niche: selectedNiche,
            companyId: uid,
            plan: 'Bronze',
            status: 'Trial',
            trialDays: 15,
            expire: expire15Days,
            createdAt: new Date().toISOString(),
            lastLogin: new Date().toISOString()
          }, { merge: true });

          // Initialize company_licenses with 15-day trial on Plano Básico (Bronze)
          await setDoc(doc(db, 'company_licenses', uid), {
            id: uid,
            name: companyName.trim() || email.trim().split('@')[0],
            plan: 'Bronze',
            status: 'trial',
            trialDays: 15,
            expireDate: expire15Days,
            maxUsers: 1,
            aiUsage: 0,
            waUsage: 0,
            unitsCount: 1,
            activeModules: ['pdv', 'agenda', 'crm']
          }, { merge: true });
        } catch (docErr) {
          console.error('Firestore profile creation failed:', docErr);
          await signOut(auth);
          useAuthStore.getState().setUser(null);
          toast.error('Conta autenticada, mas não foi possível salvar o cadastro. Tente novamente após configurar o banco de dados.');
          return;
        }

        setNiche(selectedNiche);
        trialFormRef.current.complete = true;
        void logBellaEvent('trial_started', { source: 'signup_form', trial_days: 15 });
        await retryAuth();
        if (!useAuthStore.getState().isAuthenticated) throw new Error('Falha ao validar sessão e empresa no Firebase.');

        // Track successful signup lead capture completion
        isRegisteredSuccessRef.current = true;
        trackLeadCaptureAttempt({
          form_name: 'signup_form',
          step: 'completed',
          status: 'completed',
          last_field_focused: lastFieldFocused,
          fields_completed: getFieldsCompleted(),
          fields_count: getFieldsCompleted().length,
          has_company: !!companyName.trim(),
          has_email: !!email.trim(),
          selected_niche: selectedNiche,
          plan_name: searchParams.get('plan') || 'Plano Básico'
        });

        // Conversion event tracking
        trackEvent('sign_up', {
          method: 'email',
          trial_days: 15,
          plan: 'Plano Básico',
          promo_applied: 'De R$ 89,90 por R$ 29,90'
        });
        trackLeadGenerated({
          leadType: 'trial_signup',
          source: 'login_registration_form',
          plan: 'Plano Básico',
          hasBusinessName: !!companyName.trim()
        });
        setAnalyticsUser(uid, {
          company: companyName.trim(),
          plan: 'Bronze',
          status: 'Trial'
        });

        toast.success('Conta criada com sucesso!', {
          description: `Bem-vindo ao BellaPDV, ${companyName.trim()}!`
        });
        navigate('/');

      } else {
        // --- LOGIN ---
        const cred = await signInWithEmailAndPassword(auth, email.trim(), password);
        firebaseUser = cred.user;
        uid = cred.user.uid;

        let profile: Record<string, any> = {};
        try {
          const snapshot = await getDoc(doc(db, 'users', uid));
          if (snapshot.exists()) profile = snapshot.data();
        } catch (profileError) {
          console.warn('Firestore profile read error:', profileError);
        }
        const tenantId = typeof profile.companyId === 'string' && profile.companyId ? profile.companyId : uid;
        const companyData = {
          id: tenantId,
          name: typeof profile.companyName === 'string' ? profile.companyName : 'BellaPDV Studio',
          niche: typeof profile.niche === 'string' ? profile.niche : 'barbershop'
        };

        const loggedUser = {
          id: uid,
          companyId: tenantId,
          email: firebaseUser.email || '',
          name: firebaseUser?.displayName || email.trim().split('@')[0] || 'Administrador',
          role: (isSuperAdminEmail(firebaseUser.email) || profile.role === 'admin') ? 'admin' as const : 'client' as const,
          isPlatformAdmin: await hasPlatformAdminClaim(firebaseUser),
          planFeatures: Array.isArray(profile.planFeatures) ? profile.planFeatures : ['pdv', 'agenda']
        };

        try {
          await setDoc(doc(db, 'users', uid), {
            ...loggedUser,
            companyId: tenantId,
            lastLogin: new Date().toISOString()
          }, { merge: true });
        } catch (docErr) {
          console.warn('Firestore doc update error:', docErr);
        }

        if (companyData.niche) {
          setNiche(companyData.niche as NicheType);
        }

        await retryAuth();
        if (!useAuthStore.getState().isAuthenticated) throw new Error('Falha ao validar sessão e empresa no Firebase.');
        toast.success('Login realizado com sucesso!', {
          description: `Bem-vindo de volta, ${loggedUser.name}!`
        });
        navigate('/');
      }
    } catch (error: any) {
      console.error('Authentication fatal error:', error);
      if (isRegister) {
        trackLeadCaptureAttempt({
          form_name: 'signup_form',
          step: 'auth_error',
          status: 'error',
          error_reason: error?.code || error?.message || 'auth_failed',
          last_field_focused: lastFieldFocused,
          fields_completed: getFieldsCompleted(),
          fields_count: getFieldsCompleted().length,
          has_company: !!companyName.trim(),
          has_email: !!email.trim(),
          selected_niche: selectedNiche,
          plan_name: searchParams.get('plan') || 'Plano Básico'
        });
      }
      toast.error('Não foi possível entrar com estas credenciais. Utilize o Acesso Demo Instantâneo ou cadastre-se grátis.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleRegister = () => {
    if (isRegister && !isRegisteredSuccessRef.current && (companyName.trim() || email.trim() || password.trim())) {
      trackLeadCaptureAttempt({
        form_name: 'signup_form',
        step: 'abandoned',
        status: 'abandoned',
        last_field_focused: lastFieldFocused,
        fields_completed: getFieldsCompleted(),
        fields_count: getFieldsCompleted().length,
        has_company: !!companyName.trim(),
        has_email: !!email.trim(),
        selected_niche: selectedNiche,
        plan_name: searchParams.get('plan') || 'Plano Básico',
        source: 'toggled_to_login'
      });
    }
    setIsRegister(!isRegister);
  };

  const handlePhoneAuth = async () => {
    setLoginError('');
    setIsSubmitting(true);
    try {
      if (!phoneConfirmation) {
        const normalized = phoneNumber.replace(/\\s|[()-]/g, '');
        if (!/^\\+[1-9]\\d{7,14}$/.test(normalized)) throw new Error('Use o telefone internacional, por exemplo +5511999999999.');
        const verifier = new RecaptchaVerifier(auth, 'bella-phone-recaptcha', { size: 'invisible' });
        try {
          const result = await signInWithPhoneNumber(auth, normalized, verifier);
          setPhoneConfirmation(result);
          toast.success('Código SMS enviado.');
        } finally { verifier.clear(); }
        return;
      }
      if (!/^\\d{6}$/.test(phoneCode.trim())) throw new Error('Informe o código de 6 dígitos.');
      const result = await phoneConfirmation.confirm(phoneCode.trim());
      // The Firebase listener is the authority for profile and permissions;
      // do not assign admin rights or manufacture a company here.
      toast.success('Telefone confirmado.');
      if (result.user) navigate('/', { replace: true });
    } catch (error: any) {
      setLoginError(error?.message || 'Não foi possível verificar o telefone.');
    } finally { setIsSubmitting(false); }
  };

  const handleSocialAuth = async (provider: 'Google' | 'Apple' | 'Microsoft') => {
    setIsSubmitting(true);
    try {
      if (provider !== 'Google') {
        toast.error('Provedor indisponível até configurar autenticação real.');
        return;
      }
      const result = await signInWithPopup(auth, new GoogleAuthProvider());
      const uid = result.user.uid;
      const displayName = result.user.displayName || 'Usuário Google';
      const userEmail = result.user.email || '';

      let profile: Record<string, any> = {};
      let profileExists = false;
      try {
        const snapshot = await getDoc(doc(db, 'users', uid));
        if (snapshot.exists()) { profile = snapshot.data(); profileExists = true; }
      } catch (err) {
        console.warn('Could not load Google user profile:', err);
      }

      const isSuperAdmin = isSuperAdminEmail(userEmail);
      const tenantId = typeof profile.companyId === 'string' && profile.companyId ? profile.companyId : uid;
      const socialUser = {
        id: uid,
        companyId: tenantId,
        name: displayName,
        email: userEmail,
        role: (isSuperAdmin || profile.role === 'admin') ? 'admin' as const : 'client' as const,
        isPlatformAdmin: await hasPlatformAdminClaim(result.user),
        planFeatures: Array.isArray(profile.planFeatures) ? profile.planFeatures : ['pdv', 'agenda', 'crm', 'ia', 'automacoes', 'relatorios', 'whatsapp', 'marketplace']
      };

      try {
        await setDoc(doc(db, 'users', uid), {
          name: displayName,
          email: userEmail,
          companyId: tenantId,
          ...(!profileExists ? { role: 'client' } : {}),
          provider,
          lastLogin: new Date().toISOString()
        }, { merge: true });
      } catch (err) {
        console.warn('Error saving social user:', err);
        if (!profileExists) {
          await signOut(auth);
          useAuthStore.getState().setUser(null);
          toast.error('Não foi possível salvar o novo cadastro. Verifique a configuração do banco de dados.');
          return;
        }
      }

      const niche = typeof profile.niche === 'string' ? profile.niche as NicheType : selectedNiche;
      setNiche(niche);
      await retryAuth();
      if (!useAuthStore.getState().isAuthenticated) throw new Error('Falha ao validar sessão social no Firebase.');

      toast.success(`Conectado com ${provider}!`, {
        description: 'Bem-vindo ao painel BellaPDV.'
      });
      navigate('/');
    } catch (error: any) {
      console.error(`${provider} login error:`, error);
      const code = error?.code || '';
      const message = code === 'auth/account-exists-with-different-credential'
        ? 'Este e-mail já existe com outro método de acesso. Entre com e-mail/senha primeiro para vincular o Google.'
        : code === 'auth/popup-blocked'
          ? 'O navegador bloqueou a janela do Google. Libere pop-ups e tente novamente.'
          : code === 'auth/unauthorized-domain'
            ? 'Este domínio ainda não está autorizado no Firebase Authentication.'
            : `Erro ao autenticar com ${provider}.`;
      setLoginError(message);
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#05070F]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 text-cyan-400 animate-spin" />
          <p className="text-slate-400 font-medium text-sm animate-pulse">Carregando ambiente...</p>
        </div>
      </div>
    );
  }

  const nicheOptions = [
    { id: 'barbershop', label: 'Barbearia', icon: Scissors },
    { id: 'clinic', label: 'Clínica', icon: HeartPulse },
    { id: 'salon', label: 'Salão de Beleza', icon: Sparkles },
    { id: 'spa', label: 'Spa / Estética', icon: Activity },
  ] as const;

  return (
    <div className="min-h-screen flex bg-[#0A0A0A] items-center justify-center relative font-sans text-slate-300 py-12 px-4">
      {/* Background Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] bg-cyan-500/10 blur-[120px] rounded-full pointer-events-none" />

      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
        className="w-full max-w-[440px] relative z-10"
      >
        <div className="flex flex-col items-center mb-6">
          <Logo size="lg" className="mb-4 justify-center" />
          <h1 className="text-white text-2xl font-bold tracking-tight">
            {isRegister ? 'Criar sua conta' : 'Acesse o BellaPDV'}
          </h1>
          <p className="text-slate-400 text-xs mt-1.5 text-center">
            {isRegister ? 'Cadastre seu negócio e comece a operar em menos de 1 minuto.' : 'Bem-vindo de volta! Faça login para gerenciar seu espaço.'}
          </p>
        </div>

        <div className="bg-[#121214] border border-[#27272A] rounded-2xl p-6 md:p-8 shadow-2xl backdrop-blur-xl">
          {/* Quick Demo Access 1-Click Button */}
          <div className="mb-6 p-3 bg-gradient-to-r from-cyan-950/40 via-blue-950/30 to-purple-950/40 border border-cyan-500/30 rounded-xl">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-cyan-400 flex items-center gap-1 uppercase tracking-wider">
                <Zap className="w-3.5 h-3.5 fill-cyan-400" />
                Demonstração Instantânea
              </span>
              <span className="text-[10px] bg-cyan-500/20 text-cyan-300 px-2 py-0.5 rounded-full font-medium">
                Sem Senha
              </span>
            </div>
            <p className="text-slate-400 text-xs mb-3">
              Deseja apenas testar o sistema completo agora sem criar conta?
            </p>
            <button
              type="button"
              onClick={handleQuickDemoLogin}
              disabled={isDemoLoading || isSubmitting}
              className="w-full py-2.5 px-4 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black font-bold rounded-lg text-xs flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20 transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50"
            >
              {isDemoLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-black" />
                  <span>Acessando ambiente demo...</span>
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4 fill-black" />
                  <span>Entrar com Acesso Rápido Demo (1-Clique)</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </div>

          <div className="mb-5">
            <button type="button" onClick={() => { setPhoneMode(!phoneMode); setPhoneConfirmation(null); setPhoneCode(''); }}
              className="w-full rounded-lg border border-cyan-700 px-3 py-2 text-xs text-cyan-300">
              {phoneMode ? 'Ocultar acesso por telefone' : 'Entrar com telefone (SMS)'}
            </button>
            {phoneMode && (
              <div className="mt-3 space-y-2">
                <input type="tel" autoComplete="tel" disabled={!!phoneConfirmation} value={phoneNumber} onChange={e => setPhoneNumber(e.target.value)}
                  placeholder="+5511999999999" aria-label="Telefone com código do país"
                  className="w-full rounded-lg border border-zinc-700 bg-zinc-900 p-3 text-sm text-white" />
                {phoneConfirmation && <input type="text" inputMode="numeric" autoComplete="one-time-code" maxLength={6}
                  value={phoneCode} onChange={e => setPhoneCode(e.target.value)} placeholder="Código SMS de 6 dígitos"
                  aria-label="Código SMS" className="w-full rounded-lg border border-zinc-700 bg-zinc-900 p-3 text-sm text-white" />}
                <div id="bella-phone-recaptcha" />
                <button type="button" onClick={handlePhoneAuth} disabled={isSubmitting}
                  className="w-full rounded-lg bg-cyan-600 p-3 text-xs font-bold text-white disabled:opacity-50">
                  {phoneConfirmation ? 'Confirmar código SMS' : 'Enviar código SMS'}
                </button>
              </div>
            )}
          </div>

          {/* Social Logins */}
          <div className="flex flex-col gap-2.5 mb-5">
            <button 
              type="button" 
              onClick={() => handleSocialAuth('Google')} 
              disabled={isSubmitting || isDemoLoading}
              className="flex justify-center items-center gap-2.5 w-full py-2.5 bg-white border border-transparent text-black hover:bg-slate-100 transition-colors rounded-xl font-semibold text-xs disabled:opacity-50"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Continuar com Google
            </button>
            <div className="grid grid-cols-2 gap-2">
              <button 
                type="button" 
                onClick={() => handleSocialAuth('Apple')} 
                disabled={isSubmitting || isDemoLoading}
                className="flex justify-center items-center gap-1.5 py-2 bg-[#18181B] border border-[#27272A] text-white hover:bg-[#27272A] transition-colors rounded-xl font-medium text-xs disabled:opacity-50"
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.126 3.822 3.08 1.567-.052 2.164-.96 4.098-.96 1.905 0 2.45.96 4.128.932 1.696-.027 2.716-1.503 3.73-2.955 1.168-1.745 1.646-3.435 1.674-3.523-.037-.015-3.3-1.265-3.324-5.021-.023-3.136 2.58-4.636 2.695-4.708-1.468-2.146-3.743-2.435-4.551-2.47-1.895-.213-3.774 1.077-4.83 1.077m-.62 13.916Z" fill="#FFF"/>
                  <path d="M14.954 4.542c.846-1.026 1.417-2.457 1.263-3.882-1.228.05-2.732.817-3.598 1.843-.77.893-1.442 2.36-.168 3.743 1.36.035 2.766-.676 3.503-1.704Z" fill="#FFF"/>
                </svg>
                Apple
              </button>
              <button 
                type="button" 
                onClick={() => handleSocialAuth('Microsoft')} 
                disabled={isSubmitting || isDemoLoading}
                className="flex justify-center items-center gap-1.5 py-2 bg-[#18181B] border border-[#27272A] text-white hover:bg-[#27272A] transition-colors rounded-xl font-medium text-xs disabled:opacity-50"
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M11.4 24H0V12.6h11.4V24zM24 24H12.6V12.6H24V24zM11.4 11.4H0V0h11.4v11.4zM24 11.4H12.6V0H24v11.4z" fill="#00a4ef"/>
                </svg>
                Microsoft
              </button>
            </div>
          </div>

          <div className="relative flex items-center py-2 mb-4">
            <div className="flex-grow border-t border-[#27272A]"></div>
            <span className="flex-shrink-0 mx-3 text-slate-500 text-[11px] uppercase tracking-wider">ou com e-mail</span>
            <div className="flex-grow border-t border-[#27272A]"></div>
          </div>

          {/* Test Credentials Quick Fill Chip */}
          {!isRegister && (
            <div className="mb-4 text-center">
              <button
                type="button"
                onClick={fillTestCredentials}
                className="text-[11px] text-cyan-400 hover:text-cyan-300 transition-colors inline-flex items-center gap-1.5 bg-cyan-950/40 border border-cyan-800/50 px-3 py-1.5 rounded-full cursor-pointer hover:bg-cyan-900/40 active:scale-95"
              >
                <Zap className="w-3 h-3 text-cyan-400" />
                <span>Preencher credenciais de teste (demo)</span>
              </button>
            </div>
          )}

          {/* Registration 15 Days Free Trial Callout */}
          {isRegister && (
            <div className="mb-4 p-3 rounded-xl bg-gradient-to-r from-emerald-500/15 via-cyan-500/15 to-purple-500/15 border border-emerald-400/30">
              <div className="flex items-center gap-1.5 text-xs font-black text-emerald-400 uppercase tracking-wider mb-1">
                <Sparkles className="w-3.5 h-3.5" />
                <span>15 Dias de Teste Grátis Incluso</span>
              </div>
              <p className="text-[11px] text-slate-300 leading-tight">
                Plano Básico de <span className="line-through text-slate-400">R$ 89,90</span> por apenas <strong className="text-white">R$ 29,90/mês</strong> nos 3 primeiros meses! Sem necessidade de cartão de crédito.
              </p>
            </div>
          )}

          <form onSubmit={handleAuth} className="space-y-3.5">
            {isRegister && (
              <>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1 ml-1 flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-cyan-400" />
                    Nome da Empresa / Espaço
                  </label>
                  <input 
                    type="text" 
                    required
                    value={companyName}
                    onFocus={() => setLastFieldFocused('company_name')}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className="w-full bg-[#0A0A0A] border border-[#27272A] rounded-xl px-3.5 py-2.5 text-white placeholder:text-slate-600 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all text-sm"
                    placeholder="Ex: Studio Bella Donna / Barbearia Real"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5 ml-1">Segmento do Negócio</label>
                  <div className="grid grid-cols-2 gap-2">
                    {nicheOptions.map((opt) => {
                      const isSelected = selectedNiche === opt.id;
                      const Icon = opt.icon;
                      return (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => {
                            setSelectedNiche(opt.id as NicheType);
                            setLastFieldFocused('niche');
                          }}
                          className={`flex items-center gap-2 p-2.5 border rounded-xl transition-all duration-150 ${
                            isSelected 
                              ? 'bg-cyan-500/10 border-cyan-500 text-white shadow-sm'
                              : 'bg-[#18181B]/50 border-[#27272A] text-slate-400 hover:border-slate-600 hover:text-slate-200'
                          }`}
                        >
                          <Icon className={`w-4 h-4 ${isSelected ? 'text-cyan-400' : 'text-slate-400'}`} />
                          <span className="text-xs font-medium truncate">{opt.label}</span>
                          {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 ml-auto shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1 ml-1 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-cyan-400" />
                E-mail
              </label>
              <input 
                type="email" 
                required
                value={email}
                onFocus={() => setLastFieldFocused('email')}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-[#0A0A0A] border border-[#27272A] rounded-xl px-3.5 py-2.5 text-white placeholder:text-slate-600 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all text-sm"
                placeholder="seu.email@empresa.com"
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-1 mx-1">
                <label className="block text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-cyan-400" />
                  Senha
                </label>
                {!isRegister && (
                  <button 
                    type="button" 
                    onClick={async () => {
                      if (!isSuperAdminEmail(email)) {
                        toast.info('Para recuperar contas Firebase, utilize a recuperação do provedor atual.'); return;
                      }
                      try {
                        await sendPasswordResetEmail(auth, email.trim());
                        toast.success('Se a conta estiver habilitada, você receberá um e-mail para recuperar a senha.');
                      } catch (error: any) { toast.error(error?.message || 'Falha na recuperação de senha.'); }
                    }}
                    className="text-[11px] text-cyan-400 hover:text-cyan-300 transition-colors font-medium"
                  >
                    Esqueceu?
                  </button>
                )}
              </div>
              {loginError && <p role="alert" className="text-red-400 text-xs mb-2">{loginError}</p>}
              <input 
                type="password" 
                required
                minLength={6}
                value={password}
                onFocus={() => setLastFieldFocused('password')}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-[#0A0A0A] border border-[#27272A] rounded-xl px-3.5 py-2.5 text-white placeholder:text-slate-600 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all text-sm"
                placeholder="Mínimo 6 caracteres"
              />
            </div>

            <button 
              type="submit"
              disabled={isSubmitting || isDemoLoading}
              className="w-full py-3 mt-1 bg-white text-black hover:bg-slate-200 rounded-xl font-bold transition-all duration-200 text-sm flex items-center justify-center gap-2 shadow-lg disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-black" />
                  <span>{isRegister ? 'Criando conta...' : 'Entrando...'}</span>
                </>
              ) : (
                <span>{isRegister ? 'Criar Conta e Começar' : 'Entrar no Sistema'}</span>
              )}
            </button>
          </form>

          <p className="mt-5 text-center text-xs text-slate-400">
            {isRegister ? 'Já possui uma conta?' : 'Ainda não tem conta?'}
            <button 
              type="button"
              onClick={handleToggleRegister}
              className="text-white hover:text-cyan-400 underline transition-colors font-semibold ml-1.5"
            >
              {isRegister ? 'Fazer login' : 'Cadastre-se grátis'}
            </button>
          </p>
          
          <div className="mt-6 pt-5 border-t border-[#27272A] text-center flex flex-col items-center">
             <AtrStudioBadge size="sm" />
          </div>
        </div>
      </motion.div>
    </div>
  );
}
