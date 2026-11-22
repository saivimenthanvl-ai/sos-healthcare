import { NextRequest, NextResponse } from "next/server";
import { isValidCoordinate } from "@/lib/maps/coordinates";

export interface GoogleRoutesRequest {
  origin: { lat: number; lng: number };
  destination: { lat: number; lng: number };
  travelMode?: "DRIVE" | "BICYCLE" | "WALK" | "TWO_WHEELER";
}

export interface GoogleRoutesResponse {
  distanceMeters: number;
  durationSeconds: number;
  encodedPolyline: string;
  source: "google_routes_v2";
  distanceKm: number;
  durationMinutes: number;
}

// In-memory LRU cache to conserve Google Routes API quota
const routeCache = new Map<string, { data: GoogleRoutesResponse; expiresAt: number }>();
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes

/**
 * POST /api/maps/google-routes
 * Secure server-side proxy for Google Routes API v2 (computeRoutes).
 * Keeps API keys secure on the server, validates coordinates, and caches results.
 */
export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => null)) as GoogleRoutesRequest | null;

  if (
    !body ||
    !body.origin ||
    !body.destination ||
    !isValidCoordinate(body.origin.lat, body.origin.lng) ||
    !isValidCoordinate(body.destination.lat, body.destination.lng)
  ) {
    return NextResponse.json(
      { error: "Valid origin and destination coordinates are required." },
      { status: 400 }
    );
  }

  const { origin, destination, travelMode = "DRIVE" } = body;
  const cacheKey = `${travelMode}:${origin.lat.toFixed(5)},${origin.lng.toFixed(5)}->${destination.lat.toFixed(5)},${destination.lng.toFixed(5)}`;

  const cached = routeCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    return NextResponse.json(cached.data);
  }

  const apiKey =
    process.env.GOOGLE_MAPS_SERVER_API_KEY ||
    process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ||
    process.env.GOOGLE_MAPS_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { error: "Google Maps API credential is not configured on the server." },
      { status: 503 }
    );
  }

  try {
    const response = await fetch("https://routes.googleapis.com/directions/v2:computeRoutes", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": apiKey,
        "X-Goog-FieldMask": "routes.duration,routes.distanceMeters,routes.polyline.encodedPolyline",
      },
      body: JSON.stringify({
        origin: {
          location: {
            latLng: {
              latitude: Number(origin.lat),
              longitude: Number(origin.lng),
            },
          },
        },
        destination: {
          location: {
            latLng: {
              latitude: Number(destination.lat),
              longitude: Number(destination.lng),
            },
          },
        },
        travelMode,
        routingPreference: travelMode === "DRIVE" ? "TRAFFIC_AWARE" : undefined,
        computeAlternativeRoutes: false,
        units: "METRIC",
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.warn("[Google Routes API v2 error]:", response.status, errorText);
      return NextResponse.json(
        { error: "Unable to calculate route via Google Routes API." },
        { status: response.status }
      );
    }

    const data = await response.json();
    const route = data.routes?.[0];

    if (!route || !route.polyline?.encodedPolyline) {
      return NextResponse.json(
        { error: "No drivable route found between the specified coordinates." },
        { status: 404 }
      );
    }

    // duration format from Routes API is e.g. "820s"
    const durationStr = route.duration || "0s";
    const durationSeconds = parseInt(durationStr.replace("s", ""), 10) || 0;
    const distanceMeters = Number(route.distanceMeters) || 0;

    const result: GoogleRoutesResponse = {
      distanceMeters,
      durationSeconds,
      encodedPolyline: route.polyline.encodedPolyline,
      source: "google_routes_v2",
      distanceKm: parseFloat((distanceMeters / 1000).toFixed(2)),
      durationMinutes: Math.max(1, Math.round(durationSeconds / 60)),
    };

    routeCache.set(cacheKey, { data: result, expiresAt: Date.now() + CACHE_TTL_MS });

    return NextResponse.json(result);
  } catch (err: unknown) {
    console.error("[api/maps/google-routes exception]:", err);
    return NextResponse.json(
      { error: "Google Routes service connection failure." },
      { status: 503 }
    );
  }
}
