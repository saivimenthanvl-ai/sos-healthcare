import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

test("BLK-01 & BLK-02: schema.sql and 001_roles_and_dispatch.sql are idempotent and use valid PostgreSQL policy syntax", () => {
  const schema = fs.readFileSync("supabase/schema.sql", "utf8");
  const mig001 = fs.readFileSync("supabase/migrations/001_roles_and_dispatch.sql", "utf8");

  // Must not contain invalid PostgreSQL comma-separated policy commands
  assert.doesNotMatch(schema, /for\s+insert\s*,\s*update\s*,\s*delete/i);
  assert.doesNotMatch(mig001, /for\s+insert\s*,\s*update\s*,\s*delete/i);

  // Must use separate policies on emergency_contacts
  assert.match(schema, /create policy "Users can insert own contacts" on public\.emergency_contacts[\s\S]*?for insert with check/i);
  assert.match(schema, /create policy "Users can update own contacts" on public\.emergency_contacts[\s\S]*?for update using/i);
  assert.match(schema, /create policy "Users can delete own contacts" on public\.emergency_contacts[\s\S]*?for delete using/i);

  // 001 must ensure prerequisite base tables exist idempotently
  assert.match(mig001, /create table if not exists public\.profiles/i);
  assert.match(mig001, /create table if not exists public\.hospitals/i);
  assert.match(mig001, /create table if not exists public\.ambulances/i);
  assert.match(mig001, /create table if not exists public\.emergencies/i);
  assert.match(mig001, /create table if not exists public\.oauth_states/i);
});

test("BLK-04 & BLK-06: 002 and 003 preserve production device_connections columns and authenticated owner write policies", () => {
  const mig002 = fs.readFileSync("supabase/migrations/002_rbac_appointments_health.sql", "utf8");
  const mig003 = fs.readFileSync("supabase/migrations/003_security_hardening.sql", "utf8");

  // 002 must preserve production encrypted token columns and add compatible metadata columns
  assert.match(mig002, /ADD COLUMN IF NOT EXISTS access_token_encrypted TEXT/i);
  assert.match(mig002, /ADD COLUMN IF NOT EXISTS refresh_token_encrypted TEXT/i);
  assert.match(mig002, /ADD COLUMN IF NOT EXISTS token_expires_at TIMESTAMPTZ/i);
  assert.match(mig002, /ADD COLUMN IF NOT EXISTS connection_status TEXT/i);
  assert.match(mig002, /ADD COLUMN IF NOT EXISTS last_synced_at TIMESTAMPTZ/i);

  // 003 must define SELECT, INSERT, UPDATE, and DELETE policies for authenticated owner on device_connections
  assert.match(mig003, /create policy "Users can view own device connections"[\s\S]*?on public\.device_connections[\s\S]*?for select/i);
  assert.match(mig003, /create policy "Users can insert own device connections"[\s\S]*?on public\.device_connections[\s\S]*?for insert/i);
  assert.match(mig003, /create policy "Users can update own device connections"[\s\S]*?on public\.device_connections[\s\S]*?for update/i);
  assert.match(mig003, /create policy "Users can delete own device connections"[\s\S]*?on public\.device_connections[\s\S]*?for delete/i);
});

test("BLK-05: 003_security_hardening.sql does not drop Fitbit columns from public.profiles", () => {
  const mig003 = fs.readFileSync("supabase/migrations/003_security_hardening.sql", "utf8");
  assert.doesNotMatch(mig003, /drop\s+column\s+if\s+exists\s+fitbit_access_token/i);
  assert.doesNotMatch(mig003, /drop\s+column\s+if\s+exists\s+fitbit_refresh_token/i);
  assert.doesNotMatch(mig003, /drop\s+column\s+if\s+exists\s+fitbit_token_expires_at/i);
  assert.doesNotMatch(mig003, /drop\s+column\s+if\s+exists\s+fitbit_user_id/i);
});

test("BLK-07 & BLK-08: 001 backfills auth.users safely as patient and 002 defines all 5 app_role values up front", () => {
  const mig001 = fs.readFileSync("supabase/migrations/001_roles_and_dispatch.sql", "utf8");
  const mig002 = fs.readFileSync("supabase/migrations/002_rbac_appointments_health.sql", "utf8");

  assert.match(mig001, /insert into public\.profiles \(id, full_name, email, role\)[\s\S]*?from auth\.users u[\s\S]*?on conflict \(id\) do update/i);
  assert.match(mig002, /CREATE TYPE public\.app_role AS ENUM \('PATIENT', 'DOCTOR', 'ADMIN', 'PARAMEDIC', 'DISPATCHER'\)/i);
});

test("BLK-09 & BLK-10: RLS policies exist for admin_profiles, doctor_availability, health_sharing_permissions, and appointment_requests DELETE", () => {
  const mig002 = fs.readFileSync("supabase/migrations/002_rbac_appointments_health.sql", "utf8");
  const mig006 = fs.readFileSync("supabase/migrations/006_appointment_rls_alignment.sql", "utf8");
  const mig007 = fs.readFileSync("supabase/migrations/007_appointment_requests.sql", "utf8");
  const mig008 = fs.readFileSync("supabase/migrations/008_admin_inquiries.sql", "utf8");

  assert.match(mig002, /CREATE POLICY "Admins view own admin profile" ON public\.admin_profiles/);
  assert.match(mig002, /CREATE POLICY "Authenticated users view doctor availability" ON public\.doctor_availability/);
  assert.match(mig002, /CREATE POLICY "Patients view own sharing permissions" ON public\.health_sharing_permissions/);
  assert.match(mig002, /CREATE POLICY "Doctors view granted sharing permissions" ON public\.health_sharing_permissions/);

  // 006 allows both PENDING and CONFIRMED on patient booking
  assert.match(mig006, /status in \('PENDING', 'CONFIRMED'\)/i);

  // 007 includes DELETE policy for account deletion
  assert.match(mig007, /CREATE POLICY "Patients can delete own appointment requests"[\s\S]*?FOR DELETE/i);

  // 008 restricts anonymous/authenticated inquiry insert to status = 'NEW'
  assert.match(mig008, /status = 'NEW'/);
});

test("authorization.ts never trusts user_metadata.role and API routes never fabricate 200 OK on DB persistence failure", () => {
  const authCode = fs.readFileSync("src/lib/authorization.ts", "utf8");
  assert.doesNotMatch(authCode, /const userMetadataRole = \(user\.user_metadata\?\.role/);

  const inquiryRoute = fs.readFileSync("src/app/api/admin/inquiries/route.ts", "utf8");
  assert.doesNotMatch(inquiryRoute, /Fallback gracefully so patient receives a tracked reference/i);

  const hospitalBookRoute = fs.readFileSync("src/app/api/hospitals/book/route.ts", "utf8");
  assert.doesNotMatch(hospitalBookRoute, /TRIAGE-\$\{Date\.now\(\)\}/);

  const patchReqRoute = fs.readFileSync("src/app/api/appointment-requests/[id]/route.ts", "utf8");
  assert.doesNotMatch(patchReqRoute, /If not found in DB \(e\.g\., transient ID/);
});
