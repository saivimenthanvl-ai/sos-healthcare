"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { Coordinates } from "@/types/app";

interface UseAmbulancePingOptions {
  ambulanceId: string | null;
  /** Where the vehicle is heading in simulation mode. */
  target?: Coordinates | null;
  /** Interpolated step as a fraction of the remaining distance, per tick. */
  simulationStep?: number;
  intervalMs?: number;
}

export type PingMode = "off" | "gps" | "simulation";

/** Great-circle interpolation used to animate the simulated vehicle. */
function interpolate(from: Coordinates, to: Coordinates, t: number): Coordinates {
  return {
    lat: from.lat + (to.lat - from.lat) * t,
    lng: from.lng + (to.lng - from.lng) * t,
  };
}

/**
 * Report an ambulance's position while it is on a call.
 *
 * Two modes:
 *  - "gps": reads the browser geolocation of the device the crew is using.
 *  - "simulation": walks the vehicle toward a target so the flow can be
 *    demonstrated from a desk with no moving vehicle.
 *
 * Pings write to `ambulance_locations` and update the ambulance row, which
 * is what the patient's map subscribes to.
 */
export function useAmbulancePing({
  ambulanceId,
  target = null,
  simulationStep = 0.12,
  intervalMs = 5000,
}: UseAmbulancePingOptions) {
  const [mode, setMode] = useState<PingMode>("off");
  const [position, setPosition] = useState<Coordinates | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastPing, setLastPing] = useState<number | null>(null);

  // Read the latest target inside the interval without restarting it on
  // every render. Written in an effect, never during render.
  const targetRef = useRef<Coordinates | null>(target);

  useEffect(() => {
    targetRef.current = target;
  }, [target]);

  const sendPing = useCallback(
    async (coords: Coordinates, speedKmh: number | null) => {
      if (!ambulanceId) return;

      const { error: pingError } = await supabase
        .from("ambulance_locations")
        .insert({
          ambulance_id: ambulanceId,
          latitude: coords.lat,
          longitude: coords.lng,
          speed_kmh: speedKmh,
        });

      if (pingError) {
        setError(pingError.message);
        return;
      }

      const { error: updateError } = await supabase
        .from("ambulances")
        .update({ latitude: coords.lat, longitude: coords.lng })
        .eq("id", ambulanceId);

      if (updateError) {
        setError(updateError.message);
        return;
      }

      setError(null);
      setPosition(coords);
      setLastPing(Date.now());
    },
    [ambulanceId]
  );

  // Simulation loop — advances the vehicle toward the target each tick.
  useEffect(() => {
    if (mode !== "simulation" || !ambulanceId) return;
    let cancelled = false;

    const tick = async () => {
      const { data } = await supabase
        .from("ambulances")
        .select("latitude, longitude")
        .eq("id", ambulanceId)
        .single();

      if (cancelled || !data) return;

      const current: Coordinates = {
        lat: data.latitude,
        lng: data.longitude,
      };
      const goal = targetRef.current;

      if (!goal) {
        void sendPing(current, 0);
        return;
      }

      const remaining =
        Math.hypot(goal.lat - current.lat, goal.lng - current.lng) * 111;
      // Close enough — park on the target rather than overshooting.
      const next =
        remaining < 0.05 ? goal : interpolate(current, goal, simulationStep);

      void sendPing(next, Math.min(Math.round(remaining / intervalMs) * 3.6, 120));
    };

    void tick();
    const interval = setInterval(() => void tick(), intervalMs);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [mode, ambulanceId, simulationStep, intervalMs, sendPing]);

  // GPS loop — watches the crew device's position.
  const gpsAvailable =
    typeof navigator !== "undefined" && !!navigator.geolocation;

  useEffect(() => {
    if (mode !== "gps" || !ambulanceId || !gpsAvailable) return;

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        void sendPing(
          {
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
          },
          // Geolocation reports metres/second; the schema wants km/h.
          pos.coords.speed != null ? pos.coords.speed * 3.6 : null
        );
      },
      (err) => setError(err.message),
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 15000 }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [mode, ambulanceId, sendPing, gpsAvailable]);

  // Derived rather than stored, so no effect is needed to set it.
  const reportedError =
    mode === "gps" && !gpsAvailable
      ? "Geolocation is not available on this device"
      : error;

  return { mode, setMode, position, error: reportedError, lastPing, sendPing };
}