export interface FiscalEmitCommand {
  total: number;
  items: any[];
  customer?: any;
  paymentMethod: string;
}

export interface FiscalResponse {
  success: boolean;
  chaveAcesso?: string;
  protocolo?: string;
  qrCodeUrl?: string;
  recibo?: string;
  error?: string;
}

// No authorized fiscal provider is configured. Never fabricate an NFC-e.
export const fiscalService = {
  emitNfce: async (_command: FiscalEmitCommand): Promise<FiscalResponse> => ({
    success: false,
    error: 'Emissão NFC-e indisponível até integrar e homologar um provedor fiscal.'
  })
};
