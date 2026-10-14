import { create } from 'zustand';

// Representa o status atual do SaaS para esta empresa (Mock)
export type SubscriptionStatus = 'TRIAL' | 'ACTIVE' | 'WARNING' | 'BLOCK_PARTIAL' | 'BLOCK_TOTAL';

interface SubscriptionStore {
  status: SubscriptionStatus;
  setStatus: (status: SubscriptionStatus) => void;
  getRestrictedRoutes: () => string[];
}

export const useSubscriptionStore = create<SubscriptionStore>((set, get) => ({
  status: 'ACTIVE', // start normal
  setStatus: (status) => set({ status }),
  getRestrictedRoutes: () => {
    const { status } = get();
    if (status === 'BLOCK_PARTIAL') {
       return ['/reports', '/finance', '/marketing', '/loyalty'];
    }
    if (status === 'BLOCK_TOTAL') {
       // Se bloquear total, soh sobra o admin / login, mas para simplificar, deixa só POS.
       return ['/', '/schedule', '/clients', '/professionals', '/services', '/anamnesis', '/queue', '/packages', '/finance', '/reports', '/loyalty', '/marketing', '/settings'];
    }
    return []; // 'TRIAL' | 'ACTIVE' | 'WARNING'
  }
}));
