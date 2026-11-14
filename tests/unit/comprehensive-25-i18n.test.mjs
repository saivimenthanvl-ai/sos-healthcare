import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, "../..");

const ALL_25_LANGUAGES = [
  "en", "ta", "hi", "es", "fr", "ar",
  "pl", "ru", "te", "ml", "pa", "bn",
  "kn", "sr", "hr", "nl", "as", "pt",
  "fa", "zh-Hans", "ja", "ko", "it", "mr", "zh-Hant"
];

test("i18n defines all 25 languages with complete schema coverage", async () => {
  const { SUPPORTED_LANGUAGES, translations } = await import("../../src/lib/i18n.ts");

  assert.equal(SUPPORTED_LANGUAGES.length, 25);
  assert.equal(Object.keys(translations).length, 25);

  for (const code of ALL_25_LANGUAGES) {
    const lang = SUPPORTED_LANGUAGES.find((l) => l.code === code);
    assert.ok(lang, `Language ${code} must be defined in SUPPORTED_LANGUAGES`);
    assert.ok(translations[code], `Translation dictionary for ${code} must exist`);

    const dict = translations[code];
    assert.ok(dict.common.appName, `${code} missing appName`);
    assert.ok(dict.footer.legalSupport, `${code} missing footer.legalSupport`);
    assert.ok(dict.footer.privacyPolicy, `${code} missing footer.privacyPolicy`);
    assert.ok(dict.footer.termsOfService, `${code} missing footer.termsOfService`);
    assert.ok(dict.footer.emergencyInfo, `${code} missing footer.emergencyInfo`);
    assert.ok(dict.footer.backToTop, `${code} missing footer.backToTop`);
    assert.ok(dict.emergencyErrors.retry, `${code} missing emergencyErrors.retry`);
    assert.ok(dict.emergencyErrors.schemaSyncDesc, `${code} missing emergencyErrors.schemaSyncDesc`);
    assert.ok(dict.appointments.title, `${code} missing appointments.title`);
    assert.ok(dict.appointments.tabCustomRequests, `${code} missing appointments.tabCustomRequests`);
    assert.ok(dict.appointments.tabSpecialistConsultations, `${code} missing appointments.tabSpecialistConsultations`);
    assert.ok(dict.appointments.medicalSafetyNoticeBody, `${code} missing appointments.medicalSafetyNoticeBody`);
    assert.ok(dict.hospitals.title, `${code} missing hospitals.title`);
  }

  // Check Arabic and Persian are RTL
  const ar = SUPPORTED_LANGUAGES.find((l) => l.code === "ar");
  const fa = SUPPORTED_LANGUAGES.find((l) => l.code === "fa");
  assert.equal(ar?.dir, "rtl");
  assert.equal(fa?.dir, "rtl");

  // Check Chinese Traditional vs Simplified distinction
  const zhHans = SUPPORTED_LANGUAGES.find((l) => l.code === "zh-Hans");
  const zhHant = SUPPORTED_LANGUAGES.find((l) => l.code === "zh-Hant");
  assert.ok(zhHans);
  assert.ok(zhHant);
  assert.notEqual(zhHans.nativeName, zhHant.nativeName);
});

test("Spanish dashboard emergency error strings are localized and not in English", async () => {
  const { translations } = await import("../../src/lib/i18n.ts");
  const es = translations.es;

  assert.equal(es.emergencyErrors.recentEmergencies, "Emergencias recientes");
  assert.equal(es.emergencyErrors.retry, "Reintentar");
  assert.equal(es.emergencyErrors.noEmergencies, "No hay emergencias registradas");
  assert.equal(es.emergencyErrors.schemaSyncTitle, "Aviso del servicio de emergencia");
  assert.equal(es.emergencyErrors.schemaSyncDesc, "El historial de emergencias no está disponible temporalmente mientras se sincroniza el servicio.");
  assert.equal(es.footer.legalSupport, "Información legal y asistencia");
  assert.equal(es.footer.privacyPolicy, "Política de privacidad");
  assert.equal(es.footer.termsOfService, "Términos del servicio");
  assert.equal(es.footer.supportDesk, "Servicio de asistencia y privacidad");
  assert.equal(es.footer.backToTop, "Volver arriba");
});

test("Appointments page uses localized strings and truthful privacy disclaimers", () => {
  const pagePath = path.join(root, "src/app/(main)/appointments/page.tsx");
  const pageCode = fs.readFileSync(pagePath, "utf8");

  // Verify useLanguage import and usage
  assert.match(pageCode, /useLanguage/);
  assert.match(pageCode, /t\.appointments\.title/);
  assert.match(pageCode, /t\.appointments\.medicalSafetyNoticeTitle/);
  assert.match(pageCode, /t\.appointments\.tabCustomRequests/);
  assert.match(pageCode, /t\.appointments\.tabSpecialistConsultations/);

  // Verify truthful planning statement
  assert.match(pageCode, /privacyNoticeBody/);
  assert.doesNotMatch(pageCode, /Privacy Guarantee: Your custom appointment requests are saved strictly inside SOS Healthcare for your planning\. They are never sent to external hospital/);
});
