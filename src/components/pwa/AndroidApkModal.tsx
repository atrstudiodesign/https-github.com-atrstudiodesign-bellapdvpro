import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Smartphone, 
  Download, 
  QrCode, 
  CheckCircle2, 
  ExternalLink, 
  Copy, 
  Check, 
  X, 
  ShieldCheck, 
  Terminal, 
  CreditCard,
  Sparkles,
  Layers
} from 'lucide-react';
import QRCode from 'qrcode';
import JSZip from 'jszip';
import { toast } from 'sonner';

interface AndroidApkModalProps {
  isOpen: boolean;
  onClose: () => void;
  deferredPrompt?: any;
  onInstalled?: () => void;
}

export const AndroidApkModal: React.FC<AndroidApkModalProps> = ({
  isOpen,
  onClose,
  deferredPrompt,
  onInstalled
}) => {
  const [activeTab, setActiveTab] = useState<'instant' | 'qrcode' | 'apk_builder' | 'smartpos'>('instant');
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCli, setCopiedCli] = useState(false);
  const [isGeneratingZip, setIsGeneratingZip] = useState(false);
  const [isAndroidDevice, setIsAndroidDevice] = useState(false);

  const appUrl = typeof window !== 'undefined' ? window.location.origin : 'https://bellapdv.com';

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const ua = navigator.userAgent.toLowerCase();
      setIsAndroidDevice(ua.includes('android'));
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      QRCode.toDataURL(appUrl, {
        width: 320,
        margin: 2,
        color: {
          dark: '#05070F',
          light: '#FFFFFF'
        }
      })
        .then((url) => setQrCodeUrl(url))
        .catch((err) => console.error('Erro ao gerar QRCode:', err));
    }
  }, [isOpen, appUrl]);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      try {
        await deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
          toast.success('Instalação iniciada!', {
            description: 'O aplicativo Bella PDV está sendo instalado no seu Android.'
          });
          if (onInstalled) onInstalled();
          onClose();
        }
      } catch (e) {
        console.error('Erro ao disparar prompt de instalação:', e);
      }
    } else {
      toast.info('Instalação manual no Android', {
        description: 'Toque nos 3 pontinhos (⋮) do navegador e selecione "Instalar aplicativo".'
      });
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(appUrl);
    setCopiedLink(true);
    toast.success('Link copiado!', {
      description: 'Envie por WhatsApp para abrir e instalar no seu Android.'
    });
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleCopyCli = () => {
    const cliCommand = `npm i -g @bubblewrap/cli\nbubblewrap init --manifest="${appUrl}/manifest.json"\nbubblewrap build`;
    navigator.clipboard.writeText(cliCommand);
    setCopiedCli(true);
    toast.success('Comandos copiados!');
    setTimeout(() => setCopiedCli(false), 2500);
  };

  const handleDownloadZipPackage = async () => {
    setIsGeneratingZip(true);
    try {
      const zip = new JSZip();

      // AndroidManifest.xml
      const androidManifest = `<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="com.bellapdv.app">

    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
    <uses-permission android:name="android.permission.CAMERA" />

    <application
        android:allowBackup="true"
        android:icon="@mipmap/ic_launcher"
        android:label="Bella PDV"
        android:roundIcon="@mipmap/ic_launcher_round"
        android:supportsRtl="true"
        android:theme="@android:style/Theme.NoTitleBar.Fullscreen">
        
        <activity
            android:name="com.google.androidbrowserhelper.trusted.LauncherActivity"
            android:exported="true"
            android:label="Bella PDV">
            
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>

            <intent-filter android:autoVerify="true">
                <action android:name="android.intent.action.VIEW" />
                <category android:name="android.intent.category.DEFAULT" />
                <category android:name="android.intent.category.BROWSABLE" />
                <data
                    android:scheme="https"
                    android:host="${window.location.hostname}" />
            </intent-filter>
        </activity>
    </application>
</manifest>`;

      // assetlinks.json
      const assetlinks = JSON.stringify([
        {
          relation: ["delegate_permission/common.handle_all_urls"],
          target: {
            namespace: "android_app",
            package_name: "com.bellapdv.app",
            sha256_cert_fingerprints: [
              "14:6D:E9:83:C5:73:06:50:D8:EE:B9:95:2F:34:FC:64:16:A0:83:42:E6:1D:BE:A8:8A:04:96:B2:3F:CF:44:E5"
            ]
          }
        }
      ], null, 2);

      // twa-manifest.json
      const twaManifest = JSON.stringify({
        packageId: "com.bellapdv.app",
        host: window.location.hostname,
        name: "Bella PDV",
        launcherName: "Bella PDV",
        themeColor: "#05070F",
        navigationColor: "#05070F",
        backgroundColor: "#05070F",
        startUrl: "/",
        iconUrl: `${appUrl}/pwa-512x512.png`,
        maskableIconUrl: `${appUrl}/pwa-maskable-512x512.png`,
        appVersion: "1.0.0",
        signingKey: {
          path: "./android.keystore",
          alias: "bellapdv"
        }
      }, null, 2);

      const readme = `======================================================
BELLA PDV - PACOTE DE IMPLANTAÇÃO ANDROID & APK
======================================================

Este pacote contém todos os artefatos necessários para gerar o arquivo APK instalável
ou publicar o Bella PDV na Google Play Store.

OPÇÃO 1: GERAR APK EM 1 CLIQUE VIA PWABUILDER (MAIS FÁCIL)
---------------------------------------------------------
1. Acesse: https://www.pwabuilder.com
2. Digite a URL do seu sistema: ${appUrl}
3. Clique em "Package for stores" -> "Android".
4. Baixe o arquivo .apk ou .aab assinado pronto para instalar no seu celular ou enviar por WhatsApp!

OPÇÃO 2: GERAR APK VIA LINUX / MAC / WINDOWS (BUBBLEWRAP CLI)
------------------------------------------------------------
Requisitos: Node.js e Java JDK 17+
Execute no terminal:
  npm i -g @bubblewrap/cli
  bubblewrap init --manifest="${appUrl}/manifest.json"
  bubblewrap build

O arquivo 'app-release-signed.apk' será gerado na pasta de saída.

OPÇÃO 3: INSTALAÇÃO DIRETA NO CELULAR OU SMARTPOS (SEM PRECISAR DE APK MANUAL)
------------------------------------------------------------------------------
O Android 8+ possui suporte nativo ao WebAPK:
1. Abra ${appUrl} no Google Chrome do celular.
2. Toque nos 3 pontinhos (⋮) do Chrome e selecione "Instalar aplicativo".
3. O Android gerará o APK nativo e o colocará na gaveta de aplicativos com ícone, tela cheia e notificações!

Equipe ATR Studio / Bella PDV
`;

      zip.file("AndroidManifest.xml", androidManifest);
      zip.file("assetlinks.json", assetlinks);
      zip.file("twa-manifest.json", twaManifest);
      zip.file("LEIA-ME-INSTALACAO-ANDROID.txt", readme);

      // Buscar ícones existentes e anexar ao zip
      try {
        const [res192, res512] = await Promise.all([
          fetch('/pwa-192x192.png').then(r => r.blob()),
          fetch('/pwa-512x512.png').then(r => r.blob())
        ]);
        zip.file("res/mipmap-xxhdpi/ic_launcher.png", res192);
        zip.file("res/mipmap-xxxhdpi/ic_launcher.png", res512);
      } catch (err) {
        console.warn('Ícones PNG não puderam ser embutidos no zip:', err);
      }

      const content = await zip.generateAsync({ type: 'blob' });
      const downloadUrl = URL.createObjectURL(content);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `BellaPDV-Android-Package.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(downloadUrl);

      toast.success('Pacote Android baixado com sucesso!', {
        description: 'Arquivo ZIP com manifest, ícones e guias gerado.'
      });
    } catch (e) {
      console.error('Erro ao gerar ZIP:', e);
      toast.error('Erro ao gerar pacote zip');
    } finally {
      setIsGeneratingZip(false);
    }
  };

  const pwabuilderUrl = `https://www.pwabuilder.com?siteUrl=${encodeURIComponent(appUrl)}`;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[110] bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.94, opacity: 0, y: 15 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.94, opacity: 0, y: 15 }}
            transition={{ duration: 0.2 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-[#0A0F1D] border border-cyan-500/30 rounded-2xl w-full max-w-2xl shadow-[0_0_50px_rgba(6,182,212,0.2)] overflow-hidden flex flex-col relative my-auto max-h-[92vh]"
          >
            {/* Header */}
            <div className="p-4 sm:p-6 border-b border-white/10 flex items-center justify-between bg-gradient-to-r from-[#0F172A] via-[#0B132B] to-[#0A0F1D]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-cyan-500/20 text-white shrink-0">
                  <Smartphone className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-base sm:text-lg font-bold text-white">
                      Instalador Android & APK
                    </h3>
                    <span className="text-[10px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Android 8+ & SmartPOS
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Instale como WebAPK nativo no celular ou gere o arquivo APK oficial
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="text-slate-400 hover:text-white p-2 rounded-lg hover:bg-white/5 transition-colors shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Navigation Tabs */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1 p-2 bg-[#060A14] border-b border-white/5 text-xs font-medium">
              <button
                onClick={() => setActiveTab('instant')}
                className={`py-2 px-2.5 rounded-lg flex items-center justify-center gap-1.5 transition-all text-center ${
                  activeTab === 'instant'
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm font-semibold'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <Smartphone className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">Instalar no Celular</span>
              </button>

              <button
                onClick={() => setActiveTab('qrcode')}
                className={`py-2 px-2.5 rounded-lg flex items-center justify-center gap-1.5 transition-all text-center ${
                  activeTab === 'qrcode'
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm font-semibold'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <QrCode className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">Escanear QR Code</span>
              </button>

              <button
                onClick={() => setActiveTab('apk_builder')}
                className={`py-2 px-2.5 rounded-lg flex items-center justify-center gap-1.5 transition-all text-center ${
                  activeTab === 'apk_builder'
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm font-semibold'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <Download className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">Gerar Arquivo APK</span>
              </button>

              <button
                onClick={() => setActiveTab('smartpos')}
                className={`py-2 px-2.5 rounded-lg flex items-center justify-center gap-1.5 transition-all text-center ${
                  activeTab === 'smartpos'
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm font-semibold'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <CreditCard className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">Maquininhas SmartPOS</span>
              </button>
            </div>

            {/* Tab Contents */}
            <div className="p-4 sm:p-6 overflow-y-auto space-y-4">
              {/* TAB 1: INSTALAÇÃO DIRETA / WEBAPK */}
              {activeTab === 'instant' && (
                <div className="space-y-4">
                  {/* Banner de destaque */}
                  <div className="bg-gradient-to-r from-cyan-950/40 via-indigo-950/30 to-purple-950/20 border border-cyan-500/30 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping" />
                        <h4 className="text-white font-semibold text-sm">
                          {isAndroidDevice ? 'Dispositivo Android Reconhecido!' : 'WebAPK Nativo para Android'}
                        </h4>
                      </div>
                      <p className="text-xs text-slate-300 leading-relaxed max-w-md">
                        O Android compila e instala um aplicativo nativo completo com ícone na gaveta de aplicativos, execução em tela cheia e modo offline instantâneo.
                      </p>
                    </div>

                    <button
                      onClick={handleInstallClick}
                      className="w-full sm:w-auto px-5 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-sm rounded-xl shadow-[0_0_20px_rgba(6,182,212,0.4)] transition-all flex items-center justify-center gap-2 shrink-0 active:scale-95"
                    >
                      <Smartphone className="w-4 h-4" />
                      {deferredPrompt ? 'Instalar Agora no Celular' : 'Iniciar Instalação Android'}
                    </button>
                  </div>

                  {/* Passos ilustrados */}
                  <div className="bg-[#111827]/80 border border-white/5 rounded-xl p-4 space-y-3">
                    <h5 className="text-xs font-semibold text-cyan-300 uppercase tracking-wider flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-emerald-400" />
                      Como funciona no Google Chrome (Android):
                    </h5>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="bg-[#1F2937]/50 border border-white/5 p-3 rounded-lg flex flex-col justify-between">
                        <div>
                          <div className="w-6 h-6 rounded-full bg-cyan-500/20 text-cyan-400 font-bold text-xs flex items-center justify-center mb-2">
                            1
                          </div>
                          <p className="text-xs font-medium text-white">Toque nos 3 Pontinhos</p>
                          <p className="text-[11px] text-slate-400 mt-1">
                            Abra o menu no canto superior direito do Chrome (ícone ⋮).
                          </p>
                        </div>
                      </div>

                      <div className="bg-[#1F2937]/50 border border-white/5 p-3 rounded-lg flex flex-col justify-between">
                        <div>
                          <div className="w-6 h-6 rounded-full bg-cyan-500/20 text-cyan-400 font-bold text-xs flex items-center justify-center mb-2">
                            2
                          </div>
                          <p className="text-xs font-medium text-white">"Instalar aplicativo"</p>
                          <p className="text-[11px] text-slate-400 mt-1">
                            Toque na opção "Instalar aplicativo" ou "Adicionar à tela inicial".
                          </p>
                        </div>
                      </div>

                      <div className="bg-[#1F2937]/50 border border-white/5 p-3 rounded-lg flex flex-col justify-between">
                        <div>
                          <div className="w-6 h-6 rounded-full bg-cyan-500/20 text-cyan-400 font-bold text-xs flex items-center justify-center mb-2">
                            3
                          </div>
                          <p className="text-xs font-medium text-white">Aplicativo Pronto</p>
                          <p className="text-[11px] text-slate-400 mt-1">
                            O app aparecerá instalado na sua tela inicial e na gaveta com seu ícone e nome.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Vantagens do WebAPK */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
                    <div className="p-2.5 rounded-lg bg-white/5 border border-white/5">
                      <p className="text-[11px] font-semibold text-slate-200">Sem Play Store</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">Instalação direta</p>
                    </div>
                    <div className="p-2.5 rounded-lg bg-white/5 border border-white/5">
                      <p className="text-[11px] font-semibold text-slate-200">Tela Cheia</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">Sem barras do browser</p>
                    </div>
                    <div className="p-2.5 rounded-lg bg-white/5 border border-white/5">
                      <p className="text-[11px] font-semibold text-slate-200">Modo Offline</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">Acesso sem conexão</p>
                    </div>
                    <div className="p-2.5 rounded-lg bg-white/5 border border-white/5">
                      <p className="text-[11px] font-semibold text-slate-200">Atualização Auto</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">Sempre na versão nova</p>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: QR CODE */}
              {activeTab === 'qrcode' && (
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row items-center gap-6 bg-[#111827]/70 border border-white/10 rounded-xl p-5">
                    {/* QR Code Container */}
                    <div className="p-3 bg-white rounded-2xl shadow-[0_0_30px_rgba(255,255,255,0.15)] shrink-0 flex items-center justify-center">
                      {qrCodeUrl ? (
                        <img
                          src={qrCodeUrl}
                          alt="QR Code Bella PDV"
                          className="w-44 h-44 object-contain"
                        />
                      ) : (
                        <div className="w-44 h-44 flex items-center justify-center text-slate-400 text-xs">
                          Gerando QR Code...
                        </div>
                      )}
                    </div>

                    <div className="space-y-3 flex-1 text-center sm:text-left">
                      <div>
                        <h4 className="text-sm sm:text-base font-bold text-white flex items-center justify-center sm:justify-start gap-2">
                          <QrCode className="w-4 h-4 text-cyan-400" /> Aponte a câmera do seu celular
                        </h4>
                        <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                          Abra o leitor de QR Code ou a câmera de qualquer celular Android ou maquininha com câmera para abrir o link instantaneamente.
                        </p>
                      </div>

                      <div className="bg-[#090D18] p-2.5 rounded-lg border border-white/5 flex items-center justify-between gap-2">
                        <span className="text-[11px] text-slate-300 truncate font-mono select-all">
                          {appUrl}
                        </span>
                        <button
                          onClick={handleCopyLink}
                          className="px-2.5 py-1.5 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 rounded-md text-xs font-semibold flex items-center gap-1 transition-colors shrink-0"
                        >
                          {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                          {copiedLink ? 'Copiado!' : 'Copiar'}
                        </button>
                      </div>

                      <p className="text-[11px] text-slate-400">
                        💡 <strong>Dica:</strong> Você também pode enviar este link pelo WhatsApp para os atendentes ou gerentes instalarem nos próprios aparelhos.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: GERAR ARQUIVO APK / TWA */}
              {activeTab === 'apk_builder' && (
                <div className="space-y-4">
                  {/* Card PWABuilder Oficial */}
                  <div className="bg-[#111827] border border-cyan-500/30 rounded-xl p-4 sm:p-5 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                            RECOMENDADO
                          </span>
                          <h4 className="text-sm font-bold text-white">
                            Gerador Oficial de APK (PWABuilder)
                          </h4>
                        </div>
                        <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                          Ferramenta oficial da Microsoft e Google que empacota o PWA em um arquivo <strong>.apk</strong> assinado para distribuição ou <strong>.aab</strong> para a Google Play Store.
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-2 pt-1">
                      <a
                        href={pwabuilderUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 py-2.5 px-4 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-semibold text-xs rounded-lg transition-all flex items-center justify-center gap-2 text-center shadow-lg shadow-cyan-600/20"
                      >
                        <ExternalLink className="w-4 h-4" />
                        Abrir no PWABuilder & Gerar APK
                      </a>

                      <button
                        onClick={handleDownloadZipPackage}
                        disabled={isGeneratingZip}
                        className="py-2.5 px-4 bg-white/10 hover:bg-white/15 text-white font-semibold text-xs rounded-lg border border-white/10 transition-all flex items-center justify-center gap-2 shrink-0 disabled:opacity-50"
                      >
                        <Download className="w-4 h-4 text-cyan-400" />
                        {isGeneratingZip ? 'Compactando...' : 'Baixar Pacote Android (.zip)'}
                      </button>
                    </div>
                  </div>

                  {/* Instruções Bubblewrap CLI */}
                  <div className="bg-[#090D18] border border-white/10 rounded-xl p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <h5 className="text-xs font-semibold text-slate-300 flex items-center gap-2">
                        <Terminal className="w-4 h-4 text-cyan-400" /> Compilação local via CLI (Bubblewrap)
                      </h5>
                      <button
                        onClick={handleCopyCli}
                        className="text-[11px] text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-medium"
                      >
                        {copiedCli ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        {copiedCli ? 'Comandos Copiados' : 'Copiar Comandos'}
                      </button>
                    </div>

                    <pre className="p-3 bg-black/60 rounded-lg text-[11px] font-mono text-cyan-300 overflow-x-auto border border-white/5 leading-relaxed">
{`# 1. Instalar a ferramenta oficial do Google
npm i -g @bubblewrap/cli

# 2. Inicializar o projeto com o manifesto do Bella PDV
bubblewrap init --manifest="${appUrl}/manifest.json"

# 3. Compilar o APK final assinado
bubblewrap build`}
                    </pre>
                    <p className="text-[11px] text-slate-400">
                      Gera o arquivo <code className="text-cyan-300 font-mono">app-release-signed.apk</code> pronto para ser instalado via cabo USB ou pendrive em qualquer tablet ou smartphone Android.
                    </p>
                  </div>
                </div>
              )}

              {/* TAB 4: SMARTPOS (MAQUININHAS DE CARTÃO ANDROID) */}
              {activeTab === 'smartpos' && (
                <div className="space-y-4">
                  <div className="bg-[#111827] border border-purple-500/30 rounded-xl p-4 sm:p-5 space-y-3">
                    <div className="flex items-center gap-2">
                      <CreditCard className="w-5 h-5 text-purple-400" />
                      <h4 className="text-sm font-bold text-white">
                        Instalação em Maquininhas SmartPOS (Android)
                      </h4>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      As maquininhas modernas (Stone Smart POS, PagSeguro Moderninha Smart, Cielo LIO, Rede Smart, Sunmi V2/P2) rodam sistema Android e são 100% compatíveis com o Bella PDV.
                    </p>
                  </div>

                  <div className="space-y-2 text-xs text-slate-300">
                    <div className="p-3 bg-[#1F2937]/50 rounded-lg border border-white/5 space-y-1">
                      <p className="font-semibold text-white flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-purple-400" />
                        Passo 1: Conectar ao Wi-Fi
                      </p>
                      <p className="text-slate-400 text-[11px] pl-3.5">
                        Certifique-se de que a maquininha está conectada a uma rede Wi-Fi estável com acesso à internet.
                      </p>
                    </div>

                    <div className="p-3 bg-[#1F2937]/50 rounded-lg border border-white/5 space-y-1">
                      <p className="font-semibold text-white flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-purple-400" />
                        Passo 2: Abrir o Navegador ou Leitor
                      </p>
                      <p className="text-slate-400 text-[11px] pl-3.5">
                        Abra o Google Chrome ou o navegador integrado da maquininha e digite o endereço: <strong className="text-cyan-300">{appUrl}</strong> (ou escaneie o QR Code com a câmera traseira).
                      </p>
                    </div>

                    <div className="p-3 bg-[#1F2937]/50 rounded-lg border border-white/5 space-y-1">
                      <p className="font-semibold text-white flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-purple-400" />
                        Passo 3: Fixar como App de Frente de Caixa
                      </p>
                      <p className="text-slate-400 text-[11px] pl-3.5">
                        Toque em "Instalar na Maquininha" ou "Adicionar à Tela Inicial". O Bella PDV abrirá ocupando toda a tela touch da maquininha para você registrar vendas rapidamente no balcão.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-3 sm:p-4 border-t border-white/10 bg-[#060A14] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2 text-slate-400">
                <Sparkles className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                <span>Compatível com Android 8.0, 9, 10, 11, 12, 13, 14 e 15+</span>
              </div>
              <button
                onClick={onClose}
                className="w-full sm:w-auto px-5 py-2 bg-white/10 hover:bg-white/15 text-white font-medium rounded-lg transition-colors text-center"
              >
                Fechar
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
