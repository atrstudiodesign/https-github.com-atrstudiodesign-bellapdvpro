import { timingSafeEqual } from 'node:crypto';
import { collectionUrl, documentUrl, encodeFields, firestoreServerRequest } from './firebaseAdminRest';

type AppLike = { post: (path: string, handler: (req: any, res: any) => Promise<unknown>) => void };
const plain = (field: any): string | undefined => field?.stringValue;
const secretMatches = (provided: unknown, configured: string): boolean => {
  if (typeof provided !== 'string') return false;
  const a = Buffer.from(provided), b = Buffer.from(configured);
  return a.length === b.length && timingSafeEqual(a, b);
};

export function registerCommercialLifecycle(app: AppLike) {
  // The verified Firebase JWT is supplied by api/index.ts middleware. Never accept uid from the body.
  app.post('/api/trials/activate', async (req, res) => {
    const uid = req.firebaseUser?.uid;
    if (!uid || req.firebaseUser?.provider === 'anonymous' || req.firebaseUser.companyId !== uid) {
      return res.status(403).json({ error: 'Identidade empresarial inválida' });
    }
    if (!process.env.FIREBASE_SERVICE_ACCOUNT_EMAIL || !process.env.FIREBASE_SERVICE_ACCOUNT_PRIVATE_KEY) {
      return res.status(503).json({ error: 'Provisionamento não configurado no servidor' });
    }
    try {
      const userResponse = await firestoreServerRequest(documentUrl('users', uid), 'GET');
      if (!userResponse.ok) return res.status(409).json({ error: 'Conclua o cadastro da empresa antes de iniciar o teste' });
      const profile = await userResponse.json() as any;
      if (plain(profile?.fields?.companyId) !== uid || plain(profile?.fields?.role) !== 'client') {
        return res.status(403).json({ error: 'Cadastro empresarial não autorizado' });
      }
      const expires = new Date(Date.now() + 15 * 86400000).toISOString();
      const fields = encodeFields({
        id: uid, name: plain(profile?.fields?.companyName) || plain(profile?.fields?.name) || 'Empresa',
        plan: 'Bronze', status: 'trial', trialDays: 15,
        expireDate: expires, maxUsers: 1, unitsCount: 1, aiUsage: 0, waUsage: 0,
        createdAt: new Date().toISOString(), source: 'bella_server'
      });
      const url = collectionUrl('company_licenses') + '?documentId=' + encodeURIComponent(uid);
      const created = await firestoreServerRequest(url, 'POST', { fields });
      if (created.status === 409) {
        return res.status(200).json({ status: 'already_provisioned', message: 'Licença existente preservada' });
      }
      if (!created.ok) throw new Error('Firestore trial creation failed: ' + created.status);
      return res.status(201).json({ status: 'trial', trialDays: 15, expires });
    } catch (error) {
      console.error('[trial activation]', error instanceof Error ? error.message : error);
      return res.status(503).json({ error: 'Não foi possível iniciar o trial' });
    }
  });

  // Only trusted Asaas webhook events with a pre-provisioned payment->company binding can activate a paid license.
  app.post('/api/webhooks/asaas', async (req, res) => {
    const secret = process.env.ASAAS_WEBHOOK_TOKEN;
    if (!secret) return res.status(503).json({ error: 'Webhook não configurado' });
    if (!secretMatches(req.headers['asaas-access-token'], secret)) return res.status(401).json({ error: 'Webhook não autorizado' });
    const event = req.body;
    if (!event || typeof event !== 'object' || typeof event.id !== 'string'
      || !/^evt_[A-Za-z0-9_-]{1,120}$/.test(event.id)
      || !['PAYMENT_CONFIRMED', 'PAYMENT_RECEIVED'].includes(event.event)
      || !event.payment || typeof event.payment.id !== 'string'
      || !/^pay_[A-Za-z0-9_-]{1,120}$/.test(event.payment.id)
      || !['CONFIRMED', 'RECEIVED'].includes(event.payment.status)) {
      return res.status(202).json({ ignored: true });
    }
    try {
      const bindingResp = await firestoreServerRequest(documentUrl('payment_bindings', event.payment.id), 'GET');
      if (bindingResp.status === 404) return res.status(202).json({ ignored: true, reason: 'unlinked_payment' });
      if (!bindingResp.ok) throw new Error('Cannot verify payment binding');
      const binding = await bindingResp.json() as any;
      const companyId = plain(binding.fields?.companyId);
      const expectedCents = Number(binding.fields?.expectedCents?.integerValue);
      const paidCents = Math.round(Number(event.payment.value) * 100);
      if (!companyId || !Number.isSafeInteger(expectedCents) || expectedCents <= 0 || paidCents !== expectedCents) {
        return res.status(422).json({ error: 'Payment binding or amount mismatch' });
      }
      const paidPlan = plain(binding.fields?.plan);
      if (!['Bronze', 'Prata', 'Ouro'].includes(paidPlan || '')) return res.status(422).json({ error: 'Unknown licensed plan' });
      const license = documentUrl('company_licenses', companyId);
      const licenseResp = await firestoreServerRequest(license, 'GET');
      if (!licenseResp.ok) throw new Error('License does not exist');
      const now = new Date().toISOString();
      const eventDoc = documentUrl('payment_events', event.id);
      const writes = [
        { update: { name: eventDoc, fields: encodeFields({
          eventId: event.id, event: event.event, companyId, paymentId: event.payment.id,
          source: 'asaas', verified: true, occurredAt: now
        }) }, currentDocument: { exists: false } },
        { update: { name: license, fields: encodeFields({
          status: 'active', plan: paidPlan as string, lastPaymentId: event.payment.id,
          lastPaymentAt: now, paymentProvider: 'asaas'
        }) }, updateMask: { fieldPaths: ['status','plan','lastPaymentId','lastPaymentAt','paymentProvider'] }, currentDocument: { exists: true } }
      ];
      const commit = await firestoreServerRequest(collectionUrl('company_licenses').replace(/\/company_licenses$/, ':commit'), 'POST', { writes });
      if (commit.ok) return res.status(200).json({ accepted: true });
      if (commit.status === 409 || commit.status === 400) {
        const existing = await firestoreServerRequest(eventDoc, 'GET');
        if (existing.ok) return res.status(200).json({ duplicate: true });
      }
      throw new Error('Atomic payment processing failed: ' + commit.status);
    } catch (error) {
      console.error('[Asaas webhook]', error instanceof Error ? error.message : error);
      return res.status(503).json({ error: 'Webhook processing failed, retry required' });
    }
  });
}
