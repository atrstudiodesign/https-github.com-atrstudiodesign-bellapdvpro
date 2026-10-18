import { createSign } from 'node:crypto';

type ServiceAccount = { client_email: string; private_key: string; project_id: string };
let accessToken: { token: string; expiresAt: number } | null = null;

function getServiceAccount(): ServiceAccount {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (!raw) throw new Error('FIREBASE_SERVICE_ACCOUNT_JSON não configurado');
  let service: Partial<ServiceAccount>;
  try { service = JSON.parse(raw); } catch { throw new Error('Credenciais Firebase inválidas'); }
  if (!service.client_email || !service.private_key || !service.project_id) {
    throw new Error('Credenciais de serviço Firebase incompletas');
  }
  return service as ServiceAccount;
}

function encodeJson(value: object): string {
  return Buffer.from(JSON.stringify(value)).toString('base64url');
}

export async function getAccessToken(): Promise<string> {
  if (accessToken && Date.now() < accessToken.expiresAt) return accessToken.token;
  const service = getServiceAccount();
  const now = Math.floor(Date.now() / 1000);
  const header = encodeJson({ alg: 'RS256', typ: 'JWT' });
  const payload = encodeJson({
    iss: service.client_email,
    scope: 'https://www.googleapis.com/auth/datastore https://www.googleapis.com/auth/identitytoolkit',
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600,
  });
  const signer = createSign('RSA-SHA256');
  signer.update(header + '.' + payload);
  signer.end();
  const assertion = header + '.' + payload + '.' + signer.sign(service.private_key).toString('base64url');
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion }),
    signal: AbortSignal.timeout(8000),
  });
  if (!response.ok) throw new Error('Falha na autenticação da conta de serviço Firebase');
  const body = await response.json() as { access_token?: string; expires_in?: number };
  if (!body.access_token) throw new Error('Resposta OAuth sem token');
  accessToken = { token: body.access_token, expiresAt: Date.now() + Math.max(60, (body.expires_in || 3600) - 180) * 1000 };
  return body.access_token;
}

type FirestoreValue = { stringValue?: string; booleanValue?: boolean; mapValue?: { fields?: Record<string, FirestoreValue> } };
export type CompanyRecord = {
  id: string; ownerId: string; name: string; niche: string;
  status: 'active' | 'blocked'; asaasCustomerId?: string; whatsappSessionId?: string;
};

function getString(fields: Record<string, FirestoreValue>, key: string): string | undefined {
  return typeof fields[key]?.stringValue === 'string' ? fields[key].stringValue : undefined;
}

export async function getCompany(companyId: string): Promise<CompanyRecord | null> {
  if (!/^[a-zA-Z0-9_-]{1,128}$/.test(companyId)) return null;
  const { project_id } = getServiceAccount();
  const databaseId = process.env.FIRESTORE_DATABASE_ID || '(default)';
  const documentPath = `projects/${encodeURIComponent(project_id)}/databases/${encodeURIComponent(databaseId)}/documents/companies/${encodeURIComponent(companyId)}`;
  const response = await fetch(`https://firestore.googleapis.com/v1/${documentPath}`, {
    headers: { Authorization: `Bearer ${await getAccessToken()}` },
    signal: AbortSignal.timeout(8000),
  });
  if (response.status === 404) return null;
  if (!response.ok) throw new Error(`Erro ao consultar empresa no Firestore: ${response.status}`);
  const document = await response.json() as { fields?: Record<string, FirestoreValue> };
  const fields = document.fields || {};
  const ownerId = getString(fields, 'ownerId');
  const name = getString(fields, 'name');
  if (!ownerId || !name) throw new Error('Empresa sem campos obrigatórios');
  return {
    id: companyId,
    ownerId,
    name,
    niche: getString(fields, 'niche') || 'barbershop',
    status: getString(fields, 'status') === 'blocked' ? 'blocked' : 'active',
    asaasCustomerId: getString(fields, 'asaasCustomerId'),
    whatsappSessionId: getString(fields, 'whatsappSessionId'),
  };
}

/** Assign a tenant to an existing user without overwriting unrelated Firebase claims. */
export async function assignCompanyClaims(userId: string, companyId: string): Promise<void> {
  if (!/^[a-zA-Z0-9_-]{1,128}$/.test(userId) || !/^[a-zA-Z0-9_-]{1,128}$/.test(companyId)) {
    throw new Error('Identificadores inválidos');
  }
  const company = await getCompany(companyId);
  if (!company) throw new Error('Empresa inexistente');

  const token = await getAccessToken();
  const { project_id } = getServiceAccount();
  const endpoint = `https://identitytoolkit.googleapis.com/v1/projects/${encodeURIComponent(project_id)}/accounts`;
  const lookup = await fetch(endpoint + ':lookup', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ localId: [userId] }),
    signal: AbortSignal.timeout(8000),
  });
  if (!lookup.ok) throw new Error(`Falha ao consultar usuário (${lookup.status})`);
  const lookupBody = await lookup.json() as { users?: Array<{ localId?: string; customAttributes?: string; email?: string }> };
  const target = lookupBody.users?.find(user => user.localId === userId);
  if (!target) throw new Error('Usuário não encontrado');

  let previous: Record<string, unknown> = {};
  if (target.customAttributes) {
    try { previous = JSON.parse(target.customAttributes); }
    catch { throw new Error('Claims existentes inválidas; operação interrompida'); }
    if (!previous || Array.isArray(previous) || typeof previous !== 'object') {
      throw new Error('Formato de claims incompatível');
    }
  }
  if (typeof previous.companyId === 'string' && previous.companyId !== companyId) {
    throw new Error('Usuário já está associado a outra empresa; transferência exige fluxo específico');
  }
  if (previous.companyId === companyId) return;

  const response = await fetch(endpoint + ':update', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      localId: userId,
      customAttributes: JSON.stringify({ ...previous, companyId }),
    }),
    signal: AbortSignal.timeout(8000),
  });
  if (!response.ok) throw new Error(`Firebase Auth rejeitou vínculo (${response.status})`);
}

/** Creates a persistent tenant; id is generated server-side, never taken from user input. */
export async function createCompanyRecord(ownerId: string, name: string, niche: string): Promise<CompanyRecord> {
  if (!/^[a-zA-Z0-9_-]{1,128}$/.test(ownerId)) throw new Error('Proprietário inválido');
  const cleanName = name.trim();
  if (cleanName.length < 2 || cleanName.length > 120) throw new Error('Nome da empresa inválido');
  const allowedNiches = ['barbershop', 'clinic', 'salon', 'spa', 'tattoo'];
  if (!allowedNiches.includes(niche)) throw new Error('Segmento inválido');
  const service = getServiceAccount();
  const databaseId = process.env.FIRESTORE_DATABASE_ID || '(default)';
  const parent = `projects/${encodeURIComponent(service.project_id)}/databases/${encodeURIComponent(databaseId)}/documents`;
  const data = {
    fields: {
      ownerId: { stringValue: ownerId },
      name: { stringValue: cleanName },
      niche: { stringValue: niche },
      status: { stringValue: 'active' },
    },
  };
  const response = await fetch(`https://firestore.googleapis.com/v1/${parent}/companies`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${await getAccessToken()}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
    signal: AbortSignal.timeout(8000),
  });
  if (!response.ok) throw new Error(`Falha na criação da empresa (${response.status})`);
  const document = await response.json() as { name?: string };
  const id = document.name?.split('/').pop();
  if (!id) throw new Error('Firestore não retornou ID');
  return { id, ownerId, name: cleanName, niche, status: 'active' };
}
