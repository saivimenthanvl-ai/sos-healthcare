-- ============================================================
-- Migration 002: RBAC (PATIENT, DOCTOR, ADMIN), Appointments,
-- Health Records, Profiles, and Clinical Security
-- ============================================================

-- 1. Extend or create UserRole enum to strictly support PATIENT, DOCTOR, ADMIN
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'app_role') THEN
    CREATE TYPE public.app_role AS ENUM ('PATIENT', 'DOCTOR', 'ADMIN', 'PARAMEDIC', 'DISPATCHER');
  END IF;
END $$;

-- Add role column to profiles if not present or migrate existing enum
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS role_v2 public.app_role DEFAULT 'PATIENT';

-- Map legacy roles if needed
UPDATE public.profiles
SET role_v2 = CASE
  WHEN upper(role::text) = 'PARAMEDIC' THEN 'PARAMEDIC'::public.app_role
  WHEN upper(role::text) = 'DISPATCHER' THEN 'DISPATCHER'::public.app_role
  WHEN upper(role::text) = 'DOCTOR' THEN 'DOCTOR'::public.app_role
  WHEN upper(role::text) = 'ADMIN' THEN 'ADMIN'::public.app_role
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
  verification_status TEXT DEFAULT 'VERIFIED', -- PENDING, VERIFIED, SUSPENDED
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

-- 8. Device Connections (Wearable/Health providers)
CREATE TABLE IF NOT EXISTS public.device_connections (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider TEXT NOT NULL,
  provider_user_id TEXT,
  access_token_encrypted TEXT,
  refresh_token_encrypted TEXT,
  token_expires_at TIMESTAMPTZ,
  scopes TEXT[] NOT NULL DEFAULT '{}',
  connected_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  last_sync_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'connected'
    CHECK (status IN ('connected', 'disconnected', 'expired', 'error')),
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

-- Devices: browser clients can only read their own connection metadata.
-- OAuth credential writes are backend-only.
DROP POLICY IF EXISTS "Users manage own devices" ON public.device_connections;
DROP POLICY IF EXISTS "Users can view own device connections" ON public.device_connections;
CREATE POLICY "Users can view own device connections" ON public.device_connections
  FOR SELECT USING (auth.uid() = user_id);
