"use client";

import { useState } from "react";
import { HeartIcon, ShieldCheckIcon, SaveIcon, CheckCircleIcon } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export default function HealthProfilePage() {
  const [height, setHeight] = useState("175");
  const [weight, setWeight] = useState("70");
  const [bloodGroup, setBloodGroup] = useState("O+");
  const [systolic, setSystolic] = useState("120");
  const [diastolic, setDiastolic] = useState("80");
  const [heartRate, setHeartRate] = useState("72");
  const [spO2, setSpO2] = useState("98");
  const [temperature, setTemperature] = useState("98.6");
  const [allergies, setAllergies] = useState("None reported");
  const [conditions, setConditions] = useState("None");
  const [medications, setMedications] = useState("None");
  const [saved, setSaved] = useState(false);
  const [sharingConsent, setSharingConsent] = useState(true);

  // Automatic BMI calculation
  const hMeters = parseFloat(height) / 100;
  const wKg = parseFloat(weight);
  const bmi = hMeters > 0 && wKg > 0 ? (wKg / (hMeters * hMeters)).toFixed(1) : "—";

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 py-4">
      {/* Header */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow p-6 border border-gray-200 dark:border-gray-800 flex items-center justify-between">
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
          <div className="flex items-center gap-1.5 text-emerald-600 bg-emerald-50 dark:bg-emerald-950/50 px-3 py-1.5 rounded-lg text-sm font-semibold">
            <CheckCircleIcon className="h-4 w-4" /> Saved
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left: General & Calculated BMI */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow p-6 border border-gray-200 dark:border-gray-800 space-y-4">
          <h2 className="text-base font-bold text-gray-900 dark:text-white">Physical Measurements</h2>
          <Input label="Height (cm)" value={height} onChange={(e) => setHeight(e.target.value)} type="number" />
          <Input label="Weight (kg)" value={weight} onChange={(e) => setWeight(e.target.value)} type="number" />
          <Input label="Blood Group" value={bloodGroup} onChange={(e) => setBloodGroup(e.target.value)} />

          <div className="bg-gray-50 dark:bg-gray-800/60 p-4 rounded-xl text-center">
            <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">Calculated BMI</p>
            <p className="text-2xl font-black text-pink-600 dark:text-pink-400 mt-1">{bmi}</p>
            <p className="text-[11px] text-gray-400 mt-1">Automatically computed from height and weight</p>
          </div>
        </div>

        {/* Center: Vital Signs */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow p-6 border border-gray-200 dark:border-gray-800 space-y-4 md:col-span-2">
          <h2 className="text-base font-bold text-gray-900 dark:text-white">Vital Signs & Clinical Readings</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <Input label="BP Systolic (mmHg)" value={systolic} onChange={(e) => setSystolic(e.target.value)} type="number" />
            <Input label="BP Diastolic (mmHg)" value={diastolic} onChange={(e) => setDiastolic(e.target.value)} type="number" />
            <Input label="Heart Rate (BPM)" value={heartRate} onChange={(e) => setHeartRate(e.target.value)} type="number" />
            <Input label="SpO2 Saturation (%)" value={spO2} onChange={(e) => setSpO2(e.target.value)} type="number" />
            <Input label="Body Temp (°F)" value={temperature} onChange={(e) => setTemperature(e.target.value)} type="number" />
          </div>

          <h2 className="text-base font-bold text-gray-900 dark:text-white pt-2">Medical History & Allergies</h2>
          <Input label="Known Allergies" value={allergies} onChange={(e) => setAllergies(e.target.value)} />
          <Input label="Existing Medical Conditions" value={conditions} onChange={(e) => setConditions(e.target.value)} />
          <Input label="Current Medications" value={medications} onChange={(e) => setMedications(e.target.value)} />

          {/* Privacy & Sharing Controls */}
          <div className="bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 rounded-xl p-4 space-y-3 mt-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheckIcon className="h-5 w-5 text-blue-600" />
                <span className="font-bold text-xs text-blue-900 dark:text-blue-200">
                  Authorized Paramedic & Doctor Pre-Arrival Sharing
                </span>
              </div>
              <input
                type="checkbox"
                checked={sharingConsent}
                onChange={(e) => setSharingConsent(e.target.checked)}
                className="h-4 w-4 rounded text-blue-600"
              />
            </div>
            <p className="text-[11px] text-blue-800 dark:text-blue-300">
              When enabled, your blood group, critical allergies, and emergency contacts are securely shared with assigned doctors and dispatched responders upon emergency initiation.
            </p>
          </div>

          <Button onClick={handleSave} variant="primary" className="w-full mt-4 flex items-center justify-center gap-2">
            <SaveIcon className="h-4 w-4" /> Save Health Profile Updates
          </Button>
        </div>
      </div>
    </div>
  );
}
