"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { getLocalizedPatientName } from "@/lib/patient-name";
import { useLocation } from "@/hooks/useLocation";
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
  RefreshCwIcon,
  WifiOffIcon,
  ShieldAlertIcon,
  DatabaseIcon,
} from "lucide-react";
import { useRealtime } from "@/hooks/useRealtime";

type Emergency = Database["public"]["Tables"]["emergencies"]["Row"];

export type EmergencyErrorCategory =
  | "AUTH_FAILURE"
  | "SCHEMA_MISSING"
  | "DATABASE_UNAVAILABLE"
  | "NETWORK_FAILURE"
  | null;

interface EmergencyFetchState {
  category: EmergencyErrorCategory;
  message: string;
}

export function AuthenticatedDashboardView() {
  const { user, profile, loading: authLoading } = useAuth();
  const { t, language } = useLanguage();
  const { latitude, longitude, loading: locationLoading } = useLocation();
  const [emergencies, setEmergencies] = useState<Emergency[]>([]);
  const [emergenciesLoading, setEmergenciesLoading] = useState(true);
  const [emergencyError, setEmergencyError] = useState<EmergencyFetchState | null>(null);
  const [schemaAvailable, setSchemaAvailable] = useState<boolean>(true);
  const [retryCount, setRetryCount] = useState<number>(0);
  const router = useRouter();

  useEffect(() => {
    if (!user) return;

    let isMounted = true;

    const fetchEmergencies = async () => {
      setEmergenciesLoading(true);
      setEmergencyError(null);

      try {
        const { data, error } = await supabase
          .from("emergencies")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(5);

        if (!isMounted) return;

        if (error) {
          console.warn("[Dashboard] fetchEmergencies query error:", error.code, error.message);
          // Categorize error distinctly
          if (error.code === "PGRST205" || error.message?.toLowerCase().includes("schema cache") || error.message?.toLowerCase().includes("does not exist")) {
            setSchemaAvailable(false);
            setEmergencyError({
              category: "SCHEMA_MISSING",
              message: "Emergency service database schema is updating. History will display once table sync finishes.",
            });
          } else if (error.code === "42501" || error.code === "PGRST301" || error.message?.toLowerCase().includes("jwt") || error.message?.toLowerCase().includes("permission")) {
            setEmergencyError({
              category: "AUTH_FAILURE",
              message: "Authentication authorization error. Please sign in again to verify account access.",
            });
          } else if (error.code === "53300" || error.code === "PGRST000" || error.message?.toLowerCase().includes("unavailable") || error.message?.toLowerCase().includes("timeout")) {
            setEmergencyError({
              category: "DATABASE_UNAVAILABLE",
              message: "Database service temporarily busy. Please retry in a few moments.",
            });
          } else {
            setEmergencyError({
              category: "DATABASE_UNAVAILABLE",
              message: error.message || "Failed to load emergency history.",
            });
          }
          setEmergencies([]);
        } else {
          setSchemaAvailable(true);
          setEmergencyError(null);
          setEmergencies(data || []);
        }
      } catch (err: unknown) {
        if (!isMounted) return;
        const msg = err instanceof Error ? err.message : String(err);
        console.warn("[Dashboard] fetchEmergencies network/client exception:", msg);
        if (msg.toLowerCase().includes("failed to fetch") || msg.toLowerCase().includes("network")) {
          setEmergencyError({
            category: "NETWORK_FAILURE",
            message: "Network connection lost. Check your internet connection and retry.",
          });
        } else {
          setEmergencyError({
            category: "DATABASE_UNAVAILABLE",
            message: "Unable to retrieve emergency history.",
          });
        }
        setEmergencies([]);
      } finally {
        if (isMounted) {
          setEmergenciesLoading(false);
        }
      }
    };

    fetchEmergencies();

    return () => {
      isMounted = false;
    };
  }, [user, retryCount]);

  // Subscribe to realtime updates on user's emergencies ONLY when user is authorized and schema is available
  useRealtime<Emergency>(
    "emergencies",
    user && schemaAvailable ? `user_id=eq.${user.id}` : null,
    undefined,
    (updatedEmergency) => {
      setEmergencies((prev) =>
        prev.map((e) => (e.id === updatedEmergency.id ? updatedEmergency : e))
      );
    },
    undefined,
    Boolean(user && schemaAvailable)
  );

  if (authLoading) {
    return (
      <div className="max-w-5xl mx-auto py-3 sm:py-5 space-y-4 sm:space-y-6 animate-pulse">
        <div className="border-b border-gray-200 dark:border-gray-800 pb-3 sm:pb-4 space-y-2">
          <div className="h-7 w-64 bg-gray-200 dark:bg-gray-800 rounded-md" />
          <div className="h-4 w-96 max-w-full bg-gray-100 dark:bg-gray-850 rounded" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 sm:gap-4 items-stretch">
          <div className="md:col-span-6 h-36 bg-gray-100 dark:bg-gray-800 rounded-xl" />
          <div className="md:col-span-6 h-36 bg-gray-100 dark:bg-gray-800 rounded-xl" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 pt-2">
          <div className="h-40 bg-gray-100 dark:bg-gray-800 rounded-xl" />
          <div className="h-40 bg-gray-100 dark:bg-gray-800 rounded-xl" />
          <div className="h-40 bg-gray-100 dark:bg-gray-800 rounded-xl" />
          <div className="h-40 bg-gray-100 dark:bg-gray-800 rounded-xl" />
        </div>
      </div>
    );
  }

  const statusIcons: Record<string, React.ReactNode> = {
    pending: <ClockIcon className="h-4 w-4 text-yellow-500 shrink-0" />,
    dispatched: <AmbulanceIcon className="h-4 w-4 text-blue-500 shrink-0" />,
    en_route: <MapPinIcon className="h-4 w-4 text-indigo-500 shrink-0" />,
    arrived: <CheckCircleIcon className="h-4 w-4 text-green-500 shrink-0" />,
    resolved: <CheckCircleIcon className="h-4 w-4 text-emerald-500 shrink-0" />,
    cancelled: <AlertTriangleIcon className="h-4 w-4 text-gray-400 shrink-0" />,
  };

  const statusLabels: Record<string, string> = {
    pending: "Awaiting Dispatch",
    dispatched: "Ambulance Dispatched",
    en_route: "Ambulance En Route",
    arrived: "Ambulance Arrived",
    resolved: "Resolved",
    cancelled: "Cancelled",
  };

  const rawName = profile?.full_name || user?.user_metadata?.full_name;
  const displayName = rawName ? getLocalizedPatientName(rawName, language) : null;

  return (
    <div className="max-w-5xl mx-auto py-3 sm:py-5 space-y-4 sm:space-y-6">
      {/* Hero Welcome banner - Compact and clean */}
      <div className="border-b border-gray-200 dark:border-gray-800 pb-3 sm:pb-4 text-gray-950 dark:text-white">
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight mb-1 truncate">
          {displayName ? t.dashboard.greeting.replace("{name}", displayName) : t.dashboard.defaultGreeting}
        </h1>
        <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 max-w-3xl leading-relaxed">
          {t.dashboard.heroSubtitle}
        </p>
      </div>

      {/* Dual Emergency Action Zone: Responsive split grid (Direct Phone 112 vs App SOS Beacon) */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3 sm:gap-4 items-stretch">
        {/* Left Action Box: Direct Phone 112 Call (Crucial & Immediate) */}
        <div className="md:col-span-6 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 rounded-xl p-3.5 sm:p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <PhoneCallIcon className="h-4 w-4 text-red-600 dark:text-red-400 shrink-0" />
              <h2 className="text-xs sm:text-sm font-bold text-red-900 dark:text-red-200">
                {t.dashboard.call112Title}
              </h2>
            </div>
            <p className="text-[11px] sm:text-xs text-red-800 dark:text-red-300 leading-relaxed mb-3">
              {t.dashboard.call112Desc}
            </p>
          </div>
          <a
            href="tel:112"
            className="inline-flex items-center justify-center gap-2 w-full py-2.5 px-4 bg-red-600 hover:bg-red-700 text-white text-xs sm:text-sm font-bold rounded-lg shadow-sm transition-colors"
          >
            <PhoneCallIcon className="h-4 w-4 shrink-0" />
            <span>{t.dashboard.call112Action}</span>
          </a>
        </div>

        {/* Right Action Box: Digital SOS Beacon Trigger */}
        <div className="md:col-span-6 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-3.5 sm:p-4 flex items-center justify-between gap-3 shadow-xs">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 mb-1">
              <AlertTriangleIcon className="h-4 w-4 text-amber-500 shrink-0" />
              <h2 className="text-xs sm:text-sm font-bold text-gray-900 dark:text-white">
                {t.dashboard.sosButtonLabel}
              </h2>
            </div>
            <p className="text-[11px] sm:text-xs text-gray-500 dark:text-gray-400 line-clamp-2">
              Broadcasts GPS coordinates & health details to your emergency contacts.
            </p>

            {/* Inline location indicator */}
            <div className="flex items-center gap-1.5 mt-2 text-[11px] text-gray-600 dark:text-gray-300">
              {locationLoading ? (
                <span className="h-2 w-2 rounded-full bg-blue-500 animate-ping shrink-0" />
              ) : latitude != null && longitude != null ? (
                <span className="h-2 w-2 rounded-full bg-emerald-500 shrink-0" />
              ) : (
                <span className="h-2 w-2 rounded-full bg-red-500 shrink-0" />
              )}
              <span className="truncate">
                {locationLoading
                  ? t.dashboard.locating
                  : latitude != null && longitude != null
                  ? `${latitude.toFixed(3)}, ${longitude.toFixed(3)}`
                  : t.dashboard.locationUnavailable}
              </span>
            </div>
          </div>

          <Link href="/emergency" className="shrink-0" aria-label={t.dashboard.sosButtonLabel}>
            <button
              type="button"
              className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-red-600 hover:bg-red-700 text-white flex flex-col items-center justify-center font-black text-sm sm:text-base shadow-lg hover:scale-105 active:scale-95 transition-transform"
            >
              <AlertTriangleIcon className="h-5 w-5 sm:h-6 sm:w-6 mb-0.5" />
              <span>SOS</span>
            </button>
          </Link>
        </div>
      </div>

      {/* Four Core Healthcare Patient Tasks */}
      <div className="pt-2">
        <div className="mb-3">
          <h2 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white">
            {t.dashboard.coreServicesTitle}
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {t.dashboard.coreServicesDesc}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
          {/* Task 1: Emergency Help */}
          <Link
            href="/emergency"
            className="group bg-white dark:bg-gray-900 rounded-xl p-4 sm:p-5 text-left border border-gray-200 dark:border-gray-800 shadow-xs hover:shadow-md hover:border-red-500/40 transition-all flex flex-col justify-between"
          >
            <div>
              <div className="bg-red-50 dark:bg-red-950/60 text-red-600 dark:text-red-400 rounded-lg p-2.5 w-10 h-10 mb-3 flex items-center justify-center group-hover:scale-105 transition-transform">
                <AlertTriangleIcon className="h-5 w-5" />
              </div>
              <h3 className="text-sm sm:text-base font-bold text-gray-900 dark:text-white mb-1.5 group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors">
                {t.dashboard.card1Title}
              </h3>
              <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed mb-3">
                {t.dashboard.card1Desc}
              </p>
            </div>
            <div className="pt-2.5 border-t border-gray-100 dark:border-gray-800 space-y-1 text-xs text-gray-600 dark:text-gray-400">
              <div className="flex items-center gap-1.5">
                <CheckCircleIcon className="h-3 w-3 text-emerald-500 shrink-0" />
                <span>{t.dashboard.card1Bullet1}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircleIcon className="h-3 w-3 text-emerald-500 shrink-0" />
                <span>{t.dashboard.card1Bullet2}</span>
              </div>
              <div className="flex items-center gap-1 text-blue-600 dark:text-blue-400 font-semibold pt-1">
                <span>{t.dashboard.card1Action}</span>
                <ArrowRightIcon className="h-3 w-3 rtl:rotate-180" />
              </div>
            </div>
          </Link>

          {/* Task 2: Find Hospitals */}
          <Link
            href="/hospitals"
            className="group bg-white dark:bg-gray-900 rounded-xl p-4 sm:p-5 text-left border border-gray-200 dark:border-gray-800 shadow-xs hover:shadow-md hover:border-blue-500/40 transition-all flex flex-col justify-between"
          >
            <div>
              <div className="bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 rounded-lg p-2.5 w-10 h-10 mb-3 flex items-center justify-center group-hover:scale-105 transition-transform">
                <MapPinIcon className="h-5 w-5" />
              </div>
              <h3 className="text-sm sm:text-base font-bold text-gray-900 dark:text-white mb-1.5 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                {t.dashboard.card2Title}
              </h3>
              <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed mb-3">
                {t.dashboard.card2Desc}
              </p>
            </div>
            <div className="pt-2.5 border-t border-gray-100 dark:border-gray-800 space-y-1 text-xs text-gray-600 dark:text-gray-400">
              <div className="flex items-center gap-1.5">
                <CheckCircleIcon className="h-3 w-3 text-emerald-500 shrink-0" />
                <span>{t.dashboard.card2Bullet1}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircleIcon className="h-3 w-3 text-emerald-500 shrink-0" />
                <span>{t.dashboard.card2Bullet2}</span>
              </div>
              <div className="flex items-center gap-1 text-blue-600 dark:text-blue-400 font-semibold pt-1">
                <span>{t.dashboard.card2Action}</span>
                <ArrowRightIcon className="h-3 w-3 rtl:rotate-180" />
              </div>
            </div>
          </Link>

          {/* Task 3: My Appointment Requests */}
          <Link
            href="/appointments"
            className="group bg-white dark:bg-gray-900 rounded-xl p-4 sm:p-5 text-left border border-gray-200 dark:border-gray-800 shadow-xs hover:shadow-md hover:border-emerald-500/40 transition-all flex flex-col justify-between"
          >
            <div>
              <div className="bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 rounded-lg p-2.5 w-10 h-10 mb-3 flex items-center justify-center group-hover:scale-105 transition-transform">
                <CalendarDaysIcon className="h-5 w-5" />
              </div>
              <h3 className="text-sm sm:text-base font-bold text-gray-900 dark:text-white mb-1.5 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                {t.dashboard.card3Title}
              </h3>
              <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed mb-3">
                {t.dashboard.card3Desc}
              </p>
            </div>
            <div className="pt-2.5 border-t border-gray-100 dark:border-gray-800 space-y-1 text-xs text-gray-600 dark:text-gray-400">
              <div className="flex items-center gap-1.5">
                <CheckCircleIcon className="h-3 w-3 text-emerald-500 shrink-0" />
                <span>{t.dashboard.card3Bullet1}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircleIcon className="h-3 w-3 text-emerald-500 shrink-0" />
                <span>{t.dashboard.card3Bullet2}</span>
              </div>
              <div className="flex items-center gap-1 text-blue-600 dark:text-blue-400 font-semibold pt-1">
                <span>{t.dashboard.card3Action}</span>
                <ArrowRightIcon className="h-3 w-3 rtl:rotate-180" />
              </div>
            </div>
          </Link>

          {/* Task 4: Wearable & Health Devices */}
          <Link
            href="/devices"
            className="group bg-white dark:bg-gray-900 rounded-xl p-4 sm:p-5 text-left border border-gray-200 dark:border-gray-800 shadow-xs hover:shadow-md hover:border-indigo-500/40 transition-all flex flex-col justify-between"
          >
            <div>
              <div className="bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 rounded-lg p-2.5 w-10 h-10 mb-3 flex items-center justify-center group-hover:scale-105 transition-transform">
                <SmartphoneIcon className="h-5 w-5" />
              </div>
              <h3 className="text-sm sm:text-base font-bold text-gray-900 dark:text-white mb-1.5 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                {t.dashboard.card4Title}
              </h3>
              <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed mb-3">
                {t.dashboard.card4Desc}
              </p>
            </div>
            <div className="pt-2.5 border-t border-gray-100 dark:border-gray-800 space-y-1 text-xs text-gray-600 dark:text-gray-400">
              <div className="flex items-center gap-1.5">
                <CheckCircleIcon className="h-3 w-3 text-emerald-500 shrink-0" />
                <span>{t.dashboard.card4Bullet1}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircleIcon className="h-3 w-3 text-emerald-500 shrink-0" />
                <span>{t.dashboard.card4Bullet2}</span>
              </div>
              <div className="flex items-center gap-1 text-blue-600 dark:text-blue-400 font-semibold pt-1">
                <span>{t.dashboard.card4Action}</span>
                <ArrowRightIcon className="h-3 w-3 rtl:rotate-180" />
              </div>
            </div>
          </Link>
        </div>
      </div>

      {/* Recent emergencies history list */}
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-xs p-4 sm:p-5 border border-gray-200 dark:border-gray-800">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm sm:text-base font-bold text-gray-900 dark:text-white">
            {t.dashboard.recentEmergencies}
          </h2>
          <Link
            href="/emergency"
            className="text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400 font-semibold flex items-center gap-1"
          >
            <PlusIcon className="h-3.5 w-3.5" />
            <span>{t.dashboard.newEmergency}</span>
          </Link>
        </div>

        {emergenciesLoading ? (
          <div className="space-y-2">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="h-12 bg-gray-100 dark:bg-gray-800 animate-pulse rounded-lg" />
            ))}
          </div>
        ) : emergencyError ? (
          <div className="py-4 px-3.5 rounded-lg border border-amber-200 dark:border-amber-900/60 bg-amber-50/70 dark:bg-amber-950/20 text-gray-800 dark:text-gray-200">
            <div className="flex items-start gap-2.5">
              {emergencyError.category === "AUTH_FAILURE" && (
                <ShieldAlertIcon className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              )}
              {emergencyError.category === "SCHEMA_MISSING" && (
                <DatabaseIcon className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              )}
              {emergencyError.category === "NETWORK_FAILURE" && (
                <WifiOffIcon className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              )}
              {emergencyError.category === "DATABASE_UNAVAILABLE" && (
                <AlertTriangleIcon className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-gray-900 dark:text-gray-100">
                  {emergencyError.category === "AUTH_FAILURE"
                    ? "Authorization Required"
                    : emergencyError.category === "SCHEMA_MISSING"
                    ? "Emergency Service Syncing"
                    : emergencyError.category === "NETWORK_FAILURE"
                    ? "Network Unavailable"
                    : "Service Temporarily Unavailable"}
                </p>
                <p className="text-[11px] text-gray-600 dark:text-gray-300 mt-0.5">
                  {emergencyError.message}
                </p>
                <div className="mt-2.5 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setRetryCount((c) => c + 1)}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                  >
                    <RefreshCwIcon className="h-3 w-3" />
                    <span>Retry</span>
                  </button>
                  {emergencyError.category === "AUTH_FAILURE" && (
                    <button
                      type="button"
                      onClick={() => router.push("/auth/login")}
                      className="px-2 py-1 text-xs text-amber-700 dark:text-amber-300 hover:underline"
                    >
                      Sign In
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : emergencies.length === 0 ? (
          <div className="text-center py-5 text-gray-500 dark:text-gray-400">
            <p className="text-xs">{t.dashboard.noEmergencies}</p>
            <p className="text-[11px] text-gray-400 mt-0.5">{t.dashboard.noEmergenciesSub}</p>
          </div>
        ) : (
          <div className="space-y-2">
            {emergencies.map((e) => (
              <div
                key={e.id}
                className="flex items-center gap-3 p-2.5 border border-gray-100 dark:border-gray-800 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/60 cursor-pointer transition-colors"
                onClick={() => router.push(`/emergency/${e.id}`)}
              >
                {statusIcons[e.status] || <ClockIcon className="h-4 w-4 text-gray-400 shrink-0" />}
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-gray-900 dark:text-white truncate">
                    {statusLabels[e.status] || e.status}
                  </p>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400">
                    {new Date(e.created_at).toLocaleString()}
                  </p>
                </div>
                {e.eta_minutes && (
                  <span className="text-xs font-bold text-blue-600 dark:text-blue-400 shrink-0">
                    ETA: {e.eta_minutes}m
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Navigation Shortcuts */}
      <div className="pt-1">
        <h2 className="text-xs uppercase font-bold tracking-wider text-gray-500 dark:text-gray-400 mb-2">
          {t.dashboard.quickNav}
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <Link
            href="/hospitals"
            className="flex items-center gap-2 p-2.5 bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 hover:border-blue-500/40 text-xs font-medium text-gray-800 dark:text-gray-200 transition-all"
          >
            <AmbulanceIcon className="h-4 w-4 text-blue-600 dark:text-blue-400 shrink-0" />
            <span className="truncate">{t.common.hospitals}</span>
          </Link>

          <Link
            href="/appointments"
            className="flex items-center gap-2 p-2.5 bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 hover:border-emerald-500/40 text-xs font-medium text-gray-800 dark:text-gray-200 transition-all"
          >
            <CalendarDaysIcon className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span className="truncate">{t.common.appointments}</span>
          </Link>

          <Link
            href="/devices"
            className="flex items-center gap-2 p-2.5 bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 hover:border-indigo-500/40 text-xs font-medium text-gray-800 dark:text-gray-200 transition-all"
          >
            <SmartphoneIcon className="h-4 w-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
            <span className="truncate">{t.common.devices}</span>
          </Link>

          <Link
            href="/profile/health"
            className="flex items-center gap-2 p-2.5 bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 hover:border-pink-500/40 text-xs font-medium text-gray-800 dark:text-gray-200 transition-all"
          >
            <ActivityIcon className="h-4 w-4 text-pink-600 dark:text-pink-400 shrink-0" />
            <span className="truncate">{t.common.profile}</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
