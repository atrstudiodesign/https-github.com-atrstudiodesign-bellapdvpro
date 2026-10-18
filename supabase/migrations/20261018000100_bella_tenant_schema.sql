-- BellaPDV Supabase migration. Apply ONLY to a dedicated BellaPDV project.
-- Existing Firebase/Firestore documents are intentionally not deleted or modified.
create extension if not exists pgcrypto;

create table if not exists public.bella_companies (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 2 and 120),
  niche text not null default 'barbershop',
  status text not null default 'active' check (status in ('active','blocked')),
  created_at timestamptz not null default now()
);

create table if not exists public.bella_memberships (
  user_id uuid not null references auth.users(id) on delete cascade,
  company_id uuid not null references public.bella_companies(id) on delete cascade,
  role text not null default 'staff' check (role in ('owner','manager','staff')),
  created_at timestamptz not null default now(),
  primary key (user_id, company_id)
);

create table if not exists public.bella_clients (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.bella_companies(id) on delete cascade,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create table if not exists public.bella_catalog (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.bella_companies(id) on delete cascade,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create table if not exists public.bella_appointments (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.bella_companies(id) on delete cascade,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create table if not exists public.bella_transactions (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.bella_companies(id) on delete cascade,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create table if not exists public.bella_queue (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.bella_companies(id) on delete cascade,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists bella_memberships_company_idx on public.bella_memberships(company_id);
create index if not exists bella_clients_company_idx on public.bella_clients(company_id);
create index if not exists bella_catalog_company_idx on public.bella_catalog(company_id);
create index if not exists bella_appointments_company_idx on public.bella_appointments(company_id);
create index if not exists bella_transactions_company_idx on public.bella_transactions(company_id);
create index if not exists bella_queue_company_idx on public.bella_queue(company_id);

alter table public.bella_companies enable row level security;
alter table public.bella_memberships enable row level security;
alter table public.bella_clients enable row level security;
alter table public.bella_catalog enable row level security;
alter table public.bella_appointments enable row level security;
alter table public.bella_transactions enable row level security;
alter table public.bella_queue enable row level security;

-- Membership rows may be viewed by their owners but never self-created/elevated.
create policy bella_memberships_own_read on public.bella_memberships
  for select to authenticated using (user_id = (select auth.uid()));

-- Company visibility is constrained by validated membership; no public access.
create policy bella_companies_member_read on public.bella_companies
  for select to authenticated using (
    exists (select 1 from public.bella_memberships m where m.company_id = id and m.user_id = (select auth.uid()))
  );

-- No client-side company/membership creation; provision via trusted backend service role.
-- Each business row is restricted to a matching membership, not user metadata or JWT claims.
create policy bella_clients_member_select on public.bella_clients for select to authenticated using
  (exists (select 1 from public.bella_memberships m where m.company_id = bella_clients.company_id and m.user_id = (select auth.uid())));
create policy bella_clients_member_insert on public.bella_clients for insert to authenticated with check
  (exists (select 1 from public.bella_memberships m where m.company_id = bella_clients.company_id and m.user_id = (select auth.uid())));
create policy bella_clients_member_update on public.bella_clients for update to authenticated using
  (exists (select 1 from public.bella_memberships m where m.company_id = bella_clients.company_id and m.user_id = (select auth.uid())))
  with check (exists (select 1 from public.bella_memberships m where m.company_id = bella_clients.company_id and m.user_id = (select auth.uid())));
create policy bella_clients_member_delete on public.bella_clients for delete to authenticated using
  (exists (select 1 from public.bella_memberships m where m.company_id = bella_clients.company_id and m.user_id = (select auth.uid())));

create policy bella_catalog_member_all on public.bella_catalog for all to authenticated
  using (exists (select 1 from public.bella_memberships m where m.company_id = bella_catalog.company_id and m.user_id = (select auth.uid())))
  with check (exists (select 1 from public.bella_memberships m where m.company_id = bella_catalog.company_id and m.user_id = (select auth.uid())));
create policy bella_appointments_member_all on public.bella_appointments for all to authenticated
  using (exists (select 1 from public.bella_memberships m where m.company_id = bella_appointments.company_id and m.user_id = (select auth.uid())))
  with check (exists (select 1 from public.bella_memberships m where m.company_id = bella_appointments.company_id and m.user_id = (select auth.uid())));
create policy bella_transactions_member_all on public.bella_transactions for all to authenticated
  using (exists (select 1 from public.bella_memberships m where m.company_id = bella_transactions.company_id and m.user_id = (select auth.uid())))
  with check (exists (select 1 from public.bella_memberships m where m.company_id = bella_transactions.company_id and m.user_id = (select auth.uid())));
create policy bella_queue_member_all on public.bella_queue for all to authenticated
  using (exists (select 1 from public.bella_memberships m where m.company_id = bella_queue.company_id and m.user_id = (select auth.uid())))
  with check (exists (select 1 from public.bella_memberships m where m.company_id = bella_queue.company_id and m.user_id = (select auth.uid())));

revoke all on public.bella_companies, public.bella_memberships, public.bella_clients,
  public.bella_catalog, public.bella_appointments, public.bella_transactions, public.bella_queue from anon;
grant select on public.bella_companies, public.bella_memberships to authenticated;
grant select, insert, update, delete on public.bella_clients, public.bella_catalog,
  public.bella_appointments, public.bella_transactions, public.bella_queue to authenticated;
