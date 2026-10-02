"use client";

import { HospitalIcon, PhoneIcon, CarIcon, ClockIcon } from "lucide-react";
import { Button } from "@/components/ui/Button";
import Link from "next/link";
import type { Hospital } from "@/types/app";

interface HospitalCardProps {
  hospital: Hospital;
}

export function HospitalCard({ hospital }: HospitalCardProps) {
  const formatDistance = (km?: number) => {
    if (!km && km !== 0) return null;
    if (km < 1) return `${Math.round(km * 1000)} m`;
    return `${km.toFixed(1)} km`;
  };

  const etaMinutes = hospital.distance_km
    ? Math.max(Math.round(hospital.distance_km * 1.5), 5)
    : 10;

  return (
    <div className="bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow p-4 border border-gray-100">
      <div className="flex items-start gap-3">
        <div className="bg-blue-100 rounded-lg p-2 mt-1 flex-shrink-0">
          <HospitalIcon className="h-5 w-5 text-blue-600" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <h3 className="font-semibold text-gray-900 line-clamp-1">
              {hospital.name}
            </h3>
            {hospital.rating && (
              <span className="text-xs bg-yellow-50 text-yellow-800 px-2 py-0.5 rounded-full flex items-center gap-1">
                ★ {hospital.rating}
              </span>
            )}
          </div>

          <p className="text-sm text-gray-600 mt-1 line-clamp-2">
            {hospital.address}
          </p>

          {/* Distance + ETA */}
          {hospital.distance_km !== undefined && (
            <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
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
          <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
            {hospital.icu_beds !== undefined && (
              <span>ICU Beds: {hospital.icu_beds}</span>
            )}
            {hospital.emergency_department && (
              <span className="text-green-600 font-medium">Open 24/7</span>
            )}
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <div className="mt-4 flex gap-2">{hospital.phone && (
            <a href={`tel:${hospital.phone}`} className="flex-1">
              <Button variant="outline" size="sm" className="w-full">
                <PhoneIcon className="h-4 w-4 mr-1" />
                Call
              </Button>
            </a>
          )}
        <Link href={`/hospitals/${hospital.id}`} className="flex-1">
          <Button variant="primary" size="sm" className="w-full">
            Details
          </Button>
        </Link>
      </div>
    </div>
  );
}
