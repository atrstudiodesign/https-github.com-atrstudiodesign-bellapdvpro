const localforage = require("localforage");

localforage.config({
  driver: localforage.INDEXEDDB, // Força a utilização do IndexedDB localmente
  name: "BellaPDV_Offline_Storage",
  version: 1.0,
  storeName: "offline_sales", // Should be alphanumeric, with underscores.
  description: "Armazenamento local para modo offline"
});

async function saveOffline(key, data) {
  try {
    await localforage.setItem(key, data);
    console.log(`Dados offline salvos: ${key}`);
    return true;
  } catch (error) {
    console.error("Erro ao salvar offline:", error);
    return false;
  }
}

async function getOffline(key) {
  try {
    return await localforage.getItem(key);
  } catch (error) {
    console.error("Erro ao ler offline:", error);
    return null;
  }
}

module.exports = { saveOffline, getOffline };
