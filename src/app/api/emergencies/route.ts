import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase-server";
import { getAuthenticatedUser } from "@/lib/authorization";


/**
 * GET  /api/emergencies       — list user's recent emergencies
 * POST /api/emergencies       — create a new SOS emergency + find nearest hospital/ambulance
 * PATCH /api/emergencies/:id  — update emergency status
 *
 * On creation:
 *   1. Find the nearest available hospital
 *   2. Find the nearest available ambulance
 *   3. Calculate ETA (10–20 min target)
 *   4. Mark the ambulance as "en_route"
 */
export async function GET() {
  const supabase = await getSupabaseServerClient();

  const user = await getAuthenticatedUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { data, error } = await supabase
      .from("emergencies")
      .select("*, assigned_ambulance:ambulances(*), assigned_hospital:hospitals(*)")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(10);

    if (error) {
      console.warn("[api/emergencies] fetch query handled:", error.message);
      return NextResponse.json({ error: "Unable to load emergencies" }, { status: 503 });
    }

    return NextResponse.json({ emergencies: data || [] });
  } catch (err: unknown) {
    console.warn("[api/emergencies] unexpected GET error:", err instanceof Error ? err.message : err);
    return NextResponse.json({ error: "Unable to load emergencies" }, { status: 503 });
  }
}


export async function POST(request: NextRequest) {
  const supabase = await getSupabaseServerClient();

  const user = await getAuthenticatedUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  const { latitude, longitude, description } = body;

  if (latitude == null || longitude == null || !Number.isFinite(Number(latitude)) || !Number.isFinite(Number(longitude)) || Math.abs(Number(latitude)) > 90 || Math.abs(Number(longitude)) > 180) {
    return NextResponse.json({ error: "Location is required" }, { status: 400 });
  }

  const userCoords = { lat: Number(latitude), lng: Number(longitude) };

  // ---- Step 1: Find nearest hospital (non-blocking, uses live Places API) ----
  let nearestHospital: { id: string; latitude: number; longitude: number; name?: string; address?: string } | null = null;
  let nearestHospitalDistance = Infinity;

  try {
    const { findNearbyHospitals } = await import("@/services/hospitals");
    const { hospitals } = await findNearbyHospitals(userCoords.lat, userCoords.lng, 25);
    if (hospitals && hospitals.length > 0) {
      nearestHospital = hospitals[0];
      nearestHospitalDistance = hospitals[0].distance_km ?? 5;
    }
  } catch (lookupErr) {
    console.warn("[Emergencies] Hospital lookup non-blocking error:", lookupErr);
  }

  // Persist a pending request. Actual ambulance assignment belongs to the dispatcher.
  // In particular, this insert must agree with migration 003's patient RLS policy.
  const { data: emergency, error: insertError } = await supabase
    .from("emergencies")
    .insert({
      user_id: user.id,
      latitude: Number(latitude),
      longitude: Number(longitude),
      description: typeof description === "string" ? description.slice(0, 1000) : null,
      assigned_ambulance_id: null,
      assigned_hospital_id: null,
      eta_minutes: null,
      status: "pending",
    })
    .select()
    .single();

  if (insertError || !emergency) {
    console.error("[Emergencies] Failed to persist SOS:", insertError?.code);
    return NextResponse.json(
      { error: "SOS request could not be recorded. Call emergency services directly." },
      { status: 503 }
    );
  }

  const etaMinutes: number | null = null;
  const assignedAmbulanceId: string | null = null;

  // ---- Step 5: Reverse geocode to populate the address field using OpenStreetMap Nominatim ----
  let address: string | null = null;
  try {
    const nominatimUrl = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`;
    const geocodeResponse = await fetch(nominatimUrl, {
      signal: AbortSignal.timeout(4000),
      headers: {
        "User-Agent": "SOSHealthcareEmergencyApp/1.0",
      },
    });
    if (geocodeResponse.ok) {
      const geocodeData = await geocodeResponse.json();
      if (geocodeData && geocodeData.display_name) {
        address = geocodeData.display_name;
      }
    }
  } catch (geocodeError) {
    console.warn("[Emergencies] Reverse geocode non-blocking notice:", geocodeError);
  }

  // ---- Step 6: Notify user's emergency contacts with OpenStreetMap link ----
  try {
    const { data: contacts } = await supabase
      .from("emergency_contacts")
      .select("name, phone, notification_method")
      .eq("user_id", user.id);

    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", user.id)
      .single();

    if (contacts && contacts.length > 0) {
      const { notifyEmergencyContacts } = await import("@/lib/emergency-notifications");
      await notifyEmergencyContacts(contacts, {
        userName: profile?.full_name || "User",
        latitude: Number(latitude),
        longitude: Number(longitude),
        address,
        hospitalName: nearestHospital?.name || null,
        etaMinutes,
      });
    }
  } catch (notifyError) {
    console.error("Failed to notify contacts:", notifyError);
  }

  // ---- Step 7: Realtime notification is handled by Supabase Realtime ----
  // Generate navigation url for hospital redirection (OpenStreetMap free alternative)
  const hospitalNavUrl = nearestHospital
    ? `https://www.openstreetmap.org/directions?engine=fossgis_osrm_car&route=${latitude}%2C${longitude}%3B${nearestHospital.latitude}%2C${nearestHospital.longitude}`
    : `https://www.openstreetmap.org/search?query=hospital#map=14/${latitude}/${longitude}`;

  return NextResponse.json({
    emergency,
    nearestHospital,
    nearestHospitalDistanceKM: Number.isFinite(nearestHospitalDistance) ? nearestHospitalDistance.toFixed(2) : null,
    assignedAmbulanceId,
    etaMinutes,
    address,
    hospitalNavUrl,
  });
}

/**
 * PATCH /api/emergencies/[id] — update emergency status
 */
export async function PATCH(request: NextRequest) {
  const supabase = await getSupabaseServerClient();
  const user = await getAuthenticatedUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const id = url.pathname.split("/").pop();

  if (!id) {
    return NextResponse.json({ error: "Emergency ID required" }, { status: 400 });
  }

  const body = await request.json().catch(() => null);
  const status = body?.status;
  if (status !== "cancelled") return NextResponse.json({ error: "Only cancellation is permitted" }, { status: 403 });

  const { data, error } = await supabase
    .from("emergencies")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("user_id", user.id) // users can only update their own
    .in("status", ["pending", "dispatched", "en_route"])
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ emergency: data });
}
