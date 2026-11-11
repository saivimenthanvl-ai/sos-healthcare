"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useLocation } from "@/hooks/useLocation";
import { Button } from "@/components/ui/Button";
import { supabase } from "@/lib/supabase";
import type { Database } from "@/types/supabase";
import {
  AlertTriangleIcon,
  MapPinIcon,
  ClockIcon,
  CheckCircleIcon,
  AmbulanceIcon,
  PhoneCallIcon,
  PlusIcon,
  ActivityIcon,
  CalendarDaysIcon,
  SmartphoneIcon,
  ArrowRightIcon,
} from "lucide-react";
import { useRealtime } from "@/hooks/useRealtime";

type Emergency = Database["public"]["Tables"]["emergencies"]["Row"];

export function AuthenticatedDashboardView() {
  const { user, profile, loading: authLoading } = useAuth();
  const { latitude, longitude, error: locationError, loading: locationLoading } = useLocation();
  const [emergencies, setEmergencies] = useState<Emergency[]>([]);
  const [emergenciesLoading, setEmergenciesLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    if (!user) return;

    const fetchEmergencies = async () => {
      try {
        const { data, error } = await supabase
          .from("emergencies")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(5);

        if (!error) {
          setEmergencies(data || []);
        } else {
          console.warn("[Dashboard] fetchEmergencies query:", error.message);
          setEmergencies([]);
        }
      } catch (err: unknown) {
        console.warn("[Dashboard] fetchEmergencies handled:", err instanceof Error ? err.message : err);
        setEmergencies([]);
      } finally {
        setEmergenciesLoading(false);
      }
    };

    fetchEmergencies();
  }, [user]);

  // Subscribe to realtime updates on user's emergencies
  useRealtime<Emergency>(
    "emergencies",
    user ? `user_id=eq.${user.id}` : null,
    undefined,
    (updatedEmergency) => {
      setEmergencies((prev) =>
        prev.map((e) => (e.id === updatedEmergency.id ? updatedEmergency : e))
      );
    }
  );

  if (authLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center text-gray-600 dark:text-gray-400">Loading your dashboard...</div>
      </div>
    );
  }

  const statusIcons: Record<string, React.ReactNode> = {
    pending: <ClockIcon className="h-5 w-5 text-yellow-500" />,
    dispatched: <AmbulanceIcon className="h-5 w-5 text-blue-500" />,
    en_route: <MapPinIcon className="h-5 w-5 text-indigo-500" />,
    arrived: <CheckCircleIcon className="h-5 w-5 text-green-500" />,
    resolved: <CheckCircleIcon className="h-5 w-5 text-emerald-500" />,
    cancelled: <AlertTriangleIcon className="h-5 w-5 text-gray-400" />,
  };

  const statusLabels: Record<string, string> = {
    pending: "Awaiting Dispatch",
    dispatched: "Ambulance Dispatched",
    en_route: "Ambulance En Route",
    arrived: "Ambulance Arrived",
    resolved: "Resolved",
    cancelled: "Cancelled",
  };

  return (
    <div className="max-w-5xl mx-auto py-6">
      {/* Hero section */}
      <div className="border-b border-gray-200 dark:border-gray-800 py-5 sm:py-6 text-gray-950 dark:text-white mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold mb-2">
          {profile?.full_name ? `Hello, ${profile.full_name}` : "SOS Healthcare"}
        </h1>
        <p className="text-gray-600 dark:text-gray-300 max-w-2xl">
          In an acute life-threatening emergency, call 112 immediately or trigger an emergency beacon to transmit your GPS coordinates and notify your registered emergency contacts.
        </p>
      </div>

      {/* Location status */}
      <div className="flex items-center gap-3 mb-6 p-4 bg-white dark:bg-gray-900 rounded-lg shadow border border-gray-100 dark:border-gray-800">
        {locationLoading ? (
          <div className="animate-spin rounded-full h-5 w-5 border-2 border-blue-600 border-t-transparent" />
        ) : latitude != null && longitude != null ? (
          <MapPinIcon className="h-5 w-5 text-green-500 shrink-0" />
        ) : (
          <MapPinIcon className="h-5 w-5 text-red-500 shrink-0" />
        )}
        <span className="text-sm text-gray-700 dark:text-gray-300">
          {locationLoading
            ? "Detecting your location..."
            : latitude != null && longitude != null
              ? `Location ready: ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`
              : locationError || "Location not available"}
        </span>
      </div>

      {/* SOS Button - Large and prominent */}
      <div className="flex justify-center py-6">
        <Link href="/emergency" aria-label="Trigger SOS Emergency Beacon">
          <Button
            variant="danger"
            size="xl"
            className="w-60 h-60 sm:w-64 sm:h-64 rounded-full shadow-2xl text-3xl font-bold text-white transition-all hover:scale-105"
          >
            <span className="flex flex-col items-center">
              <AlertTriangleIcon className="h-16 w-16 mb-2" />
              SOS
            </span>
          </Button>
        </Link>
      </div>

      {/* Dual Emergency Action Notice: Phone 112 vs App Beacon */}
      <div className="mb-8 p-4 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <PhoneCallIcon className="h-6 w-6 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-bold text-red-900 dark:text-red-200">
              Direct Emergency Telephone Services (Call 112)
            </p>
            <p className="text-xs text-red-700 dark:text-red-300">
              For immediate critical situations, call national emergency responders directly. The SOS button broadcasts your coordinates via the app.
            </p>
          </div>
        </div>
        <a
          href="tel:112"
          className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-lg transition-colors shrink-0"
        >
          <PhoneCallIcon className="h-4 w-4" /> Call 112 Now
        </a>
      </div>

      {/* Four Core Healthcare Patient Tasks */}
      <div className="mb-10">
        <div className="mb-4">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Core Patient Services</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">Direct access to your emergency workflows, hospital directory, appointment planner, and devices</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Task 1: Emergency Help */}
          <Link
            href="/emergency"
            className="group bg-white dark:bg-gray-900 rounded-2xl p-6 text-left border border-gray-200 dark:border-gray-800 shadow-sm hover:shadow-xl hover:border-red-500/40 transition-all flex flex-col justify-between"
          >
            <div>
              <div className="bg-red-50 dark:bg-red-950/60 text-red-600 dark:text-red-400 rounded-xl p-3 w-12 h-12 mb-4 flex items-center justify-center group-hover:scale-105 transition-transform">
                <AlertTriangleIcon className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2 group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors">
                1. Emergency Assistance & SOS
              </h3>
              <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed mb-4">
                Initiate an emergency incident record with high-precision GPS positioning, share critical health details with first responders, and notify your emergency contacts.
              </p>
            </div>
            <div className="pt-3 border-t border-gray-100 dark:border-gray-800 space-y-1.5 text-xs text-gray-700 dark:text-gray-300">
              <div className="flex items-center gap-1.5 font-medium">
                <CheckCircleIcon className="h-3.5 w-3.5 text-emerald-500 shrink-0" /> Real-time GPS coordinate transmission
              </div>
              <div className="flex items-center gap-1.5 font-medium">
                <CheckCircleIcon className="h-3.5 w-3.5 text-emerald-500 shrink-0" /> Emergency contact broadcast notification
              </div>
              <div className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400 font-semibold mt-2">
                Open Emergency Center <ArrowRightIcon className="h-3.5 w-3.5 ml-1" />
              </div>
            </div>
          </Link>

          {/* Task 2: Find Hospitals */}
          <Link
            href="/hospitals"
            className="group bg-white dark:bg-gray-900 rounded-2xl p-6 text-left border border-gray-200 dark:border-gray-800 shadow-sm hover:shadow-xl hover:border-blue-500/40 transition-all flex flex-col justify-between"
          >
            <div>
              <div className="bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 rounded-xl p-3 w-12 h-12 mb-4 flex items-center justify-center group-hover:scale-105 transition-transform">
                <MapPinIcon className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                2. Find Accredited Hospitals
              </h3>
              <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed mb-4">
                Explore nearby hospitals and trauma centers sorted by driving distance. View verified telephone numbers, operating hours, and driving navigation.
              </p>
            </div>
            <div className="pt-3 border-t border-gray-100 dark:border-gray-800 space-y-1.5 text-xs text-gray-700 dark:text-gray-300">
              <div className="flex items-center gap-1.5 font-medium">
                <CheckCircleIcon className="h-3.5 w-3.5 text-emerald-500 shrink-0" /> Verified public healthcare directory
              </div>
              <div className="flex items-center gap-1.5 font-medium">
                <CheckCircleIcon className="h-3.5 w-3.5 text-emerald-500 shrink-0" /> Direct telephone dispatch & driving routes
              </div>
              <div className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400 font-semibold mt-2">
                Browse Nearby Facilities <ArrowRightIcon className="h-3.5 w-3.5 ml-1" />
              </div>
            </div>
          </Link>

          {/* Task 3: My Appointment Requests */}
          <Link
            href="/appointments"
            className="group bg-white dark:bg-gray-900 rounded-2xl p-6 text-left border border-gray-200 dark:border-gray-800 shadow-sm hover:shadow-xl hover:border-emerald-500/40 transition-all flex flex-col justify-between"
          >
            <div>
              <div className="bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 rounded-xl p-3 w-12 h-12 mb-4 flex items-center justify-center group-hover:scale-105 transition-transform">
                <CalendarDaysIcon className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                3. My Appointment Requests
              </h3>
              <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed mb-4">
                Manage your private consultation requests. Keep personal scheduling notes, track request status, reschedule, or cancel requests within your secure account.
              </p>
            </div>
            <div className="pt-3 border-t border-gray-100 dark:border-gray-800 space-y-1.5 text-xs text-gray-700 dark:text-gray-300">
              <div className="flex items-center gap-1.5 font-medium">
                <CheckCircleIcon className="h-3.5 w-3.5 text-emerald-500 shrink-0" /> Personal scheduling planner (stored in your account)
              </div>
              <div className="flex items-center gap-1.5 font-medium">
                <CheckCircleIcon className="h-3.5 w-3.5 text-emerald-500 shrink-0" /> Verified specialist catalog & custom hospital booking
              </div>
              <div className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400 font-semibold mt-2">
                View My Appointments <ArrowRightIcon className="h-3.5 w-3.5 ml-1" />
              </div>
            </div>
          </Link>

          {/* Task 4: Wearable & Health Devices */}
          <Link
            href="/devices"
            className="group bg-white dark:bg-gray-900 rounded-2xl p-6 text-left border border-gray-200 dark:border-gray-800 shadow-sm hover:shadow-xl hover:border-indigo-500/40 transition-all flex flex-col justify-between"
          >
            <div>
              <div className="bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 rounded-xl p-3 w-12 h-12 mb-4 flex items-center justify-center group-hover:scale-105 transition-transform">
                <SmartphoneIcon className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                4. Health Devices & Wearables
              </h3>
              <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed mb-4">
                Connect your Google Health account via OAuth 2.0. Review integration requirements for Apple Health and Wear OS companion apps.
              </p>
            </div>
            <div className="pt-3 border-t border-gray-100 dark:border-gray-800 space-y-1.5 text-xs text-gray-700 dark:text-gray-300">
              <div className="flex items-center gap-1.5 font-medium">
                <CheckCircleIcon className="h-3.5 w-3.5 text-emerald-500 shrink-0" /> Google Health API Web OAuth integration
              </div>
              <div className="flex items-center gap-1.5 font-medium">
                <CheckCircleIcon className="h-3.5 w-3.5 text-emerald-500 shrink-0" /> Companion app status indicators (Apple / Wear OS)
              </div>
              <div className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400 font-semibold mt-2">
                Manage Devices & Vitals <ArrowRightIcon className="h-3.5 w-3.5 ml-1" />
              </div>
            </div>
          </Link>
        </div>
      </div>

      {/* Recent emergencies history list */}
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow p-6 border border-gray-100 dark:border-gray-800 mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Your Recent Emergencies</h2>
          <Link
            href="/emergency"
            className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 font-medium flex items-center gap-1"
          >
            <PlusIcon className="h-4 w-4" />
            New Emergency
          </Link>
        </div>

        {emergenciesLoading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-100 dark:bg-gray-800 animate-pulse rounded-lg" />
            ))}
          </div>
        ) : emergencies.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <p>No recent emergencies</p>
            <p className="text-sm mt-1">Your emergency history will appear here.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {emergencies.map((e) => (
              <div
                key={e.id}
                className="flex items-center gap-4 p-3 border border-gray-200 dark:border-gray-800 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/60 cursor-pointer transition-colors"
                onClick={() => router.push(`/emergency/${e.id}`)}
              >
                {statusIcons[e.status] || <ClockIcon className="h-5 w-5 text-gray-400 shrink-0" />}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 dark:text-white">
                    {statusLabels[e.status] || e.status}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {new Date(e.created_at).toLocaleString()}
                  </p>
                </div>
                {e.eta_minutes && (
                  <span className="text-sm font-medium text-blue-600 dark:text-blue-400 shrink-0">
                    ETA: {e.eta_minutes} min
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick navigation shortcuts */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Quick Navigation</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Link
            href="/hospitals"
            className="flex flex-col items-center justify-center text-center p-3.5 bg-white dark:bg-gray-900 rounded-xl shadow border border-gray-100 dark:border-gray-800 hover:shadow-md hover:border-blue-500/30 transition-all"
          >
            <AmbulanceIcon className="h-6 w-6 text-blue-600 dark:text-blue-400 mb-2" />
            <span className="text-xs font-semibold text-gray-900 dark:text-white">Hospital Directory</span>
          </Link>

          <Link
            href="/appointments"
            className="flex flex-col items-center justify-center text-center p-3.5 bg-white dark:bg-gray-900 rounded-xl shadow border border-gray-100 dark:border-gray-800 hover:shadow-md hover:border-emerald-500/30 transition-all"
          >
            <CalendarDaysIcon className="h-6 w-6 text-emerald-600 dark:text-emerald-400 mb-2" />
            <span className="text-xs font-semibold text-gray-900 dark:text-white">Appointments</span>
          </Link>

          <Link
            href="/devices"
            className="flex flex-col items-center justify-center text-center p-3.5 bg-white dark:bg-gray-900 rounded-xl shadow border border-gray-100 dark:border-gray-800 hover:shadow-md hover:border-indigo-500/30 transition-all"
          >
            <SmartphoneIcon className="h-6 w-6 text-indigo-600 dark:text-indigo-400 mb-2" />
            <span className="text-xs font-semibold text-gray-900 dark:text-white">Health Devices</span>
          </Link>

          <Link
            href="/profile/health"
            className="flex flex-col items-center justify-center text-center p-3.5 bg-white dark:bg-gray-900 rounded-xl shadow border border-gray-100 dark:border-gray-800 hover:shadow-md hover:border-pink-500/30 transition-all"
          >
            <ActivityIcon className="h-6 w-6 text-pink-600 dark:text-pink-400 mb-2" />
            <span className="text-xs font-semibold text-gray-900 dark:text-white">Health Profile</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
