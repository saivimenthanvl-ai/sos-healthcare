import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

test("appointment_requests table schema defines strict patient isolation and RLS", () => {
  const migration = fs.readFileSync("supabase/migrations/007_appointment_requests.sql", "utf8");
  assert.match(migration, /CREATE TABLE IF NOT EXISTS public\.appointment_requests/);
  assert.match(migration, /patient_id UUID NOT NULL REFERENCES auth\.users\(id\)/);
  assert.match(migration, /ALTER TABLE public\.appointment_requests ENABLE ROW LEVEL SECURITY/);
  assert.match(migration, /CREATE POLICY "Patients can view own appointment requests"/);
  assert.match(migration, /CREATE POLICY "Patients can update own appointment requests"/);
});

test("custom booking route strictly prevents external hospital API calls", () => {
  const routeCode = fs.readFileSync("src/app/api/appointment-requests/route.ts", "utf8");
  // Ensure no external hospital endpoints, EHR/EMR or external hospital sync
  assert.equal(routeCode.includes("fetch('http"), false);
  assert.equal(routeCode.includes('fetch("http'), false);
  assert.match(routeCode, /This request is saved only in SOS Healthcare/);
});

test("appointment-requests patch strictly enforces cancellation rules and ownership", () => {
  const patchCode = fs.readFileSync("src/app/api/appointment-requests/[id]/route.ts", "utf8");
  assert.match(patchCode, /existing\.status === "CANCELLED"/);
  assert.match(patchCode, /existing\.patient_id !== user\.id/);
  assert.match(patchCode, /status: "CANCELLED"/);
  assert.match(patchCode, /cancelled_at:/);
});

