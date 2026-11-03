import { getAI, getGenerativeModel, GoogleAIBackend } from 'firebase/ai';
import { app, appCheck, auth } from '../lib/firebase';
import { currentFirebaseTenantId } from '../lib/firebaseTenant';

// Client-side throttle is UX protection only; provider-side quotas must be configured separately.
const lastRequestByTenant = new Map<string, number>();
const MIN_REQUEST_INTERVAL_MS = 10_000;

export async function generateTenantAiText(input: { prompt: string; systemInstruction: string }): Promise<string> {
  const user = auth.currentUser;
  const tenantId = currentFirebaseTenantId();
  if (!user || user.isAnonymous || !tenantId) throw new Error('Empresa autenticada necessária.');
  if (!appCheck) throw new Error('Firebase App Check não configurado. IA bloqueada por segurança.');
  if (input.prompt.length > 6000 || input.systemInstruction.length > 3500) throw new Error('Contexto excede o limite permitido.');
  const now = Date.now();
  if (now - (lastRequestByTenant.get(tenantId) || 0) < MIN_REQUEST_INTERVAL_MS) {
    throw new Error('Aguarde antes de enviar outra solicitação.');
  }
  lastRequestByTenant.set(tenantId, now);
  // The model only receives explicitly supplied, already tenant-scoped summaries.
  // It has no Firestore tools and cannot read arbitrary collections or execute actions.
  const ai = getAI(app, { backend: new GoogleAIBackend() });
  const model = getGenerativeModel(ai, {
    model: 'gemini-2.5-flash',
    systemInstruction: input.systemInstruction,
    generationConfig: { maxOutputTokens: 400, temperature: 0.4 },
  });
  const result = await model.generateContent(input.prompt);
  const answer = result.response.text().trim();
  if (!answer) throw new Error('Modelo não retornou conteúdo.');
  return answer;
}
