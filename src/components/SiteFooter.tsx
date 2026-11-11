"use client";

import Link from "next/link";
import { PhoneCallIcon, ShieldAlertIcon } from "lucide-react";
import { SosLogo } from "@/components/SosLogo";
import { useLanguage } from "@/contexts/LanguageContext";

/** Site footer, shared by the landing page, authenticated modules, and public legal pages. */
export function SiteFooter() {
  const { t } = useLanguage();

  return (
    <footer className="bg-white dark:bg-gray-950 text-gray-600 dark:text-gray-400 border-t border-gray-200 dark:border-gray-800 py-12 sm:py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 sm:gap-10">
          {/* Column 1: SOS Healthcare */}
          <div className="space-y-4">
            <Link href="/" className="flex items-center gap-2.5 text-xl sm:text-2xl font-bold text-gray-950 dark:text-white">
              <SosLogo size={28} className="w-7 h-7 shrink-0" />
              <span>SOS Healthcare</span>
            </Link>
            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
              {t.footer.summary}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
              Transparent digital health interface. Private appointment requests remain within your account. Emergency beacons broadcast GPS coordinates to designated contacts.
            </p>
          </div>

          {/* Column 2: Product */}
          <div>
            <h3 className="text-gray-950 dark:text-white font-bold tracking-wide uppercase text-xs mb-4">
              Product
            </h3>
            <ul className="space-y-2.5 text-xs sm:text-sm">
              <li>
                <Link href="/emergency" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors flex items-center gap-2">
                  <span className="text-red-500 text-xs">●</span> {t.common.emergency} Assistance
                </Link>
              </li>
              <li>
                <Link href="/hospitals" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors flex items-center gap-2">
                  <span className="text-blue-500 text-xs">●</span> Nearby {t.common.hospitals}
                </Link>
              </li>
              <li>
                <Link href="/appointments" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors flex items-center gap-2">
                  <span className="text-emerald-500 text-xs">●</span> Private {t.common.appointments}
                </Link>
              </li>
              <li>
                <Link href="/devices" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors flex items-center gap-2">
                  <span className="text-indigo-500 text-xs">●</span> {t.common.devices}
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Legal & Support */}
          <div>
            <h3 className="text-gray-950 dark:text-white font-bold tracking-wide uppercase text-xs mb-4">
              Legal & Support
            </h3>
            <ul className="space-y-2.5 text-xs sm:text-sm">
              <li>
                <Link
                  href="/privacy-policy"
                  className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 rounded"
                >
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link
                  href="/terms-of-service"
                  className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 rounded"
                >
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link
                  href="/contact"
                  className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 rounded"
                >
                  Support & Privacy Desk
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 4: Emergency Information (Country & Jurisdictional Guidance) */}
          <div className="space-y-3">
            <h3 className="text-gray-950 dark:text-white font-bold tracking-wide uppercase text-xs mb-3 flex items-center gap-1.5">
              <ShieldAlertIcon className="h-4 w-4 text-red-500 shrink-0" />
              Emergency Information
            </h3>
            <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
              {t.footer.emergencyDial}
            </p>
            <div className="p-3.5 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900 rounded-xl space-y-2">
              <a
                href="tel:112"
                aria-label="Call emergency services at 112 in applicable jurisdictions"
                className="flex items-center gap-3 rounded focus-visible:outline-2 focus-visible:outline-red-600"
              >
                <PhoneCallIcon className="h-5 w-5 text-red-500 shrink-0" />
                <div>
                  <p className="text-[10px] text-red-700 dark:text-red-400 font-semibold uppercase">{t.footer.emergencyLine}</p>
                  <p className="text-lg font-black text-red-900 dark:text-white">Call 112 / 911</p>
                </div>
              </a>
              <p className="text-[11px] text-red-800 dark:text-red-300 leading-tight">
                Dial 112 (EU, India, UK mobile fallback) or 911 (US/Canada). Numbers vary by country.
              </p>
            </div>
            <p className="text-[11px] text-gray-500 dark:text-gray-400 leading-relaxed">
              {t.footer.disclaimer}
            </p>
          </div>
        </div>

        <div className="border-t border-gray-200 dark:border-gray-800 mt-10 pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-gray-500 dark:text-gray-400 gap-3 text-center sm:text-left">
          <p>&copy; {new Date().getFullYear()} SOS Healthcare. Rapid emergency assistance & hospital discovery platform.</p>
          <p>Designed for location awareness, personal appointment planning, and health device monitoring.</p>
        </div>
      </div>
    </footer>
  );
}
