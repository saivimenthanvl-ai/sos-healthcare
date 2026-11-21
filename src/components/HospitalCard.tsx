"use client";

import { HospitalIcon, PhoneIcon, CarIcon, ClockIcon, ShieldCheckIcon, HelpCircleIcon } from "lucide-react";
import { Button } from "@/components/ui/Button";
import Link from "next/link";
import type { Hospital } from "@/types/app";

interface HospitalCardProps {
  hospital: Hospital;
  onBook?: (hospital: Hospital) => void;
}

export function HospitalCard({ hospital, onBook }: HospitalCardProps) {
  const formatDistance = (km?: number) => {
    if (!km && km !== 0) return null;
    if (km < 1) return `${Math.round(km * 1000)} m`;
    return `${km.toFixed(1)} km`;
  };

  const etaMinutes = hospital.distance_km
    ? Math.max(Math.round(hospital.distance_km * 1.5), 5)
    : 10;

  const isVerified = hospital.verification_status === "verified";
  const facilityTypeLabel =
    hospital.facility_type === "specialist_clinic"
      ? "Specialist Clinic"
      : hospital.facility_type === "nursing_home"
      ? "Care Facility"
      : hospital.facility_type === "general_hospital"
      ? "General Hospital"
      : "Medical Facility";

  const directionsUrl = `https://www.openstreetmap.org/directions?engine=fossgis_osrm_car&route=%3B${hospital.latitude}%2C${hospital.longitude}`;

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl shadow-md hover:shadow-lg transition-shadow p-4 border border-gray-100 dark:border-gray-800 flex flex-col justify-between">
      <div className="flex items-start gap-3">
        <div className="bg-blue-100 dark:bg-blue-900/50 rounded-lg p-2 mt-1 shrink-0">
          <HospitalIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 line-clamp-1">
              {hospital.name}
            </h3>
            {hospital.rating && (
              <span className="text-xs bg-yellow-50 dark:bg-yellow-950/50 text-yellow-800 dark:text-yellow-400 px-2 py-0.5 rounded-full flex items-center gap-1 border border-yellow-200 dark:border-yellow-900 shrink-0">
                ★ {hospital.rating}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-xs font-medium text-gray-600 dark:text-gray-300">
              {facilityTypeLabel}
            </span>
            <span className="text-gray-400 text-xs">•</span>
            {isVerified ? (
              <span className="inline-flex items-center gap-0.5 text-[11px] text-emerald-700 dark:text-emerald-400 font-medium">
                <ShieldCheckIcon className="h-3 w-3" /> Verified
              </span>
            ) : (
              <span className="inline-flex items-center gap-0.5 text-[11px] text-amber-700 dark:text-amber-400 font-medium">
                <HelpCircleIcon className="h-3 w-3" /> Unverified
              </span>
            )}
          </div>

          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
            {hospital.address}
          </p>

          {/* Distance + Estimated Drive Time */}
          {hospital.distance_km !== undefined && (
            <div className="flex items-center gap-4 mt-2 text-xs text-gray-600 dark:text-gray-400">
              <span className="flex items-center gap-1">
                <CarIcon className="h-3.5 w-3.5" />
                {formatDistance(hospital.distance_km)} straight-line
              </span>
              <span className="flex items-center gap-1">
                <ClockIcon className="h-3.5 w-3.5" />
                Estimated ~{etaMinutes} min drive
              </span>
            </div>
          )}

          {/* Directory Department Info */}
          <div className="flex items-center gap-2 mt-2 text-xs">
            {hospital.emergency_capability === "confirmed_24_7" ? (
              <span className="text-emerald-700 dark:text-emerald-400 font-medium">
                Confirmed 24/7 Emergency
              </span>
            ) : (
              <span className="text-amber-700 dark:text-amber-400">
                Emergency Readiness Not Confirmed
              </span>
            )}
            <span className="text-gray-400">•</span>
            <span className="text-gray-500 text-[11px]">Directory Listing (Verify Details)</span>
          </div>
        </div>
      </div>

      {/* Action buttons with distinct actions */}
      <div className="mt-4 flex flex-wrap items-center gap-2 pt-2 border-t border-gray-100 dark:border-gray-800">
        <Link href={`/hospitals/${hospital.id}`} className="flex-1 min-w-20">
          <Button variant="primary" size="sm" className="w-full">
            View Details
          </Button>
        </Link>

        <a
          href={directionsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 min-w-20"
        >
          <Button variant="outline" size="sm" className="w-full">
            Directions
          </Button>
        </a>

        {hospital.phone && (
          <a href={`tel:${hospital.phone}`} className="shrink-0">
            <Button variant="outline" size="sm">
              <PhoneIcon className="h-4 w-4 mr-1" />
              Call
            </Button>
          </a>
        )}

        {onBook && (
          <Button
            variant="ghost"
            size="sm"
            className="text-xs text-blue-600 dark:text-blue-400"
            onClick={() => onBook(hospital)}
          >
            Book Appointment
          </Button>
        )}
      </div>
    </div>
  );
}
