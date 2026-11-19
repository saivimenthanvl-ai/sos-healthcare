import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

test("Health Profile & Readings: route /api/profile/health enforces dual operations (PUT profile, POST reading)", () => {
  const routeCode = fs.readFileSync("src/app/api/profile/health/route.ts", "utf8");
  
  // Must authenticate all requests
  assert.match(routeCode, /getAuthenticatedUser\(request\)/);
  assert.match(routeCode, /status:\s*401/);

  // Operation 1 (PUT): Updates current profile WITHOUT inserting into health_records
  assert.match(routeCode, /export async function PUT/);
  assert.match(routeCode, /from\("patient_profiles"\)/);
  assert.match(routeCode, /\.upsert\(/);
  assert.doesNotMatch(routeCode, /export async function PUT[\s\S]*?from\("health_records"\)\.insert/);

  // Operation 2 (POST): Creates a timestamped observation reading snapshot with idempotency support
  assert.match(routeCode, /export async function POST/);
  assert.match(routeCode, /from\("health_records"\)/);
  assert.match(routeCode, /\.insert\(/);
  assert.match(routeCode, /idempotencyKey/);
  assert.match(routeCode, /temperatureUnit/);

  // Validation checks
  assert.match(routeCode, /Height must be between 30 cm and 300 cm/);
  assert.match(routeCode, /Weight must be between 2 kg and 500 kg/);
  assert.match(routeCode, /Invalid blood group format/);
  assert.match(routeCode, /Systolic blood pressure must be between 40 and 300 mmHg/);
  assert.match(routeCode, /Diastolic blood pressure must be between 20 and 200 mmHg/);
});

test("Health Profile: frontend provides explicit Record New Reading action, displays history, and computes BMI", () => {
  const pageCode = fs.readFileSync("src/app/(main)/profile/health/page.tsx", "utf8");

  // Does not have hardcoded initial defaults
  assert.doesNotMatch(pageCode, /useState\("175"\)/);
  assert.doesNotMatch(pageCode, /useState\("70"\)/);
  assert.doesNotMatch(pageCode, /useState\("O\+"\)/);
  assert.doesNotMatch(pageCode, /useState\("120"\)/);

  // Consent defaults to false (OFF)
  assert.match(pageCode, /useState\(false\);\s*\/\/\s*Default to OFF/);

  // Provides separate Save Current Profile and Record New Observation actions
  assert.match(pageCode, /handleSaveProfile/);
  assert.match(pageCode, /handleRecordNewReading/);
  assert.match(pageCode, /Recent Historical Readings/);

  // Displays temperature units
  assert.match(pageCode, /setTemperatureUnit/);
});

test("Migration 011: defines idempotency_key, temperature_unit, consent_events table, and tightened Doctor RLS", () => {
  const mig011 = fs.readFileSync("supabase/migrations/011_health_measurements_and_consent_hardening.sql", "utf8");

  assert.match(mig011, /ADD COLUMN IF NOT EXISTS temperature_unit TEXT DEFAULT 'FAHRENHEIT'/);
  assert.match(mig011, /ADD COLUMN IF NOT EXISTS idempotency_key TEXT/);
  assert.match(mig011, /CREATE TABLE IF NOT EXISTS public\.consent_events/);
  assert.match(mig011, /CREATE POLICY "Patients view own consent events" ON public\.consent_events/);

  // Tightened Doctor RLS: appointment ALONE must NOT grant health_records access
  assert.match(mig011, /CREATE POLICY "Doctors view authorized health records" ON public\.health_records/);
  assert.match(mig011, /FROM public\.health_sharing_permissions p/);
  assert.doesNotMatch(mig011, /CREATE POLICY "Doctors view authorized health records"[\s\S]*?FROM appointments a/);

  // Function search path hardening
  assert.match(mig011, /SET search_path = public/);
  assert.match(mig011, /REVOKE EXECUTE ON FUNCTION public\.set_updated_at\(\) FROM public, anon/);
  assert.match(mig011, /REVOKE EXECUTE ON FUNCTION public\.prevent_profile_privilege_escalation\(\) FROM public, anon/);
});
