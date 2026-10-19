export const SUPER_ADMIN_EMAILS = new Set([
  'tramposshop@gmail.com',
  'agtramposof@gmail.com',
]);

export const isSuperAdminEmail = (email?: string | null): boolean =>
  SUPER_ADMIN_EMAILS.has((email || '').trim().toLowerCase());
import type { User } from 'firebase/auth';


// Firestore grants platform access only to a server-issued admin custom claim.
export async function hasPlatformAdminClaim(user: User): Promise<boolean> {
  if (!isSuperAdminEmail(user.email)) return false;
  try {
    return (await user.getIdTokenResult()).claims.admin === true;
  } catch (error) {
    console.warn('Cannot verify platform admin claim:', error);
    return false;
  }
}
