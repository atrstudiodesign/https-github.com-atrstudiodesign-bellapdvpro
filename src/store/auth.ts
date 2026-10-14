import { create } from 'zustand';
import { auth, db } from '../lib/firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { subscribeToClients } from './clients';
import { subscribeToCatalog } from './catalog';
import { subscribeToAppointments } from './appointments';
import { subscribeToTransactions } from './transactions';
import { subscribeToQueue } from './queue';

interface AuthState {
  user: { id: string; role: 'admin' | 'client', planFeatures: string[], email: string, name: string } | null;
  isAuthenticated: boolean;
  setUser: (user: any) => void;
  hasFeature: (feature: string) => boolean;
  login: (email: any, token?: string, company?: any) => void;
  logout: () => void;
}

// Keep track of active subscriptions
let unsubscribes: Array<() => void> = [];

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isAuthenticated: false,
  setUser: (user) => set({ user, isAuthenticated: !!user }),
  hasFeature: (feature: string) => {
    const user = get().user;
    if (!user) return false;
    return user.planFeatures.includes(feature);
  },
  login: (mockUser: any, token?: string, company?: any) => {
    set({ 
      isAuthenticated: true, 
      user: { 
        ...mockUser,
        role: 'admin', 
        planFeatures: ['pdv', 'agenda', 'whatsapp', 'relatorios', 'ia', 'automacoes', 'crm'] 
      } 
    });
  },
  logout: async () => {
    await signOut(auth);
    set({ isAuthenticated: false, user: null });
  }
}));

// Initialize Firebase Auth Listener
onAuthStateChanged(auth, async (firebaseUser) => {
  // Clear previous subscriptions
  unsubscribes.forEach(unsub => unsub());
  unsubscribes = [];

  if (firebaseUser && !firebaseUser.isAnonymous) {
    const userData = {
      id: firebaseUser.uid,
      email: firebaseUser.email || '',
      name: firebaseUser.displayName || 'Usuário',
      role: 'admin',
      planFeatures: ['pdv', 'agenda', 'whatsapp', 'relatorios', 'ia', 'automacoes', 'crm']
    };

    useAuthStore.getState().setUser(userData);
    localStorage.setItem('last_merchant_uid', firebaseUser.uid);

    // Save/Update user profile in Firestore so SaaS Admin can track them
    try {
      await setDoc(doc(db, 'users', firebaseUser.uid), {
        ...userData,
        lastLogin: new Date().toISOString(),
      }, { merge: true });
    } catch (err) {
      console.warn("Could not save user profile:", err);
    }

    // Start data subscriptions
    unsubscribes.push(
      subscribeToClients(),
      subscribeToCatalog(),
      subscribeToAppointments(),
      subscribeToTransactions(),
      subscribeToQueue()
    );
  } else {
    useAuthStore.getState().setUser(null);
  }
});

