"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/Button";
import { calculateDistance } from "@/lib/google-maps";
import { toast } from "@/components/ui/Toaster";
import {
  AlertTriangleIcon,
  AmbulanceIcon,
  ClockIcon,
  MapPinIcon,
  CheckCircleIcon,
  NavigationIcon,
  AlertCircleIcon,
  UsersIcon,
} from "lucide-react";
import type { Ambulance, Emergency } from "@/types/app";
import { EMERGENCY_STATUS_LABELS } from "@/types/app";

interface BoardState {
  emergencies: Emergency[];
  ambulances: Ambulance[];
}

function elapsedFrom(iso: string): string {
  const seconds = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 1000));
  const mins = Math.floor(seconds / 60);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  return `${Math.floor(mins / 60)}h ${mins % 60}m ago`;
}

const statusStyles: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  dispatched: "bg-blue-100 text-blue-800",
  en_route: "bg-indigo-100 text-indigo-800",
  arrived: "bg-green-100 text-green-800",
};

export default function DispatchPage() {
  const { profile, loading: authLoading } = useAuth();
  const [board, setBoard] = useState<BoardState>({ emergencies: [], ambulances: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [assigning, setAssigning] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const loadBoard = useCallback(async () => {
    try {
      const res = await fetch("/api/dispatch");
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Could not load the dispatch board");
      }
      const data = (await res.json()) as BoardState;
      setBoard(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load the dispatch board");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Initial load of the incident board is a genuine external fetch on mount.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadBoard();
  }, [loadBoard]);

  // Poll as a safety net. Paramedics move the statuses from their own device,
  // and this console may not hold an open realtime channel.
  useEffect(() => {
    const interval = setInterval(() => void loadBoard(), 10000);
    return () => clearInterval(interval);
  }, [loadBoard]);

  const available = useMemo(
    () => board.ambulances.filter((a) => a.status === "available"),
    [board.ambulances]
  );

  const busy = useMemo(
    () => board.ambulances.filter((a) => a.status !== "available"),
    [board.ambulances]
  );

  const dispatch = useCallback(
    async (action: string, emergencyId: string, extra: Record<string, unknown> = {}) => {
      setBusyId(emergencyId);
      try {
        const res = await fetch("/api/dispatch", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action, emergency_id: emergencyId, ...extra }),
        });

        const body = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(body.error || "Dispatch action failed");

        toast(
          action === "assign"
            ? `Crew assigned · ETA ${body.etaMinutes} min`
            : "Incident updated",
          "success"
        );
        await loadBoard();
      } catch (err) {
        toast(err instanceof Error ? err.message : "Dispatch action failed", "error");
      } finally {
        setBusyId(null);
        setAssigning(null);
      }
    },
    [loadBoard]
  );

  if (authLoading) {
    return <div className="py-12 text-center text-gray-600">Loading console...</div>;
  }

  if (profile?.role !== "dispatcher") {
    return (
      <div className="max-w-lg mx-auto mt-12 text-center space-y-4">
        <AlertCircleIcon className="h-12 w-12 text-yellow-500 mx-auto" />
        <h1 className="text-2xl font-bold text-gray-900">Dispatchers only</h1>
        <p className="text-gray-600">
          This console is limited to accounts with the dispatcher role. If you
          should have access, ask an administrator to update your profile role.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dispatch Console</h1>
          <p className="text-gray-600">
            {board.emergencies.length} active incident
            {board.emergencies.length === 1 ? "" : "s"} ·{" "}
            {available.length} unit{available.length === 1 ? "" : "s"} available
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => void loadBoard()}>
          Refresh
        </Button>
      </div>

      {error && (
        <div className="p-4 bg-red-50 text-red-800 rounded-lg flex items-center gap-2">
          <AlertCircleIcon className="h-5 w-5 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* Incident queue */}
      <section>
        <h2 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
          <AlertTriangleIcon className="h-5 w-5 text-red-600" />
          Active Incidents
        </h2>

        {loading ? (
          <div className="space-y-3">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-100 animate-pulse rounded-xl" />
            ))}
          </div>
        ) : board.emergencies.length === 0 ? (
          <div className="bg-white rounded-xl shadow p-8 text-center text-gray-500">
            <CheckCircleIcon className="h-10 w-10 mx-auto mb-2 text-green-400" />
            No active incidents. All quiet.
          </div>
        ) : (
          <div className="space-y-4">
            {board.emergencies.map((emergency) => (
              <div
                key={emergency.id}
                className="bg-white rounded-xl shadow border border-gray-100 overflow-hidden"
              >
                <div className="p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-gray-900">
                          Incident #{emergency.id.slice(0, 8)}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                            statusStyles[emergency.status] || "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {EMERGENCY_STATUS_LABELS[emergency.status]}
                        </span>
                        <span className="text-xs text-gray-500 flex items-center gap-1">
                          <ClockIcon className="h-3 w-3" />
                          {elapsedFrom(emergency.created_at)}
                        </span>
                      </div>

                      <p className="text-sm text-gray-700 mt-2 flex items-start gap-1">
                        <MapPinIcon className="h-4 w-4 mt-0.5 flex-shrink-0 text-gray-400" />
                        <span>
                          {emergency.address ||
                            `${emergency.latitude.toFixed(4)}, ${emergency.longitude.toFixed(4)}`}
                        </span>
                      </p>

                      {emergency.description && (
                        <p className="text-sm text-gray-600 mt-1">
                          {emergency.description}
                        </p>
                      )}

                      <p className="text-xs text-gray-500 mt-2">
                        Emergency #{emergency.id.slice(0, 8)} ·{" "}
                        {emergency.eta_minutes
                          ? `ETA ${emergency.eta_minutes} min`
                          : "no crew yet"}
                        {emergency.assigned_ambulance?.vehicle_number
                          ? ` · ${emergency.assigned_ambulance.driver_name || "Crew"} (${emergency.assigned_ambulance.vehicle_number})`
                          : ""}
                      </p>
                    </div>

                    <div className="flex gap-2">
                      {emergency.assigned_ambulance_id && (
                        <Button
                          variant="outline"
                          size="sm"
                          loading={busyId === emergency.id}
                          onClick={() =>
                            void dispatch("release", emergency.id)
                          }
                        >
                          Release crew
                        </Button>
                      )}
                      {emergency.status !== "resolved" &&
                        emergency.status !== "cancelled" && (
                          <Button
                            variant="secondary"
                            size="sm"
                            loading={busyId === emergency.id}
                            onClick={() =>
                              void dispatch("status", emergency.id, {
                                status: "cancelled",
                              })
                            }
                          >
                            Cancel
                          </Button>
                        )}
                    </div>
                  </div>
                </div>

                {/* Crew picker */}
                {!emergency.assigned_ambulance_id && emergency.status === "pending" && (
                  <div className="border-t bg-gray-50 p-4">
                    {assigning === emergency.id ? (
                      available.length === 0 ? (
                        <p className="text-sm text-gray-600">
                          No units available. Wait for a crew to stand down.
                        </p>
                      ) : (
                        <div className="space-y-2">
                          <p className="text-xs font-medium text-gray-600 uppercase tracking-wide">
                            Assign nearest unit
                          </p>
                          {available.map((unit) => {
                            const km = calculateDistance(
                              { lat: unit.latitude, lng: unit.longitude },
                              { lat: emergency.latitude, lng: emergency.longitude }
                            );
                            return (
                              <button
                                key={unit.id}
                                onClick={() =>
                                  void dispatch("assign", emergency.id, {
                                    ambulance_id: unit.id,
                                  })
                                }
                                className="w-full flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-colors text-left"
                              >
                                <span>
                                  <span className="font-medium text-gray-900">
                                    {unit.vehicle_number}
                                  </span>
                                  <span className="text-sm text-gray-600 ml-2">
                                    {unit.driver_name || "Unassigned"}
                                  </span>
                                </span>
                                <span className="text-sm font-medium text-blue-600">
                                  {km.toFixed(1)} km ·{" "}
                                  {Math.max(Math.round((km / 40) * 60), 5)} min
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      )
                    ) : (
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => setAssigning(emergency.id)}
                      >
                        <AmbulanceIcon className="h-4 w-4 mr-1" />
                        Assign ambulance
                      </Button>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Fleet */}
      <section>
        <h2 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
          <UsersIcon className="h-5 w-5 text-blue-600" />
          Fleet ({board.ambulances.length})
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...available, ...busy].map((unit) => (
            <div
              key={unit.id}
              className="bg-white rounded-xl shadow p-4 border border-gray-100"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-semibold text-gray-900">
                    {unit.vehicle_number}
                  </p>
                  <p className="text-sm text-gray-600">
                    {unit.driver_name || "No crew assigned"}
                  </p>
                </div>
                <span
                  className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                    unit.status === "available"
                      ? "bg-green-100 text-green-800"
                      : unit.status === "arrived"
                        ? "bg-green-100 text-green-800"
                        : "bg-blue-100 text-blue-800"
                  }`}
                >
                  {unit.status}
                </span>
              </div>

              {unit.current_emergency_id && (
                <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                  <NavigationIcon className="h-3 w-3" />
                  On incident #{unit.current_emergency_id.slice(0, 8)}
                </p>
              )}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}