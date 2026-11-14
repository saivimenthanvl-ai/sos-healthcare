import fs from "fs";
import { translations, SUPPORTED_LANGUAGES } from "../src/lib/i18n.ts";
import { footerAdditions, emergencyErrors, appointmentsI18n, hospitalsI18n } from "./i18n-definitions.mjs";
import { newLangTranslations } from "./new-languages.mjs";

const ALL_25_LANGUAGES = [
  { code: "en", name: "English", nativeName: "English", dir: "ltr" },
  { code: "ta", name: "Tamil", nativeName: "தமிழ்", dir: "ltr" },
  { code: "hi", name: "Hindi", nativeName: "हिन्दी", dir: "ltr" },
  { code: "es", name: "Spanish", nativeName: "Español", dir: "ltr" },
  { code: "fr", name: "French", nativeName: "Français", dir: "ltr" },
  { code: "ar", name: "Arabic", nativeName: "العربية", dir: "rtl" },
  { code: "pl", name: "Polish", nativeName: "Polski", dir: "ltr" },
  { code: "ru", name: "Russian", nativeName: "Русский", dir: "ltr" },
  { code: "te", name: "Telugu", nativeName: "తెలుగు", dir: "ltr" },
  { code: "ml", name: "Malayalam", nativeName: "മലയാളം", dir: "ltr" },
  { code: "pa", name: "Punjabi", nativeName: "ਪੰਜਾਬੀ", dir: "ltr" },
  { code: "bn", name: "Bengali", nativeName: "বাংলা", dir: "ltr" },
  { code: "kn", name: "Kannada", nativeName: "ಕನ್ನಡ", dir: "ltr" },
  { code: "sr", name: "Serbian", nativeName: "Српски", dir: "ltr" },
  { code: "hr", name: "Croatian", nativeName: "Hrvatski", dir: "ltr" },
  { code: "nl", name: "Dutch", nativeName: "Nederlands", dir: "ltr" },
  { code: "as", name: "Assamese", nativeName: "অসমীয়া", dir: "ltr" },
  { code: "pt", name: "Portuguese", nativeName: "Português", dir: "ltr" },
  { code: "fa", name: "Persian", nativeName: "فارسی", dir: "rtl" },
  { code: "zh-Hans", name: "Simplified Chinese", nativeName: "简体中文", dir: "ltr" },
  { code: "ja", name: "Japanese", nativeName: "日本語", dir: "ltr" },
  { code: "ko", name: "Korean", nativeName: "한국어", dir: "ltr" },
  { code: "it", name: "Italian", nativeName: "Italiano", dir: "ltr" },
  { code: "mr", name: "Marathi", nativeName: "मराठी", dir: "ltr" },
  { code: "zh-Hant", name: "Traditional Chinese", nativeName: "繁體中文", dir: "ltr" },
];

console.log("Assembling comprehensive i18n file for 25 languages...");

const combinedTranslations = {};

for (const lang of ALL_25_LANGUAGES) {
  const code = lang.code;
  let baseDict = translations[code];
  if (!baseDict) {
    baseDict = newLangTranslations[code];
  }

  if (!baseDict) {
    throw new Error("Missing base dictionary for: " + code);
  }

  // Deep clone
  const dict = JSON.parse(JSON.stringify(baseDict));

  // Merge footer additions
  const footerExtra = footerAdditions[code] || footerAdditions.en;
  dict.footer = {
    ...dict.footer,
    ...footerExtra
  };

  // Merge emergency errors
  const errExtra = emergencyErrors[code] || emergencyErrors.en;
  dict.emergencyErrors = errExtra;

  // Merge appointments
  const apptExtra = appointmentsI18n[code] || appointmentsI18n.en;
  dict.appointments = apptExtra;

  // Merge hospitals
  const hospExtra = hospitalsI18n[code] || hospitalsI18n.en;
  dict.hospitals = hospExtra;

  // Ensure dashboard recent emergencies & no emergencies strings are accurate
  if (errExtra.recentEmergencies) dict.dashboard.recentEmergencies = errExtra.recentEmergencies;
  if (errExtra.noEmergencies) dict.dashboard.noEmergencies = errExtra.noEmergencies;
  if (errExtra.noEmergenciesSub) dict.dashboard.noEmergenciesSub = errExtra.noEmergenciesSub;
  if (errExtra.newEmergency) dict.dashboard.newEmergency = errExtra.newEmergency;

  combinedTranslations[code] = dict;
}

const outContent = `export type SupportedLanguage =
  | "en"
  | "ta"
  | "hi"
  | "es"
  | "fr"
  | "ar"
  | "pl"
  | "ru"
  | "te"
  | "ml"
  | "pa"
  | "bn"
  | "kn"
  | "sr"
  | "hr"
  | "nl"
  | "as"
  | "pt"
  | "fa"
  | "zh-Hans"
  | "ja"
  | "ko"
  | "it"
  | "mr"
  | "zh-Hant";

export interface LanguageOption {
  code: SupportedLanguage;
  name: string;
  nativeName: string;
  dir: "ltr" | "rtl";
}

export const SUPPORTED_LANGUAGES: LanguageOption[] = [
${ALL_25_LANGUAGES.map((l) => `  { code: "${l.code}", name: "${l.name}", nativeName: "${l.nativeName}", dir: "${l.dir}" },`).join("\n")}
];

export interface TranslationSchema {
  common: {
    appName: string;
    tagline: string;
    loading: string;
    save: string;
    saved: string;
    cancel: string;
    call: string;
    details: string;
    bookCustom: string;
    signIn: string;
    signOut: string;
    dashboard: string;
    emergency: string;
    hospitals: string;
    appointments: string;
    devices: string;
    profile: string;
    settings: string;
    language: string;
    contactAdmin: string;
  };
  nav: {
    dashboard: string;
    emergency: string;
    hospitals: string;
    appointments: string;
    health: string;
    devices: string;
    profile: string;
    more: string;
  };
  dashboard: {
    greeting: string;
    defaultGreeting: string;
    heroSubtitle: string;
    locating: string;
    locationReady: string;
    locationUnavailable: string;
    sosButtonLabel: string;
    call112Title: string;
    call112Desc: string;
    call112Action: string;
    coreServicesTitle: string;
    coreServicesDesc: string;
    card1Title: string;
    card1Desc: string;
    card1Bullet1: string;
    card1Bullet2: string;
    card1Action: string;
    card2Title: string;
    card2Desc: string;
    card2Bullet1: string;
    card2Bullet2: string;
    card2Action: string;
    card3Title: string;
    card3Desc: string;
    card3Bullet1: string;
    card3Bullet2: string;
    card3Action: string;
    card4Title: string;
    card4Desc: string;
    card4Bullet1: string;
    card4Bullet2: string;
    card4Action: string;
    recentEmergencies: string;
    newEmergency: string;
    noEmergencies: string;
    noEmergenciesSub: string;
    quickNav: string;
  };
  auth: {
    emailOtpTitle: string;
    emailOtpSubtitle: string;
    emailLabel: string;
    emailPlaceholder: string;
    sendOtp: string;
    sendingOtp: string;
    enterOtpTitle: string;
    enterOtpSubtitle: string;
    otpLabel: string;
    otpPlaceholder: string;
    verifyOtp: string;
    verifying: string;
    resendCode: string;
    resendCooldown: string;
    changeEmail: string;
    orPasswordLogin: string;
    orOtpLogin: string;
    googleSignIn: string;
    invalidOtp: string;
    otpSentSuccess: string;
  };
  footer: {
    summary: string;
    statusActive: string;
    emergencyDial: string;
    emergencyLine: string;
    disclaimer: string;
    coreServices: string;
    legalSupport: string;
    privacyPolicy: string;
    termsOfService: string;
    contactAdmin: string;
    supportDesk: string;
    emergencyInfo: string;
    backToTop: string;
    callImmediate: string;
    dialInfo: string;
  };
  emergencyErrors: {
    recentEmergencies: string;
    retry: string;
    noEmergencies: string;
    noEmergenciesSub: string;
    newEmergency: string;
    authErrorTitle: string;
    authErrorDesc: string;
    schemaSyncTitle: string;
    schemaSyncDesc: string;
    netErrorTitle: string;
    netErrorDesc: string;
    unavailableTitle: string;
    unavailableDesc: string;
  };
  appointments: {
    title: string;
    description: string;
    tabCustomRequests: string;
    tabSpecialistConsultations: string;
    medicalSafetyNoticeTitle: string;
    medicalSafetyNoticeBody: string;
    yourPlannedRequests: string;
    yourPlannedRequestsSub: string;
    newCustomBooking: string;
    privacyNoticeTitle: string;
    privacyNoticeBody: string;
    loadingRequests: string;
    noRequests: string;
    browseHospitalsToPlan: string;
    reschedule: string;
    cancelRequest: string;
    cancelling: string;
    saveNewDate: string;
    saving: string;
    rescheduleTitle: string;
    bookSpecialistTitle: string;
    loadingSpecialists: string;
    selectSpecialistHospital: string;
    appointmentDate: string;
    availableSlot: string;
    reasonForConsultation: string;
    reasonPlaceholder: string;
    confirmReservation: string;
    reservingSlot: string;
    assignedConsultations: string;
    noConsultations: string;
    consultationVirtual: string;
    consultationInPerson: string;
  };
  hospitals: {
    title: string;
    subtitleGps: string;
    subtitleNoLocation: string;
    enableLocationTitle: string;
    enableLocationDesc: string;
    allowLocationAccess: string;
    locationErrorPrefix: string;
    searchPlaceholder: string;
    kmRadius: string;
    listView: string;
    mapView: string;
    noMatchSearch: string;
    grantLocationPrompt: string;
    noHospitalsInRadius: string;
    clearSearch: string;
    bookingSubmitted: string;
    dismiss: string;
  };
}

export const translations: Record<SupportedLanguage, TranslationSchema> = ${JSON.stringify(combinedTranslations, null, 2)};
`;

fs.writeFileSync("src/lib/i18n.ts", outContent, "utf8");
console.log("Successfully generated src/lib/i18n.ts with all 25 languages!");
