import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase-server";

/**
 * GET /api/locations?emergency_id=...
 * Fetch recent location pings for an emergency (for live tracking).
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
  const emergencyId = searchParams.get("emergency_id");
  const limit = parseInt(searchParams.get("limit") || "50", 10);

  if (!emergencyId) {
    // Return user's own recent locations
    const { data, error } = await supabase
      .from("user_locations")
      .select("*")
      .eq("user_id", session.user.id)
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
    .select("*, user:user_id(*), assigned_ambulance:assigned_ambulance_id(*)")
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

  if (!latitude || !longitude) {
    return NextResponse.json({ error: "latitude and longitude are required" }, { status: 400 });
  }

  const { data, error } = await supabase.from("user_locations").insert({
    user_id: session.user.id,
    latitude: Number(latitude),
    longitude: Number(longitude),
    heart_rate: heart_rate ? Number(heart_rate) : null,
    steps: steps ? Number(steps) : null,
    source: source || "browser",
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ location: data });
}
