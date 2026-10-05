import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase-server";
import { findNearbyHospitals } from "@/services/hospitals";

/**
 * GET /api/hospitals?lat=...&lng=...&radius=20
 * Returns live nearby hospitals from Google Places API or fallback,
 * sorted by proximity with distances calculated.
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
    return NextResponse.json(
      { error: "lat and lng parameters are required" },
      { status: 400 }
    );
  }

  try {
    const { hospitals } = await findNearbyHospitals(lat, lng, radius);

    return NextResponse.json({
      hospitals,
      userLocation: { lat, lng },
      radius_km: radius,
    });
  } catch (error) {
    console.error("[api/hospitals] Failed to fetch hospitals:", error);
    return NextResponse.json({
      hospitals: [],
      userLocation: { lat, lng },
      radius_km: radius,
    });
  }
}

