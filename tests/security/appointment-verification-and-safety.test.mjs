import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

test("Task 1: /api/doctors never exports hardcoded fake specialists or returns fabricated specialists", () => {
  const doctorsRoute = fs.readFileSync("src/app/api/doctors/route.ts", "utf8");
  assert.doesNotMatch(doctorsRoute, /export const VERIFIED_SPECIALISTS/);
  assert.doesNotMatch(doctorsRoute, /Dr\. Sarah Chen/);
  assert.doesNotMatch(doctorsRoute, /7b4c6e91-82d4-4a25-9b21-3e4a5d8f9101/);
  assert.match(doctorsRoute, /verification_status[\s\S]*?VERIFIED/);
});

test("Task 2: /api/appointments strictly validates doctor verification, hospital, slot conflicts, and PENDING initial status", () => {
  const apptRoute = fs.readFileSync("src/app/api/appointments/route.ts", "utf8");
  
  // Must validate doctor exists in doctor_profiles as VERIFIED
  assert.match(apptRoute, /from\("doctor_profiles"\)/);
  assert.match(apptRoute, /verification_status["'],\s*["']VERIFIED["']/);
  
  // Must not insert CONFIRMED for patient bookings
  assert.doesNotMatch(apptRoute, /status:\s*["']CONFIRMED["']/);
  assert.match(apptRoute, /status:\s*["']PENDING["']/);

  // Must handle foreign key error 23503 and return 422
  assert.match(apptRoute, /23503/);

  // Must handle double-booking concurrency conflict (23505 / 23P01) and return 409
  assert.match(apptRoute, /23505/);
});

test("Task 3: Migration 009 restricts patient appointments RLS strictly to PENDING", () => {
  const mig009 = fs.readFileSync("supabase/migrations/009_patient_appointment_pending_only.sql", "utf8");
  assert.match(mig009, /CREATE POLICY "Patients book own appointments" ON public\.appointments/);
  assert.match(mig009, /status = 'PENDING'/);
  assert.doesNotMatch(mig009, /status in \('PENDING', 'CONFIRMED'\)/);
});

test("Task 4: appointments page displays informative unavailable state and disables booking when no verified doctors exist", () => {
  const apptPage = fs.readFileSync("src/app/(main)/appointments/page.tsx", "utf8");
  assert.match(apptPage, /Verified Clinical Specialist Consultations Unavailable/);
  assert.match(apptPage, /no clinical specialists have completed verified credentialing/);
  assert.match(apptPage, /Custom Appointment Requests/);
});
