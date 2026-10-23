import { ReactNode } from 'react';
import { useLicenseCheck } from '../hooks/useLicenseCheck';
import { Loader2, LockKeyhole } from 'lucide-react';

interface LicenseRouteGuardProps {
  featureKey: string;
  errorMessage?: string;
  inlineBlocked?: boolean;
  children: ReactNode;
}

/**
 * Route guard component that restricts access to sub-routes/components based on license permissions.
 */
export function LicenseRouteGuard({ featureKey, errorMessage, inlineBlocked = false, children }: LicenseRouteGuardProps) {
  const { isAllowed, loading } = useLicenseCheck(featureKey, {
    autoRedirect: !inlineBlocked,
    errorMessage,
    redirectTo: '/settings',
  });

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[500px]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-cyan-500 animate-spin" />
          <p className="text-xs text-slate-500 font-mono">Verificando licença...</p>
        </div>
      </div>
    );
  }

  if (!isAllowed) {
    if (inlineBlocked) {
      return (
        <section className="flex-1 flex items-center justify-center min-h-[450px] p-6" role="status">
          <div className="w-full max-w-lg rounded-2xl border border-amber-500/20 bg-[#0F172A] p-8 text-center">
            <LockKeyhole className="mx-auto mb-4 h-9 w-9 text-amber-400" aria-hidden="true" />
            <h1 className="text-xl font-semibold text-white">CRM / Funil indisponível</h1>
            <p className="mt-3 text-sm leading-relaxed text-slate-300">{errorMessage || 'Esta funcionalidade não está habilitada para a empresa.'}</p>
            <p className="mt-3 text-xs text-slate-400">Consulte o responsável pela assinatura para solicitar a habilitação. Nenhuma configuração de voz é necessária.</p>
          </div>
        </section>
      );
    }
    return null; // Other guarded modules may continue their configured redirect.
  }

  return <>{children}</>;
}
