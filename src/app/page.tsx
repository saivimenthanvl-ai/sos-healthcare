"use client";

import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useAuth } from "@/contexts/AuthContext";
import { Navigation } from "@/components/Navigation";
import { AuthenticatedDashboardView } from "@/components/AuthenticatedDashboardView";
import { SiteFooter } from "@/components/SiteFooter";
import { SosLogo } from "@/components/SosLogo";

export default function HomePage() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100 transition-colors duration-200">
      {/* Top Application Header with Navigation and Theme Toggle */}
      <header className="bg-white dark:bg-gray-900 shadow-xs border-b border-gray-200 dark:border-gray-800 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between gap-2 sm:gap-4">
            <Link
              href="/"
              className="flex items-center gap-2.5 sm:gap-3 text-lg sm:text-xl font-bold text-gray-900 dark:text-white shrink-0 min-w-0"
            >
              <SosLogo size={30} className="w-7 h-7 sm:w-8 sm:h-8 shrink-0" priority />
              <span className="truncate">SOS Healthcare</span>
            </Link>
            <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
              <Navigation />
              <ThemeToggle />
              {!user && (
                <Link href="/auth/login" className="shrink-0">
                  <Button variant="danger" size="sm" className="hidden sm:inline-flex text-xs px-3 py-1.5">
                    Sign In
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area: Dashboard with Banner, SOS Button, Recent Emergencies, Quick Actions, and 6 Feature Cards */}
      <main className="flex-1">
        <section className="px-4 sm:px-6 lg:px-8 py-6 bg-gray-50/50 dark:bg-gray-900/30">
          <AuthenticatedDashboardView />
        </section>
      </main>

      {/* Full Existing Dark Footer Component */}
      <SiteFooter />
    </div>
  );
}
