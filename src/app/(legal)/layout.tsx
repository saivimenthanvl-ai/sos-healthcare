import Link from "next/link";
import { ThemeToggle } from "@/components/ThemeToggle";
import { SiteFooter } from "@/components/SiteFooter";

/** Public layout (no sign-in required) for legal and contact pages. */
export default function LegalGroupLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100 transition-colors duration-200">
      <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <Link
              href="/"
              className="flex items-center gap-3 text-xl sm:text-2xl font-bold text-blue-600 dark:text-blue-400"
            >
              <span className="text-2xl sm:text-3xl">🚑</span>
              <span>SOS Healthcare</span>
            </Link>
            <nav className="flex items-center gap-4" aria-label="Primary">
              <Link
                href="/"
                className="text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
              >
                Home
              </Link>
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
