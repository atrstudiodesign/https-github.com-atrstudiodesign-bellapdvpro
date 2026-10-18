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
