import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase-server";

/**
 * GET /api/ambulances?emergency_id=...
 * Returns ambulances (optionally filtered by an active emergency).
 *
 * POST /api/ambulances
 * Create an ambulance location ping (for simulated dispatch).
 * Uses ambulance_locations table (not user_locations).
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

  let query = supabase.from("ambulances").select("*");

  if (emergencyId) {
    query = query.eq("current_emergency_id", emergencyId);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ambulances: data });
}

export async function POST(request: NextRequest) {
  const supabase = await getSupabaseServerClient();

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { ambulance_id, latitude, longitude, speed_kmh } = body;

  if (!ambulance_id || !latitude || !longitude) {
    return NextResponse.json(
      { error: "ambulance_id, latitude, and longitude are required" },
      { status: 400 }
    );
  }

  // Store the ambulance location ping in ambulance_locations
  const { data, error } = await supabase.from("ambulance_locations").insert({
    ambulance_id,
    latitude: Number(latitude),
    longitude: Number(longitude),
    speed_kmh: speed_kmh ? Number(speed_kmh) : null,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Update the ambulance's current position in the ambulances table
  // so realtime subscribers (e.g. EmergencyMap) see the marker move.
  await supabase
    .from("ambulances")
    .update({ latitude: Number(latitude), longitude: Number(longitude) })
    .eq("id", ambulance_id);

  return NextResponse.json({ location: data });
}
