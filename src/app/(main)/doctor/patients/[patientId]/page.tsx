"use client";

import { use, useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { ShieldAlertIcon, HeartIcon, ArrowLeftIcon, UserIcon } from "lucide-react";
import Link from "next/link";

export default function DoctorPatientChartPage({
  params,
}: {
  params: Promise<{ patientId: string }>;
}) {
  const resolvedParams = use(params);
  const patientId = resolvedParams.patientId;
  const { user, profile } = useAuth();
  const [authorized, setAuthorized] = useState<boolean | null>(null);

  useEffect(() => {
    // Check if appointment exists between this doctor and patient
    const verifyRelationship = async () => {
      try {
        const res = await fetch("/api/appointments");
        if (res.ok) {
          const data = await res.json();
          const hasRelationship = data.appointments?.some(
            (a: any) => a.patient_id === patientId
          );
          setAuthorized(hasRelationship ?? false);
        } else {
          setAuthorized(false);
        }
      } catch {
        setAuthorized(false);
      }
    };

    verifyRelationship();
  }, [patientId]);

  if (authorized === null) {
    return (
      <div className="max-w-4xl mx-auto py-12 text-center text-gray-500">
        Verifying authorized clinical relationship...
      </div>
    );
  }

  if (authorized === false) {
    return (
      <div className="max-w-xl mx-auto py-12 text-center space-y-4">
        <ShieldAlertIcon className="h-12 w-12 text-red-600 mx-auto" />
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">Clinical Access Denied</h1>
        <p className="text-sm text-gray-600 dark:text-gray-300">
          You do not have an active care relationship, assigned appointment, or emergency consultation authorization for this patient.
        </p>
        <Link href="/doctor/dashboard" className="inline-block text-sm font-semibold text-blue-600 hover:underline">
          Return to Doctor Console
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 py-4">
      <Link href="/doctor/dashboard" className="inline-flex items-center text-sm font-semibold text-blue-600 hover:underline">
        <ArrowLeftIcon className="h-4 w-4 mr-1" /> Back to Dashboard
      </Link>

      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow p-6 border border-gray-200 dark:border-gray-800">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <HeartIcon className="h-6 w-6 text-pink-600" />
          Patient Clinical Summary (Authorized Care Relationship)
        </h1>
        <p className="text-xs text-gray-500 mt-1">Patient ID: {patientId}</p>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow p-6 border border-gray-200 dark:border-gray-800 space-y-4">
        <h2 className="text-base font-bold text-gray-900 dark:text-white">Pre-Arrival Triage Vitals</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
          <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-xl">
            <span className="text-xs text-gray-500">Blood Pressure</span>
            <p className="text-lg font-bold text-gray-900 dark:text-white mt-1">120/80 mmHg</p>
          </div>
          <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-xl">
            <span className="text-xs text-gray-500">Heart Rate</span>
            <p className="text-lg font-bold text-gray-900 dark:text-white mt-1">74 BPM</p>
          </div>
          <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-xl">
            <span className="text-xs text-gray-500">SpO2 Oxygen</span>
            <p className="text-lg font-bold text-gray-900 dark:text-white mt-1">98%</p>
          </div>
          <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-xl">
            <span className="text-xs text-gray-500">Blood Group</span>
            <p className="text-lg font-bold text-red-600 mt-1">O+ (Positive)</p>
          </div>
        </div>

        <div className="pt-4 border-t border-gray-100 dark:border-gray-800 space-y-2">
          <p className="text-xs font-semibold text-gray-500 uppercase">Reported Allergies</p>
          <p className="text-sm font-medium text-gray-900 dark:text-white">None reported by patient</p>
        </div>
      </div>
    </div>
  );
}
