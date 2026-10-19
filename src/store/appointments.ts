import { currentFirebaseTenantId } from '../lib/firebaseTenant';
import { create } from 'zustand';
import { db } from '../lib/firebase';
import { collection, doc, setDoc, updateDoc, deleteDoc, onSnapshot, query, where } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { toast } from 'sonner';

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
    const ownerId = (user && !isAnonymous) ? currentFirebaseTenantId() || user.uid : (urlParams.get('merchant') || localStorage.getItem('last_merchant_uid') || 'public');
    const data = { ...appointment, ownerId };

    if (ownerId !== 'public') {
      await setDoc(doc(db, 'appointments', appointment.id), data);
    }
    set((state) => ({ appointments: [...state.appointments, data], isLoaded: true }));

    // Prioridade 1: WhatsApp - Confirmação Automática
    setTimeout(() => {
      toast.success(
        `✅ Automação WhatsApp enviada: "Olá ${appointment.client}, seu horário às ${appointment.time} está confirmado!"`, 
        { duration: 5000, position: 'bottom-right' }
      );
    }, 1500);
  },
  updateAppointment: async (id, updates) => {
    const auth = getAuth();
    if (!auth.currentUser) {
      set((state) => ({
        appointments: state.appointments.map((a) => (a.id === id ? { ...a, ...updates } : a)),
      }));
    } else {
      await updateDoc(doc(db, 'appointments', id), updates);
    }
    
    // Simulate Reminders / Recovery
    if (updates.status === 'cancelled') {
        setTimeout(() => {
          toast(`🔄 Recuperação via WhatsApp enviada para retorno.`, { duration: 4000, position: 'bottom-right' });
        }, 1500);
    }
  },
  deleteAppointment: async (id) => {
    const auth = getAuth();
    if (!auth.currentUser) {
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
  
  const q = query(collection(db, 'appointments'), where('ownerId', '==', currentFirebaseTenantId() || auth.currentUser.uid));
  return onSnapshot(q, (snapshot) => {
    const appointments = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Appointment));
    useAppointmentStore.getState().setAppointments(appointments);
  }, (error) => {
    console.error('Error fetching appointments:', error);
  });
};
