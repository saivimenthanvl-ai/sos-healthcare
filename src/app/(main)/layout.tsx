import { Navigation } from "@/components/Navigation";
import { ThemeToggle } from "@/components/ThemeToggle";
import { SiteFooter } from "@/components/SiteFooter";
import { BrandLogo } from "@/components/BrandLogo";

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
          <div className="flex h-14 items-center justify-between gap-2">
            <BrandLogo />
            <div className="flex min-w-0 items-center gap-1.5">
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

