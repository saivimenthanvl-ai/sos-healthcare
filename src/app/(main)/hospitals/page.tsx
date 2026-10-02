"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useLocation } from "@/hooks/useLocation";
import { HospitalCard } from "@/components/HospitalCard";
import { MapView, hospitalMarker } from "@/components/MapView";
import { Button } from "@/components/ui/Button";
import { MapPinIcon, SearchIcon, AlertCircleIcon } from "lucide-react";
import type { Hospital } from "@/types/app";

interface ApiResponse {
  hospitals: Hospital[];
  userLocation: { lat: number; lng: number };
  radius_km: number;
}

function HospitalsPageContent() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const { latitude, longitude, error, loading: locationLoading } = useLocation();
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchRadius, setSearchRadius] = useState(20);
  const [searchTerm, setSearchTerm] = useState("");
  // `?map=true` deep-links straight to the map view.
  const [showMap, setShowMap] = useState(searchParams.get("map") === "true");

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
    // `latitude`/`longitude` are legitimately 0 on the equator and prime
    // meridian, so compare against null rather than relying on truthiness.
    if (latitude != null && longitude != null && user) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      fetchNearbyHospitals();
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
    <div className="max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Nearby Hospitals</h1>
        <p className="text-gray-600 mt-1">
          Find hospitals within {searchRadius} km of your location
        </p>
      </div>

      {/* Location status */}
      {locationLoading && (
        <div className="mb-4 p-3 bg-blue-50 text-blue-800 rounded-lg flex items-center gap-2">
          <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-600 border-t-transparent" />
          Detecting your location...
        </div>
      )}

      {error && latitude == null && (
        <div className="mb-4 p-3 bg-red-50 text-red-800 rounded-lg flex items-center gap-2">
          <AlertCircleIcon className="h-4 w-4" />
          {error}
        </div>
      )}

      {latitude == null && !locationLoading && !error && (
        <div className="mb-4 p-3 bg-yellow-50 text-yellow-800 rounded-lg flex items-center gap-2">
          <AlertCircleIcon className="h-4 w-4" />
          Location access is needed to find nearby hospitals.
        </div>
      )}

      {/* Search and filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex-1 relative">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search hospitals..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex gap-2">
          <select
            value={searchRadius}
            onChange={(e) => setSearchRadius(Number(e.target.value))}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value={5}>5 km</option>
            <option value={10}>10 km</option>
            <option value={20}>20 km</option>
            <option value={50}>50 km</option>
          </select>

          <Button
            variant={showMap ? "primary" : "outline"}
            size="sm"
            onClick={() => setShowMap(!showMap)}
          >
            {showMap ? "List View" : "Map View"}
          </Button>
        </div>
      </div>

      {/* Map / List view */}
      {showMap && latitude != null && longitude != null ? (
        <MapView
          className="w-full h-[500px] shadow-lg mb-6"
          center={{ lat: latitude, lng: longitude }}
          zoom={12}
          markers={markers}
        />
      ) : null}

      {/* Hospital list */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-48 bg-gray-100 animate-pulse rounded-xl" />
          ))}
        </div>
      ) : filteredHospitals.length === 0 ? (
        <div className="text-center py-12">
          <MapPinIcon className="h-12 w-12 mx-auto text-gray-300 mb-4" />
          <p className="text-gray-600">
            {searchTerm
              ? "No hospitals match your search"
              : "No hospitals found in this area"}
          </p>
          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              className="mt-2 text-sm text-blue-600 hover:text-blue-700"
            >
              Clear search
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredHospitals.map((hospital) => (
            <HospitalCard key={hospital.id} hospital={hospital} />
          ))}
        </div>
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
