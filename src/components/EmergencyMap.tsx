"use client";

import { useEffect, useState } from "react";
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
} from "lucide-react";
import type { Ambulance, Emergency, Hospital } from "@/types/app";

interface EmergencyMapProps {
  onEmergencyCreated?: (emergency: Emergency) => void;
}

export function EmergencyMap({ onEmergencyCreated }: EmergencyMapProps) {
  // Use consolidated geolocation hook
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
  const [routeCoordinates, setRouteCoordinates] = useState<[number, number][]>([]);

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

  // --- Subscribe to assigned ambulance location updates via Supabase Realtime ---
  useRealtime<Ambulance>(
    "ambulances",
    emergency?.assigned_ambulance_id ? `id=eq.${emergency.assigned_ambulance_id}` : null,
    undefined,
    (updated) => {
      setAssignedAmbulance(updated);
    }
  );

  // --- Fetch directions when ambulance is assigned or nearest hospital identified ---
  useEffect(() => {
    const targetHospital = hospitals.length > 0 ? hospitals[0] : null;
    if (userLat == null || userLng == null || !targetHospital) return;
    let isCancelled = false;

    const getRoute = async () => {
      try {
        const res = await fetch("/api/maps/directions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            origin: { lat: userLat, lng: userLng },
            destination: { lat: targetHospital.latitude, lng: targetHospital.longitude },
          }),
        });

        if (res.ok) {
          const data = await res.json();
          if (!isCancelled && data.coordinates) {
            setRouteCoordinates(data.coordinates);
          }
        }
      } catch (err) {
        console.warn("[EmergencyMap] Route load notice:", err);
      }
    };

    void getRoute();

    return () => {
      isCancelled = true;
    };
  }, [userLat, userLng, hospitals]);

  // --- Compile Map Markers ---
  const mapMarkers: MapMarkerSpec[] = [];

  if (userLat != null && userLng != null) {
    mapMarkers.push({
      id: "user-location",
      position: { lat: userLat, lng: userLng },
      title: "Your Location",
      kind: "user",
      info: `Accuracy: ~${Math.round(userAccuracy || 10)}m (${locationSource || "browser"})`,
    });
  }

  hospitals.forEach((h) => {
    mapMarkers.push({
      id: `hospital-${h.id}`,
      position: { lat: h.latitude, lng: h.longitude },
      title: h.name,
      kind: "hospital",
      info: `${h.address}${h.distance_km ? `<br/>${h.distance_km} km away` : ""}`,
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

  // --- Trigger Emergency SOS ---
  const handleSOS = async () => {
    if (userLat == null || userLng == null) {
      setSosStatusMessage({
        text: "Please permit location or provide a manual location coordinate before triggering SOS.",
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
        text: "SOS Emergency logged successfully. Our dispatchers and designated emergency contacts have been alerted.",
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
      setManualLocation(lat, lng, 50);
      setManualMode(false);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      {/* Left panel: SOS controls & details */}
      <div className="lg:w-1/3 space-y-6">
        <div className="bg-white dark:bg-gray-900 p-6 rounded-lg shadow-md border border-gray-100 dark:border-gray-800">
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            Emergency Assistance
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
            Press the button below to record an emergency alert. We notify your configured emergency contacts and surface the nearest verified hospitals.
          </p>

          <Button
            variant="danger"
            size="lg"
            className="w-full text-lg py-6 shadow-lg shadow-red-200 dark:shadow-none animate-pulse"
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
                  {manualMode ? "Cancel Manual" : "Manual Location"}
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
                  placeholder="Latitude"
                  className="w-1/2 p-1.5 border rounded dark:bg-gray-900 dark:border-gray-700"
                  value={manualInput.lat}
                  onChange={(e) => setManualInput((prev) => ({ ...prev, lat: e.target.value }))}
                  required
                />
                <input
                  type="number"
                  step="any"
                  placeholder="Longitude"
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

        {/* Location Status Card */}
        <div className="bg-white dark:bg-gray-900 p-4 rounded-lg shadow-sm border border-gray-100 dark:border-gray-800">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <MapPinIcon className="h-4 w-4 text-blue-600" />
              Your Location
            </h3>
            <button
              onClick={() => void requestLocation()}
              className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
            >
              <RefreshCwIcon className="h-3 w-3" /> Refresh
            </button>
          </div>

          {userLat != null && userLng != null ? (
            <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
              <p>
                Latitude: <span className="font-mono">{userLat.toFixed(4)}</span>
              </p>
              <p>
                Longitude: <span className="font-mono">{userLng.toFixed(4)}</span>
              </p>
              <p className="text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1 mt-1">
                <CheckCircleIcon className="h-3 w-3" />
                {locationSource === "manual" ? "Manual location set" : `GPS locked (~${Math.round(userAccuracy || 0)}m)`}
                {userTimestamp && <span className="text-gray-400">({new Date(userTimestamp).toLocaleTimeString()})</span>}
              </p>
            </div>
          ) : (
            <div className="text-sm text-gray-500 flex items-center justify-between">
              <span>{locationLoading ? "Detecting location..." : "Location not available"}</span>
              <Button size="sm" variant="outline" onClick={() => void requestLocation()}>
                Detect
              </Button>
            </div>
          )}
        </div>

        {/* Nearest Hospitals List */}
        <div className="bg-white dark:bg-gray-900 p-4 rounded-lg shadow-sm border border-gray-100 dark:border-gray-800">
          <h3 className="font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2 mb-3">
            <HospitalIcon className="h-4 w-4 text-emerald-600" />
            Nearest Verified Hospitals
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
            <p className="text-sm text-gray-500">No verified hospitals found in range.</p>
          ) : (
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {hospitals.slice(0, 5).map((hospital) => (
                <div
                  key={hospital.id}
                  className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-gray-100">{hospital.name}</h4>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
                        {hospital.address}
                      </p>
                    </div>
                    {hospital.distance_km && (
                      <span className="text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 px-2 py-1 rounded">
                        {hospital.distance_km} km
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Right panel: Free MapLibre + OpenFreeMap */}
      <div className="lg:w-2/3">
        <MapView
          center={{ lat: userLat ?? 37.7749, lng: userLng ?? -122.4194 }}
          markers={mapMarkers}
          zoom={13}
          routeCoordinates={routeCoordinates}
          onMapClick={(coords) => {
            setManualLocation(coords.lat, coords.lng, 10);
          }}
          className="w-full h-137.5 rounded-lg shadow-lg"
        />
      </div>
    </div>
  );
}
