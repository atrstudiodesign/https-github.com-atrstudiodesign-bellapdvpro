// Bella PDV Pro — read-only Supabase connectivity during Firebase cutover.
// Never use a service-role key in browser code; RLS protects all tenant records.
export const bellaSupabaseUrl = (import.meta.env.VITE_SUPABASE_URL || '').replace(/\/$/, '');
const publishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || '';

export async function checkBellaSupabase(): Promise<{ connected: boolean; message: string }> {
  if (!bellaSupabaseUrl || !publishableKey) {
    return { connected: false, message: 'Supabase não configurado nesta publicação.' };
  }
  try {
    const response = await fetch(bellaSupabaseUrl + '/rest/v1/bella_companies?select=id&limit=1', {
      headers: { apikey: publishableKey },
      signal: AbortSignal.timeout(7000),
    });
    if (!response.ok) {
      return { connected: false, message: 'Conexão Supabase retornou HTTP ' + response.status };
    }
    return { connected: true, message: 'Supabase conectado. Dados protegidos por RLS; Firebase ainda é o login principal.' };
  } catch {
    return { connected: false, message: 'Supabase indisponível ou bloqueado pela rede.' };
  }
}

type SupabaseAuthResult = { ok: boolean; message: string; userId?: string; companyCount?: number };

// Supabase Auth is verified in isolation. It does NOT authenticate the Bella production app.
// Tokens only live in this function and are never placed in URL or localStorage.
export async function testBellaSupabaseAuth(email: string, password: string): Promise<SupabaseAuthResult> {
  if (!bellaSupabaseUrl || !publishableKey) return { ok: false, message: 'Supabase não configurado.' };
  if (!email.trim() || !password) return { ok: false, message: 'Informe e-mail e senha.' };
  try {
    const login = await fetch(bellaSupabaseUrl + '/auth/v1/token?grant_type=password', {
      method: 'POST',
      headers: { apikey: publishableKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email.trim(), password }),
      signal: AbortSignal.timeout(10000),
    });
    if (!login.ok) return { ok: false, message: 'Credenciais Supabase inválidas ou e-mail não confirmado.' };
    const session = await login.json();
    if (typeof session.access_token !== 'string' || typeof session.user?.id !== 'string')
      return { ok: false, message: 'Sessão Supabase não confirmada.' };
    const membership = await fetch(bellaSupabaseUrl + '/rest/v1/bella_memberships?select=company_id,role', {
      headers: { apikey: publishableKey, Authorization: 'Bearer ' + session.access_token },
      signal: AbortSignal.timeout(10000),
    });
    if (!membership.ok) return { ok: false, message: 'Login válido, mas consulta de permissões bloqueada (' + membership.status + ').' };
    const companies = await membership.json();
    if (!Array.isArray(companies)) return { ok: false, message: 'Resposta de permissões inválida.' };
    return { ok: true, message: companies.length > 0
      ? 'Supabase Auth autenticado e vínculo com empresa verificado.'
      : 'Supabase Auth autenticado. Usuário ainda não foi vinculado a uma empresa.',
      userId: session.user.id, companyCount: companies.length };
  } catch {
    return { ok: false, message: 'Não foi possível validar a sessão Supabase.' };
  }
}

export interface BellaSupabaseIdentity {
  id: string; email: string; companyId: string; role: 'admin'|'client';
  token: string; refreshToken: string; expiresAt: number;
}
const supaHeaders = (token: string) => ({ apikey: publishableKey, Authorization: 'Bearer ' + token });
async function bellaIdentity(token: string, refreshToken: string, expiresAt: number): Promise<BellaSupabaseIdentity> {
  const userResponse = await fetch(bellaSupabaseUrl + '/auth/v1/user', {
    headers: supaHeaders(token), signal: AbortSignal.timeout(10000)
  });
  if (!userResponse.ok) throw new Error('Sessão Supabase expirada. Entre novamente.');
  const user = await userResponse.json();
  const memberships = await fetch(bellaSupabaseUrl + '/rest/v1/bella_memberships?select=company_id,role&limit=2', {
    headers: supaHeaders(token), signal: AbortSignal.timeout(10000)
  });
  if (!memberships.ok) throw new Error('Sem acesso às permissões da empresa.');
  const rows = await memberships.json();
  if (!Array.isArray(rows) || rows.length !== 1 || typeof rows[0].company_id !== 'string')
    throw new Error('Conta sem empresa vinculada ou com múltiplas empresas. Contate o administrador.');
  if (rows[0].role !== 'owner' && rows[0].role !== 'manager' && rows[0].role !== 'staff')
    throw new Error('Perfil de acesso inválido.');
  return {
    id: user.id, email: user.email || '', companyId: rows[0].company_id,
    role: rows[0].role === 'owner' || rows[0].role === 'manager' ? 'admin' : 'client',
    token, refreshToken, expiresAt
  };
}
export async function bellaSupabaseSignIn(email: string, password: string): Promise<BellaSupabaseIdentity> {
  if (!bellaSupabaseUrl || !publishableKey) throw new Error('Supabase não configurado.');
  const response = await fetch(bellaSupabaseUrl + '/auth/v1/token?grant_type=password', {
    method: 'POST', headers: { apikey: publishableKey, 'Content-Type': 'application/json' },
    body: JSON.stringify({email: email.trim(), password}), signal: AbortSignal.timeout(10000)
  });
  if (!response.ok) throw new Error('E-mail ou senha inválidos no Supabase.');
  const data = await response.json();
  return bellaIdentity(data.access_token, data.refresh_token, Date.now() + data.expires_in * 1000);
}
export async function bellaSupabaseRestore(): Promise<BellaSupabaseIdentity | null> {
  const raw = sessionStorage.getItem('bella_supabase_session');
  if (!raw) return null;
  try {
    const old = JSON.parse(raw);
    if (!old.refreshToken || !old.token) throw new Error('Sessão inválida.');
    if (Date.now() < old.expiresAt - 60000)
      return await bellaIdentity(old.token, old.refreshToken, old.expiresAt);
    const response = await fetch(bellaSupabaseUrl + '/auth/v1/token?grant_type=refresh_token', {
      method: 'POST', headers: {apikey: publishableKey,'Content-Type':'application/json'},
      body: JSON.stringify({refresh_token: old.refreshToken}), signal: AbortSignal.timeout(10000)
    });
    if (!response.ok) throw new Error('Refresh falhou');
    const refreshed = await response.json();
    const identity = await bellaIdentity(refreshed.access_token, refreshed.refresh_token, Date.now() + refreshed.expires_in * 1000);
    sessionStorage.setItem('bella_supabase_session', JSON.stringify(identity));
    return identity;
  } catch {
    sessionStorage.removeItem('bella_supabase_session');
    return null;
  }
}

export async function bellaSupabaseResetPassword(email: string): Promise<void> {
  if (!bellaSupabaseUrl || !publishableKey) throw new Error('Supabase não configurado.');
  const response = await fetch(bellaSupabaseUrl + '/auth/v1/recover', {
    method: 'POST',
    headers: { apikey: publishableKey, 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: email.trim() }),
    signal: AbortSignal.timeout(10000),
  });
  if (!response.ok) throw new Error('Não foi possível solicitar a recuperação. Verifique o e-mail configurado.');
}
