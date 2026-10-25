import type { Request, Response } from 'express';
import { randomUUID } from 'node:crypto';
import { applicationDefault, cert, getApps, initializeApp } from 'firebase-admin/app';
import { FieldValue, getFirestore } from 'firebase-admin/firestore';
import {
  BELLA_COMMERCIAL_PLANS,
  type BellaPlanId,
  isBellaPlanId,
  parseBellaExternalReference,
} from '../src/lib/commercialPlans';
import { constantTimeEqual, expectedPrice, moneyToCents } from './asaasBillingCore';

const PAYMENT_ACTIVE_EVENTS = new Set([
  'PAYMENT_RECEIVED',
  'PAYMENT_CONFIRMED',
  'PAYMENT_RECEIVED_IN_CASH',
]);

const PAYMENT_WARNING_EVENTS = new Set([
  'PAYMENT_OVERDUE',
  'PAYMENT_CREDIT_CARD_CAPTURE_REFUSED',
  'PAYMENT_CHARGEBACK_REQUESTED',
  'PAYMENT_CHARGEBACK_DISPUTE',
  'PAYMENT_AWAITING_CHARGEBACK_REVERSAL',
  'PAYMENT_REFUND_IN_PROGRESS',
  'PAYMENT_REFUNDED',
  'PAYMENT_PARTIALLY_REFUNDED',
  'PAYMENT_DELETED',
]);

const SUBSCRIPTION_EVENTS = new Set([
  'SUBSCRIPTION_CREATED',
  'SUBSCRIPTION_UPDATED',
  'SUBSCRIPTION_INACTIVATED',
  'SUBSCRIPTION_DELETED',
]);

const ALLOWED_EVENTS = new Set([
  ...PAYMENT_ACTIVE_EVENTS,
  ...PAYMENT_WARNING_EVENTS,
  ...SUBSCRIPTION_EVENTS,
  'PAYMENT_CREATED',
  'PAYMENT_UPDATED',
  'PAYMENT_RESTORED',
  'PAYMENT_REFUND_DENIED',
  'PAYMENT_BANK_SLIP_CANCELLED',
  'CHECKOUT_CREATED',
  'CHECKOUT_PAID',
  'CHECKOUT_CANCELED',
  'CHECKOUT_EXPIRED',
]);

type BillingMapping = { companyId: string; planId: BellaPlanId };

function requiredEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} is not configured`);
  return value;
}

function getAdminFirestore() {
  if (!getApps().length) {
    const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON?.trim();
    if (serviceAccountJson) {
      const parsed = JSON.parse(serviceAccountJson);
      initializeApp({ credential: cert(parsed) });
    } else if (process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) {
      initializeApp({
        credential: cert({
          projectId: process.env.FIREBASE_PROJECT_ID || 'bellapdv-15ae0',
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
        }),
      });
    } else {
      initializeApp({ credential: applicationDefault(), projectId: process.env.FIREBASE_PROJECT_ID || 'bellapdv-15ae0' });
    }
  }
  return getFirestore();
}

function cleanId(value: unknown): string | null {
  if (typeof value !== 'string' || !/^[A-Za-z0-9_&-]{4,180}$/.test(value)) return null;
  return value;
}

function asaasBaseUrl(): string {
  return process.env.ASAAS_ENV === 'sandbox'
    ? 'https://api-sandbox.asaas.com/v3'
    : 'https://api.asaas.com/v3';
}

async function asaasGet(path: string): Promise<any> {
  const apiKey = requiredEnv('ASAAS_API_KEY');
  const response = await fetch(`${asaasBaseUrl()}${path}`, {
    method: 'GET',
    headers: { accept: 'application/json', access_token: apiKey },
    signal: AbortSignal.timeout(8000),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(`Asaas GET ${path} failed (${response.status})`);
  return data;
}

async function asaasWrite(path: string, method: 'POST' | 'PUT', body: Record<string, unknown>): Promise<any> {
  const apiKey = requiredEnv('ASAAS_API_KEY');
  const response = await fetch(`${asaasBaseUrl()}${path}`, {
    method,
    headers: { accept: 'application/json', 'content-type': 'application/json', access_token: apiKey },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(10000),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(`Asaas ${method} ${path} failed (${response.status})`);
  return data;
}

async function resolveMapping(payload: any): Promise<BillingMapping | null> {
  const db = getAdminFirestore();
  const checkoutId = cleanId(payload?.checkout?.id);
  if (checkoutId) {
    const snap = await db.collection('billing_checkouts').doc(checkoutId).get();
    const data = snap.data();
    if (snap.exists && typeof data?.companyId === 'string' && isBellaPlanId(data.planId)) {
      return { companyId: data.companyId, planId: data.planId };
    }
  }

  const reference = parseBellaExternalReference(
    payload?.checkout?.externalReference || payload?.payment?.externalReference || payload?.subscription?.externalReference,
  );
  if (reference) {
    const snap = await db.collection('billing_intents').doc(reference.intentId).get();
    const data = snap.data();
    if (snap.exists && typeof data?.companyId === 'string' && isBellaPlanId(data.planId)) {
      return { companyId: data.companyId, planId: data.planId };
    }
  }

  const subscriptionId = cleanId(payload?.payment?.subscription || payload?.subscription?.id);
  if (subscriptionId) {
    const snap = await db.collection('billing_subscriptions').doc(subscriptionId).get();
    if (snap.exists) {
      const data = snap.data();
      if (typeof data?.companyId === 'string' && isBellaPlanId(data.planId)) {
        return { companyId: data.companyId, planId: data.planId };
      }
    }
  }

  // Never resolve tenancy by CPF/CNPJ, e-mail, or Asaas customer alone. The same
  // payer can own more than one Bella company; only an unguessable server-created
  // intent or an already bound subscription is authoritative.
  return null;
}

async function reserveWebhook(eventId: string, eventType: string): Promise<'reserved' | 'duplicate'> {
  const db = getAdminFirestore();
  const ref = db.collection('billing_webhook_events').doc(eventId);
  return db.runTransaction(async (tx) => {
    const existing = await tx.get(ref);
    if (existing.exists && existing.data()?.status !== 'failed') return 'duplicate';
    if (existing.exists) {
      tx.update(ref, { status: 'processing', attempts: FieldValue.increment(1), updatedAt: FieldValue.serverTimestamp() });
    } else {
      tx.create(ref, {
        eventId,
        eventType,
        status: 'processing',
        attempts: 1,
        receivedAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });
    }
    return 'reserved';
  });
}

async function markWebhook(eventId: string, status: 'processed' | 'unmapped' | 'failed', details?: Record<string, unknown>) {
  await getAdminFirestore().collection('billing_webhook_events').doc(eventId).set({
    status,
    ...details,
    updatedAt: FieldValue.serverTimestamp(),
  }, { merge: true });
}

async function applyWebhook(payload: any, mapping: BillingMapping) {
  const db = getAdminFirestore();
  const { companyId, planId } = mapping;
  const eventType = String(payload.event);
  const plan = BELLA_COMMERCIAL_PLANS[planId];
  const paymentId = cleanId(payload?.payment?.id);
  const subscriptionId = cleanId(payload?.payment?.subscription || payload?.subscription?.id);
  const customerId = cleanId(payload?.payment?.customer || payload?.subscription?.customer);
  const checkoutId = cleanId(payload?.checkout?.id);

  if (checkoutId) {
    const checkoutCustomerId = cleanId(payload?.checkout?.customer);
    await db.collection('billing_checkouts').doc(checkoutId).set({
      companyId,
      planId,
      customerId: checkoutCustomerId,
      status: payload?.checkout?.status || null,
      eventType,
      updatedAt: FieldValue.serverTimestamp(),
    }, { merge: true });
    if (checkoutCustomerId) {
      await db.collection('billing_customers').doc(checkoutCustomerId).set({
        companyId,
        planId,
        updatedAt: FieldValue.serverTimestamp(),
      }, { merge: true });
    }
    await db.collection('billing_tenants').doc(companyId).set({
      companyId,
      planId,
      asaasCheckoutId: checkoutId,
      asaasCustomerId: checkoutCustomerId,
      checkoutStatus: payload?.checkout?.status || null,
      updatedAt: FieldValue.serverTimestamp(),
    }, { merge: true });
    return;
  }

  if (paymentId) {
    const amountCents = moneyToCents(payload?.payment?.value);
    await db.collection('billing_payments').doc(paymentId).set({
      companyId,
      planId,
      subscriptionId,
      customerId,
      amountCents,
      priceMatchesCatalog: expectedPrice(planId, amountCents),
      status: payload?.payment?.status || null,
      eventType,
      dueDate: payload?.payment?.dueDate || null,
      paymentDate: payload?.payment?.paymentDate || null,
      updatedAt: FieldValue.serverTimestamp(),
    }, { merge: true });
  }

  if (subscriptionId) {
    await db.collection('billing_subscriptions').doc(subscriptionId).set({
      companyId,
      planId,
      customerId,
      status: payload?.subscription?.status || null,
      cycle: payload?.subscription?.cycle || null,
      valueCents: moneyToCents(payload?.subscription?.value),
      updatedAt: FieldValue.serverTimestamp(),
    }, { merge: true });
  }

  if (customerId) {
    await db.collection('billing_customers').doc(customerId).set({
      companyId,
      planId,
      updatedAt: FieldValue.serverTimestamp(),
    }, { merge: true });
  }

  const licenseUpdate: Record<string, unknown> = {
    id: companyId,
    plan: plan.licensePlan,
    asaasSubscriptionId: subscriptionId,
    asaasCustomerId: customerId,
    billingEvent: eventType,
    billingUpdatedAt: FieldValue.serverTimestamp(),
  };

  if (PAYMENT_ACTIVE_EVENTS.has(eventType)) {
    const amountCents = moneyToCents(payload?.payment?.value);
    if (!expectedPrice(planId, amountCents)) {
      licenseUpdate.billingStatus = 'price_mismatch';
      licenseUpdate.billingAmountCents = amountCents;
    } else {
      licenseUpdate.status = 'active';
      licenseUpdate.billingStatus = 'paid';

      if (planId === 'basic' && amountCents === plan.promoPriceCents && paymentId && subscriptionId) {
        const tenantRef = db.collection('billing_tenants').doc(companyId);
        const paymentRef = db.collection('billing_payments').doc(paymentId);
        const promoCount = await db.runTransaction(async (tx) => {
          const [tenantSnap, paymentSnap] = await Promise.all([tx.get(tenantRef), tx.get(paymentRef)]);
          const current = Number(tenantSnap.data()?.promoPaymentsReceived || 0);
          if (paymentSnap.data()?.promoCounted === true) return current;
          const next = current + 1;
          tx.set(paymentRef, { promoCounted: true }, { merge: true });
          tx.set(tenantRef, { promoPaymentsReceived: next }, { merge: true });
          return next;
        });
        if (promoCount >= plan.promoMonths) {
          await asaasWrite(`/subscriptions/${encodeURIComponent(subscriptionId)}`, 'PUT', {
            value: plan.monthlyPriceCents / 100,
            updatePendingPayments: false,
          });
          licenseUpdate.promoTransition = 'completed';
          licenseUpdate.promoTransitionAt = FieldValue.serverTimestamp();
        }
      }
    }
  } else if (PAYMENT_WARNING_EVENTS.has(eventType)) {
    // Do not hard-block on a single payment event. Reconciliation decides whether
    // another valid charge keeps the subscription active.
    licenseUpdate.billingStatus = 'warning';
  } else if (eventType === 'SUBSCRIPTION_INACTIVATED' || eventType === 'SUBSCRIPTION_DELETED') {
    licenseUpdate.status = 'expired';
    licenseUpdate.billingStatus = 'inactive';
  } else if (eventType === 'SUBSCRIPTION_CREATED' || eventType === 'SUBSCRIPTION_UPDATED') {
    licenseUpdate.billingStatus = 'subscription_active';
  }

  await db.collection('company_licenses').doc(companyId).set(licenseUpdate, { merge: true });
  await db.collection('billing_tenants').doc(companyId).set({
    companyId,
    planId,
    asaasSubscriptionId: subscriptionId,
    asaasCustomerId: customerId,
    updatedAt: FieldValue.serverTimestamp(),
  }, { merge: true });
}

export async function handleAsaasWebhook(req: Request, res: Response) {
  const configuredToken = process.env.ASAAS_WEBHOOK_TOKEN?.trim();
  if (!configuredToken) return res.status(503).json({ error: 'Webhook token not configured' });
  if (!constantTimeEqual(req.headers['asaas-access-token'], configuredToken)) {
    return res.status(401).json({ error: 'Invalid webhook token' });
  }

  const eventId = cleanId(req.body?.id);
  const eventType = typeof req.body?.event === 'string' ? req.body.event : '';
  if (!eventId || !ALLOWED_EVENTS.has(eventType)) {
    return res.status(400).json({ error: 'Unsupported webhook payload' });
  }

  try {
    if (await reserveWebhook(eventId, eventType) === 'duplicate') {
      return res.status(200).json({ received: true, duplicate: true });
    }
    const mapping = await resolveMapping(req.body);
    if (!mapping) {
      await markWebhook(eventId, 'unmapped');
      return res.status(200).json({ received: true, mapped: false });
    }
    await applyWebhook(req.body, mapping);
    await markWebhook(eventId, 'processed', { companyId: mapping.companyId, planId: mapping.planId });
    return res.status(200).json({ received: true, mapped: true });
  } catch (error) {
    await markWebhook(eventId, 'failed', { errorCode: 'PROCESSING_FAILED' }).catch(() => undefined);
    console.error('[Asaas Webhook] processing failed:', error instanceof Error ? error.message : 'unknown');
    return res.status(500).json({ error: 'Webhook processing failed' });
  }
}

export function billingConfig(_req: Request, res: Response) {
  const plans = Object.values(BELLA_COMMERCIAL_PLANS);
  res.json({
    provider: 'asaas',
    configured: Boolean(process.env.ASAAS_API_KEY),
    webhookConfigured: Boolean(process.env.ASAAS_WEBHOOK_TOKEN),
    environment: process.env.ASAAS_ENV === 'sandbox' ? 'sandbox' : 'production',
    plans,
  });
}

function checkoutCallbackUrls() {
  const raw = requiredEnv('APP_URL');
  const appUrl = new URL(raw);
  if (appUrl.protocol !== 'https:') throw new Error('APP_URL must use HTTPS');
  return {
    successUrl: `${appUrl.origin}/settings?billing=success`,
    cancelUrl: `${appUrl.origin}/settings?billing=canceled`,
    expiredUrl: `${appUrl.origin}/settings?billing=expired`,
  };
}

function asaasDateTimeAfterDays(days: number): string {
  const date = new Date(Date.now() + days * 86400000);
  return date.toISOString().slice(0, 19).replace('T', ' ');
}

export async function billingCheckout(req: Request, res: Response) {
  const planId = req.body?.planId;
  if (!isBellaPlanId(planId)) return res.status(400).json({ error: 'Plano inválido.' });
  const companyId = (req as any).company?.id;
  if (!companyId) return res.status(403).json({ error: 'Empresa não verificada.' });
  const plan = BELLA_COMMERCIAL_PLANS[planId];
  const intentId = randomUUID();
  const externalReference = `bellapdv:${intentId}`;
  const amountCents = plan.promoPriceCents ?? plan.monthlyPriceCents;
  const db = getAdminFirestore();
  const intentRef = db.collection('billing_intents').doc(intentId);

  try {
    await intentRef.create({
      companyId,
      planId,
      amountCents,
      status: 'creating',
      createdBy: (req as any).firebaseUser?.uid || null,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });
    const checkout = await asaasWrite('/checkouts', 'POST', {
      billingTypes: ['CREDIT_CARD'],
      chargeTypes: ['RECURRENT'],
      minutesToExpire: 60,
      externalReference,
      callback: checkoutCallbackUrls(),
      items: [{
        name: `Bella PDV Pro — ${plan.name}`,
        description: plan.promoPriceCents
          ? `${plan.promoMonths} meses promocionais; depois R$ ${(plan.monthlyPriceCents / 100).toFixed(2)}/mês`
          : `Assinatura mensal do ${plan.name}`,
        quantity: 1,
        value: amountCents / 100,
      }],
      subscription: {
        cycle: 'MONTHLY',
        nextDueDate: asaasDateTimeAfterDays(plan.trialDays),
      },
    });
    const checkoutId = cleanId(checkout?.id);
    if (!checkoutId) throw new Error('Asaas returned an invalid checkout ID');
    await Promise.all([
      intentRef.set({ checkoutId, status: 'active', updatedAt: FieldValue.serverTimestamp() }, { merge: true }),
      db.collection('billing_checkouts').doc(checkoutId).set({
        companyId,
        planId,
        intentId,
        amountCents,
        status: 'ACTIVE',
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      }),
    ]);
    const checkoutUrl = typeof checkout.link === 'string' && checkout.link.startsWith('https://')
      ? checkout.link
      : `https://asaas.com/checkoutSession/show?id=${encodeURIComponent(checkoutId)}`;
    return res.json({
      checkoutUrl,
      plan: { id: plan.id, name: plan.name, monthlyPriceCents: plan.monthlyPriceCents, promoPriceCents: plan.promoPriceCents },
    });
  } catch (error) {
    await intentRef.set({ status: 'failed', updatedAt: FieldValue.serverTimestamp() }, { merge: true }).catch(() => undefined);
    console.error('[Asaas Checkout] failed:', error instanceof Error ? error.message : 'unknown');
    return res.status(502).json({ error: 'Não foi possível criar o checkout seguro no Asaas.' });
  }
}

export async function reconcileBilling(req: Request, res: Response) {
  if (!(req as any).firebaseUser?.admin) return res.status(403).json({ error: 'Administrador da plataforma obrigatório.' });
  const companyId = typeof req.body?.companyId === 'string' ? req.body.companyId : (req as any).company?.id;
  if (!companyId || !/^[A-Za-z0-9_-]{6,128}$/.test(companyId)) return res.status(400).json({ error: 'Empresa inválida.' });

  try {
    const db = getAdminFirestore();
    const mappingSnap = await db.collection('billing_tenants').doc(companyId).get();
    if (!mappingSnap.exists) {
      return res.json({ dryRun: true, companyId, status: 'mapping_required', changes: [] });
    }
    const mapping = mappingSnap.data() || {};
    const subscriptionId = cleanId(mapping.asaasSubscriptionId);
    if (!subscriptionId || !isBellaPlanId(mapping.planId)) {
      return res.json({ dryRun: true, companyId, status: 'mapping_incomplete', changes: [] });
    }

    const [subscription, payments] = await Promise.all([
      asaasGet(`/subscriptions/${encodeURIComponent(subscriptionId)}`),
      asaasGet(`/subscriptions/${encodeURIComponent(subscriptionId)}/payments?limit=100`),
    ]);
    const plan = BELLA_COMMERCIAL_PLANS[mapping.planId];
    const subscriptionValueCents = moneyToCents(subscription.value);
    const priceMatchesCatalog = expectedPrice(mapping.planId, subscriptionValueCents);
    const paymentRows = Array.isArray(payments.data) ? payments.data : [];
    const overdue = paymentRows.filter((payment: any) => payment.status === 'OVERDUE').length;
    const received = paymentRows.filter((payment: any) => ['RECEIVED', 'CONFIRMED', 'RECEIVED_IN_CASH'].includes(payment.status)).length;
    const changes = [
      ...(priceMatchesCatalog ? [] : [{ field: 'price', currentCents: subscriptionValueCents, expectedCents: [plan.promoPriceCents, plan.monthlyPriceCents].filter(Boolean) }]),
      ...(subscription.status === 'INACTIVE' ? [{ field: 'license.status', current: 'active', expected: 'expired' }] : []),
    ];

    // Deliberately read-only: applying financial or license changes requires a
    // separate reviewed operation after the dry-run result is approved.
    return res.json({
      dryRun: true,
      companyId,
      status: changes.length ? 'divergent' : 'reconciled',
      subscription: { id: subscription.id, status: subscription.status, cycle: subscription.cycle, valueCents: subscriptionValueCents },
      payments: { total: paymentRows.length, overdue, received },
      changes,
    });
  } catch (error) {
    console.error('[Asaas Reconciliation] failed:', error instanceof Error ? error.message : 'unknown');
    return res.status(502).json({ error: 'Falha ao consultar o Asaas para conciliação.' });
  }
}

export async function mapBillingSubscription(req: Request, res: Response) {
  if (!(req as any).firebaseUser?.admin) return res.status(403).json({ error: 'Administrador da plataforma obrigatório.' });
  const companyId = typeof req.body?.companyId === 'string' ? req.body.companyId : '';
  const subscriptionId = cleanId(req.body?.subscriptionId);
  const planId = req.body?.planId;
  const apply = req.body?.apply === true;
  if (!/^[A-Za-z0-9_-]{6,128}$/.test(companyId) || !subscriptionId || !isBellaPlanId(planId)) {
    return res.status(400).json({ error: 'Mapeamento inválido.' });
  }

  try {
    const db = getAdminFirestore();
    const [subscription, existing] = await Promise.all([
      asaasGet(`/subscriptions/${encodeURIComponent(subscriptionId)}`),
      db.collection('billing_subscriptions').doc(subscriptionId).get(),
    ]);
    const customerId = cleanId(subscription.customer);
    const valueCents = moneyToCents(subscription.value);
    const priceMatchesCatalog = expectedPrice(planId, valueCents);
    const existingCompanyId = existing.data()?.companyId;
    if (existing.exists && existingCompanyId && existingCompanyId !== companyId) {
      return res.status(409).json({ error: 'Assinatura já vinculada a outra empresa.' });
    }

    const review = {
      dryRun: !apply,
      companyId,
      planId,
      subscription: { id: subscriptionId, customerId, status: subscription.status, cycle: subscription.cycle, valueCents },
      priceMatchesCatalog,
    };
    if (!apply) return res.json(review);
    if (!priceMatchesCatalog) {
      return res.status(409).json({ error: 'Preço da assinatura diverge do catálogo; vínculo não aplicado.', review });
    }

    const batch = db.batch();
    batch.set(db.collection('billing_subscriptions').doc(subscriptionId), {
      companyId,
      planId,
      customerId,
      status: subscription.status || null,
      cycle: subscription.cycle || null,
      valueCents,
      mappedBy: (req as any).firebaseUser?.uid || null,
      mappedAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    }, { merge: true });
    batch.set(db.collection('billing_tenants').doc(companyId), {
      companyId,
      planId,
      asaasSubscriptionId: subscriptionId,
      asaasCustomerId: customerId,
      mappedBy: (req as any).firebaseUser?.uid || null,
      mappedAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    }, { merge: true });
    await batch.commit();
    return res.json({ ...review, dryRun: false, applied: true });
  } catch (error) {
    console.error('[Asaas Mapping] failed:', error instanceof Error ? error.message : 'unknown');
    return res.status(502).json({ error: 'Falha ao validar a assinatura no Asaas.' });
  }
}

