import React, { useState, useEffect } from 'react';
import { Download, Smartphone, ShieldCheck, MonitorDown } from 'lucide-react';
import { trackEvent } from '../../services/analyticsService';

const APK_PATH = '/downloads/bellapdv-pro-android.apk';
const WINDOWS_PATH = '/downloads/BellaPDV-Pro-Setup.exe';

export function AndroidDownloadSection() {
  const [available, setAvailable] = useState(false);
  const [checking, setChecking] = useState(true);
  const [windowsAvailable, setWindowsAvailable] = useState(false);
  const [windowsChecking, setWindowsChecking] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function checkApk() {
      try {
        const response = await fetch(APK_PATH, { method: 'HEAD', cache: 'no-store' });
        const type = response.headers.get('content-type')?.toLowerCase() ?? '';
        const size = Number(response.headers.get('content-length') ?? 0);
        // An SPA rewrite may answer 200 with index.html when the APK is absent.
        if (!cancelled) setAvailable(response.ok && !type.includes('text/html') && size > 100_000);
      } catch {
        if (!cancelled) setAvailable(false);
      } finally {
        if (!cancelled) setChecking(false);
      }
    }
    async function checkWindows() {
      try {
        const response = await fetch(WINDOWS_PATH, { method: 'HEAD', cache: 'no-store' });
        const type = response.headers.get('content-type')?.toLowerCase() ?? '';
        const size = Number(response.headers.get('content-length') ?? 0);
        if (!cancelled) setWindowsAvailable(response.ok && !type.includes('text/html') && size > 1_000_000);
      } catch {
        if (!cancelled) setWindowsAvailable(false);
      } finally {
        if (!cancelled) setWindowsChecking(false);
      }
    }
    void checkApk();
    void checkWindows();
    return () => { cancelled = true; };
  }, []);

  return (
    <section id="baixar-android" aria-labelledby="apps-heading" className="relative z-10 px-4 sm:px-6 py-16 sm:py-24 bg-[#030817]">
      <div className="max-w-6xl mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-10">
          <span className="inline-flex rounded-full px-4 py-1.5 border border-cyan-400/30 bg-cyan-400/10 text-cyan-300 uppercase text-xs font-bold tracking-widest">APLICATIVOS BELLA PDV PRO</span>
          <h2 id="apps-heading" className="text-3xl sm:text-5xl font-black text-white mt-5 leading-tight">Seu sistema onde seu negócio acontece.</h2>
          <p className="text-[#B7C6E0] mt-4 text-sm sm:text-base leading-relaxed">Instale no Android ou acompanhe o lançamento da versão Windows. Acesse também o guia de instalação e os primeiros passos do sistema.</p>
        </div>
        <div className="grid md:grid-cols-2 gap-5 lg:gap-7 items-stretch">
          <article className="rounded-3xl border border-cyan-400/30 bg-gradient-to-br from-[#113154] via-[#0D203D] to-[#0C1731] shadow-[0_15px_45px_rgba(0,217,255,0.07)] p-6 sm:p-9 flex flex-col min-h-[365px]">
            <div className="flex justify-between items-start gap-3">
              <div className="p-3 rounded-2xl bg-cyan-400/10 border border-cyan-400/20"><Smartphone className="h-7 w-7 text-cyan-300" aria-hidden="true"/></div>
              <span className="text-[11px] font-bold text-emerald-300 rounded-full border border-emerald-400/25 bg-emerald-400/10 px-3 py-1.5">ANDROID • APK</span>
            </div>
            <h3 className="text-2xl font-extrabold mt-6 text-white">BellaPDV Pro para Android</h3>
            <p className="text-slate-300 text-sm leading-relaxed mt-3">Leve agenda, clientes e gestão do negócio para o celular. Disponível para instalação pelo site oficial enquanto a publicação na Google Play está em preparação.</p>
            <div className="mt-auto pt-7 space-y-3">
              {available ? (
                <a href={APK_PATH} download="bellapdv-pro-android.apk" onClick={() => trackEvent('android_apk_download', { source: 'landing_android_download', filename: 'bellapdv-pro-android.apk' })}
                   className="w-full inline-flex items-center justify-center gap-3 px-5 py-4 rounded-xl bg-gradient-to-r from-[#00D9FF] to-[#087CFF] text-[#041024] text-sm font-extrabold hover:brightness-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-300 transition">
                  <Download size={19} aria-hidden="true"/> Baixar APK para Android
                </a>
              ) : (
                <div aria-live="polite" className="w-full text-center rounded-xl border border-white/15 bg-white/10 py-4 px-4 text-slate-200 text-sm font-bold">{checking ? 'Verificando disponibilidade do APK…' : 'APK temporariamente indisponível'}</div>
              )}
              <a href="/instalar/android" className="flex justify-center items-center gap-2 text-sm font-semibold text-cyan-300 hover:text-white underline underline-offset-4">Ver como instalar no Android</a>
              <p className="text-center text-xs text-slate-400">Instalação manual. Confira a origem do arquivo e os avisos de segurança.</p>
            </div>
          </article>
          <article className="rounded-3xl border border-violet-400/25 bg-gradient-to-br from-[#171B41] via-[#101A36] to-[#17102B] p-6 sm:p-9 flex flex-col min-h-[365px]">
            <div className="flex justify-between items-start gap-3">
              <div className="p-3 rounded-2xl bg-violet-400/10 border border-violet-400/20"><MonitorDown className="h-7 w-7 text-violet-300" aria-hidden="true"/></div>
              <span className="text-[11px] font-bold text-violet-200 rounded-full border border-violet-400/25 bg-violet-400/10 px-3 py-1.5">WINDOWS • DESKTOP</span>
            </div>
            <h3 className="text-2xl font-extrabold mt-6 text-white">BellaPDV Pro para Windows</h3>
            <p className="text-slate-300 text-sm leading-relaxed mt-3">Versão desktop com janela própria e abertura personalizada para a rotina do caixa. O instalador está em homologação antes da distribuição aos clientes.</p>
            <div className="mt-auto pt-7 space-y-3">
              {windowsAvailable ? (
                <a href={WINDOWS_PATH} download="BellaPDV-Pro-Setup.exe" onClick={() => trackEvent('windows_installer_download', { source: 'landing_windows_download' })}
                   className="w-full inline-flex items-center justify-center gap-3 px-5 py-4 rounded-xl border border-violet-400/40 bg-violet-500/25 text-white text-sm font-extrabold hover:bg-violet-500/35 transition">
                  <Download size={19} aria-hidden="true"/> Baixar para Windows
                </a>
              ) : (
                <div aria-live="polite" className="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/5 px-4 py-4 text-slate-300 text-sm font-bold">
                  <MonitorDown size={17} aria-hidden="true"/>{windowsChecking ? 'Verificando instalador…' : 'Instalador Windows em preparação'}
                </div>
              )}
              <a href="/instalar/windows" className="flex justify-center items-center gap-2 text-sm font-semibold text-violet-200 hover:text-white underline underline-offset-4">Ver guia para Windows</a>
              <p className="text-center text-xs text-slate-400">Compatível com Windows 10/11, 64 bits, após homologação.</p>
            </div>
          </article>
        </div>
        <div className="mt-7 rounded-2xl border border-white/10 bg-white/[0.035] py-5 px-6 flex flex-col sm:flex-row gap-4 justify-between items-center">
          <div className="flex gap-3 items-center"><ShieldCheck className="text-emerald-300 w-5 h-5 shrink-0" aria-hidden="true"/><p className="text-sm text-slate-300">Novo no BellaPDV Pro? Comece pelo manual e configure seu primeiro atendimento.</p></div>
          <a href="/como-usar" className="shrink-0 text-cyan-300 text-sm font-bold hover:text-white underline underline-offset-4">Aprenda a usar o BellaPDV Pro →</a>
        </div>
      </div>
    </section>
  );
}
