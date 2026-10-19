// RLS-enforced Supabase operational adapter. Never uses a service-role key in the browser.
type ModuleName = 'clients' | 'catalog' | 'appointments' | 'transactions' | 'queue';
type Session = { token: string; refreshToken: string; expiresAt: number; companyId: string };
const URL = import.meta.env.VITE_SUPABASE_URL || '';
const KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || '';
export function hasBellaSupabaseSession(): boolean {
  try { return !!sessionStorage.getItem('bella_supabase_session'); } catch { return false; }
}
async function session(): Promise<Session> {
  const { bellaSupabaseRestore } = await import('./bellaSupabase');
  const identity = await bellaSupabaseRestore();
  if (!identity?.companyId || !identity.token) throw new Error('Sessão Supabase inválida ou sem empresa.');
  return identity;
}
async function request(module: ModuleName, method: string, query = '', body?: unknown): Promise<any> {
  if (!URL || !KEY) throw new Error('Banco Bella Supabase não configurado.');
  const identity = await session();
  const params = new URLSearchParams(query);
  if (method !== 'POST') params.set('company_id', 'eq.' + identity.companyId);
  const response = await fetch(URL + '/rest/v1/bella_' + module + '?' + params.toString(), {
    method,
    headers: {
      apikey: KEY,
      Authorization: 'Bearer ' + identity.token,
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
    },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });
  if (!response.ok) throw new Error('Falha no Supabase (' + response.status + ') no módulo ' + module);
  if (response.status === 204) return [];
  return response.json();
}
export async function bellaList<T extends { id: string }>(module: ModuleName): Promise<T[]> {
  const rows = await request(module, 'GET', 'select=source_id,payload&limit=1000');
  return rows.map((row: any) => ({ ...row.payload, id: row.source_id }));
}
export async function bellaInsert<T extends { id: string }>(module: ModuleName, item: T): Promise<void> {
  const identity = await session();
  const rows = await request(module, 'POST', '', {
    company_id: identity.companyId, source_id: item.id, payload: item,
  });
  if (!Array.isArray(rows) || rows.length !== 1) throw new Error('Inserção não confirmada.');
}
export async function bellaUpdate<T extends { id: string }>(module: ModuleName, item: T): Promise<void> {
  const rows = await request(module, 'PATCH', 'source_id=eq.' + encodeURIComponent(item.id), { payload: item });
  if (!Array.isArray(rows) || rows.length !== 1) throw new Error('Registro inexistente ou sem acesso.');
}
export async function bellaDelete(module: ModuleName, id: string): Promise<void> {
  const rows = await request(module, 'DELETE', 'source_id=eq.' + encodeURIComponent(id));
  if (!Array.isArray(rows) || rows.length !== 1) throw new Error('Registro inexistente ou sem acesso.');
}
