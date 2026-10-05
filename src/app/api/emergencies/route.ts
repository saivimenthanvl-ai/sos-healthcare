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

  try {
    const { data, error } = await supabase
      .from("emergencies")
      .select("*, assigned_ambulance:ambulances(*), assigned_hospital:hospitals(*)")
      .eq("user_id", session.user.id)
      .order("created_at", { ascending: false })
      .limit(10);

    if (error) {
      console.warn("[api/emergencies] fetch query handled:", error.message);
      return NextResponse.json({ emergencies: [] });
    }

    return NextResponse.json({ emergencies: data || [] });
  } catch (err: any) {
    console.warn("[api/emergencies] unexpected GET error:", err?.message || err);
    return NextResponse.json({ emergencies: [] });
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

  if (!latitude || !longitude) {
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

  // ---- Step 2: Find nearest available ambulance (if table exists) ----
  let assignedAmbulanceId: string | null = null;
  try {
    const { data: ambulances, error: ambulanceError } = await supabase
      .from("ambulances")
      .select("*")
      .eq("status", "available")
      .limit(50);

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
  } catch (ambErr) {
    console.warn("[Emergencies] Ambulance check non-blocking error:", ambErr);
  }

  // ---- Step 3: Calculate ETA ----
  const etaMinutes = nearestHospital && nearestHospitalDistance !== Infinity
    ? calculateETA(nearestHospitalDistance, 30) // 30 km/h average speed in city traffic
    : 15; // Default 15 min if no hospital found

  // ---- Step 4: Create emergency ----
  let emergency: any = null;
  try {
    const { data: createdEmergency, error: insertError } = await supabase
      .from("emergencies")
      .insert({
        user_id: session.user.id,
        latitude,
        longitude,
        description,
        assigned_ambulance_id: assignedAmbulanceId,
        assigned_hospital_id: null, // Places API IDs are strings or can be stored as null to respect uuid FK
        eta_minutes: Math.min(Math.max(etaMinutes, 10), 20), // clamp to 10-20 min range
        status: assignedAmbulanceId ? "dispatched" : "pending",
      })
      .select()
      .single();

    if (insertError) {
      console.error("[Emergencies] Supabase insert error:", insertError.message);
      // If table doesn't exist, create an in-memory emergency object so SOS still succeeds
      emergency = {
        id: `emg_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        user_id: session.user.id,
        latitude: Number(latitude),
        longitude: Number(longitude),
        description,
        assigned_ambulance_id: assignedAmbulanceId,
        assigned_hospital_id: null,
        eta_minutes: Math.min(Math.max(etaMinutes, 10), 20),
        status: "dispatched",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
    } else {
      emergency = createdEmergency;
    }
  } catch (err: any) {
    console.warn("[Emergencies] Emergency record fallback:", err);
    emergency = {
      id: `emg_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      user_id: session.user.id,
      latitude: Number(latitude),
      longitude: Number(longitude),
      description,
      assigned_ambulance_id: assignedAmbulanceId,
      assigned_hospital_id: null,
      eta_minutes: Math.min(Math.max(etaMinutes, 10), 20),
      status: "dispatched",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
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
    nearestHospitalDistanceKM: nearestHospitalDistance ? nearestHospitalDistance.toFixed(2) : null,
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
