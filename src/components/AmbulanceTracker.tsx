"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { calculateDistance } from "@/lib/google-maps";
import { useRealtime } from "@/hooks/useRealtime";
import {
  AmbulanceIcon,
  MapPinIcon,
  ClockIcon,
  PhoneIcon,
  CheckCircleIcon,
  NavigationIcon,
  AlertCircleIcon,
} from "lucide-react";
import type { Ambulance, Emergency } from "@/types/app";

interface Hospital {
  id: string;
  name: string;
  address: string;
  phone?: string | null;
}

interface AmbulanceTrackerProps {
  emergency: Emergency;
  /** Called when the emergency reaches a terminal state. */
  onEnd?: () => void;
}

export function AmbulanceTracker({
  emergency,
  onEnd,
}: AmbulanceTrackerProps) {
  const [ambulance, setAmbulance] = useState<Ambulance | null>(null);
  const [hospital, setHospital] = useState<Hospital | null>(null);
  const [liveStatus, setLiveStatus] = useState<Emergency["status"] | null>(null);
  const [distance, setDistance] = useState<number | null>(null);
  const [elapsed, setElapsed] = useState(0);

  // Realtime updates win over the prop; falling back to the prop keeps the
  // first paint correct without a syncing effect.
  const status = liveStatus ?? emergency.status;

  // Fetch the assigned ambulance and destination hospital.
  useEffect(() => {
    let cancelled = false;

    const fetchAssigned = async () => {
      if (emergency.assigned_ambulance_id) {
        const { data } = await supabase
          .from("ambulances")
          .select("*")
          .eq("id", emergency.assigned_ambulance_id)
          .single();
        if (!cancelled && data) setAmbulance(data as Ambulance);
      }

      if (emergency.assigned_hospital_id) {
        const { data } = await supabase
          .from("hospitals")
          .select("id, name, address, phone")
          .eq("id", emergency.assigned_hospital_id)
          .single();
        if (!cancelled && data) setHospital(data as Hospital);
      }
    };

    void fetchAssigned();

    return () => {
      cancelled = true;
    };
  }, [emergency.assigned_ambulance_id, emergency.assigned_hospital_id]);

  // The dispatcher/paramedic moves the emergency through its statuses, so
  // the patient's view has to follow those changes in realtime.
  useRealtime<Emergency>(
    "emergencies",
    emergency.id ? `id=eq.${emergency.id}` : null,
    undefined,
    (updated) => {
      setLiveStatus(updated.status);
      if (updated.status === "resolved" || updated.status === "cancelled") {
        onEnd?.();
      }
    }
  );

  // Live ambulance position.
  useRealtime<Ambulance>(
    "ambulances",
    emergency.assigned_ambulance_id
      ? `id=eq.${emergency.assigned_ambulance_id}`
      : null,
    undefined,
    (updated) => {
      setAmbulance(updated);
      if (updated.latitude != null && updated.longitude != null) {
        setDistance(
          calculateDistance(
            { lat: updated.latitude, lng: updated.longitude },
            { lat: emergency.latitude, lng: emergency.longitude }
          )
        );
      }
    }
  );

  // Elapsed time since the SOS was raised.
  useEffect(() => {
    const startTime = new Date(emergency.created_at).getTime();
    const tick = () => setElapsed(Math.floor((Date.now() - startTime) / 1000));
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [emergency.created_at]);

  const formatElapsed = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-red-500 px-6 py-4 text-white">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold">Emergency in Progress</h2>
          <div className="flex items-center gap-2">
            <ClockIcon className="h-4 w-4" />
            <span className="font-mono text-lg">{formatElapsed(elapsed)}</span>
          </div>
        </div>
        <p className="text-blue-100 mt-1 text-sm">
          Emergency #{emergency.id.slice(0, 8)} • Raised{" "}
          {new Date(emergency.created_at).toLocaleTimeString()}
        </p>
      </div>

      {/* Main content */}
      <div className="p-6 space-y-4">
        {/* Ambulance info */}
        {ambulance ? (
          <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
            <div className="bg-red-100 rounded-full p-3">
              <AmbulanceIcon className="h-8 w-8 text-red-600" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-gray-900">
                  {ambulance.driver_name || "Ambulance"} #
                  {ambulance.vehicle_number || ""}
                </h3>
              </div>
              {distance !== null && (
                <p className="text-sm text-gray-600 mt-1">
                  <NavigationIcon className="h-4 w-4 inline mr-1" />
                  {distance < 1
                    ? `${Math.round(distance * 1000)} m away`
                    : `${distance.toFixed(1)} km away`}
                </p>
              )}
            </div>
            {ambulance.vehicle_number && (
              <span className="text-xs font-mono bg-white border border-gray-200 text-gray-700 px-2 py-1 rounded">
                {ambulance.vehicle_number}
              </span>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-4 p-4 bg-yellow-50 rounded-lg">
            <AlertCircleIcon className="h-6 w-6 text-yellow-600 flex-shrink-0" />
            <p className="text-yellow-800">
              Waiting for nearest ambulance to be dispatched...
            </p>
          </div>
        )}

        {/* Hospital info */}
        {hospital && (
          <div className="flex items-start gap-4 p-4 bg-blue-50 rounded-lg">
            <div className="bg-blue-100 rounded-full p-3">
              <MapPinIcon className="h-6 w-6 text-blue-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900">{hospital.name}</h3>
              <p className="text-sm text-gray-600 mt-1">{hospital.address}</p>
              {hospital.phone && (
                <div className="flex items-center gap-1 mt-1 text-sm text-gray-600">
                  <PhoneIcon className="h-4 w-4" />
                  {hospital.phone}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ETA */}
        {emergency.eta_minutes && (
          <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg">
            <div>
              <p className="text-sm font-medium text-gray-700">
                Estimated Arrival
              </p>
              <p className="text-2xl font-bold text-red-600">
                {emergency.eta_minutes} minutes
              </p>
            </div>
            <CheckCircleIcon className="h-8 w-8 text-green-600" />
          </div>
        )}
      </div>

      {/* Status messages */}
      <div className="px-6 pb-4 space-y-2">
        {status === "dispatched" && (
          <div className="flex items-center gap-2 text-sm text-blue-800 bg-blue-50 p-3 rounded-lg">
            <div className="animate-pulse flex h-2 w-2 rounded-full bg-blue-600" />
            An ambulance has been dispatched to your location.
          </div>
        )}
        {status === "en_route" && (
          <div className="flex items-center gap-2 text-sm text-green-800 bg-green-50 p-3 rounded-lg">
            <div className="animate-pulse flex h-2 w-2 rounded-full bg-green-600" />
            Ambulance is heading to your location.
          </div>
        )}
        {status === "arrived" && (
          <div className="flex items-center gap-2 text-sm text-blue-800 bg-blue-50 p-3 rounded-lg">
            <CheckCircleIcon className="h-4 w-4 text-blue-600" />
            Ambulance has arrived. Please follow the paramedic&apos;s
            instructions.
          </div>
        )}
      </div>
    </div>
  );
}