"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/Button";
import { supabase } from "@/lib/supabase";
import { useAmbulancePing } from "@/hooks/useAmbulancePing";
import { useRealtime } from "@/hooks/useRealtime";
import { toast } from "@/components/ui/Toaster";
import { MapView } from "@/components/MapView";
import { calculateDistance } from "@/lib/google-maps";
import {
  AmbulanceIcon,
  AlertCircleIcon,
  NavigationIcon,
  MapPinIcon,
  PlayIcon,
  PauseIcon,
  SatelliteIcon,
  GaugeIcon,
} from "lucide-react";
import type { Ambulance, Emergency } from "@/types/app";
import { EMERGENCY_STATUS_LABELS } from "@/types/app";

export default function ParamedicPage() {
  const { profile, loading: authLoading } = useAuth();
  const [ambulance, setAmbulance] = useState<Ambulance | null>(null);
  const [emergency, setEmergency] = useState<Emergency | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [acting, setActing] = useState(false);

  const ambulanceId = profile?.ambulance_id ?? null;

  const loadAssignment = useCallback(async () => {
    if (!ambulanceId) {
      setLoading(false);
      return;
    }

    try {
      const { data: unit } = await supabase
        .from("ambulances")
        .select("*")
        .eq("id", ambulanceId)
        .single();

      setAmbulance(unit as Ambulance | null);

      if (unit?.current_emergency_id) {
        const { data: incident } = await supabase
          .from("emergencies")
          .select("*")
          .eq("id", unit.current_emergency_id)
          .single();
        setEmergency(incident as Emergency | null);
      } else {
        setEmergency(null);
      }

      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load your assignment");
    } finally {
      setLoading(false);
    }
  }, [ambulanceId]);

  useEffect(() => {
    // Initial load of the crew's assignment is a genuine fetch on mount.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadAssignment();
  }, [loadAssignment]);

  // Keep the assignment fresh without a full reload.
  useRealtime<Ambulance>(
    "ambulances",
    ambulanceId ? `id=eq.${ambulanceId}` : null,
    undefined,
    (updated) => setAmbulance(updated)
  );

  useRealtime<Emergency>(
    "emergencies",
    emergency?.id ? `id=eq.${emergency.id}` : null,
    undefined,
    (updated) => setEmergency(updated)
  );

  // Simulation drives the vehicle toward the incident; GPS uses this device.
  const { mode, setMode, position, error: pingError, lastPing } =
    useAmbulancePing({
      ambulanceId,
      target: emergency
        ? { lat: emergency.latitude, lng: emergency.longitude }
        : null,
    });

  const distanceKm =
    ambulance && emergency
      ? calculateDistance(
          { lat: ambulance.latitude, lng: ambulance.longitude },
          { lat: emergency.latitude, lng: emergency.longitude }
        )
      : null;

  const advance = useCallback(
    async (status: string) => {
      if (!emergency) return;
      setActing(true);
      try {
        const res = await fetch("/api/dispatch", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "status",
            emergency_id: emergency.id,
            status,
          }),
        });
        const body = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(body.error || "Could not update the incident");
        toast(`Incident marked ${status.replace("_", " ")}`, "success");
        await loadAssignment();
      } catch (err) {
        toast(err instanceof Error ? err.message : "Update failed", "error");
      } finally {
        setActing(false);
      }
    },
    [emergency, loadAssignment]
  );

  if (authLoading || loading) {
    return <div className="py-12 text-center text-gray-600">Loading your unit...</div>;
  }

  if (profile?.role !== "paramedic") {
    return (
      <div className="max-w-lg mx-auto mt-12 text-center space-y-4">
        <AlertCircleIcon className="h-12 w-12 text-yellow-500 mx-auto" />
        <h1 className="text-2xl font-bold text-gray-900">Paramedics only</h1>
        <p className="text-gray-600">
          This console is limited to accounts with the paramedic role. If you
          should have access, ask a dispatcher to crew you to a vehicle.
        </p>
      </div>
    );
  }

  if (!ambulanceId || !ambulance) {
    return (
      <div className="max-w-lg mx-auto mt-12 text-center space-y-4">
        <AlertCircleIcon className="h-12 w-12 text-yellow-500 mx-auto" />
        <h1 className="text-2xl font-bold text-gray-900">No vehicle assigned</h1>
        <p className="text-gray-600">
          Your profile is not crewed to an ambulance yet. A dispatcher needs to
          set your vehicle before you can respond to calls.
        </p>
      </div>
    );
  }

  const status = emergency?.status;
  const nextAction =
    status === "dispatched"
      ? { label: "Start driving", value: "en_route" }
      : status === "en_route"
        ? { label: "I have arrived", value: "arrived" }
        : status === "arrived"
          ? { label: "Complete handover", value: "resolved" }
          : null;

  const vehiclePos = position ?? { lat: ambulance.latitude, lng: ambulance.longitude };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <AmbulanceIcon className="h-6 w-6 text-red-600" />
            {ambulance.vehicle_number}
          </h1>
          <p className="text-gray-600">
            {ambulance.driver_name || "Crew"} ·{" "}
            {status ? EMERGENCY_STATUS_LABELS[status] : "Standing by"}
          </p>
        </div>
      </div>

      {/* Position reporting */}
      <div className="bg-white rounded-xl shadow p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-semibold text-gray-900">Position reporting</h2>
            <p className="text-sm text-gray-600">
              {mode === "off"
                ? "Not reporting. The dispatch board cannot see your location."
                : mode === "gps"
                  ? "Reporting this device's GPS to dispatch."
                  : "Simulated movement toward the incident."}
              {lastPing && mode !== "off" && (
                <span className="text-gray-500">
                  {" "}
                  · last ping{" "}
                  {new Date(lastPing).toLocaleTimeString()}
                </span>
              )}
            </p>
          </div>

          <div className="flex gap-2">
            <Button
              variant={mode === "gps" ? "primary" : "outline"}
              size="sm"
              onClick={() => setMode(mode === "gps" ? "off" : "gps")}
            >
              <SatelliteIcon className="h-4 w-4 mr-1" />
              {mode === "gps" ? "Stop GPS" : "Use GPS"}
            </Button>
            <Button
              variant={mode === "simulation" ? "primary" : "outline"}
              size="sm"
              onClick={() =>
                setMode(mode === "simulation" ? "off" : "simulation")
              }
            >
              {mode === "simulation" ? (
                <PauseIcon className="h-4 w-4 mr-1" />
              ) : (
                <PlayIcon className="h-4 w-4 mr-1" />
              )}
              {mode === "simulation" ? "Stop sim" : "Simulate"}
            </Button>
          </div>
        </div>

        {pingError && (
          <p className="text-sm text-red-600 mt-3">{pingError}</p>
        )}
      </div>

      {error && (
        <div className="p-4 bg-red-50 text-red-800 rounded-lg flex items-center gap-2">
          <AlertCircleIcon className="h-5 w-5 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* Assignment */}
      {emergency ? (
        <>
          <div className="bg-white rounded-xl shadow p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="font-semibold text-gray-900">
                  Incident #{emergency.id.slice(0, 8)}
                </h2>
                <p className="text-sm text-gray-600 mt-1 flex items-start gap-1">
                  <MapPinIcon className="h-4 w-4 mt-0.5 flex-shrink-0 text-gray-400" />
                  {emergency.address ||
                    `${emergency.latitude.toFixed(4)}, ${emergency.longitude.toFixed(4)}`}
                </p>
                {emergency.description && (
                  <p className="text-sm text-gray-700 mt-2">
                    {emergency.description}
                  </p>
                )}
                {distanceKm !== null && (
                  <p className="text-sm text-gray-700 mt-2 flex items-center gap-1">
                    <NavigationIcon className="h-4 w-4 text-blue-500" />
                    {distanceKm < 1
                      ? `${Math.round(distanceKm * 1000)} m away`
                      : `${distanceKm.toFixed(1)} km away`}
                  </p>
                )}
              </div>

              {nextAction && (
                <Button
                  variant="primary"
                  loading={acting}
                  onClick={() => void advance(nextAction.value)}
                >
                  {nextAction.label}
                </Button>
              )}
            </div>
          </div>

          {/* Map */}
          <MapView
            className="w-full h-[400px] rounded-xl shadow"
            center={{ lat: vehiclePos.lat, lng: vehiclePos.lng }}
            zoom={14}
            markers={[
              {
                id: "ambulance",
                position: vehiclePos,
                title: `${ambulance.vehicle_number} (you)`,
                kind: "ambulance",
              },
              {
                id: "emergency",
                position: {
                  lat: emergency.latitude,
                  lng: emergency.longitude,
                },
                title: "Incident",
                kind: "emergency",
                info: emergency.address || "",
              },
            ]}
          />
        </>
      ) : (
        <div className="bg-white rounded-xl shadow p-8 text-center">
          <GaugeIcon className="h-10 w-10 mx-auto mb-2 text-gray-300" />
          <p className="text-gray-700 font-medium">Standing by</p>
          <p className="text-gray-500 text-sm">
            No active call. Dispatch will assign one to {ambulance.vehicle_number}.
          </p>
        </div>
      )}
    </div>
  );
}