import { auth } from './firebase';

export function currentFirebaseTenantId(): string | null {
  const raw = localStorage.getItem('last_merchant_uid');
  return raw || auth.currentUser?.uid || null;
}
