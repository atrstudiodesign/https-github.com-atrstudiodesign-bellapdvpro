import { currentFirebaseTenantId } from '../lib/firebaseTenant';
import { create } from 'zustand';
import { auth, db } from '../lib/firebase';
import { collection, doc, setDoc, updateDoc, deleteDoc, onSnapshot, query, where, getDocs } from 'firebase/firestore';

export interface CatalogItem {
  id: string;
  name: string;
  category: string;
  price: number;
  type: 'service' | 'product';
  duration?: string;
  stock?: number;
  ownerId?: string;
}

interface CatalogStore {
  items: CatalogItem[];
  isLoaded: boolean;
  setItems: (items: CatalogItem[]) => void;
  addItem: (item: CatalogItem) => Promise<void>;
  updateItem: (id: string, updates: Partial<CatalogItem>) => Promise<void>;
  deleteItem: (id: string) => Promise<void>;
  seedCatalog: (nicheType: string) => Promise<void>;
}

export const useCatalogStore = create<CatalogStore>((set) => ({
  items: [],
  isLoaded: false,
  setItems: (items) => set({ items, isLoaded: true }),
  addItem: async (item) => {
    if (!auth.currentUser) {
      set((state) => ({ items: [...state.items, item], isLoaded: true }));
      return;
    }
    const itemData = { ...item, ownerId: currentFirebaseTenantId() || auth.currentUser.uid };
    await setDoc(doc(db, 'catalog', item.id), itemData);
  },
  updateItem: async (id, updates) => {
    if (!auth.currentUser) {
      set((state) => ({
        items: state.items.map((i) => (i.id === id ? { ...i, ...updates } : i)),
      }));
      return;
    }
    await updateDoc(doc(db, 'catalog', id), updates);
  },
  deleteItem: async (id) => {
    if (!auth.currentUser) {
      set((state) => ({
        items: state.items.filter((i) => i.id !== id),
      }));
      return;
    }
    await deleteDoc(doc(db, 'catalog', id));
  },
  seedCatalog: async (nicheType) => {
    const uid = auth.currentUser?.uid;
    
    const defaults: Record<string, CatalogItem[]> = {
      barbershop: [
        { id: 'b-s1', name: 'Corte Degradê Moderno', category: 'Cabelo', price: 45.00, duration: '45 min', type: 'service' },
        { id: 'b-s2', name: 'Barba Toalha Quente', category: 'Barba', price: 35.00, duration: '30 min', type: 'service' },
        { id: 'b-s3', name: 'Combo Corte + Barba Premium', category: 'Combo', price: 70.00, duration: '1h 15min', type: 'service' },
        { id: 'b-s4', name: 'Sobrancelha na Navalha', category: 'Estética', price: 15.00, duration: '15 min', type: 'service' },
        { id: 'b-p1', name: 'Pomada Modeladora Matte', category: 'Finalizadores', price: 55.00, stock: 15, type: 'product' },
        { id: 'b-p2', name: 'Óleo Hidratante de Barba', category: 'Cuidados', price: 40.00, stock: 8, type: 'product' }
      ],
      clinic: [
        { id: 'c-s1', name: 'Limpeza de Pele Profunda', category: 'Facial', price: 120.00, duration: '60 min', type: 'service' },
        { id: 'c-s2', name: 'Drenagem Linfática Corporal', category: 'Corporal', price: 150.00, duration: '50 min', type: 'service' },
        { id: 'c-s3', name: 'Peeling Químico Express', category: 'Facial', price: 190.00, duration: '45 min', type: 'service' },
        { id: 'c-s4', name: 'Aplicação de Botox Estético', category: 'Injetáveis', price: 800.00, duration: '30 min', type: 'service' },
        { id: 'c-p1', name: 'Sérum Facial Vitamina C', category: 'Skincare', price: 110.00, stock: 12, type: 'product' },
        { id: 'c-p2', name: 'Protetor Solar FPS 70 Toque Seco', category: 'Proteção', price: 90.00, stock: 20, type: 'product' }
      ],
      salon: [
        { id: 's-s1', name: 'Corte Feminino Premium', category: 'Cabelo', price: 120.00, duration: '45 min', type: 'service' },
        { id: 's-s2', name: 'Escova + Hidratação Profunda', category: 'Cabelo', price: 110.00, duration: '60 min', type: 'service' },
        { id: 's-s3', name: 'Pé e Mão Completo', category: 'Estética de Unhas', price: 75.00, duration: '75 min', type: 'service' },
        { id: 's-s4', name: 'Mechas / Luzes Modernas', category: 'Química', price: 350.00, duration: '180 min', type: 'service' },
        { id: 's-p1', name: 'Óleo Finalizador Argan Gold', category: 'Finalizadores', price: 140.00, stock: 10, type: 'product' },
        { id: 's-p2', name: 'Máscara de Nutrição Intensa', category: 'Tratamento', price: 95.00, stock: 6, type: 'product' }
      ],
      tattoo: [
        { id: 't-s1', name: 'Sessão Flash Art (Até 7cm)', category: 'Tatuagem', price: 180.00, duration: '60 min', type: 'service' },
        { id: 't-s2', name: 'Piercing Orelha de Titânio', category: 'Piercing', price: 90.00, duration: '20 min', type: 'service' },
        { id: 't-s3', name: 'Sessão Body Art Média (Até 15cm)', category: 'Tatuagem', price: 400.00, duration: '120 min', type: 'service' },
        { id: 't-p1', name: 'Pomada Cicatrizante Premium', category: 'Pós-Tattoo', price: 45.00, stock: 30, type: 'product' },
        { id: 't-p2', name: 'Sabonete Antisséptico Suave', category: 'Limpeza', price: 25.00, stock: 15, type: 'product' }
      ],
      spa: [
        { id: 'sp-s1', name: 'Massagem Relaxante Clássica', category: 'Massagens', price: 160.00, duration: '50 min', type: 'service' },
        { id: 'sp-s2', name: 'Terapia de Pedras Quentes', category: 'Massagens', price: 210.00, duration: '80 min', type: 'service' },
        { id: 'sp-s3', name: 'Banho Inovador de Ofurô de Lavanda', category: 'Banhos', price: 250.00, duration: '60 min', type: 'service' },
        { id: 'sp-p1', name: 'Óleo Essencial Puro de Lavanda', category: 'Aromaterapia', price: 65.00, stock: 15, type: 'product' },
        { id: 'sp-p2', name: 'Incenso Orgânico Sândalo', category: 'Bem-Estar', price: 30.00, stock: 40, type: 'product' }
      ]
    };

    const targetList = defaults[nicheType] || defaults.barbershop;
    const itemsToSet: CatalogItem[] = [];

    for (const rawItem of targetList) {
      const randomSuffix = Math.random().toString(36).substring(2, 7);
      const generatedId = `${rawItem.id}-${Date.now()}-${randomSuffix}`;
      const itemData: CatalogItem = {
        ...rawItem,
        id: generatedId,
        ownerId: uid || 'public'
      };
      
      if (uid) {
        await setDoc(doc(db, 'catalog', generatedId), itemData);
      }
      itemsToSet.push(itemData);
    }

    set({ items: itemsToSet, isLoaded: true });
  }
}));

export const subscribeToCatalog = () => {
  if (!auth.currentUser) return () => {};
  
  const q = query(collection(db, 'catalog'), where('ownerId', '==', currentFirebaseTenantId() || auth.currentUser.uid));
  return onSnapshot(q, (snapshot) => {
    const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as CatalogItem));
    useCatalogStore.getState().setItems(items);
  }, (error) => {
    console.error('Error fetching catalog:', error);
  });
};
