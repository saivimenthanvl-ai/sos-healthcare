"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import {
  CalendarIcon,
  CheckCircleIcon,
  AlertCircleIcon,
  ClockIcon,
  StethoscopeIcon,
  BuildingIcon,
  ShieldAlertIcon,
  EditIcon,
  XCircleIcon,
} from "lucide-react";
import { Button } from "@/components/ui/Button";

interface Doctor {
  id: string;
  name: string;
  specialty: string;
  hospital: string;
  experienceYears?: number;
  consultationHours?: string;
  availableSlots: string[];
}

interface Appointment {
  id: string;
  specialty: string;
  status: string;
  hospital_name: string | null;
  starts_at: string;
}

interface AppointmentRequest {
  id: string;
  hospital_name_snapshot: string;
  specialty: string | null;
  consultation_type: string;
  consultation_mode: string;
  preferred_starts_at: string;
  notes: string | null;
  status: "PLANNED" | "COMPLETED" | "CANCELLED";
  cancelled_at: string | null;
}

export default function AppointmentsPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<"requests" | "verified">("requests");

  // Verified Specialists State
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [selectedDate, setSelectedDate] = useState(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split("T")[0];
  });
  const [selectedSlot, setSelectedSlot] = useState<string>("");
  const [doctorReason, setDoctorReason] = useState("");
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingMessage, setBookingMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [myAppointments, setMyAppointments] = useState<Appointment[]>([]);

  // Private Custom Requests State
  const [customRequests, setCustomRequests] = useState<AppointmentRequest[]>([]);
  const [customRequestsLoading, setCustomRequestsLoading] = useState(true);
  const [reschedulingId, setReschedulingId] = useState<string | null>(null);
  const [rescheduleDate, setRescheduleDate] = useState("");
  const [rescheduleTime, setRescheduleTime] = useState("");
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  // Fetch verified doctors list
  useEffect(() => {
    let active = true;
    fetch("/api/doctors")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (active && data?.doctors?.length > 0) {
          setDoctors(data.doctors);
          setSelectedDoctor(data.doctors[0]);
          setSelectedSlot(data.doctors[0].availableSlots[0]);
        }
      })
      .catch((err) => console.warn("Failed to load doctors:", err));

    return () => {
      active = false;
    };
  }, []);

  const fetchAppointments = useCallback(async () => {
    if (!user) return;
    try {
      const res = await fetch("/api/appointments");
      if (res.ok) {
        const data = await res.json();
        setMyAppointments(data.appointments || []);
      }
    } catch (err) {
      console.warn("Failed to fetch appointments:", err);
    }
  }, [user]);

  const fetchCustomRequests = useCallback(async () => {
    if (!user) return;
    setCustomRequestsLoading(true);
    try {
      const res = await fetch("/api/appointment-requests");
      if (res.ok) {
        const data = await res.json();
        setCustomRequests(data.requests || []);
      }
    } catch (err) {
      console.warn("Failed to fetch appointment requests:", err);
    } finally {
      setCustomRequestsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    let active = true;
    if (!user) return;

    fetch("/api/appointments")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (active && data?.appointments) {
          setMyAppointments(data.appointments);
        }
      })
      .catch((err) => console.warn("Failed to fetch appointments:", err));

    fetch("/api/appointment-requests")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (active && data?.requests) {
          setCustomRequests(data.requests);
        }
      })
      .catch((err) => console.warn("Failed to fetch appointment requests:", err))
      .finally(() => {
        if (active) setCustomRequestsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [user]);

  // Handle Verified Specialist Booking
  const handleBookSpecialist = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDoctor || !selectedSlot) return;

    setBookingLoading(true);
    setBookingMessage(null);
    setErrorMessage(null);

    try {
      const startsAt = new Date(`${selectedDate} ${selectedSlot}`).toISOString();
      const endsAt = new Date(new Date(startsAt).getTime() + 30 * 60000).toISOString();

      const res = await fetch("/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          doctorId: selectedDoctor.id,
          hospitalName: selectedDoctor.hospital,
          specialty: selectedDoctor.specialty,
          startsAt,
          endsAt,
          reason: doctorReason,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorMessage(data.error || "Failed to book appointment");
      } else {
        setBookingMessage("Specialist consultation reserved successfully!");
        setDoctorReason("");
        fetchAppointments();
      }
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : "An unexpected error occurred");
    } finally {
      setBookingLoading(false);
    }
  };

  // Handle Cancel Custom Request
  const handleCancelCustomRequest = async (id: string) => {
    if (!confirm("Are you sure you want to cancel this custom appointment request?")) return;

    setActionLoadingId(id);
    try {
      const res = await fetch(`/api/appointment-requests/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "CANCEL" }),
      });

      if (res.ok) {
        fetchCustomRequests();
      } else {
        const data = await res.json();
        alert(data.error || "Failed to cancel request");
      }
    } catch (err) {
      console.error(err);
      alert("Error cancelling request");
    } finally {
      setActionLoadingId(null);
    }
  };

  // Handle Reschedule Custom Request
  const handleSaveReschedule = async (id: string) => {
    if (!rescheduleDate || !rescheduleTime) {
      alert("Please select both a new date and time");
      return;
    }

    setActionLoadingId(id);
    try {
      const preferredStartsAt = new Date(`${rescheduleDate}T${rescheduleTime}:00`).toISOString();

      const res = await fetch(`/api/appointment-requests/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "RESCHEDULE",
          preferredStartsAt,
        }),
      });

      if (res.ok) {
        setReschedulingId(null);
        fetchCustomRequests();
      } else {
        const data = await res.json();
        alert(data.error || "Failed to reschedule request");
      }
    } catch (err) {
      console.error(err);
      alert("Error rescheduling request");
    } finally {
      setActionLoadingId(null);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 py-4">
      {/* Page Header */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow p-6 border border-gray-200 dark:border-gray-800">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
          <CalendarIcon className="h-6 w-6 text-blue-600" />
          Appointments & Scheduling Center
        </h1>
        <p className="text-sm text-gray-600 dark:text-gray-300">
          Manage your private custom appointment requests and scheduled clinical consultations.
        </p>

        {/* Navigation Tabs */}
        <div className="flex gap-3 mt-6 border-b border-gray-200 dark:border-gray-800 pb-1">
          <button
            onClick={() => setActiveTab("requests")}
            className={`pb-2.5 px-3 text-sm font-bold flex items-center gap-2 transition-colors border-b-2 ${
              activeTab === "requests"
                ? "border-blue-600 text-blue-600 dark:text-blue-400"
                : "border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
            }`}
          >
            <BuildingIcon className="w-4 h-4" />
            Custom Appointment Requests ({customRequests.filter((r) => r.status !== "CANCELLED").length})
          </button>
          <button
            onClick={() => setActiveTab("verified")}
            className={`pb-2.5 px-3 text-sm font-bold flex items-center gap-2 transition-colors border-b-2 ${
              activeTab === "verified"
                ? "border-blue-600 text-blue-600 dark:text-blue-400"
                : "border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
            }`}
          >
            <StethoscopeIcon className="w-4 h-4" />
            Specialist Consultations ({myAppointments.filter((a) => a.status !== "CANCELLED").length})
          </button>
        </div>
      </div>

      {/* Safety Notice */}
      <div className="p-4 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 rounded-xl text-xs text-red-900 dark:text-red-200 flex items-start gap-3">
        <ShieldAlertIcon className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
        <div className="leading-relaxed">
          <span className="font-bold">Medical Safety Notice:</span> Appointment requests are for non-emergency scheduling planning. If you or a loved one is experiencing severe chest distress, stroke symptoms, acute bleeding, or unconsciousness, do not wait for an appointment. Dial 112 or trigger one-tap emergency SOS immediately.
        </div>
      </div>

      {activeTab === "requests" && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow p-6 border border-gray-200 dark:border-gray-800">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">Your Planned Appointment Requests</h2>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  Private scheduling records saved securely within SOS Healthcare.
                </p>
              </div>
              <Link href="/hospitals" className="inline-block">
                <Button variant="danger" size="sm">
                  + New Custom Booking
                </Button>
              </Link>
            </div>

            {/* Privacy Disclaimer Banner */}
            <div className="mb-6 p-3 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 rounded-xl text-xs text-blue-900 dark:text-blue-200">
              <span className="font-bold">Privacy Guarantee:</span> Your custom appointment requests are saved strictly inside SOS Healthcare for your planning. They are never sent to external hospital EMRs or third-party clinic databases.
            </div>

            {customRequestsLoading ? (
              <div className="py-8 text-center text-sm text-gray-500">Loading your private appointment requests...</div>
            ) : customRequests.length === 0 ? (
              <div className="py-12 text-center space-y-3">
                <BuildingIcon className="h-10 w-10 text-gray-400 mx-auto" />
                <p className="text-sm text-gray-500">You have no custom appointment requests planned.</p>
                <Link href="/hospitals" className="inline-block pt-1">
                  <Button variant="outline" size="sm">
                    Browse Nearby Hospitals to Plan
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {customRequests.map((req) => (
                  <div
                    key={req.id}
                    className="p-5 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/40 space-y-3 flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h3 className="font-bold text-gray-900 dark:text-white text-base">
                            {req.hospital_name_snapshot}
                          </h3>
                          <p className="text-xs text-blue-600 dark:text-blue-400 font-medium mt-0.5">
                            {req.consultation_type} • {req.specialty}
                          </p>
                        </div>
                        <span
                          className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${
                            req.status === "PLANNED"
                              ? "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border border-blue-200 dark:border-blue-800"
                              : req.status === "COMPLETED"
                              ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                              : "bg-gray-200 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
                          }`}
                        >
                          {req.status}
                        </span>
                      </div>

                      <div className="mt-3 text-xs text-gray-700 dark:text-gray-300 space-y-1">
                        <div className="flex items-center gap-1.5">
                          <CalendarIcon className="w-3.5 h-3.5 text-gray-500 shrink-0" />
                          <span>
                            {new Date(req.preferred_starts_at).toLocaleDateString(undefined, {
                              weekday: "short",
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            })}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <ClockIcon className="w-3.5 h-3.5 text-gray-500 shrink-0" />
                          <span>
                            {new Date(req.preferred_starts_at).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })} ({req.consultation_mode === "VIRTUAL" ? "Virtual Consultation" : "In-Person Visit"})
                          </span>
                        </div>
                        {req.notes && (
                          <p className="mt-2 text-[11px] text-gray-500 dark:text-gray-400 italic bg-white dark:bg-gray-900 p-2 rounded-lg border border-gray-100 dark:border-gray-800">
                            &ldquo;{req.notes}&rdquo;
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Rescheduling Form Drawer */}
                    {reschedulingId === req.id && (
                      <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700 space-y-2 bg-white dark:bg-gray-900 p-3 rounded-lg">
                        <p className="text-xs font-bold text-gray-800 dark:text-gray-200">Reschedule Appointment</p>
                        <div className="grid grid-cols-2 gap-2">
                          <input
                            type="date"
                            min={new Date().toISOString().split("T")[0]}
                            value={rescheduleDate}
                            onChange={(e) => setRescheduleDate(e.target.value)}
                            className="px-2 py-1.5 border rounded text-xs bg-white dark:bg-gray-800 text-gray-900 dark:text-white border-gray-300 dark:border-gray-700"
                          />
                          <input
                            type="time"
                            value={rescheduleTime}
                            onChange={(e) => setRescheduleTime(e.target.value)}
                            className="px-2 py-1.5 border rounded text-xs bg-white dark:bg-gray-800 text-gray-900 dark:text-white border-gray-300 dark:border-gray-700"
                          />
                        </div>
                        <div className="flex justify-end gap-2 pt-1">
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-xs"
                            onClick={() => setReschedulingId(null)}
                          >
                            Cancel
                          </Button>
                          <Button
                            variant="primary"
                            size="sm"
                            className="text-xs"
                            disabled={actionLoadingId === req.id}
                            onClick={() => handleSaveReschedule(req.id)}
                          >
                            {actionLoadingId === req.id ? "Saving..." : "Save New Date"}
                          </Button>
                        </div>
                      </div>
                    )}

                    {/* Action Bar */}
                    {req.status === "PLANNED" && reschedulingId !== req.id && (
                      <div className="pt-3 border-t border-gray-200 dark:border-gray-700/60 flex items-center justify-between gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-xs py-1 px-2.5 h-8 flex items-center gap-1 text-gray-700 dark:text-gray-300"
                          onClick={() => {
                            setReschedulingId(req.id);
                            const d = new Date(req.preferred_starts_at);
                            setRescheduleDate(d.toISOString().split("T")[0]);
                            setRescheduleTime(d.toTimeString().slice(0, 5));
                          }}
                        >
                          <EditIcon className="w-3.5 h-3.5" />
                          Reschedule
                        </Button>
                        <Button
                          variant="danger"
                          size="sm"
                          className="text-xs py-1 px-2.5 h-8 flex items-center gap-1"
                          disabled={actionLoadingId === req.id}
                          onClick={() => handleCancelCustomRequest(req.id)}
                        >
                          <XCircleIcon className="w-3.5 h-3.5" />
                          {actionLoadingId === req.id ? "Cancelling..." : "Cancel Request"}
                        </Button>
                      </div>
                    )}

                    {req.status === "CANCELLED" && (
                      <div className="pt-2 border-t border-gray-200 dark:border-gray-700/60 text-[11px] text-gray-400 italic">
                        Cancelled on {req.cancelled_at ? new Date(req.cancelled_at).toLocaleDateString() : "Record preserved"}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === "verified" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Booking Form */}
          <div className="lg:col-span-2 bg-white dark:bg-gray-900 rounded-2xl shadow p-6 border border-gray-200 dark:border-gray-800">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Book Specialist Consultation</h2>

            {bookingMessage && (
              <div className="mb-4 p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 rounded-xl text-sm font-medium flex items-center gap-2">
                <CheckCircleIcon className="h-4 w-4" /> {bookingMessage}
              </div>
            )}

            {errorMessage && (
              <div className="mb-4 p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200 rounded-xl text-sm font-medium flex items-center gap-2">
                <AlertCircleIcon className="h-4 w-4" /> {errorMessage}
              </div>
            )}

            <form onSubmit={handleBookSpecialist} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase mb-1">
                  Select Verified Specialist & Hospital
                </label>
                {doctors.length === 0 ? (
                  <div className="text-sm text-gray-500 py-2">Loading verified clinical specialists...</div>
                ) : (
                  <select
                    value={selectedDoctor?.id || ""}
                    onChange={(e) => {
                      const doc = doctors.find((d) => d.id === e.target.value);
                      if (doc) {
                        setSelectedDoctor(doc);
                        setSelectedSlot(doc.availableSlots[0]);
                      }
                    }}
                    className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-800 text-sm border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white"
                  >
                    {doctors.map((doc) => (
                      <option key={doc.id} value={doc.id}>
                        {doc.name} — {doc.specialty} ({doc.hospital})
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {selectedDoctor && (
                <div className="p-3 bg-blue-50/50 dark:bg-blue-950/30 rounded-xl border border-blue-100 dark:border-blue-900/50 text-xs text-gray-700 dark:text-gray-300 flex items-center gap-4">
                  <div className="flex items-center gap-1.5 font-medium">
                    <StethoscopeIcon className="w-4 h-4 text-blue-600" />
                    <span>{selectedDoctor.specialty}</span>
                  </div>
                  {selectedDoctor.consultationHours && (
                    <div className="flex items-center gap-1.5 font-medium">
                      <ClockIcon className="w-4 h-4 text-blue-600" />
                      <span>{selectedDoctor.consultationHours}</span>
                    </div>
                  )}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase mb-1">
                    Appointment Date
                  </label>
                  <input
                    type="date"
                    min={new Date().toISOString().split("T")[0]}
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-800 text-sm border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase mb-1">
                    Available Slot
                  </label>
                  <select
                    value={selectedSlot}
                    onChange={(e) => setSelectedSlot(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-800 text-sm border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white"
                  >
                    {selectedDoctor?.availableSlots.map((slot) => (
                      <option key={slot} value={slot}>
                        {slot}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase mb-1">
                  Reason for Consultation (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Chest pain follow-up, post-emergency triage check"
                  value={doctorReason}
                  onChange={(e) => setDoctorReason(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-800 text-sm border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white"
                />
              </div>

              <Button
                type="submit"
                disabled={bookingLoading || !selectedDoctor}
                variant="primary"
                className="w-full"
              >
                {bookingLoading ? "Reserving Slot..." : "Confirm Verified Reservation"}
              </Button>
            </form>
          </div>

          {/* Existing Reservations Sidebar */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow p-6 border border-gray-200 dark:border-gray-800 space-y-4">
            <h2 className="text-base font-bold text-gray-900 dark:text-white">Assigned Consultations</h2>

            {myAppointments.length === 0 ? (
              <p className="text-xs text-gray-500">No scheduled consultations found.</p>
            ) : (
              <div className="space-y-3">
                {myAppointments.map((app) => (
                  <div key={app.id} className="p-3 bg-gray-50 dark:bg-gray-800/60 rounded-xl text-xs space-y-1 border border-gray-100 dark:border-gray-700">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-gray-900 dark:text-white">{app.specialty}</span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        app.status === "CANCELLED" ? "bg-red-100 text-red-700" : "bg-emerald-100 text-emerald-700"
                      }`}>
                        {app.status}
                      </span>
                    </div>
                    <p className="text-gray-500">{app.hospital_name || "SOS Network Specialist"}</p>
                    <p className="text-gray-700 dark:text-gray-300 font-mono">
                      {new Date(app.starts_at).toLocaleDateString()} at {new Date(app.starts_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
