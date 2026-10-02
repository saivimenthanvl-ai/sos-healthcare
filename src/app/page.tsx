import Link from "next/link";
import {
  AlertTriangleIcon,
  MapPinIcon,
  HeartIcon,
  SmartphoneIcon,
  ClockIcon,
  ShieldIcon,
} from "lucide-react";
import { Button } from "@/components/ui/Button";

const features = [
  {
    icon: <AlertTriangleIcon className="h-6 w-6 text-red-600" />,
    title: "One-Tap SOS",
    description:
      "Press a single button to alert nearby ambulances and hospitals. Your location is shared instantly.",
  },
  {
    icon: <ClockIcon className="h-6 w-6 text-blue-600" />,
    title: "10-20 Min ETA",
    description:
      "We dispatch the nearest ambulance with a target response time of 10-20 minutes. We track ETA in real-time.",
  },
  {
    icon: <MapPinIcon className="h-6 w-6 text-green-600" />,
    title: "Nearby Hospitals",
    description:
      "Find hospitals with available ER beds, ICU capacity, and directions — all within 20 km of your location.",
  },
  {
    icon: <SmartphoneIcon className="h-6 w-6 text-indigo-600" />,
    title: "Smartwatch Integration",
    description:
      "Connect your Fitbit, Apple Watch, or Android Wear to automatically share live location and vitals with first responders.",
  },
  {
    icon: <HeartIcon className="h-6 w-6 text-pink-600" />,
    title: "Health Data Sharing",
    description:
      "Your heart rate, allergies, and medical conditions are securely shared with paramedics before they arrive.",
  },
  {
    icon: <ShieldIcon className="h-6 w-6 text-purple-600" />,
    title: "No Fees",
    description:
      "This service is completely free for users. No hidden charges. Emergency care should never cost you.",
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
    <div className="min-h-screen flex flex-col">
      {/* Navigation */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <Link href="/" className="flex items-center gap-3 text-2xl font-bold text-blue-600">
              <span className="text-3xl">🚑</span>
              <span>SOS Healthcare</span>
            </Link>
            <nav className="flex items-center gap-6">
              <Link
                href="/#features"
                className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
              >
                Features
              </Link>
              <Link
                href="/#stats"
                className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
              >
                Stats
              </Link>
              <Link
                href="/auth/login"
                className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
              >
                Sign In
              </Link>
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
        <section className="py-16 sm:py-24 lg:py-32">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <div className="mb-8">
              <span className="inline-flex items-center gap-2 px-4 py-2 bg-red-100 text-red-800 rounded-full text-sm font-medium">
                <AlertTriangleIcon className="h-4 w-4" />
                Emergency Healthcare Platform
              </span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-6">
              Emergency Help
              <span className="text-red-600 block">Arrives in 10-20 Minutes</span>
            </h1>

            <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
              SOS Healthcare connects you to the nearest ambulance and hospital
              during a medical emergency. Real-time location tracking via Fitbit
              and smartwatches. <strong className="text-gray-900">No fees. No delays.</strong>
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <Link href="/auth/signup">
                <Button variant="danger" size="lg">
                  <AlertTriangleIcon className="h-5 w-5 mr-2" />
                  Get Emergency Access
                </Button>
              </Link>
              <Link href="/auth/login">
                <Button variant="outline" size="lg">
                  I Already Have an Account
                </Button>
              </Link>
            </div>

            {/* Stats */}
            <div
              id="stats"
              className="grid grid-cols-2 md:grid-cols-4 gap-8 mt-16 pt-12 border-t border-gray-200"
            >
              {stats.map((stat) => (
                <div key={stat.label} className="text-center">
                  <div className="text-3xl font-bold text-red-600 mb-1">
                    {stat.value}
                  </div>
                  <p className="text-sm text-gray-600">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Features */}
        <section id="features" className="py-16 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900">
                Everything you need in an emergency
              </h2>
              <p className="text-gray-600 mt-4 max-w-2xl mx-auto">
                SOS Healthcare is designed for real emergencies. When seconds
                matter, we give you the tools to get help fast.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {features.map((feature) => (
                <div
                  key={feature.title}
                  className="bg-gray-50 rounded-xl p-6 text-center hover:shadow-lg transition-shadow"
                >
                  <div className="bg-white rounded-full p-3 w-12 h-12 mx-auto mb-4 shadow">
                    {feature.icon}
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Banner */}
        <section className="py-16 bg-gradient-to-r from-blue-600 to-red-500 text-white">
          <div className="max-w-4xl mx-auto text-center px-4">
            <h2 className="text-3xl font-bold mb-4">
              Ready for Real Emergencies?
            </h2>
            <p className="text-blue-100 mb-6 max-w-2xl mx-auto">
              Join thousands of users who trust SOS Healthcare for fast,
              free emergency response.
            </p>
            <Link href="/auth/signup">
              <Button variant="secondary" size="lg">
                Create Your Account for Free
              </Button>
            </Link>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <Link href="/" className="flex items-center gap-2 text-xl font-bold text-white mb-4">
                🚑 SOS Healthcare
              </Link>
              <p className="text-sm">
                Emergency healthcare platform. Ambulance dispatch within 10-20
                minutes. No fees for users.
              </p>
            </div>
            <div>
              <h3 className="text-white font-semibold mb-3">Product</h3>
              <ul className="space-y-2 text-sm">
                <li><Link href="/emergency" className="hover:text-white">SOS Emergency</Link></li>
                <li><Link href="/hospitals" className="hover:text-white">Nearby Hospitals</Link></li>
                <li><Link href="/profile" className="hover:text-white">Health Devices</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="text-white font-semibold mb-3">Legal</h3>
              <ul className="space-y-2 text-sm">
                <li><Link href="/privacy" className="hover:text-white">Privacy Policy</Link></li>
                <li><Link href="/terms" className="hover:text-white">Terms of Service</Link></li>
                <li><Link href="/contact" className="hover:text-white">Contact</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="text-white font-semibold mb-3">Emergency</h3>
              <p className="text-sm mb-2">If you need immediate help:</p>
              <p className="text-lg font-bold text-red-400">Call 911</p>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm">
            &copy; {new Date().getFullYear()} SOS Healthcare. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
