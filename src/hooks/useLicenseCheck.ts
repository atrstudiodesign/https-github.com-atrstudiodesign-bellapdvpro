import { useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useFeature } from './useFeature';
import { useSubscriptionStore, SubscriptionStatus } from '../store/subscription';

export interface UseLicenseCheckOptions {
  /**
   * Automatically redirect to the upgrade/settings screen if the user has no permission
   * @default false
   */
  autoRedirect?: boolean;
  /**
   * Custom message to show in the error toast when access is blocked
   */
  errorMessage?: string;
  /**
   * Custom route or hash to redirect the user to (e.g., '/settings', '/finance')
   * @default '/settings'
   */
  redirectTo?: string;
}

export interface UseLicenseCheckResult {
  /**
   * If the user current is allowed to access the feature/resource
   */
  isAllowed: boolean;
  /**
   * State indicating if the feature flags and license are being loaded from Firestore
   */
  loading: boolean;
  /**
   * Direct access to the current license plan ('Bronze' | 'Prata' | 'Ouro')
   */
  plan: 'Bronze' | 'Prata' | 'Ouro';
  /**
   * Subscription status ('active' | 'trial' | 'expired')
   */
  status: 'active' | 'trial' | 'expired' | 'inactive';
  /**
   * Manually check permission. If fails, displays error toast and redirects.
   * Useful for click handlers on premium buttons or actions.
   * @returns true if allowed, false if blocked
   */
  checkAccess: () => boolean;
}

/**
 * Custom Hook for real-time license and permission checks in routes or components.
 * 
 * @param featureKey The specific feature tag to check (e.g. 'whatsapp', 'aiAssistant', 'whiteLabel', 'marketplace')
 * @param options Configurations for redirection and toast feedback
 */
export function useLicenseCheck(
  featureKey: string,
  options: UseLicenseCheckOptions = {}
): UseLicenseCheckResult {
  const {
    autoRedirect = false,
    errorMessage = 'Este recurso requer um upgrade no seu plano de assinatura.',
    redirectTo = '/settings',
  } = options;

  const navigate = useNavigate();

  // 1. Retrieve the granular feature verification and license metadata from the firestore subscription
  const { isAllowed, loading, plan, status, license } = useFeature(featureKey);
  const subscriptionStore = useSubscriptionStore();

  // 2. Determine final structural access checking for overall subscription status
  const isOverallBlocked = subscriptionStore.status === 'BLOCK_TOTAL';

  // Combined permission logic: must have license-allowed access and not be entirely blocked by subscription statuses
  const finalHasAccess = isAllowed && !isOverallBlocked;

  // 3. Callback function for manual action checks (e.g. onClick events)
  const checkAccess = useCallback((): boolean => {
    if (loading) return false;

    if (!finalHasAccess) {
      toast.error('Recurso Bloqueado', {
        description: errorMessage,
        duration: 5000,
        action: {
          label: 'Upgrade',
          onClick: () => navigate(redirectTo),
        },
      });
      navigate(redirectTo);
      return false;
    }
    return true;
  }, [finalHasAccess, loading, errorMessage, redirectTo, navigate]);

  // 4. Trigger automatic redirect once loaded if autoRedirect option is set
  useEffect(() => {
    if (!loading && autoRedirect && !finalHasAccess) {
      toast.warning('Upgrade Necessário', {
        description: errorMessage,
        duration: 5000,
        action: {
          label: 'Assinar Plano',
          onClick: () => navigate(redirectTo),
        },
      });
      navigate(redirectTo);
    }
  }, [loading, autoRedirect, finalHasAccess, errorMessage, redirectTo, navigate]);

  return {
    isAllowed: finalHasAccess,
    loading,
    plan,
    status,
    checkAccess,
  };
}
