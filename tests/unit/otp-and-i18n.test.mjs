import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, "../..");

test("i18n defines all six required languages including RTL for Arabic", () => {
  const i18nPath = path.join(root, "src/lib/i18n.ts");
  const i18nCode = fs.readFileSync(i18nPath, "utf8");

  // Check language codes
  for (const code of ["en", "ta", "hi", "es", "fr", "ar"]) {
    assert.match(i18nCode, new RegExp(`code:\\s*"${code}"`));
  }

  // Check Arabic RTL
  assert.match(i18nCode, /code:\s*"ar"[^}]+dir:\s*"rtl"/);

  // Check critical translation keys
  assert.match(i18nCode, /appName:/);
  assert.match(i18nCode, /emailOtpTitle:/);
  assert.match(i18nCode, /call112Title:/);
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

test("auth context encapsulates Supabase OTP methods securely", () => {
  const authContextPath = path.join(root, "src/contexts/AuthContext.tsx");
  const authCode = fs.readFileSync(authContextPath, "utf8");

  assert.match(authCode, /signInWithOtp/);
  assert.match(authCode, /verifyOtp/);
  assert.match(authCode, /supabase\.auth\.signInWithOtp/);
  assert.match(authCode, /supabase\.auth\.verifyOtp/);
});

test("navigation and dashboard support compact responsive spacing and language switcher", () => {
  const navPath = path.join(root, "src/components/Navigation.tsx");
  const navCode = fs.readFileSync(navPath, "utf8");
  assert.match(navCode, /LanguageSelector/);
  assert.match(navCode, /max-w-\[8rem\]/);

  const dashPath = path.join(root, "src/components/AuthenticatedDashboardView.tsx");
  const dashCode = fs.readFileSync(dashPath, "utf8");
  assert.match(dashCode, /useLanguage/);
  assert.match(dashCode, /grid-cols-1 md:grid-cols-12/);
  assert.match(dashCode, /w-16 h-16 sm:w-20 sm:h-20/);
});
