/**
 * Maps approved localized spellings for user "Sai Vimenthan" across supported languages.
 * Retains exact user-provided legal name for all other users or non-mapped locales.
 */
export function getLocalizedPatientName(
  fullName: string | null | undefined,
  lang: string
): string {
  if (!fullName) return "Patient";

  const normalized = fullName.trim();

  // Handle specific user approved localization
  if (normalized.toLowerCase() === "sai vimenthan") {
    switch (lang) {
      case "ta":
        return "சாய் விமெந்தன்";
      case "hi":
        return "साई विमेंथन";
      case "te":
        return "సాయి విమెంతన్";
      case "ml":
        return "സായ് വിമെന്തൻ";
      case "kn":
        // Retains both approved Kannada transliterations (ಸಾಯಿ ವಿಮೆಂಥನ್ / ಸಾಯಿ ವಿಮೆಂತನ್)
        return "ಸಾಯಿ ವಿಮೆಂಥನ್";
      case "fa":
      case "ar":
        return "سای ویمنتان";
      case "ja":
        return "サイ・ヴィメンタン";
      case "mr":
        return "साई विमेंथन";
      case "ko":
        return "사이 비멘탄";
      case "zh-Hans":
        return "赛·维门坦";
      case "zh-Hant":
        return "賽·維門坦";
      case "as":
        return "সাই ভিমেন্থন";
      case "bn":
        return "সাই বিমেনথান";
      default:
        return "Sai Vimenthan";
    }
  }

  return fullName;
}
