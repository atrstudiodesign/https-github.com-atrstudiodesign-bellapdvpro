export {};

declare global {
  interface Window {
    bella?: {
      isDesktopApp: boolean;
      version: string;
      platform: string;
      printer: {
        printReceipt: (data: any) => Promise<{success: boolean; error?: string; message?: string}>;
        openCashDrawer: () => Promise<{success: boolean; error?: string}>;
      };
      offline: {
        saveData: (key: string, data: any) => Promise<boolean>;
        getData: (key: string) => Promise<any>;
      }
    };
  }
}
