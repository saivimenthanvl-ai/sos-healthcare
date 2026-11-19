import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

test("Health Profile: route /api/profile/health enforces authentication and data validation", () => {
  const routeCode = fs.readFileSync("src/app/api/profile/health/route.ts", "utf8");
  
  // Must authenticate requests
  assert.match(routeCode, /getAuthenticatedUser\(request\)/);
  assert.match(routeCode, /status:\s*401/);

  // Must validate height, weight, and blood group boundaries
  assert.match(routeCode, /Height must be between 30 cm and 300 cm/);
  assert.match(routeCode, /Weight must be between 2 kg and 500 kg/);
  assert.match(routeCode, /Invalid blood group format/);
  assert.match(routeCode, /Systolic blood pressure must be between 40 and 300 mmHg/);
  assert.match(routeCode, /Diastolic blood pressure must be between 20 and 200 mmHg/);

  // Must persist to public.patient_profiles and public.health_records
  assert.match(routeCode, /from\("patient_profiles"\)/);
  assert.match(routeCode, /\.upsert\(/);
  assert.match(routeCode, /from\("health_records"\)/);
  assert.match(routeCode, /\.insert\(/);
});

test("Health Profile: page initializes empty without hardcoded measurement defaults", () => {
  const pageCode = fs.readFileSync("src/app/(main)/profile/health/page.tsx", "utf8");

  // Must not have hardcoded initial defaults
  assert.doesNotMatch(pageCode, /useState\("175"\)/);
  assert.doesNotMatch(pageCode, /useState\("70"\)/);
  assert.doesNotMatch(pageCode, /useState\("O\+"\)/);
  assert.doesNotMatch(pageCode, /useState\("120"\)/);
  assert.doesNotMatch(pageCode, /useState\("80"\)/);
  assert.doesNotMatch(pageCode, /useState\("72"\)/);
  assert.doesNotMatch(pageCode, /useState\("98"\)/);
  assert.doesNotMatch(pageCode, /useState\("98\.6"\)/);
  assert.doesNotMatch(pageCode, /useState\("None reported"\)/);

  // Default sharing consent must be false (OFF)
  assert.match(pageCode, /useState\(false\);\s*\/\/\s*Default to OFF/);

  // Must call /api/profile/health to load existing saved records
  assert.match(pageCode, /fetch\("\/api\/profile\/health"\)/);
  assert.match(pageCode, /method:\s*"PUT"/);
});

test("Health Profile: migration 010 defines pre_arrival_sharing_consent with default false", () => {
  const migCode = fs.readFileSync("supabase/migrations/010_patient_sharing_consent.sql", "utf8");
  assert.match(migCode, /ADD COLUMN IF NOT EXISTS pre_arrival_sharing_consent BOOLEAN NOT NULL DEFAULT false/);
  assert.match(migCode, /ADD COLUMN IF NOT EXISTS sharing_consent_updated_at TIMESTAMPTZ/);
});
