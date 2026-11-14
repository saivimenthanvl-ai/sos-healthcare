"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { GlobeIcon, CheckIcon, SearchIcon } from "lucide-react";
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
  const [search, setSearch] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;

    // Auto-focus search input when opened
    setTimeout(() => {
      searchInputRef.current?.focus();
    }, 50);

    const handleClick = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) {
        setOpen(false);
        setSearch("");
      }
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        setSearch("");
      }
    };
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKey);
    };
  }, [open]);

  const filteredLanguages = useMemo(() => {
    const term = search.toLowerCase().trim();
    if (!term) return SUPPORTED_LANGUAGES;
    return SUPPORTED_LANGUAGES.filter(
      (l) =>
        l.name.toLowerCase().includes(term) ||
        l.nativeName.toLowerCase().includes(term) ||
        l.code.toLowerCase().includes(term)
    );
  }, [search]);

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
          className="absolute right-0 rtl:left-0 rtl:right-auto mt-1.5 w-64 max-h-96 overflow-hidden rounded-xl bg-white dark:bg-gray-900 shadow-xl border border-gray-200 dark:border-gray-800 z-50 animate-in fade-in zoom-in-95 duration-100 flex flex-col"
          role="menu"
        >
          {/* Header & Search */}
          <div className="p-2 border-b border-gray-100 dark:border-gray-800 bg-gray-50/70 dark:bg-gray-900">
            <div className="flex items-center justify-between px-1.5 pb-1.5 text-[10px] uppercase font-bold tracking-wider text-gray-500 dark:text-gray-400">
              <span>Select Language</span>
              <span>25 Locales</span>
            </div>
            <div className="relative">
              <SearchIcon className="h-3.5 w-3.5 text-gray-400 absolute left-2 top-1/2 -translate-y-1/2 rtl:left-auto rtl:right-2" />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search language..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-7 pr-2.5 rtl:pr-7 rtl:pl-2.5 py-1 text-xs rounded-md bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Scrollable Language List */}
          <div className="overflow-y-auto py-1 max-h-64 divide-y divide-gray-50 dark:divide-gray-800/40">
            {filteredLanguages.length === 0 ? (
              <div className="px-4 py-3 text-xs text-center text-gray-400">No matching languages</div>
            ) : (
              filteredLanguages.map((lang) => {
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
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
