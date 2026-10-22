const { app, BrowserWindow, ipcMain, shell } = require("electron");
const path = require("path");
const { setupUpdater } = require("./updater.cjs");
const { printReceipt, openCashDrawer } = require("./printer.cjs");
const { saveOffline, getOffline } = require("./offline.cjs");

const APP_ORIGIN = "https://bellapdvpro.vercel.app";
let mainWindow;
let splashWindow;

function createSplash() {
  splashWindow = new BrowserWindow({
    width: 460, height: 310, frame: false, transparent: false, resizable: false,
    center: true, alwaysOnTop: true, show: true,
    backgroundColor: "#050C1A",
    webPreferences: { nodeIntegration: false, contextIsolation: true, sandbox: true }
  });
  splashWindow.loadFile(path.join(__dirname, "splash.html"));
}

function closeSplash() {
  if (splashWindow && !splashWindow.isDestroyed()) splashWindow.close();
  splashWindow = null;
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.show();
    mainWindow.focus();
  }
}

function createWindow() {
  const isDev = !app.isPackaged;
  mainWindow = new BrowserWindow({
    width: 1440, height: 900, minWidth: 1050, minHeight: 690,
    show: false, autoHideMenuBar: true, backgroundColor: "#071329",
    title: "BellaPDV Pro — Desktop Edition",
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      nodeIntegration: false, contextIsolation: true, sandbox: false,
      devTools: isDev
    }
  });

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith("https://")) shell.openExternal(url);
    return { action: "deny" };
  });
  mainWindow.webContents.on("will-navigate", (event, url) => {
    if (!url.startsWith(APP_ORIGIN + "/") && url !== APP_ORIGIN && !isDev) {
      event.preventDefault();
      if (url.startsWith("https://")) shell.openExternal(url);
    }
  });
  mainWindow.once("ready-to-show", closeSplash);
  mainWindow.webContents.on("did-fail-load", (_event, code, description, url, isMainFrame) => {
    if (isMainFrame === false || (mainWindow && mainWindow.isDestroyed())) return;
    console.error("BellaPDV desktop load failed", code, description, url);
    closeSplash();
  });
  mainWindow.on("closed", () => { mainWindow = null; });

  if (isDev) {
    mainWindow.loadURL("http://localhost:3000").catch(err => console.error(err));
  } else {
    // Desktop launches directly into the login route; the web landing remains public.
    // An offline-first bundled renderer requires a separate router/auth migration.
    mainWindow.loadURL(APP_ORIGIN + "/login").catch(err => console.error(err));
  }
}

app.whenReady().then(() => {
  createSplash();
  createWindow();
  if (app.isPackaged && process.env.BELLA_UPDATE_FEED_CONFIGURED === "1") setupUpdater();

  ipcMain.handle("print-receipt", async (_event, data) => printReceipt(data));
  ipcMain.handle("open-cash-drawer", async () => openCashDrawer());
  ipcMain.handle("offline-save", async (_event, key, data) => saveOffline(key, data));
  ipcMain.handle("offline-get", async (_event, key) => getOffline(key));

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createSplash();
      createWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
