-- ============================================================
-- Migration 002: RBAC (PATIENT, DOCTOR, ADMIN, PARAMEDIC, DISPATCHER),
-- Appointments, Health Records, Profiles, and Clinical Security
-- ============================================================

-- 1. Extend or create app_role enum with all 5 operational & clinical roles up-front
--    so subsequent migrations never trigger PostgreSQL 55P04 (unsafe use of new enum value in same transaction).
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'app_role') THEN
    CREATE TYPE public.app_role AS ENUM ('PATIENT', 'DOCTOR', 'ADMIN', 'PARAMEDIC', 'DISPATCHER');
  END IF;
END $$;

ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'PARAMEDIC';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'DISPATCHER';

-- Add role_v2 column to profiles if not present
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS role_v2 public.app_role DEFAULT 'PATIENT';

-- Map legacy roles safely without overwriting established role_v2 assignments
UPDATE public.profiles
SET role_v2 = CASE
  WHEN upper(role::text) = 'PARAMEDIC' THEN 'PARAMEDIC'::public.app_role
  WHEN upper(role::text) = 'DISPATCHER' THEN 'DISPATCHER'::public.app_role
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

-- 8. Device Connections (Smartwatches & Google Health)
-- Exact match with existing production schema + additive compatible metadata columns.
CREATE TABLE IF NOT EXISTS public.device_connections (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider TEXT NOT NULL, -- 'fitbit', 'apple_health', 'wear_os', 'google_health'
  provider_user_id TEXT,
  access_token_encrypted TEXT,
  refresh_token_encrypted TEXT,
  token_expires_at TIMESTAMPTZ,
  scopes TEXT[] NOT NULL DEFAULT '{}'::text[],
  connected_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_sync_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'connected' CHECK (status = ANY (ARRAY['connected'::text, 'disconnected'::text, 'expired'::text, 'error'::text])),
  connection_status TEXT NOT NULL DEFAULT 'DISCONNECTED', -- CONNECTED, DISCONNECTED, PENDING_AUTH
  last_synced_at TIMESTAMPTZ,
  metrics JSONB DEFAULT '[]'::jsonb,
  permissions JSONB DEFAULT '[]'::jsonb,
  device_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  CONSTRAINT device_connections_user_provider_unique UNIQUE (user_id, provider)
);

-- Non-destructively reconcile existing production device_connections schema
ALTER TABLE public.device_connections
  ADD COLUMN IF NOT EXISTS provider_user_id TEXT,
  ADD COLUMN IF NOT EXISTS access_token_encrypted TEXT,
  ADD COLUMN IF NOT EXISTS refresh_token_encrypted TEXT,
  ADD COLUMN IF NOT EXISTS token_expires_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS scopes TEXT[] NOT NULL DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS connected_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS last_sync_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'connected',
  ADD COLUMN IF NOT EXISTS connection_status TEXT NOT NULL DEFAULT 'DISCONNECTED',
  ADD COLUMN IF NOT EXISTS last_synced_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS metrics JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS permissions JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS device_name TEXT;

-- Sync existing status/last_sync_at values into connection_status/last_synced_at without overwriting
UPDATE public.device_connections
SET
  connection_status = COALESCE(NULLIF(UPPER(status), ''), connection_status, 'DISCONNECTED'),
  last_synced_at = COALESCE(last_synced_at, last_sync_at, connected_at)
WHERE status IS NOT NULL OR last_sync_at IS NOT NULL;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.device_connections'::regclass
      AND contype = 'u'
  ) THEN
    ALTER TABLE public.device_connections
      ADD CONSTRAINT device_connections_user_provider_unique UNIQUE (user_id, provider);
  END IF;
END $$;



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

-- Doctor can view health records only with active appointment or active, non-expired consent relationship
DROP POLICY IF EXISTS "Doctors view authorized health records" ON public.health_records;
CREATE POLICY "Doctors view authorized health records" ON public.health_records
  FOR SELECT USING (
    public.get_current_role() = 'DOCTOR' AND (
      EXISTS (
        SELECT 1 FROM public.appointments a
        WHERE a.patient_id = health_records.patient_id
          AND a.doctor_id = auth.uid()
          AND a.status IN ('PENDING', 'CONFIRMED')
      ) OR EXISTS (
        SELECT 1 FROM public.health_sharing_permissions p
        WHERE p.patient_id = health_records.patient_id
          AND p.doctor_id = auth.uid()
          AND p.status = 'ACTIVE'
          AND (p.expires_at IS NULL OR p.expires_at > NOW())
      )
    )
  );

-- Admin Profiles: Administrators view and update only their own admin profile
DROP POLICY IF EXISTS "Admins view own admin profile" ON public.admin_profiles;
CREATE POLICY "Admins view own admin profile" ON public.admin_profiles
  FOR SELECT TO authenticated USING (auth.uid() = user_id AND public.get_current_role() = 'ADMIN');

DROP POLICY IF EXISTS "Admins update own admin profile" ON public.admin_profiles;
CREATE POLICY "Admins update own admin profile" ON public.admin_profiles
  FOR UPDATE TO authenticated USING (auth.uid() = user_id AND public.get_current_role() = 'ADMIN')
  WITH CHECK (auth.uid() = user_id AND public.get_current_role() = 'ADMIN');

-- Doctor Availability: Authenticated users view active availability; Doctors manage only their own slots
DROP POLICY IF EXISTS "Authenticated users view doctor availability" ON public.doctor_availability;
CREATE POLICY "Authenticated users view doctor availability" ON public.doctor_availability
  FOR SELECT TO authenticated USING (is_active = TRUE OR auth.uid() = doctor_id);

DROP POLICY IF EXISTS "Doctors insert own availability" ON public.doctor_availability;
CREATE POLICY "Doctors insert own availability" ON public.doctor_availability
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = doctor_id AND public.get_current_role() = 'DOCTOR');

DROP POLICY IF EXISTS "Doctors update own availability" ON public.doctor_availability;
CREATE POLICY "Doctors update own availability" ON public.doctor_availability
  FOR UPDATE TO authenticated USING (auth.uid() = doctor_id AND public.get_current_role() = 'DOCTOR')
  WITH CHECK (auth.uid() = doctor_id AND public.get_current_role() = 'DOCTOR');

DROP POLICY IF EXISTS "Doctors delete own availability" ON public.doctor_availability;
CREATE POLICY "Doctors delete own availability" ON public.doctor_availability
  FOR DELETE TO authenticated USING (auth.uid() = doctor_id AND public.get_current_role() = 'DOCTOR');

-- Health Sharing Permissions: Patients manage their own consent grants; Doctors view active grants made to them
DROP POLICY IF EXISTS "Patients view own sharing permissions" ON public.health_sharing_permissions;
CREATE POLICY "Patients view own sharing permissions" ON public.health_sharing_permissions
  FOR SELECT TO authenticated USING (auth.uid() = patient_id);

DROP POLICY IF EXISTS "Patients insert own sharing permissions" ON public.health_sharing_permissions;
CREATE POLICY "Patients insert own sharing permissions" ON public.health_sharing_permissions
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = patient_id);

DROP POLICY IF EXISTS "Patients update own sharing permissions" ON public.health_sharing_permissions;
CREATE POLICY "Patients update own sharing permissions" ON public.health_sharing_permissions
  FOR UPDATE TO authenticated USING (auth.uid() = patient_id)
  WITH CHECK (auth.uid() = patient_id);

DROP POLICY IF EXISTS "Patients delete own sharing permissions" ON public.health_sharing_permissions;
CREATE POLICY "Patients delete own sharing permissions" ON public.health_sharing_permissions
  FOR DELETE TO authenticated USING (auth.uid() = patient_id);

DROP POLICY IF EXISTS "Doctors view granted sharing permissions" ON public.health_sharing_permissions;
CREATE POLICY "Doctors view granted sharing permissions" ON public.health_sharing_permissions
  FOR SELECT TO authenticated USING (
    auth.uid() = doctor_id
    AND public.get_current_role() = 'DOCTOR'
    AND status = 'ACTIVE'
    AND (expires_at IS NULL OR expires_at > NOW())
  );

-- Devices:
DROP POLICY IF EXISTS "Users manage own devices" ON public.device_connections;
CREATE POLICY "Users manage own devices" ON public.device_connections
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
