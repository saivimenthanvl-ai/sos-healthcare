"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { CalendarIcon, ClockIcon, UserIcon, HospitalIcon, CheckCircleIcon, XCircleIcon, AlertCircleIcon } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface Doctor {
  id: string;
  name: string;
  specialty: string;
  hospital: string;
  availableSlots: string[];
}

const mockDoctors: Doctor[] = [
  {
    id: "doc-1",
    name: "Dr. Sarah Chen, MD",
    specialty: "Cardiology & Emergency Triage",
    hospital: "City Central Medical Center",
    availableSlots: ["09:00 AM", "11:30 AM", "02:00 PM", "04:30 PM"],
  },
  {
    id: "doc-2",
    name: "Dr. Rajesh Sharma, MBBS",
    specialty: "Trauma Care & General Medicine",
    hospital: "Apex Specialty Hospital",
    availableSlots: ["10:00 AM", "01:00 PM", "03:30 PM"],
  },
  {
    id: "doc-3",
    name: "Dr. Elena Rostova, MD",
    specialty: "Pulmonology & Critical Care",
    hospital: "Metro General Hospital",
    availableSlots: ["08:30 AM", "11:00 AM", "02:30 PM"],
  },
];

export default function AppointmentsPage() {
  const { user } = useAuth();
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor>(mockDoctors[0]);
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [selectedSlot, setSelectedSlot] = useState(mockDoctors[0].availableSlots[0]);
  const [reason, setReason] = useState("");
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingMessage, setBookingMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [myAppointments, setMyAppointments] = useState<any[]>([]);

  const fetchAppointments = async () => {
    try {
      const res = await fetch("/api/appointments");
      if (res.ok) {
        const data = await res.json();
        setMyAppointments(data.appointments || []);
      }
    } catch (err) {
      console.warn("Failed to fetch appointments:", err);
    }
  };

  useEffect(() => {
    if (user) {
      fetchAppointments();
    }
  }, [user]);

  const handleBook = async (e: React.FormEvent) => {
    e.preventDefault();
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
          reason,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorMessage(data.error || "Failed to book appointment");
      } else {
        setBookingMessage("Appointment confirmed successfully!");
        setReason("");
        fetchAppointments();
      }
    } catch (err: any) {
      setErrorMessage(err.message || "An unexpected error occurred");
    } finally {
      setBookingLoading(false);
    }
  };

  const handleCancel = async (id: string) => {
    if (!confirm("Are you sure you want to cancel this appointment?")) return;

    try {
      const res = await fetch(`/api/appointments/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "CANCELLED" }),
      });
      if (res.ok) {
        fetchAppointments();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 py-4">
      {/* Header */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow p-6 border border-gray-200 dark:border-gray-800">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
          <CalendarIcon className="h-6 w-6 text-blue-600" />
          Outpatient & Specialist Appointment Booking
        </h1>
        <p className="text-sm text-gray-600 dark:text-gray-300">
          Book verified consultations with certified physicians and hospital triage specialists without delay.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Booking Form */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-900 rounded-2xl shadow p-6 border border-gray-200 dark:border-gray-800">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Book New Consultation</h2>

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

          <form onSubmit={handleBook} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase mb-1">
                Select Specialist & Hospital
              </label>
              <select
                value={selectedDoctor.id}
                onChange={(e) => {
                  const doc = mockDoctors.find((d) => d.id === e.target.value);
                  if (doc) {
                    setSelectedDoctor(doc);
                    setSelectedSlot(doc.availableSlots[0]);
                  }
                }}
                className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-800 text-sm border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white"
              >
                {mockDoctors.map((doc) => (
                  <option key={doc.id} value={doc.id}>
                    {doc.name} — {doc.specialty} ({doc.hospital})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase mb-1">
                  Appointment Date
                </label>
                <input
                  type="date"
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
                  {selectedDoctor.availableSlots.map((slot) => (
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
                placeholder="e.g. Chest pain follow-up, general health check"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-800 text-sm border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white"
              />
            </div>

            <Button type="submit" disabled={bookingLoading} variant="primary" className="w-full">
              {bookingLoading ? "Reserving Slot..." : "Confirm Verified Reservation"}
            </Button>
          </form>
        </div>

        {/* Existing Reservations Sidebar */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow p-6 border border-gray-200 dark:border-gray-800 space-y-4">
          <h2 className="text-base font-bold text-gray-900 dark:text-white">Your Appointments</h2>

          {myAppointments.length === 0 ? (
            <p className="text-xs text-gray-500">No appointments scheduled.</p>
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
                  <p className="text-gray-500">{app.hospital_name}</p>
                  <p className="text-gray-700 dark:text-gray-300 font-mono">
                    {new Date(app.starts_at).toLocaleDateString()} at {new Date(app.starts_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                  {app.status !== "CANCELLED" && (
                    <button
                      onClick={() => handleCancel(app.id)}
                      className="mt-1 text-red-600 hover:underline text-[11px] font-semibold"
                    >
                      Cancel Appointment
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
