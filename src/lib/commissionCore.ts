/**
 * Projection only: monetary values are integer cents, never floating-point reais.
 * Authoritative publication into staff_portal/{uid}/commissions requires a trusted
 * backend that validates tenant, professional-to-UID binding and completed sale.
 */
export interface CommissionSale {
  id: string;
  companyId: string;
  status: 'completed' | 'pending' | 'cancelled';
  items: ReadonlyArray<{
    id: string;
    professionalId?: string;
    priceCents: number;
    quantity: number;
  }>;
}
export interface CommissionAssignment {
  uid: string;
  companyId: string;
  professionalId: string;
  active: boolean;
  rateBasisPoints: number;
}
export interface CommissionRecord {
  id: string;
  uid: string;
  companyId: string;
  saleId: string;
  professionalId: string;
  amountCents: number;
  totalEligibleCents: number;
  rateBasisPoints: number;
  status: 'calculated';
}
export function calculateSaleCommissions(
  sale: CommissionSale,
  assignments: ReadonlyArray<CommissionAssignment>
): CommissionRecord[] {
  if (sale.status !== 'completed') return [];
  if (!sale.companyId || !sale.id) throw new Error('Venda sem identificação da empresa.');
  const assigned = new Map<string, CommissionAssignment>();
  for (const item of assignments) {
    if (!item.active || item.companyId !== sale.companyId) continue;
    if (!item.uid || !item.professionalId || !Number.isInteger(item.rateBasisPoints) || item.rateBasisPoints < 0 || item.rateBasisPoints > 10000) {
      throw new Error('Vínculo ou percentual de comissão inválido.');
    }
    if (assigned.has(item.professionalId)) throw new Error('Profissional com vínculos ativos duplicados.');
    assigned.set(item.professionalId, item);
  }
  const totals = new Map<string, number>();
  for (const item of sale.items) {
    if (!Number.isSafeInteger(item.priceCents) || item.priceCents < 0 || !Number.isSafeInteger(item.quantity) || item.quantity <= 0) {
      throw new Error('Item de venda inválido para cálculo de comissão.');
    }
    if (!item.professionalId) continue;
    if (!assigned.has(item.professionalId)) continue;
    const eligibleCents = item.priceCents * item.quantity;
    if (!Number.isSafeInteger(eligibleCents)) throw new Error('Valor monetário acima do limite seguro.');
    const sum = (totals.get(item.professionalId) || 0) + eligibleCents;
    if (!Number.isSafeInteger(sum)) throw new Error('Comissão acima do limite seguro.');
    totals.set(item.professionalId, sum);
  }
  return Array.from(totals.entries()).map(([professionalId, totalEligibleCents]) => {
    const assignment = assigned.get(professionalId)!;
    const amountCents = Math.round(totalEligibleCents * assignment.rateBasisPoints / 10000);
    if (!Number.isSafeInteger(amountCents)) throw new Error('Comissão inválida.');
    return {
      id: sale.id + '_' + professionalId,
      uid: assignment.uid,
      companyId: sale.companyId,
      saleId: sale.id,
      professionalId,
      amountCents,
      totalEligibleCents,
      rateBasisPoints: assignment.rateBasisPoints,
      status: 'calculated' as const
    };
  });
}
