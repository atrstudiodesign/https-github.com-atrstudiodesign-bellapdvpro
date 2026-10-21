import { createSign } from 'node:crypto';

const project = process.env.FIREBASE_PROJECT_ID || 'bellapdv-15ae0';
const base = 'https://firestore.googleapis.com/v1/projects/' + encodeURIComponent(project) + '/databases/(default)/documents';
let cached: { token: string; until: number } | null = null;

async function serviceToken(): Promise<string> {
  if (cached && cached.until > Date.now() + 60_000) return cached.token;
  const email = process.env.FIREBASE_SERVICE_ACCOUNT_EMAIL;
  const key = process.env.FIREBASE_SERVICE_ACCOUNT_PRIVATE_KEY?.replace(/\\n/g, '\n');
  if (!email || !key) throw new Error('Firebase service account not configured');
  const now = Math.floor(Date.now() / 1000);
  const encode = (v: unknown) => Buffer.from(JSON.stringify(v)).toString('base64url');
  const unsigned = encode({ alg: 'RS256', typ: 'JWT' }) + '.' + encode({
    iss: email, sub: email, aud: 'https://oauth2.googleapis.com/token',
    iat: now, exp: now + 3600, scope: 'https://www.googleapis.com/auth/datastore'
  });
  const signer = createSign('RSA-SHA256');
  signer.update(unsigned);
  signer.end();
  const assertion = unsigned + '.' + signer.sign(key).toString('base64url');
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion }),
    signal: AbortSignal.timeout(8000)
  });
  if (!response.ok) throw new Error('Unable to authenticate Firebase service account');
  const result = await response.json() as { access_token: string; expires_in: number };
  cached = { token: result.access_token, until: Date.now() + (result.expires_in || 3600) * 1000 };
  return cached.token;
}

type FireValue = { stringValue?: string; integerValue?: string; booleanValue?: boolean };
function encodeValue(value: string | number | boolean): FireValue {
  if (typeof value === 'boolean') return { booleanValue: value };
  if (typeof value === 'number') return { integerValue: String(value) };
  return { stringValue: value };
}
export function encodeFields(data: Record<string, string | number | boolean>) {
  return Object.fromEntries(Object.entries(data).map(([key, value]) => [key, encodeValue(value)]));
}
export async function firestoreServerRequest(url: string, method: 'GET' | 'POST' | 'PATCH', body?: unknown) {
  const token = await serviceToken();
  return fetch(url, {
    method, headers: { authorization: 'Bearer ' + token, 'content-type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
    signal: AbortSignal.timeout(10000)
  });
}
export function documentUrl(collection: string, id: string) {
  if (!/^[A-Za-z0-9_-]{1,128}$/.test(id) || !/^[a-z_]+$/.test(collection)) throw new Error('Invalid document identifier');
  return base + '/' + collection + '/' + encodeURIComponent(id);
}
export function collectionUrl(collection: string) {
  if (!/^[a-z_]+$/.test(collection)) throw new Error('Invalid collection');
  return base + '/' + collection;
}
