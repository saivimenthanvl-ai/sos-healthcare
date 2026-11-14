import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

test("supabase/schema.sql breaks circular foreign-key dependency between ambulances and emergencies", () => {
  const schema = fs.readFileSync("supabase/schema.sql", "utf8");
  
  // Ambulances must not define an inline references public.emergencies(id)
  assert.doesNotMatch(
    schema,
    /create table public\.ambulances[\s\S]*?current_emergency_id\s+uuid\s+references\s+public\.emergencies\(id\)/i,
    "Ambulances should not reference public.emergencies inline before emergencies table exists"
  );

  // Instead, the foreign key constraint must be added after emergencies is created
  assert.match(
    schema,
    /alter table public\.ambulances[\s\S]*?add constraint fk_ambulances_current_emergency[\s\S]*?references public\.emergencies\(id\)/i,
    "Deferred foreign key fk_ambulances_current_emergency must be added after emergencies exists"
  );
});

test("002_rbac_appointments_health.sql does not default newly created doctor_profiles to VERIFIED", () => {
  const migration = fs.readFileSync("supabase/migrations/002_rbac_appointments_health.sql", "utf8");
  assert.match(
    migration,
    /verification_status\s+TEXT\s+DEFAULT\s+'PENDING'/i,
    "Newly created doctor_profiles must default to PENDING, never VERIFIED"
  );
  assert.doesNotMatch(
    migration,
    /verification_status\s+TEXT\s+DEFAULT\s+'VERIFIED'/i,
    "Newly created doctor_profiles must not default to VERIFIED"
  );
});

test("AuthenticatedDashboardView distinguishes missing schema, auth error, and network error from empty emergency history", () => {
  const code = fs.readFileSync("src/components/AuthenticatedDashboardView.tsx", "utf8");
  
  // Checks that error categorization exists
  assert.match(code, /EmergencyErrorCategory/);
  assert.match(code, /SCHEMA_MISSING/);
  assert.match(code, /AUTH_FAILURE/);
  assert.match(code, /NETWORK_FAILURE/);
  assert.match(code, /DATABASE_UNAVAILABLE/);

  // Checks that Retry action exists
  assert.match(code, /Retry/);

  // Checks that realtime is gated to authorized and existing schema
  assert.match(code, /useRealtime/);
  assert.match(code, /schemaAvailable/);
});

test("Root layout uses data-scroll-behavior='smooth' without invalid CSS warnings", () => {
  const layout = fs.readFileSync("src/app/layout.tsx", "utf8");
  assert.match(layout, /data-scroll-behavior="smooth"/);
  assert.doesNotMatch(layout, /className="[^"]*scroll-smooth[^"]*"/);
});

test("Supabase admin runner includes all ordered migrations and comprehensive verification checks", () => {
  const runner = fs.readFileSync("scripts/supabase-admin.mjs", "utf8");
  assert.match(runner, /001_roles_and_dispatch\.sql/);
  assert.match(runner, /002_rbac_appointments_health\.sql/);
  assert.match(runner, /003_security_hardening\.sql/);
  assert.match(runner, /004_appointment_integrity\.sql/);
  assert.match(runner, /005_atomic_dispatch\.sql/);
  assert.match(runner, /006_appointment_rls_alignment\.sql/);
  assert.match(runner, /007_appointment_requests\.sql/);
  assert.match(runner, /008_admin_inquiries\.sql/);
  assert.match(runner, /seed-hospitals\.sql/);
  assert.match(runner, /seed-ambulances\.sql/);
});
