/** Domain-level permissions only: Firestore rules and backend must reauthorize each request. */
export const TEAM_ROLES = ['owner','manager','reception','professional','viewer'] as const;
export type TeamRole = typeof TEAM_ROLES[number];
export type TeamPermission = 'team.manage'|'team.read'|'schedule.manage'|'schedule.own'|'appointments.manage'|'appointments.own'|'commissions.manage'|'commissions.own'|'inventory.manage'|'inventory.read'|'reports.all'|'reports.own'|'resources.manage'|'resources.book';
const access: Record<TeamRole, ReadonlySet<TeamPermission>> = {
 owner:new Set(['team.manage','team.read','schedule.manage','schedule.own','appointments.manage','appointments.own','commissions.manage','commissions.own','inventory.manage','inventory.read','reports.all','reports.own','resources.manage','resources.book']),
 manager:new Set(['team.read','schedule.manage','schedule.own','appointments.manage','appointments.own','commissions.manage','commissions.own','inventory.manage','inventory.read','reports.all','reports.own','resources.manage','resources.book']),
 reception:new Set(['team.read','appointments.manage','appointments.own','schedule.own','inventory.read','resources.book']),
 professional:new Set(['appointments.own','schedule.own','commissions.own','reports.own','resources.book']),
 viewer:new Set(['team.read','inventory.read'])
};
export interface TeamMember {uid:string;companyId:string;professionalId?:string;role:TeamRole;active:boolean}
export function hasTeamPermission(actor:TeamMember, permission:TeamPermission, target:{companyId:string;uid?:string}):boolean {
 if(!actor.active || !actor.uid || !actor.companyId || actor.companyId!==target.companyId || !access[actor.role]?.has(permission)) return false;
 return !permission.endsWith('.own') || target.uid===actor.uid;
}
export interface TimeRange {start:string;end:string}
export interface TeamShift extends TimeRange {id:string;companyId:string;professionalId:string;kind:'shift'|'time_off'}
export interface ResourceBooking extends TimeRange {id:string;companyId:string;resourceId:string;status:'confirmed'|'cancelled'}
function utc(value:string):number {
 if(!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/.test(value)) throw Error('Expected UTC ISO-8601');
 const n=Date.parse(value);if(!Number.isFinite(n)) throw Error('Invalid timestamp');return n;
}
export function overlaps(a:TimeRange,b:TimeRange):boolean {
 const s1=utc(a.start),e1=utc(a.end),s2=utc(b.start),e2=utc(b.end);
 if(e1<=s1||e2<=s2)throw Error('Invalid time interval');
 return s1<e2 && s2<e1;
}
export function canBookResource(next:ResourceBooking,existing:readonly ResourceBooking[]):boolean {
 if(!next.companyId||!next.resourceId||next.status!=='confirmed')return false;
 return existing.every(item=>item.status==='cancelled'||item.companyId!==next.companyId||item.resourceId!==next.resourceId||!overlaps(item,next));
}
export function copyShiftsNextWeek(shifts:readonly TeamShift[]):TeamShift[] {
 const week=604800000;
 return shifts.map(x=>({...x,id:x.id+'_next_week',start:new Date(utc(x.start)+week).toISOString(),end:new Date(utc(x.end)+week).toISOString()}));
}
