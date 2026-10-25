import { timingSafeEqual } from 'node:crypto';
import { BELLA_COMMERCIAL_PLANS, type BellaPlanId } from '../src/lib/commercialPlans';

export function constantTimeEqual(actual: unknown, expected: string): boolean {
  if (typeof actual !== 'string') return false;
  const a = Buffer.from(actual);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

export function moneyToCents(value: unknown): number | null {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) return null;
  return Math.round(value * 100);
}

export function expectedPrice(planId: BellaPlanId, amountCents: number | null): boolean {
  if (amountCents === null) return false;
  const plan = BELLA_COMMERCIAL_PLANS[planId];
  return amountCents === plan.monthlyPriceCents || amountCents === plan.promoPriceCents;
}

