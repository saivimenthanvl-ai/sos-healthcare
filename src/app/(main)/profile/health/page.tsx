"use client";

import { useEffect, useState } from "react";
import {
  HeartIcon,
  ShieldCheckIcon,
  SaveIcon,
  CheckCircleIcon,
  AlertCircleIcon,
  Loader2Icon,
  ActivityIcon,
  HistoryIcon,
  PlusCircleIcon,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

interface HealthRecordItem {
  id: string;
  systolic_bp: number | null;
  diastolic_bp: number | null;
  heart_rate: number | null;
  oxygen_saturation: number | null;
  body_temperature: number | null;
  temperature_unit: string | null;
  blood_group: string | null;
  recorded_at: string;
  source: string | null;
}

export default function HealthProfilePage() {
  const { user } = useAuth();

  // Current Durable Profile State
  const [height, setHeight] = useState("");
  const [weight, setWeight] = useState("");
  const [bloodGroup, setBloodGroup] = useState("");
  const [allergies, setAllergies] = useState("");
  const [conditions, setConditions] = useState("");
  const [medications, setMedications] = useState("");
  const [sharingConsent, setSharingConsent] = useState(false); // Default to OFF

  // New Clinical Reading Inputs
  const [systolic, setSystolic] = useState("");
  const [diastolic, setDiastolic] = useState("");
  const [heartRate, setHeartRate] = useState("");
  const [spO2, setSpO2] = useState("");
  const [temperature, setTemperature] = useState("");
  const [temperatureUnit, setTemperatureUnit] = useState<"FAHRENHEIT" | "CELSIUS">("FAHRENHEIT");

  // History & Async State
  const [history, setHistory] = useState<HealthRecordItem[]>([]);
  const [loading, setLoading] = useState(Boolean(user));
  const [savingProfile, setSavingProfile] = useState(false);
  const [recordingVitals, setRecordingVitals] = useState(false);
  const [profileSaved, setProfileSaved] = useState(false);
  const [readingSaved, setReadingSaved] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Automatic BMI calculation from actual entered measurements
  const hMeters = parseFloat(height) / 100;
  const wKg = parseFloat(weight);
  const bmi = hMeters > 0 && wKg > 0 ? (wKg / (hMeters * hMeters)).toFixed(1) : "—";

  // Initial load from Supabase
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
        if (data.temperatureUnit === "CELSIUS") setTemperatureUnit("CELSIUS");
        setAllergies(data.allergies || "");
        setConditions(data.conditions || "");
        setMedications(data.medications || "");
        setSharingConsent(Boolean(data.sharingConsent));
        setHistory(data.history || []);
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

  // Operation 1: Save Current Health Profile (durable attributes, consent, history)
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setErrorMessage("Please sign in to save your health profile.");
      return;
    }

    setSavingProfile(true);
    setProfileSaved(false);
    setErrorMessage(null);

    try {
      const res = await fetch("/api/profile/health", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          height,
          weight,
          bloodGroup,
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
        setProfileSaved(true);
        setTimeout(() => setProfileSaved(false), 4000);
      }
    } catch (err: unknown) {
      setErrorMessage(
        err instanceof Error
          ? err.message
          : "An unexpected network error occurred. Please check your connection and try again."
      );
    } finally {
      setSavingProfile(false);
    }
  };

  // Operation 2: Record New Clinical Reading (creates a distinct timestamped observation)
  const handleRecordNewReading = async () => {
    if (!user) {
      setErrorMessage("Please sign in to record clinical readings.");
      return;
    }

    if (!systolic && !diastolic && !heartRate && !spO2 && !temperature) {
      setErrorMessage("Please enter at least one clinical reading to record a new measurement snapshot.");
      return;
    }

    setRecordingVitals(true);
    setReadingSaved(false);
    setErrorMessage(null);

    try {
      const idempotencyKey = `rec_${user.id}_${Date.now()}`;
      const res = await fetch("/api/profile/health", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          systolic,
          diastolic,
          heartRate,
          spO2,
          temperature,
          temperatureUnit,
          bloodGroup,
          allergies,
          conditions,
          medications,
          idempotencyKey,
        }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        setErrorMessage(data?.error || "Failed to record measurement snapshot.");
      } else {
        setReadingSaved(true);
        if (data.record) {
          setHistory((prev) => [data.record, ...prev]);
        }
        setTimeout(() => setReadingSaved(false), 4000);
      }
    } catch (err: unknown) {
      setErrorMessage(
        err instanceof Error ? err.message : "An unexpected error occurred while saving the reading."
      );
    } finally {
      setRecordingVitals(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 py-4">
      {/* Header */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow p-6 border border-gray-200 dark:border-gray-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <HeartIcon className="h-6 w-6 text-pink-600" />
            Patient Health Profile & Clinical Measurements
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
            Maintain your durable clinical attributes, manage explicit consent, and record timestamped observation snapshots.
          </p>
        </div>
        {(profileSaved || readingSaved) && (
          <div className="flex items-center gap-1.5 text-emerald-600 bg-emerald-50 dark:bg-emerald-950/50 px-3 py-1.5 rounded-lg text-sm font-semibold shrink-0">
            <CheckCircleIcon className="h-4 w-4" /> {readingSaved ? "Reading Recorded" : "Profile Saved"}
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
        <div className="space-y-6">
          <form onSubmit={handleSaveProfile}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Left: Durable Physical Measurements & Calculated BMI */}
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

              {/* Center: Medical History & Privacy Consent */}
              <div className="bg-white dark:bg-gray-900 rounded-2xl shadow p-6 border border-gray-200 dark:border-gray-800 space-y-4 md:col-span-2">
                <h2 className="text-base font-bold text-gray-900 dark:text-white">Medical History & Allergies</h2>
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
                  disabled={savingProfile}
                  variant="primary"
                  className="w-full mt-4 flex items-center justify-center gap-2"
                >
                  {savingProfile ? (
                    <>
                      <Loader2Icon className="h-4 w-4 animate-spin" />
                      Saving Current Profile...
                    </>
                  ) : (
                    <>
                      <SaveIcon className="h-4 w-4" /> Save Current Health Profile
                    </>
                  )}
                </Button>
              </div>
            </div>
          </form>

          {/* New Observation Entry & Timestamped Vital Signs */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow p-6 border border-gray-200 dark:border-gray-800 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-gray-200 dark:border-gray-800">
              <div className="flex items-center gap-2">
                <ActivityIcon className="h-5 w-5 text-pink-600" />
                <h2 className="text-base font-bold text-gray-900 dark:text-white">Record New Observation Snapshot</h2>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <span className="text-gray-500 font-medium">Temperature Unit:</span>
                <button
                  type="button"
                  onClick={() => setTemperatureUnit("FAHRENHEIT")}
                  className={`px-2 py-0.5 rounded font-bold transition ${
                    temperatureUnit === "FAHRENHEIT"
                      ? "bg-pink-600 text-white"
                      : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300"
                  }`}
                >
                  °F
                </button>
                <button
                  type="button"
                  onClick={() => setTemperatureUnit("CELSIUS")}
                  className={`px-2 py-0.5 rounded font-bold transition ${
                    temperatureUnit === "CELSIUS"
                      ? "bg-pink-600 text-white"
                      : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300"
                  }`}
                >
                  °C
                </button>
              </div>
            </div>

            <p className="text-xs text-gray-500 dark:text-gray-400">
              Enter your current vitals and click &ldquo;Record New Observation&rdquo; to add an immutable timestamped reading to your clinical history without modifying your durable profile.
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 pt-1">
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
                label={`Body Temp (${temperatureUnit === "CELSIUS" ? "°C" : "°F"})`}
                placeholder={temperatureUnit === "CELSIUS" ? "e.g. 37.0" : "e.g. 98.6"}
                value={temperature}
                onChange={(e) => setTemperature(e.target.value)}
                type="number"
                min={temperatureUnit === "CELSIUS" ? "25" : "80"}
                max={temperatureUnit === "CELSIUS" ? "45" : "115"}
                step="0.1"
              />
            </div>

            <Button
              type="button"
              onClick={handleRecordNewReading}
              disabled={recordingVitals}
              variant="outline"
              className="w-full flex items-center justify-center gap-2 border-pink-600 text-pink-600 hover:bg-pink-50 dark:hover:bg-pink-950/40"
            >
              {recordingVitals ? (
                <>
                  <Loader2Icon className="h-4 w-4 animate-spin" />
                  Recording Observation...
                </>
              ) : (
                <>
                  <PlusCircleIcon className="h-4 w-4" /> Record New Observation Snapshot
                </>
              )}
            </Button>
          </div>

          {/* Historical Readings Timeline */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow p-6 border border-gray-200 dark:border-gray-800 space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-gray-200 dark:border-gray-800">
              <HistoryIcon className="h-5 w-5 text-gray-500" />
              <h2 className="text-base font-bold text-gray-900 dark:text-white">Recent Historical Readings</h2>
            </div>

            {history.length === 0 ? (
              <div className="py-8 text-center text-xs text-gray-500">
                No historical clinical readings recorded yet. Use the snapshot recorder above to track your vital signs over time.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-gray-700 dark:text-gray-300">
                  <thead className="bg-gray-50 dark:bg-gray-800/60 uppercase font-semibold text-[11px] text-gray-600 dark:text-gray-400">
                    <tr>
                      <th className="py-2.5 px-3">Date & Time</th>
                      <th className="py-2.5 px-3">Blood Pressure</th>
                      <th className="py-2.5 px-3">Heart Rate</th>
                      <th className="py-2.5 px-3">SpO2</th>
                      <th className="py-2.5 px-3">Temperature</th>
                      <th className="py-2.5 px-3">Source</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                    {history.map((row) => (
                      <tr key={row.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/40">
                        <td className="py-2 px-3 font-mono text-[11px] text-gray-500">
                          {new Date(row.recorded_at).toLocaleDateString()} {new Date(row.recorded_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </td>
                        <td className="py-2 px-3 font-medium">
                          {row.systolic_bp && row.diastolic_bp ? `${row.systolic_bp}/${row.diastolic_bp} mmHg` : "—"}
                        </td>
                        <td className="py-2 px-3">{row.heart_rate ? `${row.heart_rate} BPM` : "—"}</td>
                        <td className="py-2 px-3">{row.oxygen_saturation ? `${row.oxygen_saturation}%` : "—"}</td>
                        <td className="py-2 px-3">
                          {row.body_temperature ? `${row.body_temperature}° ${row.temperature_unit === "CELSIUS" ? "C" : "F"}` : "—"}
                        </td>
                        <td className="py-2 px-3">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300">
                            {row.source || "PATIENT_ENTERED"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
