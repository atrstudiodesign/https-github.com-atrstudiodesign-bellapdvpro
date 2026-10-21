import { create } from 'zustand';
import { useAuthStore } from '../store/auth';
import { useClientStore, Client } from '../store/clients';
import { useCatalogStore, CatalogItem } from '../store/catalog';
import { useAppointmentStore, Appointment } from '../store/appointments';
import { useTransactionStore, Transaction } from '../store/transactions';
import { useProfessionalStore, Professional } from '../store/professionals';
import { useQueueStore, QueueItem } from '../store/queue';
import { toast } from 'sonner';

interface DemoModalState {
  isModalOpen: boolean;
  featureAttempted: string | null;
  openDemoModal: (featureAttempted?: string) => void;
  closeDemoModal: () => void;
}

export const useDemoModalStore = create<DemoModalState>((set) => ({
  isModalOpen: false,
  featureAttempted: null,
  openDemoModal: (featureAttempted = 'Acesso Completo ao BellaPDV Pro') => {
    set({ isModalOpen: true, featureAttempted });
  },
  closeDemoModal: () => {
    set({ isModalOpen: false, featureAttempted: null });
  }
}));

export const DEMO_CLIENTS: Client[] = [
  {
    id: 'demo-c1',
    name: 'Carlos Eduardo Silva',
    email: 'carlos.silva@email.com',
    phone: '(11) 98765-4321',
    location: 'São Paulo, SP',
    lastVisit: 'Hoje às 14:30',
    lastService: 'Corte Degradê + Barba Alinhada',
    lastProfessional: 'Rodrigo Cortes',
    totalSpent: 420.00,
    frequency: 14,
    avgTicket: 70.00,
    classification: 'VIP',
    score: 95,
    status: 'active',
    tags: ['Cliente Fiel', 'Cerveja Artesanal', 'Degradê'],
    aiScore: '95/100 • Altíssima Fidelidade',
    points: 380,
    loyaltyLevel: 'Gold'
  },
  {
    id: 'demo-c2',
    name: 'Lucas Ferreira Mendes',
    email: 'lucas.mendes@email.com',
    phone: '(11) 97654-3210',
    location: 'São Paulo, SP',
    lastVisit: 'Ontem às 18:00',
    lastService: 'Barba Terapia com Toalha Quente',
    lastProfessional: 'Gabriel Navalha',
    totalSpent: 280.00,
    frequency: 21,
    avgTicket: 55.00,
    classification: 'ATIVO',
    score: 82,
    status: 'active',
    tags: ['Barba Longa', 'Toalha Quente'],
    aiScore: '82/100 • Cliente Regular',
    points: 190,
    loyaltyLevel: 'Silver'
  },
  {
    id: 'demo-c3',
    name: 'Marcelo Augusto Prado',
    email: 'marcelo.prado@email.com',
    phone: '(11) 96543-2109',
    location: 'São Paulo, SP',
    lastVisit: 'Há 18 dias',
    lastService: 'Corte Clássico na Tesoura',
    lastProfessional: 'Rodrigo Cortes',
    totalSpent: 160.00,
    frequency: 30,
    avgTicket: 50.00,
    classification: 'RISCO DE PERDA',
    score: 45,
    status: 'active',
    tags: ['Retorno Pendente', 'Tesoura'],
    aiScore: '45/100 • Recomenda-se Lembrete WhatsApp',
    points: 90,
    loyaltyLevel: 'Bronze'
  },
  {
    id: 'demo-c4',
    name: 'Bruno Henrique Souza',
    email: 'bruno.souza@email.com',
    phone: '(11) 95432-1098',
    location: 'São Paulo, SP',
    lastVisit: 'Há 3 dias',
    lastService: 'Combo Premium Corte + Barba + Sobrancelha',
    lastProfessional: 'Gabriel Navalha',
    totalSpent: 650.00,
    frequency: 10,
    avgTicket: 85.00,
    classification: 'VIP',
    score: 98,
    status: 'active',
    tags: ['VIP Especial', 'Clube Fidelidade', 'Pontual'],
    aiScore: '98/100 • Top 5% Faturamento',
    points: 520,
    loyaltyLevel: 'Platinum'
  }
];

export const DEMO_CATALOG: CatalogItem[] = [
  { id: 'cat-1', name: 'Corte Degradê Navalhado', price: 45.00, category: 'Cabelo', duration: '45 min', type: 'service' },
  { id: 'cat-2', name: 'Barba Terapia com Toalha Quente', price: 35.00, category: 'Barba', duration: '30 min', type: 'service' },
  { id: 'cat-3', name: 'Combo Corte + Barba VIP', price: 70.00, category: 'Combo', duration: '1h 15min', type: 'service' },
  { id: 'cat-4', name: 'Sobrancelha na Navalha', price: 15.00, category: 'Estética', duration: '15 min', type: 'service' },
  { id: 'cat-5', name: 'Pigmentação de Barba', price: 40.00, category: 'Barba', duration: '30 min', type: 'service' },
  { id: 'cat-6', name: 'Pomada Matte Efeito Seco 100g', price: 45.00, category: 'Produtos', stock: 18, type: 'product' },
  { id: 'cat-7', name: 'Óleo para Barba Hidratante 30ml', price: 38.00, category: 'Produtos', stock: 12, type: 'product' },
  { id: 'cat-8', name: 'Shampoo Mentolado Refrescante 250ml', price: 42.00, category: 'Produtos', stock: 9, type: 'product' }
];

export const DEMO_PROFESSIONALS: Professional[] = [
  { id: 'pro-1', name: 'Rodrigo Cortes (Master Barber)', email: 'rodrigo@barbearia.com', phone: '(11) 98888-1111', role: 'Barbeiro Master', commissionRate: 50, active: true },
  { id: 'pro-2', name: 'Gabriel Navalha', email: 'gabriel@barbearia.com', phone: '(11) 98888-2222', role: 'Especialista em Barba', commissionRate: 45, active: true },
  { id: 'pro-3', name: 'Matheus Estilo', email: 'matheus@barbearia.com', phone: '(11) 98888-3333', role: 'Barbeiro Jr.', commissionRate: 40, active: true }
];

export const DEMO_APPOINTMENTS: Appointment[] = [
  {
    id: 'app-1',
    clientName: 'Carlos Eduardo Silva',
    clientPhone: '(11) 98765-4321',
    service: 'Corte Degradê + Barba Alinhada',
    date: new Date().toISOString().split('T')[0],
    time: '14:30',
    status: 'confirmed',
    professionalId: 'pro-1',
    price: 70.00
  },
  {
    id: 'app-2',
    clientName: 'Bruno Henrique Souza',
    clientPhone: '(11) 95432-1098',
    service: 'Combo Premium Corte + Barba',
    date: new Date().toISOString().split('T')[0],
    time: '16:00',
    status: 'pending',
    professionalId: 'pro-2',
    price: 70.00
  },
  {
    id: 'app-3',
    clientName: 'Lucas Ferreira Mendes',
    clientPhone: '(11) 97654-3210',
    service: 'Barba Terapia com Toalha Quente',
    date: new Date().toISOString().split('T')[0],
    time: '17:30',
    status: 'completed',
    professionalId: 'pro-1',
    price: 35.00
  }
];

export const DEMO_TRANSACTIONS: Transaction[] = [
  {
    id: 'tx-1',
    total: 70.00,
    paymentMethod: 'pix',
    status: 'completed',
    createdAt: new Date().toISOString(),
    items: [
      { id: 'cat-3', name: 'Combo Corte + Barba VIP', price: 70.00, quantity: 1, category: 'Combo', type: 'service' }
    ]
  },
  {
    id: 'tx-2',
    total: 80.00,
    paymentMethod: 'card',
    status: 'completed',
    createdAt: new Date(Date.now() - 3600000).toISOString(),
    items: [
      { id: 'cat-1', name: 'Corte Degradê Navalhado', price: 45.00, quantity: 1, category: 'Cabelo', type: 'service' },
      { id: 'cat-2', name: 'Barba Terapia', price: 35.00, quantity: 1, category: 'Barba', type: 'service' }
    ]
  },
  {
    id: 'tx-3',
    total: 45.00,
    paymentMethod: 'cash',
    status: 'completed',
    createdAt: new Date(Date.now() - 7200000).toISOString(),
    items: [
      { id: 'cat-6', name: 'Pomada Matte Efeito Seco', price: 45.00, quantity: 1, category: 'Produtos', type: 'product' }
    ]
  }
];

export const DEMO_QUEUE: QueueItem[] = [
  {
    id: 'q-1',
    clientName: 'Felipe Santos',
    service: 'Corte Degradê Navalhado',
    professional: 'Rodrigo Cortes',
    status: 'in-service',
    arrivalTime: '14:15',
    notes: 'Degradê baixo com risco lateral'
  },
  {
    id: 'q-2',
    clientName: 'Thiago Martins',
    service: 'Barba Terapia',
    professional: 'Gabriel Navalha',
    status: 'waiting',
    arrivalTime: '14:25',
    notes: 'Toalha bem quente'
  }
];

export function startInstantDemoSession(): void {
  // 1. Instant auth login with demo flag
  useAuthStore.getState().login(
    {
      id: 'demo-guest-user',
      name: 'Barbearia Modelo (Demo)',
      email: 'demo@bellapdv.com',
      role: 'client',
      isPlatformAdmin: false,
      isDemo: true,
      planFeatures: ['pdv', 'agenda', 'crm', 'ia', 'automacoes', 'relatorios', 'whatsapp', 'marketplace']
    },
    'demo-session-token',
    {
      id: 'demo-company-1',
      name: 'Barbearia Modelo VIP',
      niche: 'barbearia'
    }
  );

  // 2. Pre-fill mock data synchronously (0ms wait)
  useClientStore.getState().setClients(DEMO_CLIENTS);
  useCatalogStore.getState().setItems(DEMO_CATALOG);
  useAppointmentStore.getState().setAppointments(DEMO_APPOINTMENTS);
  useTransactionStore.getState().setTransactions(DEMO_TRANSACTIONS);
  useProfessionalStore.getState().setProfessionals(DEMO_PROFESSIONALS);
  useQueueStore.getState().setQueueItems(DEMO_QUEUE);
}
