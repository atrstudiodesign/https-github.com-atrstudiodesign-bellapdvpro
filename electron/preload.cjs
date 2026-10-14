const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld("bella", {
  version: "1.0.0",
  platform: process.platform,
  isDesktopApp: true,
  
  printer: {
    printReceipt: (data) => ipcRenderer.invoke('print-receipt', data),
    openCashDrawer: () => ipcRenderer.invoke('open-cash-drawer')
  },
  
  offline: {
    saveData: (key, data) => ipcRenderer.invoke('offline-save', key, data),
    getData: (key) => ipcRenderer.invoke('offline-get', key)
  }
})
