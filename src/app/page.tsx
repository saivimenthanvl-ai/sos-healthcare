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

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100 transition-colors duration-200">
      {/* Navigation */}
      <header className="bg-white dark:bg-gray-900 shadow-xs border-b border-gray-200 dark:border-gray-800 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <Link href="/" className="flex items-center gap-3 text-2xl font-bold text-blue-600 dark:text-blue-400">
              <span className="text-3xl">🚑</span>
              <span>SOS Healthcare</span>
            </Link>
            <nav className="flex items-center gap-4 sm:gap-6">
              <Link
                href="/#features"
                className="text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                Features
              </Link>
              <Link
                href="/#stats"
                className="text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                Stats
              </Link>
              <ThemeToggle />
              <Link href="/auth/signup">
                <Button variant="danger" size="sm">
                  Get Started
                </Button>
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero */}
      <main className="flex-1">
        <section className="py-16 sm:py-24 lg:py-32 bg-radial from-red-50/50 via-white to-white dark:from-red-950/20 dark:via-gray-950 dark:to-gray-950">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <div className="mb-8">
              <span className="inline-flex items-center gap-2 px-4 py-2 bg-red-100 dark:bg-red-950/70 text-red-800 dark:text-red-300 border border-red-200 dark:border-red-900 rounded-full text-sm font-semibold">
                <AlertTriangleIcon className="h-4 w-4" />
                Emergency Healthcare Platform
              </span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-gray-900 dark:text-white tracking-tight mb-6">
              Emergency Help
              <span className="text-red-600 dark:text-red-500 block mt-2">Arrives in 10-20 Minutes</span>
            </h1>

            <p className="text-lg sm:text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto mb-10 leading-relaxed">
              SOS Healthcare connects you to the nearest ambulance and hospital
              during a medical emergency. Real-time location tracking via Fitbit
              and smartwatches. <strong className="text-gray-900 dark:text-white font-semibold">No fees. No delays.</strong>
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
              <Link href="/auth/signup" className="w-full sm:w-auto">
                <Button variant="danger" size="lg" className="w-full sm:w-auto shadow-lg shadow-red-500/20 px-8 py-3.5 text-base">
                  <AlertTriangleIcon className="h-5 w-5 mr-2" />
                  Get Emergency Access
                </Button>
              </Link>
              <Link href="/emergency" className="w-full sm:w-auto">
                <Button variant="outline" size="lg" className="w-full sm:w-auto border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 px-8 py-3.5 text-base">
                  <MapPinIcon className="h-5 w-5 mr-2 text-red-500" />
                  Trigger Instant SOS
                </Button>
              </Link>
            </div>

            {/* Stats */}
            <div
              id="stats"
              className="grid grid-cols-2 md:grid-cols-4 gap-8 mt-16 pt-12 border-t border-gray-200 dark:border-gray-800"
            >
              {stats.map((stat) => (
                <div key={stat.label} className="text-center">
                  <div className="text-3xl sm:text-4xl font-extrabold text-red-600 dark:text-red-500 mb-1">
                    {stat.value}
                  </div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Features */}
        <section id="features" className="py-20 bg-gray-50/50 dark:bg-gray-900/50 border-t border-gray-200 dark:border-gray-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white">
                Everything you need in an emergency
              </h2>
              <p className="text-gray-600 dark:text-gray-300 mt-4 max-w-2xl mx-auto text-base sm:text-lg">
                SOS Healthcare is engineered for life-critical incidents. When seconds
                matter, get precision dispatch, smartwatch telemetry, and ER bed booking.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {features.map((feature) => (
                <div
                  key={feature.title}
                  className="bg-white dark:bg-gray-900 rounded-2xl p-6 sm:p-8 text-left border border-gray-200 dark:border-gray-800 shadow-sm hover:shadow-xl hover:border-blue-500/30 dark:hover:border-blue-500/30 transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="bg-gray-100 dark:bg-gray-800 rounded-xl p-3.5 w-14 h-14 mb-6 flex items-center justify-center shadow-xs">
                      {feature.icon}
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
                      {feature.title}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed mb-6">
                      {feature.description}
                    </p>
                  </div>

                  {/* Added content inside feature box context (except no fees) */}
                  {feature.extraItems && (
                    <div className="pt-4 border-t border-gray-100 dark:border-gray-800/80 space-y-2">
                      {feature.extraItems.map((item, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-xs font-medium text-gray-700 dark:text-gray-300">
                          <CheckCircle2Icon className="h-4 w-4 text-emerald-500 dark:text-emerald-400 flex-shrink-0" />
                          <span>{item}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Banner */}
        <section className="py-20 bg-gradient-to-r from-blue-700 via-indigo-600 to-red-600 text-white shadow-inner">
          <div className="max-w-4xl mx-auto text-center px-4">
            <h2 className="text-3xl sm:text-4xl font-extrabold mb-4">
              Ready for Real Emergencies?
            </h2>
            <p className="text-blue-100 text-lg mb-8 max-w-2xl mx-auto">
              Join thousands of protected users and families who rely on SOS Healthcare for fast,
              unconditional emergency response.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/auth/signup">
                <Button variant="secondary" size="lg" className="w-full sm:w-auto font-semibold">
                  Create Your Account for Free
                </Button>
              </Link>
              <Link href="/emergency">
                <Button variant="danger" size="lg" className="w-full sm:w-auto border border-white/20">
                  <ActivityIcon className="h-5 w-5 mr-2" />
                  Test Live SOS Beacon
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-gray-950 text-gray-400 border-t border-gray-800 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
            {/* Column 1: Info */}
            <div className="space-y-4">
              <Link href="/" className="flex items-center gap-2 text-2xl font-bold text-white">
                <span>🚑</span> SOS Healthcare
              </Link>
              <p className="text-sm text-gray-400 leading-relaxed">
                Autonomous real-time emergency healthcare dispatch network. Instant ambulance mobilization within 10–20 minutes with zero user fees.
              </p>
              <div className="flex items-center gap-2 text-xs text-emerald-400 font-medium">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
                Emergency Dispatch Servers Online
              </div>
            </div>

            {/* Column 2: Product */}
            <div>
              <h3 className="text-white font-bold tracking-wide uppercase text-xs mb-4">
                Product
              </h3>
              <ul className="space-y-3 text-sm">
                <li>
                  <Link href="/emergency" className="hover:text-white transition-colors flex items-center gap-2">
                    <span className="text-red-500">●</span> SOS Emergency
                  </Link>
                </li>
                <li>
                  <Link href="/hospitals" className="hover:text-white transition-colors flex items-center gap-2">
                    <span className="text-blue-500">●</span> Nearby Hospitals
                  </Link>
                </li>
                <li>
                  <Link href="/profile" className="hover:text-white transition-colors flex items-center gap-2">
                    <span className="text-emerald-500">●</span> Health Devices
                  </Link>
                </li>
              </ul>
            </div>

            {/* Column 3: Legal */}
            <div>
              <h3 className="text-white font-bold tracking-wide uppercase text-xs mb-4">
                Legal
              </h3>
              <ul className="space-y-3 text-sm">
                <li>
                  <Link href="/privacy-policy" className="hover:text-white transition-colors">
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link href="/terms-of-service" className="hover:text-white transition-colors">
                    Terms of Service
                  </Link>
                </li>
                <li>
                  <Link href="/contact" className="hover:text-white transition-colors">
                    Contact
                  </Link>
                </li>
              </ul>
            </div>

            {/* Column 4: Emergency Assistance */}
            <div className="space-y-3">
              <h3 className="text-white font-bold tracking-wide uppercase text-xs mb-4">
                Emergency Assistance
              </h3>
              <p className="text-sm text-gray-400">
                In severe, life-threatening incidents, dial your national emergency service immediately:
              </p>
              <div className="p-4 bg-red-950/60 border border-red-900 rounded-xl">
                <div className="flex items-center gap-3">
                  <PhoneCallIcon className="h-6 w-6 text-red-500 animate-pulse" />
                  <div>
                    <p className="text-xs text-red-400 font-semibold uppercase">Immediate Emergency Line</p>
                    <p className="text-xl font-black text-white">Call 911 / 112</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-800/80 mt-12 pt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-gray-500 gap-4">
            <p>&copy; {new Date().getFullYear()} SOS Healthcare Inc. All rights reserved.</p>
            <p>Designed for immediate emergency care, wearable integration, and patient life safety.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
