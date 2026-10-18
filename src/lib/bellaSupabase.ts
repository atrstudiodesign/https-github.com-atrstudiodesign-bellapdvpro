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
