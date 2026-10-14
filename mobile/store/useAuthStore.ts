import { create } from 'zustand';

type Role = 'dono' | 'profissional' | 'cliente';

interface AuthState {
  role: Role;
  setRole: (role: Role) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  role: 'dono',
  setRole: (role) => set({ role }),
}));
