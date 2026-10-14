import { collection, getDocs, doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';

export interface MigrationResult {
  success: boolean;
  totalProcessed: number;
  migratedCount: number;
  errors: Array<{ id: string; error: string }>;
}

export async function migrateCompanyLicenses(): Promise<MigrationResult> {
  const result: MigrationResult = {
    success: true,
    totalProcessed: 0,
    migratedCount: 0,
    errors: [],
  };

  try {
    // 1. Fetch all existing users (which represent companies/merchants)
    const usersSnapshot = await getDocs(collection(db, 'users'));
    const users = usersSnapshot.docs;
    result.totalProcessed = users.length;

    for (const userDoc of users) {
      const companyId = userDoc.id;
      const data = userDoc.data();

      try {
        // 2. Fetch or prepare feature flags to determine active modules
        const flagsRef = doc(db, 'feature_flags', companyId);
        const flagsSnap = await getDoc(flagsRef);
        let activeModules: string[] = ['pdv', 'agenda']; // default safe modules

        if (flagsSnap.exists()) {
          const flagsData = flagsSnap.data();
          activeModules = Object.entries(flagsData)
            .filter(([key, val]) => val === true && key !== 'companyId')
            .map(([key]) => key);
        } else {
          // Initialize feature flags if missing
          const initialFlags = {
            companyId,
            pdv: true,
            agenda: true,
            crm: false,
            whatsapp: false,
            aiAssistant: false,
            cashback: false,
            whiteLabel: false,
            marketplace: false,
            mobileApp: false,
          };
          await setDoc(flagsRef, initialFlags);
        }

        // 3. Normalize plan to Bronze, Prata, or Ouro
        let plan: 'Bronze' | 'Prata' | 'Ouro' = 'Bronze';
        const rawPlan = String(data.plan || '').toLowerCase();
        if (rawPlan.includes('ouro') || rawPlan.includes('gold') || rawPlan.includes('premium')) {
          plan = 'Ouro';
        } else if (rawPlan.includes('prata') || rawPlan.includes('silver') || rawPlan.includes('pro')) {
          plan = 'Prata';
        }

        // 4. Default Limits based on Plan
        let usageLimits = {
          maxUsers: 5,
          aiUsageLimit: 100,
          waUsageLimit: 500,
          unitsLimit: 1,
        };

        if (plan === 'Prata') {
          usageLimits = {
            maxUsers: 15,
            aiUsageLimit: 500,
            waUsageLimit: 2000,
            unitsLimit: 3,
          };
        } else if (plan === 'Ouro') {
          usageLimits = {
            maxUsers: 999,
            aiUsageLimit: 5000,
            waUsageLimit: 10000,
            unitsLimit: 10,
          };
        }

        // 5. Build Company License document
        const licenseRef = doc(db, 'company_licenses', companyId);
        const licenseSnap = await getDoc(licenseRef);

        const companyLicenseData = {
          id: companyId,
          name: data.name || 'Empresa sem Nome',
          plan,
          status: (data.status || 'trial').toLowerCase() as 'active' | 'trial' | 'expired',
          expireDate: data.expire || '2026-12-31',
          aiUsage: licenseSnap.exists() ? (licenseSnap.data().aiUsage ?? 0) : 0,
          waUsage: licenseSnap.exists() ? (licenseSnap.data().waUsage ?? 0) : 0,
          unitsCount: licenseSnap.exists() ? (licenseSnap.data().unitsCount ?? 1) : 1,
          maxUsers: usageLimits.maxUsers,
          activeModules,
          usageLimits,
        };

        // 6. Write/Update the company license document in Firestore
        await setDoc(licenseRef, companyLicenseData, { merge: true });
        result.migratedCount++;

      } catch (error: any) {
        console.error(`Error migrating company ${companyId}:`, error);
        result.errors.push({
          id: companyId,
          error: error?.message || String(error),
        });
      }
    }

  } catch (error: any) {
    console.error('Migration failed completely:', error);
    result.success = false;
    result.errors.push({
      id: 'GLOBAL',
      error: error?.message || String(error),
    });
  }

  return result;
}
