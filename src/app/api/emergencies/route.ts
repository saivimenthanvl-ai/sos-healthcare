import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase-server";


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

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { data, error } = await supabase
      .from("emergencies")
      .select("*, assigned_ambulance:ambulances(*), assigned_hospital:hospitals(*)")
      .eq("user_id", session.user.id)
      .order("created_at", { ascending: false })
      .limit(10);

    if (error) {
      console.warn("[api/emergencies] fetch query handled:", error.message);
      return NextResponse.json({ error: "Unable to load emergencies" }, { status: 503 });
    }

    return NextResponse.json({ emergencies: data || [] });
  } catch (err: any) {
    console.warn("[api/emergencies] unexpected GET error:", err?.message || err);
    return NextResponse.json({ error: "Unable to load emergencies" }, { status: 503 });
  }
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
      user_id: session.user.id,
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

  // ---- Step 5: Reverse geocode to populate the address field ----
  let address: string | null = null;
  try {
    const apiKey = process.env.GOOGLE_MAPS_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (apiKey) {
      const geocodeResponse = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${apiKey}`
      );
      const geocodeData = await geocodeResponse.json();
      if (geocodeData.status === "OK" && geocodeData.results?.length > 0) {
        address = geocodeData.results[0].formatted_address;
        // This patient endpoint cannot alter dispatch-controlled fields under RLS.
        // Geocoded address is only returned in this response.
      }
    } else {
    console.error("Google Maps API key not found");
    }
  } catch (geocodeError) {
    console.error("Reverse geocode error:", geocodeError);
  }

  // ---- Step 6: Notify user's emergency contacts with Google Maps link ----
  try {
    const { data: contacts } = await supabase
      .from("emergency_contacts")
      .select("name, phone, notification_method")
      .eq("user_id", session.user.id);

    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", session.user.id)
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
  // Generate Google Maps navigation url for hospital redirection
  const hospitalNavUrl = nearestHospital
    ? `https://www.google.com/maps/dir/?api=1&origin=${latitude},${longitude}&destination=${nearestHospital.latitude},${nearestHospital.longitude}`
    : `https://www.google.com/maps/search/?api=1&query=hospital`;

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
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const id = url.pathname.split("/").pop();

  if (!id) {
    return NextResponse.json({ error: "Emergency ID required" }, { status: 400 });
  }

  const body = await request.json();
  const { status } = body;
  if (status !== "cancelled") return NextResponse.json({ error: "Only cancellation is permitted" }, { status: 403 });

  const { data, error } = await supabase
    .from("emergencies")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("user_id", session.user.id) // users can only update their own
    .in("status", ["pending", "dispatched", "en_route"])
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ emergency: data });
}
