"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { loadGoogleMaps } from "@/lib/google-maps";
import { supabase } from "@/lib/supabase";
import { useRealtime } from "@/hooks/useRealtime";
import { Button } from "@/components/ui/Button";
import {
  AlertTriangleIcon,
  MapPinIcon,
  HospitalIcon,
  NavigationIcon,
  CheckCircleIcon,
} from "lucide-react";
import type { Ambulance, Emergency, Hospital } from "@/types/app";

interface EmergencyMapProps {
  onEmergencyCreated?: (emergency: Emergency) => void;
}

export function EmergencyMap({ onEmergencyCreated }: EmergencyMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<Map<string, google.maps.Marker>>(new Map());

  const [userPosition, setUserPosition] = useState<{ lat: number; lng: number } | null>(null);
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [ambulances, setAmbulances] = useState<Ambulance[]>([]);
  const [emergency, setEmergency] = useState<Emergency | null>(null);
  const [loading, setLoading] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [nearbyHospitalsLoading, setNearbyHospitalsLoading] = useState(false);

  // --- Browser geolocation ---
  const detectLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setLocationError("Geolocation not supported");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserPosition({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        });
        setLocationError(null);
      },
      (err) => {
        setLocationError(err.message);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, []);

  // --- Initialize map ---
  const initMap = async (lat: number, lng: number) => {
    try {
      const google = await loadGoogleMaps();

      if (mapInstanceRef.current) {
        // Update existing map center
        mapInstanceRef.current.setCenter({ lat, lng });
        return;
      }

      const map = new google.maps.Map(mapRef.current!, {
        center: { lat, lng },
        zoom: 13,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
      });

      mapInstanceRef.current = map;

      // Add user marker with a pulsing animation
      const userMarker = new google.maps.Marker({
        position: { lat, lng },
        map,
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 8,
          fillColor: "#3b82f6",
          fillOpacity: 1,
          strokeColor: "#ffffff",
          strokeWeight: 2,
        },
        title: "Your Location",
      });

      markersRef.current.set("user", userMarker);
    } catch (error) {
      console.error("Map init error:", error);
    }
  };

  // --- Detect location on mount ---
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    detectLocation();
  }, [detectLocation]);

  // --- Re-center map when user position is set ---
  useEffect(() => {
    if (userPosition) {
      void initMap(userPosition.lat, userPosition.lng);
    }
  }, [userPosition]);

  // --- Load nearby hospitals when user position changes ---
  useEffect(() => {
    if (!userPosition) return;
    let cancelled = false;

    const fetchNearbyHospitals = async () => {
      setNearbyHospitalsLoading(true);
      try {
        const res = await fetch(
          `/api/hospitals?lat=${userPosition.lat}&lng=${userPosition.lng}&radius=20`
        );
        const data = (await res.json()) as { hospitals?: Hospital[] };
        if (cancelled) return;
        setHospitals(data.hospitals || []);

        // Add hospital markers to map.
        // Await the loader rather than reading window.google: this fetch can
        // resolve before the Maps script finishes loading, and a bare
        // `window.google` check would then silently skip every marker with
        // no error and no retry.
        const google = await loadGoogleMaps();
        const map = mapInstanceRef.current;
        if (map) {
          data.hospitals?.forEach((h) => {
            const marker = new google.maps.Marker({
              position: { lat: h.latitude, lng: h.longitude },
              map,
              title: h.name,
              icon: {
                path: google.maps.SymbolPath.BACKWARD_CLOSED_ARROW,
                fillColor: "#10b981",
                fillOpacity: 0.8,
                strokeColor: "#065f4f",
                strokeWeight: 1,
                scale: 10,
              },
            });

            const infoWindow = new google.maps.InfoWindow({
              content: `
                <div style="padding:8px; font-size:14px;">
                  <strong>${h.name}</strong><br/>
                  <span style="color:#6b7280;">${(h.address || "").substring(0, 60)}</span><br/>
                  ${h.distance_km ? `<span>Distance: ${h.distance_km} km</span><br/>` : ""}
                </div>
              `,
            });

            marker.addListener("click", () => {
              infoWindow.open(map, marker);
            });

            markersRef.current.set(`hospital-${h.id}`, marker);
          });
        }
      } catch (error) {
        console.error("Hospitals fetch error:", error);
      } finally {
        if (!cancelled) setNearbyHospitalsLoading(false);
      }
    };

    void fetchNearbyHospitals();

    return () => {
      cancelled = true;
    };
  }, [userPosition]);

  // --- Subscribe to realtime ambulance movements via Supabase Realtime ---
  useRealtime<Ambulance>(
    "ambulances",
    emergency?.assigned_ambulance_id
      ? `id=eq.${emergency.assigned_ambulance_id}`
      : null,
    undefined,
    (updated) => {
      setAmbulances((prev) => {
        const filtered = prev.filter((a) => a.id !== updated.id);
        return [...filtered, updated];
      });

      // Move the marker on the map to follow the ambulance.
      const marker = markersRef.current.get(`ambulance-${updated.id}`);
      if (marker && updated.latitude != null && updated.longitude != null) {
        marker.setPosition({ lat: updated.latitude, lng: updated.longitude });
      }
    }
  );

  // --- Trigger SOS ---
  const handleSOS = async () => {
    if (!userPosition) {
      setLocationError("Location required to trigger SOS");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/emergencies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          latitude: userPosition.lat,
          longitude: userPosition.lng,
          description: "SOS emergency - immediate assistance required",
        }),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Failed to create emergency");

      setEmergency(data.emergency);

      // Fetch the assigned ambulance to get its real-world position
      let ambulanceData: Ambulance | null = null;
      if (data.assignedAmbulanceId) {
        const { data: ambulanceResult } = await supabase
          .from("ambulances")
          .select("*")
          .eq("id", data.assignedAmbulanceId)
          .single();
        ambulanceData = ambulanceResult as Ambulance | null;
      }

      setAmbulances(ambulanceData ? [ambulanceData] : []);

      onEmergencyCreated?.(data.emergency);

      // Track the ambulance on the map
      if (data.assignedAmbulanceId && mapInstanceRef.current) {
        // Await the loader so a slow Maps script cannot silently skip the
        // ambulance marker and route line.
        const google = await loadGoogleMaps();
        const map = mapInstanceRef.current;
        if (map) {
          const ambulanceLat = ambulanceData?.latitude ?? userPosition?.lat ?? 0;
          const ambulanceLng = ambulanceData?.longitude ?? userPosition?.lng ?? 0;

          const ambulanceMarker = new google.maps.Marker({
            position: {
              lat: ambulanceLat,
              lng: ambulanceLng,
            },
            map,
            icon: {
              path: google.maps.SymbolPath.BACKWARD_CLOSED_ARROW,
              scale: 12,
              fillColor: "#ef4444",
              fillOpacity: 0.9,
              strokeColor: "#ffffff",
              strokeWeight: 2,
            },
            title: "Ambulance En Route",
          });

          markersRef.current.set(
            `ambulance-${data.assignedAmbulanceId}`,
            ambulanceMarker
          );

          // Draw a path from the ambulance's position to the user's location
          const line = new google.maps.Polyline({
            path: [
              { lat: ambulanceLat, lng: ambulanceLng },
              { lat: userPosition?.lat || 0, lng: userPosition?.lng || 0 },
            ],
            geodesic: true,
            strokeColor: "#ef4444",
            strokeOpacity: 0.6,
            strokeWeight: 3,
          });
          line.setMap(map);
        }
      }
    } catch (error) {
      console.error("SOS error:", error);
      alert(error instanceof Error ? error.message : "Failed to trigger emergency");
    } finally {
      setLoading(false);
    }
  };

  // --- Cancel emergency ---
  const handleCancel = async () => {
    if (!emergency) return;

    await supabase
      .from("emergencies")
      .update({ status: "cancelled", updated_at: new Date().toISOString() })
      .eq("id", emergency.id);

    // Reset ambulances back to available
    for (const ambulance of ambulances) {
      await supabase
        .from("ambulances")
        .update({ status: "available", current_emergency_id: null })
        .eq("id", ambulance.id);
    }

    setEmergency(null);
    setAmbulances([]);
  };

  // --- Resolve emergency ---
  const handleResolve = async () => {
    if (!emergency) return;

    await supabase
      .from("emergencies")
      .update({ status: "resolved", updated_at: new Date().toISOString() })
      .eq("id", emergency.id);

    // Release ambulances
    for (const ambulance of ambulances) {
      await supabase
        .from("ambulances")
        .update({ status: "available", current_emergency_id: null })
        .eq("id", ambulance.id);
    }

    setEmergency(null);
    setAmbulances([]);
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      {/* Left panel: Controls and hospital list */}
      <div className="lg:w-1/3 space-y-4">
        {/* SOS Button */}
        {!emergency ? (
          <div className="text-center">
            <p className="text-gray-700 mb-4">
              {userPosition
                ? "Press the button to request emergency assistance"
                : "Tap to detect your location, then press SOS"}
            </p>

            {!userPosition && (
              <Button
                variant="outline"
                className="mb-4"
                onClick={detectLocation}
              >
                <MapPinIcon className="h-4 w-4 mr-2" />
                Enable Location
              </Button>
            )}

            {locationError && (
              <div className="mb-3 p-3 bg-red-50 text-red-800 rounded-lg text-sm">
                {locationError}
              </div>
            )}

            <Button
              variant="danger"
              size="lg"
              fullWidth
              loading={loading}
              onClick={handleSOS}
              disabled={!userPosition}
            >
              <AlertTriangleIcon className="h-5 w-5 mr-2" />
              {loading ? "Dispatching..." : "SOS — Request Emergency Help"}
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-bold text-red-800">
                  Emergency #{emergency.id.slice(0, 8)}
                </h3>
                <span
                  className={`px-2 py-1 rounded-full text-xs font-semibold ${
                    emergency.status === "en_route"
                      ? "bg-blue-100 text-blue-800"
                      : emergency.status === "arrived"
                      ? "bg-green-100 text-green-800"
                      : "bg-yellow-100 text-yellow-800"
                  }`}
                >
                  {emergency.status}
                </span>
              </div>

              {emergency.eta_minutes && (
                <div className="flex items-center gap-2 text-red-800 mb-2">
                  <NavigationIcon className="h-4 w-4" />
                  <span className="font-medium">
                    ETA: {emergency.eta_minutes} minutes
                  </span>
                </div>
              )}

              {hospitals.find((h) => h.id === emergency.assigned_hospital_id) && (
                <div className="text-sm text-red-700">
                  Destination:{" "}
                  {
                    hospitals.find((h) => h.id === emergency.assigned_hospital_id)
                      ?.name
                  }
                </div>
              )}
            </div>

            <div className="flex gap-2">
              <Button variant="outline" size="sm" fullWidth>
                <NavigationIcon className="h-4 w-4 mr-2" />
                Live Track
              </Button>
              <Button
                variant="ghost"
                size="sm"
                fullWidth
                onClick={handleCancel}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                fullWidth
                onClick={handleResolve}
              >
                <CheckCircleIcon className="h-4 w-4 mr-2" />
                Resolved
              </Button>
            </div>
          </div>
        )}

        {/* Nearby Hospitals List */}
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <HospitalIcon className="h-5 w-5 text-blue-600" />
            Nearby Hospitals
          </h3>

          {nearbyHospitalsLoading ? (
            <div className="space-y-2">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-16 bg-gray-100 animate-pulse rounded" />
              ))}
            </div>
          ) : hospitals.length === 0 ? (
            <p className="text-sm text-gray-500">No hospitals found nearby</p>
          ) : (
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {hospitals.slice(0, 5).map((hospital) => (
                <div
                  key={hospital.id}
                  className={`p-3 border rounded-lg hover:bg-gray-50 transition-colors ${
                    hospital.id === emergency?.assigned_hospital_id
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-medium text-gray-900">{hospital.name}</h4>
                      <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                        {hospital.address}
                      </p>
                      {hospital.phone && (
                        <p className="text-xs text-gray-500 mt-1">{hospital.phone}</p>
                      )}
                    </div>
                    {hospital.distance_km && (
                      <span className="text-xs font-medium bg-gray-100 text-gray-700 px-2 py-1 rounded">
                        {hospital.distance_km} km
                      </span>
                    )}
                  </div>

                  {hospital.icu_beds !== undefined && (
                    <div className="mt-2 flex items-center gap-2 text-xs text-gray-600">
                      <span>ICU Beds: {hospital.icu_beds}</span>
                      {hospital.rating && (
                        <span>Rating: {hospital.rating} ⭐</span>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Right panel: Map */}
      <div className="lg:w-2/3">
        <div
          ref={mapRef}
          className="w-full h-[500px] rounded-lg shadow-lg bg-gray-100"
        />
      </div>
    </div>
  );
}
