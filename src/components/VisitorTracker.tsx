import { useEffect, useState } from 'react';
import { auth, db } from '../lib/firebase';
import { signInAnonymously } from 'firebase/auth';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';

const STORAGE_KEY = 'bella_analytics_consent';
const allowedPages = new Set(['/landing', '/demo', '/login']);

async function trackPublicPage(route: string) {
  if (!allowedPages.has(route)) return;
  // No blocking: public pages render even if Firebase rejects analytics.
  let user = auth.currentUser;
  if (!user) user = (await signInAnonymously(auth)).user;
  await addDoc(collection(db, 'visitor_events'), {
    event: 'page_view',
    visitorId: user.uid,
    route,
    occurredAt: serverTimestamp(),
    source: 'bella_web'
  });
}

export function VisitorTracker({ page }: { page: '/landing' | '/demo' | '/login' }) {
  const [choice, setChoice] = useState<string | null>(() => {
    try { return window.localStorage.getItem(STORAGE_KEY); } catch { return null; }
  });
  useEffect(() => {
    if (choice !== 'yes') return;
    void trackPublicPage(page).catch(error => console.warn('Analytics unavailable:', error));
  }, [choice, page]);
  if (choice !== null) return null;
  return <div className="fixed bottom-3 left-3 right-3 z-[100] mx-auto max-w-lg rounded-xl border border-cyan-500/30 bg-[#0b172b] p-4 text-sm text-white shadow-2xl" role="dialog" aria-label="Preferências de análise de visitantes">
    <p>Podemos registrar visitas anônimas para melhorar o Bella PDV Pro? Não coletamos nome, e-mail ou IP nesse registro.</p>
    <div className="mt-3 flex gap-3">
      <button className="rounded-lg bg-cyan-400 px-4 py-2 font-semibold text-slate-950" onClick={() => { localStorage.setItem(STORAGE_KEY, 'yes'); setChoice('yes'); }}>Aceitar</button>
      <button className="rounded-lg border border-white/20 px-4 py-2" onClick={() => { localStorage.setItem(STORAGE_KEY, 'no'); setChoice('no'); }}>Recusar</button>
    </div>
  </div>;
}
