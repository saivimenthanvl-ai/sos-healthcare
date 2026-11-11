"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { XIcon, CheckCircleIcon, ShieldAlertIcon, CalendarIcon, ClockIcon, BuildingIcon, InfoIcon } from "lucide-react";
import type { Hospital } from "@/types/app";

interface BookingModalProps {
  hospital: Hospital;
  userCoords?: { lat: number; lng: number } | null;
  onClose: () => void;
  onSuccess: (bookingDetails: unknown) => void;
}

export function HospitalBookingModal({
  hospital,
  onClose,
  onSuccess,
}: BookingModalProps) {
  const [consultationType, setConsultationType] = useState("Specialist Consultation");
  const [specialty, setSpecialty] = useState("General Medicine");
  const [consultationMode, setConsultationMode] = useState<"IN_PERSON" | "VIRTUAL">("IN_PERSON");
  
  // Default to tomorrow 10:00 AM
  const [preferredDate, setPreferredDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split("T")[0];
  });
  const [preferredTime, setPreferredTime] = useState("10:00");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage(null);

    try {
      const preferredStartsAt = new Date(`${preferredDate}T${preferredTime}:00`).toISOString();

      const res = await fetch("/api/appointment-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          hospitalId: hospital.id,
          hospitalName: hospital.name,
          specialty,
          consultationType,
          consultationMode,
          preferredStartsAt,
          notes,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save appointment request");

      setConfirmed(true);
      setTimeout(() => {
        onSuccess(data);
        onClose();
      }, 1500);
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Error saving appointment request");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative text-gray-900 dark:text-gray-100 max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1 rounded-lg"
          aria-label="Close modal"
        >
          <XIcon className="h-5 w-5" />
        </button>

        {confirmed ? (
          <div className="py-8 text-center space-y-3">
            <CheckCircleIcon className="h-14 w-14 text-emerald-500 mx-auto" />
            <h3 className="text-2xl font-bold">Appointment Request Saved!</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Your custom appointment plan for {hospital.name} has been privately saved in SOS Healthcare.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                Private Appointment Planner
              </span>
              <h2 className="text-xl font-bold flex items-center gap-2 mt-1">
                <BuildingIcon className="h-5 w-5 text-blue-600" />
                {hospital.name}
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{hospital.address}</p>
            </div>

            {/* Critical Privacy & Medical Safety Disclosures */}
            <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 rounded-xl text-xs space-y-1.5 text-amber-900 dark:text-amber-200">
              <div className="flex items-center gap-1.5 font-bold">
                <InfoIcon className="h-4 w-4 shrink-0 text-amber-600" />
                <span>Private Scheduling Record:</span>
              </div>
              <p className="text-[11px] leading-relaxed">
                This request is saved only in SOS Healthcare for your personal planning and record-keeping. It has not been sent to or confirmed by the selected hospital.
              </p>
            </div>

            <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 rounded-xl text-xs text-red-900 dark:text-red-200 flex items-start gap-2">
              <ShieldAlertIcon className="h-4 w-4 shrink-0 text-red-600 mt-0.5" />
              <div className="text-[11px] leading-relaxed">
                <span className="font-bold">Urgent Medical Notice:</span> If you are experiencing chest pain, severe shortness of breath, acute trauma, or a life-threatening symptom, do not wait for an appointment. Dial 112 or use the SOS Emergency dispatch immediately.
              </div>
            </div>

            {errorMessage && (
              <div className="p-3 bg-red-100 text-red-800 rounded-lg text-xs font-semibold">
                {errorMessage}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase mb-1">
                  Consultation Type
                </label>
                <select
                  value={consultationType}
                  onChange={(e) => setConsultationType(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-800 text-xs border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="Specialist Consultation">Specialist Consultation</option>
                  <option value="Outpatient Consultation">Outpatient Consultation</option>
                  <option value="Follow-up Review">Follow-up Review</option>
                  <option value="Preventative Health Check">Preventative Health Check</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase mb-1">
                  Specialty / Department
                </label>
                <select
                  value={specialty}
                  onChange={(e) => setSpecialty(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-800 text-xs border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="General Medicine">General Medicine</option>
                  <option value="Cardiology">Cardiology</option>
                  <option value="Pulmonology">Pulmonology</option>
                  <option value="Neurology">Neurology</option>
                  <option value="Orthopedics">Orthopedics</option>
                  <option value="Pediatrics">Pediatrics</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase mb-1">
                  Preferred Date
                </label>
                <div className="relative">
                  <input
                    type="date"
                    min={new Date().toISOString().split("T")[0]}
                    value={preferredDate}
                    onChange={(e) => setPreferredDate(e.target.value)}
                    required
                    className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-800 text-xs border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white"
                  />
                  <CalendarIcon className="h-4 w-4 absolute right-3 top-2.5 text-gray-400 pointer-events-none" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase mb-1">
                  Preferred Time
                </label>
                <div className="relative">
                  <input
                    type="time"
                    value={preferredTime}
                    onChange={(e) => setPreferredTime(e.target.value)}
                    required
                    className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-800 text-xs border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white"
                  />
                  <ClockIcon className="h-4 w-4 absolute right-3 top-2.5 text-gray-400 pointer-events-none" />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase mb-1">
                Consultation Mode
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setConsultationMode("IN_PERSON")}
                  className={`py-2 px-3 text-xs font-medium rounded-lg border text-center transition-all ${
                    consultationMode === "IN_PERSON"
                      ? "border-blue-600 bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-bold"
                      : "border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
                  }`}
                >
                  In-Person Visit
                </button>
                <button
                  type="button"
                  onClick={() => setConsultationMode("VIRTUAL")}
                  className={`py-2 px-3 text-xs font-medium rounded-lg border text-center transition-all ${
                    consultationMode === "VIRTUAL"
                      ? "border-blue-600 bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-bold"
                      : "border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
                  }`}
                >
                  Virtual Consultation
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase mb-1">
                Scheduling Notes (Optional)
              </label>
              <textarea
                rows={2}
                placeholder="e.g. Seeking routine consultation after prescription renewal"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                maxLength={500}
                className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-800 text-xs border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white"
              />
            </div>

            <div className="pt-2 flex items-center justify-end gap-3">
              <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={loading}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="sm" disabled={loading}>
                {loading ? "Saving Request..." : "Save Appointment Request"}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
