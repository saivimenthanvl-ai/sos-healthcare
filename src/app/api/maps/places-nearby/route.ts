import { NextRequest, NextResponse } from "next/server";
import { isValidCoordinate, calculateDistance } from "@/lib/maps/coordinates";
import { CHENNAI_HOSPITALS_DATASET } from "@/lib/data/chennai-hospitals";
import type { Hospital } from "@/types/app";

export interface PlacesNearbyRequest {
  latitude: number;
  longitude: number;
  radiusMeters?: number;
}

// In-memory cache for Places API responses (key -> { data, expiresAt })
const placesCache = new Map<string, { data: Hospital[]; expiresAt: number }>();
const CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutes

/**
 * POST /api/maps/places-nearby
 * Server-side endpoint utilizing Google Places API (New) (places:searchNearby).
 * Blends live Google Places with verified hospital records and contact numbers.
 */
export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => null)) as PlacesNearbyRequest | null;

  if (
    !body ||
    body.latitude == null ||
    body.longitude == null ||
    !isValidCoordinate(body.latitude, body.longitude)
  ) {
    return NextResponse.json(
      { error: "Valid latitude and longitude coordinates are required." },
      { status: 400 }
    );
  }

  const { latitude, longitude, radiusMeters = 10000 } = body;
  const userCoords = { lat: latitude, lng: longitude };
  const cacheKey = `${latitude.toFixed(4)},${longitude.toFixed(4)}:${radiusMeters}`;

  const cached = placesCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    return NextResponse.json({ hospitals: cached.data, source: "cache" });
  }

  // 1. Check verified local healthcare dataset first for high fidelity
  const verifiedMatches = CHENNAI_HOSPITALS_DATASET.map((h) => {
    const dist = calculateDistance(userCoords, { lat: h.latitude, lng: h.longitude });
    return {
      ...h,
      distance_from_user: parseFloat(dist.toFixed(2)),
      distance_km: parseFloat(dist.toFixed(2)),
    } as Hospital;
  })
    .filter((h) => (h.distance_km ?? Infinity) <= radiusMeters / 1000)
    .sort((a, b) => (a.distance_km ?? 0) - (b.distance_km ?? 0));

  const apiKey =
    process.env.GOOGLE_MAPS_SERVER_API_KEY ||
    process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ||
    process.env.GOOGLE_MAPS_API_KEY;

  if (!apiKey) {
    // Return verified local matches if no API key configured
    return NextResponse.json({
      hospitals: verifiedMatches,
      source: "verified_repository",
    });
  }

  try {
    const res = await fetch("https://places.googleapis.com/v1/places:searchNearby", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": apiKey,
        "X-Goog-FieldMask":
          "places.id,places.displayName,places.formattedAddress,places.location,places.primaryType",
      },
      body: JSON.stringify({
        includedTypes: ["hospital"],
        maxResultCount: 15,
        locationRestriction: {
          circle: {
            center: { latitude, longitude },
            radius: Math.min(Math.max(radiusMeters, 1000), 50000),
          },
        },
      }),
    });

    if (!res.ok) {
      console.warn("[Places API New response status]:", res.status);
      return NextResponse.json({
        hospitals: verifiedMatches,
        source: "verified_fallback",
      });
    }

    const data = await res.json();
    const rawPlaces = data.places || [];

    const discoveredHospitals: Hospital[] = rawPlaces
      .filter((p: { location?: { latitude?: number; longitude?: number } }) => p.location?.latitude && p.location?.longitude)
      .map((p: {
        id: string;
        displayName?: { text?: string };
        formattedAddress?: string;
        location: { latitude: number; longitude: number };
        primaryType?: string;
      }) => {
        const hLat = p.location.latitude;
        const hLng = p.location.longitude;
        const dist = calculateDistance(userCoords, { lat: hLat, lng: hLng });
        const name = p.displayName?.text || "Medical Center";

        // Check if facility exists in our verified dataset to enrich with verified phone and emergency data
        const verifiedMatch = CHENNAI_HOSPITALS_DATASET.find(
          (vh) =>
            vh.name.toLowerCase() === name.toLowerCase() ||
            calculateDistance({ lat: hLat, lng: hLng }, { lat: vh.latitude, lng: vh.longitude }) < 0.2
        );

        if (verifiedMatch) {
          return {
            ...verifiedMatch,
            distance_from_user: parseFloat(dist.toFixed(2)),
            distance_km: parseFloat(dist.toFixed(2)),
          } as Hospital;
        }

        return {
          id: `places-${p.id}`,
          name,
          address: p.formattedAddress || "Address provided via Google Places",
          phone: null,
          latitude: hLat,
          longitude: hLng,
          emergency_department: false,
          icu_beds: null,
          total_beds: null,
          rating: null,
          distance_from_user: parseFloat(dist.toFixed(2)),
          distance_km: parseFloat(dist.toFixed(2)),
          created_at: new Date().toISOString(),
          website: null,
          facility_type: "general_hospital",
          verification_status: "unverified",
          data_source: "directory",
          emergency_capability: "unconfirmed",
          last_verified: null,
        } as Hospital;
      });

    // Merge: Deduplicate verified dataset and Places results
    const combinedMap = new Map<string, Hospital>();

    // Prioritize verified facilities
    verifiedMatches.forEach((vh) => {
      combinedMap.set(vh.id, vh);
    });

    discoveredHospitals.forEach((dh) => {
      const exists = Array.from(combinedMap.values()).some(
        (existing) =>
          existing.name.toLowerCase() === dh.name.toLowerCase() ||
          calculateDistance({ lat: existing.latitude, lng: existing.longitude }, { lat: dh.latitude, lng: dh.longitude }) < 0.2
      );
      if (!exists) {
        combinedMap.set(dh.id, dh);
      }
    });

    const sortedHospitals = Array.from(combinedMap.values()).sort(
      (a, b) => (a.distance_km ?? 0) - (b.distance_km ?? 0)
    );

    placesCache.set(cacheKey, { data: sortedHospitals, expiresAt: Date.now() + CACHE_TTL_MS });

    return NextResponse.json({
      hospitals: sortedHospitals,
      source: "google_places_new",
    });
  } catch (err: unknown) {
    console.error("[api/maps/places-nearby error]:", err);
    return NextResponse.json({
      hospitals: verifiedMatches,
      source: "verified_fallback",
    });
  }
}
