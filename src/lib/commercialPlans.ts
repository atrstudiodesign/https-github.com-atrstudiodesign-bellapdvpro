export type BellaPlanId = 'basic' | 'pro' | 'premium';

export interface BellaCommercialPlan {
  id: BellaPlanId;
  name: string;
  licensePlan: 'Bronze' | 'Prata' | 'Ouro';
  monthlyPriceCents: number;
  promoPriceCents: number | null;
  promoMonths: number;
  trialDays: number;
}

export const BELLA_COMMERCIAL_PLANS: Record<BellaPlanId, BellaCommercialPlan> = {
  basic: {
    id: 'basic',
    name: 'Plano Básico',
    licensePlan: 'Bronze',
    monthlyPriceCents: 8990,
    promoPriceCents: 2990,
    promoMonths: 3,
    trialDays: 15,
  },
  pro: {
    id: 'pro',
    name: 'Plano Pro',
    licensePlan: 'Prata',
    monthlyPriceCents: 14990,
    promoPriceCents: null,
    promoMonths: 0,
    trialDays: 15,
  },
  premium: {
    id: 'premium',
    name: 'Plano Premium',
    licensePlan: 'Ouro',
    monthlyPriceCents: 24990,
    promoPriceCents: null,
    promoMonths: 0,
    trialDays: 15,
  },
};

export function planPriceLabel(cents: number): string {
  return (cents / 100).toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function isBellaPlanId(value: unknown): value is BellaPlanId {
  return typeof value === 'string' && value in BELLA_COMMERCIAL_PLANS;
}

export function parseBellaExternalReference(value: unknown): { intentId: string } | null {
  if (typeof value !== 'string') return null;
  const match = /^bellapdv:([0-9a-f]{8}-[0-9a-f-]{27,36})$/i.exec(value);
  if (!match) return null;
  return { intentId: match[1] };
}

