import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const source = (p) => readFileSync(new URL("../../" + p, import.meta.url), "utf8");
test("wearable endpoint does not accept unauthenticated body.userId identity", () => {
  const code = source("src/app/api/fitbit/sos/route.ts");
  assert.match(code, /getAuthenticatedUser/);
  assert.doesNotMatch(code, /session\?\.user\?\.id\s*\|\|\s*body\.userId/);
});
test("emergency endpoint never constructs synthetic emergency id", () => {
  const code = source("src/app/api/emergencies/route.ts");
  assert.doesNotMatch(code, /emg_\$\{Date\.now\(\)\}/);
  assert.match(code, /SOS request could not be recorded/);
});
test("dispatch route goes through central authentication and transactional RPC", () => {
  const code = source("src/app/api/dispatch/route.ts");
  assert.match(code, /getAuthenticatedUser/);
  assert.match(code, /\.rpc\("dispatch_transition"/);
  assert.doesNotMatch(code, /\.auth\.getSession\(\)/);
});
test("overlap exclusion constraint included in migration", () => {
  const sql = source("supabase/migrations/004_appointment_integrity.sql");
  assert.match(sql, /exclude using gist/i);
  assert.match(sql, /tstzrange\(starts_at, ends_at/);
});
