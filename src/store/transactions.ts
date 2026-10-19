import { currentFirebaseTenantId } from '../lib/firebaseTenant';
import { create } from 'zustand';
import { db } from '../lib/firebase';
import { collection, doc, updateDoc, onSnapshot, query, where, runTransaction } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

export interface TransactionItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  professionalId?: string;
  category?: string;
  type?: 'service' | 'product';
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
    if (!auth.currentUser || auth.currentUser.isAnonymous) {
      set((state) => ({ transactions: [transaction, ...state.transactions], isLoaded: true }));
      return;
    }

    const tenantId = currentFirebaseTenantId() || auth.currentUser.uid;
    const transactionRef = doc(db, 'transactions', transaction.id);

    await runTransaction(db, async (firestoreTx) => {
      const existingSale = await firestoreTx.get(transactionRef);
      if (existingSale.exists()) {
        throw new Error('Venda duplicada detectada. A operação não foi repetida.');
      }

      const stockUpdates: Array<{ ref: ReturnType<typeof doc>; nextStock: number }> = [];
      for (const item of transaction.items) {
        if (item.type !== 'product') continue;

        const catalogRef = doc(db, 'catalog', item.id);
        const catalogSnapshot = await firestoreTx.get(catalogRef);
        if (!catalogSnapshot.exists()) {
          throw new Error(`Produto "${item.name}" não encontrado no catálogo.`);
        }

        const catalogData = catalogSnapshot.data();
        if (catalogData.ownerId !== tenantId) {
          throw new Error('Produto pertence a outra empresa.');
        }

        const currentStock = Number(catalogData.stock);
        if (!Number.isFinite(currentStock)) {
          throw new Error(`Estoque inválido para "${item.name}".`);
        }

        const nextStock = currentStock - item.quantity;
        if (nextStock < 0) {
          throw new Error(`Estoque insuficiente para "${item.name}". Disponível: ${currentStock}.`);
        }

        stockUpdates.push({ ref: catalogRef, nextStock });
      }

      for (const update of stockUpdates) {
        firestoreTx.update(update.ref, { stock: update.nextStock });
      }

      firestoreTx.set(transactionRef, { ...transaction, ownerId: tenantId });
    });
  },
  updateTransaction: async (id, updates) => {
    const auth = getAuth();
    if (!auth.currentUser || auth.currentUser.isAnonymous) {
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
