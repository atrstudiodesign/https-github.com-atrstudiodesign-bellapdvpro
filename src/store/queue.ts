import { currentFirebaseTenantId } from '../lib/firebaseTenant';
import { create } from 'zustand';
import { db } from '../lib/firebase';
import { collection, doc, setDoc, updateDoc, deleteDoc, onSnapshot, query, orderBy, where } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { toast } from 'sonner';
import { useAuthStore } from './auth';

export interface QueueItem {
  id: string;
  clientName: string;
  clientPhone?: string;
  serviceId: string;
  serviceName: string;
  status: 'waiting' | 'in_progress' | 'finished' | 'cancelled';
  timestamp: string; // ISO string
  estimatedWaitMinutes: number;
  professionalId: string; // e.g. "1", "2", "3" or "Sem Preferência"
  professionalName: string; // e.g. "João Silva", "Ana Souza", "Sem Preferência"
  ownerId?: string;
}

interface QueueStore {
  queueItems: QueueItem[];
  isLoaded: boolean;
  setQueueItems: (items: QueueItem[]) => void;
  addQueueItem: (item: Omit<QueueItem, 'id' | 'timestamp' | 'status'>) => Promise<string>;
  updateQueueItemStatus: (id: string, status: QueueItem['status']) => Promise<void>;
  deleteQueueItem: (id: string) => Promise<void>;
}

export const useQueueStore = create<QueueStore>((set) => ({
  queueItems: [],
  isLoaded: false,
  setQueueItems: (queueItems) => set({ queueItems, isLoaded: true }),
  
  addQueueItem: async (item) => {
    const auth = getAuth();
    const itemId = `q-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const timestamp = new Date().toISOString();
    
    // Resolve ownerId gracefully: use active uid (if logged in as non-anonymous merchant), or URL query parameter, or last known merchant uid from localStorage, or default
    const user = auth.currentUser;
    const isAnonymous = user?.isAnonymous;
    if ((!user || isAnonymous) && !useAuthStore.getState().user?.isDemo) {
      throw new Error('Fila pública indisponível até configurar um endpoint seguro para este estabelecimento.');
    }
    const urlParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
    const merchantParam = urlParams ? urlParams.get('merchant') : null;
    let ownerId = (user && !isAnonymous) ? currentFirebaseTenantId() || user.uid : (merchantParam || localStorage.getItem('last_merchant_uid') || 'public');
    
    const newQueueItem: QueueItem = {
      ...item,
      id: itemId,
      status: 'waiting',
      timestamp,
      ownerId
    };

    // ALWAYS write to Firestore to bypass auth for client-side selection
    if (isAnonymous || !user) {
      set((state) => ({ queueItems: [...state.queueItems, newQueueItem] }));
      return itemId;
    }
    try {
      await setDoc(doc(db, 'queue', itemId), newQueueItem);
      set((state) => ({ queueItems: [...state.queueItems, newQueueItem] }));
    } catch (error) {
      console.error('Error writing queue item to Firestore:', error);
      throw error;
    }

    return itemId;
  },

  updateQueueItemStatus: async (id, status) => {
    if (getAuth().currentUser?.isAnonymous) {
      set((state) => ({ queueItems: state.queueItems.map((item) => item.id === id ? { ...item, status } : item) }));
      return;
    }
    try {
      await updateDoc(doc(db, 'queue', id), { status });
      set((state) => ({
        queueItems: state.queueItems.map((item) => 
          item.id === id ? { ...item, status } : item
        )
      }));
    } catch (error) {
      console.error('Error updating queue item in Firestore:', error);
      throw error;
    }
  },

  deleteQueueItem: async (id) => {
    if (getAuth().currentUser?.isAnonymous) {
      set((state) => ({ queueItems: state.queueItems.filter((item) => item.id !== id) }));
      return;
    }
    try {
      await deleteDoc(doc(db, 'queue', id));
      set((state) => ({
        queueItems: state.queueItems.filter((item) => item.id !== id)
      }));
    } catch (error) {
      console.error('Error deleting queue item from Firestore:', error);
      throw error;
    }
  }
}));

// Setup automatic listener for real-time sync with Firestore
export const subscribeToQueue = () => {
  const auth = getAuth();
  if (!auth.currentUser) return () => {};

  const q = query(collection(db, 'queue'), where('ownerId', '==', currentFirebaseTenantId() || auth.currentUser.uid));
  return onSnapshot(q, (snapshot) => {
    const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as QueueItem));
    
    // Sort items by timestamp (oldest first for a queue FIFO)
    const sortedItems = [...items].sort((a, b) => {
      return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
    });
    
    useQueueStore.getState().setQueueItems(sortedItems);
  }, (error) => {
    console.error('Error fetching queue real-time:', error);
  });
};
