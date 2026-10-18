import { create } from 'zustand';
import { auth, db } from '../lib/firebase';
import { onAuthStateChanged, signOut, signInAnonymously } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
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

const DEFAULT_FEATURES = ['pdv', 'agenda', 'whatsapp', 'relatorios', 'ia', 'automacoes', 'crm', 'totem', 'marketing', 'loyalty'];

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
  user: initialUser,
  isAuthenticated: !!initialUser,
  isAuthReady: !!initialUser,
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
    return user.planFeatures?.includes(feature) ?? true;
  },
  login: (userData: any, token?: string, company?: any) => {
    const fullUser: AuthUser = {
      id: userData?.id || auth.currentUser?.uid || 'u_admin',
      name: userData?.name || 'Administrador',
      email: userData?.email || 'admin@bellapdv.com',
      role: 'admin',
      companyId: company?.id || userData?.companyId || '1',
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

  const cached = getStoredUser();

  if (firebaseUser) {
    // If user is anonymous, but we already have a cached logged-in user profile, attach that
    const displayName = firebaseUser.displayName || cached?.name || (firebaseUser.email ? firebaseUser.email.split('@')[0] : 'Administrador');
    const email = firebaseUser.email || cached?.email || 'admin@bellapdv.com';

    const userData: AuthUser = {
      id: firebaseUser.uid,
      email: email,
      name: displayName,
      role: 'admin',
      companyId: cached?.companyId || '1',
      avatar: firebaseUser.photoURL || cached?.avatar,
      planFeatures: DEFAULT_FEATURES
    };

    useAuthStore.getState().setUser(userData);

    // Save/Update user profile in Firestore
    try {
      await setDoc(doc(db, 'users', firebaseUser.uid), {
        ...userData,
        lastLogin: new Date().toISOString(),
      }, { merge: true });
    } catch (err) {
      console.warn('Could not save user profile to Firestore:', err);
    }

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
    // No Firebase user. If there is a cached user in localStorage, connect Firebase anonymously
    // so Firestore rules pass and session remains uninterrupted
    if (cached) {
      try {
        await signInAnonymously(auth);
      } catch (err) {
        console.warn('Anonymous reconnect error:', err);
        useAuthStore.getState().setAuthReady(true);
      }
    } else {
      useAuthStore.getState().setUser(null);
    }
  }
});

// Fallback safety timeout: ensure auth state is ready within 1s even if Firebase is sluggish
setTimeout(() => {
  if (!isListenerInitialized) {
    useAuthStore.getState().setAuthReady(true);
  }
}, 1000);
