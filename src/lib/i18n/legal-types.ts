export interface LegalSectionContent {
  id: string;
  number: number;
  heading: string;
  notice?: {
    variant: "info" | "warning";
    title: string;
    text: string;
  };
  paragraphs: string[];
  bullets?: string[];
  subparagraphs?: string[];
  contactEmail?: string;
  contactButton?: string;
}

export interface LegalPageContent {
  title: string;
  subtitle: string;
  lastUpdated: string;
  tocTitle: string;
  notice?: {
    variant: "info" | "warning";
    title: string;
    text: string;
  };
  sections: LegalSectionContent[];
}

export interface ContactModalStrings {
  title: string;
  subtitle: string;
  notice: string;
  fullNameLabel: string;
  fullNamePlaceholder: string;
  emailLabel: string;
  emailPlaceholder: string;
  categoryLabel: string;
  categories: {
    general: string;
    hospital_correction: string;
    appointment_assistance: string;
    privacy_data_request: string;
    account_assistance: string;
  };
  messageLabel: string;
  messagePlaceholder: string;
  consentText: string;
  cancelButton: string;
  sendButton: string;
  sendingButton: string;
  errorRequired: string;
  successTitle: string;
  successMessage: string;
  successDeskNote: string;
  closeButton: string;
}

export interface ContactPageStrings {
  title: string;
  subtitle: string;
  emergencyNoticeTitle: string;
  emergencyNoticeText: string;
  getInTouchHeading: string;
  getInTouchDescription: string;
  supportDeskLabel: string;
  supportDeskEmail: string;
  directMessageHeading: string;
  emailDraftSentSuccess: string;
  emailLabel: string;
  emailPlaceholder: string;
  messageLabel: string;
  messagePlaceholder: string;
  sendButton: string;
}
