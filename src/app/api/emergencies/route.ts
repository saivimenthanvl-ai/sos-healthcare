import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase-server";
import { calculateDistance, calculateETA } from "@/lib/google-maps";

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

  const { data, error } = await supabase
    .from("emergencies")
    .select("*, assigned_ambulance:ambulances(*), assigned_hospital:hospitals(*)")
    .eq("user_id", session.user.id)
    .order("created_at", { ascending: false })
    .limit(10);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ emergencies: data });
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

  if (!latitude || !longitude) {
    return NextResponse.json({ error: "Location is required" }, { status: 400 });
  }

  const userCoords = { lat: Number(latitude), lng: Number(longitude) };

  // ---- Step 1: Find nearest hospital ----
  const { data: hospitals, error: hospitalError } = await supabase
    .from("hospitals")
    .select("*")
    .limit(100);

  if (hospitalError) {
    return NextResponse.json({ error: hospitalError.message }, { status: 500 });
  }

  let nearestHospital: { id: string; latitude: number; longitude: number; name?: string; address?: string } | null = null;
  let nearestHospitalDistance = Infinity;

  for (const hospital of hospitals || []) {
    const distance = calculateDistance(userCoords, {
      lat: hospital.latitude,
      lng: hospital.longitude,
    });
    if (distance < nearestHospitalDistance) {
      nearestHospitalDistance = distance;
      nearestHospital = hospital;
    }
  }

  // ---- Step 2: Find nearest available ambulance ----
  const { data: ambulances, error: ambulanceError } = await supabase
    .from("ambulances")
    .select("*")
    .eq("status", "available")
    .limit(50);

  let assignedAmbulanceId: string | null = null;

  if (!ambulanceError && ambulances && ambulances.length > 0) {
    let nearestAmbulance: { id: string; latitude: number; longitude: number } | null = null;
    let nearestAmbulanceDistance = Infinity;

    for (const ambulance of ambulances) {
      const distance = calculateDistance(userCoords, {
        lat: ambulance.latitude,
        lng: ambulance.longitude,
      });
      if (distance < nearestAmbulanceDistance) {
        nearestAmbulanceDistance = distance;
        nearestAmbulance = ambulance;
      }
    }

    if (nearestAmbulance) {
      assignedAmbulanceId = nearestAmbulance.id;
    }
  }

  // ---- Step 3: Calculate ETA ----
  const etaMinutes = nearestHospital
    ? calculateETA(nearestHospitalDistance, 30) // 30 km/h average speed in city traffic
    : 20; // Default 20 min if no hospital found

  // ---- Step 4: Create emergency ----
  const { data: emergency, error: insertError } = await supabase
    .from("emergencies")
    .insert({
      user_id: session.user.id,
      latitude,
      longitude,
      description,
      assigned_ambulance_id: assignedAmbulanceId,
      assigned_hospital_id: nearestHospital?.id ?? null,
      eta_minutes: Math.min(Math.max(etaMinutes, 10), 20), // clamp to 10-20 min range
      status: assignedAmbulanceId ? "dispatched" : "pending",
    })
    .select()
    .single();

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  // ---- Step 4b: Link the ambulance to the emergency ----
  // The ambulance cannot be marked dispatched before the emergency row
  // exists, because current_emergency_id references it.
  if (assignedAmbulanceId) {
    await supabase
      .from("ambulances")
      .update({
        status: "dispatched",
        current_emergency_id: emergency.id,
      })
      .eq("id", assignedAmbulanceId);
  }

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
        await supabase.from("emergencies").update({ address }).eq("id", emergency.id);
      }
    } else {
    console.error("Google Maps API key not found");
    }
  } catch (geocodeError) {
    console.error("Reverse geocode error:", geocodeError);
  }

  // ---- Step 6: Realtime notification is handled by Supabase Realtime ----
  // The client subscribes to the emergencies channel

  return NextResponse.json({
    emergency,
    nearestHospital,
    nearestHospitalDistanceKM: nearestHospitalDistance ? nearestHospitalDistance.toFixed(2) : null,
    assignedAmbulanceId,
    etaMinutes,
    address,
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

  const { data, error } = await supabase
    .from("emergencies")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("user_id", session.user.id) // users can only update their own
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ emergency: data });
}
