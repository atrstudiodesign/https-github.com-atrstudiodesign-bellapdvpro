import { useEffect, useState } from 'react';
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
    <section id="baixar-android" aria-labelledby="android-download-heading" className="px-4 sm:px-6 py-14 sm:py-20">
      <div className="max-w-6xl mx-auto rounded-3xl border border-[#00D9FF]/25 bg-gradient-to-br from-[#10254B] via-[#0B1933] to-[#180E36] p-7 sm:p-12 shadow-[0_0_50px_rgba(0,217,255,0.08)]">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-8">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-[#00D9FF]/10 border border-[#00D9FF]/25 px-3 py-1 text-xs font-bold text-[#00D9FF] mb-5">
              <Smartphone className="w-4 h-4" aria-hidden="true" /> APP PARA ANDROID
            </div>
            <h2 id="android-download-heading" className="text-3xl sm:text-4xl font-black text-white leading-tight">
              BellaPDV Pro no seu celular
            </h2>
            <p className="text-[#B7C6E0] mt-4 leading-relaxed">
              Baixe o aplicativo Android e gerencie sua operação pelo celular. Distribuição direta pelo site oficial enquanto a publicação na Google Play está em preparação.
            </p>
            <p className="flex items-start gap-2 text-sm text-[#A6BAD7] mt-4">
              <ShieldCheck className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" aria-hidden="true" />
              Para instalar um APK fora da Play Store, o Android pode solicitar autorização para instalar apps desta fonte. Confirme que o download veio deste site oficial.
            </p>
          </div>
          <div className="w-full md:w-auto md:min-w-64 flex flex-col items-stretch gap-3">
            {available ? (
              <a
                href={APK_PATH}
                download="bellapdv-pro-android.apk"
                onClick={() => trackEvent('android_apk_download', { source: 'landing_android_download', filename: 'bellapdv-pro-android.apk' })}
                className="inline-flex justify-center items-center gap-3 rounded-full px-7 py-4 bg-gradient-to-r from-[#00D9FF] to-[#087CFF] text-[#041024] text-sm font-black hover:brightness-110 transition"
              >
                <Download className="w-5 h-5" aria-hidden="true" /> Baixar APK para Android
              </a>
            ) : (
              <div aria-live="polite" className="rounded-full px-7 py-4 text-center bg-white/10 border border-white/15 text-[#CBD5E1] text-sm font-bold">
                {checking ? 'Verificando download…' : 'Download Android em preparação'}
              </div>
            )}
            <a href="/instalar/android" className="text-center underline text-cyan-300 text-xs hover:text-white">Como instalar o APK no Android</a>
            <span className="text-center text-xs text-[#A6BAD7]">
              {available ? 'Arquivo APK para instalação manual no Android.' : 'O botão será liberado após a publicação do arquivo APK.'}
            </span>
            <div className="border-t border-white/10 pt-4 mt-2 flex flex-col gap-2">
              {windowsAvailable ? (
                <a href={WINDOWS_PATH} download="BellaPDV-Pro-Setup.exe"
                  onClick={() => trackEvent('windows_installer_download', { source: 'landing_windows_download' })}
                  className="inline-flex justify-center items-center gap-3 rounded-full px-7 py-4 bg-white/10 hover:bg-white/20 border border-cyan-400/30 text-white text-sm font-bold transition">
                  <MonitorDown className="w-5 h-5" aria-hidden="true" /> Baixar para Windows
                </a>
              ) : (
                <div aria-live="polite" className="rounded-full px-7 py-4 text-center bg-white/5 border border-white/10 text-[#CBD5E1] text-sm font-bold">
                  <MonitorDown className="inline-block w-4 h-4 mr-2" aria-hidden="true" />
                  {windowsChecking ? 'Verificando versão Windows…' : 'Instalador Windows em preparação'}
                </div>
              )}
              <span className="text-center text-xs text-[#A6BAD7]">Windows 10/11, 64 bits — versão desktop</span>
              <a href="/instalar/windows" className="text-center underline text-cyan-300 text-xs hover:text-white">Como instalar no Windows</a>
              <a href="/como-usar" className="text-center underline text-cyan-300 text-xs hover:text-white">Aprenda a usar o BellaPDV Pro</a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
