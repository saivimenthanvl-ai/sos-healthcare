import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, "../..");

const EXPECTED_LANGUAGES = [
  "en", "ta", "hi", "es", "fr", "ar",
  "pl", "ru", "te", "ml", "pa", "bn",
  "kn", "sr", "hr", "nl", "as"
];

test("i18n defines all 17 required languages with proper native scripts and RTL for Arabic", () => {
  const i18nPath = path.join(root, "src/lib/i18n.ts");
  const i18nCode = fs.readFileSync(i18nPath, "utf8");

  assert.equal(EXPECTED_LANGUAGES.length, 17);

  // Check language codes
  for (const code of EXPECTED_LANGUAGES) {
    assert.match(i18nCode, new RegExp(`code:\\s*"${code}"`));
  }

  // Check Arabic RTL
  assert.match(i18nCode, /code:\s*"ar"[^}]+dir:\s*"rtl"/);

  // Check critical translation keys
  assert.match(i18nCode, /appName:/);
  assert.match(i18nCode, /emailOtpTitle:/);
  assert.match(i18nCode, /call112Title:/);
});

test("privacy policy and terms of service accurately represent SOS Healthcare without Fyzer references", () => {
  const privacyPath = path.join(root, "src/app/(legal)/privacy-policy/page.tsx");
  const privacyCode = fs.readFileSync(privacyPath, "utf8");
  assert.doesNotMatch(privacyCode, /fyzer/i);
  assert.match(privacyCode, /SOS Healthcare/);
  assert.match(privacyCode, /Private Custom Appointment Requests/);
  assert.match(privacyCode, /Google Health & Wearable Integrations/);

  const termsPath = path.join(root, "src/app/(legal)/terms-of-service/page.tsx");
  const termsCode = fs.readFileSync(termsPath, "utf8");
  assert.doesNotMatch(termsCode, /fyzer/i);
  assert.match(termsCode, /SOS Healthcare/);
  assert.match(termsCode, /Emergency Assistance & 112 Telephone Guidance/);
  assert.match(termsCode, /No Implied Hospital Endorsement/);

  const contactPath = path.join(root, "src/app/(legal)/contact/page.tsx");
  const contactCode = fs.readFileSync(contactPath, "utf8");
  assert.doesNotMatch(contactCode, /fyzer/i);
});

test("legal layout provides proper scroll margins and clean public header", () => {
  const layoutPath = path.join(root, "src/app/(legal)/layout.tsx");
  const layoutCode = fs.readFileSync(layoutPath, "utf8");
  assert.match(layoutCode, /LanguageSelector/);
  assert.match(layoutCode, /SosLogo/);

  const sectionPath = path.join(root, "src/components/legal/LegalSection.tsx");
  const sectionCode = fs.readFileSync(sectionPath, "utf8");
  assert.match(sectionCode, /scroll-mt-24/);
});

test("login form implements Supabase signInWithOtp and verifyOtp", () => {
  const loginPath = path.join(root, "src/app/auth/login/page.tsx");
  const loginCode = fs.readFileSync(loginPath, "utf8");

  assert.match(loginCode, /signInWithOtp/);
  assert.match(loginCode, /verifyOtp/);
  assert.match(loginCode, /cooldown/);
  assert.match(loginCode, /handleSendOtp/);
  assert.match(loginCode, /handleVerifyOtp/);
  assert.match(loginCode, /otpStep === "enter-code"/);
});

test("site footer contains the four structured sections and jurisdictional emergency numbers", () => {
  const footerPath = path.join(root, "src/components/SiteFooter.tsx");
  const footerCode = fs.readFileSync(footerPath, "utf8");
  assert.match(footerCode, /SOS Healthcare/);
  assert.match(footerCode, /Legal & Support/);
  assert.match(footerCode, /Emergency Information/);
  assert.match(footerCode, /Call 112 \/ 911/);
  assert.doesNotMatch(footerCode, /Platform Systems Active & Monitored/);
});
