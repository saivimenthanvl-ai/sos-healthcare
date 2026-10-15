import Link from "next/link";
import { PhoneCallIcon } from "lucide-react";
import { BrandLogo } from "@/components/BrandLogo";

/** Site footer, shared by the landing page and the public legal pages. */
export function SiteFooter() {
  return (
    <footer className="bg-white dark:bg-gray-950 text-gray-600 dark:text-gray-400 border-t border-gray-200 dark:border-gray-800 py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          {/* Column 1: Info */}
          <div className="space-y-4">
            <Link href="/" className="flex items-center gap-2 text-2xl font-bold text-white">
              <span>🚑</span> SOS Healthcare
            </Link>
            <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
              Rapid emergency assistance platform connecting individuals to nearby hospitals, accredited specialists, and first responders. Zero platform fees.
            </p>
            <div className="flex items-center gap-2 text-xs text-emerald-400 font-medium">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Emergency Platform Servers Online
            </div>
          </div>

          {/* Column 2: Product */}
          <div>
            <h3 className="text-gray-950 dark:text-white font-bold tracking-wide uppercase text-xs mb-4">
              Product
            </h3>
            <ul className="space-y-3 text-sm">
              <li>
                <Link href="/emergency" className="hover:text-blue-700 dark:hover:text-white transition-colors flex items-center gap-2">
                  <span className="text-red-500">●</span> SOS Emergency
                </Link>
              </li>
              <li>
                <Link href="/hospitals" className="hover:text-blue-700 dark:hover:text-white transition-colors flex items-center gap-2">
                  <span className="text-blue-500">●</span> Nearby Hospitals
                </Link>
              </li>
              <li>
                <Link href="/devices" className="hover:text-blue-700 dark:hover:text-white transition-colors flex items-center gap-2">
                  <span className="text-emerald-500">●</span> Health Devices
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Legal */}
          <div>
            <h3 className="text-gray-950 dark:text-white font-bold tracking-wide uppercase text-xs mb-4">
              Legal
            </h3>
            <ul className="space-y-3 text-sm">
              <li>
                <Link href="/privacy-policy" className="hover:text-blue-700 dark:hover:text-white transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 rounded">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms-of-service" className="hover:text-blue-700 dark:hover:text-white transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 rounded">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-blue-700 dark:hover:text-white transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 rounded">
                  Contact
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 4: Emergency Assistance */}
          <div className="space-y-3">
            <h3 className="text-gray-950 dark:text-white font-bold tracking-wide uppercase text-xs mb-4">
              Emergency Assistance
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              In severe, life-threatening incidents, dial your national emergency service immediately:
            </p>
            <div className="p-4 bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-900 rounded-xl">
              <a href="tel:112" aria-label="Call emergency services at 112" className="flex items-center gap-3 rounded focus-visible:outline-2 focus-visible:outline-red-600">
                <PhoneCallIcon className="h-6 w-6 text-red-500" />
                <div>
                  <p className="text-xs text-red-700 dark:text-red-400 font-semibold uppercase">Immediate Emergency Line</p>
                  <p className="text-xl font-black text-red-900 dark:text-white">Call 112</p>
                </div>
              </a>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400">Tap to call on a supported phone. On desktop, dial using your phone. Emergency numbers vary by country.</p>
          </div>
        </div>

        <div className="border-t border-gray-200 dark:border-gray-800 mt-12 pt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-gray-500 dark:text-gray-400 gap-4">
          <p>&copy; {new Date().getFullYear()} SOS Healthcare Inc. All rights reserved.</p>
          <p>Designed for immediate emergency care, wearable integration, and patient life safety.</p>
        </div>
      </div>
    </footer>
  );
}
