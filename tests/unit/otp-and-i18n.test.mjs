import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, "../..");

const ALL_22_LANGUAGES = [
  "en", "ta", "hi", "es", "fr", "ar",
  "pl", "ru", "te", "ml", "pa", "bn",
  "kn", "sr", "hr", "nl", "as", "pt",
  "fa", "zh-Hans", "ja", "ko"
];

test("i18n defines all 22 required languages with proper native scripts and RTL for Arabic & Persian", () => {
  const i18nPath = path.join(root, "src/lib/i18n.ts");
  const i18nCode = fs.readFileSync(i18nPath, "utf8");

  assert.equal(ALL_22_LANGUAGES.length, 22);

  for (const code of ALL_22_LANGUAGES) {
    assert.match(i18nCode, new RegExp(`code:\\s*"${code}"`));
  }

  // Check RTL for Arabic and Persian
  assert.match(i18nCode, /code:\s*"ar"[^}]+dir:\s*"rtl"/);
  assert.match(i18nCode, /code:\s*"fa"[^}]+dir:\s*"rtl"/);

  // Check contactAdmin key presence in schemas
  assert.match(i18nCode, /contactAdmin:/);
});

test("privacy policy and terms of service focus on patient healthcare rules with no project URLs in body", () => {
  const privacyPath = path.join(root, "src/app/(legal)/privacy-policy/page.tsx");
  const privacyCode = fs.readFileSync(privacyPath, "utf8");
  assert.doesNotMatch(privacyCode, /fyzer/i);
  assert.doesNotMatch(privacyCode, /vercel\.app/);
  assert.doesNotMatch(privacyCode, /localhost/);
  assert.match(privacyCode, /admin@soshospital\.com/);
  assert.match(privacyCode, /Contact Administrator/);
  assert.match(privacyCode, /Patient Information Safeguards/);
  assert.match(privacyCode, /are not automatically submitted to hospitals/);

  const termsPath = path.join(root, "src/app/(legal)/terms-of-service/page.tsx");
  const termsCode = fs.readFileSync(termsPath, "utf8");
  assert.doesNotMatch(termsCode, /fyzer/i);
  assert.doesNotMatch(termsCode, /vercel\.app/);
  assert.doesNotMatch(termsCode, /localhost/);
  assert.match(termsCode, /admin@soshospital\.com/);
  assert.match(termsCode, /By accessing, registering for, or using SOS Healthcare services/);
  assert.match(termsCode, /Administrative Contact/);
});

test("legal layout avoids duplicate numbering and clipped headings", () => {
  const layoutPath = path.join(root, "src/components/legal/LegalLayout.tsx");
  const layoutCode = fs.readFileSync(layoutPath, "utf8");
  assert.match(layoutCode, /pt-12 pb-14 sm:pt-16 sm:pb-20/);

  const sectionPath = path.join(root, "src/components/legal/LegalSection.tsx");
  const sectionCode = fs.readFileSync(sectionPath, "utf8");
  assert.match(sectionCode, /scroll-mt-28/);
  assert.match(sectionCode, /displayHeading/);
});

test("contact administrator modal and API route are implemented securely", () => {
  const modalPath = path.join(root, "src/components/ContactAdminModal.tsx");
  const modalCode = fs.readFileSync(modalPath, "utf8");
  assert.match(modalCode, /Please do not submit medical reports/);
  assert.match(modalCode, /Send Message/);
  assert.match(modalCode, /INQ-/);

  const apiPath = path.join(root, "src/app/api/admin/inquiries/route.ts");
  const apiCode = fs.readFileSync(apiPath, "utf8");
  assert.match(apiCode, /admin_inquiries/);
  assert.match(apiCode, /isRateLimited/);
  assert.match(apiCode, /generateReferenceCode/);
  assert.match(apiCode, /role_v2 === "ADMIN"/);
});

test("localized patient name helper maps approved transliterations", () => {
  const helperPath = path.join(root, "src/lib/patient-name.ts");
  const helperCode = fs.readFileSync(helperPath, "utf8");
  assert.match(helperCode, /சாய் விமெந்தன்/);
  assert.match(helperCode, /साई विमेंथन/);
  assert.match(helperCode, /సాయి విమెంతన్/);
  assert.match(helperCode, /സായ് വിമെന്തൻ/);
  assert.match(helperCode, /ಸಾಯಿ ವಿಮೆಂಥನ್/);
  assert.match(helperCode, /سای ویمنتان/);
});
