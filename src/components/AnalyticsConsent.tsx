import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { hasAnalyticsConsent, setAnalyticsConsent } from '../lib/conversionAnalytics';

export function AnalyticsConsent() {
  const { pathname } = useLocation();
  const [choice, setChoice] = useState(() => {
    try { return localStorage.getItem('bella_analytics_consent'); } catch { return null; }
  });
  if (!['/landing', '/demo', '/login'].includes(pathname) || choice !== null) return null;
  const decide = (allowed: boolean) => {
    setAnalyticsConsent(allowed);
    setChoice(allowed ? 'yes' : 'no');
  };
  return <section role="dialog" aria-label="Preferências de análise" className="fixed bottom-4 left-4 right-4 z-[100] mx-auto max-w-lg rounded-xl border border-cyan-500/30 bg-slate-950 p-4 text-sm text-white shadow-2xl">
    <p>Autoriza métricas de visitas e cliques de conversão para melhorar o Bella PDV Pro? Não enviamos dados do cadastro para o Analytics.</p>
    <div className="mt-3 flex gap-3">
      <button onClick={() => decide(true)} className="rounded-lg bg-cyan-400 px-4 py-2 font-semibold text-slate-950">Aceitar</button>
      <button onClick={() => decide(false)} className="rounded-lg border border-white/20 px-4 py-2">Recusar</button>
    </div>
  </section>;
}
