import { app } from '../lib/firebase';
import { getAnalytics, isSupported, logEvent } from 'firebase/analytics';

declare global { interface Window { fbq?: (...args: unknown[]) => void; dataLayer?: Array<Record<string, unknown>>; } }
export type BellaAnalyticsEvent = 'trial_cta_click' | 'trial_started' | 'form_abandoned' | 'signup_started' | 'page_view';
type Parameters = Record<string, string | number | boolean>;
const hasConsent = () => { try { return window.localStorage.getItem('bella_analytics_consent') === 'yes'; } catch { return false; } };
let pixelLoaded = false;
let firebasePromise: Promise<ReturnType<typeof getAnalytics> | null> | null = null;

export function initializeMetaPixel(): void {
  if (typeof window === 'undefined' || !hasConsent() || pixelLoaded) return;
  const pixelId = import.meta.env.VITE_META_PIXEL_ID;
  if (!/^\d{8,20}$/.test(pixelId || '')) return;
  pixelLoaded = true;
  if (!window.fbq) {
    const queue: unknown[][] = [];
    const fbq = (...args: unknown[]) => {
      const handler = (fbq as typeof fbq & { callMethod?: (...args: unknown[]) => void }).callMethod;
      if (handler) handler(...args);
      else queue.push(args);
    };
    Object.assign(fbq, { queue, loaded: true, version: '2.0', push: fbq });
    window.fbq = fbq;
    const script = document.createElement('script');
    script.async = true;
    script.src = 'https://connect.facebook.net/en_US/fbevents.js';
    document.head.appendChild(script);
  }
  window.fbq('init', pixelId);
  window.fbq('track', 'PageView');
}
function firebaseAnalytics() {
  if (!firebasePromise) firebasePromise = isSupported().then(ok => ok ? getAnalytics(app) : null).catch(() => null);
  return firebasePromise;
}
/** Only non-PII commercial metadata; no email, names, phone or auth identifiers. */
export async function logBellaEvent(event: BellaAnalyticsEvent, params: Parameters = {}): Promise<void> {
  if (typeof window === 'undefined' || !hasConsent()) return;
  initializeMetaPixel();
  const safe = Object.fromEntries(Object.entries(params).filter(([key, value]) => /^[a-z][a-z0-9_]{0,39}$/.test(key) && (typeof value === 'boolean' || typeof value === 'number' || (typeof value === 'string' && value.length <= 80))));
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({ event: 'bella_' + event, ...safe });
  // Firebase Analytics shares the GA4 measurement ID; do not also call gtag('event').
  const analytics = await firebaseAnalytics();
  if (analytics && hasConsent()) logEvent(analytics, event, safe as Record<string, string | number | boolean>);
  if (!hasConsent() || !window.fbq) return;
  if (event === 'trial_started') window.fbq('track', 'CompleteRegistration', { content_name: 'BellaPDV Trial' });
  else if (event === 'trial_cta_click') window.fbq('trackCustom', 'TrialCtaClick', safe);
  else if (event === 'form_abandoned') window.fbq('trackCustom', 'FormAbandoned', safe);
}
export function trackMetaPageView(path: string): void {
  if (typeof window === 'undefined' || !hasConsent()) return;
  initializeMetaPixel();
  void logBellaEvent('page_view', { page_path: path });
}
