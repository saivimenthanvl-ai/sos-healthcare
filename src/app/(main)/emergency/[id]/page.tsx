"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { useRealtime } from "@/hooks/useRealtime";
import { AmbulanceTracker } from "@/components/AmbulanceTracker";
import { Button } from "@/components/ui/Button";
import {
  AlertTriangleIcon,
  ArrowLeftIcon,
  ClockIcon,
  MapPinIcon,
  CheckCircleIcon,
  XIcon,
} from "lucide-react";
import type { Emergency } from "@/types/app";
import { EMERGENCY_STATUS_LABELS } from "@/types/app";

const ACTIVE_STATUSES = ["pending", "dispatched", "en_route", "arrived"];

export default function EmergencyDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { user } = useAuth();
  const router = useRouter();
  const [emergency, setEmergency] = useState<Emergency | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;

    const load = async () => {
      const { data, error: fetchError } = await supabase
        .from("emergencies")
        .select("*")
        .eq("id", id)
        .eq("user_id", user.id)
        .single();

      if (cancelled) return;

      if (fetchError || !data) {
        setError("We could not find that emergency, or it is not yours.");
        setLoading(false);
        return;
      }

      setEmergency(data as Emergency);
      setLoading(false);
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, [id, user]);

  // Keep the status live while the incident is open.
  useRealtime<Emergency>(
    "emergencies",
    emergency ? `id=eq.${emergency.id}` : null,
    undefined,
    (updated) => setEmergency((prev) => (prev ? { ...prev, ...updated } : prev))
  );

  const handleCancel = async () => {
    if (!emergency) return;
    if (!confirm("Cancel this emergency? A dispatched crew will be stood down."))
      return;

    setCancelling(true);
    const { error: cancelError } = await supabase
      .from("emergencies")
      .update({ status: "cancelled", updated_at: new Date().toISOString() })
      .eq("id", emergency.id)
      .eq("user_id", user?.id);

    if (cancelError) {
      setError(cancelError.message);
    } else {
      setEmergency((prev) => (prev ? { ...prev, status: "cancelled" } : prev));
    }
    setCancelling(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-6 w-6 border-2 border-blue-600 border-t-transparent" />
      </div>
    );
  }

  if (error || !emergency) {
    return (
      <div className="max-w-lg mx-auto mt-12 text-center space-y-4">
        <XIcon className="h-12 w-12 text-red-400 mx-auto" />
        <h1 className="text-2xl font-bold text-gray-900">Emergency not found</h1>
        <p className="text-gray-600">{error}</p>
        <Link href="/dashboard">
          <Button variant="primary">
            <ArrowLeftIcon className="h-4 w-4 mr-1" />
            Back to dashboard
          </Button>
        </Link>
      </div>
    );
  }

  const isActive = ACTIVE_STATUSES.includes(emergency.status);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900"
        >
          <ArrowLeftIcon className="h-4 w-4" />
          Dashboard
        </Link>
        {isActive && (
          <Button
            variant="outline"
            size="sm"
            loading={cancelling}
            onClick={handleCancel}
          >
            Cancel emergency
          </Button>
        )}
      </div>

      {isActive ? (
        <AmbulanceTracker
          emergency={emergency}
          onEnd={() => router.push("/dashboard")}
        />
      ) : (
        <div className="bg-white rounded-xl shadow p-6">
          <div className="flex items-center gap-3">
            <CheckCircleIcon className="h-8 w-8 text-green-500" />
            <div>
              <h1 className="text-xl font-semibold text-gray-900">
                {EMERGENCY_STATUS_LABELS[emergency.status]}
              </h1>
              <p className="text-sm text-gray-600">
                Emergency #{emergency.id.slice(0, 8)}
              </p>
            </div>
          </div>

          <dl className="mt-6 space-y-3 text-sm">
            <div className="flex items-start gap-2">
              <ClockIcon className="h-4 w-4 mt-0.5 text-gray-400 flex-shrink-0" />
              <div>
                <dt className="text-gray-600">Raised</dt>
                <dd className="text-gray-900 font-medium">
                  {new Date(emergency.created_at).toLocaleString()}
                </dd>
              </div>
            </div>

            {emergency.address && (
              <div className="flex items-start gap-2">
                <MapPinIcon className="h-4 w-4 mt-0.5 text-gray-400 flex-shrink-0" />
                <div>
                  <dt className="text-gray-600">Location</dt>
                  <dd className="text-gray-900 font-medium">
                    {emergency.address}
                  </dd>
                </div>
              </div>
            )}

            {emergency.eta_minutes && (
              <div className="flex items-start gap-2">
                <AlertTriangleIcon className="h-4 w-4 mt-0.5 text-gray-400 flex-shrink-0" />
                <div>
                  <dt className="text-gray-600">Estimated arrival</dt>
                  <dd className="text-gray-900 font-medium">
                    {emergency.eta_minutes} minutes
                  </dd>
                </div>
              </div>
            )}
          </dl>
        </div>
      )}
    </div>
  );
}