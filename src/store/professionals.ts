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
  professionals: [
    { id: '1', name: 'João Silva', role: 'Barbeiro Sênior', email: 'joao@email.com', phone: '(11) 99999-9999', status: 'active', rating: 4.9, services: 1240, revenue: 5430, commission: 50 },
    { id: '2', name: 'Marcos Paulo', role: 'Barbeiro', email: 'marcos@email.com', phone: '(11) 98888-8888', status: 'active', rating: 4.7, services: 856, revenue: 3210, commission: 40 },
    { id: '3', name: 'Ana Souza', role: 'Manicure', email: 'ana@email.com', phone: '(11) 97777-7777', status: 'away', rating: 4.8, services: 420, revenue: 1500, commission: 60 },
  ],
  setProfessionals: (professionals) => set({ professionals }),
}));
