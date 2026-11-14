"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useLocation } from "@/hooks/useLocation";
import { HospitalCard } from "@/components/HospitalCard";
import { MapView, hospitalMarker } from "@/components/MapView";
import { Button } from "@/components/ui/Button";
import { MapPinIcon, SearchIcon, AlertCircleIcon } from "lucide-react";
import type { Hospital } from "@/types/app";
import { HospitalBookingModal } from "@/components/HospitalBookingModal";

interface ApiResponse {
  hospitals: Hospital[];
  userLocation: { lat: number; lng: number };
  radius_km: number;
}

function HospitalsPageContent() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const searchParams = useSearchParams();
  const { latitude, longitude, error, loading: locationLoading, requestLocation } = useLocation();
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchRadius, setSearchRadius] = useState(20);
  const [searchTerm, setSearchTerm] = useState("");
  const [showMap, setShowMap] = useState(searchParams.get("map") === "true");
  const [selectedHospitalForBooking, setSelectedHospitalForBooking] = useState<Hospital | null>(null);
  const [bookingToast, setBookingToast] = useState<string | null>(null);

  const fetchNearbyHospitals = useCallback(async () => {
    if (!latitude || !longitude) return;

    setLoading(true);
    try {
      const res = await fetch(
        `/api/hospitals?lat=${latitude}&lng=${longitude}&radius=${searchRadius}`
      );
      const data: ApiResponse = await res.json();
      setHospitals(data.hospitals || []);
    } catch (error) {
      console.error("Hospitals fetch error:", error);
    } finally {
      setLoading(false);
    }
  }, [latitude, longitude, searchRadius]);

  useEffect(() => {
    if (latitude != null && longitude != null && user) {
      void Promise.resolve().then(() => fetchNearbyHospitals());
    }
  }, [latitude, longitude, user, fetchNearbyHospitals]);

  const filteredHospitals = useMemo(
    () =>
      hospitals.filter(
        (hospital) =>
          hospital.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          hospital.address.toLowerCase().includes(searchTerm.toLowerCase())
      ),
    [hospitals, searchTerm]
  );

  const markers = useMemo(
    () => [
      ...(latitude != null && longitude != null
        ? [
            {
              id: "you",
              position: { lat: latitude, lng: longitude },
              title: "Your location",
              kind: "user" as const,
            },
          ]
        : []),
      ...filteredHospitals.map(hospitalMarker),
    ],
    [filteredHospitals, latitude, longitude]
  );

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{t.hospitals.title}</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            {latitude != null
              ? t.hospitals.subtitleGps.replace("{radius}", String(searchRadius))
              : t.hospitals.subtitleNoLocation}
          </p>
        </div>
      </div>

      {bookingToast && (
        <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 rounded-xl text-sm font-medium flex items-center justify-between">
          <span>{bookingToast}</span>
          <button onClick={() => setBookingToast(null)} className="text-xs uppercase font-bold ml-2">
            {t.hospitals.dismiss}
          </button>
        </div>
      )}

      {/* Explicit Location Permission Card if location is not granted yet */}
      {latitude == null && (
        <div className="bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 rounded-2xl p-6 text-center sm:text-left flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="bg-blue-600 text-white rounded-full p-3 shrink-0">
              <MapPinIcon className="h-6 w-6" />
            </div>
            <div>
              <h3 className="font-semibold text-blue-900 dark:text-blue-100 text-lg">
                {t.hospitals.enableLocationTitle}
              </h3>
              <p className="text-sm text-blue-700 dark:text-blue-300 mt-0.5">
                {t.hospitals.enableLocationDesc}
              </p>
            </div>
          </div>
          <Button
            variant="primary"
            onClick={requestLocation}
            loading={locationLoading}
            className="shrink-0 whitespace-nowrap"
          >
            {t.hospitals.allowLocationAccess}
          </Button>
        </div>
      )}

      {error && latitude == null && (
        <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-red-800 dark:text-red-200 rounded-lg flex items-center gap-2 text-sm">
          <AlertCircleIcon className="h-4 w-4 shrink-0" />
          <span>{t.hospitals.locationErrorPrefix} {error}.</span>
        </div>
      )}

      {/* Search and filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 rtl:left-auto rtl:right-3" />
          <input
            type="text"
            placeholder={t.hospitals.searchPlaceholder}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 rtl:pr-10 rtl:pl-4 py-2 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          />
        </div>

        <div className="flex gap-2">
          <select
            value={searchRadius}
            onChange={(e) => setSearchRadius(Number(e.target.value))}
            className="px-3 py-2 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          >
            <option value={5}>{t.hospitals.kmRadius.replace("{radius}", "5")}</option>
            <option value={10}>{t.hospitals.kmRadius.replace("{radius}", "10")}</option>
            <option value={20}>{t.hospitals.kmRadius.replace("{radius}", "20")}</option>
            <option value={50}>{t.hospitals.kmRadius.replace("{radius}", "50")}</option>
          </select>

          <Button
            variant={showMap ? "primary" : "outline"}
            size="sm"
            onClick={() => setShowMap(!showMap)}
          >
            {showMap ? t.hospitals.listView : t.hospitals.mapView}
          </Button>
        </div>
      </div>

      {/* Map / List view */}
      {showMap && latitude != null && longitude != null ? (
        <MapView
          className="w-full h-[500px] shadow-lg rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-800"
          center={{ lat: latitude, lng: longitude }}
          zoom={12}
          markers={markers}
        />
      ) : null}

      {/* Hospital list */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-52 bg-gray-100 dark:bg-gray-800 animate-pulse rounded-xl" />
          ))}
        </div>
      ) : filteredHospitals.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-8">
          <MapPinIcon className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <p className="text-gray-700 dark:text-gray-300 font-medium">
            {searchTerm
              ? t.hospitals.noMatchSearch
              : latitude == null
              ? t.hospitals.grantLocationPrompt
              : t.hospitals.noHospitalsInRadius}
          </p>
          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              className="mt-2 text-sm text-blue-600 hover:text-blue-700"
            >
              {t.hospitals.clearSearch}
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredHospitals.map((hospital) => (
            <HospitalCard
              key={hospital.id}
              hospital={hospital}
              onBook={(h) => setSelectedHospitalForBooking(h)}
            />
          ))}
        </div>
      )}

      {/* Custom Booking Modal */}
      {selectedHospitalForBooking && (
        <HospitalBookingModal
          hospital={selectedHospitalForBooking}
          userCoords={latitude && longitude ? { lat: latitude, lng: longitude } : null}
          onClose={() => setSelectedHospitalForBooking(null)}
          onSuccess={() => {
            setBookingToast(t.hospitals.bookingSubmitted);
          }}
        />
      )}
    </div>
  );
}

export default function HospitalsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-6 w-6 border-2 border-blue-600 border-t-transparent" />
        </div>
      }
    >
      <HospitalsPageContent />
    </Suspense>
  );
}
