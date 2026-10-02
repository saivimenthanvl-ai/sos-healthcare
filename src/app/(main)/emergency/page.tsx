"use client";

import { useEffect, useState } from "react";
import { EmergencyMap } from "@/components/EmergencyMap";
import { HealthDataCard } from "@/components/HealthDataCard";
import { AmbulanceTracker } from "@/components/AmbulanceTracker";
import { InfoIcon } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import type { Emergency } from "@/types/app";

/** Statuses where an ambulance is still working the incident. */
const ACTIVE_STATUSES = ["pending", "dispatched", "en_route", "arrived"];

export default function EmergencyPage() {
  const { user } = useAuth();
  const [activeEmergency, setActiveEmergency] = useState<Emergency | null>(null);
  const [restoring, setRestoring] = useState(true);

  // Re-attach to an emergency that is still in progress, so reloading the
  // page mid-response does not drop the patient back to the SOS button.
  useEffect(() => {
    if (!user) return;

    let cancelled = false;

    const restore = async () => {
      const { data } = await supabase
        .from("emergencies")
        .select("*")
        .eq("user_id", user.id)
        .in("status", ACTIVE_STATUSES)
        .order("created_at", { ascending: false })
        .limit(1);

      if (!cancelled && data && data.length > 0) {
        setActiveEmergency(data[0] as Emergency);
      }
      if (!cancelled) setRestoring(false);
    };

    void restore();

    return () => {
      cancelled = true;
    };
  }, [user]);

  if (restoring) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-6 w-6 border-2 border-blue-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Emergency disclaimer */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start gap-3">
        <InfoIcon className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
        <div>
          <p className="font-medium text-yellow-900">
            Medical Emergency Protocol
          </p>
          <p className="text-sm text-yellow-800 mt-1">
            Press the SOS button if you need immediate ambulance assistance.
            Your location will be shared with nearby hospitals and dispatched
            ambulances. Response time: 10-20 minutes. No fees charged. If this
            is life threatening, call your local emergency number first.
          </p>
        </div>
      </div>

      {/* If we have an active emergency, show tracker + health data */}
      {activeEmergency ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <AmbulanceTracker
              emergency={activeEmergency}
              onEnd={() => setActiveEmergency(null)}
            />
          </div>
          <div>
            <HealthDataCard emergency={activeEmergency} />
          </div>
        </div>
      ) : (
        <EmergencyMap onEmergencyCreated={setActiveEmergency} />
      )}
    </div>
  );
}