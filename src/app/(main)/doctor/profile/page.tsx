"use client";

import { useAuth } from "@/contexts/AuthContext";
import { UserCheckIcon, ShieldIcon, BuildingIcon, ClockIcon } from "lucide-react";

export default function DoctorProfilePage() {
  const { profile } = useAuth();

  return (
    <div className="max-w-4xl mx-auto space-y-6 py-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow p-6 border border-gray-200 dark:border-gray-800">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
          <UserCheckIcon className="h-6 w-6 text-teal-600" />
          Doctor Professional Profile & Credentials
        </h1>
        <p className="text-sm text-gray-600 dark:text-gray-300">
          State Medical Council accreditation, hospital affiliations, and outpatient consultation settings.
        </p>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow p-6 border border-gray-200 dark:border-gray-800 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="text-xs text-gray-500 uppercase font-semibold">Practitioner Name</label>
            <p className="text-base font-bold text-gray-900 dark:text-white mt-0.5">
              {profile?.full_name || "Dr. Medical Practitioner"}
            </p>
          </div>

          <div>
            <label className="text-xs text-gray-500 uppercase font-semibold">Verification Status</label>
            <p className="text-sm font-bold text-emerald-600 mt-0.5 flex items-center gap-1.5">
              <ShieldIcon className="h-4 w-4" /> VERIFIED MEDICAL LICENSE
            </p>
          </div>

          <div>
            <label className="text-xs text-gray-500 uppercase font-semibold">Specialization</label>
            <p className="text-sm font-medium text-gray-900 dark:text-white mt-0.5">
              Emergency Medicine & Critical Care
            </p>
          </div>

          <div>
            <label className="text-xs text-gray-500 uppercase font-semibold">Hospital Affiliation</label>
            <p className="text-sm font-medium text-gray-900 dark:text-white mt-0.5 flex items-center gap-1.5">
              <BuildingIcon className="h-4 w-4 text-gray-400" /> City Emergency Healthcare Network
            </p>
          </div>

          <div>
            <label className="text-xs text-gray-500 uppercase font-semibold">Consultation Hours</label>
            <p className="text-sm font-medium text-gray-900 dark:text-white mt-0.5 flex items-center gap-1.5">
              <ClockIcon className="h-4 w-4 text-gray-400" /> Mon - Fri: 09:00 - 17:00 IST
            </p>
          </div>

          <div>
            <label className="text-xs text-gray-500 uppercase font-semibold">Professional Email</label>
            <p className="text-sm font-mono text-gray-700 dark:text-gray-300 mt-0.5">
              {profile?.email || "doctor@soshealthcare.org"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
