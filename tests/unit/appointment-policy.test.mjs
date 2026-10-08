import test from "node:test";
import assert from "node:assert/strict";
import { canTransition, isValidInterval } from "../../src/features/appointments/appointment-policy.mjs";

const appointment = { patient_id: "p1", doctor_id: "d1", status: "CONFIRMED" };
test("patient can cancel only own active booking", () => {
  assert.equal(canTransition("PATIENT", "p1", appointment, "CANCELLED"), true);
  assert.equal(canTransition("PATIENT", "p2", appointment, "CANCELLED"), false);
  assert.equal(canTransition("PATIENT", "p1", appointment, "COMPLETED"), false);
});
test("doctor must be assigned and cannot cancel as doctor", () => {
  assert.equal(canTransition("DOCTOR", "d1", appointment, "COMPLETED"), true);
  assert.equal(canTransition("DOCTOR", "d2", appointment, "COMPLETED"), false);
  assert.equal(canTransition("DOCTOR", "d1", appointment, "CANCELLED"), false);
});
test("terminal appointments cannot transition", () => {
  assert.equal(canTransition("ADMIN", "admin", { ...appointment, status: "COMPLETED" }, "CONFIRMED"), false);
});
test("reject overlapping/invalid clock input at request boundary", () => {
  assert.equal(isValidInterval("not-a-date", "2100-01-01T00:30:00Z"), false);
  assert.equal(isValidInterval("2100-01-01T01:00:00Z", "2100-01-01T00:00:00Z"), false);
  assert.equal(isValidInterval("2100-01-01T00:00:00Z", "2100-01-01T00:30:00Z"), true);
});
