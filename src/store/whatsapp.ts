import { create } from 'zustand';
import { whatsappService, WhatsappSessionStatus, WhatsappMessageLog } from '../services/whatsappService';
import { toast } from 'sonner';

interface WhatsAppStoreState {
  status: 'DISCONNECTED' | 'LOADING' | 'QRCODE_READY' | 'CONNECTED';
  qrCode: string | null;
  pairingCode: string | null;
  expiresIn: number;
  phone: string;
  businessName: string;
  provider: 'Evolution' | 'MetaCloud' | 'Z-API' | 'BellaGateway';
  connectedAt: string | null;
  logs: WhatsappMessageLog[];
  queue: Array<{ id: string; recipient: string; text: string; scheduled: string }>;
  isModalOpen: boolean;
  
  // Actions
  setModalOpen: (open: boolean) => void;
  setPhone: (phone: string) => void;
  setProvider: (provider: 'Evolution' | 'MetaCloud' | 'Z-API' | 'BellaGateway') => void;
  startSession: (config?: { evolutionUrl?: string; evolutionKey?: string }) => Promise<void>;
  checkStatus: () => Promise<WhatsappSessionStatus>;
  confirmConnection: () => Promise<boolean>;
  disconnectSession: () => Promise<void>;
  sendTestMessage: (targetPhone: string) => Promise<boolean>;
  sendMessage: (to: string, text: string) => Promise<{ success: boolean; messageId?: string; error?: string }>;
  refreshLogs: () => Promise<void>;
}

export const useWhatsAppStore = create<WhatsAppStoreState>((set, get) => ({
  status: 'DISCONNECTED',
  qrCode: null,
  pairingCode: null,
  expiresIn: 60,
  phone: '+55 (11) 98421-0492',
  businessName: 'Bella PDV Business',
  provider: 'BellaGateway',
  connectedAt: null,
  logs: [
    {
      id: 'log-1',
      recipient: '+55 11 98421-0492',
      text: 'Lembrete de agendamento: Mechas Loiro Supremo às 14:00.',
      status: 'Delivered',
      time: '10:14',
      messageId: 'wamid.demo01'
    },
    {
      id: 'log-2',
      recipient: '+55 11 97128-5023',
      text: 'Comprovante fiscal da sua compra no valor de R$ 70,00.',
      status: 'Read',
      time: '09:45',
      messageId: 'wamid.demo02'
    }
  ],
  queue: [
    {
      id: 'q-1',
      recipient: '+55 11 99245-1288',
      text: 'Olá Mariana, confirmamos seu horário para amanhã às 15h30.',
      scheduled: 'Hoje às 18:00'
    }
  ],
  isModalOpen: false,

  setModalOpen: (open) => set({ isModalOpen: open }),
  setPhone: (phone) => set({ phone }),
  setProvider: (provider) => set({ provider }),

  startSession: async (config) => {
    set({ status: 'LOADING', qrCode: null });
    try {
      const response = await whatsappService.startSession({
        phone: get().phone,
        provider: get().provider,
        evolutionUrl: config?.evolutionUrl,
        evolutionKey: config?.evolutionKey,
      });

      if (response.success && response.qrCode) {
        set({
          status: 'QRCODE_READY',
          qrCode: response.qrCode,
          pairingCode: response.pairingCode || null,
          expiresIn: response.expiresIn || 60,
          isModalOpen: true,
        });
        toast.info('QR Code gerado! Aponte a câmera do WhatsApp para conectar.');
      } else if (response.status === 'CONNECTED') {
        set({
          status: 'CONNECTED',
          isModalOpen: false,
          connectedAt: new Date().toISOString(),
        });
        toast.success('WhatsApp já está conectado e pronto!');
      } else {
        throw new Error(response.error || 'Falha ao gerar QR Code');
      }
    } catch (err: any) {
      set({ status: 'DISCONNECTED' });
      toast.error('Erro na conexão do WhatsApp', { description: err.message });
    }
  },

  checkStatus: async () => {
    try {
      const statusData = await whatsappService.getStatus();
      if (statusData.status === 'CONNECTED') {
        set({
          status: 'CONNECTED',
          phone: statusData.phone || get().phone,
          businessName: statusData.name || get().businessName,
          connectedAt: statusData.connectedAt || get().connectedAt || new Date().toISOString(),
          isModalOpen: false,
        });
      } else if (statusData.status === 'QRCODE_READY' && statusData.qrCode) {
        set({
          status: 'QRCODE_READY',
          qrCode: statusData.qrCode,
          pairingCode: statusData.pairingCode || get().pairingCode,
          expiresIn: statusData.expiresIn || 60,
        });
      }
      return statusData;
    } catch {
      const current = get().status;
      const fallbackStatus: WhatsappSessionStatus['status'] = current === 'LOADING' ? 'INITIALIZING' : current;
      return { status: fallbackStatus };
    }
  },

  confirmConnection: async () => {
    try {
      const result = await whatsappService.confirmConnection();
      if (result.success) {
        set({
          status: 'CONNECTED',
          isModalOpen: false,
          phone: result.profile?.phone || get().phone,
          businessName: result.profile?.name || get().businessName,
          connectedAt: new Date().toISOString(),
        });
        toast.success('🎉 WhatsApp Business conectado com sucesso!');
        get().refreshLogs();
        return true;
      }
      toast.error('Não foi possível confirmar o emparelhamento.');
      return false;
    } catch (err: any) {
      toast.error('Falha na validação do QR Code', { description: err.message });
      return false;
    }
  },

  disconnectSession: async () => {
    try {
      await whatsappService.disconnect();
      set({
        status: 'DISCONNECTED',
        qrCode: null,
        pairingCode: null,
        connectedAt: null,
        isModalOpen: false,
      });
      toast.info('WhatsApp desconectado com sucesso.');
    } catch (err: any) {
      toast.error('Erro ao desconectar', { description: err.message });
    }
  },

  sendTestMessage: async (targetPhone: string) => {
    const toastId = toast.loading('Disparando mensagem de teste via WhatsApp...');
    try {
      const text = `⚡ *Bella PDV Pro — WhatsApp Business Conectado!*\n\nOlá! Sua conexão via QR Code Multi-Device foi realizada com sucesso.\nO canal de notificações, cobranças e comprovantes está ativo e pronto para uso.`;
      const res = await whatsappService.sendMessage({
        to: targetPhone,
        type: 'text',
        text,
      });

      if (res.success) {
        toast.success('Mensagem de teste enviada com sucesso!', {
          id: toastId,
          description: `ID da Mensagem: ${res.messageId || 'wamid.success'}`,
        });
        get().refreshLogs();
        return true;
      } else {
        throw new Error(res.error || 'Falha no envio');
      }
    } catch (err: any) {
      toast.error('Erro ao enviar mensagem', {
        id: toastId,
        description: err.message,
      });
      return false;
    }
  },

  sendMessage: async (to: string, text: string) => {
    const res = await whatsappService.sendMessage({ to, type: 'text', text });
    if (res.success) {
      get().refreshLogs();
    }
    return res;
  },

  refreshLogs: async () => {
    try {
      const logs = await whatsappService.getLogs();
      if (logs && logs.length > 0) {
        set({ logs });
      }
    } catch {
      // keep current logs
    }
  },
}));
