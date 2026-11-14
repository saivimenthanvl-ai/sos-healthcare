import Link from "next/link";
import { Navigation } from "@/components/Navigation";
import { ThemeToggle } from "@/components/ThemeToggle";
import { SiteFooter } from "@/components/SiteFooter";
import { SosLogo } from "@/components/SosLogo";

export const metadata = {
  title: "SOS Healthcare — Hospital Discovery & Emergency Guidance",
  description:
    "SOS Healthcare: Location-aware emergency guidance, emergency contact alerts, nearby hospital discovery, and private appointment planning.",
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
          <div className="flex h-16 items-center justify-between">
            <Link href="/" className="flex items-center gap-3 text-xl font-bold text-gray-900 dark:text-white">
              <SosLogo size={28} className="w-7 h-7" priority />
              <span>SOS Healthcare</span>
            </Link>
            <div className="flex items-center gap-3">
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
