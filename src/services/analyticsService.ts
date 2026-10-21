import { getAnalytics, isSupported, logEvent, Analytics, setUserId, setUserProperties } from 'firebase/analytics';
import { app } from '../lib/firebase';

let analyticsPromise: Promise<Analytics | null> | null = null;
let analyticsInstance: Analytics | null = null;

/**
 * Initializes Firebase Analytics safely with browser and environment checks.
 * Prevents errors in environments where IndexedDB or Analytics is not supported (SSR, bots, adblockers, etc.)
 */
export async function getAnalyticsInstance(): Promise<Analytics | null> {
  if (analyticsInstance) {
    return analyticsInstance;
  }

  if (typeof window === 'undefined') {
    return null;
  }

  if (!analyticsPromise) {
    analyticsPromise = (async () => {
      try {
        const supported = await isSupported();
        if (supported) {
          analyticsInstance = getAnalytics(app);
          if (import.meta.env.DEV) {
            console.log('[Analytics] Firebase Analytics inicializado com sucesso.');
          }
          return analyticsInstance;
        } else {
          if (import.meta.env.DEV) {
            console.warn('[Analytics] Firebase Analytics não é suportado neste ambiente.');
          }
          return null;
        }
      } catch (err) {
        console.warn('[Analytics] Falha ao inicializar Firebase Analytics:', err);
        return null;
      }
    })();
  }

  return analyticsPromise;
}

// Automatically initiate initialization when imported in browser
if (typeof window !== 'undefined') {
  getAnalyticsInstance().catch(() => {});
}

/**
 * Generic event logging utility.
 */
export async function trackEvent(eventName: string, eventParams: Record<string, any> = {}): Promise<void> {
  try {
    const analytics = await getAnalyticsInstance();
    const enrichedParams = {
      timestamp: new Date().toISOString(),
      url: typeof window !== 'undefined' ? window.location.href : '',
      path: typeof window !== 'undefined' ? window.location.pathname : '',
      ...eventParams
    };

    if (analytics) {
      logEvent(analytics, eventName, enrichedParams);
    }

    if (import.meta.env.DEV) {
      console.log(`[Analytics Event] 🎯 ${eventName}`, enrichedParams);
    }
  } catch (error) {
    console.warn(`[Analytics] Erro ao registrar evento "${eventName}":`, error);
  }
}

/**
 * Page View Tracking
 */
export function trackPageView(pageTitle?: string, pagePath?: string) {
  const title = pageTitle || (typeof document !== 'undefined' ? document.title : 'BellaPDV Pro');
  const path = pagePath || (typeof window !== 'undefined' ? window.location.pathname + window.location.search : '/');

  return trackEvent('page_view', {
    page_title: title,
    page_location: typeof window !== 'undefined' ? window.location.href : '',
    page_path: path
  });
}

/**
 * Conversion: 'Start Trial' / 'Teste Grátis 15 Dias' CTA click
 * Crucial conversion metric for landing page effectiveness.
 */
export function trackTrialStartClick(params: {
  source: string;
  plan?: string;
  promoText?: string;
  buttonLabel?: string;
}) {
  return trackEvent('start_trial_click', {
    event_category: 'Conversion',
    event_label: params.source,
    trial_days: 15,
    plan_name: params.plan || 'Plano Básico',
    promo_applied: params.promoText || 'De R$ 89,90 por R$ 29,90 nos primeiros 3 meses',
    button_label: params.buttonLabel || 'Testar 15 Dias Grátis',
    ...params
  });
}

/**
 * Conversion: Plan selection in Pricing section
 */
export function trackPlanSelection(params: {
  planId: string;
  planName: string;
  price: string | number;
  promoPrice?: string | number | null;
  isPopular?: boolean;
}) {
  return trackEvent('select_plan', {
    event_category: 'Pricing',
    event_label: params.planName,
    plan_id: params.planId,
    plan_name: params.planName,
    regular_price: params.price,
    promo_price: params.promoPrice || null,
    is_popular: !!params.isPopular
  });
}

/**
 * Conversion: Request Demo CTA click
 */
export function trackDemoRequestClick(params: {
  source: string;
  plan?: string;
  buttonLabel?: string;
}) {
  return trackEvent('demo_request_click', {
    event_category: 'Lead',
    event_label: params.source,
    plan_interest: params.plan || 'Geral',
    button_label: params.buttonLabel || 'Solicite uma demonstração',
    ...params
  });
}

/**
 * Conversion: Lead generation submitted (Form or WhatsApp)
 */
export function trackLeadGenerated(params: {
  leadType: 'whatsapp' | 'form' | 'instant_demo' | 'trial_signup';
  source: string;
  plan?: string;
  hasBusinessName?: boolean;
}) {
  return trackEvent('generate_lead', {
    event_category: 'Conversion',
    event_label: params.leadType,
    lead_type: params.leadType,
    source: params.source,
    plan_name: params.plan || 'Geral',
    has_business_name: params.hasBusinessName ?? false
  });
}

/**
 * User / Account identity in Analytics
 */
export async function setAnalyticsUser(userId: string, properties?: Record<string, any>) {
  try {
    const analytics = await getAnalyticsInstance();
    if (analytics) {
      setUserId(analytics, userId);
      if (properties) {
        setUserProperties(analytics, properties);
      }
    }
  } catch (err) {
    console.warn('[Analytics] Erro ao definir usuário:', err);
  }
}
