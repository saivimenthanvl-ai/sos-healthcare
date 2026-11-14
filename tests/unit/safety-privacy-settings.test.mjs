import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

test("emergency page provides truthful protocol disclaimer without unverified response-time claims", () => {
  const code = fs.readFileSync("src/app/(main)/emergency/page.tsx", "utf8");
  assert.doesNotMatch(
    code,
    /Response time:\s*10-20\s*minutes/i,
    "Emergency page must not promise 10-20 minutes response time"
  );
  assert.match(
    code,
    /Emergency Guidance & Contact Alert/i,
    "Emergency page must accurately describe itself as Emergency Guidance & Contact Alert"
  );
  assert.match(
    code,
    /does not replace official municipal ambulance dispatch/i,
    "Emergency page must clearly state it does not replace official emergency services"
  );
});

test("hospital card labels directory facilities accurately without fabricated accreditation", () => {
  const code = fs.readFileSync("src/components/HospitalCard.tsx", "utf8");
  assert.doesNotMatch(
    code,
    /Accredited Health Center/i,
    "Hospital card must not claim all hospitals are accredited health centers"
  );
  assert.match(
    code,
    /Directory Listing \(Verify Details\)/i,
    "Hospital card must clearly instruct patients to verify directory listing details"
  );
});

test("settings provides cookie preferences, privacy defaults, data export, and deletion workflows", () => {
  const code = fs.readFileSync("src/app/(main)/settings/page.tsx", "utf8");
  assert.match(code, /Strictly Essential Cookies/);
  assert.match(code, /Optional Anonymous Performance & Analytics/);
  assert.match(code, /Export My Data Archive/);
  assert.match(code, /Permanently Delete Account/);
  assert.match(code, /DELETE_MY_ACCOUNT/);
});

test("export-data and delete-account API endpoints enforce server-side authentication", () => {
  const exportRoute = fs.readFileSync("src/app/api/auth/export-data/route.ts", "utf8");
  assert.match(exportRoute, /getAuthenticatedUser/);
  assert.match(exportRoute, /exportBundle/);

  const deleteRoute = fs.readFileSync("src/app/api/auth/delete-account/route.ts", "utf8");
  assert.match(deleteRoute, /getAuthenticatedUser/);
  assert.match(deleteRoute, /DELETE_MY_ACCOUNT/);
});

test("contact page displays official admin email admin@soshospital.com and emergency warning", () => {
  const code = fs.readFileSync("src/app/(legal)/contact/page.tsx", "utf8");
  assert.match(code, /admin@soshospital\.com/);
  assert.doesNotMatch(code, /admin@sos-healthcare\.vercel\.app/);
  assert.match(code, /Immediate Medical Emergency/);
});
