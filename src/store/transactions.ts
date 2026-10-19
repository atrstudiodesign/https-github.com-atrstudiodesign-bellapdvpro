import { currentFirebaseTenantId } from '../lib/firebaseTenant';
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
    const auth = getAuth();
    if (!auth.currentUser) {
      set((state) => ({ transactions: [transaction, ...state.transactions], isLoaded: true }));
    } else {
      const data = { ...transaction, ownerId: currentFirebaseTenantId() || auth.currentUser.uid };
      await setDoc(doc(db, 'transactions', transaction.id), data);
    }
  },
  updateTransaction: async (id, updates) => {
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
  const auth = getAuth();
  if (!auth.currentUser) return () => {};
  
  // Notice we must index if we use orderBy, so we'll just sort client-side or use basic where.
  const q = query(collection(db, 'transactions'), where('ownerId', '==', currentFirebaseTenantId() || auth.currentUser.uid));
  return onSnapshot(q, (snapshot) => {
    const transactions = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Transaction));
    // Sort descending by date locally to avoid composite index requirements
    transactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    useTransactionStore.getState().setTransactions(transactions);
  }, (error) => {
    console.error('Error fetching transactions:', error);
  });
};
