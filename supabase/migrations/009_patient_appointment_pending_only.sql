-- Migration 009: Restrict patient appointment creation to PENDING status only
-- Prevents patients from creating self-confirmed (CONFIRMED) appointments.
-- Only verified providers and authorized administrative processes may transition appointments to CONFIRMED.

DROP POLICY IF EXISTS "Patients book own appointments" ON public.appointments;

CREATE POLICY "Patients book own appointments" ON public.appointments
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = patient_id 
    AND public.get_current_role() = 'PATIENT'
    AND status = 'PENDING'
  );
