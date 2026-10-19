import { hasBellaSupabaseSession, bellaList, bellaInsert, bellaUpdate, bellaDelete } from '../lib/bellaOperational';
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
    if (hasBellaSupabaseSession()) { await bellaInsert('clients', client); set((s) => ({ clients: [...s.clients, client], isLoaded: true })); return; }
    const auth = getAuth();
    if (!auth.currentUser) {
      set((state) => ({ clients: [...state.clients, client], isLoaded: true }));
      return;
    }
    const clientData = { ...client, ownerId: auth.currentUser.uid };
    await setDoc(doc(db, 'clients', client.id), clientData);
  },
  updateClient: async (id, updates) => {
    if (hasBellaSupabaseSession()) { const current = useClientStore.getState().clients.find(x => x.id === id); if (!current) throw new Error('Cliente não encontrado'); const updated = { ...current, ...updates }; await bellaUpdate('clients', updated); set((s) => ({ clients: s.clients.map(x => x.id === id ? updated : x) })); return; }
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
    if (hasBellaSupabaseSession()) { await bellaDelete('clients', id); set(s => ({ clients: s.clients.filter(x => x.id !== id) })); return; }
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
  if (hasBellaSupabaseSession()) {
    let active = true;
    let busy = false;
    const refresh = async () => {
      if (!active || busy) return;
      busy = true;
      try { const rows = await bellaList<Client>('clients'); if (active) useClientStore.getState().setClients(rows); }
      catch (error) { console.error('Falha ao carregar clients do Supabase:', error); }
      finally { busy = false; }
    };
    void refresh();
    const timer = setInterval(refresh, 15000);
    return () => { active = false; clearInterval(timer); };
  }

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
