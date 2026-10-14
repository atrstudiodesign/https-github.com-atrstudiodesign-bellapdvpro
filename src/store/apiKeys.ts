import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface ApiKeysState {
  geminiKey: string;
  evolutionUrl: string;
  evolutionKey: string;
  asaasKey: string;
  setGeminiKey: (key: string) => void;
  setEvolutionData: (url: string, key: string) => void;
  setAsaasKey: (key: string) => void;
}

export const useApiKeysStore = create<ApiKeysState>()(
  persist(
    (set) => ({
      geminiKey: '',
      evolutionUrl: '',
      evolutionKey: '',
      asaasKey: '',
      setGeminiKey: (key) => set({ geminiKey: key }),
      setEvolutionData: (url, key) => set({ evolutionUrl: url, evolutionKey: key }),
      setAsaasKey: (key) => set({ asaasKey: key }),
    }),
    {
      name: 'bella-api-keys',
    }
  )
);
