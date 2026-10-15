import Link from "next/link";
import { Navigation } from "@/components/Navigation";
import { ThemeToggle } from "@/components/ThemeToggle";
import { SiteFooter } from "@/components/SiteFooter";

export const metadata = {
  title: "SOS Healthcare — Emergency Ambulance & Hospital Finder",
  description:
    "SOS Healthcare: Get an ambulance within 10-20 minutes. Real-time location tracking via Fitbit/Smartwatch. Find nearby hospitals. No fees for emergency care.",
};

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative flex min-h-screen flex-col bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 transition-colors">
      <header className="relative bg-white dark:bg-gray-900 shadow-xs border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex min-h-16 items-center justify-between gap-3">
            <Link href="/" aria-label="SOS Healthcare home" className="flex shrink-0 items-center gap-2 whitespace-nowrap text-base sm:text-lg font-bold tracking-tight text-blue-600 dark:text-blue-400">
              <img src="/sos-logo.svg" alt="" width="28" height="28" className="h-7 w-7 shrink-0" />
              <span>SOS Healthcare</span>
            </Link>
            <div className="flex min-w-0 items-center gap-2">
              <Navigation />
              <ThemeToggle />
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {children}
      </main>

      <SiteFooter />
    </div>
  );
}

