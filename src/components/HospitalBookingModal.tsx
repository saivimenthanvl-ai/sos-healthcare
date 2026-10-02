"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { XIcon, CheckCircleIcon, BedIcon, AmbulanceIcon, AlertCircleIcon } from "lucide-react";
import type { Hospital } from "@/types/app";

interface BookingModalProps {
  hospital: Hospital;
  userCoords: { lat: number; lng: number } | null;
  onClose: () => void;
  onSuccess: (bookingDetails: any) => void;
}

export function HospitalBookingModal({
  hospital,
  userCoords,
  onClose,
  onSuccess,
}: BookingModalProps) {
  const [bedType, setBedType] = useState("ICU Bed");
  const [requireAmbulance, setRequireAmbulance] = useState(true);
  const [priorityLevel, setPriorityLevel] = useState("Urgent (Immediate triage)");
  const [specialtyNeeds, setSpecialtyNeeds] = useState("Cardiology / Trauma");
  const [patientCondition, setPatientCondition] = useState("");
  const [loading, setLoading] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("/api/hospitals/book", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          hospitalId: hospital.id,
          hospitalName: hospital.name,
          userLocation: userCoords,
          customization: {
            bedType,
            requireAmbulance,
            priorityLevel,
            specialtyNeeds,
            notes: patientCondition,
          },
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to book");

      setConfirmed(true);
      setTimeout(() => {
        onSuccess(data);
        onClose();
      }, 1800);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Error submitting booking");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative text-gray-900 dark:text-gray-100">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1"
        >
          <XIcon className="h-5 w-5" />
        </button>

        {confirmed ? (
          <div className="py-8 text-center space-y-3">
            <CheckCircleIcon className="h-14 w-14 text-emerald-500 mx-auto animate-bounce" />
            <h3 className="text-2xl font-bold">Booking Confirmed!</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {hospital.name} has reserved your <strong>{bedType}</strong>.
              {requireAmbulance && " An emergency ambulance is also dispatched."}
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <span className="text-xs uppercase tracking-wider font-semibold text-blue-600 dark:text-blue-400">
                Customized Emergency Admission
              </span>
              <h2 className="text-xl font-bold mt-1">{hospital.name}</h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {hospital.address}
              </p>
            </div>

            {/* Customization Options */}
            <div className="space-y-3 text-sm">
              <div>
                <label className="block font-medium mb-1 flex items-center gap-1.5">
                  <BedIcon className="h-4 w-4 text-blue-500" />
                  Select Bed / Ward Type
                </label>
                <select
                  value={bedType}
                  onChange={(e) => setBedType(e.target.value)}
                  className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500"
                >
                  <option value="ICU Bed (Intensive Care)">ICU Bed (Intensive Care)</option>
                  <option value="Emergency Room (ER) Acute Bed">Emergency Room (ER) Acute Bed</option>
                  <option value="Cardiac Care Unit (CCU)">Cardiac Care Unit (CCU)</option>
                  <option value="Pediatric Emergency Bed">Pediatric Emergency Bed</option>
                  <option value="Standard Observation Bed">Standard Observation Bed</option>
                </select>
              </div>

              <div>
                <label className="block font-medium mb-1">Medical Specialty Requirement</label>
                <select
                  value={specialtyNeeds}
                  onChange={(e) => setSpecialtyNeeds(e.target.value)}
                  className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Cardiology / Chest Pain">Cardiology / Chest Pain</option>
                  <option value="Neurology / Stroke Care">Neurology / Stroke Care</option>
                  <option value="Orthopedic / Trauma Surgery">Orthopedic / Trauma Surgery</option>
                  <option value="Respiratory / Oxygen Support">Respiratory / Oxygen Support</option>
                  <option value="General Emergency Care">General Emergency Care</option>
                </select>
              </div>

              <div>
                <label className="block font-medium mb-1">Triage Priority</label>
                <select
                  value={priorityLevel}
                  onChange={(e) => setPriorityLevel(e.target.value)}
                  className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Critical - Immediate Life Threat">Critical - Immediate Life Threat</option>
                  <option value="Urgent - Severe Symptoms">Urgent - Severe Symptoms</option>
                  <option value="Semi-Urgent - Stable">Semi-Urgent - Stable</option>
                </select>
              </div>

              <div className="flex items-center gap-2 p-3 bg-blue-50 dark:bg-blue-950/40 rounded-lg border border-blue-200 dark:border-blue-900">
                <input
                  type="checkbox"
                  id="ambulanceCheck"
                  checked={requireAmbulance}
                  onChange={(e) => setRequireAmbulance(e.target.checked)}
                  className="rounded text-blue-600 focus:ring-blue-500 h-4 w-4"
                />
                <label htmlFor="ambulanceCheck" className="text-sm cursor-pointer select-none font-medium flex items-center gap-1.5">
                  <AmbulanceIcon className="h-4 w-4 text-red-500" />
                  Dispatch nearest Ambulance for transport
                </label>
              </div>

              <div>
                <label className="block font-medium mb-1">
                  Symptoms & Special Instructions (Optional)
                </label>
                <textarea
                  value={patientCondition}
                  onChange={(e) => setPatientCondition(e.target.value)}
                  placeholder="e.g. Patient is conscious, history of asthma, needs oxygen mask..."
                  className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500 h-20 resize-none"
                />
              </div>
            </div>

            <div className="pt-2 flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="flex-1"
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="danger"
                className="flex-1"
                loading={loading}
              >
                Confirm Custom Booking
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
