import { create } from 'zustand';
import { db } from '../lib/firebase';
import { collection, doc, setDoc, updateDoc, deleteDoc, onSnapshot, query, where } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

export interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  location: string;
  lastVisit: string; // último atendimento
  lastService?: string; // serviço realizado
  lastProfessional?: string; // profissional
  totalSpent?: number; // valor gasto
  frequency?: number; // frequência
  avgTicket?: number; // ticket médio
  classification?: 'NOVO CLIENTE' | 'ATIVO' | 'VIP' | 'RISCO DE PERDA' | 'INATIVO'; // status
  score?: number; // score de 0 a 100
  birthday?: string; // data nascimento
  status: 'active' | 'inactive';
  tags: string[];
  aiScore: string;
  ownerId?: string;
  referralCode?: string;
  referredBy?: string;
  referredCount?: number;
  points?: number;
  loyaltyLevel?: 'Bronze' | 'Silver' | 'Gold' | 'Platinum';
}

interface ClientStore {
  clients: Client[];
  isLoaded: boolean;
  setClients: (clients: Client[]) => void;
  addClient: (client: Client) => Promise<void>;
  updateClient: (id: string, updates: Partial<Client>) => Promise<void>;
  deleteClient: (id: string) => Promise<void>;
}

export const useClientStore = create<ClientStore>((set) => ({
  clients: [],
  isLoaded: false,
  setClients: (clients) => set({ clients, isLoaded: true }),
  addClient: async (client) => {
    const auth = getAuth();
    if (!auth.currentUser) {
      set((state) => ({ clients: [...state.clients, client], isLoaded: true }));
      return;
    }
    const clientData = { ...client, ownerId: auth.currentUser.uid };
    await setDoc(doc(db, 'clients', client.id), clientData);
  },
  updateClient: async (id, updates) => {
    const auth = getAuth();
    if (!auth.currentUser) {
      set((state) => ({
        clients: state.clients.map((c) => (c.id === id ? { ...c, ...updates } : c)),
      }));
      return;
    }
    await updateDoc(doc(db, 'clients', id), updates);
  },
  deleteClient: async (id) => {
    const auth = getAuth();
    if (!auth.currentUser) {
      set((state) => ({
        clients: state.clients.filter((c) => c.id !== id),
      }));
      return;
    }
    await deleteDoc(doc(db, 'clients', id));
  }
}));

export const subscribeToClients = () => {
  const auth = getAuth();
  if (!auth.currentUser) return () => {};
  
  const q = query(collection(db, 'clients'), where('ownerId', '==', auth.currentUser.uid));
  return onSnapshot(q, (snapshot) => {
    const clients = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Client));
    useClientStore.getState().setClients(clients);
  }, (error) => {
    console.error('Error fetching clients:', error);
  });
};
