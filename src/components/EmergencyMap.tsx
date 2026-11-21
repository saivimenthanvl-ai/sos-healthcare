"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { loadGoogleMaps, getGoogleMapsMapId } from "@/lib/google-maps";
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

type MarkerUnion = google.maps.marker.AdvancedMarkerElement | google.maps.Marker;

export function EmergencyMap({ onEmergencyCreated }: EmergencyMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<Map<string, MarkerUnion>>(new Map());

  const [userPosition, setUserPosition] = useState<{ lat: number; lng: number } | null>(null);
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [ambulances, setAmbulances] = useState<Ambulance[]>([]);
  const [emergency, setEmergency] = useState<Emergency | null>(null);
  const [loading, setLoading] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [nearbyHospitalsLoading, setNearbyHospitalsLoading] = useState(false);

  // Helper to remove and clean up a marker
  const removeMarker = (key: string) => {
    const existing = markersRef.current.get(key);
    if (existing) {
      if ("map" in existing) {
        existing.map = null;
      } else if (typeof (existing as google.maps.Marker).setMap === "function") {
        (existing as google.maps.Marker).setMap(null);
      }
      markersRef.current.delete(key);
    }
  };

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
        const existingUserMarker = markersRef.current.get("user");
        if (existingUserMarker) {
          if ("position" in existingUserMarker) {
            existingUserMarker.position = { lat, lng };
          } else if (typeof (existingUserMarker as google.maps.Marker).setPosition === "function") {
            (existingUserMarker as google.maps.Marker).setPosition({ lat, lng });
          }
        }
        return;
      }

      if (!mapRef.current) return;

      const mapId = getGoogleMapsMapId();
      const map = new google.maps.Map(mapRef.current, {
        center: { lat, lng },
        zoom: 13,
        mapId: mapId || undefined,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
      });

      mapInstanceRef.current = map;

      const hasAdvanced = Boolean(
        google.maps.marker &&
        typeof google.maps.marker.AdvancedMarkerElement === "function" &&
        typeof google.maps.marker.PinElement === "function"
      );

      // Add user marker
      if (hasAdvanced) {
        const pin = new google.maps.marker.PinElement({
          background: "#3b82f6",
          borderColor: "#ffffff",
          glyphColor: "#ffffff",
          scale: 1.0,
        });

        const userMarker = new google.maps.marker.AdvancedMarkerElement({
          position: { lat, lng },
          map,
          title: "Your Location",
          content: pin.element,
        });

        markersRef.current.set("user", userMarker);
      } else {
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
      }
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

  // --- Clean up map and markers on unmount ---
  useEffect(() => {
    return () => {
      markersRef.current.forEach((marker) => {
        if ("map" in marker) {
          marker.map = null;
        } else if (typeof (marker as google.maps.Marker).setMap === "function") {
          (marker as google.maps.Marker).setMap(null);
        }
      });
      markersRef.current.clear();
      mapInstanceRef.current = null;
    };
  }, []);

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

        const google = await loadGoogleMaps();
        const map = mapInstanceRef.current;
        if (map && !cancelled) {
          const hasAdvanced = Boolean(
            google.maps.marker &&
            typeof google.maps.marker.AdvancedMarkerElement === "function" &&
            typeof google.maps.marker.PinElement === "function"
          );

          data.hospitals?.forEach((h) => {
            const markerKey = `hospital-${h.id}`;
            // Clean up any existing marker for this hospital before re-creating
            removeMarker(markerKey);

            const infoWindow = new google.maps.InfoWindow({
              content: `
                <div style="padding:8px; font-size:14px;">
                  <strong>${h.name}</strong><br/>
                  <span style="color:#6b7280;">${(h.address || "").substring(0, 60)}</span><br/>
                  ${h.distance_km ? `<span>Distance: ${h.distance_km} km</span><br/>` : ""}
                </div>
              `,
            });

            if (hasAdvanced) {
              const pin = new google.maps.marker.PinElement({
                background: "#10b981",
                borderColor: "#065f4f",
                glyphColor: "#ffffff",
                scale: 1.0,
              });

              const advMarker = new google.maps.marker.AdvancedMarkerElement({
                position: { lat: h.latitude, lng: h.longitude },
                map,
                title: h.name,
                content: pin.element,
                gmpClickable: true,
              });

              advMarker.addListener("click", () => {
                infoWindow.open({
                  map,
                  anchor: advMarker,
                });
              });

              markersRef.current.set(markerKey, advMarker);
            } else {
              const legacyMarker = new google.maps.Marker({
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

              legacyMarker.addListener("click", () => {
                infoWindow.open(map, legacyMarker);
              });

              markersRef.current.set(markerKey, legacyMarker);
            }
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
        if ("position" in marker) {
          marker.position = { lat: updated.latitude, lng: updated.longitude };
        } else if (typeof (marker as google.maps.Marker).setPosition === "function") {
          (marker as google.maps.Marker).setPosition({ lat: updated.latitude, lng: updated.longitude });
        }
      }
    }
  );

  const [sosStatusMessage, setSosStatusMessage] = useState<{
    text: string;
    type: "info" | "error" | "warning";
  } | null>(null);

  // --- Trigger SOS ---
  const handleSOS = async () => {
    if (!userPosition) {
      setLocationError("Location required to trigger SOS");
      return;
    }

    setLoading(true);
    setSosStatusMessage(null);

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

      if (!res.ok) {
        setSosStatusMessage({
          text: data?.error || "We couldn't complete the emergency request. If you need immediate medical assistance, contact your local emergency service.",
          type: "error",
        });
        return;
      }

      setEmergency(data.emergency);

      // Fetch the assigned ambulance to get its real-world position
      let ambulanceData: Ambulance | null = null;
      if (data.assignedAmbulanceId) {
        try {
          const { data: ambulanceResult } = await supabase
            .from("ambulances")
            .select("*")
            .eq("id", data.assignedAmbulanceId)
            .single();
          ambulanceData = ambulanceResult as Ambulance | null;
        } catch (ambErr) {
          console.warn("Ambulance fetch handled:", ambErr);
        }
      }

      onEmergencyCreated?.(data.emergency);

      if (data.hospitalFound === false) {
        setSosStatusMessage({
          text: "Emergency request created. We couldn't automatically locate nearby hospitals. Please contact your local emergency service if immediate help is required.",
          type: "warning",
        });
      }

      // Track the ambulance on the map
      if (data.assignedAmbulanceId && mapInstanceRef.current) {
        try {
          const google = await loadGoogleMaps();
          const map = mapInstanceRef.current;
          if (map) {
            const ambulanceLat = ambulanceData?.latitude ?? userPosition?.lat ?? 0;
            const ambulanceLng = ambulanceData?.longitude ?? userPosition?.lng ?? 0;
            const ambKey = `ambulance-${data.assignedAmbulanceId}`;

            removeMarker(ambKey);

            const hasAdvanced = Boolean(
              google.maps.marker &&
              typeof google.maps.marker.AdvancedMarkerElement === "function" &&
              typeof google.maps.marker.PinElement === "function"
            );

            if (hasAdvanced) {
              const pin = new google.maps.marker.PinElement({
                background: "#ef4444",
                borderColor: "#7f1d1d",
                glyphColor: "#ffffff",
                scale: 1.1,
              });

              const ambMarker = new google.maps.marker.AdvancedMarkerElement({
                position: { lat: ambulanceLat, lng: ambulanceLng },
                map,
                title: "Ambulance En Route",
                content: pin.element,
              });

              markersRef.current.set(ambKey, ambMarker);
            } else {
              const legacyMarker = new google.maps.Marker({
                position: { lat: ambulanceLat, lng: ambulanceLng },
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

              markersRef.current.set(ambKey, legacyMarker);
            }

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
        } catch (mapErr) {
          console.warn("Map marker tracking handled:", mapErr);
        }
      }
    } catch (error) {
      console.error("SOS error:", error);
      setSosStatusMessage({
        text: "We couldn't complete the emergency request. If you need immediate medical assistance, contact your local emergency service.",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      {/* Left panel: SOS controls & details */}
      <div className="lg:w-1/3 space-y-6">
        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-100">
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            Emergency Assistance
          </h2>
          <p className="text-sm text-gray-600 mb-6">
            Press the button below to request an emergency response. We&apos;ll dispatch
            the nearest ambulance and notify emergency contacts.
          </p>

          <Button
            variant="danger"
            size="lg"
            className="w-full text-lg py-6 shadow-lg shadow-red-200 animate-pulse"
            disabled={loading || !userPosition}
            onClick={handleSOS}
          >
            <AlertTriangleIcon className="h-6 w-6 mr-2" />
            {loading ? "DISPATCHING..." : "TRIGGER SOS"}
          </Button>

          {locationError && (
            <p className="text-xs text-red-600 mt-2 text-center">
              ⚠️ {locationError} — Location is required for emergency dispatch
            </p>
          )}

          {sosStatusMessage && (
            <div
              className={`mt-4 p-3 rounded-lg text-sm border ${
                sosStatusMessage.type === "error"
                  ? "bg-red-50 text-red-800 border-red-200"
                  : sosStatusMessage.type === "warning"
                  ? "bg-amber-50 text-amber-800 border-amber-200"
                  : "bg-blue-50 text-blue-800 border-blue-200"
              }`}
            >
              {sosStatusMessage.text}
            </div>
          )}
        </div>

        {/* Location Status */}
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
          <h3 className="font-semibold text-gray-900 flex items-center gap-2 mb-2">
            <MapPinIcon className="h-4 w-4 text-blue-600" />
            Your Location
          </h3>
          {userPosition ? (
            <div className="text-sm text-gray-600 space-y-1">
              <p>
                Latitude: <span className="font-mono">{userPosition.lat.toFixed(4)}</span>
              </p>
              <p>
                Longitude: <span className="font-mono">{userPosition.lng.toFixed(4)}</span>
              </p>
              <p className="text-xs text-emerald-600 flex items-center gap-1 mt-1">
                <CheckCircleIcon className="h-3 w-3" /> Location locked
              </p>
            </div>
          ) : (
            <div className="text-sm text-gray-500 flex items-center justify-between">
              <span>Detecting location...</span>
              <Button size="sm" variant="outline" onClick={detectLocation}>
                Retry
              </Button>
            </div>
          )}
        </div>

        {/* Nearest Hospitals */}
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
          <h3 className="font-semibold text-gray-900 flex items-center gap-2 mb-3">
            <HospitalIcon className="h-4 w-4 text-emerald-600" />
            Nearest Hospitals
          </h3>
          {nearbyHospitalsLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="animate-pulse flex space-x-4 p-3 border rounded-lg">
                  <div className="flex-1 space-y-2 py-1">
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </div>
                </div>
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
