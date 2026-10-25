import { currentFirebaseTenantId } from '../lib/firebaseTenant';
import { create } from 'zustand';
import { db } from '../lib/firebase';
import { collection, doc, setDoc, updateDoc, deleteDoc, onSnapshot, query, where } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { toast } from 'sonner';
import { useAuthStore } from './auth';

export interface Appointment {
  id: string;
  client: string;
  service: string;
  employee: string;
  time: string;
  date?: string; 
  status: 'confirmed' | 'pending' | 'cancelled' | 'completed';
  ownerId?: string;
  clientPhone?: string; // Adding for WhatsApp
  source?: 'pos' | 'online_marketplace';
  bookingCode?: string;
}

interface AppointmentStore {
  appointments: Appointment[];
  isLoaded: boolean;
  setAppointments: (appointments: Appointment[]) => void;
  addAppointment: (appointment: Appointment) => Promise<void>;
  updateAppointment: (id: string, updates: Partial<Appointment>) => Promise<void>;
  deleteAppointment: (id: string) => Promise<void>;
}

export const useAppointmentStore = create<AppointmentStore>((set) => ({
  appointments: [],
  isLoaded: false,
  setAppointments: (appointments) => set({ appointments, isLoaded: true }),
  addAppointment: async (appointment) => {
    const auth = getAuth();
    const urlParams = new URLSearchParams(window.location.search);
    const user = auth.currentUser;
    const isAnonymous = user?.isAnonymous;
    if ((!user || isAnonymous) && !useAuthStore.getState().user?.isDemo) {
      throw new Error('Agendamento público indisponível até configurar um endpoint seguro para este estabelecimento.');
    }
    const ownerId = (user && !isAnonymous) ? currentFirebaseTenantId() || user.uid : (urlParams.get('merchant') || localStorage.getItem('last_merchant_uid') || 'public');
    const data = { ...appointment, ownerId };

    if (ownerId !== 'public' && !isAnonymous) {
      await setDoc(doc(db, 'appointments', appointment.id), data);
    }
    set((state) => ({ appointments: [...state.appointments, data], isLoaded: true }));

  },
  updateAppointment: async (id, updates) => {
    const auth = getAuth();
    if (!auth.currentUser || auth.currentUser.isAnonymous) {
      set((state) => ({
        appointments: state.appointments.map((a) => (a.id === id ? { ...a, ...updates } : a)),
      }));
    } else {
      await updateDoc(doc(db, 'appointments', id), updates);
    }
    
  },
  deleteAppointment: async (id) => {
    const auth = getAuth();
    if (!auth.currentUser || auth.currentUser.isAnonymous) {
      set((state) => ({
        appointments: state.appointments.filter((a) => a.id !== id),
      }));
    } else {
      await deleteDoc(doc(db, 'appointments', id));
    }
  }
}));

export const subscribeToAppointments = () => {
  const auth = getAuth();
  if (!auth.currentUser) return () => {};
  
  const tenant = currentFirebaseTenantId() || auth.currentUser.uid;
  const qLocal = query(collection(db, 'appointments'), where('ownerId', '==', tenant));
  const qPublic = query(collection(db, 'public_bookings'), where('ownerId', '==', tenant));

  let localApps: Appointment[] = [];
  let publicApps: Appointment[] = [];

  const mergeAndSet = () => {
    const map = new Map<string, Appointment>();
    for (const app of localApps) map.set(app.id, app);
    for (const app of publicApps) map.set(app.id, app);
    const combined = Array.from(map.values()).sort((a, b) => {
      const dA = (a.date || '') + ' ' + (a.time || '');
      const dB = (b.date || '') + ' ' + (b.time || '');
      return dA.localeCompare(dB);
    });
    useAppointmentStore.getState().setAppointments(combined);
  };

  const unsubLocal = onSnapshot(qLocal, (snapshot) => {
    localApps = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Appointment));
    mergeAndSet();
  }, (error) => {
    console.error('Error fetching internal appointments:', error);
  });

  const unsubPublic = onSnapshot(qPublic, (snapshot) => {
    publicApps = snapshot.docs.map(d => {
      const v = d.data();
      return {
        id: d.id,
        client: v.clientName || 'Cliente Online',
        service: v.serviceName || 'Serviço',
        employee: v.professionalName || 'Qualquer profissional',
        time: v.time,
        date: v.date,
        status: v.status || 'confirmed',
        ownerId: v.ownerId,
        clientPhone: v.clientPhone,
        source: 'online_marketplace',
        bookingCode: v.bookingCode
      } as Appointment;
    });
    mergeAndSet();
  }, (error) => {
    // Graceful fallback if public_bookings collection is empty or not yet provisioned
    console.warn('Public bookings listener notice:', error?.message);
  });

  return () => {
    unsubLocal();
    unsubPublic();
  };
};
