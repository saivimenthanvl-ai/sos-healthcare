"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useLocation } from "@/hooks/useLocation";
import { supabase } from "@/lib/supabase";
import { useRealtime } from "@/hooks/useRealtime";
import { Button } from "@/components/ui/Button";
import { MapView, MapMarkerSpec } from "@/components/MapView";
import {
  AlertTriangleIcon,
  MapPinIcon,
  HospitalIcon,
  CheckCircleIcon,
  RefreshCwIcon,
  ShieldCheckIcon,
  HelpCircleIcon,
  NavigationIcon,
  RadioIcon,
} from "lucide-react";
import Link from "next/link";
import type { Ambulance, Emergency, Hospital } from "@/types/app";

interface EmergencyMapProps {
  onEmergencyCreated?: (emergency: Emergency) => void;
}

export function EmergencyMap({ onEmergencyCreated }: EmergencyMapProps) {
  // Consolidated browser geolocation hook with high accuracy
  const {
    latitude: userLat,
    longitude: userLng,
    accuracy: userAccuracy,
    timestamp: userTimestamp,
    source: locationSource,
    error: locationError,
    loading: locationLoading,
    requestLocation,
    setManualLocation,
  } = useLocation({ autoRequest: true, enableHighAccuracy: true });

  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [emergency, setEmergency] = useState<Emergency | null>(null);
  const [assignedAmbulance, setAssignedAmbulance] = useState<Ambulance | null>(null);
  const [loading, setLoading] = useState(false);
  const [nearbyHospitalsLoading, setNearbyHospitalsLoading] = useState(false);
  const [manualMode, setManualMode] = useState(false);
  const [manualInput, setManualInput] = useState({ lat: "", lng: "" });

  // Route state via Google Routes API v2
  const [encodedPolyline, setEncodedPolyline] = useState<string | null>(null);
  const [selectedHospitalForRoute, setSelectedHospitalForRoute] = useState<Hospital | null>(null);
  const [routeSummary, setRouteSummary] = useState<{
    distanceKm: number;
    durationMinutes: number;
  } | null>(null);
  const [routingLoading, setRoutingLoading] = useState(false);

  // Live Location Sync with User Consent
  const [liveTrackingEnabled, setLiveTrackingEnabled] = useState(false);
  const lastSyncTimestampRef = useRef<number>(0);

  const [sosStatusMessage, setSosStatusMessage] = useState<{
    text: string;
    type: "info" | "error" | "warning";
  } | null>(null);

  // --- Fetch verified nearby hospitals whenever coordinates update ---
  useEffect(() => {
    if (userLat == null || userLng == null) return;
    let isCancelled = false;

    const fetchHospitals = async () => {
      setNearbyHospitalsLoading(true);
      try {
        const res = await fetch(`/api/hospitals?lat=${userLat}&lng=${userLng}&radius=25`);
        if (res.ok) {
          const data = await res.json();
          if (!isCancelled) {
            setHospitals(data.hospitals || []);
          }
        }
      } catch (err) {
        console.warn("[EmergencyMap] Nearby hospitals load notice:", err);
      } finally {
        if (!isCancelled) setNearbyHospitalsLoading(false);
      }
    };

    void fetchHospitals();

    return () => {
      isCancelled = true;
    };
  }, [userLat, userLng]);

  // --- Synchronize Live GPS Location to Supabase during Active Tracking Session ---
  useEffect(() => {
    if (!liveTrackingEnabled || userLat == null || userLng == null) return;

    const now = Date.now();
    // Throttle writes: maximum 1 write per 10 seconds
    if (now - lastSyncTimestampRef.current < 10000) return;
    lastSyncTimestampRef.current = now;

    const syncLocation = async () => {
      try {
        await fetch("/api/locations", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            latitude: userLat,
            longitude: userLng,
            accuracy: userAccuracy || 10,
          }),
        });
      } catch (err) {
        console.warn("[EmergencyMap] Live location sync notice:", err);
      }
    };

    void syncLocation();
  }, [userLat, userLng, userAccuracy, liveTrackingEnabled]);

  // --- Subscribe to assigned ambulance updates via Supabase Realtime ---
  useRealtime<Ambulance>(
    "ambulances",
    emergency?.assigned_ambulance_id ? `id=eq.${emergency.assigned_ambulance_id}` : null,
    undefined,
    (updated) => {
      setAssignedAmbulance(updated);
    }
  );

  // --- On-Demand Directions via Google Routes API v2 (computeRoutes) ---
  const handleRequestDirections = async (targetHospital: Hospital) => {
    if (userLat == null || userLng == null) return;
    setSelectedHospitalForRoute(targetHospital);
    setRoutingLoading(true);
    setRouteSummary(null);

    try {
      const res = await fetch("/api/maps/google-routes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          origin: { lat: userLat, lng: userLng },
          destination: { lat: targetHospital.latitude, lng: targetHospital.longitude },
          travelMode: "DRIVE",
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.encodedPolyline) {
          setEncodedPolyline(data.encodedPolyline);
          setRouteSummary({
            distanceKm: data.distanceKm,
            durationMinutes: data.durationMinutes,
          });
        }
      } else {
        const errData = await res.json().catch(() => ({}));
        console.warn("[Google Routes error]:", errData);
      }
    } catch (err) {
      console.warn("[EmergencyMap] Google Route load notice:", err);
    } finally {
      setRoutingLoading(false);
    }
  };

  const handleClearRoute = () => {
    setSelectedHospitalForRoute(null);
    setEncodedPolyline(null);
    setRouteSummary(null);
  };

  // --- Compile Map Markers ---
  const mapMarkers: MapMarkerSpec[] = [];

  if (userLat != null && userLng != null) {
    mapMarkers.push({
      id: "user-location",
      position: { lat: userLat, lng: userLng },
      title: "Your Location",
      kind: "user",
      info: `Accuracy: ~${Math.round(userAccuracy || 10)}m (${locationSource === "manual" ? "Manual input" : "Live GPS fix"})`,
    });
  }

  hospitals.forEach((h) => {
    mapMarkers.push({
      id: `hospital-${h.id}`,
      position: { lat: h.latitude, lng: h.longitude },
      title: h.name,
      kind: "hospital",
      info: `${h.address}${h.distance_km ? `<br/><strong>${h.distance_km} km</strong> away` : ""}<br/><em>${h.verification_status === "verified" ? "✓ Verified Hospital" : "Unverified Geographic Listing"}</em>`,
    });
  });

  if (assignedAmbulance && assignedAmbulance.latitude != null && assignedAmbulance.longitude != null) {
    mapMarkers.push({
      id: `ambulance-${assignedAmbulance.id}`,
      position: { lat: assignedAmbulance.latitude, lng: assignedAmbulance.longitude },
      title: `Ambulance ${assignedAmbulance.vehicle_number || ""}`,
      kind: "ambulance",
      info: `Status: ${assignedAmbulance.status || "en_route"}`,
    });
  }

  // --- Trigger Emergency SOS (Decoupled from Map availability) ---
  const handleSOS = async () => {
    if (userLat == null || userLng == null) {
      setSosStatusMessage({
        text: "Please allow location permissions or enter coordinates manually before triggering SOS.",
        type: "warning",
      });
      return;
    }

    setLoading(true);
    setSosStatusMessage(null);

    try {
      const res = await fetch("/api/emergencies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          latitude: userLat,
          longitude: userLng,
          description: "Emergency SOS requested from Web Patient Beacon",
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setSosStatusMessage({
          text: data?.error || "We could not record the SOS emergency request. Please call emergency services immediately.",
          type: "error",
        });
        return;
      }

      setEmergency(data.emergency);
      onEmergencyCreated?.(data.emergency);

      if (data.assignedAmbulanceId) {
        const { data: amb } = await supabase
          .from("ambulances")
          .select("*")
          .eq("id", data.assignedAmbulanceId)
          .single();
        if (amb) setAssignedAmbulance(amb as Ambulance);
      }

      setSosStatusMessage({
        text: "SOS Emergency logged successfully. Dispatchers and designated emergency contacts have been alerted.",
        type: "info",
      });
    } catch {
      setSosStatusMessage({
        text: "Emergency submission encountered network loss. Please dial emergency services directly.",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const lat = parseFloat(manualInput.lat);
    const lng = parseFloat(manualInput.lng);
    if (!isNaN(lat) && !isNaN(lng)) {
      setManualLocation(lat, lng, 15);
      setManualMode(false);
    }
  };

  // Determine Map Center safely
  const hasUserCoords = userLat != null && userLng != null;
  const mapCenter = hasUserCoords
    ? { lat: userLat, lng: userLng }
    : { lat: 13.0827, lng: 80.2707 }; // Neutral Chennai overview if no GPS yet

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      {/* Left panel: SOS controls & details */}
      <div className="lg:w-1/3 space-y-5">
        <div className="bg-white dark:bg-gray-900 p-6 rounded-lg shadow-md border border-gray-100 dark:border-gray-800">
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            Emergency Guidance &amp; Contact Alert
          </h2>
          <p className="text-xs text-gray-600 dark:text-gray-400 mb-5 leading-relaxed">
            Press the button below to record an emergency alert. We notify your configured emergency contacts and surface the nearest verified hospitals. This service does not replace official municipal ambulance dispatch (call 112 / 911).
          </p>

          <Button
            variant="danger"
            size="lg"
            className="w-full text-lg py-6 shadow-lg shadow-red-200 dark:shadow-none animate-pulse font-bold tracking-wide"
            disabled={loading || userLat == null}
            onClick={handleSOS}
          >
            <AlertTriangleIcon className="h-6 w-6 mr-2" />
            {loading ? "RECORDING SOS..." : "TRIGGER SOS"}
          </Button>

          {locationError && (
            <div className="mt-3 text-xs text-red-600 dark:text-red-400 space-y-1">
              <p>⚠️ {locationError}</p>
              <div className="flex items-center gap-2 pt-1">
                <Button size="sm" variant="outline" onClick={() => void requestLocation()}>
                  Retry GPS
                </Button>
                <Button size="sm" variant="outline" onClick={() => setManualMode(!manualMode)}>
                  {manualMode ? "Cancel Manual" : "Choose Location"}
                </Button>
              </div>
            </div>
          )}

          {manualMode && (
            <form onSubmit={handleManualSubmit} className="mt-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg space-y-2 text-xs">
              <p className="font-semibold text-gray-700 dark:text-gray-200">Enter Coordinate Manually</p>
              <div className="flex gap-2">
                <input
                  type="number"
                  step="any"
                  placeholder="Latitude (-90 to 90)"
                  className="w-1/2 p-1.5 border rounded dark:bg-gray-900 dark:border-gray-700"
                  value={manualInput.lat}
                  onChange={(e) => setManualInput((prev) => ({ ...prev, lat: e.target.value }))}
                  required
                />
                <input
                  type="number"
                  step="any"
                  placeholder="Longitude (-180 to 180)"
                  className="w-1/2 p-1.5 border rounded dark:bg-gray-900 dark:border-gray-700"
                  value={manualInput.lng}
                  onChange={(e) => setManualInput((prev) => ({ ...prev, lng: e.target.value }))}
                  required
                />
              </div>
              <Button size="sm" variant="primary" type="submit" className="w-full">
                Apply Location
              </Button>
            </form>
          )}

          {sosStatusMessage && (
            <div
              className={`mt-4 p-3 rounded-lg text-sm border ${
                sosStatusMessage.type === "error"
                  ? "bg-red-50 text-red-800 border-red-200 dark:bg-red-950/50 dark:text-red-300"
                  : sosStatusMessage.type === "warning"
                  ? "bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300"
                  : "bg-blue-50 text-blue-800 border-blue-200 dark:bg-blue-950/50 dark:text-blue-300"
              }`}
            >
              {sosStatusMessage.text}
            </div>
          )}
        </div>

        {/* Location Status & Live Tracking Consent Card */}
        <div className="bg-white dark:bg-gray-900 p-4 rounded-lg shadow-sm border border-gray-100 dark:border-gray-800 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2 text-sm">
              <MapPinIcon className="h-4 w-4 text-blue-600" />
              Your Location
            </h3>
            <button
              onClick={() => void requestLocation()}
              className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
            >
              <RefreshCwIcon className="h-3 w-3" /> Refresh GPS
            </button>
          </div>

          {userLat != null && userLng != null ? (
            <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
              <p>
                Latitude: <span className="font-mono font-medium text-gray-900 dark:text-gray-100">{userLat.toFixed(5)}</span>
              </p>
              <p>
                Longitude: <span className="font-mono font-medium text-gray-900 dark:text-gray-100">{userLng.toFixed(5)}</span>
              </p>
              <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px]">
                <span className="text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
                  <CheckCircleIcon className="h-3.5 w-3.5" />
                  {locationSource === "manual" ? "Manual input" : `GPS locked (~${Math.round(userAccuracy || 0)}m)`}
                </span>
                {userTimestamp && (
                  <span className="text-gray-400">
                    Updated {new Date(userTimestamp).toLocaleTimeString()}
                  </span>
                )}
              </div>
            </div>
          ) : (
            <div className="text-xs text-gray-500 flex items-center justify-between">
              <span>{locationLoading ? "Detecting browser GPS..." : "Location permission needed"}</span>
              <Button size="sm" variant="outline" onClick={() => void requestLocation()}>
                Detect
              </Button>
            </div>
          )}

          {/* User Tracking Consent Toggle */}
          <div className="pt-2 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <RadioIcon className={`h-3.5 w-3.5 ${liveTrackingEnabled ? "text-emerald-600 animate-pulse" : "text-gray-400"}`} />
              <span className="text-xs font-medium text-gray-800 dark:text-gray-200">
                Live Location Sync
              </span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={liveTrackingEnabled}
                onChange={(e) => setLiveTrackingEnabled(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-8 h-4 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
            </label>
          </div>
        </div>

        {/* Active Driving Route Banner if computed */}
        {routeSummary && selectedHospitalForRoute && (
          <div className="bg-blue-50 dark:bg-blue-950/40 p-3.5 rounded-lg border border-blue-200 dark:border-blue-900 text-xs space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-blue-900 dark:text-blue-200 flex items-center gap-1">
                <NavigationIcon className="h-3.5 w-3.5 text-blue-600" />
                Driving Route to {selectedHospitalForRoute.name}
              </span>
              <button
                type="button"
                onClick={handleClearRoute}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 font-bold"
              >
                ✕
              </button>
            </div>
            <div className="flex items-center gap-4 text-gray-700 dark:text-gray-300 pt-0.5">
              <span>Distance: <strong>{routeSummary.distanceKm} km</strong></span>
              <span>Estimated Duration: <strong>~{routeSummary.durationMinutes} mins</strong></span>
            </div>
          </div>
        )}

        {/* Nearby Hospitals Recommendation Panel */}
        <div className="bg-white dark:bg-gray-900 p-4 rounded-lg shadow-sm border border-gray-100 dark:border-gray-800">
          <h3 className="font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2 mb-3 text-sm">
            <HospitalIcon className="h-4 w-4 text-emerald-600" />
            Nearby Hospitals
          </h3>
          {nearbyHospitalsLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="animate-pulse flex space-x-4 p-3 border rounded-lg">
                  <div className="flex-1 space-y-2 py-1">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : hospitals.length === 0 ? (
            <div className="text-xs text-gray-500 space-y-2 py-2">
              <p>No verified hospitals currently in direct GPS range.</p>
              <p className="text-amber-800 dark:text-amber-300">
                In acute emergencies, call national emergency dispatch (112 / 911) directly.
              </p>
            </div>
          ) : (
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {hospitals.slice(0, 6).map((hospital) => (
                <div
                  key={hospital.id}
                  className={`p-3 border rounded-lg transition-colors ${
                    selectedHospitalForRoute?.id === hospital.id
                      ? "border-blue-500 bg-blue-50/40 dark:bg-blue-950/20"
                      : "border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <h4 className="font-medium text-gray-900 dark:text-gray-100 text-sm">{hospital.name}</h4>
                        {hospital.verification_status === "verified" ? (
                          <span title="Verified">
                            <ShieldCheckIcon className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                          </span>
                        ) : (
                          <span title="Unverified Geographic Listing">
                            <HelpCircleIcon className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
                        {hospital.address}
                      </p>
                    </div>
                    {hospital.distance_km && (
                      <span className="text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 px-2 py-1 rounded shrink-0">
                        {hospital.distance_km} km
                      </span>
                    )}
                  </div>
                  <div className="mt-2 pt-2 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between text-xs">
                    <span className="text-gray-500">
                      {hospital.emergency_capability === "confirmed_24_7" ? "Confirmed 24/7" : "Capability unconfirmed"}
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleRequestDirections(hospital)}
                        className="text-emerald-600 dark:text-emerald-400 font-medium hover:underline flex items-center gap-0.5"
                      >
                        {routingLoading && selectedHospitalForRoute?.id === hospital.id ? "Routing…" : "Directions"}
                      </button>
                      <span className="text-gray-300 dark:text-gray-600">·</span>
                      <Link
                        href={`/hospitals/${hospital.id}`}
                        className="text-blue-600 dark:text-blue-400 font-medium hover:underline"
                      >
                        View Details →
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Right panel: Modern Google Maps with Street View cartography & 2D/3D toggle */}
      <div className="lg:w-2/3">
        <MapView
          center={mapCenter}
          markers={mapMarkers}
          zoom={hasUserCoords ? 15 : 12}
          encodedPolyline={encodedPolyline}
          accuracyRadiusMeters={userAccuracy}
          hasLocationFix={hasUserCoords}
          selectedMarkerId={selectedHospitalForRoute ? `hospital-${selectedHospitalForRoute.id}` : null}
          onMapClick={(coords) => {
            setManualLocation(coords.lat, coords.lng, 10);
          }}
          className="w-full h-137.5 rounded-lg shadow-lg"
        />
      </div>
    </div>
  );
}
