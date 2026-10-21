import { create } from 'zustand';
import { auth, db } from '../lib/firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { subscribeToClients } from './clients';
import { subscribeToCatalog } from './catalog';
import { subscribeToAppointments } from './appointments';
import { subscribeToTransactions } from './transactions';
import { subscribeToQueue } from './queue';
import { useClientStore } from './clients';
import { useCatalogStore } from './catalog';
import { useAppointmentStore } from './appointments';
import { useTransactionStore } from './transactions';
import { useQueueStore } from './queue';
import { useProfessionalStore, subscribeToProfessionals } from './professionals';
import { useApiKeysStore } from './apiKeys';
import { setFirebaseTenantContext } from '../lib/firebaseTenant';
import { hasPlatformAdminClaim } from '../lib/superAdmins';

export interface AuthUser {
  id: string;
  role: 'admin' | 'client';
  isPlatformAdmin?: boolean;
  planFeatures: string[];
  email: string;
  name: string;
  companyId?: string;
  avatar?: string;
  isDemo?: boolean;
}

interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isAuthReady: boolean;
  authError: string | null;
  setUser: (user: AuthUser | null) => void;
  setAuthReady: (ready: boolean) => void;
  retryAuth: () => Promise<void>;
  hasFeature: (feature: string) => boolean;
  login: (userData: any, token?: string, company?: any) => void;
  logout: () => Promise<void>;
}

// Keep track of active subscriptions
let unsubscribes: Array<() => void> = [];

const DEFAULT_FEATURES: string[] = ['pdv', 'agenda', 'crm', 'ia', 'automacoes', 'relatorios', 'whatsapp', 'marketplace'];
const getStoredUser = (): AuthUser | null => {
  try {
    const raw = localStorage.getItem('bellapdv_auth_user');
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
};

let activeIdentityKey: string | null = null;
let authChangeVersion = 0;

function identityKey(user: AuthUser | null): string | null {
  return user ? `${user.id}:${user.companyId || user.id}:${user.isDemo === true}` : null;
}

function resetSubscriptionsAndTenant() {
  unsubscribes.forEach(unsub => unsub());
  unsubscribes = [];
  clearTenantData();
}

function clearTenantData() {
  useClientStore.getState().setClients([]);
  useCatalogStore.getState().setItems([]);
  useAppointmentStore.getState().setAppointments([]);
  useTransactionStore.getState().setTransactions([]);
  useQueueStore.getState().setQueueItems([]);
  useProfessionalStore.getState().setProfessionals([]);
  useApiKeysStore.getState().clearKeys();
}

function failAuth(message: string) {
  resetSubscriptionsAndTenant();
  activeIdentityKey = null;
  setFirebaseTenantContext(null);
  useAuthStore.setState({ user: null, isAuthenticated: false, isAuthReady: true, authError: message });
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isAuthenticated: false,
  isAuthReady: false,
  authError: null,
  setUser: (user) => {
    if (activeIdentityKey !== identityKey(user)) {
      resetSubscriptionsAndTenant();
      activeIdentityKey = identityKey(user);
    }
    if (user) {
      setFirebaseTenantContext(user.id, user.companyId);
      try {
        localStorage.setItem('bellapdv_auth_user', JSON.stringify(user));
        localStorage.setItem('last_merchant_uid', user.companyId || user.id);
      } catch (err) {
        console.warn('Could not cache user locally:', err);
      }
      set({ user, isAuthenticated: true, isAuthReady: true, authError: null });
    } else {
      setFirebaseTenantContext(null);
      try {
        localStorage.removeItem('bellapdv_auth_user');
        localStorage.removeItem('last_merchant_uid');
      } catch (err) {
        console.warn('Could not remove cached user:', err);
      }
      set({ user: null, isAuthenticated: false, isAuthReady: true, authError: null });
    }
  },
  setAuthReady: (ready: boolean) => set({ isAuthReady: ready }),
  retryAuth: async () => {
    await hydrateFirebaseUser(auth.currentUser);
  },
  hasFeature: (feature: string) => {
    const user = get().user;
    if (!user) return false;
    return user.planFeatures?.includes(feature) ?? false;
  },
  login: (userData: any, token?: string, company?: any) => {
    const fullUser: AuthUser = {
      id: userData?.id || auth.currentUser?.uid || 'u_admin',
      name: userData?.name || 'Administrador',
      email: userData?.email || 'admin@bellapdv.com',
      role: userData?.role === 'admin' ? 'admin' : 'client',
      isPlatformAdmin: userData?.isPlatformAdmin === true,
      isDemo: userData?.isDemo === true,
      companyId: company?.id || userData?.companyId,
      avatar: userData?.avatar,
      planFeatures: Array.isArray(userData?.planFeatures) ? userData.planFeatures : DEFAULT_FEATURES
    };

    if (activeIdentityKey !== identityKey(fullUser)) {
      resetSubscriptionsAndTenant();
      activeIdentityKey = identityKey(fullUser);
    }
    setFirebaseTenantContext(fullUser.id, fullUser.companyId);
    try {
      localStorage.setItem('bellapdv_auth_user', JSON.stringify(fullUser));
      localStorage.setItem('last_merchant_uid', fullUser.companyId || fullUser.id);
      if (token) localStorage.setItem('bellapdv_auth_token', token);
    } catch (e) {
      console.warn('Failed to save auth to localStorage', e);
    }

    set({
      isAuthenticated: true, 
      user: fullUser,
      isAuthReady: true,
      authError: null
    });
  },
  logout: async () => {
    unsubscribes.forEach(unsub => unsub());
    unsubscribes = [];
    clearTenantData();
    activeIdentityKey = null;
    authChangeVersion++;
    setFirebaseTenantContext(null);
    try {
      localStorage.removeItem('bellapdv_auth_user');
      localStorage.removeItem('last_merchant_uid');
      localStorage.removeItem('bellapdv_auth_token');
      await signOut(auth);
    } catch (err) {
      console.warn('Error signing out:', err);
    }
    set({ isAuthenticated: false, user: null, isAuthReady: true, authError: null });
  }
}));

// Wait for Firebase's first auth callback before deciding whether to redirect.
async function hydrateFirebaseUser(firebaseUser: typeof auth.currentUser) {
  const version = ++authChangeVersion;
  // Clear previous subscriptions
  unsubscribes.forEach(unsub => unsub());
  unsubscribes = [];

  if (firebaseUser) {
    if (firebaseUser.isAnonymous) {
      // Firebase automatically signs anonymous users into public pages.
      // Do not treat this as an authenticated business or administrator unless in local demo session.
      const stored = getStoredUser();
      if (stored?.isDemo) {
        useAuthStore.getState().setUser(stored);
      } else {
        useAuthStore.getState().setUser(null);
      }
      return;
    }
    // Resolve the tenant before allowing protected routes or subscriptions.
    // A fallback companyId=uid is only valid for a genuinely missing profile.
    useAuthStore.setState({ isAuthReady: false, authError: null });
    let profile: Record<string, any> = {};
    try {
      const snapshot = await getDoc(doc(db, 'users', firebaseUser.uid));
      if (snapshot.exists()) profile = snapshot.data();
    } catch (error) {
      console.error('Cannot verify company membership:', error);
      if (version === authChangeVersion) {
        failAuth('Não foi possível confirmar sua empresa. Verifique a conexão e tente novamente.');
      }
      return;
    }

    const email = firebaseUser.email || '';
    const displayName = firebaseUser.displayName || (email ? email.split('@')[0] : 'Usuário');
    const isPlatformAdmin = await hasPlatformAdminClaim(firebaseUser);
    if (version !== authChangeVersion || auth.currentUser?.uid !== firebaseUser.uid) return;

    const userData: AuthUser = {
      id: firebaseUser.uid,
      email,
      name: displayName,
      role: isPlatformAdmin || profile.role === 'admin' ? 'admin' : 'client',
      isPlatformAdmin,
      companyId: typeof profile.companyId === 'string' && profile.companyId ? profile.companyId : firebaseUser.uid,
      avatar: firebaseUser.photoURL || undefined,
      planFeatures: Array.isArray(profile.planFeatures) ? profile.planFeatures : DEFAULT_FEATURES,
      isDemo: false
    };
    useAuthStore.getState().setUser(userData);

    // Start real-time data subscriptions (only for real accounts, never for demo)
    try {
      unsubscribes.push(
        subscribeToClients(),
        subscribeToCatalog(),
        subscribeToAppointments(),
        subscribeToTransactions(),
        subscribeToQueue(),
        subscribeToProfessionals()
      );
    } catch (err) {
      console.warn('Could not start Firestore subscriptions:', err);
    }
  } else {
    const stored = getStoredUser();
    if (stored?.isDemo) {
      useAuthStore.getState().setUser(stored);
      return;
    }
    useAuthStore.getState().setUser(null);
  }
}

onAuthStateChanged(auth, hydrateFirebaseUser, (error) => {
  console.error('Firebase auth initialization failed:', error);
  failAuth('Não foi possível iniciar a sessão. Tente novamente.');
});
