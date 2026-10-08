"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { UserCheckIcon, CalendarIcon, UsersIcon, ClockIcon, AlertCircleIcon } from "lucide-react";
import Link from "next/link";

export default function DoctorDashboardPage() {
  const { user, profile } = useAuth();
  const [appointments, setAppointments] = useState<Array<{ id: string; specialty: string; reason: string | null; starts_at: string; status: string; patient_id: string }>>([]);

  useEffect(() => {
    const fetchAssigned = async () => {
      try {
        const res = await fetch("/api/appointments");
        if (res.ok) {
          const data = await res.json();
          setAppointments(data.appointments || []);
        }
      } catch (e) {
        console.warn(e);
      }
    };
    fetchAssigned();
  }, []);

  return (
    <div className="max-w-6xl mx-auto space-y-6 py-4">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-teal-700 to-blue-700 rounded-2xl p-6 sm:p-8 text-white shadow-lg">
        <h1 className="text-2xl sm:text-3xl font-bold mb-2">
          Welcome, {profile?.full_name || "Doctor"}
        </h1>
        <p className="text-teal-100 text-sm max-w-2xl">
          Clinical Operations Console. Manage assigned emergency follow-ups, verified outpatient schedules, and authorized patient medical charts.
        </p>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-gray-900 rounded-2xl p-5 border border-gray-200 dark:border-gray-800 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-50 dark:bg-blue-950/60 rounded-xl text-blue-600">
              <CalendarIcon className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase font-bold">Upcoming Consultations</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{appointments.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-2xl p-5 border border-gray-200 dark:border-gray-800 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/60 rounded-xl text-emerald-600">
              <UserCheckIcon className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase font-bold">Licensure Status</p>
              <p className="text-xl font-bold text-emerald-600">Verified Practitioner</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-2xl p-5 border border-gray-200 dark:border-gray-800 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-indigo-50 dark:bg-indigo-950/60 rounded-xl text-indigo-600">
              <ClockIcon className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase font-bold">Duty Hours</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">09:00 - 17:00 IST</p>
            </div>
          </div>
        </div>
      </div>

      {/* Assigned Patient Appointments */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow p-6 border border-gray-200 dark:border-gray-800">
        <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
          Assigned Patient Schedule
        </h2>

        {appointments.length === 0 ? (
          <p className="text-sm text-gray-500 py-6 text-center">No patient appointments assigned today.</p>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {appointments.map((a) => (
              <div key={a.id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white text-sm">
                    Consultation: {a.specialty}
                  </p>
                  <p className="text-xs text-gray-500">Reason: {a.reason || "Outpatient review"}</p>
                  <p className="text-xs text-gray-400 font-mono mt-1">
                    Scheduled: {new Date(a.starts_at).toLocaleString()}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-blue-100 text-blue-700">
                    {a.status}
                  </span>
                  <Link
                    href={`/doctor/patients/${a.patient_id}`}
                    className="text-xs px-3 py-1.5 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 rounded-lg font-semibold hover:opacity-90 transition"
                  >
                    View Chart
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
