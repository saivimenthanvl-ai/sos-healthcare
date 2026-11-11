"use client";

import { useState, useRef, useEffect } from "react";
import { GlobeIcon, CheckIcon } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { SUPPORTED_LANGUAGES, SupportedLanguage } from "@/lib/i18n";
import { cn } from "@/lib/utils";

interface LanguageSelectorProps {
  compact?: boolean;
  className?: string;
}

export function LanguageSelector({ compact = false, className }: LanguageSelectorProps) {
  const { language, setLanguage, currentOption } = useLanguage();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKey);
    };
  }, [open]);

  return (
    <div className={cn("relative inline-block text-left", className)} ref={containerRef}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 border border-gray-200 dark:border-gray-800 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
        aria-label="Select application language"
        aria-expanded={open}
      >
        <GlobeIcon className="h-4 w-4 text-blue-600 dark:text-blue-400 shrink-0" />
        <span className={compact ? "hidden sm:inline" : ""}>
          {currentOption.nativeName}
        </span>
      </button>

      {open && (
        <div
          className="absolute right-0 rtl:left-0 rtl:right-auto mt-1.5 w-56 max-h-80 overflow-y-auto rounded-xl bg-white dark:bg-gray-900 shadow-xl border border-gray-200 dark:border-gray-800 py-1.5 z-50 animate-in fade-in zoom-in-95 duration-100 divide-y divide-gray-100 dark:divide-gray-800/60"
          role="menu"
        >
          <div className="sticky top-0 bg-white dark:bg-gray-900 px-3 py-1.5 text-[10px] uppercase font-bold tracking-wider text-gray-400 dark:text-gray-500 border-b border-gray-100 dark:border-gray-800 z-10">
            Select Language (17 Locales)
          </div>
          <div className="py-1">
            {SUPPORTED_LANGUAGES.map((lang) => {
              const isSelected = lang.code === language;
              return (
                <button
                  key={lang.code}
                  type="button"
                  onClick={() => {
                    setLanguage(lang.code as SupportedLanguage);
                    setOpen(false);
                  }}
                  className={cn(
                    "w-full flex items-center justify-between px-3.5 py-2 text-xs font-medium transition-colors text-left rtl:text-right",
                    isSelected
                      ? "bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 font-bold"
                      : "text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800"
                  )}
                  role="menuitem"
                >
                  <div className="flex flex-col">
                    <span className="font-semibold">{lang.nativeName}</span>
                    <span className="text-[10px] text-gray-400">{lang.name}</span>
                  </div>
                  {isSelected && <CheckIcon className="h-4 w-4 text-blue-600 dark:text-blue-400 shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

