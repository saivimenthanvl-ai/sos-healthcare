"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { ActivityIcon, HeartIcon, SmartphoneIcon } from "lucide-react";
import { Button } from "@/components/ui/Button";
import type { Emergency } from "@/types/app";

interface HealthDataCardProps {
  emergency: Emergency;
}

interface LatestHealthRecord {
  heart_rate: number | null;
  oxygen_saturation: number | null;
  systolic_bp: number | null;
  diastolic_bp: number | null;
  body_temperature: number | null;
  source: string | null;
  recorded_at: string;
}

/**
 * Shows health data that is already authorized in Supabase.
 * Provider OAuth credentials never enter the browser.
 */
export function HealthDataCard({ emergency }: HealthDataCardProps) {
  const { user } = useAuth();
  const [record, setRecord] = useState<LatestHealthRecord | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchLatest = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    const { data, error } = await supabase
      .from("health_records")
      .select(
        "heart_rate, oxygen_saturation, systolic_bp, diastolic_bp, body_temperature, source, recorded_at"
      )
      .eq("patient_id", user.id)
      .order("recorded_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.warn("[HealthDataCard] latest record unavailable");
      setRecord(null);
    } else {
      setRecord(data as LatestHealthRecord | null);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    void fetchLatest();
  }, [fetchLatest]);

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl shadow p-5 border border-gray-100 dark:border-gray-800">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-900 dark:text-white">Health Context</h3>
        <ActivityIcon className="h-5 w-5 text-blue-600" />
      </div>

      <p className="text-xs text-gray-500 mb-4">
        Emergency #{emergency.id.slice(0, 8)}
      </p>

      {loading ? (
        <p className="text-sm text-gray-500">Loading authorized health data…</p>
      ) : !record ? (
        <div className="text-center py-5">
          <SmartphoneIcon className="h-10 w-10 mx-auto text-gray-300 mb-3" />
          <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
            No recent health record is available. Wearable providers are connected
            through secure backend integrations only.
          </p>
          <Link href="/devices">
            <Button size="sm" variant="outline">Manage Health Devices</Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div className="flex items-center gap-2 mb-1">
              <HeartIcon className="h-5 w-5 text-red-500" />
              <span className="text-sm font-medium">Latest recorded vitals</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <span>Heart rate: {record.heart_rate ?? "—"}{record.heart_rate ? " BPM" : ""}</span>
              <span>SpO₂: {record.oxygen_saturation ?? "—"}{record.oxygen_saturation ? "%" : ""}</span>
              <span>
                BP: {record.systolic_bp != null && record.diastolic_bp != null
                  ? `${record.systolic_bp}/${record.diastolic_bp}`
                  : "—"}
              </span>
              <span>
                Temperature: {record.body_temperature ?? "—"}
                {record.body_temperature != null ? " °C" : ""}
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Recorded {new Date(record.recorded_at).toLocaleString()} · Source: {record.source || "unknown"}
            </p>
          </div>

          <p className="text-xs text-amber-700 dark:text-amber-300">
            Wearable and patient-entered readings are supplementary context and are
            not a substitute for clinical assessment.
          </p>

          <Button variant="ghost" size="sm" fullWidth onClick={fetchLatest}>
            Refresh authorized health data
          </Button>
        </div>
      )}
    </div>
  );
}
