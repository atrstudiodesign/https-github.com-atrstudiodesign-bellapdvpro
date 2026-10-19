import { hasBellaSupabaseSession, bellaList, bellaInsert, bellaUpdate, bellaDelete } from '../lib/bellaOperational';
import { create } from 'zustand';
import { db } from '../lib/firebase';
import { collection, doc, setDoc, updateDoc, deleteDoc, onSnapshot, query, where, orderBy } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

export interface TransactionItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  professionalId?: string;
  category?: string;
}

export interface Transaction {
  id: string;
  total: number;
  paymentMethod: 'pix' | 'card' | 'cash' | 'split';
  status: 'completed' | 'pending' | 'cancelled';
  items: TransactionItem[];
  date: string;
  ownerId?: string;
}

interface TransactionStore {
  transactions: Transaction[];
  isLoaded: boolean;
  setTransactions: (transactions: Transaction[]) => void;
  addTransaction: (transaction: Transaction) => Promise<void>;
  updateTransaction: (id: string, updates: Partial<Transaction>) => Promise<void>;
}

export const useTransactionStore = create<TransactionStore>((set) => ({
  transactions: [],
  isLoaded: false,
  setTransactions: (transactions) => set({ transactions, isLoaded: true }),
  addTransaction: async (transaction) => {
    if (hasBellaSupabaseSession()) { await bellaInsert('transactions', transaction); set(s => ({ transactions: [transaction, ...s.transactions], isLoaded: true })); return; }
    const auth = getAuth();
    if (!auth.currentUser) {
      set((state) => ({ transactions: [transaction, ...state.transactions], isLoaded: true }));
    } else {
      const data = { ...transaction, ownerId: auth.currentUser.uid };
      await setDoc(doc(db, 'transactions', transaction.id), data);
    }
  },
  updateTransaction: async (id, updates) => {
    if (hasBellaSupabaseSession()) { const current = useTransactionStore.getState().transactions.find(x => x.id === id); if (!current) throw new Error('Venda não encontrada'); const updated = { ...current, ...updates }; await bellaUpdate('transactions', updated); set(s => ({ transactions: s.transactions.map(x => x.id === id ? updated : x) })); return; }
    const auth = getAuth();
    if (!auth.currentUser) {
      set((state) => ({
        transactions: state.transactions.map((t) => (t.id === id ? { ...t, ...updates } : t)),
      }));
    } else {
      await updateDoc(doc(db, 'transactions', id), updates);
    }
  }
}));

export const subscribeToTransactions = () => {
  if (hasBellaSupabaseSession()) {
    let active = true;
    let busy = false;
    const refresh = async () => {
      if (!active || busy) return;
      busy = true;
      try { const rows = await bellaList<Transaction>('transactions'); if (active) useTransactionStore.getState().setTransactions(rows); }
      catch (error) { console.error('Falha ao carregar transactions do Supabase:', error); }
      finally { busy = false; }
    };
    void refresh();
    const timer = setInterval(refresh, 15000);
    return () => { active = false; clearInterval(timer); };
  }

  const auth = getAuth();
  if (!auth.currentUser) return () => {};
  
  // Notice we must index if we use orderBy, so we'll just sort client-side or use basic where.
  const q = query(collection(db, 'transactions'), where('ownerId', '==', auth.currentUser.uid));
  return onSnapshot(q, (snapshot) => {
    const transactions = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Transaction));
    // Sort descending by date locally to avoid composite index requirements
    transactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    useTransactionStore.getState().setTransactions(transactions);
  }, (error) => {
    console.error('Error fetching transactions:', error);
  });
};
