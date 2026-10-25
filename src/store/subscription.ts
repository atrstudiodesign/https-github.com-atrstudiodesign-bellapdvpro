import { create } from 'zustand';

// Status visual derivado de licença verificada; desconhecido não equivale a ativo.
export type SubscriptionStatus = 'TRIAL' | 'ACTIVE' | 'WARNING' | 'BLOCK_PARTIAL' | 'BLOCK_TOTAL';

interface SubscriptionStore {
  status: SubscriptionStatus;
  setStatus: (status: SubscriptionStatus) => void;
  getRestrictedRoutes: () => string[];
}

export const useSubscriptionStore = create<SubscriptionStore>((set, get) => ({
  status: 'WARNING', // desconhecido até leitura da licença real
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
