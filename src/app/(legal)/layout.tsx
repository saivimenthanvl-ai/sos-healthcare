import Link from "next/link";
import { ThemeToggle } from "@/components/ThemeToggle";
import { LanguageSelector } from "@/components/LanguageSelector";
import { SiteFooter } from "@/components/SiteFooter";
import { SosLogo } from "@/components/SosLogo";

/** Public layout (no sign-in required) for legal and contact pages. */
export default function LegalGroupLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100 transition-colors duration-200">
      <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 sticky top-0 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between gap-3">
            <Link
              href="/"
              className="flex items-center gap-2.5 sm:gap-3 text-lg sm:text-xl font-bold text-gray-900 dark:text-white shrink-0"
            >
              <SosLogo size={30} className="w-7 h-7 sm:w-8 sm:h-8 shrink-0" priority />
              <span>SOS Healthcare</span>
            </Link>
            <nav className="flex items-center gap-2 sm:gap-3" aria-label="Legal Navigation">
              <Link
                href="/"
                className="text-xs sm:text-sm font-semibold text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors px-2 py-1 rounded"
              >
                Home
              </Link>
              <LanguageSelector compact />
              <ThemeToggle />
            </nav>
          </div>
        </div>
      </header>

      <main className="flex-1">{children}</main>

      <SiteFooter />
    </div>
  );
}
