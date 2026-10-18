-- Read-only Supabase BellaPDV migration audit. Run only on the dedicated Bella project.
select c.relname as table_name, c.relrowsecurity as rls_enabled, c.relforcerowsecurity as rls_forced
from pg_class c join pg_namespace n on n.oid=c.relnamespace
where n.nspname='public' and c.relname like 'bella_%' and c.relkind='r' order by c.relname;

select tablename, policyname, roles, cmd, qual, with_check
from pg_policies where schemaname='public' and tablename like 'bella_%'
order by tablename, policyname;

select 'bella_companies' as entity, count(*) from public.bella_companies
union all select 'bella_memberships', count(*) from public.bella_memberships
union all select 'bella_clients', count(*) from public.bella_clients
union all select 'bella_catalog', count(*) from public.bella_catalog
union all select 'bella_appointments', count(*) from public.bella_appointments
union all select 'bella_transactions', count(*) from public.bella_transactions
union all select 'bella_queue', count(*) from public.bella_queue;
