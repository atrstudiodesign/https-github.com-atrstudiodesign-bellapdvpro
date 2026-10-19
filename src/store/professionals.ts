import { create } from 'zustand';

export type Professional = {
  id: string;
  name: string;
  role: string;
  email: string;
  phone: string;
  status: string;
  rating: number;
  services: number;
  revenue: number;
  commission: number; // Percentage, e.g., 50
};

interface ProfessionalStore {
  professionals: Professional[];
  setProfessionals: (professionals: Professional[]) => void;
}

export const useProfessionalStore = create<ProfessionalStore>((set) => ({
  professionals: [],
  setProfessionals: (professionals) => set({ professionals }),
}));
