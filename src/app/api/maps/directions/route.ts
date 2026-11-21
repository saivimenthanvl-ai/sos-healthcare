import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/authorization";
import { fetchDirections } from "@/lib/maps/routing";
import { isValidCoordinate } from "@/lib/maps/coordinates";

/**
 * POST /api/maps/directions
 * Server-side route proxy for OpenRouteService
 * Protects server-only API keys and provides caching/rate limiting
 */
export async function POST(request: NextRequest) {
  const user = await getAuthenticatedUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { origin, destination, profile } = body;

  if (
    !origin ||
    !destination ||
    !isValidCoordinate(origin.lat, origin.lng) ||
    !isValidCoordinate(destination.lat, destination.lng)
  ) {
    return NextResponse.json(
      { error: "Valid origin and destination coordinates are required." },
      { status: 400 }
    );
  }

  try {
    const directions = await fetchDirections({
      origin: { lat: Number(origin.lat), lng: Number(origin.lng) },
      destination: { lat: Number(destination.lat), lng: Number(destination.lng) },
      profile: profile === "cycling-regular" || profile === "foot-walking" ? profile : "driving-car",
    });

    return NextResponse.json(directions);
  } catch (error) {
    console.error("[api/maps/directions] error:", error);
    return NextResponse.json({ error: "Directions service unavailable" }, { status: 503 });
  }
}
