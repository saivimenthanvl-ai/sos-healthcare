
-- FILE: supabase/schema.sql
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
  current_emergency_id uuid, -- deferred FK: added via ALTER TABLE after public.emergencies is created
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- Stream realtime updates
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

-- Deferred foreign key: link ambulances.current_emergency_id now that emergencies exists
alter table public.ambulances
  add constraint fk_ambulances_current_emergency
  foreign key (current_emergency_id)
  references public.emergencies(id)
  on delete set null;

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

create policy "Users can CRUD own contacts" on public.emergency_contacts
  for insert, update, delete using (auth.uid() = user_id);

-- Hospitals: public read
create policy "Hospitals are publicly readable" on public.hospitals
  for select using (true);

-- Ambulances: dispatchers can update; users can read
-- (In a real app, you'd have a 'role' column)
create policy "Everyone can read ambulances" on public.ambulances
  for select using (true);

-- User locations: users can read their own; admins can read all
create policy "Users can view own locations" on public.user_locations
  for select using (auth.uid() = user_id);

create policy "Users can insert own locations" on public.user_locations
  for insert with check (auth.uid() = user_id);

-- Ambulance locations: public read
create policy "Ambulance locations are publicly readable" on public.ambulance_locations
  for select using (true);


-- FILE: supabase/migrations/001_roles_and_dispatch.sql
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

-- FILE: supabase/migrations/002_rbac_appointments_health.sql
-- ============================================================
-- Migration 002: RBAC (PATIENT, DOCTOR, ADMIN), Appointments,
-- Health Records, Profiles, and Clinical Security
-- ============================================================

-- 1. Extend or create UserRole enum to strictly support PATIENT, DOCTOR, ADMIN
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'app_role') THEN
    CREATE TYPE public.app_role AS ENUM ('PATIENT', 'DOCTOR', 'ADMIN');
  END IF;
END $$;

-- Add role column to profiles if not present or migrate existing enum
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS role_v2 public.app_role DEFAULT 'PATIENT';

-- Map legacy roles if needed
UPDATE public.profiles
SET role_v2 = CASE
  WHEN role::text IN ('paramedic', 'dispatcher') THEN 'ADMIN'::public.app_role
  ELSE 'PATIENT'::public.app_role
END
WHERE role_v2 IS NULL;

-- 2. Patient Profiles (Role Extension)
CREATE TABLE IF NOT EXISTS public.patient_profiles (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  date_of_birth DATE,
  gender TEXT,
  height_cm NUMERIC(5,2),
  weight_kg NUMERIC(5,2),
  blood_group TEXT,
  address TEXT,
  emergency_contact_name TEXT,
  emergency_contact_relationship TEXT,
  emergency_contact_phone TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 3. Doctor Profiles (Role Extension)
CREATE TABLE IF NOT EXISTS public.doctor_profiles (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  registration_number TEXT,
  specialization TEXT NOT NULL DEFAULT 'General Medicine',
  qualifications TEXT,
  experience_years INTEGER DEFAULT 0,
  hospital_id UUID REFERENCES public.hospitals(id) ON DELETE SET NULL,
  hospital_name TEXT,
  department TEXT DEFAULT 'Emergency & Outpatient',
  consultation_hours TEXT DEFAULT '09:00 - 17:00',
  verification_status TEXT DEFAULT 'PENDING', -- PENDING, VERIFIED, SUSPENDED
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 4. Admin Profiles (Role Extension)
CREATE TABLE IF NOT EXISTS public.admin_profiles (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  job_title TEXT DEFAULT 'Operations Administrator',
  permission_level TEXT DEFAULT 'STANDARD', -- STANDARD, SUPERADMIN
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 5. Doctor Availability
CREATE TABLE IF NOT EXISTS public.doctor_availability (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  doctor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6), -- 0=Sun, 6=Sat
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  slot_duration_minutes INTEGER DEFAULT 30,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 6. Appointment Status Enum & Appointments Table
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'appointment_status') THEN
    CREATE TYPE public.appointment_status AS ENUM (
      'PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED', 'NO_SHOW', 'REJECTED'
    );
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.appointments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  doctor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  hospital_id UUID REFERENCES public.hospitals(id) ON DELETE SET NULL,
  hospital_name TEXT,
  specialty TEXT NOT NULL,
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ NOT NULL,
  reason TEXT,
  status public.appointment_status NOT NULL DEFAULT 'CONFIRMED',
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  -- Double booking constraint: prevent duplicate non-cancelled appointment for same doctor at identical time slot
  CONSTRAINT no_double_booking UNIQUE (doctor_id, starts_at)
);

CREATE INDEX IF NOT EXISTS idx_appointments_patient_id ON public.appointments(patient_id);
CREATE INDEX IF NOT EXISTS idx_appointments_doctor_id ON public.appointments(doctor_id);
CREATE INDEX IF NOT EXISTS idx_appointments_starts_at ON public.appointments(starts_at);

-- 7. Health Records (Vital signs & Clinical metrics)
CREATE TABLE IF NOT EXISTS public.health_records (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  systolic_bp INTEGER,
  diastolic_bp INTEGER,
  heart_rate INTEGER,
  oxygen_saturation INTEGER,
  body_temperature NUMERIC(4,1),
  blood_group TEXT,
  allergies TEXT,
  medical_conditions TEXT,
  current_medications TEXT,
  previous_conditions TEXT,
  additional_notes TEXT,
  source TEXT DEFAULT 'PATIENT_ENTERED', -- PATIENT_ENTERED, DEVICE, CLINICIAN
  recorded_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_health_records_patient_id ON public.health_records(patient_id);

-- 8. Device Connections (Smartwatches)
CREATE TABLE IF NOT EXISTS public.device_connections (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider TEXT NOT NULL, -- 'fitbit', 'apple_health', 'wear_os'
  connection_status TEXT NOT NULL DEFAULT 'DISCONNECTED', -- CONNECTED, DISCONNECTED, PENDING_AUTH
  last_synced_at TIMESTAMPTZ,
  metrics JSONB DEFAULT '[]'::jsonb,
  permissions JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  CONSTRAINT unique_user_provider UNIQUE (user_id, provider)
);

-- 9. Health Sharing Permissions (Doctor-Patient consent)
CREATE TABLE IF NOT EXISTS public.health_sharing_permissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  doctor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  scope TEXT DEFAULT 'FULL', -- FULL, EMERGENCY_ONLY, VITALS_ONLY
  status TEXT DEFAULT 'ACTIVE', -- ACTIVE, REVOKED, EXPIRED
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  CONSTRAINT unique_patient_doctor_share UNIQUE (patient_id, doctor_id)
);

-- 10. Audit Logs
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  actor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ============================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================

ALTER TABLE public.patient_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.doctor_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.doctor_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.health_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.device_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.health_sharing_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Helper to check caller role
CREATE OR REPLACE FUNCTION public.get_current_role()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT coalesce(
    (SELECT role_v2::text FROM public.profiles WHERE id = auth.uid()),
    'PATIENT'
  );
$$;

-- Patient Profiles: Patients can CRUD their own; Doctors can view if authorized or active appointment exists
DROP POLICY IF EXISTS "Patients manage own profile" ON public.patient_profiles;
CREATE POLICY "Patients manage own profile" ON public.patient_profiles
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Doctors view assigned patient profile" ON public.patient_profiles;
CREATE POLICY "Doctors view assigned patient profile" ON public.patient_profiles
  FOR SELECT USING (
    public.get_current_role() = 'DOCTOR' AND EXISTS (
      SELECT 1 FROM public.appointments a
      WHERE a.patient_id = patient_profiles.user_id AND a.doctor_id = auth.uid()
    )
  );

-- Doctor Profiles: Public read, doctors edit their own
DROP POLICY IF EXISTS "Doctor profiles readable by authenticated" ON public.doctor_profiles;
CREATE POLICY "Doctor profiles readable by authenticated" ON public.doctor_profiles
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Doctors update own doctor profile" ON public.doctor_profiles;
CREATE POLICY "Doctors update own doctor profile" ON public.doctor_profiles
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Appointments RLS:
-- Patients see and manage own appointments
DROP POLICY IF EXISTS "Patients see own appointments" ON public.appointments;
CREATE POLICY "Patients see own appointments" ON public.appointments
  FOR SELECT USING (auth.uid() = patient_id);

DROP POLICY IF EXISTS "Patients book own appointments" ON public.appointments;
CREATE POLICY "Patients book own appointments" ON public.appointments
  FOR INSERT WITH CHECK (auth.uid() = patient_id);

DROP POLICY IF EXISTS "Patients update own appointments" ON public.appointments;
CREATE POLICY "Patients update own appointments" ON public.appointments
  FOR UPDATE USING (auth.uid() = patient_id);

-- Doctors see assigned appointments
DROP POLICY IF EXISTS "Doctors see assigned appointments" ON public.appointments;
CREATE POLICY "Doctors see assigned appointments" ON public.appointments
  FOR SELECT USING (auth.uid() = doctor_id);

DROP POLICY IF EXISTS "Doctors update assigned appointments" ON public.appointments;
CREATE POLICY "Doctors update assigned appointments" ON public.appointments
  FOR UPDATE USING (auth.uid() = doctor_id);

-- Admins see all appointments
DROP POLICY IF EXISTS "Admins view all appointments" ON public.appointments;
CREATE POLICY "Admins view all appointments" ON public.appointments
  FOR ALL USING (public.get_current_role() = 'ADMIN');

-- Health Records:
-- Patient can manage own records
DROP POLICY IF EXISTS "Patients manage own health records" ON public.health_records;
CREATE POLICY "Patients manage own health records" ON public.health_records
  FOR ALL USING (auth.uid() = patient_id)
  WITH CHECK (auth.uid() = patient_id);

-- Doctor can view health records only with appointment/consent relationship
DROP POLICY IF EXISTS "Doctors view authorized health records" ON public.health_records;
CREATE POLICY "Doctors view authorized health records" ON public.health_records
  FOR SELECT USING (
    public.get_current_role() = 'DOCTOR' AND (
      EXISTS (
        SELECT 1 FROM public.appointments a
        WHERE a.patient_id = health_records.patient_id AND a.doctor_id = auth.uid()
      ) OR EXISTS (
        SELECT 1 FROM public.health_sharing_permissions p
        WHERE p.patient_id = health_records.patient_id AND p.doctor_id = auth.uid() AND p.status = 'ACTIVE'
      )
    )
  );

-- Devices:
DROP POLICY IF EXISTS "Users manage own devices" ON public.device_connections;
CREATE POLICY "Users manage own devices" ON public.device_connections
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);


-- FILE: supabase/migrations/003_security_hardening.sql
-- ============================================================
-- Migration 003 — Security hardening
-- Fixes RLS coverage, role separation, emergency integrity,
-- wearable credential exposure, and operational data access.
-- ============================================================

-- 1. Ensure RLS is actually enabled on every patient/operational table.
alter table public.profiles enable row level security;
alter table public.emergencies enable row level security;
alter table public.user_locations enable row level security;
alter table public.emergency_contacts enable row level security;
alter table public.ambulance_locations enable row level security;
alter table public.ambulances enable row level security;
alter table public.hospitals enable row level security;

-- FORCE RLS for app-facing tables so table owners cannot accidentally bypass
-- policy checks through ordinary application paths.
alter table public.profiles force row level security;
alter table public.emergencies force row level security;
alter table public.user_locations force row level security;
alter table public.emergency_contacts force row level security;
alter table public.ambulance_locations force row level security;

-- 2. Keep operational roles distinct from ADMIN.
alter type public.app_role add value if not exists 'PARAMEDIC';
alter type public.app_role add value if not exists 'DISPATCHER';

update public.profiles
set role_v2 = case
  when upper(role::text) = 'PARAMEDIC' then 'PARAMEDIC'::public.app_role
  when upper(role::text) = 'DISPATCHER' then 'DISPATCHER'::public.app_role
  when upper(role::text) = 'DOCTOR' then 'DOCTOR'::public.app_role
  when upper(role::text) = 'ADMIN' then 'ADMIN'::public.app_role
  else 'PATIENT'::public.app_role
end;

create or replace function public.get_current_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select role_v2::text from public.profiles where id = auth.uid()),
    'PATIENT'
  );
$$;

create or replace function public.is_emergency_staff()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.get_current_role() in ('PARAMEDIC', 'DISPATCHER');
$$;

grant execute on function public.get_current_role() to authenticated;
grant execute on function public.is_emergency_staff() to authenticated;

-- 3. Profiles: browser users only read/update their own row.
-- Doctors use patient_profiles/health_records through explicit policies.
drop policy if exists "Staff can view profiles" on public.profiles;
drop policy if exists "Users can view own profile" on public.profiles;
create policy "Users can view own profile"
on public.profiles
for select
to authenticated
using (auth.uid() = id);

drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile"
on public.profiles
for update
to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);

drop policy if exists "Users can insert own profile" on public.profiles;
create policy "Users can insert own profile"
on public.profiles
for insert
to authenticated
with check (auth.uid() = id);

-- Prevent self-service privilege escalation through profile updates.
create or replace function public.prevent_profile_privilege_escalation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() = old.id then
    if new.role is distinct from old.role
       or new.role_v2 is distinct from old.role_v2
       or new.ambulance_id is distinct from old.ambulance_id then
      raise exception 'Role and staff assignment fields cannot be changed by the account owner';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_prevent_profile_privilege_escalation on public.profiles;
create trigger trg_prevent_profile_privilege_escalation
before update on public.profiles
for each row execute function public.prevent_profile_privilege_escalation();

-- 4. Emergencies: patients create/read their own. Staff handle dispatch.
drop policy if exists "Users can view own emergencies" on public.emergencies;
create policy "Users can view own emergencies"
on public.emergencies
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Users can insert emergencies" on public.emergencies;
create policy "Users can insert emergencies"
on public.emergencies
for insert
to authenticated
with check (
  auth.uid() = user_id
  and status = 'pending'
  and assigned_ambulance_id is null
);

drop policy if exists "Users can update own emergencies" on public.emergencies;
create policy "Users may cancel own active emergency"
on public.emergencies
for update
to authenticated
using (auth.uid() = user_id and status in ('pending','dispatched','en_route'))
with check (auth.uid() = user_id and status = 'cancelled');

drop policy if exists "Staff can view all emergencies" on public.emergencies;
create policy "Emergency staff can view emergencies"
on public.emergencies
for select
to authenticated
using (public.is_emergency_staff());

drop policy if exists "Staff can update emergencies" on public.emergencies;
create policy "Emergency staff can update emergencies"
on public.emergencies
for update
to authenticated
using (public.is_emergency_staff())
with check (public.is_emergency_staff());

-- Reject direct patient tampering with dispatch-controlled fields.
create or replace function public.enforce_emergency_update_integrity()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() = old.user_id and not public.is_emergency_staff() then
    if new.user_id is distinct from old.user_id
       or new.latitude is distinct from old.latitude
       or new.longitude is distinct from old.longitude
       or new.address is distinct from old.address
       or new.description is distinct from old.description
       or new.assigned_ambulance_id is distinct from old.assigned_ambulance_id
       or new.assigned_hospital_id is distinct from old.assigned_hospital_id
       or new.eta_minutes is distinct from old.eta_minutes
       or new.status <> 'cancelled' then
      raise exception 'Patients may only cancel their own active emergency';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_emergency_update_integrity on public.emergencies;
create trigger trg_emergency_update_integrity
before update on public.emergencies
for each row execute function public.enforce_emergency_update_integrity();

-- 5. Location data: remove broad staff/public visibility.
drop policy if exists "Staff can view user locations" on public.user_locations;
drop policy if exists "Users can view own locations" on public.user_locations;
create policy "Users can view own locations"
on public.user_locations
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Users can insert own locations" on public.user_locations;
create policy "Users can insert own locations"
on public.user_locations
for insert
to authenticated
with check (auth.uid() = user_id);

create policy "Assigned emergency staff can view patient locations"
on public.user_locations
for select
to authenticated
using (
  public.is_emergency_staff()
  and exists (
    select 1
    from public.emergencies e
    where e.user_id = user_locations.user_id
      and e.status in ('pending','dispatched','en_route','arrived')
  )
);

-- 6. Ambulances and ambulance pings are no longer public.
drop policy if exists "Everyone can read ambulances" on public.ambulances;
create policy "Emergency staff can read ambulances"
on public.ambulances
for select
to authenticated
using (public.is_emergency_staff());

create policy "Patients can read assigned ambulance"
on public.ambulances
for select
to authenticated
using (
  exists (
    select 1 from public.emergencies e
    where e.user_id = auth.uid()
      and e.assigned_ambulance_id = ambulances.id
      and e.status in ('dispatched','en_route','arrived')
  )
);

drop policy if exists "Ambulance locations are publicly readable" on public.ambulance_locations;
create policy "Emergency staff can read ambulance locations"
on public.ambulance_locations
for select
to authenticated
using (public.is_emergency_staff());

create policy "Patients can read assigned ambulance locations"
on public.ambulance_locations
for select
to authenticated
using (
  exists (
    select 1 from public.emergencies e
    where e.user_id = auth.uid()
      and e.assigned_ambulance_id = ambulance_locations.ambulance_id
      and e.status in ('dispatched','en_route','arrived')
  )
);

-- 7. Device connections: browser can see safe metadata only; writes are backend-only.
drop policy if exists "Users manage own devices" on public.device_connections;
drop policy if exists "Users can view own device connections" on public.device_connections;
create policy "Users can view own device connections"
on public.device_connections
for select
to authenticated
using (auth.uid() = user_id);

-- 8. Remove legacy plaintext wearable tokens from profiles.
-- Provider OAuth tokens belong in backend-only encrypted storage.
alter table public.profiles drop column if exists fitbit_access_token;
alter table public.profiles drop column if exists fitbit_refresh_token;
alter table public.profiles drop column if exists fitbit_token_expires_at;
alter table public.profiles drop column if exists fitbit_user_id;

-- 9. Audit logs are never directly readable/writable by normal browser clients.
revoke all on public.audit_logs from anon, authenticated;

-- 10. Helpful indexes for authorization predicates.
create index if not exists idx_emergencies_assigned_ambulance
  on public.emergencies(assigned_ambulance_id);
create index if not exists idx_emergencies_active_user
  on public.emergencies(user_id, status);


-- FILE: supabase/migrations/004_appointment_integrity.sql
-- Appointment integrity: overlapping active appointments are never allowed.
-- Apply after reviewing legacy duplicates; the constraint deliberately fails
-- if existing records conflict, rather than silently discarding clinical data.
create extension if not exists btree_gist;

alter table public.appointments
  add constraint appointments_positive_duration check (ends_at > starts_at);

alter table public.appointments
  drop constraint if exists no_double_booking;

alter table public.appointments
  add constraint appointments_no_overlapping_active_slots
  exclude using gist (
    doctor_id with =,
    tstzrange(starts_at, ends_at, '[)') with &&
  )
  where (status in ('PENDING', 'CONFIRMED'));

-- Browser clients may only cancel their own appointments; staff status changes
-- go through server-side authorization and the lifecycle check below.
create or replace function public.check_appointment_transition()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  caller_role text;
begin
  if new.patient_id is distinct from old.patient_id
     or new.doctor_id is distinct from old.doctor_id then
    raise exception 'Appointment participants cannot be reassigned';
  end if;

  if new.status is distinct from old.status then
    if not (
      (old.status = 'PENDING' and new.status in ('CONFIRMED','REJECTED','CANCELLED'))
      or (old.status = 'CONFIRMED' and new.status in ('CANCELLED','COMPLETED','NO_SHOW'))
    ) then
      raise exception 'Invalid appointment status transition';
    end if;

    caller_role := public.get_current_role();
    if caller_role = 'PATIENT'
       and (auth.uid() <> old.patient_id or new.status <> 'CANCELLED') then
      raise exception 'Patient cannot perform this transition';
    end if;
    if caller_role = 'DOCTOR'
       and (auth.uid() <> old.doctor_id or new.status not in ('CONFIRMED','REJECTED','COMPLETED','NO_SHOW')) then
      raise exception 'Doctor cannot perform this transition';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists appointment_transition_guard on public.appointments;
create trigger appointment_transition_guard
before update on public.appointments
for each row execute function public.check_appointment_transition();


-- FILE: supabase/migrations/005_atomic_dispatch.sql
-- Atomic dispatch operations. Invoked through authenticated Supabase RPC only.
-- SECURITY INVOKER keeps caller RLS; dispatcher must be authorized by role.
-- SECURITY DEFINER here is required to update operational rows through restricted RLS;
-- all entry points verify auth.uid() and role in this transaction.
create or replace function public.dispatch_transition(
  p_action text, p_emergency_id uuid, p_ambulance_id uuid default null, p_status text default null
) returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_em public.emergencies%rowtype;
  v_am public.ambulances%rowtype;
  v_role text;
  v_next public.emergency_status;
begin
  if auth.uid() is null then raise exception 'Unauthenticated' using errcode='42501'; end if;
  v_role := public.get_current_role();
  if v_role not in ('DISPATCHER','PARAMEDIC') then raise exception 'Forbidden' using errcode='42501'; end if;

  select * into v_em from public.emergencies where id = p_emergency_id for update;
  if not found then raise exception 'Emergency not found' using errcode='P0002'; end if;

  if p_action = 'assign' then
    if v_role <> 'DISPATCHER' or p_ambulance_id is null or v_em.status <> 'pending'
      or v_em.assigned_ambulance_id is not null then
      raise exception 'Invalid assignment' using errcode='23514';
    end if;
    select * into v_am from public.ambulances where id = p_ambulance_id for update;
    if not found or v_am.status <> 'available' or v_am.current_emergency_id is not null then
      raise exception 'Ambulance unavailable' using errcode='23505';
    end if;
    update public.ambulances set status='dispatched', current_emergency_id=p_emergency_id,
      updated_at=now() where id=p_ambulance_id;
    update public.emergencies set status='dispatched', assigned_ambulance_id=p_ambulance_id,
      eta_minutes=null, updated_at=now() where id=p_emergency_id;
    return jsonb_build_object('ok',true,'status','dispatched','ambulanceId',p_ambulance_id);
  elsif p_action = 'release' then
    if v_role <> 'DISPATCHER' or v_em.status not in ('dispatched','en_route') then
      raise exception 'Invalid release' using errcode='23514';
    end if;
    if v_em.assigned_ambulance_id is not null then
      update public.ambulances set status='available', current_emergency_id=null,
        updated_at=now() where id=v_em.assigned_ambulance_id;
    end if;
    update public.emergencies set status='pending', assigned_ambulance_id=null,
      eta_minutes=null, updated_at=now() where id=p_emergency_id;
    return jsonb_build_object('ok',true,'status','pending');
  elsif p_action = 'status' then
    if p_status not in ('en_route','arrived','resolved','cancelled') then
      raise exception 'Invalid status' using errcode='23514';
    end if;
    v_next := p_status::public.emergency_status;
    if not (
      (v_em.status='dispatched' and v_next in ('en_route','cancelled'))
      or (v_em.status='en_route' and v_next in ('arrived','cancelled'))
      or (v_em.status='arrived' and v_next='resolved')
    ) then raise exception 'Invalid status transition' using errcode='23514'; end if;
    if v_em.assigned_ambulance_id is null then raise exception 'No assigned ambulance' using errcode='23514'; end if;
    if v_role = 'PARAMEDIC' and not exists (
      select 1 from public.profiles where id=auth.uid() and ambulance_id=v_em.assigned_ambulance_id
    ) then raise exception 'Not assigned to this ambulance' using errcode='42501'; end if;
    update public.emergencies set status=v_next, updated_at=now() where id=p_emergency_id;
    update public.ambulances set
      status = case
        when v_next='en_route' then 'en_route'::public.ambulance_status
        when v_next='arrived' then 'arrived'::public.ambulance_status
        else 'available'::public.ambulance_status end,
      current_emergency_id=case when v_next in ('resolved','cancelled') then null else p_emergency_id end,
      updated_at=now()
      where id=v_em.assigned_ambulance_id;
    return jsonb_build_object('ok',true,'status',v_next);
  end if;
  raise exception 'Unknown dispatch action' using errcode='23514';
end;
$$;

revoke all on function public.dispatch_transition(text,uuid,uuid,text) from public, anon;
grant execute on function public.dispatch_transition(text,uuid,uuid,text) to authenticated;

-- Prevent direct browser writes to dispatch-controlled ambulance fields.
drop policy if exists "Dispatchers can update ambulances" on public.ambulances;
drop policy if exists "Staff can update ambulances" on public.ambulances;


-- FILE: supabase/migrations/006_appointment_rls_alignment.sql
-- Align RLS with the authorized appointment API.
-- Existing patient/doctor UPDATE policies are too broad: they allow changing
-- unrelated columns and can race with the API. Transition trigger in 004 helps,
-- while this migration enforces role + ownership on writes.
drop policy if exists "Patients update own appointments" on public.appointments;
create policy "Patients update own appointments" on public.appointments
  for update to authenticated using (
    auth.uid() = patient_id and public.get_current_role() = 'PATIENT'
  ) with check (
    auth.uid() = patient_id and public.get_current_role() = 'PATIENT'
  );

drop policy if exists "Doctors update assigned appointments" on public.appointments;
create policy "Doctors update assigned appointments" on public.appointments
  for update to authenticated using (
    auth.uid() = doctor_id and public.get_current_role() = 'DOCTOR'
  ) with check (
    auth.uid() = doctor_id and public.get_current_role() = 'DOCTOR'
  );

drop policy if exists "Patients book own appointments" on public.appointments;
create policy "Patients book own appointments" on public.appointments
  for insert to authenticated with check (
    auth.uid() = patient_id and public.get_current_role() = 'PATIENT'
      and status = 'CONFIRMED'
  );

drop policy if exists "Admins view all appointments" on public.appointments;
create policy "Admins view all appointments" on public.appointments
  for select to authenticated using (public.get_current_role() = 'ADMIN');
create policy "Admins update operational appointments" on public.appointments
  for update to authenticated using (public.get_current_role() = 'ADMIN')
  with check (public.get_current_role() = 'ADMIN');

-- The prior 004 trigger allowed changes to appointment time, reason and
-- hospital during a status update. For now keep updates status-only; future
-- rescheduling requires its own authorized transactional workflow.
create or replace function public.check_appointment_transition()
returns trigger language plpgsql security definer set search_path=public as $$
declare v_role text;
begin
  if (new.patient_id, new.doctor_id, new.hospital_id, new.hospital_name,
      new.specialty, new.starts_at, new.ends_at, new.reason, new.created_at)
     is distinct from
     (old.patient_id, old.doctor_id, old.hospital_id, old.hospital_name,
      old.specialty, old.starts_at, old.ends_at, old.reason, old.created_at)
  then raise exception 'Only appointment status may be updated through this interface'; end if;

  if new.status = old.status then return new; end if;
  if not (
    (old.status='PENDING' and new.status in ('CONFIRMED','REJECTED','CANCELLED'))
    or (old.status='CONFIRMED' and new.status in ('CANCELLED','COMPLETED','NO_SHOW'))
  ) then raise exception 'Invalid appointment transition'; end if;

  v_role := public.get_current_role();
  if v_role='PATIENT' and (auth.uid() <> old.patient_id or new.status <> 'CANCELLED') then
    raise exception 'Patient not permitted';
  elsif v_role='DOCTOR' and (auth.uid() <> old.doctor_id
      or new.status not in ('CONFIRMED','REJECTED','COMPLETED','NO_SHOW')) then
    raise exception 'Doctor not permitted';
  elsif v_role not in ('PATIENT','DOCTOR','ADMIN') then
    raise exception 'Role not permitted';
  end if;
  return new;
end;
$$;

-- Remove old status-unsafe emergency UPDATE policy if still present;
-- migration 003 established cancellation-only patient updates.
drop policy if exists "Users can update own emergencies" on public.emergencies;

