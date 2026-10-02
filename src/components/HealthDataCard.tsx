"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { getFitbitAuthUrl, getEmergencyHealthData } from "@/lib/fitbit";
import {
  HeartIcon,
  FootprintsIcon,
  ActivityIcon,
  SmartphoneIcon,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import type { Emergency } from "@/types/app";

interface HealthDataCardProps {
  emergency: Emergency;
}

interface HealthData {
  heartRate: number | null;
  steps: number | null;
  location: { latitude: number; longitude: number; timestamp: string } | null;
  heartRateStatus: "normal" | "elevated" | "low" | "unknown";
}

export function HealthDataCard({ emergency }: HealthDataCardProps) {
  const { profile } = useAuth();
  const [healthData, setHealthData] = useState<HealthData | null>(null);
  const [loading, setLoading] = useState(false);

  // Derived directly rather than mirrored into state, which would need an
  // effect to stay in sync with the profile.
  const fitbitConnected = !!(
    profile?.fitbit_access_token && profile?.fitbit_refresh_token
  );

  const fetchHealthData = useCallback(async () => {
    if (!profile?.fitbit_access_token) return;

    setLoading(true);
    try {
      const data = await getEmergencyHealthData(profile.fitbit_access_token);

      let heartRateStatus: HealthData["heartRateStatus"] = "unknown";
      if (data.heartRate) {
        if (data.heartRate > 100) heartRateStatus = "elevated";
        else if (data.heartRate < 60) heartRateStatus = "low";
        else heartRateStatus = "normal";
      }

      setHealthData({
        heartRate: data.heartRate,
        steps: data.steps,
        location: data.location,
        heartRateStatus,
      });
    } catch (error) {
      console.error("Health data fetch error:", error);
    } finally {
      setLoading(false);
    }
  }, [profile]);

  useEffect(() => {
    // Initial load is a genuine external-data fetch on mount. The rule
    // flags any state-setting effect body, including async fetches.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchHealthData();

    // Poll for updates during an active emergency.
    const interval = setInterval(fetchHealthData, 10000);
    return () => clearInterval(interval);
  }, [fetchHealthData]);

  const handleConnectFitbit = () => {
    const authUrl = getFitbitAuthUrl(
      `${window.location.origin}/api/fitbit/callback`
    );
    window.location.href = authUrl;
  };

  const heartRateColors = {
    normal: "text-green-600",
    elevated: "text-orange-600",
    low: "text-red-600",
    unknown: "text-gray-400",
  };

  const heartRateLabels = {
    normal: "Normal",
    elevated: "Elevated",
    low: "Low",
    unknown: "Unknown",
  };

  return (
    <div className="bg-white rounded-xl shadow p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-900">Health Data</h3>
        <ActivityIcon className="h-5 w-5 text-blue-600" />
      </div>

      <p className="text-xs text-gray-500 mb-4">
        Emergency #{emergency.id.slice(0, 8)}
      </p>

      {!fitbitConnected ? (
        <div className="text-center py-6">
          <SmartphoneIcon className="h-12 w-12 mx-auto text-gray-300 mb-3" />
          <p className="text-gray-600 mb-3">
            Connect your Fitbit or smartwatch to share real-time health data
            with first responders.
          </p>
          <Button
            variant="primary"
            size="sm"
            onClick={handleConnectFitbit}
          >
            Connect Fitbit
          </Button>
          <p className="mt-2 text-xs text-gray-500">
            Also supports Apple Health &amp; Google Fit via mobile app.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {loading && !healthData && (
            <div className="flex items-center justify-center py-4">
              <div className="animate-spin rounded-full h-6 w-6 border-2 border-blue-600 border-t-transparent" />
            </div>
          )}

          {/* Heart Rate */}
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-3">
              <HeartIcon
                className={`h-6 w-6 ${heartRateColors[healthData?.heartRateStatus || "unknown"]}`}
              />
              <div>
                <p className="text-sm font-medium text-gray-700">Heart Rate</p>
                <p className="text-2xl font-bold text-gray-900">
                  {healthData?.heartRate ?? "—"}
                  {healthData?.heartRate && (
                    <span className="text-sm text-gray-500"> BPM</span>
                  )}
                </p>
                <p
                  className={`text-xs ${heartRateColors[healthData?.heartRateStatus || "unknown"]}`}
                >
                  {heartRateLabels[healthData?.heartRateStatus || "unknown"]}
                </p>
              </div>
            </div>
          </div>

          {/* Steps */}
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-3">
              <FootprintsIcon className="h-6 w-6 text-blue-600" />
              <div>
                <p className="text-sm font-medium text-gray-700">Steps (today)</p>
                <p className="text-2xl font-bold text-gray-900">
                  {healthData?.steps != null
                    ? healthData.steps.toLocaleString()
                    : "—"}
                </p>
              </div>
            </div>
          </div>

          {/* Device Location */}
          {healthData?.location && (
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <ActivityIcon className="h-6 w-6 text-green-600" />
                <div>
                  <p className="text-sm font-medium text-gray-700">
                    Device Location
                  </p>
                  <p className="text-sm text-gray-600">
                    {healthData.location.latitude.toFixed(4)},{" "}
                    {healthData.location.longitude.toFixed(4)}
                  </p>
                  <p className="text-xs text-gray-500">
                    Updated:{" "}
                    {new Date(healthData.location.timestamp).toLocaleTimeString()}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Manual refresh */}
          <Button
            variant="ghost"
            size="sm"
            fullWidth
            onClick={fetchHealthData}
            disabled={loading}
          >
            Refresh Health Data
          </Button>
        </div>
      )}

      {/* Share with responders */}
      {fitbitConnected && healthData && (
        <div className="mt-4 p-3 bg-blue-50 rounded-lg">
          <p className="text-xs text-blue-800">
            This health data will be available to emergency responders
            en route to your location.
          </p>
        </div>
      )}
    </div>
  );
}