-- Migration 011: Health records historical measurements, explicit consent events, units and RLS tightening
-- Preserves existing tables, data, and rows. Non-destructive and additive.

-- 1. Explicit temperature unit and idempotency key on health_records
ALTER TABLE public.health_records
  ADD COLUMN IF NOT EXISTS temperature_unit TEXT DEFAULT 'FAHRENHEIT',
  ADD COLUMN IF NOT EXISTS idempotency_key TEXT;

-- Index for idempotency lookups per patient
CREATE UNIQUE INDEX IF NOT EXISTS idx_health_records_patient_idempotency
  ON public.health_records (patient_id, idempotency_key)
  WHERE idempotency_key IS NOT NULL;

-- 2. Audit-proof append-only consent event history
CREATE TABLE IF NOT EXISTS public.consent_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  consent_type TEXT NOT NULL, -- e.g. 'EMERGENCY_PRE_ARRIVAL', 'DOCTOR_DIRECT_SHARE'
  action TEXT NOT NULL,       -- 'GRANTED', 'WITHDRAWN', 'EXPIRED'
  doctor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on consent_events
ALTER TABLE public.consent_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Patients view own consent events" ON public.consent_events;
CREATE POLICY "Patients view own consent events" ON public.consent_events
  FOR SELECT TO authenticated
  USING (auth.uid() = patient_id);

DROP POLICY IF EXISTS "Patients insert own consent events" ON public.consent_events;
CREATE POLICY "Patients insert own consent events" ON public.consent_events
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = patient_id);

-- 3. Tighten health_records RLS for Doctors:
-- An appointment ALONE must NOT grant access to sensitive medical records without ACTIVE unexpired consent!
DROP POLICY IF EXISTS "Doctors view authorized health records" ON public.health_records;
CREATE POLICY "Doctors view authorized health records" ON public.health_records
  FOR SELECT TO authenticated
  USING (
    public.get_current_role() = 'DOCTOR'
    AND EXISTS (
      SELECT 1 FROM public.health_sharing_permissions p
      WHERE p.patient_id = health_records.patient_id
        AND p.doctor_id = auth.uid()
        AND p.status = 'ACTIVE'
        AND (p.expires_at IS NULL OR p.expires_at > now())
    )
  );

-- 4. Tighten patient_profiles RLS for Doctors:
-- Requires ACTIVE unexpired consent
DROP POLICY IF EXISTS "Doctors view assigned patient profile" ON public.patient_profiles;
CREATE POLICY "Doctors view assigned patient profile" ON public.patient_profiles
  FOR SELECT TO authenticated
  USING (
    public.get_current_role() = 'DOCTOR'
    AND EXISTS (
      SELECT 1 FROM public.health_sharing_permissions p
      WHERE p.patient_id = patient_profiles.user_id
        AND p.doctor_id = auth.uid()
        AND p.status = 'ACTIVE'
        AND (p.expires_at IS NULL OR p.expires_at > now())
    )
  );

-- 5. Security Advisor remediation:
-- Set immutable search_path on public.set_updated_at
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  new.updated_at = now();
  RETURN new;
END;
$$;

-- Revoke execute on internal trigger functions from public and anon
REVOKE EXECUTE ON FUNCTION public.set_updated_at() FROM public, anon;
REVOKE EXECUTE ON FUNCTION public.prevent_profile_privilege_escalation() FROM public, anon;
REVOKE EXECUTE ON FUNCTION public.enforce_emergency_update_integrity() FROM public, anon;
REVOKE EXECUTE ON FUNCTION public.check_appointment_transition() FROM public, anon;
