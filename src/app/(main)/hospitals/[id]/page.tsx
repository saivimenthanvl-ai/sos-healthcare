"use client";

import { use, useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
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
        const { data, error } = await supabase
          .from("hospitals")
          .select("*")
          .eq("id", id)
          .single();

        if (cancelled) return;

        if (error || !data) {
          setNotFound(true);
        } else {
          setHospital(data as Hospital);
        }
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
      // Clipboard can be blocked; the share sheet is the fallback.
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
        <h1 className="text-2xl font-bold text-gray-900">Hospital not found</h1>
        <p className="text-gray-600">
          That hospital is not in our directory.
        </p>
        <Button variant="primary" onClick={() => router.back()}>
          <ArrowLeftIcon className="h-4 w-4 mr-2" />
          Go back
        </Button>
      </div>
    );
  }

  const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${hospital.latitude},${hospital.longitude}`;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Back button */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
      >
        <ArrowLeftIcon className="h-4 w-4" />
        Back
      </button>

      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="bg-blue-100 rounded-lg p-3">
            <HospitalIcon className="h-8 w-8 text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{hospital.name}</h1>
            <p className="text-gray-600 mt-1">{hospital.address}</p>
          </div>
        </div>
        <Button variant="ghost" size="sm" onClick={() => void handleShare()}>
          <Share2Icon className="h-4 w-4 mr-1" />
          Share
        </Button>
      </div>

      {/* Action buttons */}
      <div className="flex flex-wrap gap-3">
        {hospital.phone && (
          <a href={`tel:${hospital.phone}`}>
            <Button variant="outline">
              <PhoneIcon className="h-4 w-4 mr-2" />
              Call Hospital
            </Button>
          </a>
        )}
        <a href={mapsUrl} target="_blank" rel="noopener noreferrer">
          <Button variant="primary">
            <NavigationIcon className="h-4 w-4 mr-2" />
            Get Directions
          </Button>
        </a>
      </div>

      {/* Quick info */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {hospital.rating != null && (
          <div className="bg-white rounded-lg shadow p-4 text-center">
            <StarIcon className="h-6 w-6 text-yellow-400 mx-auto mb-1" />
            <p className="text-2xl font-bold text-gray-900">{hospital.rating}</p>
            <p className="text-sm text-gray-600">Rating</p>
          </div>
        )}
        {hospital.icu_beds != null && (
          <div className="bg-white rounded-lg shadow p-4 text-center">
            <BedIcon className="h-6 w-6 text-red-600 mx-auto mb-1" />
            <p className="text-2xl font-bold text-gray-900">
              {hospital.icu_beds}
            </p>
            <p className="text-sm text-gray-600">ICU Beds</p>
          </div>
        )}
        {hospital.total_beds != null && (
          <div className="bg-white rounded-lg shadow p-4 text-center">
            <BedIcon className="h-6 w-6 text-blue-600 mx-auto mb-1" />
            <p className="text-2xl font-bold text-gray-900">
              {hospital.total_beds}
            </p>
            <p className="text-sm text-gray-600">Total Beds</p>
          </div>
        )}
        <div className="bg-white rounded-lg shadow p-4 text-center">
          <ClockIcon className="h-6 w-6 text-green-600 mx-auto mb-1" />
          <p className="text-2xl font-bold text-gray-900">
            {hospital.emergency_department ? "24/7" : "—"}
          </p>
          <p className="text-sm text-gray-600">Emergency</p>
        </div>
      </div>

      {/* Map */}
      <MapView
        className="w-full h-64 rounded-xl shadow"
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

      {/* Emergency department info */}
      {hospital.emergency_department ? (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertCircleIcon className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-bold text-red-800">Emergency Department</h3>
              <p className="text-sm text-red-700 mt-1">
                This hospital has a fully equipped 24/7 emergency department
                with trauma care facilities.
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <p className="text-sm text-gray-700">
            This hospital is not listed as having a 24/7 emergency department.
            Call ahead before travelling.
          </p>
        </div>
      )}
    </div>
  );
}