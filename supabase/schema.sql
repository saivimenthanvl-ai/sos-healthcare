-- ============================================================
-- SOS Healthcare - Database Schema (Idempotent & Production-Safe)
-- ============================================================

-- Enable PostGIS extension for geographic queries
create extension if not exists postgis;

-- ============================================================
-- Profiles table (extends Supabase auth.users)
-- ============================================================
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

-- ============================================================
-- Hospitals table — static seed data, can be extended
-- ============================================================
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

-- Index for geospatial proximity search
create index if not exists hospitals_location_idx on public.hospitals using gist (
  st_setsrid(st_makepoint(longitude, latitude), 4326)
);

-- ============================================================
-- Ambulances table — managed by the platform
-- ============================================================
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
  current_emergency_id uuid, -- deferred FK: added via ALTER TABLE after public.emergencies is created
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- ============================================================
-- Emergencies table — core SOS request
-- ============================================================
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

-- Indexes for fast lookups
create index if not exists idx_emergencies_user_id on public.emergencies(user_id);
create index if not exists idx_emergencies_status on public.emergencies(status);
create index if not exists idx_emergencies_created_at on public.emergencies(created_at desc);

-- Deferred foreign key: link ambulances.current_emergency_id now that emergencies exists
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

-- ============================================================
-- User locations — real-time tracking (updated by Fitbit/device)
-- ============================================================
create table if not exists public.user_locations (
  id uuid default gen_random_uuid() primary key,
  user_id uuid not null references auth.users(id),
  latitude double precision not null,
  longitude double precision not null,
  heart_rate integer,
  steps integer,
  source text default 'browser', -- 'browser' | 'fitbit' | 'apple_health' | 'google_fit'
  created_at timestamptz default now() not null
);

-- Keep only the last 1000 location entries per user for performance
create index if not exists idx_user_locations_user_id on public.user_locations(user_id);
create index if not exists idx_user_locations_created_at on public.user_locations(created_at desc);

-- ============================================================
-- Emergency contacts — family/friends notified on SOS
-- ============================================================
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

-- ============================================================
-- Ambulance tracking — every movement ping
-- ============================================================
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

-- ============================================================
-- Preserve & Record Existing Production OAuth State Table
-- ============================================================
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

-- ============================================================
-- Enable Row Level Security on All Base Tables
-- ============================================================
alter table public.profiles enable row level security;
alter table public.hospitals enable row level security;
alter table public.ambulances enable row level security;
alter table public.emergencies enable row level security;
alter table public.user_locations enable row level security;
alter table public.emergency_contacts enable row level security;
alter table public.ambulance_locations enable row level security;
alter table public.oauth_states enable row level security;

-- ============================================================
-- Row Level Security Policies (Valid PostgreSQL Syntax)
-- ============================================================
-- Users can only see/read their own data
drop policy if exists "Users can view own profile" on public.profiles;
create policy "Users can view own profile" on public.profiles
  for select using (auth.uid() = id);

drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile" on public.profiles
  for update using (auth.uid() = id)
  with check (auth.uid() = id);

drop policy if exists "Users can insert own profile" on public.profiles;
create policy "Users can insert own profile" on public.profiles
  for insert with check (auth.uid() = id);

-- Emergencies: users can CRUD their own; staff policies refined in 001/003
drop policy if exists "Users can view own emergencies" on public.emergencies;
create policy "Users can view own emergencies" on public.emergencies
  for select using (auth.uid() = user_id);

drop policy if exists "Users can insert emergencies" on public.emergencies;
create policy "Users can insert emergencies" on public.emergencies
  for insert with check (auth.uid() = user_id);

drop policy if exists "Users can update own emergencies" on public.emergencies;
create policy "Users can update own emergencies" on public.emergencies
  for update using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Emergency contacts: separate valid PostgreSQL policies for SELECT, INSERT, UPDATE, DELETE
drop policy if exists "Users can CRUD own contacts" on public.emergency_contacts;
drop policy if exists "Users can view own contacts" on public.emergency_contacts;
create policy "Users can view own contacts" on public.emergency_contacts
  for select using (auth.uid() = user_id);

drop policy if exists "Users can insert own contacts" on public.emergency_contacts;
create policy "Users can insert own contacts" on public.emergency_contacts
  for insert with check (auth.uid() = user_id);

drop policy if exists "Users can update own contacts" on public.emergency_contacts;
create policy "Users can update own contacts" on public.emergency_contacts
  for update using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete own contacts" on public.emergency_contacts;
create policy "Users can delete own contacts" on public.emergency_contacts
  for delete using (auth.uid() = user_id);

-- Hospitals: public read
drop policy if exists "Hospitals are publicly readable" on public.hospitals;
create policy "Hospitals are publicly readable" on public.hospitals
  for select using (true);

-- Ambulances: initial read policy (refined in 003)
drop policy if exists "Everyone can read ambulances" on public.ambulances;
create policy "Everyone can read ambulances" on public.ambulances
  for select using (true);

-- User locations: users can read and insert their own
drop policy if exists "Users can view own locations" on public.user_locations;
create policy "Users can view own locations" on public.user_locations
  for select using (auth.uid() = user_id);

drop policy if exists "Users can insert own locations" on public.user_locations;
create policy "Users can insert own locations" on public.user_locations
  for insert with check (auth.uid() = user_id);

-- Ambulance locations: initial read policy (refined in 003)
drop policy if exists "Ambulance locations are publicly readable" on public.ambulance_locations;
create policy "Ambulance locations are publicly readable" on public.ambulance_locations
  for select using (true);

-- OAuth states: users manage only their own OAuth state nonces
drop policy if exists "Users can view own oauth states" on public.oauth_states;
create policy "Users can view own oauth states" on public.oauth_states
  for select to authenticated using (auth.uid() = user_id);

drop policy if exists "Users can insert own oauth states" on public.oauth_states;
create policy "Users can insert own oauth states" on public.oauth_states
  for insert to authenticated with check (auth.uid() = user_id);

drop policy if exists "Users can delete own oauth states" on public.oauth_states;
create policy "Users can delete own oauth states" on public.oauth_states
  for delete to authenticated using (auth.uid() = user_id);

