"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import {
  SupportedLanguage,
  SUPPORTED_LANGUAGES,
  translations,
  LanguageOption,
} from "@/lib/i18n";

interface LanguageContextType {
  language: SupportedLanguage;
  setLanguage: (lang: SupportedLanguage) => void;
  dir: "ltr" | "rtl";
  currentOption: LanguageOption;
  t: (typeof translations)["en"];
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const STORAGE_KEY = "sos_healthcare_lang";

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<SupportedLanguage>(() => {
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem(STORAGE_KEY) as SupportedLanguage | null;
        if (stored && SUPPORTED_LANGUAGES.some((l) => l.code === stored)) {
          return stored;
        }
      } catch {
        // localStorage unavailable
      }
    }
    return "en";
  });

  const setLanguage = (lang: SupportedLanguage) => {
    setLanguageState(lang);
    try {
      localStorage.setItem(STORAGE_KEY, lang);
    } catch {
      // ignore
    }
  };

  const currentOption =
    SUPPORTED_LANGUAGES.find((l) => l.code === language) || SUPPORTED_LANGUAGES[0];

  const dir = currentOption.dir;
  const t = translations[language] || translations.en;

  useEffect(() => {
    if (typeof document !== "undefined") {
      document.documentElement.lang = language;
      document.documentElement.dir = dir;
    }
  }, [language, dir]);

  return (
    <LanguageContext.Provider
      value={{
        language,
        setLanguage,
        dir,
        currentOption,
        t,
      }}
    >
      <div dir={dir} className={dir === "rtl" ? "font-arabic" : undefined}>
        {children}
      </div>
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}
