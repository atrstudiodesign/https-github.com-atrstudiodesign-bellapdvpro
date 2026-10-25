import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  initializeTestEnvironment,
  assertFails,
  assertSucceeds,
  RulesTestEnvironment,
  RulesTestContext
} from '@firebase/rules-unit-testing';
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  Firestore
} from 'firebase/firestore';

/**
 * BELLA PDV PRO — Multi-Tenant Security Rules Verification Suite
 *
 * Verifies strict Firestore data isolation between two distinct tenant companies:
 *   - Company A (ownerUid: 'company_a_owner')
 *   - Company B (ownerUid: 'company_b_owner')
 *
 * Validates that any attempt to cross tenant boundaries results in PERMISSION-DENIED.
 */

interface TestResult {
  name: string;
  passed: boolean;
  error?: string;
}

const results: TestResult[] = [];

async function runTest(name: string, fn: () => Promise<void>) {
  try {
    await fn();
    results.push({ name, passed: true });
    console.log(`  \x1b[32m✔ PASS\x1b[0m - ${name}`);
  } catch (err: any) {
    results.push({ name, passed: false, error: err?.message || String(err) });
    console.error(`  \x1b[31m✖ FAIL\x1b[0m - ${name}`);
    console.error(`         Reason: ${err?.message || err}`);
  }
}

async function main() {
  console.log('\n=============================================================');
  console.log('   BELLA PDV PRO: FIRESTORE MULTI-TENANT ISOLATION TESTS');
  console.log('=============================================================\n');

  const rulesPath = resolve(process.cwd(), 'firestore.rules');
  const rules = readFileSync(rulesPath, 'utf8');

  // Initialize test environment
  const testEnv: RulesTestEnvironment = await initializeTestEnvironment({
    projectId: 'demo-bellapdv-security-test',
    firestore: {
      rules,
      host: process.env.FIRESTORE_EMULATOR_HOST?.split(':')[0] || 'localhost',
      port: Number(process.env.FIRESTORE_EMULATOR_HOST?.split(':')[1]) || 8080
    }
  });

  const authClaims: any = { firebase: { sign_in_provider: 'password' } };

  const contextA = testEnv.authenticatedContext('company_a_owner', authClaims);
  const contextB = testEnv.authenticatedContext('company_b_owner', authClaims);

  const dbA: any = contextA.firestore();
  const dbB: any = contextB.firestore();

  console.log('1. Setting up mock tenant user records & seeded data (bypassing rules)...');
  await testEnv.withSecurityRulesDisabled(async (adminContext) => {
    const adminDb = adminContext.firestore();

    // Tenant A Profile & Seeded Documents
    await setDoc(doc(adminDb, 'users/company_a_owner'), {
      role: 'client',
      companyId: 'company_a_owner',
      email: 'proprietario.a@empresa-a.com',
      companyName: 'Salão Alpha'
    });
    await setDoc(doc(adminDb, 'companies/company_a_owner'), {
      ownerId: 'company_a_owner',
      name: 'Salão Alpha'
    });
    await setDoc(doc(adminDb, 'clients/client_a_1'), {
      ownerId: 'company_a_owner',
      name: 'Cliente VIP Alpha',
      phone: '11999990001'
    });
    await setDoc(doc(adminDb, 'appointments/apt_a_1'), {
      ownerId: 'company_a_owner',
      client: 'Cliente VIP Alpha',
      service: 'Corte Degradê',
      time: '14:00',
      status: 'confirmed'
    });
    await setDoc(doc(adminDb, 'transactions/trx_a_1'), {
      ownerId: 'company_a_owner',
      total: 120.00,
      items: ['Corte', 'Pomada'],
      status: 'completed',
      paymentMethod: 'pix'
    });
    await setDoc(doc(adminDb, 'catalog/service_a_1'), {
      ownerId: 'company_a_owner',
      name: 'Barba Terapia',
      price: 60.00,
      duration: 30
    });
    await setDoc(doc(adminDb, 'professionals/pro_a_1'), {
      ownerId: 'company_a_owner',
      name: 'Mestre Barbeiro A'
    });

    // Tenant B Profile & Seeded Documents
    await setDoc(doc(adminDb, 'users/company_b_owner'), {
      role: 'client',
      companyId: 'company_b_owner',
      email: 'proprietario.b@empresa-b.com',
      companyName: 'Studio Beleza Beta'
    });
    await setDoc(doc(adminDb, 'companies/company_b_owner'), {
      ownerId: 'company_b_owner',
      name: 'Studio Beleza Beta'
    });
    await setDoc(doc(adminDb, 'clients/client_b_1'), {
      ownerId: 'company_b_owner',
      name: 'Cliente VIP Beta',
      phone: '21988880002'
    });
    await setDoc(doc(adminDb, 'appointments/apt_b_1'), {
      ownerId: 'company_b_owner',
      client: 'Cliente VIP Beta',
      service: 'Coloração Especial',
      time: '16:00',
      status: 'confirmed'
    });
    await setDoc(doc(adminDb, 'transactions/trx_b_1'), {
      ownerId: 'company_b_owner',
      total: 350.00,
      items: ['Coloração', 'Tratamento'],
      status: 'completed',
      paymentMethod: 'card'
    });
    await setDoc(doc(adminDb, 'catalog/service_b_1'), {
      ownerId: 'company_b_owner',
      name: 'Escova Modeladora',
      price: 150.00,
      duration: 60
    });
    await setDoc(doc(adminDb, 'professionals/pro_b_1'), {
      ownerId: 'company_b_owner',
      name: 'Colorista Senior B'
    });
  });

  console.log('\n2. Executing Isolation & Permission-Denied Test Scenarios:\n');

  // --- CRM & CLIENTS ISOLATION ---
  await runTest('Company A can READ their own CRM clients', async () => {
    await assertSucceeds(getDoc(doc(dbA, 'clients/client_a_1')));
  });

  await runTest('Company B can READ their own CRM clients', async () => {
    await assertSucceeds(getDoc(doc(dbB, 'clients/client_b_1')));
  });

  await runTest('Company A attempting to READ Company B clients is DENIED', async () => {
    await assertFails(getDoc(doc(dbA, 'clients/client_b_1')));
  });

  await runTest('Company B attempting to READ Company A clients is DENIED', async () => {
    await assertFails(getDoc(doc(dbB, 'clients/client_a_1')));
  });

  await runTest('Company A attempting to UPDATE Company B client is DENIED', async () => {
    await assertFails(
      updateDoc(doc(dbA, 'clients/client_b_1'), { name: 'Nome Invasor' })
    );
  });

  await runTest('Company B attempting to DELETE Company A client is DENIED', async () => {
    await assertFails(deleteDoc(doc(dbB, 'clients/client_a_1')));
  });

  await runTest('Company A attempting to CREATE a client spoofing Company B ownerId is DENIED', async () => {
    await assertFails(
      setDoc(doc(dbA, 'clients/spoofed_client'), {
        ownerId: 'company_b_owner',
        name: 'Cliente Spoofing'
      })
    );
  });

  // --- FINANCIAL TRANSACTIONS ISOLATION ---
  await runTest('Company A can READ their own financial transactions', async () => {
    await assertSucceeds(getDoc(doc(dbA, 'transactions/trx_a_1')));
  });

  await runTest('Company A attempting to READ Company B financial transactions is DENIED', async () => {
    await assertFails(getDoc(doc(dbA, 'transactions/trx_b_1')));
  });

  await runTest('Company B attempting to READ Company A financial transactions is DENIED', async () => {
    await assertFails(getDoc(doc(dbB, 'transactions/trx_a_1')));
  });

  await runTest('Company A attempting to CREATE transaction in Company B is DENIED', async () => {
    await assertFails(
      setDoc(doc(dbA, 'transactions/unauthorized_trx'), {
        ownerId: 'company_b_owner',
        total: 500,
        items: ['Fraude'],
        status: 'completed',
        paymentMethod: 'pix'
      })
    );
  });

  // --- APPOINTMENTS / CALENDAR ISOLATION ---
  await runTest('Company A can READ their own calendar appointments', async () => {
    await assertSucceeds(getDoc(doc(dbA, 'appointments/apt_a_1')));
  });

  await runTest('Company A attempting to READ Company B internal appointments is DENIED', async () => {
    await assertFails(getDoc(doc(dbA, 'appointments/apt_b_1')));
  });

  await runTest('Company B attempting to READ Company A internal appointments is DENIED', async () => {
    await assertFails(getDoc(doc(dbB, 'appointments/apt_a_1')));
  });

  await runTest('Company A attempting to ALTER Company B appointment status is DENIED', async () => {
    await assertFails(
      updateDoc(doc(dbA, 'appointments/apt_b_1'), { status: 'cancelled' })
    );
  });

  // --- SERVICE CATALOG & PROFESSIONALS ISOLATION ---
  await runTest('Company A attempting to READ Company B service catalog is DENIED', async () => {
    await assertFails(getDoc(doc(dbA, 'catalog/service_b_1')));
  });

  await runTest('Company B attempting to READ Company A service catalog is DENIED', async () => {
    await assertFails(getDoc(doc(dbB, 'catalog/service_a_1')));
  });

  await runTest('Company A attempting to READ Company B team professionals is DENIED', async () => {
    await assertFails(getDoc(doc(dbA, 'professionals/pro_b_1')));
  });

  await runTest('Company B attempting to READ Company A team professionals is DENIED', async () => {
    await assertFails(getDoc(doc(dbB, 'professionals/pro_a_1')));
  });

  // --- COMPANY SETTINGS ISOLATION ---
  await runTest('Company A attempting to READ Company B profile settings is DENIED', async () => {
    await assertFails(getDoc(doc(dbA, 'companies/company_b_owner')));
  });

  await runTest('Company B attempting to READ Company A profile settings is DENIED', async () => {
    await assertFails(getDoc(doc(dbB, 'companies/company_a_owner')));
  });

  // Cleanup test environment
  await testEnv.cleanup();

  // Summary
  const passedCount = results.filter((r) => r.passed).length;
  const failedCount = results.filter((r) => !r.passed).length;

  console.log('\n-------------------------------------------------------------');
  console.log(`TEST RESULTS: ${passedCount} passed, ${failedCount} failed of ${results.length} tests.`);
  console.log('-------------------------------------------------------------\n');

  if (failedCount > 0) {
    console.error('❌ Multi-tenant security isolation check FAILED.');
    process.exit(1);
  } else {
    console.log('✅ Multi-tenant security rules verified: Company A & Company B are 100% isolated.');
  }
}

// Execute when invoked directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((err) => {
    console.error('Test execution error:', err);
    process.exit(1);
  });
}

export { main };
