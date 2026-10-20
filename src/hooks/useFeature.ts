import { useState, useEffect } from 'react';
import { useAuthStore } from '../store/auth';
import { db } from '../lib/firebase';
import { doc, onSnapshot } from 'firebase/firestore';

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
    setIsAllowed(false);
    setLoading(true);
    setFeatureFlags(null);
    setLicense(null);

    // If no user is logged in
    if (!user) {
      setIsAllowed(false);
      setLoading(false);
      return;
    }

    // 🌟 Instant Full Access for Demo or Admin Users (prevents any infinite loading or permissions hang)
    const isDemoUser = user.isDemo === true;
    if (user.isPlatformAdmin === true) {
      setIsAllowed(true);
      setLoading(false);
      return;
    }
    if (isDemoUser) {
      const demoFlags: FeatureFlags = {
        companyId: user.id,
        pdv: true,
        agenda: true,
        crm: true,
        whatsapp: true,
        aiAssistant: true,
        cashback: true,
        whiteLabel: true,
        marketplace: true,
        mobileApp: true,
      };
      const demoLic: CompanyLicense = {
        id: user.id,
        name: user.name || 'Empresa Demonstração',
        plan: 'Ouro',
        status: 'active',
        expireDate: '2027-12-31',
        aiUsage: 12,
        waUsage: 25,
        unitsCount: 3,
        maxUsers: 20,
        addons: ['bella_ia_marketing', 'whatsapp_premium', 'white_label', 'app_mobile_client'],
        modules: ['pdv', 'agenda', 'crm', 'aiAssistant', 'whatsapp', 'whiteLabel', 'marketplace', 'mobileApp']
      };
      setFeatureFlags(demoFlags);
      setLicense(demoLic);
      setIsAllowed(true);
      setLoading(false);
      return;
    }

    const companyId = user.companyId || user.id;
    const normalized = normalizeKey(featureKey);

    // Initial safe defaults based on user role and permissions
    const fallbackFlags: FeatureFlags = {
      companyId,
      pdv: false,
      agenda: false,
      crm: false,
      whatsapp: false,
      aiAssistant: false,
      cashback: false,
      whiteLabel: false,
      marketplace: false,
      mobileApp: false
    };

    const fallbackLicense: CompanyLicense = {
      id: companyId,
      name: user.name || 'Minha Empresa',
      plan: 'Bronze',
      status: 'expired',
      expireDate: '2026-12-31',
      aiUsage: 0,
      waUsage: 0,
      unitsCount: 1,
      maxUsers: 10,
      addons: [],
      modules: []
    };

    // ⏱️ Safety failsafe timeout: NEVER let the user stay stuck in "Verificando licença..." for more than 600ms
    const safetyTimer = setTimeout(() => {
      setFeatureFlags((prev) => prev || fallbackFlags);
      setLicense((prev) => prev || fallbackLicense);
      setLoading(false);
    }, 600);

    // 1. Subscribe to feature_flags for current company
    const flagDocRef = doc(db, 'feature_flags', companyId);
    let unsubscribeFlags = onSnapshot(flagDocRef, async (flagDocSnap) => {
      let flags: FeatureFlags;

      if (!flagDocSnap.exists()) {
        flags = fallbackFlags;
      } else {
        flags = flagDocSnap.data() as FeatureFlags;
      }
      setFeatureFlags(flags);
    }, (err) => {
      console.warn('Feature flags snapshot notice, using standard defaults:', err?.message || err);
      setFeatureFlags(fallbackFlags);
      setLoading(false);
    });

    // 2. Subscribe to company_licenses for current company
    const licDocRef = doc(db, 'company_licenses', companyId);
    let unsubscribeLicense = onSnapshot(licDocRef, async (licDocSnap) => {
      let lic: CompanyLicense;

      if (!licDocSnap.exists()) {
        lic = fallbackLicense;
      } else {
        lic = licDocSnap.data() as CompanyLicense;
      }
      setLicense(lic);
    }, (err) => {
      console.warn('License snapshot notice, using standard defaults:', err?.message || err);
      setLicense(fallbackLicense);
      setLoading(false);
    });

    return () => {
      clearTimeout(safetyTimer);
      unsubscribeFlags();
      unsubscribeLicense();
    };
  }, [user?.id, user?.companyId, user?.isDemo, user?.isPlatformAdmin, featureKey]);

  // Combined logic check
  useEffect(() => {
    if (!user) {
      setIsAllowed(false);
      setLoading(false);
      return;
    }

    if (user.isDemo || user.isPlatformAdmin === true) {
      setIsAllowed(true);
      setLoading(false);
      return;
    }

    // Checking of states
    const activeFlags = featureFlags;
    const activeLicense = license;

    if (activeFlags || activeLicense) {
      const normalized = normalizeKey(featureKey);
      const isExpired = activeLicense ? activeLicense.status === 'expired' : false;
      const isFlagOn = activeFlags ? !!activeFlags[normalized] : false;
      
      let isLicensePlanAllowed = false;
      if (activeLicense) {
        if (activeLicense.status === 'active' || activeLicense.status === 'trial') {
          if (normalized === 'pdv' || normalized === 'agenda') {
            isLicensePlanAllowed = true;
          } else if (normalized === 'crm') {
            isLicensePlanAllowed = activeLicense.plan === 'Prata' || activeLicense.plan === 'Ouro';
          } else if (normalized === 'aiAssistant') {
            isLicensePlanAllowed = activeLicense.plan === 'Ouro' || (activeLicense.addons || []).includes('bella_ia_marketing');
          } else if (normalized === 'whatsapp') {
            isLicensePlanAllowed = (activeLicense.addons || []).includes('whatsapp_premium');
          } else if (normalized === 'whiteLabel') {
            isLicensePlanAllowed = (activeLicense.addons || []).includes('white_label');
          } else if (normalized === 'marketplace') {
            isLicensePlanAllowed = activeLicense.plan === 'Ouro';
          } else if (normalized === 'mobileApp') {
            isLicensePlanAllowed = (activeLicense.addons || []).includes('app_mobile_client');
          } else {
            isLicensePlanAllowed = true;
          }
        }
      }

      const allowed = !!activeFlags && !!activeLicense && !isExpired && isFlagOn && isLicensePlanAllowed;
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
    status: license?.status ?? ('inactive' as const)
  };
}
