import { hasBellaSupabaseSession, bellaList, bellaInsert, bellaUpdate, bellaDelete } from '../lib/bellaOperational';
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
    if (hasBellaSupabaseSession()) { await bellaInsert('appointments', appointment); set(s => ({ appointments: [...s.appointments, appointment], isLoaded: true })); return; }
    const auth = getAuth();
    const urlParams = new URLSearchParams(window.location.search);
    const user = auth.currentUser;
    const isAnonymous = user?.isAnonymous;
    const ownerId = (user && !isAnonymous) ? user.uid : (urlParams.get('merchant') || localStorage.getItem('last_merchant_uid') || 'public');
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
    if (hasBellaSupabaseSession()) { const current = useAppointmentStore.getState().appointments.find(x => x.id === id); if (!current) throw new Error('Agendamento não encontrado'); const updated = { ...current, ...updates }; await bellaUpdate('appointments', updated); set(s => ({ appointments: s.appointments.map(x => x.id === id ? updated : x) })); return; }
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
    if (hasBellaSupabaseSession()) { await bellaDelete('appointments', id); set(s => ({ appointments: s.appointments.filter(x => x.id !== id) })); return; }
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
  if (hasBellaSupabaseSession()) {
    let active = true;
    let busy = false;
    const refresh = async () => {
      if (!active || busy) return;
      busy = true;
      try { const rows = await bellaList<Appointment>('appointments'); if (active) useAppointmentStore.getState().setAppointments(rows); }
      catch (error) { console.error('Falha ao carregar appointments do Supabase:', error); }
      finally { busy = false; }
    };
    void refresh();
    const timer = setInterval(refresh, 15000);
    return () => { active = false; clearInterval(timer); };
  }

  const auth = getAuth();
  if (!auth.currentUser) return () => {};
  
  const q = query(collection(db, 'appointments'), where('ownerId', '==', auth.currentUser.uid));
  return onSnapshot(q, (snapshot) => {
    const appointments = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Appointment));
    useAppointmentStore.getState().setAppointments(appointments);
  }, (error) => {
    console.error('Error fetching appointments:', error);
  });
};
