import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, "../..");

const supportedLangs = [
  "en", "ta", "hi", "es", "fr", "ar", "pl", "ru", "te", "ml",
  "pa", "bn", "kn", "sr", "hr", "nl", "as", "pt", "fa", "zh-Hans",
  "ja", "ko", "it", "mr", "zh-Hant"
];

test("contact modal translations contain all required fields across all 25 languages", async () => {
  const { contactModalTranslations } = await import("../../src/lib/i18n/contact-content.ts");
  
  for (const lang of supportedLangs) {
    const tm = contactModalTranslations[lang];
    assert.ok(tm, `Missing modal translations for language: ${lang}`);
    assert.ok(tm.title && tm.title.length > 0, `Missing title in modal for ${lang}`);
    assert.ok(tm.subtitle && tm.subtitle.length > 0, `Missing subtitle in modal for ${lang}`);
    assert.ok(tm.notice && tm.notice.length > 0, `Missing notice in modal for ${lang}`);
    assert.ok(tm.fullNameLabel && tm.fullNameLabel.length > 0, `Missing fullNameLabel in modal for ${lang}`);
    assert.ok(tm.emailLabel && tm.emailLabel.length > 0, `Missing emailLabel in modal for ${lang}`);
    assert.ok(tm.categoryLabel && tm.categoryLabel.length > 0, `Missing categoryLabel in modal for ${lang}`);
    assert.ok(tm.categories?.general, `Missing category general in modal for ${lang}`);
    assert.ok(tm.categories?.hospital_correction, `Missing category hospital_correction in modal for ${lang}`);
    assert.ok(tm.categories?.appointment_assistance, `Missing category appointment_assistance in modal for ${lang}`);
    assert.ok(tm.categories?.privacy_data_request, `Missing category privacy_data_request in modal for ${lang}`);
    assert.ok(tm.categories?.account_assistance, `Missing category account_assistance in modal for ${lang}`);
    assert.ok(tm.messageLabel && tm.messageLabel.length > 0, `Missing messageLabel in modal for ${lang}`);
    assert.ok(tm.consentText && tm.consentText.length > 0, `Missing consentText in modal for ${lang}`);
    assert.ok(tm.cancelButton && tm.cancelButton.length > 0, `Missing cancelButton in modal for ${lang}`);
    assert.ok(tm.sendButton && tm.sendButton.length > 0, `Missing sendButton in modal for ${lang}`);
    assert.ok(tm.sendingButton && tm.sendingButton.length > 0, `Missing sendingButton in modal for ${lang}`);
    assert.ok(tm.errorRequired && tm.errorRequired.length > 0, `Missing errorRequired in modal for ${lang}`);
    assert.ok(tm.successTitle && tm.successTitle.length > 0, `Missing successTitle in modal for ${lang}`);
    assert.ok(tm.successMessage && tm.successMessage.length > 0, `Missing successMessage in modal for ${lang}`);
    assert.ok(tm.successDeskNote && tm.successDeskNote.length > 0, `Missing successDeskNote in modal for ${lang}`);
    assert.ok(tm.closeButton && tm.closeButton.length > 0, `Missing closeButton in modal for ${lang}`);
  }
});

test("contact page translations contain all required fields across all 25 languages", async () => {
  const { contactPageTranslations } = await import("../../src/lib/i18n/contact-content.ts");
  
  for (const lang of supportedLangs) {
    const cp = contactPageTranslations[lang];
    assert.ok(cp, `Missing contact page translations for language: ${lang}`);
    assert.ok(cp.title && cp.title.length > 0, `Missing title in contact page for ${lang}`);
    assert.ok(cp.subtitle && cp.subtitle.length > 0, `Missing subtitle in contact page for ${lang}`);
    assert.ok(cp.emergencyNoticeTitle && cp.emergencyNoticeTitle.length > 0, `Missing emergency notice title for ${lang}`);
    assert.ok(cp.emergencyNoticeText && cp.emergencyNoticeText.length > 0, `Missing emergency notice text for ${lang}`);
    assert.ok(cp.getInTouchHeading && cp.getInTouchHeading.length > 0, `Missing get in touch heading for ${lang}`);
    assert.ok(cp.getInTouchDescription && cp.getInTouchDescription.length > 0, `Missing get in touch description for ${lang}`);
    assert.ok(cp.supportDeskLabel && cp.supportDeskLabel.length > 0, `Missing support desk label for ${lang}`);
    assert.equal(cp.supportDeskEmail, "admin@soshospital.com", `Support desk email must be admin@soshospital.com for ${lang}`);
    assert.ok(cp.directMessageHeading && cp.directMessageHeading.length > 0, `Missing direct message heading for ${lang}`);
    assert.ok(cp.emailDraftSentSuccess && cp.emailDraftSentSuccess.length > 0, `Missing email draft success for ${lang}`);
    assert.ok(cp.emailLabel && cp.emailLabel.length > 0, `Missing email label for ${lang}`);
    assert.ok(cp.messageLabel && cp.messageLabel.length > 0, `Missing message label for ${lang}`);
    assert.ok(cp.sendButton && cp.sendButton.length > 0, `Missing send button for ${lang}`);
  }
});

test("legal documents contain all 17 privacy sections and 19 terms sections across all 25 languages", async () => {
  for (const lang of supportedLangs) {
    const filePath = path.join(root, `src/lib/i18n/legal/${lang}.json`);
    assert.ok(fs.existsSync(filePath), `Missing legal file for ${lang}`);
    const bundle = JSON.parse(fs.readFileSync(filePath, "utf8"));
    
    // Privacy assertions
    assert.equal(bundle.privacy.sections.length, 17, `Privacy policy in ${lang} must have exactly 17 sections`);
    assert.ok(bundle.privacy.title && bundle.privacy.title.length > 0, `Privacy title missing for ${lang}`);
    assert.ok(bundle.privacy.subtitle && bundle.privacy.subtitle.length > 0, `Privacy subtitle missing for ${lang}`);
    assert.ok(bundle.privacy.lastUpdated && bundle.privacy.lastUpdated.length > 0, `Privacy lastUpdated missing for ${lang}`);
    assert.ok(bundle.privacy.notice?.title, `Privacy notice missing for ${lang}`);

    // Terms assertions
    assert.equal(bundle.terms.sections.length, 19, `Terms of service in ${lang} must have exactly 19 sections`);
    assert.ok(bundle.terms.title && bundle.terms.title.length > 0, `Terms title missing for ${lang}`);
    assert.ok(bundle.terms.subtitle && bundle.terms.subtitle.length > 0, `Terms subtitle missing for ${lang}`);
    assert.ok(bundle.terms.lastUpdated && bundle.terms.lastUpdated.length > 0, `Terms lastUpdated missing for ${lang}`);
    assert.ok(bundle.terms.notice?.title, `Terms notice missing for ${lang}`);
  }
});

test("dashboard sosBroadcastDesc exists and is non-empty across all 25 languages", async () => {
  const { translations } = await import("../../src/lib/i18n.ts");

  for (const lang of supportedLangs) {
    const t = translations[lang];
    assert.ok(t, `Missing translations for ${lang}`);
    assert.ok(t.dashboard.sosBroadcastDesc, `Missing dashboard.sosBroadcastDesc for ${lang}`);
    assert.ok(t.dashboard.sosBroadcastDesc.length > 10, `sosBroadcastDesc too short for ${lang}`);
  }
});
