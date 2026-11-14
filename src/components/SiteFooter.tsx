"use client";

import { useState } from "react";
import Link from "next/link";
import { PhoneCallIcon, ShieldAlertIcon, MailIcon, ArrowUpIcon } from "lucide-react";
import { SosLogo } from "@/components/SosLogo";
import { useLanguage } from "@/contexts/LanguageContext";
import { ContactAdminModal } from "@/components/ContactAdminModal";

/** Site footer, shared by the landing page, authenticated modules, and public legal pages. */
export function SiteFooter() {
  const { t, dir } = useLanguage();
  const [adminModalOpen, setAdminModalOpen] = useState(false);

  const scrollToTop = () => {
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  return (
    <>
      <footer dir={dir} className="bg-white dark:bg-gray-950 text-gray-600 dark:text-gray-400 border-t border-gray-200 dark:border-gray-800 py-8 sm:py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Column 1: SOS Healthcare */}
            <div className="space-y-3">
              <Link href="/" className="flex items-center gap-2.5 text-xl sm:text-2xl font-bold text-gray-950 dark:text-white">
                <SosLogo size={28} className="w-7 h-7 shrink-0" />
                <span>{t.common.appName}</span>
              </Link>
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                {t.footer.summary}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                {t.common.tagline}.
              </p>
            </div>

            {/* Column 2: Healthcare Services */}
            <div>
              <h3 className="text-gray-950 dark:text-white font-bold tracking-wide uppercase text-xs mb-3.5">
                {t.footer.coreServices || t.dashboard.coreServicesTitle}
              </h3>
              <ul className="space-y-2.5 text-xs sm:text-sm">
                <li>
                  <Link href="/emergency" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors flex items-center gap-2">
                    <span className="text-red-500 text-xs">●</span> {t.common.emergency}
                  </Link>
                </li>
                <li>
                  <Link href="/hospitals" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors flex items-center gap-2">
                    <span className="text-blue-500 text-xs">●</span> {t.common.hospitals}
                  </Link>
                </li>
                <li>
                  <Link href="/appointments" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors flex items-center gap-2">
                    <span className="text-emerald-500 text-xs">●</span> {t.common.appointments}
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
              <h3 className="text-gray-950 dark:text-white font-bold tracking-wide uppercase text-xs mb-3.5">
                {t.footer.legalSupport}
              </h3>
              <ul className="space-y-2.5 text-xs sm:text-sm">
                <li>
                  <Link
                    href="/privacy-policy"
                    className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 rounded"
                  >
                    {t.footer.privacyPolicy}
                  </Link>
                </li>
                <li>
                  <Link
                    href="/terms-of-service"
                    className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 rounded"
                  >
                    {t.footer.termsOfService}
                  </Link>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => setAdminModalOpen(true)}
                    className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors text-left rtl:text-right flex items-center gap-1.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 rounded"
                  >
                    <MailIcon className="h-3.5 w-3.5 text-blue-500" />
                    <span>{t.footer.contactAdmin || t.common.contactAdmin}</span>
                  </button>
                </li>
                <li>
                  <Link
                    href="/contact"
                    className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 rounded text-xs text-gray-500"
                  >
                    {t.footer.supportDesk}
                  </Link>
                </li>
              </ul>
            </div>

            {/* Column 4: Emergency Information (Country-Aware) */}
            <div className="space-y-3">
              <h3 className="text-gray-950 dark:text-white font-bold tracking-wide uppercase text-xs mb-3 flex items-center gap-1.5">
                <ShieldAlertIcon className="h-4 w-4 text-red-500 shrink-0" />
                <span>{t.footer.emergencyInfo}</span>
              </h3>
              <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                {t.footer.emergencyDial}
              </p>
              <div className="p-3 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900 rounded-xl space-y-2">
                <a
                  href="tel:112"
                  aria-label="Call emergency services in your region"
                  className="flex items-center gap-3 rounded focus-visible:outline-2 focus-visible:outline-red-600"
                >
                  <PhoneCallIcon className="h-5 w-5 text-red-500 shrink-0" />
                  <div>
                    <p className="text-[10px] text-red-700 dark:text-red-400 font-semibold uppercase">{t.footer.emergencyLine}</p>
                    <p className="text-base sm:text-lg font-black text-red-900 dark:text-white">Call 112 / 911 / 119</p>
                  </div>
                </a>
                <p className="text-[11px] text-red-800 dark:text-red-300 leading-tight">
                  {t.footer.dialInfo}
                </p>
              </div>
              <p className="text-[11px] text-gray-500 dark:text-gray-400 leading-relaxed">
                {t.footer.disclaimer}
              </p>
            </div>
          </div>

          <div className="border-t border-gray-200 dark:border-gray-800 mt-8 pt-5 flex flex-col sm:flex-row items-center justify-between text-xs text-gray-500 dark:text-gray-400 gap-3 text-center sm:text-left">
            <p>&copy; {new Date().getFullYear()} {t.common.appName}. {t.common.tagline}.</p>
            <button
              type="button"
              onClick={scrollToTop}
              className="inline-flex items-center gap-1 text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors font-medium"
            >
              <ArrowUpIcon className="h-3.5 w-3.5" />
              <span>{t.footer.backToTop}</span>
            </button>
          </div>
        </div>
      </footer>

      <ContactAdminModal isOpen={adminModalOpen} onClose={() => setAdminModalOpen(false)} />
    </>
  );
}
