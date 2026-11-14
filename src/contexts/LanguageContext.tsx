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
const COOKIE_KEY = "sos_healthcare_lang";

function getInitialLanguage(): SupportedLanguage {
  if (typeof document !== "undefined") {
    // Check cookie first (deterministic between SSR and client if cookie was sent)
    const match = document.cookie.match(new RegExp(`(?:^|; )${COOKIE_KEY}=([^;]*)`));
    if (match) {
      const cookieVal = decodeURIComponent(match[1]) as SupportedLanguage;
      if (SUPPORTED_LANGUAGES.some((l) => l.code === cookieVal)) {
        return cookieVal;
      }
    }

    try {
      const stored = localStorage.getItem(STORAGE_KEY) as SupportedLanguage | null;
      if (stored && SUPPORTED_LANGUAGES.some((l) => l.code === stored)) {
        return stored;
      }
    } catch {
      // ignore
    }
  }
  return "en";
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<SupportedLanguage>("en");

  // On client mount, sync with persisted preferences without crashing SSR hydration
  useEffect(() => {
    const initial = getInitialLanguage();
    if (initial !== "en") {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLanguageState(initial);
    }
  }, []);

  const setLanguage = (lang: SupportedLanguage) => {
    setLanguageState(lang);
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(STORAGE_KEY, lang);
      } catch {
        // ignore
      }
      try {
        document.cookie = `${COOKIE_KEY}=${encodeURIComponent(lang)}; path=/; max-age=31536000; SameSite=Lax`;
      } catch {
        // ignore
      }
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
