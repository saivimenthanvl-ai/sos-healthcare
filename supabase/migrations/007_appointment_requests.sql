-- ============================================================
-- Migration 007: Private Custom Appointment Requests & Hospital Decoupling
-- ============================================================

-- Table for patient-owned private appointment planning requests.
-- Stored strictly within SOS Healthcare database with zero external hospital EMR/EHR sync.
CREATE TABLE IF NOT EXISTS public.appointment_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  hospital_id UUID REFERENCES public.hospitals(id) ON DELETE SET NULL,
  hospital_name_snapshot TEXT NOT NULL,
  specialty TEXT,
  consultation_type TEXT NOT NULL DEFAULT 'Specialist Consultation', -- 'Specialist Consultation', 'Emergency Follow-up', 'Routine Checkup'
  consultation_mode TEXT NOT NULL DEFAULT 'IN_PERSON', -- 'IN_PERSON', 'VIRTUAL'
  preferred_starts_at TIMESTAMPTZ NOT NULL,
  timezone TEXT DEFAULT 'UTC',
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'PLANNED', -- 'PLANNED', 'COMPLETED', 'CANCELLED'
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  cancelled_at TIMESTAMPTZ
);

-- Indices for rapid querying by patient and timeline
CREATE INDEX IF NOT EXISTS idx_appointment_requests_patient_id ON public.appointment_requests(patient_id);
CREATE INDEX IF NOT EXISTS idx_appointment_requests_status ON public.appointment_requests(status);
CREATE INDEX IF NOT EXISTS idx_appointment_requests_starts_at ON public.appointment_requests(preferred_starts_at);

-- Row Level Security (RLS)
ALTER TABLE public.appointment_requests ENABLE ROW LEVEL SECURITY;

-- Patients can view only their own appointment requests
CREATE POLICY "Patients can view own appointment requests"
  ON public.appointment_requests
  FOR SELECT
  USING (auth.uid() = patient_id);

-- Patients can insert their own appointment requests
CREATE POLICY "Patients can create own appointment requests"
  ON public.appointment_requests
  FOR INSERT
  WITH CHECK (auth.uid() = patient_id);

-- Patients can update (reschedule or cancel) their own appointment requests
CREATE POLICY "Patients can update own appointment requests"
  ON public.appointment_requests
  FOR UPDATE
  USING (auth.uid() = patient_id)
  WITH CHECK (auth.uid() = patient_id);

-- Admins can view audit of appointment requests (Read-Only)
CREATE POLICY "Admins can view appointment requests"
  ON public.appointment_requests
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND (role_v2 = 'ADMIN' OR role = 'admin')
    )
  );
