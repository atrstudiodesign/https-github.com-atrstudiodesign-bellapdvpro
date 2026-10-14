export interface WhatsappSendMessage {
  to: string;
  type: 'text' | 'template';
  text?: string;
  templateName?: string;
  variables?: Record<string, string>;
}

export const whatsappService = {
  // Simula a Meta Cloud API for WhatsApp Business
  sendMessage: async (data: WhatsappSendMessage): Promise<{ success: boolean; messageId?: string; error?: string }> => {
    console.log("[WhatsApp Cloud API] Enviando mensagem via API Oficial...", data);
    
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          success: true,
          messageId: 'wamid.' + Math.random().toString(36).substring(7).toUpperCase()
        });
      }, 1200);
    });
  }
};
