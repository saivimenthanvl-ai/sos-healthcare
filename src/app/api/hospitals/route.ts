import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase-server";
import { calculateDistance } from "@/lib/google-maps";

/**
 * GET /api/hospitals?lat=...&lng=...&radius=10
 * Returns hospitals within a radius of the given coordinates,
 * sorted by proximity. Also enriches with distance.
 */
export async function GET(request: NextRequest) {
  const supabase = await getSupabaseServerClient();

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const lat = parseFloat(searchParams.get("lat") || "0");
  const lng = parseFloat(searchParams.get("lng") || "0");
  const radius = parseFloat(searchParams.get("radius") || "20"); // default 20 km

  if (!lat || !lng) {
    return NextResponse.json({ error: "lat and lng parameters are required" }, { status: 400 });
  }

  const userCoords = { lat, lng };

  // Fetch hospitals and filter by distance
  const { data: hospitals, error } = await supabase
    .from("hospitals")
    .select("*")
    .limit(500);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  interface Hospital {
    id: string;
    latitude: number;
    longitude: number;
    name: string;
    [key: string]: unknown;
  }

  // Compute distance and filter
  const nearbyHospitals = (hospitals || [])
    .map((hospital: Hospital) => ({
      ...hospital,
      distance_km: parseFloat(
        calculateDistance(userCoords, {
          lat: hospital.latitude,
          lng: hospital.longitude,
        }).toFixed(2)
      ),
    }))
    .filter((hospital) => hospital.distance_km <= radius)
    .sort((a, b) => a.distance_km - b.distance_km)
    .slice(0, 20);

  return NextResponse.json({
    hospitals: nearbyHospitals,
    userLocation: { lat, lng },
    radius_km: radius,
  });
}
