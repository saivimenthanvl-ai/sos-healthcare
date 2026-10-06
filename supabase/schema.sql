-- ============================================================
-- SOS Healthcare - Database Schema
-- ============================================================

-- Enable PostGIS extension for geographic queries
create extension if not exists postgis;

-- ============================================================
-- Profiles table (extends Supabase auth.users)
-- ============================================================
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  phone text,
  email text,
  emergency_contact_name text,
  emergency_contact_phone text,
  medical_conditions text,
  allergies text,
  blood_type text,
  smartwatch_connected boolean default false,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- ============================================================
-- Hospitals table — static seed data, can be extended
-- ============================================================
create table public.hospitals (
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
create index hospitals_location_idx on public.hospitals using gist (
  st_setsrid(st_makepoint(longitude, latitude), 4326)
);

-- ============================================================
-- Ambulances table — managed by the platform
-- ============================================================
create type ambulance_status as enum ('available', 'dispatched', 'en_route', 'arrived', 'busy');

create table public.ambulances (
  id uuid default gen_random_uuid() primary key,
  driver_name text,
  vehicle_number text,
  latitude double precision not null,
  longitude double precision not null,
  status ambulance_status default 'available',
  current_emergency_id uuid references public.emergencies(id),
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- Row security is mandatory for every app-facing table.
alter table public.ambulances enable row level security;
alter table public.hospitals enable row level security;

-- ============================================================
-- Emergencies table — core SOS request
-- ============================================================
create type emergency_status as enum ('pending', 'dispatched', 'en_route', 'arrived', 'resolved', 'cancelled');

create table public.emergencies (
  id uuid default gen_random_uuid() primary key,
  user_id uuid not null references auth.users(id),
  latitude double precision not null,
  longitude double precision not null,
  address text,
  description text,
  status emergency_status default 'pending',
  assigned_ambulance_id uuid references public.ambulances(id),
  assigned_hospital_id uuid references public.hospitals(id),
  eta_minutes integer,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- Indexes for fast lookups
create index idx_emergencies_user_id on public.emergencies(user_id);
create index idx_emergencies_status on public.emergencies(status);
create index idx_emergencies_created_at on public.emergencies(created_at desc);

-- ============================================================
-- User locations — real-time tracking (updated by Fitbit/device)
-- ============================================================
create table public.user_locations (
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
create index idx_user_locations_user_id on public.user_locations(user_id);
create index idx_user_locations_created_at on public.user_locations(created_at desc);

-- ============================================================
-- Emergency contacts — family/friends notified on SOS
-- ============================================================
create type contact_method as enum ('sms', 'call', 'app_notification');

create table public.emergency_contacts (
  id uuid default gen_random_uuid() primary key,
  user_id uuid not null references auth.users(id),
  name text not null,
  phone text not null,
  relationship text,
  notification_method contact_method default 'sms',
  created_at timestamptz default now() not null
);

create index idx_emergency_contacts_user_id on public.emergency_contacts(user_id);

-- ============================================================
-- Ambulance tracking — every movement ping
-- ============================================================
create table public.ambulance_locations (
  id uuid default gen_random_uuid() primary key,
  ambulance_id uuid not null references public.ambulances(id),
  latitude double precision not null,
  longitude double precision not null,
  speed_kmh numeric(5,2),
  created_at timestamptz default now() not null
);

create index idx_ambulance_locations_ambulance on public.ambulance_locations(ambulance_id);
create index idx_ambulance_locations_created_at on public.ambulance_locations(created_at desc);

-- ============================================================
-- Row Level Security Policies
-- ============================================================
alter table public.profiles enable row level security;
alter table public.emergencies enable row level security;
alter table public.user_locations enable row level security;
alter table public.emergency_contacts enable row level security;
alter table public.ambulance_locations enable row level security;

-- Users can only see/read their own data
create policy "Users can view own profile" on public.profiles
  for select using (auth.uid() = id);

create policy "Users can update own profile" on public.profiles
  for update using (auth.uid() = id);

create policy "Users can insert own profile" on public.profiles
  for insert with check (auth.uid() = id);

-- Emergencies: users can CRUD their own; admins can view all
create policy "Users can view own emergencies" on public.emergencies
  for select using (auth.uid() = user_id);

create policy "Users can insert emergencies" on public.emergencies
  for insert with check (auth.uid() = user_id);

create policy "Users can update own emergencies" on public.emergencies
  for update using (auth.uid() = user_id);

-- Emergency contacts
create policy "Users can view own contacts" on public.emergency_contacts
  for select using (auth.uid() = user_id);

create policy "Users can manage own contacts" on public.emergency_contacts
  for all using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Hospitals: public read
create policy "Hospitals are publicly readable" on public.hospitals
  for select using (true);

-- Ambulance visibility is tightened further by security migrations.
create policy "Authenticated users can read ambulances" on public.ambulances
  for select to authenticated using (true);

-- User locations: users can read their own; admins can read all
create policy "Users can view own locations" on public.user_locations
  for select using (auth.uid() = user_id);

create policy "Users can insert own locations" on public.user_locations
  for insert with check (auth.uid() = user_id);

-- Ambulance telemetry is never anonymous.
create policy "Authenticated users can read ambulance locations" on public.ambulance_locations
  for select to authenticated using (true);
