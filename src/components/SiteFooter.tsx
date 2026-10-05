import Link from "next/link";
import { PhoneCallIcon } from "lucide-react";

/** Site footer, shared by the landing page and the public legal pages. */
export function SiteFooter() {
  return (
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
                <Link href="/privacy-policy" className="hover:text-white transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 rounded">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms-of-service" className="hover:text-white transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 rounded">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-white transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 rounded">
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
  );
}
