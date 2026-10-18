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

const DEFAULT_FEATURES: string[] = ['pdv', 'agenda'];

const getStoredUser = (): AuthUser | null => {
  try {
    const raw = localStorage.getItem('bellapdv_auth_user');
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
};

const initialUser = null; // A cached profile is never sufficient to authenticate a session.

export const useAuthStore = create<AuthState>((set, get) => ({
  user: initialUser,
  isAuthenticated: !!initialUser,
  isAuthReady: false,
  setUser: (user) => {
    if (user) {
      try {
        localStorage.setItem('bellapdv_auth_user', JSON.stringify(user));
        localStorage.setItem('last_merchant_uid', user.id);
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
      id: auth.currentUser?.uid || '',
      name: userData?.name || 'Administrador',
      email: userData?.email || 'admin@bellapdv.com',
      role: 'client', // UI callers cannot assign administrator permissions
      companyId: undefined, // Tenant must originate from verified Firebase claims
      avatar: userData?.avatar,
      planFeatures: DEFAULT_FEATURES
    };

    try {
      localStorage.setItem('bellapdv_auth_user', JSON.stringify(fullUser));
      localStorage.setItem('last_merchant_uid', fullUser.id);
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
    // If user is anonymous, but we already have a cached logged-in user profile, attach that
    if (firebaseUser.isAnonymous) {
      useAuthStore.getState().setUser(null);
      return;
    }
    const displayName = firebaseUser.displayName || (firebaseUser.email ? firebaseUser.email.split('@')[0] : 'Usuário');
    const email = firebaseUser.email || '';

    let profile: Record<string, any> = {};
    try {
      const snapshot = await getDoc(doc(db, 'users', firebaseUser.uid));
      if (snapshot.exists()) profile = snapshot.data();
    } catch (error) {
      console.warn('Cannot retrieve authenticated profile:', error);
    }
    const tokenResult = await firebaseUser.getIdTokenResult();
    const claims = tokenResult.claims;
    const trustedCompanyId = typeof claims.companyId === 'string' && claims.companyId.length <= 128 ? claims.companyId : undefined;
    const trustedAdmin = claims.admin === true;
    const userData: AuthUser = {
      id: firebaseUser.uid,
      email: email,
      name: displayName,
      role: trustedAdmin ? 'admin' : 'client',
      companyId: trustedCompanyId,
      avatar: firebaseUser.photoURL || undefined,
      planFeatures: trustedCompanyId && Array.isArray(claims.planFeatures) ? claims.planFeatures.filter((feature): feature is string => typeof feature === 'string') : DEFAULT_FEATURES
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
