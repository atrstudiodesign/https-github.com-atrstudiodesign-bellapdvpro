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
  AlertTriangle,
  HelpCircle,
  ShieldAlert,
  FileWarning,
  ChevronRight,
  ArrowRight,
  Info,
  Flame,
  Database
} from 'lucide-react';
import QRCode from 'qrcode';
import JSZip from 'jszip';
import { toast } from 'sonner';
import { realtimeDatabaseService } from '../../services/realtimeDatabaseService';

interface AndroidApkModalProps {
  isOpen: boolean;
  onClose: () => void;
  deferredPrompt?: any;
  onInstalled?: () => void;
  initialTab?: 'instant' | 'troubleshoot' | 'qrcode' | 'apk_builder' | 'smartpos';
}

export const AndroidApkModal: React.FC<AndroidApkModalProps> = ({
  isOpen,
  onClose,
  deferredPrompt,
  onInstalled,
  initialTab = 'troubleshoot'
}) => {
  const [activeTab, setActiveTab] = useState<'instant' | 'troubleshoot' | 'qrcode' | 'apk_builder' | 'smartpos'>(initialTab);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCli, setCopiedCli] = useState(false);
  const [isGeneratingZip, setIsGeneratingZip] = useState(false);
  const [isAndroidDevice, setIsAndroidDevice] = useState(false);
  const [activeTroubleAccordion, setActiveTroubleAccordion] = useState<string | null>('play_protect');
  const [copiedKotlin, setCopiedKotlin] = useState(false);
  const [copiedWebSnippet, setCopiedWebSnippet] = useState(false);
  const [isTestingRtdb, setIsTestingRtdb] = useState(false);

  // URL do aplicativo
  const rawAppUrl = typeof window !== 'undefined' ? window.location.origin : 'https://bellapdv.com';
  // Se estiver em ambiente dev com proxy ais-dev, permitir o link ais-pre (público) para escanear no celular
  const publicAppUrl = rawAppUrl.includes('ais-dev-') 
    ? rawAppUrl.replace('ais-dev-', 'ais-pre-') 
    : rawAppUrl;

  const [usePublicUrl, setUsePublicUrl] = useState(rawAppUrl.includes('ais-dev-'));
  const currentTargetUrl = usePublicUrl ? publicAppUrl : rawAppUrl;

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const ua = navigator.userAgent.toLowerCase();
      setIsAndroidDevice(ua.includes('android'));
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      QRCode.toDataURL(currentTargetUrl, {
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
  }, [isOpen, currentTargetUrl]);

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
        description: 'Toque nos 3 pontinhos (⋮) do Google Chrome e selecione "Instalar aplicativo".'
      });
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(currentTargetUrl);
    setCopiedLink(true);
    toast.success('Link copiado com sucesso!', {
      description: 'Envie por WhatsApp para abrir e instalar direto no celular.'
    });
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleCopyCli = () => {
    const cliCommand = `npm i -g @bubblewrap/cli\nbubblewrap init --manifest="${currentTargetUrl}/manifest.json"\nbubblewrap build`;
    navigator.clipboard.writeText(cliCommand);
    setCopiedCli(true);
    toast.success('Comandos copiados!');
    setTimeout(() => setCopiedCli(false), 2500);
  };

  const handleCopyKotlin = () => {
    const code = `// 1. No app-level build.gradle.kts:
implementation(platform("com.google.firebase:firebase-bom:34.18.0"))
implementation("com.google.firebase:firebase-database")

// 2. Gravar dados:
val database = Firebase.database("https://bellapdv-15ae0-default-rtdb.firebaseio.com")
val myRef = database.getReference("message")
myRef.setValue("Hello, World!")

// 3. Ler dados em tempo real:
myRef.addValueEventListener(object : ValueEventListener {
    override fun onDataChange(snapshot: DataSnapshot) {
        val value = snapshot.getValue(String::class.java)
        Log.d("RTDB", "Valor recebido: $value")
    }
    override fun onCancelled(error: DatabaseError) {
        Log.w("RTDB", "Erro ao ler:", error.toException())
    }
})`;
    navigator.clipboard.writeText(code);
    setCopiedKotlin(true);
    toast.success('Código Kotlin copiado com sucesso!');
    setTimeout(() => setCopiedKotlin(false), 2500);
  };

  const handleCopyWebSnippet = () => {
    const code = `import { getDatabase, ref, set, onValue } from "firebase/database";
import { app } from "./lib/firebase";

const database = getDatabase(app);

// Escrever:
await set(ref(database, 'message'), "Hello, World!");

// Escutar em tempo real:
onValue(ref(database, 'message'), (snapshot) => {
  console.log("Mensagem recebida:", snapshot.val());
});`;
    navigator.clipboard.writeText(code);
    setCopiedWebSnippet(true);
    toast.success('Código Web copiado com sucesso!');
    setTimeout(() => setCopiedWebSnippet(false), 2500);
  };

  const handleTestRtdb = async () => {
    setIsTestingRtdb(true);
    try {
      const now = new Date().toLocaleTimeString('pt-BR');
      const testMsg = `Conexão ativa Bella PDV às ${now}`;
      const success = await realtimeDatabaseService.setMessage(testMsg);
      if (success) {
        toast.success('Mensagem gravada no Realtime Database!', {
          description: `Chave "message" atualizada com sucesso no Firebase.`
        });
      } else {
        toast.info('Modo simulação local ativo', {
          description: 'A URL do banco de dados está configurada em firebaseConfig.json.'
        });
      }
    } catch (e) {
      console.error(e);
      toast.error('Erro ao conectar ao Realtime Database');
    } finally {
      setIsTestingRtdb(false);
    }
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
        iconUrl: `${currentTargetUrl}/pwa-512x512.png`,
        maskableIconUrl: `${currentTargetUrl}/pwa-maskable-512x512.png`,
        appVersion: "1.0.0",
        signingKey: {
          path: "./android.keystore",
          alias: "bellapdv"
        }
      }, null, 2);

      const readme = `======================================================
BELLA PDV - PACOTE DE IMPLANTAÇÃO ANDROID & APK
======================================================

ATENÇÃO: ESTE ARQUIVO .ZIP É O CÓDIGO-FONTE PARA GERAR O APK.
O Android NÃO instala arquivos .zip diretamente!

COMO INSTALAR NO CELULAR OU SMARTPOS (SEM ERROS):
------------------------------------------------------------------
MÉTODO 1 (MAIS FÁCIL E RÁPIDO - DIRETO NO GOOGLE CHROME):
1. No seu celular Android, abra o Google Chrome.
2. Acesse: ${currentTargetUrl}
3. Toque nos 3 pontinhos (⋮) no canto superior direito.
4. Toque em "Instalar aplicativo" (ou "Adicionar à tela inicial").
5. Siga as instruções exibidas pelo navegador; instalação PWA e APK direto são opções diferentes.

MÉTODO 2 (GERAR ARQUIVO .APK ASSINADO COM PWABUILDER):
1. Acesse: https://www.pwabuilder.com
2. Digite a URL: ${currentTargetUrl}
3. Clique em "Package for stores" -> "Android".
4. Baixe o arquivo .apk assinado e transfira para o aparelho.
5. Se houver um alerta do Play Protect, não ignore o aviso; valide a origem e contate o suporte.

Equipe ATR Studio / Bella PDV
`;

      zip.file("AndroidManifest.xml", androidManifest);
      zip.file("assetlinks.json", assetlinks);
      zip.file("twa-manifest.json", twaManifest);
      zip.file("LEIA-ME-INSTALACAO-ANDROID.txt", readme);

      // build.gradle.kts (Android app)
      const buildGradleKts = `plugins {
    alias(libs.plugins.android.application)
    alias(libs.plugins.kotlin.android)
    id("com.google.gms.google-services")
}

android {
    namespace = "com.bellapdv.app"
    compileSdk = 35

    defaultConfig {
        applicationId = "com.bellapdv.app"
        minSdk = 26
        targetSdk = 35
        versionCode = 1
        versionName = "1.0.0"
    }
}

dependencies {
    // Import the Firebase BoM
    implementation(platform("com.google.firebase:firebase-bom:34.18.0"))
    // Firebase Realtime Database
    implementation("com.google.firebase:firebase-database")
    // Firebase Auth & Common
    implementation("com.google.firebase:firebase-auth")
}`;

      // FirebaseRealtimeHelper.kt
      const kotlinHelper = `package com.bellapdv.app

import android.util.Log
import com.google.firebase.database.DataSnapshot
import com.google.firebase.database.DatabaseError
import com.google.firebase.database.ValueEventListener
import com.google.firebase.database.ktx.database
import com.google.firebase.ktx.Firebase

class FirebaseRealtimeHelper {
    private val database = Firebase.database("https://bellapdv-15ae0-default-rtdb.firebaseio.com")
    private val myRef = database.getReference("message")

    fun writeMessage(text: String) {
        myRef.setValue(text)
    }

    fun listenToMessage(onValueChange: (String?) -> Unit) {
        myRef.addValueEventListener(object : ValueEventListener {
            override fun onDataChange(snapshot: DataSnapshot) {
                val value = snapshot.getValue(String::class.java)
                Log.d("RTDB", "Value is: $value")
                onValueChange(value)
            }

            override fun onCancelled(error: DatabaseError) {
                Log.w("RTDB", "Failed to read value.", error.toException())
            }
        })
    }
}`;

      zip.file("build.gradle.kts", buildGradleKts);
      zip.file("FirebaseRealtimeHelper.kt", kotlinHelper);

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
      link.download = `BellaPDV-Android-Source-Package.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(downloadUrl);

      toast.success('Pacote baixado!', {
        description: 'Lembre-se: o Android instala via Chrome WebAPK ou compilação de APK.'
      });
    } catch (e) {
      console.error('Erro ao gerar ZIP:', e);
      toast.error('Erro ao gerar pacote zip');
    } finally {
      setIsGeneratingZip(false);
    }
  };

  const pwabuilderUrl = `https://www.pwabuilder.com?siteUrl=${encodeURIComponent(currentTargetUrl)}`;

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
            <div className="p-4 sm:p-5 border-b border-white/10 flex items-center justify-between bg-gradient-to-r from-[#0F172A] via-[#0B132B] to-[#0A0F1D]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-cyan-500/20 text-white shrink-0">
                  <Smartphone className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-base sm:text-lg font-bold text-white">
                      Instalação do Aplicativo Android & APK
                    </h3>
                    <span className="text-[10px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Android 8+ & SmartPOS
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Instale o APK oficial ou consulte as instruções de instalação no Android
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

            <div className="px-5 py-3 border-b border-cyan-400/20 bg-cyan-400/5 flex flex-wrap gap-3 items-center"><a href="/downloads/bellapdv-pro-android.apk" className="rounded-lg bg-cyan-400 px-4 py-2 text-sm font-bold text-[#051426]">Baixar APK oficial</a><a href="/instalar/android" className="text-sm text-cyan-300 underline">Guia de instalação</a><span className="text-xs text-slate-300">Pacote ZIP técnico não é instalador.</span></div>
            {/* Navigation Tabs */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-1 p-2 bg-[#060A14] border-b border-white/5 text-xs font-medium">
              <button
                onClick={() => setActiveTab('troubleshoot')}
                className={`py-2 px-2 rounded-lg flex items-center justify-center gap-1.5 transition-all text-center col-span-2 sm:col-span-1 ${
                  activeTab === 'troubleshoot'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50 shadow-sm font-bold'
                    : 'text-amber-400/90 hover:text-amber-300 hover:bg-amber-500/10'
                }`}
              >
                <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-amber-400 animate-pulse" />
                <span className="truncate">APK não instala?</span>
              </button>

              <button
                onClick={() => setActiveTab('instant')}
                className={`py-2 px-2 rounded-lg flex items-center justify-center gap-1.5 transition-all text-center ${
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
                className={`py-2 px-2 rounded-lg flex items-center justify-center gap-1.5 transition-all text-center ${
                  activeTab === 'qrcode'
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm font-semibold'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <QrCode className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">QR Code</span>
              </button>

              <button
                onClick={() => setActiveTab('apk_builder')}
                className={`py-2 px-2 rounded-lg flex items-center justify-center gap-1.5 transition-all text-center ${
                  activeTab === 'apk_builder'
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm font-semibold'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <Download className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">Gerar APK</span>
              </button>

              <button
                onClick={() => setActiveTab('smartpos')}
                className={`py-2 px-2 rounded-lg flex items-center justify-center gap-1.5 transition-all text-center ${
                  activeTab === 'smartpos'
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm font-semibold'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <CreditCard className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">SmartPOS</span>
              </button>
            </div>

            {/* Tab Contents */}
            <div className="p-4 sm:p-6 overflow-y-auto space-y-4">
              
              {/* ========================================================================= */}
              {/* TAB 0: GUIA DE RESOLUÇÃO (POR QUE O APK NÃO ESTÁ INSTALANDO)              */}
              {/* ========================================================================= */}
              {activeTab === 'troubleshoot' && (
                <div className="space-y-4">
                  {/* Banner de Destaque da Solução Principal */}
                  <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-950/50 via-[#0B1A24] to-[#0A1224] border border-emerald-500/40 shadow-[0_0_25px_rgba(16,185,129,0.15)]">
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                        <CheckCircle2 className="w-5 h-5" />
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-white">
                            Método Oficial e Sem Erros: Google Chrome (WebAPK)
                          </h4>
                          <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold px-2 py-0.2 rounded-full uppercase">
                            100% Garantido
                          </span>
                        </div>
                        <p className="text-xs text-slate-300 leading-relaxed">
                          Você <strong>não precisa</strong> baixar arquivo APK manualmente nem ativar fontes desconhecidas! O Android possui a tecnologia WebAPK oficial da Google:
                        </p>
                        <div className="mt-2.5 p-2.5 bg-black/40 rounded-lg border border-white/5 text-xs text-slate-200 space-y-1">
                          <p className="font-semibold text-emerald-300">Como instalar em 3 toques:</p>
                          <p>1. No celular Android, abra o <strong>Google Chrome</strong> e acesse o endereço do Bella PDV.</p>
                          <p>2. Toque nos <strong>3 pontinhos (⋮)</strong> no canto superior direito do Chrome.</p>
                          <p>3. Toque em <strong>"Instalar aplicativo"</strong> (ou "Adicionar à tela inicial").</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <h5 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5 pt-1">
                    <ShieldAlert className="w-4 h-4 text-amber-400" />
                    Qual mensagem de erro apareceu no seu celular?
                  </h5>

                  {/* Acordeon / Cards com os 4 motivos mais comuns */}
                  <div className="space-y-2.5">
                    {/* Caso 1: Baixou arquivo .ZIP em vez de APK */}
                    <div className="border border-white/10 rounded-xl bg-[#0F172A] overflow-hidden">
                      <button
                        onClick={() => setActiveTroubleAccordion(activeTroubleAccordion === 'zip_file' ? null : 'zip_file')}
                        className="w-full p-3.5 flex items-center justify-between text-left hover:bg-white/5 transition-colors"
                      >
                        <div className="flex items-center gap-2.5">
                          <FileWarning className="w-4 h-4 text-amber-400 shrink-0" />
                          <div>
                            <p className="text-xs font-bold text-white">
                              1. "Não é possível abrir o arquivo" (O arquivo baixado terminou em .zip)
                            </p>
                            <p className="text-[11px] text-slate-400">
                              O celular não reconhece o arquivo baixado ou tenta descompactar
                            </p>
                          </div>
                        </div>
                        <ChevronRight className={`w-4 h-4 text-slate-400 transition-transform ${activeTroubleAccordion === 'zip_file' ? 'rotate-90 text-amber-400' : ''}`} />
                      </button>

                      {activeTroubleAccordion === 'zip_file' && (
                        <div className="p-3.5 pt-0 border-t border-white/5 bg-[#0A101D] text-xs text-slate-300 space-y-2">
                          <p>
                            O botão de "Baixar Pacote" gera um arquivo <strong>.zip</strong> com o código de compilação técnica para programadores. O sistema Android só executa arquivos <strong>.apk</strong> ou instalações diretas.
                          </p>
                          <div className="p-2.5 bg-amber-500/10 border border-amber-500/20 rounded-lg text-amber-200">
                            <strong>Como resolver:</strong> Abra o Bella PDV no <strong>Google Chrome</strong> do celular e toque nos 3 pontinhos (⋮) &gt; <strong>"Instalar aplicativo"</strong>. O aplicativo será instalado imediatamente na sua tela sem precisar de nenhum arquivo .zip.
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Caso 2: Play Protect Bloqueou */}
                    <div className="border border-white/10 rounded-xl bg-[#0F172A] overflow-hidden">
                      <button
                        onClick={() => setActiveTroubleAccordion(activeTroubleAccordion === 'play_protect' ? null : 'play_protect')}
                        className="w-full p-3.5 flex items-center justify-between text-left hover:bg-white/5 transition-colors"
                      >
                        <div className="flex items-center gap-2.5">
                          <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />
                          <div>
                            <p className="text-xs font-bold text-white">
                              2. "Bloqueado pelo Play Protect" (Aviso vermelho ou amarelo)
                            </p>
                            <p className="text-[11px] text-slate-400">
                              O Google Play Protect alerta sobre aplicativos fora da Play Store
                            </p>
                          </div>
                        </div>
                        <ChevronRight className={`w-4 h-4 text-slate-400 transition-transform ${activeTroubleAccordion === 'play_protect' ? 'rotate-90 text-rose-400' : ''}`} />
                      </button>

                      {activeTroubleAccordion === 'play_protect' && (
                        <div className="p-3.5 pt-0 border-t border-white/5 bg-[#0A101D] text-xs text-slate-300 space-y-2">
                          <p>
                            Como o APK é corporativo/privado e não passou pela aprovação da Google Play Store, o Android exibe um aviso de segurança preventivo.
                          </p>
                          <ol className="list-decimal pl-4 space-y-1 text-slate-300">
                            <li>Confirme que o endereço de origem é o site oficial BellaPDV Pro.</li>
                            <li>Não desative o Play Protect nem ignore avisos de ameaça.</li>
                            <li>Se o alerta persistir, interrompa a instalação e fale com o suporte.</li>
                          </ol>
                        </div>
                      )}
                    </div>

                    {/* Caso 3: Permissão de Fontes Desconhecidas */}
                    <div className="border border-white/10 rounded-xl bg-[#0F172A] overflow-hidden">
                      <button
                        onClick={() => setActiveTroubleAccordion(activeTroubleAccordion === 'unknown_sources' ? null : 'unknown_sources')}
                        className="w-full p-3.5 flex items-center justify-between text-left hover:bg-white/5 transition-colors"
                      >
                        <div className="flex items-center gap-2.5">
                          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                          <div>
                            <p className="text-xs font-bold text-white">
                              3. "Para sua segurança, seu smartphone não tem permissão para instalar..."
                            </p>
                            <p className="text-[11px] text-slate-400">
                              Bloqueio nativo do Android para instalação de APK via Chrome ou WhatsApp
                            </p>
                          </div>
                        </div>
                        <ChevronRight className={`w-4 h-4 text-slate-400 transition-transform ${activeTroubleAccordion === 'unknown_sources' ? 'rotate-90 text-amber-400' : ''}`} />
                      </button>

                      {activeTroubleAccordion === 'unknown_sources' && (
                        <div className="p-3.5 pt-0 border-t border-white/5 bg-[#0A101D] text-xs text-slate-300 space-y-2">
                          <ol className="list-decimal pl-4 space-y-1 text-slate-300">
                            <li>Quando o aviso surgir na tela, toque no botão <strong>"Configurações"</strong>.</li>
                            <li>Ative o interruptor <strong>"Permitir desta fonte"</strong> (autorizando o Chrome, WhatsApp ou Gerenciador de Arquivos).</li>
                            <li>Toque no botão <strong>Voltar</strong> do celular.</li>
                            <li>Toque em <strong>"Instalar"</strong>.</li>
                          </ol>
                        </div>
                      )}
                    </div>

                    {/* Caso 4: "App não instalado" ou "O pacote parece estar corrompido" */}
                    <div className="border border-white/10 rounded-xl bg-[#0F172A] overflow-hidden">
                      <button
                        onClick={() => setActiveTroubleAccordion(activeTroubleAccordion === 'package_corrupt' ? null : 'package_corrupt')}
                        className="w-full p-3.5 flex items-center justify-between text-left hover:bg-white/5 transition-colors"
                      >
                        <div className="flex items-center gap-2.5">
                          <X className="w-4 h-4 text-rose-400 shrink-0" />
                          <div>
                            <p className="text-xs font-bold text-white">
                              4. "App não instalado" ou "O pacote parece estar corrompido"
                            </p>
                            <p className="text-[11px] text-slate-400">
                              Geralmente causado por versão antiga já instalada ou download incompleto
                            </p>
                          </div>
                        </div>
                        <ChevronRight className={`w-4 h-4 text-slate-400 transition-transform ${activeTroubleAccordion === 'package_corrupt' ? 'rotate-90 text-rose-400' : ''}`} />
                      </button>

                      {activeTroubleAccordion === 'package_corrupt' && (
                        <div className="p-3.5 pt-0 border-t border-white/5 bg-[#0A101D] text-xs text-slate-300 space-y-2">
                          <p>Isso acontece por 2 razões:</p>
                          <ul className="list-disc pl-4 space-y-1 text-slate-300">
                            <li><strong>Conflito de versão:</strong> Se você já tinha um aplicativo de teste instalado com o mesmo nome, vá em <em>Configurações do Android &gt; Aplicativos &gt; Bella PDV</em> e clique em <strong>Desinstalar</strong> antes de reinstalar.</li>
                            <li><strong>Download interrompido:</strong> Se a conexão oscilou ao baixar o arquivo, baixe o APK novamente ou utilize a instalação direta via Google Chrome.</li>
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Ação rápida para testar no Chrome */}
                  <div className="pt-2 flex flex-col sm:flex-row gap-2">
                    <button
                      onClick={() => setActiveTab('instant')}
                      className="flex-1 py-2.5 px-4 bg-gradient-to-r from-emerald-500 to-cyan-600 hover:from-emerald-400 hover:to-cyan-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-2"
                    >
                      <Smartphone className="w-4 h-4" />
                      <span>Instalar Agora via Google Chrome</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setActiveTab('qrcode')}
                      className="py-2.5 px-4 bg-white/10 hover:bg-white/15 text-white font-semibold text-xs rounded-xl border border-white/10 transition-all flex items-center justify-center gap-1.5"
                    >
                      <QrCode className="w-4 h-4 text-cyan-400" />
                      <span>Ver QR Code para Celular</span>
                    </button>
                  </div>
                </div>
              )}

              {/* ========================================================================= */}
              {/* TAB 1: INSTALAÇÃO DIRETA / WEBAPK                                        */}
              {/* ========================================================================= */}
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
                        A instalação pelo navegador pode adicionar o aplicativo à tela inicial. Recursos offline dependem da conectividade e não estão garantidos para todas as operações.
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
                            O app aparecerá instalado na sua gaveta de aplicativos com ícone e tela cheia.
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

              {/* ========================================================================= */}
              {/* TAB 2: QR CODE                                                           */}
              {/* ========================================================================= */}
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

                      {rawAppUrl.includes('ais-dev-') && (
                        <div className="flex items-center gap-2 p-2 bg-blue-500/10 border border-blue-500/20 rounded-lg text-[11px] text-blue-200">
                          <Info className="w-3.5 h-3.5 shrink-0 text-blue-400" />
                          <span>Usando link público pré-configurado para permitir abertura em qualquer dispositivo sem login.</span>
                        </div>
                      )}

                      <div className="bg-[#090D18] p-2.5 rounded-lg border border-white/5 flex items-center justify-between gap-2">
                        <span className="text-[11px] text-slate-300 truncate font-mono select-all">
                          {currentTargetUrl}
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

              {/* ========================================================================= */}
              {/* TAB 3: GERAR ARQUIVO APK / TWA                                           */}
              {/* ========================================================================= */}
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
                          Ferramenta oficial da Microsoft e Google que empacota o PWA em um arquivo <strong>.apk</strong> assinado para distribuição direta ou <strong>.aab</strong> para a Google Play Store.
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
                        title="Baixar arquivos de configuração técnica (AndroidManifest.xml, ícones, assetlinks)"
                      >
                        <Download className="w-4 h-4 text-cyan-400" />
                        {isGeneratingZip ? 'Compactando...' : 'Baixar Código Fonte Android (.zip)'}
                      </button>
                    </div>

                    <p className="text-[11px] text-amber-300/90 bg-amber-500/10 p-2 rounded-lg border border-amber-500/20">
                      ⚠️ <strong>Nota:</strong> O arquivo .zip é destinado a desenvolvedores. O Android não instala arquivos .zip. Para instalar no aparelho, use o PWABuilder para gerar o arquivo .apk ou instale direto pelo Google Chrome.
                    </p>
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
bubblewrap init --manifest="${currentTargetUrl}/manifest.json"

# 3. Compilar o APK final assinado
bubblewrap build`}
                    </pre>
                    <p className="text-[11px] text-slate-400">
                      Gera o arquivo <code className="text-cyan-300 font-mono">app-release-signed.apk</code> pronto para ser instalado via cabo USB ou pendrive em qualquer tablet ou smartphone Android.
                    </p>
                  </div>

                  {/* Integração Firebase Realtime Database (Android & Web) */}
                  <div className="bg-[#111827] border border-amber-500/30 rounded-xl p-4 sm:p-5 space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30">
                          <Flame className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
                            Firebase Realtime Database (Conexão Android & Web)
                          </h4>
                          <p className="text-[11px] text-slate-400">
                            Sincronização bidirecional em tempo real e persistência offline nativa
                          </p>
                        </div>
                      </div>

                      <button
                        onClick={handleTestRtdb}
                        disabled={isTestingRtdb}
                        className="py-1.5 px-3 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all self-start sm:self-auto disabled:opacity-50"
                      >
                        <Database className="w-3.5 h-3.5" />
                        {isTestingRtdb ? 'Testando...' : 'Testar Conexão RTDB'}
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                      {/* Kotlin Android Snippet */}
                      <div className="p-3 bg-[#090D18] border border-white/10 rounded-lg flex flex-col justify-between space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-emerald-400">Android (Kotlin / build.gradle.kts)</span>
                          <button
                            onClick={handleCopyKotlin}
                            className="text-[11px] text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
                          >
                            {copiedKotlin ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                            {copiedKotlin ? 'Copiado' : 'Copiar'}
                          </button>
                        </div>
                        <pre className="p-2 bg-black/60 rounded text-[10px] font-mono text-slate-300 overflow-x-auto leading-relaxed">
{`// build.gradle.kts:
implementation(platform("com.google.firebase:firebase-bom:34.18.0"))
implementation("com.google.firebase:firebase-database")

// Escrever:
val database = Firebase.database
database.getReference("message").setValue("Hello, World!")`}
                        </pre>
                      </div>

                      {/* Web Snippet */}
                      <div className="p-3 bg-[#090D18] border border-white/10 rounded-lg flex flex-col justify-between space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-cyan-400">Web App (TypeScript / JS)</span>
                          <button
                            onClick={handleCopyWebSnippet}
                            className="text-[11px] text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
                          >
                            {copiedWebSnippet ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                            {copiedWebSnippet ? 'Copiado' : 'Copiar'}
                          </button>
                        </div>
                        <pre className="p-2 bg-black/60 rounded text-[10px] font-mono text-slate-300 overflow-x-auto leading-relaxed">
{`import { getDatabase, ref, set } from "firebase/database";
import { app } from "./lib/firebase";

const database = getDatabase(app);
set(ref(database, 'message'), "Hello, World!");`}
                        </pre>
                      </div>
                    </div>

                    <div className="p-2.5 bg-black/30 rounded-lg border border-white/5 text-[11px] text-slate-300 space-y-1">
                      <p className="font-semibold text-amber-300">💡 Boas Práticas Recomendadas:</p>
                      <p>• <strong>Estrutura Plana:</strong> Mantenha os nós desnormalizados para evitar downloads pesados desnecessários.</p>
                      <p>• <strong>Persistência Offline:</strong> O SDK do Android e PWA salvam os dados em disco local e sincronizam automaticamente ao reconectar.</p>
                    </div>
                  </div>
                </div>
              )}

              {/* ========================================================================= */}
              {/* TAB 4: SMARTPOS (MAQUININHAS DE CARTÃO ANDROID)                          */}
              {/* ========================================================================= */}
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
                        Abra o Google Chrome ou o navegador integrado da maquininha e digite o endereço: <strong className="text-cyan-300">{currentTargetUrl}</strong> (ou escaneie o QR Code com a câmera traseira).
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
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  onClick={() => setActiveTab('troubleshoot')}
                  className="px-3 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-lg text-xs font-medium transition-colors"
                >
                  Ajuda de Instalação
                </button>
                <button
                  onClick={onClose}
                  className="flex-1 sm:flex-none px-5 py-2 bg-white/10 hover:bg-white/15 text-white font-medium rounded-lg transition-colors text-center"
                >
                  Fechar
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
