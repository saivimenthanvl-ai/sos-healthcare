import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase-server";
import { getAuthenticatedUser } from "@/lib/authorization";

/**
 * GET /api/locations?emergency_id=...
 * Fetch recent location pings for an emergency (for live tracking).
 */
export async function GET(request: NextRequest) {
  const user = await getAuthenticatedUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const supabase = await getSupabaseServerClient();

  const { searchParams } = new URL(request.url);
  const emergencyId = searchParams.get("emergency_id");
  const requestedLimit = Number(searchParams.get("limit") || 50);
  const limit = Math.min(Math.max(Number.isFinite(requestedLimit) ? requestedLimit : 50, 1), 100);

  if (!emergencyId) {
    // Return user's own recent locations
    const { data, error } = await supabase
      .from("user_locations")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ locations: data });
  }

  // Get locations for a specific emergency (user + ambulance)
  const { data: emergency, error: emergencyError } = await supabase
    .from("emergencies")
    .select("id,user_id,status,assigned_ambulance_id")
    .eq("id", emergencyId)
    .single();

  if (emergencyError || !emergency) {
    return NextResponse.json({ error: "Emergency not found" }, { status: 404 });
  }

  // Fetch user locations
  const { data: userLocations, error: userLocError } = await supabase
    .from("user_locations")
    .select("*")
    .eq("user_id", emergency.user_id)
    .order("created_at", { ascending: false })
    .limit(limit);

  // Fetch ambulance locations
  let ambulanceLocations: unknown[] = [];
  if (emergency.assigned_ambulance_id) {
    const { data: ambLocs, error: ambLocError } = await supabase
      .from("ambulance_locations")
      .select("*")
      .eq("ambulance_id", emergency.assigned_ambulance_id)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (!ambLocError) {
      ambulanceLocations = ambLocs || [];
    }
  }

  if (userLocError) {
    return NextResponse.json({ error: userLocError.message }, { status: 500 });
  }

  return NextResponse.json({
    emergency,
    userLocations: userLocations || [],
    ambulanceLocations,
  });
}

/**
 * POST /api/locations
 * Submit a location ping (from browser, Fitbit, Apple Health, Google Fit).
 */
export async function POST(request: NextRequest) {
  const supabase = await getSupabaseServerClient();

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { latitude, longitude, heart_rate, steps, source } = body;

  const lat = Number(latitude);
  const lng = Number(longitude);
  if (!Number.isFinite(lat) || lat < -90 || lat > 90 || !Number.isFinite(lng) || lng < -180 || lng > 180) {
    return NextResponse.json({ error: "Valid latitude and longitude are required" }, { status: 400 });
  }

  const safeSource =
    typeof source === "string" && ["browser", "device", "manual"].includes(source)
      ? source
      : "browser";

  const { data, error } = await supabase.from("user_locations").insert({
    user_id: user.id,
    latitude: lat,
    longitude: lng,
    heart_rate: heart_rate == null ? null : Number(heart_rate),
    steps: steps == null ? null : Math.max(0, Number(steps)),
    source: safeSource,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ location: data });
}
