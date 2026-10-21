declare global {
  interface Window {
    dataLayer?: Array<Record<string, unknown>>;
    bellaLoadGtm?: () => boolean;
    gtag?: (...args: unknown[]) => void;
  }
}
export type ConversionEvent = 'landing_page_view' | 'demo_page_view' | 'conversion_cta_click' | 'demo_cta_click' | 'trial_cta_click' | 'trial_signup_started' | 'trial_signup_completed';
export function hasAnalyticsConsent(): boolean {
  try { return localStorage.getItem('bella_analytics_consent') === 'yes'; }
  catch { return false; }
}
/** Do not forward email, phone, company name, user ID, or payment information to analytics. */
export function trackConversion(event: ConversionEvent, source: string, plan?: string): void {
  if (typeof window === 'undefined' || !hasAnalyticsConsent()) return;
  // A tag GA4 configurada no index.html usa este mesmo dataLayer.
  // Não chamar o Firebase Analytics SDK paralelamente: duplicaria eventos.
  window.gtag?.('event', event, {
    event_category: 'bella_conversion',
    cta_location: source,
    ...(plan ? { plan_name: plan } : {})
  });
}
export function setAnalyticsConsent(allowed: boolean): void {
  try { localStorage.setItem('bella_analytics_consent', allowed ? 'yes' : 'no'); } catch {}
  if (allowed) window.bellaLoadGtm?.();
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({ event: 'bella_consent_update', analytics_consent: allowed ? 'granted' : 'denied' });
}
