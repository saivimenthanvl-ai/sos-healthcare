"use client";

import { HospitalIcon, PhoneIcon, CarIcon, ClockIcon } from "lucide-react";
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

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl shadow-md hover:shadow-lg transition-shadow p-4 border border-gray-100 dark:border-gray-800 flex flex-col justify-between">
      <div className="flex items-start gap-3">
        <div className="bg-blue-100 dark:bg-blue-900/50 rounded-lg p-2 mt-1 flex-shrink-0">
          <HospitalIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 line-clamp-1">
              {hospital.name}
            </h3>
            {hospital.rating && (
              <span className="text-xs bg-yellow-50 dark:bg-yellow-950/50 text-yellow-800 dark:text-yellow-400 px-2 py-0.5 rounded-full flex items-center gap-1 border border-yellow-200 dark:border-yellow-900">
                ★ {hospital.rating}
              </span>
            )}
          </div>

          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
            {hospital.address}
          </p>

          {/* Distance + ETA */}
          {hospital.distance_km !== undefined && (
            <div className="flex items-center gap-4 mt-2 text-sm text-gray-600 dark:text-gray-400">
              <span className="flex items-center gap-1">
                <CarIcon className="h-4 w-4" />
                {formatDistance(hospital.distance_km)}
              </span>
              <span className="flex items-center gap-1">
                <ClockIcon className="h-4 w-4" />
                ~{etaMinutes} min ETA
              </span>
            </div>
          )}

          {/* Beds + Emergency */}
          <div className="flex items-center gap-4 mt-2 text-sm text-gray-600 dark:text-gray-400">
            {hospital.icu_beds !== undefined && (
              <span>ICU Beds: <strong className="text-gray-900 dark:text-gray-100">{hospital.icu_beds}</strong></span>
            )}
            {hospital.emergency_department && (
              <span className="text-green-600 dark:text-green-400 font-medium">Open 24/7</span>
            )}
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <div className="mt-4 flex flex-wrap gap-2">
        {hospital.phone && (
          <a href={`tel:${hospital.phone}`} className="flex-1 min-w-[70px]">
            <Button variant="outline" size="sm" className="w-full">
              <PhoneIcon className="h-4 w-4 mr-1" />
              Call
            </Button>
          </a>
        )}
        <Link href={`/hospitals/${hospital.id}`} className="flex-1 min-w-[70px]">
          <Button variant="outline" size="sm" className="w-full">
            Details
          </Button>
        </Link>
        <Button
          variant="danger"
          size="sm"
          className="flex-1 min-w-[110px]"
          onClick={() => onBook?.(hospital)}
        >
          Book Custom
        </Button>
      </div>
    </div>
  );
}
