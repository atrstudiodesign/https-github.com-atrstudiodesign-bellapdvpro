import { create } from 'zustand';
import { auth, db } from '../lib/firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { subscribeToClients } from './clients';
import { subscribeToCatalog } from './catalog';
import { subscribeToAppointments } from './appointments';
import { subscribeToTransactions } from './transactions';
import { subscribeToQueue } from './queue';

export interface AuthUser {
  id: string;
  role: 'admin' | 'client';
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
  setUser: (user: AuthUser | null) => void;
  setAuthReady: (ready: boolean) => void;
  hasFeature: (feature: string) => boolean;
  login: (userData: any, token?: string, company?: any) => void;
  logout: () => Promise<void>;
}

// Keep track of active subscriptions
let unsubscribes: Array<() => void> = [];

const DEFAULT_FEATURES: string[] = ['pdv', 'agenda', 'crm', 'ia', 'automacoes', 'relatorios', 'whatsapp', 'marketplace'];
const SUPER_ADMIN_EMAILS = new Set(['tramposshop@gmail.com', 'agtramposof@gmail.com']);

const isSuperAdminEmail = (email?: string | null) =>
  SUPER_ADMIN_EMAILS.has((email || '').trim().toLowerCase());

const getStoredUser = (): AuthUser | null => {
  try {
    const raw = localStorage.getItem('bellapdv_auth_user');
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
};

const initialUser = getStoredUser();

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isAuthenticated: false,
  isAuthReady: false,
  setUser: (user) => {
    if (user) {
      try {
        localStorage.setItem('bellapdv_auth_user', JSON.stringify(user));
        localStorage.setItem('last_merchant_uid', user.companyId || user.id);
      } catch (err) {
        console.warn('Could not cache user locally:', err);
      }
      set({ user, isAuthenticated: true, isAuthReady: true });
    } else {
      try {
        localStorage.removeItem('bellapdv_auth_user');
        localStorage.removeItem('last_merchant_uid');
      } catch (err) {
        console.warn('Could not remove cached user:', err);
      }
      set({ user: null, isAuthenticated: false, isAuthReady: true });
    }
  },
  setAuthReady: (ready: boolean) => set({ isAuthReady: ready }),
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
      companyId: company?.id || userData?.companyId,
      avatar: userData?.avatar,
      planFeatures: Array.isArray(userData?.planFeatures) ? userData.planFeatures : DEFAULT_FEATURES
    };

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
      isAuthReady: true
    });
  },
  logout: async () => {
    try {
      localStorage.removeItem('bellapdv_auth_user');
      localStorage.removeItem('last_merchant_uid');
      localStorage.removeItem('bellapdv_auth_token');
      await signOut(auth);
    } catch (err) {
      console.warn('Error signing out:', err);
    }
    set({ isAuthenticated: false, user: null, isAuthReady: true });
  }
}));

// Initialize Firebase Auth Listener
let isListenerInitialized = false;

onAuthStateChanged(auth, async (firebaseUser) => {
  isListenerInitialized = true;
  // Clear previous subscriptions
  unsubscribes.forEach(unsub => unsub());
  unsubscribes = [];

  if (firebaseUser) {
    if (firebaseUser.isAnonymous) {
      // Firebase automatically signs anonymous users into public pages.
      // Do not treat this as an authenticated business or administrator.
      const stored = getStoredUser();
      if (stored?.isDemo && stored.id === firebaseUser.uid) {
        useAuthStore.getState().setUser(stored);
      } else {
        useAuthStore.getState().setUser(null);
      }
      return;
    }
    const displayName = firebaseUser.displayName || (firebaseUser.email ? firebaseUser.email.split('@')[0] : 'Usuário');
    const email = firebaseUser.email || '';

    // Mark Firebase authentication ready immediately. Firestore profile hydration must
    // never block the whole app if the network/rules are slow.
    const provisionalUser: AuthUser = {
      id: firebaseUser.uid,
      email,
      name: displayName,
      role: isSuperAdminEmail(email) ? 'admin' : 'client',
      companyId: firebaseUser.uid,
      avatar: firebaseUser.photoURL || undefined,
      planFeatures: DEFAULT_FEATURES
    };
    useAuthStore.getState().setUser(provisionalUser);

    let profile: Record<string, any> = {};
    try {
      const profileRead = getDoc(doc(db, 'users', firebaseUser.uid));
      const timeout = new Promise<null>((resolve) => setTimeout(() => resolve(null), 1800));
      const snapshot = await Promise.race([profileRead, timeout]);
      if (snapshot && snapshot.exists()) profile = snapshot.data();
    } catch (error) {
      console.warn('Cannot retrieve authenticated profile:', error);
    }

    const userData: AuthUser = {
      ...provisionalUser,
      role: isSuperAdminEmail(email) || profile.role === 'admin' ? 'admin' : 'client',
      companyId: typeof profile.companyId === 'string' && profile.companyId ? profile.companyId : firebaseUser.uid,
      planFeatures: Array.isArray(profile.planFeatures) ? profile.planFeatures : DEFAULT_FEATURES,
      isDemo: !!profile.isDemo
    };
    useAuthStore.getState().setUser(userData);

    // Start real-time data subscriptions
    try {
      unsubscribes.push(
        subscribeToClients(),
        subscribeToCatalog(),
        subscribeToAppointments(),
        subscribeToTransactions(),
        subscribeToQueue()
      );
    } catch (err) {
      console.warn('Could not start Firestore subscriptions:', err);
    }
  } else {
    useAuthStore.getState().setUser(null);
  }
});

// Fallback safety timeout: ensure auth state is ready within 1s even if Firebase is sluggish
setTimeout(() => {
  if (!isListenerInitialized) {
    useAuthStore.getState().setAuthReady(true);
  }
}, 1000);
