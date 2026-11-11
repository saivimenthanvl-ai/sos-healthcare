"use client";

import { useEffect, useState, useTransition } from "react";
import { SmartphoneIcon, CheckCircleIcon, ShieldAlertIcon, InfoIcon, ExternalLinkIcon, AlertTriangleIcon } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface DeviceStatus {
  connected: boolean;
  configured: boolean;
}

interface DevicesApiResponse {
  hasGoogleHealthCredentials: boolean;
  devices: {
    google_health: DeviceStatus;
    apple_health: DeviceStatus;
    wear_os: DeviceStatus;
  };
}

export default function DevicesPage() {
  const [loading, setLoading] = useState(true);
  const [deviceStatuses, setDeviceStatuses] = useState<DevicesApiResponse | null>(null);
  const [connecting, setConnecting] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  useEffect(() => {
    // Read status or error query params if redirected from OAuth callback
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const success = params.get("success");
      const error = params.get("error");
      if (success === "google_health_connected") {
        startTransition(() => {
          setStatusMessage("Google Health & Smartwatch connected successfully!");
        });
      } else if (error) {
        startTransition(() => {
          setErrorMessage(error);
        });
      }
    }

    fetch("/api/devices/status")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) setDeviceStatuses(data);
      })
      .catch((err) => console.warn("Failed to fetch device status:", err))
      .finally(() => setLoading(false));
  }, []);

  const handleConnectGoogleHealth = () => {
    setConnecting("google_health");
    // Standard full-page navigation for external OAuth redirection endpoint using absolute origin
    if (typeof window !== "undefined") {
      window.location.href = `${window.location.origin}/api/google-health/authorize`;
    }
  };

  const isGoogleHealthConnected = deviceStatuses?.devices.google_health.connected ?? false;
  const isGoogleHealthConfigured = deviceStatuses?.hasGoogleHealthCredentials ?? false;

  return (
    <div className="max-w-4xl mx-auto space-y-6 py-4">
      {/* Header */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow p-6 border border-gray-200 dark:border-gray-800">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
          <SmartphoneIcon className="h-6 w-6 text-indigo-600" />
          Smartwatch & Wearable Integration
        </h1>
        <p className="text-sm text-gray-600 dark:text-gray-300">
          Connect accredited wearable devices for telemetry monitoring, abnormal vitals detection, and wrist SOS activation.
        </p>
      </div>

      {statusMessage && (
        <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 rounded-xl p-4 text-sm font-medium text-emerald-900 dark:text-emerald-200 flex items-center gap-2">
          <InfoIcon className="h-5 w-5 text-emerald-600 shrink-0" />
          <span>{statusMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 rounded-xl p-4 text-sm font-medium text-red-900 dark:text-red-200 flex flex-col gap-2">
          <div className="flex items-center gap-2 font-semibold">
            <AlertTriangleIcon className="h-5 w-5 text-red-600 shrink-0" />
            <span>Google Health Authorization Notice</span>
          </div>
          <p className="text-xs text-red-700 dark:text-red-300">{errorMessage}</p>
          <div className="pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleConnectGoogleHealth}
              disabled={connecting === "google_health"}
            >
              Retry Connection
            </Button>
          </div>
        </div>
      )}

      {/* Safety Notice */}
      <div className="bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 rounded-xl p-4 text-xs text-blue-900 dark:text-blue-200 flex items-start gap-3">
        <ShieldAlertIcon className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold">Medical Telemetry Safeguards:</span> Smartwatch sensors provide supplementary personal wellness metrics. Emergency services are never dispatched solely from automated sensor anomalies without patient verification or explicit confirmation.
        </div>
      </div>

      {/* Device Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Card 1: Google Health / Fitbit */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow border border-gray-200 dark:border-gray-800 p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-gray-900 dark:text-white text-base">Google Health / Fitbit</h3>
              <span
                className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${
                  isGoogleHealthConnected
                    ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200"
                    : isGoogleHealthConfigured
                    ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                    : "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300"
                }`}
              >
                {isGoogleHealthConnected
                  ? "Connected"
                  : isGoogleHealthConfigured
                  ? "Ready to Connect"
                  : "Setup Required"}
              </span>
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400 mb-4">
              Heart rate variability, step tracking, active minutes, and wrist emergency beacon.
            </p>

            <div className="mb-4">
              <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                Telemetry Metrics:
              </p>
              <div className="flex flex-wrap gap-1.5">
                {["Heart Rate", "Resting HR", "Step Telemetry", "Wrist SOS"].map((m, idx) => (
                  <span
                    key={idx}
                    className="text-[10px] bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 px-2 py-0.5 rounded-md font-medium"
                  >
                    {m}
                  </span>
                ))}
              </div>
            </div>

            <p className="text-[11px] text-gray-500 dark:text-gray-400 italic mb-4">
              Powered by Google Health OAuth 2.0 Web Application.
            </p>
          </div>

          <div className="pt-2 border-t border-gray-100 dark:border-gray-800">
            {isGoogleHealthConnected ? (
              <div className="flex items-center gap-1.5 text-xs text-emerald-600 font-semibold py-2">
                <CheckCircleIcon className="w-4 h-4 text-emerald-500" />
                Active Telemetry Sync
              </div>
            ) : (
              <Button
                variant="primary"
                size="sm"
                className="w-full"
                onClick={handleConnectGoogleHealth}
                disabled={connecting === "google_health" || loading}
              >
                {connecting === "google_health" ? (
                  "Connecting to Google..."
                ) : (
                  <span className="flex items-center justify-center gap-1.5">
                    Connect Google Health <ExternalLinkIcon className="w-3.5 h-3.5" />
                  </span>
                )}
              </Button>
            )}
          </div>
        </div>

        {/* Card 2: Apple Watch */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow border border-gray-200 dark:border-gray-800 p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-gray-900 dark:text-white text-base">Apple Watch / HealthKit</h3>
              <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                Companion App Required
              </span>
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400 mb-4">
              Direct Apple HealthKit sensor synchronization for iPhone and Apple Watch telemetry.
            </p>

            <div className="mb-4">
              <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                Telemetry Metrics:
              </p>
              <div className="flex flex-wrap gap-1.5">
                {["ECG Vitals", "Fall Detection Sensor", "Heart Spike Warning"].map((m, idx) => (
                  <span
                    key={idx}
                    className="text-[10px] bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 px-2 py-0.5 rounded-md font-medium"
                  >
                    {m}
                  </span>
                ))}
              </div>
            </div>

            <p className="text-[11px] text-gray-500 dark:text-gray-400 italic mb-4">
              Direct HealthKit sync requires the iOS SOS Companion native application.
            </p>
          </div>

          <div className="pt-2 border-t border-gray-100 dark:border-gray-800">
            <Button variant="secondary" size="sm" className="w-full" disabled>
              Native iOS Companion Required
            </Button>
          </div>
        </div>

        {/* Card 3: Wear OS / Android */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow border border-gray-200 dark:border-gray-800 p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-gray-900 dark:text-white text-base">Wear OS / Health Connect</h3>
              <span
                className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${
                  isGoogleHealthConnected
                    ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200"
                    : "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                }`}
              >
                {isGoogleHealthConnected ? "Connected via Google" : "Google Health Paired"}
              </span>
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400 mb-4">
              Android Health Connect and Wear OS wrist sensors via unified Google Health Platform.
            </p>

            <div className="mb-4">
              <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                Telemetry Metrics:
              </p>
              <div className="flex flex-wrap gap-1.5">
                {["Continuous Pulse", "Emergency Beacon Sensor", "Sleep & Vitals"].map((m, idx) => (
                  <span
                    key={idx}
                    className="text-[10px] bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 px-2 py-0.5 rounded-md font-medium"
                  >
                    {m}
                  </span>
                ))}
              </div>
            </div>

            <p className="text-[11px] text-gray-500 dark:text-gray-400 italic mb-4">
              Wear OS synchronizes directly through the Google Health platform link.
            </p>
          </div>

          <div className="pt-2 border-t border-gray-100 dark:border-gray-800">
            {isGoogleHealthConnected ? (
              <div className="flex items-center gap-1.5 text-xs text-emerald-600 font-semibold py-2">
                <CheckCircleIcon className="w-4 h-4 text-emerald-500" />
                Active Wear OS Sync
              </div>
            ) : (
              <Button
                variant="primary"
                size="sm"
                className="w-full"
                onClick={handleConnectGoogleHealth}
                disabled={connecting === "google_health" || loading}
              >
                Connect with Google Health
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
