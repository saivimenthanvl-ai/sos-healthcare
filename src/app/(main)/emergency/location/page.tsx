"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useLocation } from "@/hooks/useLocation";
import { useAuth } from "@/contexts/AuthContext";
import { MapPinIcon, NavigationIcon, AlertTriangleIcon, ClockIcon, ArrowLeftIcon, PhoneIcon } from "lucide-react";
import { Button } from "@/components/ui/Button";

export default function EmergencyLocationPage() {
  const { user } = useAuth();
  const { latitude, longitude, error: locationError, loading: locationLoading, requestLocation } = useLocation();
  const [nearestHospital, setNearestHospital] = useState<{
    name: string;
    address: string;
    distance_km?: number;
    phone?: string;
  } | null>(null);
  const [loadingHospital, setLoadingHospital] = useState(false);

  useEffect(() => {
    if (!latitude || !longitude) return;

    const fetchNearest = async () => {
      setLoadingHospital(true);
      try {
        const res = await fetch(`/api/hospitals?lat=${latitude}&lng=${longitude}&radius=25`);
        if (res.ok) {
          const data = await res.json();
          if (data.hospitals && data.hospitals.length > 0) {
            setNearestHospital(data.hospitals[0]);
          }
        }
      } catch (err) {
        console.warn("Failed to load nearest hospital:", err);
      } finally {
        setLoadingHospital(false);
      }
    };

    fetchNearest();
  }, [latitude, longitude]);

  // Distinct concepts:
  // 1. User -> Hospital travel time (calculated using road distance/speed)
  const userToHospitalDistance = nearestHospital?.distance_km ?? null;
  const userToHospitalMinutes = userToHospitalDistance
    ? Math.max(Math.round((userToHospitalDistance / 35) * 60), 2)
    : null;

  return (
    <div className="max-w-4xl mx-auto space-y-6 py-4">
      {/* Back button */}
      <div className="flex items-center justify-between">
        <Link href="/emergency" className="inline-flex items-center text-sm font-semibold text-blue-600 dark:text-blue-400 hover:underline">
          <ArrowLeftIcon className="h-4 w-4 mr-1" /> Back to Emergency SOS
        </Link>
        <span className="text-xs bg-red-100 text-red-800 dark:bg-red-950/70 dark:text-red-300 font-semibold px-2.5 py-1 rounded-full">
          Live Location Beacon
        </span>
      </div>

      {/* Header */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow p-6 border border-gray-200 dark:border-gray-800">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
          <MapPinIcon className="h-6 w-6 text-red-600" />
          Emergency Location & Response Status
        </h1>
        <p className="text-sm text-gray-600 dark:text-gray-300">
          Real-time GPS beacon coordinates and navigation routing to the nearest verified emergency center.
        </p>
      </div>

      {/* GPS Coordinates Card */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow p-6 border border-gray-200 dark:border-gray-800 space-y-4">
          <h2 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <NavigationIcon className="h-5 w-5 text-blue-600" />
            Your Precise GPS Beacon
          </h2>

          <div className="bg-gray-50 dark:bg-gray-800/60 rounded-xl p-4 space-y-2 text-sm">
            <div className="flex justify-between py-1 border-b border-gray-200 dark:border-gray-700/50">
              <span className="text-gray-500 dark:text-gray-400">Status</span>
              <span className="font-semibold text-gray-900 dark:text-white">
                {locationLoading ? "Detecting GPS..." : latitude ? "Active & Calibrated" : "Permission Required"}
              </span>
            </div>
            <div className="flex justify-between py-1 border-b border-gray-200 dark:border-gray-700/50">
              <span className="text-gray-500 dark:text-gray-400">Latitude</span>
              <span className="font-mono text-gray-900 dark:text-white">{latitude?.toFixed(6) ?? "—"}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-gray-200 dark:border-gray-700/50">
              <span className="text-gray-500 dark:text-gray-400">Longitude</span>
              <span className="font-mono text-gray-900 dark:text-white">{longitude?.toFixed(6) ?? "—"}</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-gray-500 dark:text-gray-400">Last Synced</span>
              <span className="text-xs text-gray-700 dark:text-gray-300">{new Date().toLocaleTimeString()}</span>
            </div>
          </div>

          {!latitude && (
            <Button onClick={requestLocation} variant="primary" className="w-full">
              Calibrate Current GPS
            </Button>
          )}
        </div>

        {/* Ambulance Verified Arrival Status */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow p-6 border border-gray-200 dark:border-gray-800 space-y-4">
          <h2 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <ClockIcon className="h-5 w-5 text-indigo-600" />
            Ambulance Dispatch Status
          </h2>

          <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 rounded-xl p-4 text-sm text-amber-900 dark:text-amber-200 space-y-2">
            <p className="font-semibold flex items-center gap-2">
              <AlertTriangleIcon className="h-4 w-4 text-amber-600" />
              Ambulance ETA unavailable — dispatch not confirmed.
            </p>
            <p className="text-xs text-amber-800 dark:text-amber-300">
              Verified ambulance arrival countdowns require telemetry from an active assigned vehicle. For life-threatening emergencies, dial national dispatch immediately:
            </p>
            <div className="pt-2">
              <a
                href="tel:112"
                className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg font-bold text-xs hover:bg-red-700 transition"
              >
                <PhoneIcon className="h-3.5 w-3.5" /> Call National Emergency 112 / 911
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Target Hospital & Navigation Route */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow p-6 border border-gray-200 dark:border-gray-800 space-y-4">
        <h2 className="text-lg font-bold text-gray-900 dark:text-white">
          Nearest Verified Hospital Route
        </h2>

        {loadingHospital ? (
          <div className="p-8 text-center text-gray-500">Scanning accredited hospital facilities...</div>
        ) : nearestHospital ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-gray-50 dark:bg-gray-800/50 p-4 rounded-xl">
            <div className="md:col-span-2">
              <h3 className="font-bold text-gray-900 dark:text-white text-base">{nearestHospital.name}</h3>
              <p className="text-xs text-gray-600 dark:text-gray-300 mt-1">{nearestHospital.address}</p>
              {nearestHospital.phone && (
                <p className="text-xs text-blue-600 dark:text-blue-400 mt-2 font-medium">📞 {nearestHospital.phone}</p>
              )}
            </div>
            <div className="flex flex-col justify-between border-t md:border-t-0 md:border-l border-gray-200 dark:border-gray-700 pt-3 md:pt-0 md:pl-4">
              <div>
                <p className="text-xs text-gray-500">Patient → Hospital Travel Time</p>
                <p className="text-xl font-extrabold text-blue-600 dark:text-blue-400 mt-0.5">
                  ~{userToHospitalMinutes} mins
                </p>
                <p className="text-xs text-gray-400">{userToHospitalDistance} km away</p>
              </div>
              <a
                href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(nearestHospital.name + " " + nearestHospital.address)}`}
                target="_blank"
                rel="noreferrer"
                className="mt-3 inline-flex items-center justify-center text-xs font-semibold px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                Open Google Maps Directions
              </a>
            </div>
          </div>
        ) : (
          <p className="text-sm text-gray-500">Provide GPS location access to identify nearby hospitals.</p>
        )}
      </div>
    </div>
  );
}
