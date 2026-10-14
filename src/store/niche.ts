import { create } from 'zustand';

export type NicheType = 'barbershop' | 'clinic' | 'salon' | 'tattoo' | 'spa';

export interface NicheConfig {
  type: NicheType;
  title: string;
  themeColor: 'cyan' | 'emerald' | 'purple' | 'rose' | 'amber';
  terminology: {
    client: string;
    service: string;
    employee: string;
    appointment: string;
  };
  features: {
    hasAnamnesis: boolean; // Clinic specific
    hasQueue: boolean; // Barbershop fast queue
    hasPackages: boolean; // Clinic/Spa packages
  };
}

export const NICHE_CONFIGS: Record<NicheType, NicheConfig> = {
  barbershop: {
    type: 'barbershop',
    title: 'Barbearia',
    themeColor: 'cyan',
    terminology: {
      client: 'Cliente',
      service: 'Corte/Serviço',
      employee: 'Barbeiro',
      appointment: 'Agendamento'
    },
    features: {
      hasAnamnesis: false,
      hasQueue: true,
      hasPackages: false
    }
  },
  clinic: {
    type: 'clinic',
    title: 'Clínica de Estética',
    themeColor: 'emerald',
    terminology: {
      client: 'Paciente',
      service: 'Procedimento',
      employee: 'Especialista',
      appointment: 'Consulta'
    },
    features: {
      hasAnamnesis: true,
      hasQueue: false,
      hasPackages: true
    }
  },
  salon: {
    type: 'salon',
    title: 'Salão de Beleza',
    themeColor: 'cyan', // Or pinkish
    terminology: {
      client: 'Cliente',
      service: 'Serviço',
      employee: 'Profissional',
      appointment: 'Agendamento'
    },
    features: {
      hasAnamnesis: false,
      hasQueue: false,
      hasPackages: true
    }
  },
  tattoo: {
    type: 'tattoo',
    title: 'Estúdio de Tatuagem',
    themeColor: 'purple',
    terminology: {
      client: 'Cliente',
      service: 'Sessão',
      employee: 'Artista',
      appointment: 'Sessão'
    },
    features: {
      hasAnamnesis: true,
      hasQueue: false,
      hasPackages: false
    }
  },
  spa: {
    type: 'spa',
    title: 'Spa e Massagem',
    themeColor: 'rose',
    terminology: {
      client: 'Cliente',
      service: 'Terapia',
      employee: 'Terapeuta',
      appointment: 'Sessão'
    },
    features: {
      hasAnamnesis: true,
      hasQueue: false,
      hasPackages: true
    }
  }
};

interface NicheState {
  currentNiche: NicheType;
  setNiche: (niche: NicheType) => void;
  getConfig: () => NicheConfig;
}

export const useNicheStore = create<NicheState>((set, get) => ({
  currentNiche: 'barbershop', // default
  setNiche: (niche) => set({ currentNiche: niche }),
  getConfig: () => NICHE_CONFIGS[get().currentNiche],
}));
