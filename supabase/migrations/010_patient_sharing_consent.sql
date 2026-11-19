-- Migration 010: Add pre-arrival emergency sharing consent to patient_profiles
-- Defaults to FALSE (OFF). Stored only after explicit patient agreement; supports withdrawal.

ALTER TABLE public.patient_profiles
  ADD COLUMN IF NOT EXISTS pre_arrival_sharing_consent BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS sharing_consent_updated_at TIMESTAMPTZ;
