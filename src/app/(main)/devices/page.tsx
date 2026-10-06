"use client";

import { useState } from "react";
import { SmartphoneIcon, ActivityIcon, CheckCircleIcon, AlertCircleIcon, ShieldAlertIcon, RefreshCwIcon } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface SmartwatchProvider {
  id: string;
  name: string;
  status: "CONNECTED" | "NOT_CONFIGURED" | "AWAITING_CREDENTIALS";
  description: string;
  metrics: string[];
  notice?: string;
}

export default function DevicesPage() {
  const [connecting, setConnecting] = useState<string | null>(null);

  const devices: SmartwatchProvider[] = [
    {
      id: "fitbit",
      name: "Fitbit / Google Health",
      status: "AWAITING_CREDENTIALS",
      description: "Heart rate variability, step tracking, active minutes, and fall detection triggers.",
      metrics: ["Heart Rate", "Resting HR", "SpO2 Oxygen", "Step Telemetry"],
      notice: "Legacy Fitbit Web API sunset date scheduled for October 30, 2026. Transitioning to Google Health API.",
    },
    {
      id: "apple_health",
      name: "Apple Watch / Apple HealthKit",
      status: "NOT_CONFIGURED",
      description: "Direct HealthKit integration for iPhone and Apple Watch telemetry.",
      metrics: ["ECG Vitals", "Fall Detection Sensor", "Heart Spike Warning"],
      notice: "Requires iOS Companion App or Web HealthKit OAuth bridge.",
    },
    {
      id: "wear_os",
      name: "Wear OS / Android Smartwatch",
      status: "NOT_CONFIGURED",
      description: "Android Health Connect sensor synchronization for Wear OS wrist devices.",
      metrics: ["Continuous Pulse", "Emergency Beacon Sensor", "Sleep & Vitals"],
      notice: "Provider access onboarding currently in review with Google Health Platform.",
    },
  ];

  const handleConnect = (deviceId: string) => {
    setConnecting(deviceId);
    setTimeout(() => {
      setConnecting(null);
      alert(`${deviceId.toUpperCase()} integration requires approved Google Health / OEM OAuth credentials in server environment.`);
    }, 800);
  };

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

      {/* Safety Notice */}
      <div className="bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 rounded-xl p-4 text-xs text-blue-900 dark:text-blue-200 flex items-start gap-3">
        <ShieldAlertIcon className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
        <div>
          <span className="font-bold">Medical Telemetry Safeguards:</span> Smartwatch sensors provide supplementary personal wellness metrics. Emergency services are never dispatched solely from automated sensor anomalies without patient verification or explicit confirmation.
        </div>
      </div>

      {/* Device Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {devices.map((device) => (
          <div
            key={device.id}
            className="bg-white dark:bg-gray-900 rounded-2xl shadow border border-gray-200 dark:border-gray-800 p-5 flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-gray-900 dark:text-white text-base">{device.name}</h3>
                <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                  {device.status === "CONNECTED" ? "Connected" : "Provider Required"}
                </span>
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400 mb-4">{device.description}</p>

              <div className="mb-4">
                <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                  Telemetry Metrics:
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {device.metrics.map((m, idx) => (
                    <span
                      key={idx}
                      className="text-[10px] bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 px-2 py-0.5 rounded-md font-medium"
                    >
                      {m}
                    </span>
                  ))}
                </div>
              </div>

              {device.notice && (
                <p className="text-[11px] text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 p-2.5 rounded-lg mb-4">
                  ⚠️ {device.notice}
                </p>
              )}
            </div>

            <Button
              onClick={() => handleConnect(device.id)}
              disabled={connecting === device.id}
              variant="outline"
              className="w-full text-xs font-semibold py-2"
            >
              {connecting === device.id ? "Checking OAuth..." : "Connect Device"}
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
