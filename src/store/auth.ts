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

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isAuthenticated: false,
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
  // Compatibility method must not grant access without Firebase authentication.
  login: () => {
    console.warn('Direct login disabled. Use Firebase Authentication.');
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
    const claims = await firebaseUser.getIdTokenResult();
    const companyId = typeof claims.claims.companyId === 'string' ? claims.claims.companyId : undefined;
    const admin = claims.claims.admin === true;
    if (!companyId && !admin) {
      useAuthStore.getState().setUser(null);
      return;
    }
    const userData: AuthUser = {
      id: firebaseUser.uid,
      email: email,
      name: displayName,
      role: admin ? 'admin' : 'client',
      companyId,
      avatar: firebaseUser.photoURL || undefined,
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
