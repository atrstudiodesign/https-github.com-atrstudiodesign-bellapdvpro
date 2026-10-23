import { readFileSync } from 'node:fs';
import { after, test } from 'node:test';
import { deleteDoc, doc, getDoc, setDoc, updateDoc, writeBatch } from 'firebase/firestore';
import { assertFails, assertSucceeds, initializeTestEnvironment } from '@firebase/rules-unit-testing';

const env = await initializeTestEnvironment({
  projectId: 'demo-bellapdv-p0',
  firestore: { rules: readFileSync('firestore.rules', 'utf8') }
});
after(async () => env.cleanup());

const token = { firebase: { sign_in_provider: 'google.com' } };
const a = env.authenticatedContext('companyA', token).firestore();
const b = env.authenticatedContext('companyB', token).firestore();
const adminA = env.authenticatedContext('adminA', { ...token, admin: true }).firestore();
const adminB = env.authenticatedContext('adminB', { ...token, admin: true }).firestore();
const anonymous = env.authenticatedContext('anon', { firebase: { sign_in_provider: 'anonymous' } }).firestore();
const guest = env.unauthenticatedContext().firestore();

await env.withSecurityRulesDisabled(async context => {
  const db = context.firestore();
  await setDoc(doc(db, 'users/companyA'), { role: 'client', companyId: 'companyA' });
  await setDoc(doc(db, 'users/companyB'), { role: 'client', companyId: 'companyB' });
  await setDoc(doc(db, 'users/employee'), { role: 'employee', companyId: 'companyA' });
  await setDoc(doc(db, 'staff_members/employee'), { companyId: 'companyA', role: 'professional', active: true });
  await setDoc(doc(db, 'staff_portal/employee/appointments/a1'), { title: 'Agenda individual' });
  await setDoc(doc(db, 'staff_portal/employee/commissions/c1'), { amount: 100 });
  await setDoc(doc(db, 'staff_portal/companyB/appointments/b1'), { title: 'Outra pessoa' });
  await setDoc(doc(db, 'clients/clientA'), { ownerId: 'companyA', name: 'A' });
  await setDoc(doc(db, 'clients/clientB'), { ownerId: 'companyB', name: 'B' });
  await setDoc(doc(db, 'clients/demo'), { ownerId: 'demo', name: 'Demonstração' });
  await setDoc(doc(db, 'professionals/profA'), { ownerId: 'companyA', name: 'A' });
  await setDoc(doc(db, 'professionals/profB'), { ownerId: 'companyB', name: 'B' });
  await setDoc(doc(db, 'transactions/transactionA'), { ownerId: 'companyA', total: 10, items: ['x'], status: 'completed', paymentMethod: 'pix' });
});

test('A e B leem e alteram apenas seus clientes; demo fica isolada', async () => {
  await assertSucceeds(getDoc(doc(a, 'clients/clientA')));
  await assertSucceeds(getDoc(doc(b, 'clients/clientB')));
  await assertFails(getDoc(doc(a, 'clients/clientB')));
  await assertFails(getDoc(doc(b, 'clients/clientA')));
  await assertFails(getDoc(doc(a, 'clients/demo')));
  await assertFails(getDoc(doc(b, 'clients/demo')));
  await assertFails(updateDoc(doc(a, 'clients/clientB'), { name: 'alterado' }));
  await assertFails(deleteDoc(doc(b, 'clients/clientA')));
  await assertFails(setDoc(doc(a, 'clients/newB'), { ownerId: 'companyB' }));
  await assertSucceeds(setDoc(doc(a, 'clients/newA'), { ownerId: 'companyA' }));
});

test('funcionário não recebe automaticamente os dados integrais da empresa', async () => {
  const employee = env.authenticatedContext('employee', token).firestore();
  await assertFails(getDoc(doc(employee, 'clients/clientA')));
  await assertFails(getDoc(doc(employee, 'clients/clientB')));
  await assertFails(getDoc(doc(employee, 'transactions/transactionA')));
  await assertFails(getDoc(doc(employee, 'professionals/profA')));
  await assertSucceeds(getDoc(doc(employee, 'staff_members/employee')));
  await assertFails(setDoc(doc(employee, 'staff_members/employee'), {companyId:'companyB',active:true}));
  await assertFails(getDoc(doc(employee, 'users/companyA')));
  await assertFails(updateDoc(doc(employee, 'users/employee'), {companyId:'companyB'}));
});

test('cadastro não permite criar perfil administrativo ou mudar empresa', async () => {
  const newUser = env.authenticatedContext('newUser', token).firestore();
  await assertFails(setDoc(doc(newUser, 'users/newUser'), { role: 'admin', companyId: 'newUser' }));
  await assertFails(setDoc(doc(newUser, 'users/newUser'), { role: 'client', companyId: 'companyA' }));
  await assertSucceeds(setDoc(doc(newUser, 'users/newUser'), { role: 'client', companyId: 'newUser' }));
  await assertFails(updateDoc(doc(newUser, 'users/newUser'), { companyId: 'companyA' }));
  await assertFails(updateDoc(doc(a, 'users/companyB'), { role: 'admin' }));
});

test('duas claims administrativas acessam dados globais; flag de perfil não basta', async () => {
  for (const admin of [adminA, adminB]) {
    await assertSucceeds(getDoc(doc(admin, 'clients/clientA')));
    await assertSucceeds(getDoc(doc(admin, 'clients/clientB')));
    await assertSucceeds(getDoc(doc(admin, 'transactions/transactionA')));
  }
  const forged = env.authenticatedContext('fakeAdmin', token).firestore();
  await assertFails(getDoc(doc(forged, 'clients/clientA')));
});

test('visitante e login anônimo não leem dados das empresas', async () => {
  for (const db of [guest, anonymous]) {
    await assertFails(getDoc(doc(db, 'clients/clientA')));
    await assertFails(getDoc(doc(db, 'clients/clientB')));
  }
});

test('vendas de outra empresa e coleções não previstas são negadas', async () => {
  await assertFails(getDoc(doc(b, 'transactions/transactionA')));
  await assertFails(deleteDoc(doc(a, 'transactions/transactionA')));
  await assertFails(getDoc(doc(a, 'unscoped/record')));
  await assertFails(setDoc(doc(a, 'unscoped/record'), { ownerId: 'companyA' }));
});

test('profissionais persistem somente no tenant; ownerId não pode mudar', async () => {
  const employee = env.authenticatedContext('employee', token).firestore();
  await assertSucceeds(getDoc(doc(a, 'professionals/profA')));
  await assertFails(getDoc(doc(employee, 'professionals/profA')));
  await assertFails(getDoc(doc(b, 'professionals/profA')));
  await assertFails(getDoc(doc(a, 'professionals/profB')));
  await assertFails(getDoc(doc(guest, 'professionals/profA')));
  await assertFails(getDoc(doc(anonymous, 'professionals/profA')));
  await assertFails(setDoc(doc(a, 'professionals/forged'), { ownerId: 'companyB', name: 'Forjado' }));
  await assertSucceeds(setDoc(doc(a, 'professionals/newA'), { ownerId: 'companyA', name: 'Novo' }));
  await assertFails(updateDoc(doc(a, 'professionals/profA'), { ownerId: 'companyB' }));
  await assertFails(deleteDoc(doc(b, 'professionals/profA')));
  await assertSucceeds(updateDoc(doc(a, 'professionals/profA'), { name: 'Atualizado' }));
  await assertSucceeds(deleteDoc(doc(a, 'professionals/newA')));
});


test('somente administrador com claim pode vincular ou alterar funcionário', async () => {
  await assertSucceeds(setDoc(doc(adminA, 'staff_members/staff2'), { companyId: 'companyA', role: 'professional', active: true }));
  await assertFails(setDoc(doc(a, 'staff_members/staff3'), { companyId: 'companyA', role: 'professional', active: true }));
  await assertFails(getDoc(doc(b, 'staff_members/employee')));
  await assertFails(getDoc(doc(guest, 'staff_members/employee')));
  await assertSucceeds(getDoc(doc(adminB, 'staff_members/employee')));
});

test('portal pessoal permite somente leitura do funcionário ativo', async () => {
  const employee = env.authenticatedContext('employee', token).firestore();
  await assertSucceeds(getDoc(doc(employee, 'staff_portal/employee/appointments/a1')));
  await assertSucceeds(getDoc(doc(employee, 'staff_portal/employee/commissions/c1')));
  await assertFails(getDoc(doc(employee, 'staff_portal/companyB/appointments/b1')));
  await assertFails(setDoc(doc(employee, 'staff_portal/employee/appointments/forged'), { title: 'Fraude' }));
  await assertFails(updateDoc(doc(employee, 'staff_portal/employee/commissions/c1'), { amount: 999 }));
  await assertFails(getDoc(doc(a, 'staff_portal/employee/appointments/a1')));
  await assertFails(getDoc(doc(guest, 'staff_portal/employee/appointments/a1')));
  await assertFails(getDoc(doc(anonymous, 'staff_portal/employee/appointments/a1')));
  await assertSucceeds(getDoc(doc(adminA, 'staff_portal/employee/appointments/a1')));
  await assertFails(getDoc(doc(employee, 'staff_portal/employee/private/secrets')));
});

test('funcionário inativo perde acesso ao portal', async () => {
  const employee = env.authenticatedContext('employee', token).firestore();
  await assertSucceeds(getDoc(doc(employee, 'staff_portal/employee/appointments/a1')));
  await assertSucceeds(updateDoc(doc(adminA, 'staff_members/employee'), { active: false }));
  await assertFails(getDoc(doc(employee, 'staff_portal/employee/appointments/a1')));
  await assertSucceeds(updateDoc(doc(adminA, 'staff_members/employee'), { active: true }));
});

test('solicitação de convite não concede acesso nem permite convidar empresa alheia', async () => {
  await assertSucceeds(setDoc(doc(a, 'staff_invites/inviteA'), {
    companyId: 'companyA', ownerUid: 'companyA', professionalId: 'profA',
    email: 'funcionario@example.com', status: 'pending', createdAt: '2026-10-22'
  }));
  await assertSucceeds(getDoc(doc(a, 'staff_invites/inviteA')));
  await assertFails(getDoc(doc(b, 'staff_invites/inviteA')));
  await assertFails(setDoc(doc(b, 'staff_invites/forged'), {
    companyId: 'companyA', ownerUid: 'companyA', professionalId: 'profA',
    email: 'atacante@example.com', status: 'pending', createdAt: '2026-10-22'
  }));
  await assertFails(updateDoc(doc(a, 'staff_invites/inviteA'), { status: 'approved' }));
  await assertFails(setDoc(doc(a, 'staff_members/forged'), { companyId: 'companyA', active: true }));
  await assertSucceeds(updateDoc(doc(adminA, 'staff_invites/inviteA'), { status: 'approved' }));
});

test('funcionário aceita convite apenas com e-mail verificado e vinculado', async () => {
  const hire = env.authenticatedContext('newHire', { ...token, email: 'hire@example.com', email_verified: true }).firestore();
  const unverified = env.authenticatedContext('unverified', { ...token, email: 'hire@example.com', email_verified: false }).firestore();
  await assertSucceeds(setDoc(doc(a, 'staff_invites/inviteHire'), {
    companyId: 'companyA', ownerUid: 'companyA', professionalId: 'profA',
    email: 'hire@example.com', status: 'pending', createdAt: '2026-10-22'
  }));
  await assertSucceeds(getDoc(doc(hire, 'staff_invites/inviteHire')));
  await assertFails(getDoc(doc(unverified, 'staff_invites/inviteHire')));
  await assertSucceeds(setDoc(doc(hire, 'users/newHire'), { role: 'client', companyId: 'newHire' }));
  const batch = writeBatch(hire);
  batch.update(doc(hire, 'users/newHire'), {role:'employee', companyId:'companyA', staffInviteId:'inviteHire'});
  batch.set(doc(hire, 'staff_members/newHire'), {
    companyId:'companyA', professionalId:'profA', staffInviteId:'inviteHire',
    email:'hire@example.com', active:true, name:'Novo Funcionário'
  });
  await assertSucceeds(batch.commit());
  await assertSucceeds(getDoc(doc(hire, 'staff_portal/newHire/appointments/personal')));
  await assertFails(getDoc(doc(hire, 'clients/clientA')));
  await assertFails(getDoc(doc(hire, 'clients/clientB')));
  await assertFails(updateDoc(doc(hire, 'staff_members/newHire'), { active: false }));
});

test('convite de outra empresa e cadastro sem email verificado não podem vincular conta', async () => {
  const hire = env.authenticatedContext('otherHire', { ...token, email: 'outsider@example.com', email_verified: true }).firestore();
  await assertSucceeds(setDoc(doc(hire, 'users/otherHire'), { role:'client', companyId:'otherHire' }));
  await assertFails(updateDoc(doc(hire, 'users/otherHire'), {
    role:'employee', companyId:'companyA', staffInviteId:'inviteHire'
  }));
  await assertFails(setDoc(doc(a, 'staff_invites/invalidProfessional'), {
    companyId:'companyA', ownerUid:'companyA', professionalId:'profB',
    email:'outsider@example.com', status:'pending', createdAt:'2026-10-22'
  }));
});

test('dono sincroniza apenas a agenda e comissão de seus funcionários', async () => {
  await assertSucceeds(setDoc(doc(a, 'staff_portal/employee/appointments/real'), {
    companyId: 'companyA', title: 'Serviço real', date: '2026-10-22', time: '14:30', status: 'confirmed'
  }));
  await assertSucceeds(getDoc(doc(a, 'staff_portal/employee/appointments/real')));
  await assertFails(setDoc(doc(b, 'staff_portal/employee/appointments/attack'), {
    companyId: 'companyB', title: 'Não permitido'
  }));
  await assertFails(setDoc(doc(a, 'staff_portal/employee/appointments/hidden'), {
    companyId: 'companyA', title: 'Fraude', customerFullProfile: 'Excesso de informações'
  }));
  await assertSucceeds(updateDoc(doc(a, 'staff_members/employee'), { active: false }));
  const employee = env.authenticatedContext('employee', token).firestore();
  await assertFails(getDoc(doc(employee, 'staff_portal/employee/appointments/real')));
  await assertSucceeds(updateDoc(doc(a, 'staff_members/employee'), { active: true }));
  await assertSucceeds(getDoc(doc(employee, 'staff_portal/employee/appointments/real')));
});
