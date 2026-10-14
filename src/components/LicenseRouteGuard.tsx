import { ReactNode } from 'react';
import { useLicenseCheck } from '../hooks/useLicenseCheck';
import { Loader2 } from 'lucide-react';

interface LicenseRouteGuardProps {
  featureKey: string;
  errorMessage?: string;
  children: ReactNode;
}

/**
 * Route guard component that restricts access to sub-routes/components based on license permissions.
 */
export function LicenseRouteGuard({ featureKey, errorMessage, children }: LicenseRouteGuardProps) {
  const { isAllowed, loading } = useLicenseCheck(featureKey, {
    autoRedirect: true,
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
    return null; // The hook automatically triggers toast notification and redirects the user
  }

  return <>{children}</>;
}
