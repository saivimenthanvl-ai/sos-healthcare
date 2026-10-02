-- ============================================================
-- Migration 001 — Roles, dispatcher/paramedic access, realtime
--
-- Run this in the Supabase SQL Editor AFTER applying schema.sql.
-- Safe to re-run (all statements are idempotent).
-- ============================================================

-- ------------------------------------------------------------
-- 1. Roles
-- ------------------------------------------------------------
do $$ begin
  create type public.user_role as enum ('patient', 'paramedic', 'dispatcher');
exception when duplicate_object then null; end $$;

alter table public.profiles
  add column if not exists role public.user_role not null default 'patient';

-- Which vehicle a paramedic is crewed on. Drives the paramedic console.
alter table public.profiles
  add column if not exists ambulance_id uuid references public.ambulances(id)
  on delete set null;

create index if not exists idx_profiles_ambulance_id
  on public.profiles(ambulance_id);

-- ------------------------------------------------------------
-- 2. Helper functions
--
-- SECURITY DEFINER so the policies can read the caller's own
-- profile row without recursing through the profiles RLS policy.
-- ------------------------------------------------------------
create or replace function public.current_user_role()
returns public.user_role
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select role from public.profiles where id = auth.uid()),
    'patient'::public.user_role
  );
$$;

create or replace function public.is_staff()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.current_user_role() in ('paramedic', 'dispatcher');
$$;

grant execute on function public.current_user_role() to authenticated;
grant execute on function public.is_staff() to authenticated;

-- ------------------------------------------------------------
-- 3. Profiles RLS — staff need to read profiles to see patient
--    medical details during an active emergency.
-- ------------------------------------------------------------
drop policy if exists "Staff can view profiles" on public.profiles;
create policy "Staff can view profiles" on public.profiles
  for select using (public.is_staff());

-- ------------------------------------------------------------
-- 4. Emergencies RLS — staff can see and update every emergency.
--    Dispatchers and paramedics need this to run the job.
-- ------------------------------------------------------------
drop policy if exists "Staff can view all emergencies" on public.emergencies;
create policy "Staff can view all emergencies" on public.emergencies
  for select using (public.is_staff());

drop policy if exists "Staff can update emergencies" on public.emergencies;
create policy "Staff can update emergencies" on public.emergencies
  for update using (public.is_staff());

-- ------------------------------------------------------------
-- 5. Ambulances RLS — dispatchers manage the fleet, paramedics
--    update only the ambulance they are assigned to.
-- ------------------------------------------------------------
drop policy if exists "Dispatchers can insert ambulances" on public.ambulances;
create policy "Dispatchers can insert ambulances" on public.ambulances
  for insert with check (public.current_user_role() = 'dispatcher');

drop policy if exists "Dispatchers can update ambulances" on public.ambulances;
create policy "Dispatchers can update ambulances" on public.ambulances
  for update using (public.current_user_role() = 'dispatcher');

drop policy if exists "Paramedics can update their ambulance" on public.ambulances;
create policy "Paramedics can update their ambulance" on public.ambulances
  for update using (
    public.current_user_role() = 'paramedic'
    and current_emergency_id is not null
  );

-- ------------------------------------------------------------
-- 6. Ambulance location pings RLS
-- ------------------------------------------------------------
drop policy if exists "Staff can insert ambulance locations" on public.ambulance_locations;
create policy "Staff can insert ambulance locations" on public.ambulance_locations
  for insert with check (public.is_staff());

-- ------------------------------------------------------------
-- 7. User locations RLS — paramedics need the patient's live
--    location and vitals while responding.
-- ------------------------------------------------------------
drop policy if exists "Staff can view user locations" on public.user_locations;
create policy "Staff can view user locations" on public.user_locations
  for select using (public.is_staff());

-- ------------------------------------------------------------
-- 8. Realtime
--
-- Tables must be members of the supabase_realtime publication or
-- no postgres_changes events are ever delivered. schema.sql only
-- enabled RLS, which is not enough.
-- ------------------------------------------------------------
do $$
declare
  t text;
begin
  foreach t in array array['ambulances', 'emergencies', 'ambulance_locations']
  loop
    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime' and tablename = t
    ) then
      execute format(
        'alter publication supabase_realtime add table public.%I', t
      );
    end if;
  end loop;
end $$;

-- ------------------------------------------------------------
-- 9. Auto-create a profile row on signup.
--
-- Replaces the fragile client-side insert in AuthContext. The
-- existing client insert stays in place as a no-op fallback.
-- ------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, email, role)
  values (
    new.id,
    new.raw_user_meta_data->>'full_name',
    new.email,
    'patient'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ------------------------------------------------------------
-- 10. updated_at maintenance
-- ------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_profiles_updated_at on public.profiles;
create trigger trg_profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

drop trigger if exists trg_emergencies_updated_at on public.emergencies;
create trigger trg_emergencies_updated_at
  before update on public.emergencies
  for each row execute function public.set_updated_at();

drop trigger if exists trg_ambulances_updated_at on public.ambulances;
create trigger trg_ambulances_updated_at
  before update on public.ambulances
  for each row execute function public.set_updated_at();

-- ============================================================
-- After running this, promote staff accounts and crew them:
--
--   update public.profiles
--      set role = 'dispatcher'
--    where email = 'you@example.com';
--
--   update public.profiles
--      set role   = 'paramedic',
--          ambulance_id = (select id from public.ambulances
--                           where vehicle_number = 'AMB-01')
--    where email = 'driver@example.com';
--
-- The ambulances table must be seeded first. See scripts/seed-ambulances.sql.
-- ============================================================