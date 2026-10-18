import { randomUUID } from 'node:crypto';
import { getAccessToken } from './firebaseCompany';

type FireValue = { stringValue?: string; integerValue?: string; booleanValue?: boolean; doubleValue?: number; nullValue?: null };
type RecordInput = Record<string, string | number | boolean | null>;
function encodeFields(data: RecordInput): { fields: Record<string, FireValue> } {
  const fields: Record<string, FireValue> = {};
  for (const [key, value] of Object.entries(data)) {
    if (typeof value === 'string') fields[key] = { stringValue: value };
    else if (typeof value === 'number' && Number.isFinite(value)) fields[key] = { doubleValue: value };
    else if (typeof value === 'boolean') fields[key] = { booleanValue: value };
    else fields[key] = { nullValue: null };
  }
  return { fields };
}
function decodeFields(data: Record<string, FireValue>): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(data)) {
    if (value.stringValue !== undefined) result[key] = value.stringValue;
    else if (value.booleanValue !== undefined) result[key] = value.booleanValue;
    else if (value.doubleValue !== undefined) result[key] = value.doubleValue;
    else if (value.integerValue !== undefined) result[key] = Number(value.integerValue);
    else result[key] = null;
  }
  return result;
}
function collectionUrl(collection: string): string {
  if (!['appointments'].includes(collection)) throw new Error('Coleção não autorizada');
  const project = process.env.FIREBASE_PROJECT_ID || 'gen-lang-client-0731708491';
  const database = process.env.FIRESTORE_DATABASE_ID || '(default)';
  return `https://firestore.googleapis.com/v1/projects/${encodeURIComponent(project)}/databases/${encodeURIComponent(database)}/documents/${collection}`;
}
async function perform(url: string, method: string, body?: object) {
  const response = await fetch(url, {
    method,
    headers: {
      Authorization: `Bearer ${await getAccessToken()}`,
      ...(body ? { 'Content-Type': 'application/json' } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(8000),
  });
  if (!response.ok) throw new Error(`Erro do Firestore (${response.status})`);
  return response.json();
}
export async function createAppointment(companyId: string, data: {
  clientName: string; clientPhone?: string; serviceId: string; datetime: string;
}) {
  if (!/^[a-zA-Z0-9_-]{1,128}$/.test(companyId)) throw new Error('Empresa inválida');
  if (!data.clientName?.trim() || data.clientName.length > 120 || !data.serviceId?.trim() || data.serviceId.length > 128) throw new Error('Agendamento inválido');
  if (Number.isNaN(Date.parse(data.datetime))) throw new Error('Data inválida');
  const id = randomUUID();
  const entry = {
    companyId,
    ownerId: companyId,
    clientName: data.clientName.trim(),
    clientPhone: (data.clientPhone || '').slice(0, 30),
    serviceId: data.serviceId,
    datetime: new Date(data.datetime).toISOString(),
    status: 'confirmed',
    createdAt: new Date().toISOString(),
  };
  await perform(collectionUrl('appointments') + '?documentId=' + encodeURIComponent(id), 'POST', encodeFields(entry));
  return { id, ...entry };
}
