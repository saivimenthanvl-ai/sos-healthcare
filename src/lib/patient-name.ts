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
        return "ಸಾಯಿ ವಿಮೆಂಥನ್";
      case "fa":
      case "ar":
        return "سای ویمنتان";
      default:
        return "Sai Vimenthan";
    }
  }

  return fullName;
}
