import { auth } from './firebase';

let tenantContext: { uid: string; companyId: string } | null = null;

export function setFirebaseTenantContext(uid: string | null, companyId?: string) {
  tenantContext = uid ? { uid, companyId: companyId || uid } : null;
}

export function currentFirebaseTenantId(): string | null {
  const user = auth.currentUser;
  if (!user || user.isAnonymous) return null;
  return tenantContext?.uid === user.uid ? tenantContext.companyId : user.uid;
}
