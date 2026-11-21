"use client";

import { use, useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { MapView } from "@/components/MapView";
import {
  HospitalIcon,
  PhoneIcon,
  ClockIcon,
  BedIcon,
  NavigationIcon,
  StarIcon,
  ArrowLeftIcon,
  Share2Icon,
  AlertCircleIcon,
  ExternalLinkIcon,
  CheckCircle2Icon,
  HelpCircleIcon,
  ShieldCheckIcon,
} from "lucide-react";
import type { Hospital } from "@/types/app";

interface HospitalDetailProps {
  params: Promise<{ id: string }>;
}

export default function HospitalDetailPage({ params }: HospitalDetailProps) {
  const { id } = use(params);
  const router = useRouter();
  const [hospital, setHospital] = useState<Hospital | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const fetchHospital = async () => {
      try {
        const res = await fetch(`/api/hospitals/${encodeURIComponent(id)}`);
        if (cancelled) return;

        if (res.ok) {
          const data = await res.json();
          if (data.hospital) {
            setHospital(data.hospital);
            return;
          }
        }
        setNotFound(true);
      } catch (err) {
        console.warn("[HospitalDetail] fetch handled:", err);
        if (!cancelled) setNotFound(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void fetchHospital();

    return () => {
      cancelled = true;
    };
  }, [id]);

  const handleShare = useCallback(async () => {
    if (!hospital) return;

    const text = [
      `${hospital.name}`,
      hospital.address,
      hospital.phone ? `Phone: ${hospital.phone}` : null,
      hospital.website ? `Website: ${hospital.website}` : null,
    ]
      .filter(Boolean)
      .join("\n");

    if (navigator.share) {
      await navigator.share({ title: hospital.name, text }).catch(() => {});
      return;
    }

    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // Clipboard fallback
    }
  }, [hospital]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-600 border-t-transparent" />
      </div>
    );
  }

  if (notFound || !hospital) {
    return (
      <div className="max-w-lg mx-auto mt-12 text-center space-y-4">
        <AlertCircleIcon className="h-12 w-12 text-gray-400 mx-auto" />
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Hospital not found</h1>
        <p className="text-gray-600 dark:text-gray-400">
          This hospital record is unavailable or could not be verified in our directory.
        </p>
        <Button variant="primary" onClick={() => router.back()}>
          <ArrowLeftIcon className="h-4 w-4 mr-2" />
          Go back
        </Button>
      </div>
    );
  }

  const mapsUrl = `https://www.openstreetmap.org/directions?engine=fossgis_osrm_car&route=%3B${hospital.latitude}%2C${hospital.longitude}`;
  const isVerified = hospital.verification_status === "verified";
  const facilityTypeLabel =
    hospital.facility_type === "specialist_clinic"
      ? "Specialist Clinic"
      : hospital.facility_type === "nursing_home"
      ? "Nursing / Care Facility"
      : hospital.facility_type === "general_hospital"
      ? "General Hospital"
      : "Healthcare Facility";

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Back button */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white text-sm"
      >
        <ArrowLeftIcon className="h-4 w-4" />
        Back to Directory
      </button>

      {/* Header */}
      <div className="flex items-start justify-between gap-3 bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800">
        <div className="flex items-start gap-4">
          <div className="bg-blue-100 dark:bg-blue-900/50 rounded-xl p-3 shrink-0 mt-1">
            <HospitalIcon className="h-8 w-8 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{hospital.name}</h1>
              {isVerified ? (
                <span className="inline-flex items-center gap-1 text-xs px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 font-medium">
                  <ShieldCheckIcon className="h-3.5 w-3.5" /> Verified Hospital Record
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-xs px-2.5 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 font-medium">
                  <HelpCircleIcon className="h-3.5 w-3.5" /> Unverified Geographic Listing
                </span>
              )}
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-300">{hospital.address}</p>
            <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500 pt-1">
              <span>Category: <strong>{facilityTypeLabel}</strong></span>
              <span>•</span>
              <span>Source: <strong className="capitalize">{hospital.data_source || "Directory"}</strong></span>
              {hospital.last_verified && (
                <>
                  <span>•</span>
                  <span>Last verified: {hospital.last_verified}</span>
                </>
              )}
            </div>
          </div>
        </div>
        <Button variant="ghost" size="sm" onClick={() => void handleShare()}>
          <Share2Icon className="h-4 w-4 mr-1" />
          Share
        </Button>
      </div>

      {/* Action buttons */}
      <div className="flex flex-wrap gap-3">
        {hospital.phone ? (
          <a href={`tel:${hospital.phone}`}>
            <Button variant="outline">
              <PhoneIcon className="h-4 w-4 mr-2" />
              Call {hospital.phone}
            </Button>
          </a>
        ) : (
          <Button variant="outline" disabled title="No verified telephone number available">
            <PhoneIcon className="h-4 w-4 mr-2 opacity-50" />
            Telephone Not Listed
          </Button>
        )}

        <a href={mapsUrl} target="_blank" rel="noopener noreferrer">
          <Button variant="primary">
            <NavigationIcon className="h-4 w-4 mr-2" />
            Get OpenStreetMap Directions
          </Button>
        </a>

        {hospital.website ? (
          <a href={hospital.website} target="_blank" rel="noopener noreferrer">
            <Button variant="outline">
              <ExternalLinkIcon className="h-4 w-4 mr-2" />
              Official Website
            </Button>
          </a>
        ) : (
          <span className="inline-flex items-center text-xs text-gray-500 px-3 py-2 bg-gray-50 dark:bg-gray-800/60 rounded-lg border border-gray-200 dark:border-gray-700">
            Official website not available
          </span>
        )}
      </div>

      {/* Verification & Capability Banner */}
      {hospital.emergency_capability === "confirmed_24_7" ? (
        <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl p-4 flex items-start gap-3">
          <CheckCircle2Icon className="h-5 w-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-emerald-900 dark:text-emerald-200 text-sm">
              Confirmed 24/7 Emergency Department
            </h3>
            <p className="text-xs text-emerald-800 dark:text-emerald-300 mt-0.5">
              This facility is accredited for 24-hour trauma, resuscitation, and emergency patient triage.
            </p>
          </div>
        </div>
      ) : (
        <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-xl p-4 flex items-start gap-3">
          <AlertCircleIcon className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-amber-900 dark:text-amber-200 text-sm">
              Emergency Capability Not Confirmed
            </h3>
            <p className="text-xs text-amber-800 dark:text-amber-300 mt-0.5">
              This facility is listed as a healthcare location ({facilityTypeLabel}), but 24/7 emergency readiness is not verified. For acute life-threatening situations, dial national emergency dispatch (112 / 911).
            </p>
          </div>
        </div>
      )}

      {/* Facility Metrics (No fabricated data) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 p-4 text-center">
          <StarIcon className="h-5 w-5 text-yellow-400 mx-auto mb-1" />
          <p className="text-xl font-bold text-gray-900 dark:text-gray-100">
            {hospital.rating != null ? hospital.rating : "—"}
          </p>
          <p className="text-xs text-gray-500">Rating {hospital.rating == null ? "(Unrated)" : ""}</p>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 p-4 text-center">
          <BedIcon className="h-5 w-5 text-red-600 mx-auto mb-1" />
          <p className="text-xl font-bold text-gray-900 dark:text-gray-100">
            {hospital.icu_beds != null ? hospital.icu_beds : "Telemetry Unavailable"}
          </p>
          <p className="text-xs text-gray-500">ICU Beds</p>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 p-4 text-center">
          <BedIcon className="h-5 w-5 text-blue-600 mx-auto mb-1" />
          <p className="text-xl font-bold text-gray-900 dark:text-gray-100">
            {hospital.total_beds != null ? hospital.total_beds : "Telemetry Unavailable"}
          </p>
          <p className="text-xs text-gray-500">Total Capacity</p>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 p-4 text-center">
          <ClockIcon className="h-5 w-5 text-green-600 mx-auto mb-1" />
          <p className="text-xl font-bold text-gray-900 dark:text-gray-100">
            {hospital.emergency_capability === "confirmed_24_7" ? "24/7" : "Check Ahead"}
          </p>
          <p className="text-xs text-gray-500">Emergency Status</p>
        </div>
      </div>

      {/* Map with 2D / 3D toggle */}
      <div className="bg-white dark:bg-gray-900 p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 space-y-3">
        <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Geographic Location</h2>
        <MapView
          className="w-full h-80 rounded-xl shadow-sm"
          center={{ lat: hospital.latitude, lng: hospital.longitude }}
          zoom={15}
          markers={[
            {
              id: `hospital-${hospital.id}`,
              position: {
                lat: hospital.latitude,
                lng: hospital.longitude,
              },
              title: hospital.name,
              kind: "hospital",
              info: hospital.address,
            },
          ]}
        />
        <div className="flex justify-between items-center text-xs text-gray-500 px-1">
          <span>Coordinates: {hospital.latitude.toFixed(5)}, {hospital.longitude.toFixed(5)}</span>
          <a
            href={mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 dark:text-blue-400 hover:underline"
          >
            Open in OpenStreetMap ↗
          </a>
        </div>
      </div>
    </div>
  );
}
