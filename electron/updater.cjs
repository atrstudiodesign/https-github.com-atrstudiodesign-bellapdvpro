const { autoUpdater } = require("electron-updater");
const { dialog } = require("electron");

function setupUpdater() {
  autoUpdater.autoDownload = false;

  autoUpdater.on("error", (error) => {
    console.error("Erro na atualização:", error);
  });

  autoUpdater.on("update-available", () => {
    dialog.showMessageBox({
      type: "info",
      title: "Atualização Disponível",
      message: "Uma nova versão do BellaPDV está disponível. Deseja baixar agora?",
      buttons: ["Sim", "Não"]
    }).then((result) => {
      if (result.response === 0) {
        autoUpdater.downloadUpdate();
      }
    });
  });

  autoUpdater.on("update-downloaded", () => {
    dialog.showMessageBox({
      title: "Atualização Pronta",
      message: "Instalar e reiniciar agora?",
      buttons: ["Sim", "Depois"]
    }).then((result) => {
      if (result.response === 0) {
        autoUpdater.quitAndInstall();
      }
    });
  });

  autoUpdater.checkForUpdatesAndNotify();
}

module.exports = { setupUpdater };
