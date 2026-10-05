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
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-8">
        <Link
          href="/hospitals"
          className="flex flex-col items-center gap-2 p-4 bg-white dark:bg-gray-900 rounded-xl shadow border border-gray-100 dark:border-gray-800 hover:shadow-md transition-shadow"
        >
          <AmbulanceIcon className="h-8 w-8 text-blue-600 dark:text-blue-400" />
          <span className="font-medium text-gray-900 dark:text-white">Nearby Hospitals</span>
        </Link>
        <Link
          href="/hospitals?map=true"
          className="flex flex-col items-center gap-2 p-4 bg-white dark:bg-gray-900 rounded-xl shadow border border-gray-100 dark:border-gray-800 hover:shadow-md transition-shadow"
        >
          <MapPinIcon className="h-8 w-8 text-red-600 dark:text-red-400" />
          <span className="font-medium text-gray-900 dark:text-white">Find Hospitals Near You</span>
        </Link>
        <Link
          href="/profile"
          className="flex flex-col items-center gap-2 p-4 bg-white dark:bg-gray-900 rounded-xl shadow border border-gray-100 dark:border-gray-800 hover:shadow-md transition-shadow"
        >
          <PlusIcon className="h-8 w-8 text-green-600 dark:text-green-400" />
          <span className="font-medium text-gray-900 dark:text-white">Health Devices</span>
        </Link>
      </div>
    </div>
  );
}
