"use client";

import Link from "next/link";
import {
  AlertTriangleIcon,
  MapPinIcon,
  HeartIcon,
  SmartphoneIcon,
  ClockIcon,
  ShieldIcon,
  ActivityIcon,
  CheckCircle2Icon,
  PhoneCallIcon,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { UserNavMenu } from "@/components/UserNavMenu";

const features = [
  {
    icon: <AlertTriangleIcon className="h-6 w-6 text-red-600 dark:text-red-400" />,
    title: "One-Tap SOS",
    description:
      "Press a single emergency button to immediately alert closest ambulances and hospitals. Your precise GPS coordinates and emergency contacts are notified automatically in seconds.",
    extraItems: ["Instant GPS beacon", "Multi-contact SMS broadcast", "Automated ER dispatch"],
  },
  {
    icon: <ClockIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />,
    title: "10-20 Min ETA",
    description:
      "Smart priority ambulance fleet matching routes the nearest available unit directly to your coordinates with turn-by-turn navigation and live arrival countdowns.",
    extraItems: ["Live GPS fleet tracking", "Dynamic traffic routing", "Real-time paramedic chat"],
  },
  {
    icon: <MapPinIcon className="h-6 w-6 text-green-600 dark:text-green-400" />,
    title: "Nearby Hospitals",
    description:
      "Locate accredited hospitals with real-time verified ICU beds, ER capacity, and direct emergency room triage booking customized to patient needs.",
    extraItems: ["Real-time bed availability", "Direct ER triage reservation", "One-tap Google Maps directions"],
  },
  {
    icon: <SmartphoneIcon className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />,
    title: "Smartwatch Integration",
    description:
      "Seamlessly connect your Fitbit, Apple Watch, or Android Wear device. Automatic fall detection and extreme heart rate spikes trigger emergency help without taking out your phone.",
    extraItems: ["Automated fall detection", "Heart rate spike/drop alerts", "Instant wrist SOS trigger"],
  },
  {
    icon: <HeartIcon className="h-6 w-6 text-pink-600 dark:text-pink-400" />,
    title: "Health Data Sharing",
    description:
      "Your real-time vitals, blood type, known allergies, chronic conditions, and emergency contacts are securely shared with doctors and incoming paramedics ahead of arrival.",
    extraItems: ["Encrypted medical profile", "Allergy & blood group badge", "Paramedic pre-arrival briefing"],
  },
  {
    icon: <ShieldIcon className="h-6 w-6 text-purple-600 dark:text-purple-400" />,
    title: "No Fees",
    description:
      "This service is completely free for users. No hidden charges. Emergency care should never cost you.",
    extraItems: null, // Keep No Fees section as it is as requested
  },
];

const stats = [
  { value: "10-20 min", label: "Avg. Response Time" },
  { value: "0", label: "Fees for Users" },
  { value: "24/7", label: "Availability" },
  { value: "50K+", label: "Saved Lives" },
];

import { useAuth } from "@/contexts/AuthContext";
import { Navigation } from "@/components/Navigation";
import { AuthenticatedDashboardView } from "@/components/AuthenticatedDashboardView";
import { SiteFooter } from "@/components/SiteFooter";

export default function HomePage() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100 transition-colors duration-200">
      {/* Top Application Header with Navigation and Theme Toggle */}
      <header className="bg-white dark:bg-gray-900 shadow-xs border-b border-gray-200 dark:border-gray-800 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <Link href="/" className="flex items-center gap-3 text-xl sm:text-2xl font-bold text-blue-600 dark:text-blue-400">
              <span className="text-2xl sm:text-3xl">🚑</span>
              <span>SOS Healthcare</span>
            </Link>
            <div className="flex items-center gap-3">
              <Navigation />
              <ThemeToggle />
              {!user && (
                <Link href="/auth/login">
                  <Button variant="danger" size="sm" className="hidden sm:inline-flex">
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

