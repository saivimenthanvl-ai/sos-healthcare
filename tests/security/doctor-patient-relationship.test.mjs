import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

test("Phase 3 & Phase 4: Doctor clinical access route enforces server-side relationship verification and real database queries", () => {
  const routeCode = fs.readFileSync("src/app/api/doctor/patients/[patientId]/route.ts", "utf8");

  // 1. Validates authenticated user
  assert.match(routeCode, /getAuthenticatedUser\(request\)/);
  assert.match(routeCode, /status:\s*401/);

  // 2. Requires DOCTOR or ADMIN role
  assert.match(routeCode, /user\.role !== "DOCTOR" && user\.role !== "ADMIN"/);
  assert.match(routeCode, /status:\s*403/);

  // 3. Calls canDoctorAccessPatient to verify relationship
  assert.match(routeCode, /canDoctorAccessPatient\(user\.id, patientId\)/);

  // 4. Queries Supabase patient_profiles and health_records
  assert.match(routeCode, /from\("patient_profiles"\)/);
  assert.match(routeCode, /from\("health_records"\)/);

  // 5. Does NOT fabricate fake vitals (e.g., hardcoded 120/80 or 74 BPM)
  assert.doesNotMatch(routeCode, /120\/80/);
  assert.doesNotMatch(routeCode, /systolic:\s*["']120["']/);
});

test("Phase 3 & Phase 5: Doctor patient chart frontend queries real API and handles Unknown state without hardcoded measurements", () => {
  const pageCode = fs.readFileSync("src/app/(main)/doctor/patients/[patientId]/page.tsx", "utf8");

  // 1. Fetches from /api/doctor/patients/[patientId]
  assert.match(pageCode, /fetch\(`\/api\/doctor\/patients\/\$\{patientId\}`\)/);

  // 2. Does NOT have hardcoded 120/80 mmHg or 74 BPM in JSX
  assert.doesNotMatch(pageCode, /<p[^>]*>120\/80 mmHg<\/p>/);
  assert.doesNotMatch(pageCode, /<p[^>]*>74 BPM<\/p>/);
  assert.doesNotMatch(pageCode, /<p[^>]*>98%<\/p>/);
  assert.doesNotMatch(pageCode, /<p[^>]*>O\+ \(Positive\)<\/p>/);

  // 3. Handles unknown state properly
  assert.match(pageCode, /"Unknown"/);
});
