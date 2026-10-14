const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("path");

const { setupUpdater } = require("./updater.cjs");
const { printReceipt, openCashDrawer } = require("./printer.cjs");
const { saveOffline, getOffline } = require("./offline.cjs");

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    autoHideMenuBar: true,
    backgroundColor: "#070B14",
    kiosk: false, // Pode ser alterado para true via config
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      nodeIntegration: false, // Segurança: preload context isolation ativado por padrão no Bella
      contextIsolation: true, // contextIsolation is required to use contextBridge
      devTools: process.env.NODE_ENV === "development",
    }
  });

  const isDev = process.env.NODE_ENV === "development" || !app.isPackaged;
  
  if (isDev) {
    mainWindow.loadURL("http://localhost:3000");
  } else {
    // Para um PWA local no electron_dist:
    mainWindow.loadFile(path.join(__dirname, "../dist/index.html"));
    // Para forçar carregar o app da URL real online e usar o Electron apenas como "Browser"
    // mainWindow.loadURL("https://app.bellapdv.com");
  }

  // Em produção, se desejar tela cheia estilo "Sistema de Caixa" (Kiosk Mode)
  if (!isDev) {
    mainWindow.maximize();
  }
}

app.whenReady().then(() => {
  createWindow();
  setupUpdater();

  // Registrar handlers IPC para hardware e offline local
  ipcMain.handle('print-receipt', async (event, data) => {
    return await printReceipt(data);
  });

  ipcMain.handle('open-cash-drawer', async (event) => {
    return await openCashDrawer();
  });

  ipcMain.handle('offline-save', async (event, key, data) => {
    return await saveOffline(key, data);
  });

  ipcMain.handle('offline-get', async (event, key) => {
    return await getOffline(key);
  });

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
