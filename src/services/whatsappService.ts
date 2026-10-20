export interface WhatsappSendMessage {
  to: string;
  type: 'text' | 'template';
  text?: string;
  templateName?: string;
  variables?: Record<string, string>;
}

// Do not report delivery without a provider response and message ID.
export const whatsappService = {
  sendMessage: async (_data: WhatsappSendMessage): Promise<{ success: boolean; messageId?: string; error?: string }> => ({
    success: false,
    error: 'Envio WhatsApp indisponível até integrar e homologar o provedor.'
  })
};
