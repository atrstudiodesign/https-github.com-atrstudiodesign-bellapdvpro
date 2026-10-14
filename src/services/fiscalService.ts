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

export const fiscalService = {
  emitNfce: async (command: FiscalEmitCommand): Promise<FiscalResponse> => {
    // Simulando chamada para API (Nuvem Fiscal / Tecnospeed / Focus NFe)
    console.log("Emitindo NFC-e...", command);
    
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          success: true,
          chaveAcesso: Array.from({length: 44}, () => Math.floor(Math.random() * 10)).join(''),
          protocolo: '1' + Array.from({length: 14}, () => Math.floor(Math.random() * 10)).join(''),
          qrCodeUrl: 'https://sefaz.gov.br/nfce/qrcode?p=' + Math.random().toString(36).substring(7),
          recibo: 'Recibo ' + Date.now()
        });
      }, 1500);
    });
  }
};
