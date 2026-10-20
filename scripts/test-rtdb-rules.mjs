import { readFileSync } from 'node:fs';
import { after, test } from 'node:test';
import { get, ref, remove, set } from 'firebase/database';
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment
} from '@firebase/rules-unit-testing';

const env = await initializeTestEnvironment({
  projectId: 'demo-bellapdv-p0',
  database: { rules: readFileSync('database.rules.json', 'utf8') }
});

after(async () => env.cleanup());

const token = { firebase: { sign_in_provider: 'google.com' } };
const a = env.authenticatedContext('companyA', token).database();
const b = env.authenticatedContext('companyB', token).database();
const member = env.authenticatedContext('employee', {
  ...token,
  companyId: 'companyA'
}).database();
const reassigned = env.authenticatedContext('companyB', {
  ...token,
  companyId: 'companyA'
}).database();
const anonymous = env.authenticatedContext('anonymous-user', {
  firebase: { sign_in_provider: 'anonymous' }, companyId: 'companyA'
}).database();
const guest = env.unauthenticatedContext().database();
const path = (company, child = 'message') => `tenants/${company}/${child}`;

test('cada empresa acessa somente a própria mensagem', async () => {
  await assertSucceeds(set(ref(a, path('companyA')), 'A'));
  await assertSucceeds(set(ref(b, path('companyB')), 'B'));
  await assertSucceeds(get(ref(a, path('companyA'))));
  await assertSucceeds(get(ref(b, path('companyB'))));
  await assertFails(get(ref(a, path('companyB'))));
  await assertFails(get(ref(b, path('companyA'))));
  await assertFails(set(ref(a, path('companyB')), 'vazamento'));
  await assertFails(set(ref(b, path('companyA')), 'vazamento'));
});

test('claim companyId concede somente o tenant indicado', async () => {
  await assertSucceeds(get(ref(member, path('companyA'))));
  await assertFails(get(ref(member, path('companyB'))));
  await assertSucceeds(get(ref(reassigned, path('companyA'))));
  await assertFails(get(ref(reassigned, path('companyB'))));
});

test('visitante e login anônimo não acessam dados', async () => {
  for (const db of [anonymous, guest]) {
    await assertFails(get(ref(db, path('companyA'))));
    await assertFails(set(ref(db, path('companyA')), 'invasão'));
  }
});

test('raiz, tenant inteiro e caminhos legados continuam negados', async () => {
  for (const key of ['/', 'tenants/companyA', 'tenants/companyA/unknown', 'message', 'terminals/terminal1']) {
    await assertFails(get(ref(a, key)));
    await assertFails(set(ref(a, key), 'indevido'));
  }
});

test('mensagem e terminal rejeitam dados inválidos e exclusão', async () => {
  await assertFails(set(ref(a, path('companyA')), 'x'.repeat(1001)));
  await assertFails(set(ref(a, path('companyA')), { demo: true }));
  const terminal = ref(a, path('companyA', 'terminals/terminal1'));
  const valid = { isOpen: true, operator: 'Caixa', lastPing: 123456 };
  await assertSucceeds(set(terminal, valid));
  await assertSucceeds(get(terminal));
  await assertFails(get(ref(b, path('companyA', 'terminals/terminal1'))));
  await assertFails(set(ref(b, path('companyA', 'terminals/terminal1')), valid));
  await assertFails(set(terminal, { ...valid, extra: 'não permitido' }));
  await assertFails(set(terminal, { isOpen: true, operator: 'Caixa' }));
  await assertFails(set(ref(a, path('companyA', 'terminals/terminal1/isOpen')), 'sim'));
  await assertFails(remove(ref(a, path('companyA', 'terminals/terminal1/operator'))));
  await assertFails(remove(terminal));
});
