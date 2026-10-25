import { test } from 'node:test';
import assert from 'node:assert/strict';
import { hasTeamPermission, overlaps, canBookResource, copyShiftsNextWeek } from '../src/lib/teamManagement.ts';
const owner = {uid:'ownerA',companyId:'A',role:'owner' as const,active:true};
const worker = {uid:'staffA',companyId:'A',role:'professional' as const,active:true};
test('five-level RBAC denies cross-company access and inactive staff', () => {
 assert.equal(hasTeamPermission(owner,'team.manage',{companyId:'A'}),true);
 assert.equal(hasTeamPermission(owner,'team.manage',{companyId:'B'}),false);
 assert.equal(hasTeamPermission(worker,'appointments.own',{companyId:'A',uid:'staffA'}),true);
 assert.equal(hasTeamPermission(worker,'appointments.own',{companyId:'A',uid:'staffB'}),false);
 assert.equal(hasTeamPermission({...worker,active:false},'appointments.own',{companyId:'A',uid:'staffA'}),false);
 assert.equal(hasTeamPermission({...worker,role:'viewer'},'commissions.own',{companyId:'A',uid:'staffA'}),false);
});
test('adjacent bookings are permitted; overlapping bookings denied', () => {
 const range = {start:'2026-10-26T13:00:00Z',end:'2026-10-26T14:00:00Z'};
 assert.equal(overlaps(range,{start:'2026-10-26T14:00:00Z',end:'2026-10-26T15:00:00Z'}),false);
 const first = {id:'r1',companyId:'A',resourceId:'room1',status:'confirmed' as const,...range};
 assert.equal(canBookResource({...first,id:'r2',start:'2026-10-26T13:30:00Z'},[first]),false);
 assert.equal(canBookResource({...first,id:'r3',resourceId:'room2'},[first]),true);
 assert.equal(canBookResource({...first,id:'r4',companyId:'B'},[first]),true);
});
test('shift copying preserves company, employee and one-week offset', () => {
 const shifts = [{id:'s1',companyId:'A',professionalId:'p1',kind:'shift' as const,start:'2026-10-26T13:00:00Z',end:'2026-10-26T21:00:00Z'}];
 const result = copyShiftsNextWeek(shifts);
 assert.equal(result[0].start,'2026-11-02T13:00:00.000Z');
 assert.equal(result[0].companyId,'A');
 assert.equal(shifts[0].start,'2026-10-26T13:00:00Z');
});
