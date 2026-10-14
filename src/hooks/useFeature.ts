import { useState, useEffect } from 'react';
import { useAuthStore } from '../store/auth';
import { db } from '../lib/firebase';
import { doc, onSnapshot, setDoc, getDoc } from 'firebase/firestore';

interface FeatureFlags {
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

interface CompanyLicense {
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

const normalizeKey = (key: string): string => {
  const k = key.toLowerCase();
  if (k.includes('whatsapp')) return 'whatsapp';
  if (k.includes('ia') || k.includes('ai') || k.includes('assistant') || k.includes('marketing')) return 'aiAssistant';
  if (k.includes('crm')) return 'crm';
  if (k.includes('cashback') || k.includes('fidelidade')) return 'cashback';
  if (k.includes('white')) return 'whiteLabel';
  if (k.includes('market')) return 'marketplace';
  if (k.includes('mobile') || k.includes('app')) return 'mobileApp';
  if (k.includes('pdv')) return 'pdv';
  if (k.includes('agenda')) return 'agenda';
  return key;
};

export function useFeature(featureKey: string) {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [isAllowed, setIsAllowed] = useState<boolean>(false);
  const [featureFlags, setFeatureFlags] = useState<FeatureFlags | null>(null);
  const [license, setLicense] = useState<CompanyLicense | null>(null);

  useEffect(() => {
    if (!user?.id) {
      setIsAllowed(false);
      setLoading(false);
      return;
    }

    const companyId = user.id;
    const normalized = normalizeKey(featureKey);

    // 1. Subscribe to feature_flags for current company
    const flagDocRef = doc(db, 'feature_flags', companyId);
    
    // Ensure document and listen
    let unsubscribeFlags = onSnapshot(flagDocRef, async (flagDocSnap) => {
      let flags: FeatureFlags;

      if (!flagDocSnap.exists()) {
        // Initial defaults for standard features
        flags = {
          companyId,
          pdv: true,
          agenda: true,
          crm: true,
          whatsapp: false,
          aiAssistant: false,
          cashback: false,
          whiteLabel: false,
          marketplace: false,
          mobileApp: false
        };
        try {
          await setDoc(flagDocRef, flags);
        } catch (err) {
          console.warn('Silent warning creating default feature flags:', err);
        }
      } else {
        flags = flagDocSnap.data() as FeatureFlags;
      }
      setFeatureFlags(flags);
    }, (err) => {
      console.error('Feature flags listen error:', err);
    });

    // 2. Subscribe to company_licenses for current company
    const licDocRef = doc(db, 'company_licenses', companyId);
    let unsubscribeLicense = onSnapshot(licDocRef, async (licDocSnap) => {
      let lic: CompanyLicense;

      if (!licDocSnap.exists()) {
        lic = {
          id: companyId,
          name: user.name || 'Nova Unidade',
          plan: 'Prata',
          status: 'active',
          expireDate: '2026-12-31',
          aiUsage: 0,
          waUsage: 0,
          unitsCount: 1,
          maxUsers: 5,
          addons: [],
          modules: ['pdv', 'agenda', 'crm']
        };
        try {
          await setDoc(licDocRef, lic);
        } catch (err) {
          console.warn('Silent warning creating default company license:', err);
        }
      } else {
        lic = licDocSnap.data() as CompanyLicense;
      }
      setLicense(lic);
    }, (err) => {
      console.error('License listen error:', err);
    });

    return () => {
      unsubscribeFlags();
      unsubscribeLicense();
    };
  }, [user?.id, featureKey]);

  // Combined logic check
  useEffect(() => {
    if (!user) {
      setIsAllowed(false);
      setLoading(false);
      return;
    }

    // Checking of states
    if (featureFlags && license) {
      const normalized = normalizeKey(featureKey);
      
      // Determine if expired
      const isExpired = license.status === 'expired';
      
      // Feature flag check
      const isFlagOn = !!featureFlags[normalized];
      
      // Additional license module check (e.g., if module is in modules/addons array, or if they have a plan that overrides)
      let isLicensePlanAllowed = false;
      
      // Plan tier permissions
      if (license.status === 'active' || license.status === 'trial') {
        if (normalized === 'pdv' || normalized === 'agenda') {
          isLicensePlanAllowed = true;
        } else if (normalized === 'crm') {
          // Allowed in Prata and Ouro
          isLicensePlanAllowed = license.plan === 'Prata' || license.plan === 'Ouro';
        } else if (normalized === 'aiAssistant') {
          // Allowed in Ouro or if they purchased addon
          isLicensePlanAllowed = license.plan === 'Ouro' || (license.addons || []).includes('bella_ia_marketing');
        } else if (normalized === 'whatsapp') {
          isLicensePlanAllowed = (license.addons || []).includes('whatsapp_premium');
        } else if (normalized === 'whiteLabel') {
          isLicensePlanAllowed = (license.addons || []).includes('white_label');
        } else if (normalized === 'marketplace') {
          isLicensePlanAllowed = license.plan === 'Ouro';
        } else if (normalized === 'mobileApp') {
          isLicensePlanAllowed = (license.addons || []).includes('app_mobile_client');
        } else {
          isLicensePlanAllowed = true;
        }
      }

      // Feature is allowed if NOT expired AND (enabled specifically in feature_flags OR allowed under license plan)
      const allowed = !isExpired && (isFlagOn || isLicensePlanAllowed);
      
      setIsAllowed(allowed);
      setLoading(false);
    }
  }, [featureFlags, license, featureKey, user]);

  return {
    isAllowed,
    loading,
    featureFlags,
    license,
    plan: license?.plan || 'Bronze',
    status: license?.status || 'inactive'
  };
}
