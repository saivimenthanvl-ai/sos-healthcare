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
  PlusIcon,
} from "lucide-react";
import { useRealtime } from "@/hooks/useRealtime";

type Emergency = Database["public"]["Tables"]["emergencies"]["Row"];

export function AuthenticatedDashboardView() {
  const { user, profile, loading: authLoading } = useAuth();
  const { latitude, longitude, error: locationError, loading: locationLoading } = useLocation();
  const [emergencies, setEmergencies] = useState<Emergency[]>([]);
  const [emergenciesLoading, setEmergenciesLoading] = useState(true);
  const [fitbitConnecting, setFitbitConnecting] = useState(false);
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
      } catch (err: any) {
        console.warn("[Dashboard] fetchEmergencies handled:", err?.message || err);
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
        <div className="text-center">Loading your dashboard...</div>
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

  const connectFitbit = async () => {
    if (fitbitConnecting) return;

    setFitbitConnecting(true);

    try {
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError) {
        console.error("[Fitbit] session error:", sessionError.message);
        return;
      }

      if (!session?.access_token) {
        console.error("[Fitbit] No authenticated Supabase session");
        router.push("/auth/login");
        return;
      }

      console.log("[Fitbit] user:", session.user.id);
      console.log("[Fitbit] access token present:", true);

      const { data, error } = await supabase.functions.invoke(
        "fitbit-connect",
        {
          method: "POST",
          body: {},
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        }
      );

      if (error) {
        console.error("[Fitbit] function error:", error);

        try {
          const result = await error.context.json();
          console.error("[Fitbit] Edge Function response:", result);
        } catch {
          console.error("[Fitbit] Unable to read function response");
        }

        return;
      }

      console.log("[Fitbit] response:", data);

      if (!data?.authorizationUrl) {
        console.error("[Fitbit] authorizationUrl missing");
        return;
      }

      window.location.assign(data.authorizationUrl);
    } catch (error) {
      console.error("[Fitbit] unexpected error:", error);
    } finally {
      setFitbitConnecting(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto py-6">
      {/* Hero section */}
      <div className="bg-gradient-to-r from-blue-600 to-red-500 rounded-xl p-6 sm:p-8 text-white mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold mb-2">
          {profile?.full_name ? `Hello, ${profile.full_name}` : "SOS Healthcare"}
        </h1>
        <p className="text-blue-100 max-w-2xl">
          In a medical emergency, press the SOS button below. We&apos;ll locate the
          nearest hospital and dispatch an ambulance within 10-20 minutes.
          No fees. No delays.
        </p>
      </div>

      {/* Location status */}
      <div className="flex items-center gap-3 mb-6 p-4 bg-white dark:bg-gray-900 rounded-lg shadow border border-gray-100 dark:border-gray-800">
        {locationLoading ? (
          <div className="animate-spin rounded-full h-5 w-5 border-2 border-blue-600 border-t-transparent" />
        ) : latitude != null && longitude != null ? (
          <MapPinIcon className="h-5 w-5 text-green-500" />
        ) : (
          <MapPinIcon className="h-5 w-5 text-red-500" />
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
      <div className="flex justify-center py-8">
        <Link href="/emergency">
          <Button
            variant="danger"
            size="xl"
            className="w-64 h-64 rounded-full shadow-2xl text-3xl font-bold text-white animate-pulse-slow hover:animate-none transition-all hover:scale-105"
          >
            <span className="flex flex-col items-center">
              <AlertTriangleIcon className="h-16 w-16 mb-2" />
              SOS
            </span>
          </Button>
        </Link>
      </div>

      {/* Recent emergencies */}
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow p-6 border border-gray-100 dark:border-gray-800">
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
                {statusIcons[e.status] || <ClockIcon className="h-5 w-5 text-gray-400" />}
                <div className="flex-1">
                  <p className="font-medium text-gray-900 dark:text-white">
                    {statusLabels[e.status] || e.status}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {new Date(e.created_at).toLocaleString()}
                  </p>
                </div>
                {e.eta_minutes && (
                  <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
                    ETA: {e.eta_minutes} min
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick links */}
      <div className="mt-8">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          <Link
            href="/hospitals"
            className="flex flex-col items-center justify-center text-center p-3.5 bg-white dark:bg-gray-900 rounded-xl shadow border border-gray-100 dark:border-gray-800 hover:shadow-md hover:border-blue-500/30 transition-all"
          >
            <AmbulanceIcon className="h-6 w-6 text-blue-600 dark:text-blue-400 mb-2" />
            <span className="text-xs font-semibold text-gray-900 dark:text-white">Nearby Hospitals</span>
          </Link>

          <Link
            href="/hospitals?map=true"
            className="flex flex-col items-center justify-center text-center p-3.5 bg-white dark:bg-gray-900 rounded-xl shadow border border-gray-100 dark:border-gray-800 hover:shadow-md hover:border-red-500/30 transition-all"
          >
            <MapPinIcon className="h-6 w-6 text-red-600 dark:text-red-400 mb-2" />
            <span className="text-xs font-semibold text-gray-900 dark:text-white">Find Hospitals Near You</span>
          </Link>

          <Link
            href="/devices"
            className="flex flex-col items-center justify-center text-center p-3.5 bg-white dark:bg-gray-900 rounded-xl shadow border border-gray-100 dark:border-gray-800 hover:shadow-md hover:border-emerald-500/30 transition-all"
          >
            <PlusIcon className="h-6 w-6 text-emerald-600 dark:text-emerald-400 mb-2" />
            <span className="text-xs font-semibold text-gray-900 dark:text-white">Connect Fitbit</span>
          </Link>

          <Link
            href="/appointments"
            className="flex flex-col items-center justify-center text-center p-3.5 bg-white dark:bg-gray-900 rounded-xl shadow border border-gray-100 dark:border-gray-800 hover:shadow-md hover:border-indigo-500/30 transition-all"
          >
            <ClockIcon className="h-6 w-6 text-indigo-600 dark:text-indigo-400 mb-2" />
            <span className="text-xs font-semibold text-gray-900 dark:text-white">Book Appointment</span>
          </Link>

          <Link
            href="/profile/health"
            className="flex flex-col items-center justify-center text-center p-3.5 bg-white dark:bg-gray-900 rounded-xl shadow border border-gray-100 dark:border-gray-800 hover:shadow-md hover:border-pink-500/30 transition-all"
          >
            <CheckCircleIcon className="h-6 w-6 text-pink-600 dark:text-pink-400 mb-2" />
            <span className="text-xs font-semibold text-gray-900 dark:text-white">Health Profile</span>
          </Link>
        </div>
      </div>

      {/* Six Feature Entry Point Cards */}
      <div className="mt-10">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Emergency Services & Integrations</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">Click any card to open the dedicated feature module</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Card 1: One-Tap SOS -> /emergency */}
          <Link
            href="/emergency"
            className="group bg-white dark:bg-gray-900 rounded-2xl p-6 text-left border border-gray-200 dark:border-gray-800 shadow-sm hover:shadow-xl hover:border-red-500/40 transition-all flex flex-col justify-between"
          >
            <div>
              <div className="bg-red-50 dark:bg-red-950/60 text-red-600 dark:text-red-400 rounded-xl p-3 w-12 h-12 mb-4 flex items-center justify-center group-hover:scale-105 transition-transform">
                <AlertTriangleIcon className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2 group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors">
                One-Tap SOS
              </h3>
              <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed mb-4">
                Press a single emergency button to immediately alert closest ambulances and hospitals. Your precise GPS coordinates and emergency contacts are notified automatically in seconds.
              </p>
            </div>
            <div className="pt-3 border-t border-gray-100 dark:border-gray-800 space-y-1.5 text-xs text-gray-700 dark:text-gray-300">
              <div className="flex items-center gap-1.5 font-medium">
                <CheckCircleIcon className="h-3.5 w-3.5 text-emerald-500" /> Instant GPS beacon
              </div>
              <div className="flex items-center gap-1.5 font-medium">
                <CheckCircleIcon className="h-3.5 w-3.5 text-emerald-500" /> Multi-contact SMS broadcast
              </div>
              <div className="flex items-center gap-1.5 font-medium">
                <CheckCircleIcon className="h-3.5 w-3.5 text-emerald-500" /> Automated ER dispatch
              </div>
            </div>
          </Link>

          {/* Card 2: 10-20 Min ETA -> /emergency/location */}
          <Link
            href="/emergency/location"
            className="group bg-white dark:bg-gray-900 rounded-2xl p-6 text-left border border-gray-200 dark:border-gray-800 shadow-sm hover:shadow-xl hover:border-blue-500/40 transition-all flex flex-col justify-between"
          >
            <div>
              <div className="bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 rounded-xl p-3 w-12 h-12 mb-4 flex items-center justify-center group-hover:scale-105 transition-transform">
                <ClockIcon className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                10-20 Min ETA
              </h3>
              <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed mb-4">
                Smart priority ambulance fleet matching routes the nearest available unit directly to your coordinates with turn-by-turn navigation and live arrival countdowns.
              </p>
            </div>
            <div className="pt-3 border-t border-gray-100 dark:border-gray-800 space-y-1.5 text-xs text-gray-700 dark:text-gray-300">
              <div className="flex items-center gap-1.5 font-medium">
                <CheckCircleIcon className="h-3.5 w-3.5 text-emerald-500" /> Live GPS fleet tracking
              </div>
              <div className="flex items-center gap-1.5 font-medium">
                <CheckCircleIcon className="h-3.5 w-3.5 text-emerald-500" /> Dynamic traffic routing
              </div>
              <div className="flex items-center gap-1.5 font-medium">
                <CheckCircleIcon className="h-3.5 w-3.5 text-emerald-500" /> Real-time paramedic chat
              </div>
            </div>
          </Link>

          {/* Card 3: Nearby Hospitals -> /hospitals */}
          <Link
            href="/hospitals"
            className="group bg-white dark:bg-gray-900 rounded-2xl p-6 text-left border border-gray-200 dark:border-gray-800 shadow-sm hover:shadow-xl hover:border-emerald-500/40 transition-all flex flex-col justify-between"
          >
            <div>
              <div className="bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 rounded-xl p-3 w-12 h-12 mb-4 flex items-center justify-center group-hover:scale-105 transition-transform">
                <MapPinIcon className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                Nearby Hospitals
              </h3>
              <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed mb-4">
                Locate accredited hospitals with real-time verified ICU beds, ER capacity, and direct emergency room triage booking customized to patient needs.
              </p>
            </div>
            <div className="pt-3 border-t border-gray-100 dark:border-gray-800 space-y-1.5 text-xs text-gray-700 dark:text-gray-300">
              <div className="flex items-center gap-1.5 font-medium">
                <CheckCircleIcon className="h-3.5 w-3.5 text-emerald-500" /> Real-time bed availability
              </div>
              <div className="flex items-center gap-1.5 font-medium">
                <CheckCircleIcon className="h-3.5 w-3.5 text-emerald-500" /> Direct ER triage reservation
              </div>
              <div className="flex items-center gap-1.5 font-medium">
                <CheckCircleIcon className="h-3.5 w-3.5 text-emerald-500" /> One-tap Google Maps directions
              </div>
            </div>
          </Link>

          {/* Card 4: Smartwatch Integration -> /devices */}
          <Link
            href="/devices"
            className="group bg-white dark:bg-gray-900 rounded-2xl p-6 text-left border border-gray-200 dark:border-gray-800 shadow-sm hover:shadow-xl hover:border-indigo-500/40 transition-all flex flex-col justify-between"
          >
            <div>
              <div className="bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 rounded-xl p-3 w-12 h-12 mb-4 flex items-center justify-center group-hover:scale-105 transition-transform">
                <PlusIcon className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                Smartwatch Integration
              </h3>
              <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed mb-4">
                Seamlessly connect your Fitbit, Apple Watch, or Android Wear device. Automatic fall detection and extreme heart rate spikes trigger emergency help without taking out your phone.
              </p>
            </div>
            <div className="pt-3 border-t border-gray-100 dark:border-gray-800 space-y-1.5 text-xs text-gray-700 dark:text-gray-300">
              <div className="flex items-center gap-1.5 font-medium">
                <CheckCircleIcon className="h-3.5 w-3.5 text-emerald-500" /> Automated fall detection
              </div>
              <div className="flex items-center gap-1.5 font-medium">
                <CheckCircleIcon className="h-3.5 w-3.5 text-emerald-500" /> Heart rate spike/drop alerts
              </div>
              <div className="flex items-center gap-1.5 font-medium">
                <CheckCircleIcon className="h-3.5 w-3.5 text-emerald-500" /> Instant wrist SOS trigger
              </div>
            </div>
          </Link>

          {/* Card 5: Health Data Sharing -> /profile/health */}
          <Link
            href="/profile/health"
            className="group bg-white dark:bg-gray-900 rounded-2xl p-6 text-left border border-gray-200 dark:border-gray-800 shadow-sm hover:shadow-xl hover:border-pink-500/40 transition-all flex flex-col justify-between"
          >
            <div>
              <div className="bg-pink-50 dark:bg-pink-950/60 text-pink-600 dark:text-pink-400 rounded-xl p-3 w-12 h-12 mb-4 flex items-center justify-center group-hover:scale-105 transition-transform">
                <CheckCircleIcon className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2 group-hover:text-pink-600 dark:group-hover:text-pink-400 transition-colors">
                Health Data Sharing
              </h3>
              <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed mb-4">
                Your real-time vitals, blood type, known allergies, chronic conditions, and emergency contacts are securely shared with doctors and incoming paramedics ahead of arrival.
              </p>
            </div>
            <div className="pt-3 border-t border-gray-100 dark:border-gray-800 space-y-1.5 text-xs text-gray-700 dark:text-gray-300">
              <div className="flex items-center gap-1.5 font-medium">
                <CheckCircleIcon className="h-3.5 w-3.5 text-emerald-500" /> Encrypted medical profile
              </div>
              <div className="flex items-center gap-1.5 font-medium">
                <CheckCircleIcon className="h-3.5 w-3.5 text-emerald-500" /> Allergy & blood group badge
              </div>
              <div className="flex items-center gap-1.5 font-medium">
                <CheckCircleIcon className="h-3.5 w-3.5 text-emerald-500" /> Paramedic pre-arrival briefing
              </div>
            </div>
          </Link>

          {/* Card 6: No Fees -> Informational Card */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 text-left border border-gray-200 dark:border-gray-800 shadow-sm flex flex-col justify-between">
            <div>
              <div className="bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 rounded-xl p-3 w-12 h-12 mb-4 flex items-center justify-center">
                <ClockIcon className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                No Fees
              </h3>
              <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed mb-4">
                This service is completely free for users. No hidden charges. Emergency care should never cost you.
              </p>
            </div>
            <div className="pt-3 border-t border-gray-100 dark:border-gray-800 text-xs text-gray-500 dark:text-gray-400">
              <span>SOS Healthcare platform usage is 100% free. Independent hospital fees may apply depending on treatment.</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
