import { create } from 'zustand';

interface ApiKeysState {
  geminiKey: string;
  evolutionUrl: string;
  evolutionKey: string;
  asaasKey: string;
  setGeminiKey: (key: string) => void;
  setEvolutionData: (url: string, key: string) => void;
  setAsaasKey: (key: string) => void;
  clearKeys: () => void;
}

// Legacy storage used a single key for all accounts on the browser. Never
// rehydrate credentials from another tenant's session.
try { localStorage.removeItem('bella-api-keys'); } catch { /* unavailable */ }

export const useApiKeysStore = create<ApiKeysState>((set) => ({
  geminiKey: '',
  evolutionUrl: '',
  evolutionKey: '',
  asaasKey: '',
  setGeminiKey: (key) => set({ geminiKey: key }),
  setEvolutionData: (url, key) => set({ evolutionUrl: url, evolutionKey: key }),
  setAsaasKey: (key) => set({ asaasKey: key }),
  clearKeys: () => set({ geminiKey: '', evolutionUrl: '', evolutionKey: '', asaasKey: '' }),
}));
