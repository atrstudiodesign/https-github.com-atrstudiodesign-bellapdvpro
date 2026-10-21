import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';

const KEY = 'bella_analytics_consent';
type GoogleTag = (...args: unknown[]) => void;
declare global { interface Window { gtag?: GoogleTag; } }
function applyConsent(allowed: boolean) {
  window.gtag?.('consent', 'update', { analytics_storage: allowed ? 'granted' : 'denied' });
}
export function AnalyticsConsent() {
  const { pathname } = useLocation();
  const [choice, setChoice] = useState<string | null>(() => {
    try { return localStorage.getItem(KEY); } catch { return null; }
  });
  useEffect(() => { if (choice === 'yes' || choice === 'no') applyConsent(choice === 'yes'); }, [choice]);
  const publicPage = ['/landing', '/demo', '/login'].includes(pathname);
  if (!publicPage || choice !== null) return null;
  const decide = (allowed: boolean) => {
    try { localStorage.setItem(KEY, allowed ? 'yes' : 'no'); } catch {}
    applyConsent(allowed);
    setChoice(allowed ? 'yes' : 'no');
  };
  return <section aria-label="Preferências de cookies" role="dialog" className="fixed bottom-4 left-4 right-4 z-[9999] mx-auto max-w-xl rounded-2xl border border-cyan-500/30 bg-slate-950 p-5 text-white shadow-2xl">
    <p className="font-semibold">Cookies e métricas de uso</p>
    <p className="mt-2 text-sm text-slate-300">Podemos medir visitas e cliques para melhorar o Bella PDV Pro? O funcionamento do sistema não depende da sua autorização.</p>
    <div className="mt-4 flex gap-3">
      <button type="button" onClick={() => decide(true)} className="rounded-lg bg-cyan-400 px-4 py-2 font-semibold text-slate-950">Aceitar</button>
      <button type="button" onClick={() => decide(false)} className="rounded-lg border border-white/25 px-4 py-2">Recusar</button>
    </div>
  </section>;
}
