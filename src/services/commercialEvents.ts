import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';

export type CommercialEventName = 'account_created' | 'trial_started' | 'account_login';

export async function recordAuthenticatedEvent(event: CommercialEventName, companyId: string): Promise<boolean> {
  const user = auth.currentUser;
  if (!user || user.isAnonymous || !companyId || companyId !== user.uid) return false;
  try {
    await addDoc(collection(db, 'commercial_events'), {
      event, userId: user.uid, companyId,
      occurredAt: serverTimestamp(), source: 'bella_web'
    });
    return true;
  } catch (error) {
    console.warn('Commercial event could not be persisted:', error);
    return false;
  }
}
