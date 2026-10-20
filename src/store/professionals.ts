import { create } from 'zustand';
import { collection, deleteDoc, doc, onSnapshot, query, setDoc, updateDoc, where } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { currentFirebaseTenantId } from '../lib/firebaseTenant';
import { useAuthStore } from './auth';

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
  commission: number;
  ownerId?: string;
};

interface ProfessionalStore {
  professionals: Professional[];
  setProfessionals: (professionals: Professional[]) => void;
  addProfessional: (professional: Professional) => Promise<void>;
  updateProfessional: (professional: Professional) => Promise<void>;
  deleteProfessional: (id: string) => Promise<void>;
}

function tenantForWrite(): string | null {
  const user = auth.currentUser;
  if (useAuthStore.getState().user?.isDemo) return null;
  if (!user || user.isAnonymous) throw new Error('Entre na conta para salvar profissionais.');
  const tenant = currentFirebaseTenantId();
  if (!tenant) throw new Error('Aguarde a identificação da empresa.');
  return tenant;
}

export const useProfessionalStore = create<ProfessionalStore>((set) => ({
  professionals: [],
  setProfessionals: (professionals) => set({ professionals }),
  addProfessional: async (professional) => {
    const ownerId = tenantForWrite();
    if (!ownerId) {
      set(state => ({ professionals: [...state.professionals, professional] }));
      return;
    }
    await setDoc(doc(db, 'professionals', professional.id), { ...professional, ownerId });
  },
  updateProfessional: async (professional) => {
    const ownerId = tenantForWrite();
    if (!ownerId) {
      set(state => ({ professionals: state.professionals.map(p => p.id === professional.id ? professional : p) }));
      return;
    }
    const { id, ownerId: _ignored, ...updates } = professional;
    await updateDoc(doc(db, 'professionals', id), updates);
  },
  deleteProfessional: async (id) => {
    const ownerId = tenantForWrite();
    if (!ownerId) {
      set(state => ({ professionals: state.professionals.filter(p => p.id !== id) }));
      return;
    }
    await deleteDoc(doc(db, 'professionals', id));
  }
}));

export function subscribeToProfessionals(): () => void {
  const user = auth.currentUser;
  const tenant = currentFirebaseTenantId();
  if (!user || user.isAnonymous || !tenant) return () => {};
  const q = query(collection(db, 'professionals'), where('ownerId', '==', tenant));
  return onSnapshot(q, snapshot => {
    useProfessionalStore.getState().setProfessionals(
      snapshot.docs.map(record => ({ ...record.data(), id: record.id } as Professional))
    );
  }, error => {
    console.error('Falha ao carregar profissionais:', error);
    useProfessionalStore.getState().setProfessionals([]);
  });
}
