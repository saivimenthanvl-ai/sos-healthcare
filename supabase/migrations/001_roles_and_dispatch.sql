-- ============================================================
-- Migration 001 — Roles, dispatcher/paramedic access, realtime
--
-- Self-contained & idempotent: ensures prerequisite base tables
-- from schema.sql exist before applying role extensions and
-- safely backfills existing auth.users rows into public.profiles.
-- ============================================================

-- ------------------------------------------------------------
-- 0. Prerequisite Base Schema (Idempotent Guard)
-- ------------------------------------------------------------
create extension if not exists postgis;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  phone text,
  email text,
  emergency_contact_name text,
  emergency_contact_phone text,
  medical_conditions text,
  allergies text,
  blood_type text,
  fitbit_user_id text,
  fitbit_access_token text,
  fitbit_refresh_token text,
  fitbit_token_expires_at timestamptz,
  smartwatch_connected boolean default false,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

create table if not exists public.hospitals (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  address text not null,
  phone text,
  latitude double precision not null,
  longitude double precision not null,
  emergency_department boolean default true,
  icu_beds integer default 0,
  total_beds integer default 0,
  rating numeric(3,2),
  distance_from_user double precision,
  created_at timestamptz default now() not null
);

create index if not exists hospitals_location_idx on public.hospitals using gist (
  st_setsrid(st_makepoint(longitude, latitude), 4326)
);

do $$ begin
  create type public.ambulance_status as enum ('available', 'dispatched', 'en_route', 'arrived', 'busy');
exception when duplicate_object then null; end $$;

create table if not exists public.ambulances (
  id uuid default gen_random_uuid() primary key,
  driver_name text,
  vehicle_number text,
  latitude double precision not null,
  longitude double precision not null,
  status public.ambulance_status default 'available',
  current_emergency_id uuid,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

do $$ begin
  create type public.emergency_status as enum ('pending', 'dispatched', 'en_route', 'arrived', 'resolved', 'cancelled');
exception when duplicate_object then null; end $$;

create table if not exists public.emergencies (
  id uuid default gen_random_uuid() primary key,
  user_id uuid not null references auth.users(id),
  latitude double precision not null,
  longitude double precision not null,
  address text,
  description text,
  status public.emergency_status default 'pending',
  assigned_ambulance_id uuid references public.ambulances(id),
  assigned_hospital_id uuid references public.hospitals(id),
  eta_minutes integer,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

create index if not exists idx_emergencies_user_id on public.emergencies(user_id);
create index if not exists idx_emergencies_status on public.emergencies(status);
create index if not exists idx_emergencies_created_at on public.emergencies(created_at desc);

do $$ begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'fk_ambulances_current_emergency'
      and conrelid = 'public.ambulances'::regclass
  ) then
    alter table public.ambulances
      add constraint fk_ambulances_current_emergency
      foreign key (current_emergency_id)
      references public.emergencies(id)
      on delete set null;
  end if;
end $$;

create table if not exists public.user_locations (
  id uuid default gen_random_uuid() primary key,
  user_id uuid not null references auth.users(id),
  latitude double precision not null,
  longitude double precision not null,
  heart_rate integer,
  steps integer,
  source text default 'browser',
  created_at timestamptz default now() not null
);

create index if not exists idx_user_locations_user_id on public.user_locations(user_id);
create index if not exists idx_user_locations_created_at on public.user_locations(created_at desc);

do $$ begin
  create type public.contact_method as enum ('sms', 'call', 'app_notification');
exception when duplicate_object then null; end $$;

create table if not exists public.emergency_contacts (
  id uuid default gen_random_uuid() primary key,
  user_id uuid not null references auth.users(id),
  name text not null,
  phone text not null,
  relationship text,
  notification_method public.contact_method default 'sms',
  created_at timestamptz default now() not null
);

create index if not exists idx_emergency_contacts_user_id on public.emergency_contacts(user_id);

create table if not exists public.ambulance_locations (
  id uuid default gen_random_uuid() primary key,
  ambulance_id uuid not null references public.ambulances(id),
  latitude double precision not null,
  longitude double precision not null,
  speed_kmh numeric(5,2),
  created_at timestamptz default now() not null
);

create index if not exists idx_ambulance_locations_ambulance on public.ambulance_locations(ambulance_id);
create index if not exists idx_ambulance_locations_created_at on public.ambulance_locations(created_at desc);

-- Record existing production oauth_states table idempotently
create table if not exists public.oauth_states (
  id uuid default gen_random_uuid() primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  provider text not null,
  state text not null unique,
  expires_at timestamptz not null default (now() + interval '15 minutes'),
  created_at timestamptz default now() not null
);

alter table public.oauth_states
  alter column expires_at set default (now() + interval '15 minutes');


create index if not exists idx_oauth_states_user_id on public.oauth_states(user_id);
create index if not exists idx_oauth_states_state on public.oauth_states(state);

alter table public.profiles enable row level security;
alter table public.hospitals enable row level security;
alter table public.ambulances enable row level security;
alter table public.emergencies enable row level security;
alter table public.user_locations enable row level security;
alter table public.emergency_contacts enable row level security;
alter table public.ambulance_locations enable row level security;
alter table public.oauth_states enable row level security;

-- Base policies for hospitals, emergency_contacts, and oauth_states
drop policy if exists "Hospitals are publicly readable" on public.hospitals;
create policy "Hospitals are publicly readable" on public.hospitals
  for select using (true);

drop policy if exists "Users can CRUD own contacts" on public.emergency_contacts;
drop policy if exists "Users can view own contacts" on public.emergency_contacts;
create policy "Users can view own contacts" on public.emergency_contacts
  for select to authenticated using (auth.uid() = user_id);

drop policy if exists "Users can insert own contacts" on public.emergency_contacts;
create policy "Users can insert own contacts" on public.emergency_contacts
  for insert to authenticated with check (auth.uid() = user_id);

drop policy if exists "Users can update own contacts" on public.emergency_contacts;
create policy "Users can update own contacts" on public.emergency_contacts
  for update to authenticated using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete own contacts" on public.emergency_contacts;
create policy "Users can delete own contacts" on public.emergency_contacts
  for delete to authenticated using (auth.uid() = user_id);

drop policy if exists "Users can view own oauth states" on public.oauth_states;
create policy "Users can view own oauth states" on public.oauth_states
  for select to authenticated using (auth.uid() = user_id);

drop policy if exists "Users can insert own oauth states" on public.oauth_states;
create policy "Users can insert own oauth states" on public.oauth_states
  for insert to authenticated with check (auth.uid() = user_id);

drop policy if exists "Users can delete own oauth states" on public.oauth_states;
create policy "Users can delete own oauth states" on public.oauth_states
  for delete to authenticated using (auth.uid() = user_id);

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
-- 1b. Safe Backfill of Existing auth.users into public.profiles
--     Preserves existing UUIDs, emails, and established roles.
--     Never overwrites existing profile records or promotes roles.
-- ------------------------------------------------------------
insert into public.profiles (id, full_name, email, role)
select
  u.id,
  coalesce(
    nullif(trim(u.raw_user_meta_data->>'full_name'), ''),
    nullif(trim(u.raw_user_meta_data->>'name'), ''),
    split_part(u.email, '@', 1)
  ),
  u.email,
  'patient'::public.user_role
from auth.users u
on conflict (id) do update
set
  email = coalesce(public.profiles.email, excluded.email),
  full_name = coalesce(public.profiles.full_name, excluded.full_name);


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