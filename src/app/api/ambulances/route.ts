import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase-server";
import { getAuthenticatedUser } from "@/lib/authorization";

function validCoordinate(value: unknown, min: number, max: number): number | null {
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) && n >= min && n <= max ? n : null;
}

/**
 * GET /api/ambulances?emergency_id=...
 * RLS limits patients to the ambulance assigned to their active emergency;
 * emergency staff can read the operational fleet.
 */
export async function GET(request: NextRequest) {
  const user = await getAuthenticatedUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = await getSupabaseServerClient();
  const emergencyId = new URL(request.url).searchParams.get("emergency_id");

  let query = supabase
    .from("ambulances")
    .select("id,vehicle_number,latitude,longitude,status,current_emergency_id,updated_at");

  if (emergencyId) {
    query = query.eq("current_emergency_id", emergencyId);
  }

  const { data, error } = await query.limit(100);

  if (error) {
    console.error("[api/ambulances] read failed");
    return NextResponse.json({ error: "Unable to load ambulance data" }, { status: 500 });
  }

  return NextResponse.json(
    { ambulances: data ?? [] },
    { headers: { "Cache-Control": "no-store" } }
  );
}

/**
 * POST /api/ambulances
 * Only emergency staff may submit ambulance telemetry. Patients cannot choose
 * an ambulance_id and move arbitrary fleet vehicles.
 */
export async function POST(request: NextRequest) {
  const user = await getAuthenticatedUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (user.role !== "PARAMEDIC" && user.role !== "DISPATCHER") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const ambulanceId = typeof body.ambulance_id === "string" ? body.ambulance_id : "";
  const latitude = validCoordinate(body.latitude, -90, 90);
  const longitude = validCoordinate(body.longitude, -180, 180);
  const speed =
    body.speed_kmh == null ? null : Number.isFinite(Number(body.speed_kmh)) ? Number(body.speed_kmh) : null;

  if (!ambulanceId || latitude == null || longitude == null) {
    return NextResponse.json(
      { error: "Valid ambulance_id, latitude and longitude are required" },
      { status: 400 }
    );
  }

  const supabase = await getSupabaseServerClient();

  // Paramedics may update only the ambulance assigned to their profile.
  if (user.role === "PARAMEDIC") {
    const { data: profile } = await supabase
      .from("profiles")
      .select("ambulance_id")
      .eq("id", user.id)
      .maybeSingle();

    if (!profile?.ambulance_id || profile.ambulance_id !== ambulanceId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  const { error: pingError } = await supabase.from("ambulance_locations").insert({
    ambulance_id: ambulanceId,
    latitude,
    longitude,
    speed_kmh: speed,
  });

  if (pingError) {
    console.error("[api/ambulances] location insert failed");
    return NextResponse.json({ error: "Unable to record ambulance location" }, { status: 500 });
  }

  const { error: updateError } = await supabase
    .from("ambulances")
    .update({ latitude, longitude, updated_at: new Date().toISOString() })
    .eq("id", ambulanceId);

  if (updateError) {
    console.error("[api/ambulances] fleet position update failed");
    return NextResponse.json({ error: "Unable to update ambulance position" }, { status: 500 });
  }

  return NextResponse.json({ success: true }, { status: 201 });
}
