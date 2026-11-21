"use client";

import { use, useEffect, useState } from "react";
import { ShieldAlertIcon, HeartIcon, ArrowLeftIcon, AlertCircleIcon, ActivityIcon } from "lucide-react";
import Link from "next/link";

interface PatientVitals {
  systolic: string | null;
  diastolic: string | null;
  heartRate: string | null;
  spO2: string | null;
  temperature: string | null;
  temperatureUnit: string;
  bloodGroup?: string | null;
  allergies: string | null;
  conditions: string | null;
  medications: string | null;
  recordedAt: string | null;
}

interface PatientProfileSummary {
  height: string | null;
  weight: string | null;
  bloodGroup: string | null;
  preArrivalSharingConsent: boolean;
}

export default function DoctorPatientChartPage({
  params,
}: {
  params: Promise<{ patientId: string }>;
}) {
  const resolvedParams = use(params);
  const patientId = resolvedParams.patientId;
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState<boolean | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [profile, setProfile] = useState<PatientProfileSummary | null>(null);
  const [vitals, setVitals] = useState<PatientVitals | null>(null);

  useEffect(() => {
    let isMounted = true;
    const fetchPatientData = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/doctor/patients/${patientId}`);
        if (!isMounted) return;

        if (res.ok) {
          const data = await res.json();
          setAuthorized(true);
          setProfile(data.profile);
          setVitals(data.vitals);
        } else if (res.status === 403) {
          setAuthorized(false);
          const err = await res.json().catch(() => ({}));
          setErrorMessage(err.error || "Clinical access denied.");
        } else if (res.status === 401) {
          setAuthorized(false);
          setErrorMessage("Authentication required to view clinical data.");
        } else {
          setAuthorized(false);
          setErrorMessage("Unable to retrieve patient clinical summary.");
        }
      } catch {
        if (isMounted) {
          setAuthorized(false);
          setErrorMessage("Network error verifying clinical relationship.");
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchPatientData();

    return () => {
      isMounted = false;
    };
  }, [patientId]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto py-12 text-center text-gray-500">
        Verifying authorized clinical relationship and loading patient records...
      </div>
    );
  }

  if (authorized === false) {
    return (
      <div className="max-w-xl mx-auto py-12 text-center space-y-4">
        <ShieldAlertIcon className="h-12 w-12 text-red-600 mx-auto" />
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">Clinical Access Denied</h1>
        <p className="text-sm text-gray-600 dark:text-gray-300">
          {errorMessage || "You do not have an active care relationship, assigned appointment, or emergency consultation authorization for this patient."}
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
        <p className="text-xs text-gray-500 mt-1">Patient Identifier: {patientId}</p>
        {profile?.preArrivalSharingConsent && (
          <span className="inline-block mt-2 text-xs bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 px-2.5 py-0.5 rounded-full font-medium">
            Pre-Arrival Sharing Consent Verified
          </span>
        )}
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow p-6 border border-gray-200 dark:border-gray-800 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <ActivityIcon className="h-4 w-4 text-teal-600" />
            Patient Clinical Measurements
          </h2>
          {vitals?.recordedAt && (
            <span className="text-xs text-gray-500">
              Recorded: {new Date(vitals.recordedAt).toLocaleString()}
            </span>
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
          <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-xl">
            <span className="text-xs text-gray-500">Blood Pressure</span>
            <p className="text-lg font-bold text-gray-900 dark:text-white mt-1">
              {vitals?.systolic && vitals?.diastolic ? `${vitals.systolic}/${vitals.diastolic} mmHg` : "Unknown"}
            </p>
          </div>
          <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-xl">
            <span className="text-xs text-gray-500">Heart Rate</span>
            <p className="text-lg font-bold text-gray-900 dark:text-white mt-1">
              {vitals?.heartRate ? `${vitals.heartRate} BPM` : "Unknown"}
            </p>
          </div>
          <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-xl">
            <span className="text-xs text-gray-500">SpO2 Oxygen</span>
            <p className="text-lg font-bold text-gray-900 dark:text-white mt-1">
              {vitals?.spO2 ? `${vitals.spO2}%` : "Unknown"}
            </p>
          </div>
          <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-xl">
            <span className="text-xs text-gray-500">Blood Group</span>
            <p className="text-lg font-bold text-red-600 mt-1">
              {profile?.bloodGroup || vitals?.bloodGroup || "Unknown"}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-xl text-center">
            <span className="text-xs text-gray-500">Body Temperature</span>
            <p className="text-lg font-bold text-gray-900 dark:text-white mt-1">
              {vitals?.temperature ? `${vitals.temperature} °${vitals.temperatureUnit === "CELSIUS" ? "C" : "F"}` : "Unknown"}
            </p>
          </div>
          <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-xl text-center">
            <span className="text-xs text-gray-500">Physical Metrics</span>
            <p className="text-lg font-bold text-gray-900 dark:text-white mt-1">
              {profile?.height && profile?.weight ? `${profile.height} cm / ${profile.weight} kg` : "Unknown"}
            </p>
          </div>
        </div>

        <div className="pt-4 border-t border-gray-100 dark:border-gray-800 space-y-3">
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase">Reported Allergies</p>
            <p className="text-sm font-medium text-gray-900 dark:text-white mt-0.5">
              {vitals?.allergies || "No allergies reported by patient"}
            </p>
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase">Medical Conditions</p>
            <p className="text-sm font-medium text-gray-900 dark:text-white mt-0.5">
              {vitals?.conditions || "No chronic medical conditions reported"}
            </p>
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase">Current Medications</p>
            <p className="text-sm font-medium text-gray-900 dark:text-white mt-0.5">
              {vitals?.medications || "No active medications recorded"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
