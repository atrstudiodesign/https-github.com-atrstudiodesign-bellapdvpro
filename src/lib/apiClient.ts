import { auth } from './firebase';

/**
 * Requests to the BellaPDV backend must include an authenticated Firebase ID token.
 * The backend validates the JWT and resolves tenant identity from trusted claims.
 * Never accept company or role identifiers from caller-controlled headers.
 */
export async function authenticatedApiFetch(input: string, init: RequestInit = {}): Promise<Response> {
  const user = auth.currentUser;
  if (!user || user.isAnonymous) {
    throw new Error('Sessão autenticada obrigatória para acessar a API.');
  }
  const token = await user.getIdToken();
  const headers = new Headers(init.headers);
  headers.set('Authorization', `Bearer ${token}`);
  headers.delete('x-company-id');
  return fetch(input, { ...init, headers });
}

export async function getVerifiedSession(): Promise<{ uid: string; email?: string; admin: boolean }> {
  const response = await authenticatedApiFetch('/api/auth/me');
  if (!response.ok) throw new Error('Não foi possível validar a sessão no servidor.');
  const body = await response.json();
  return body.user;
}
