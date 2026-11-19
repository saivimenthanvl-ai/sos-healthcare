"use client";

import { useEffect, useState } from "react";
import { HeartIcon, ShieldCheckIcon, SaveIcon, CheckCircleIcon, AlertCircleIcon, Loader2Icon } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export default function HealthProfilePage() {
  const { user } = useAuth();

  // Form field state (initialized empty to reflect genuine patient data)
  const [height, setHeight] = useState("");
  const [weight, setWeight] = useState("");
  const [bloodGroup, setBloodGroup] = useState("");
  const [systolic, setSystolic] = useState("");
  const [diastolic, setDiastolic] = useState("");
  const [heartRate, setHeartRate] = useState("");
  const [spO2, setSpO2] = useState("");
  const [temperature, setTemperature] = useState("");
  const [allergies, setAllergies] = useState("");
  const [conditions, setConditions] = useState("");
  const [medications, setMedications] = useState("");
  const [sharingConsent, setSharingConsent] = useState(false); // Default to OFF

  const [loading, setLoading] = useState(Boolean(user));
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Automatic BMI calculation from actual entered measurements
  const hMeters = parseFloat(height) / 100;
  const wKg = parseFloat(weight);
  const bmi = hMeters > 0 && wKg > 0 ? (wKg / (hMeters * hMeters)).toFixed(1) : "—";

  useEffect(() => {
    let active = true;
    if (!user) return;

    fetch("/api/profile/health")
      .then((res) => {
        if (res.ok) return res.json();
        if (res.status !== 401) {
          return res.json().then((d) => {
            throw new Error(d?.error || "Failed to load saved health records.");
          });
        }
        return null;
      })
      .then((data) => {
        if (!active || !data) return;
        setHeight(data.height || "");
        setWeight(data.weight || "");
        setBloodGroup(data.bloodGroup || "");
        setSystolic(data.systolic || "");
        setDiastolic(data.diastolic || "");
        setHeartRate(data.heartRate || "");
        setSpO2(data.spO2 || "");
        setTemperature(data.temperature || "");
        setAllergies(data.allergies || "");
        setConditions(data.conditions || "");
        setMedications(data.medications || "");
        setSharingConsent(Boolean(data.sharingConsent));
      })
      .catch((err: unknown) => {
        if (!active) return;
        console.warn("[HealthProfilePage] fetch notice:", err);
        setErrorMessage(err instanceof Error ? err.message : "Could not connect to health records service.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [user]);

  // Persist updates to database
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setErrorMessage("Please sign in to save your health profile.");
      return;
    }

    setSaving(true);
    setSaved(false);
    setErrorMessage(null);

    try {
      const res = await fetch("/api/profile/health", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          height,
          weight,
          bloodGroup,
          systolic,
          diastolic,
          heartRate,
          spO2,
          temperature,
          allergies,
          conditions,
          medications,
          sharingConsent,
        }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        setErrorMessage(data?.error || "Failed to save health profile. Unsaved changes have been retained.");
      } else {
        setSaved(true);
        setTimeout(() => setSaved(false), 4000);
      }
    } catch (err: unknown) {
      setErrorMessage(
        err instanceof Error
          ? err.message
          : "An unexpected network error occurred. Please check your connection and try again."
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 py-4">
      {/* Header */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow p-6 border border-gray-200 dark:border-gray-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <HeartIcon className="h-6 w-6 text-pink-600" />
            Patient Health Profile & Data Sharing
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
            Maintain your clinical measurements, allergies, and emergency pre-arrival triage data.
          </p>
        </div>
        {saved && (
          <div className="flex items-center gap-1.5 text-emerald-600 bg-emerald-50 dark:bg-emerald-950/50 px-3 py-1.5 rounded-lg text-sm font-semibold shrink-0">
            <CheckCircleIcon className="h-4 w-4" /> Saved
          </div>
        )}
      </div>

      {/* Error alert banner */}
      {errorMessage && (
        <div className="p-4 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 rounded-xl text-xs text-red-900 dark:text-red-200 flex items-start gap-3">
          <AlertCircleIcon className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            <span className="font-bold">Notice: </span>
            <span>{errorMessage}</span>
          </div>
        </div>
      )}

      {loading ? (
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow p-12 border border-gray-200 dark:border-gray-800 text-center flex flex-col items-center justify-center gap-3">
          <Loader2Icon className="h-6 w-6 text-pink-600 animate-spin" />
          <p className="text-sm text-gray-500">Loading your health profile records...</p>
        </div>
      ) : (
        <form onSubmit={handleSave}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Left: General & Calculated BMI */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow p-6 border border-gray-200 dark:border-gray-800 space-y-4">
              <h2 className="text-base font-bold text-gray-900 dark:text-white">Physical Measurements</h2>
              <Input
                label="Height (cm)"
                placeholder="e.g. 175"
                value={height}
                onChange={(e) => setHeight(e.target.value)}
                type="number"
                min="30"
                max="300"
              />
              <Input
                label="Weight (kg)"
                placeholder="e.g. 70"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                type="number"
                min="2"
                max="500"
                step="0.1"
              />
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase mb-1">
                  Blood Group
                </label>
                <select
                  value={bloodGroup}
                  onChange={(e) => setBloodGroup(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-800 text-sm border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="">Select Blood Group...</option>
                  <option value="A+">A+ (A Positive)</option>
                  <option value="A-">A- (A Negative)</option>
                  <option value="B+">B+ (B Positive)</option>
                  <option value="B-">B- (B Negative)</option>
                  <option value="AB+">AB+ (AB Positive)</option>
                  <option value="AB-">AB- (AB Negative)</option>
                  <option value="O+">O+ (O Positive)</option>
                  <option value="O-">O- (O Negative)</option>
                  <option value="UNKNOWN">Unknown / Not Tested</option>
                </select>
              </div>

              <div className="bg-gray-50 dark:bg-gray-800/60 p-4 rounded-xl text-center">
                <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">Calculated BMI</p>
                <p className="text-2xl font-black text-pink-600 dark:text-pink-400 mt-1">{bmi}</p>
                <p className="text-[11px] text-gray-400 mt-1">Automatically computed from height and weight</p>
              </div>
            </div>

            {/* Center: Vital Signs & Clinical Records */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow p-6 border border-gray-200 dark:border-gray-800 space-y-4 md:col-span-2">
              <h2 className="text-base font-bold text-gray-900 dark:text-white">Vital Signs & Clinical Readings</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <Input
                  label="BP Systolic (mmHg)"
                  placeholder="e.g. 120"
                  value={systolic}
                  onChange={(e) => setSystolic(e.target.value)}
                  type="number"
                  min="40"
                  max="300"
                />
                <Input
                  label="BP Diastolic (mmHg)"
                  placeholder="e.g. 80"
                  value={diastolic}
                  onChange={(e) => setDiastolic(e.target.value)}
                  type="number"
                  min="20"
                  max="200"
                />
                <Input
                  label="Heart Rate (BPM)"
                  placeholder="e.g. 72"
                  value={heartRate}
                  onChange={(e) => setHeartRate(e.target.value)}
                  type="number"
                  min="20"
                  max="300"
                />
                <Input
                  label="SpO2 Saturation (%)"
                  placeholder="e.g. 98"
                  value={spO2}
                  onChange={(e) => setSpO2(e.target.value)}
                  type="number"
                  min="50"
                  max="100"
                />
                <Input
                  label="Body Temp (°F)"
                  placeholder="e.g. 98.6"
                  value={temperature}
                  onChange={(e) => setTemperature(e.target.value)}
                  type="number"
                  min="80"
                  max="115"
                  step="0.1"
                />
              </div>

              <h2 className="text-base font-bold text-gray-900 dark:text-white pt-2">Medical History & Allergies</h2>
              <Input
                label="Known Allergies"
                placeholder="e.g. Penicillin, Latex, Peanuts"
                value={allergies}
                onChange={(e) => setAllergies(e.target.value)}
              />
              <Input
                label="Existing Medical Conditions"
                placeholder="e.g. Type 2 Diabetes, Hypertension, Asthma"
                value={conditions}
                onChange={(e) => setConditions(e.target.value)}
              />
              <Input
                label="Current Medications"
                placeholder="e.g. Metformin 500mg, Lisinopril 10mg"
                value={medications}
                onChange={(e) => setMedications(e.target.value)}
              />

              {/* Privacy & Sharing Controls */}
              <div className="bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 rounded-xl p-4 space-y-3 mt-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ShieldCheckIcon className="h-5 w-5 text-blue-600 shrink-0" />
                    <span className="font-bold text-xs text-blue-900 dark:text-blue-200">
                      Pre-Arrival Emergency Data Sharing Consent
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={sharingConsent}
                    onChange={(e) => setSharingConsent(e.target.checked)}
                    className="h-4 w-4 rounded text-blue-600 focus:ring-blue-500 border-gray-300 dark:border-gray-700"
                  />
                </div>
                <p className="text-[11px] text-blue-800 dark:text-blue-300 leading-relaxed">
                  Default: Disabled (OFF). When enabled by you, your blood group and recorded critical allergies may be shared with authorized emergency responders during an active SOS event. No clinical data is shared with external providers without explicit consent. You may withdraw consent at any time by unchecking this option.
                </p>
              </div>

              <Button
                type="submit"
                disabled={saving}
                variant="primary"
                className="w-full mt-4 flex items-center justify-center gap-2"
              >
                {saving ? (
                  <>
                    <Loader2Icon className="h-4 w-4 animate-spin" />
                    Saving Health Profile Updates...
                  </>
                ) : (
                  <>
                    <SaveIcon className="h-4 w-4" /> Save Health Profile Updates
                  </>
                )}
              </Button>
            </div>
          </div>
        </form>
      )}
    </div>
  );
}
