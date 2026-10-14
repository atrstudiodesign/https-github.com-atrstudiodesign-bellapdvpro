import { doc, getDoc, setDoc, updateDoc, onSnapshot } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export interface CompanyLicense {
  id: string;
  name: string;
  plan: 'Bronze' | 'Prata' | 'Ouro';
  status: 'active' | 'trial' | 'expired';
  expireDate: string;
  aiUsage: number;
  waUsage: number;
  unitsCount: number;
  maxUsers: number;
  addons?: string[];
  modules?: string[];
}

export interface FeatureFlags {
  companyId: string;
  pdv: boolean;
  agenda: boolean;
  crm: boolean;
  whatsapp: boolean;
  aiAssistant: boolean;
  cashback: boolean;
  whiteLabel: boolean;
  marketplace: boolean;
  mobileApp: boolean;
  [key: string]: boolean | string;
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

/**
 * Fetches the company license for a given company ID.
 */
export async function getCompanyLicense(companyId: string): Promise<CompanyLicense | null> {
  const path = `company_licenses/${companyId}`;
  try {
    const docRef = doc(db, 'company_licenses', companyId);
    const snap = await getDoc(docRef);
    if (!snap.exists()) return null;
    return snap.data() as CompanyLicense;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
    return null;
  }
}

/**
 * Updates or merges company license details.
 */
export async function updateCompanyLicense(companyId: string, data: Partial<CompanyLicense>): Promise<void> {
  const path = `company_licenses/${companyId}`;
  try {
    const docRef = doc(db, 'company_licenses', companyId);
    await setDoc(docRef, data, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

/**
 * Fetches the feature flags for a given company ID.
 */
export async function getFeatureFlags(companyId: string): Promise<FeatureFlags | null> {
  const path = `feature_flags/${companyId}`;
  try {
    const docRef = doc(db, 'feature_flags', companyId);
    const snap = await getDoc(docRef);
    if (!snap.exists()) return null;
    return snap.data() as FeatureFlags;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
    return null;
  }
}

/**
 * Updates or merges feature flags for a company.
 */
export async function updateFeatureFlags(companyId: string, data: Partial<FeatureFlags>): Promise<void> {
  const path = `feature_flags/${companyId}`;
  try {
    const docRef = doc(db, 'feature_flags', companyId);
    await setDoc(docRef, data, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

/**
 * Subscribes to real-time updates for a company license.
 */
export function subscribeToCompanyLicense(
  companyId: string,
  onUpdate: (license: CompanyLicense | null) => void,
  onError?: (error: any) => void
): () => void {
  const path = `company_licenses/${companyId}`;
  const docRef = doc(db, 'company_licenses', companyId);
  return onSnapshot(
    docRef,
    (snap) => {
      if (!snap.exists()) {
        onUpdate(null);
      } else {
        onUpdate(snap.data() as CompanyLicense);
      }
    },
    (error) => {
      if (onError) {
        onError(error);
      }
      handleFirestoreError(error, OperationType.GET, path);
    }
  );
}

/**
 * Subscribes to real-time updates for feature flags.
 */
export function subscribeToFeatureFlags(
  companyId: string,
  onUpdate: (flags: FeatureFlags | null) => void,
  onError?: (error: any) => void
): () => void {
  const path = `feature_flags/${companyId}`;
  const docRef = doc(db, 'feature_flags', companyId);
  return onSnapshot(
    docRef,
    (snap) => {
      if (!snap.exists()) {
        onUpdate(null);
      } else {
        onUpdate(snap.data() as FeatureFlags);
      }
    },
    (error) => {
      if (onError) {
        onError(error);
      }
      handleFirestoreError(error, OperationType.GET, path);
    }
  );
}
