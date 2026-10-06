import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase-server";
import { getAuthenticatedUser } from "@/lib/authorization";

/**
 * GET  /api/emergencies — list the authenticated patient's recent emergencies.
 * POST /api/emergencies — create a durable SOS record.
 * PATCH /api/emergencies?id=... — patient cancellation only.
 *
 * Dispatch assignment/status progression is owned by the dispatch workflow,
 * not by the patient-facing endpoint.
 */

const MAX_DESCRIPTION_LENGTH = 500;

function parseCoordinate(value: unknown, min: number, max: number): number | null {
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n) || n < min || n > max) return null;
  return n;
}

export async function GET() {
  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase
    .from("emergencies")
    .select(
      "id,user_id,latitude,longitude,address,description,status,assigned_ambulance_id,assigned_hospital_id,eta_minutes,created_at,updated_at"
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(10);

  if (error) {
    console.error("[api/emergencies] fetch failed");
    return NextResponse.json(
      { error: "Unable to load emergency history" },
      { status: 500 }
    );
  }

  return NextResponse.json({ emergencies: data ?? [] });
}

export async function POST(request: NextRequest) {
  const user = await getAuthenticatedUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (user.role !== "PATIENT") {
    return NextResponse.json(
      { error: "Only patient accounts may create a patient SOS request" },
      { status: 403 }
    );
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const latitude = parseCoordinate(body.latitude, -90, 90);
  const longitude = parseCoordinate(body.longitude, -180, 180);
  const description =
    typeof body.description === "string"
      ? body.description.trim().slice(0, MAX_DESCRIPTION_LENGTH)
      : null;

  if (latitude == null || longitude == null) {
    return NextResponse.json(
      { error: "Valid latitude and longitude are required" },
      { status: 400 }
    );
  }

  const supabase = await getSupabaseServerClient();

  // Hospital discovery is contextual only; failure must never create a fake
  // "dispatched" result.
  let nearestHospital: {
    id: string;
    latitude: number;
    longitude: number;
    name?: string;
    address?: string;
    distance_km?: number;
  } | null = null;

  try {
    const { findNearbyHospitals } = await import("@/services/hospitals");
    const result = await findNearbyHospitals(latitude, longitude, 25);
    nearestHospital = result.hospitals?.[0] ?? null;
  } catch {
    console.warn("[api/emergencies] hospital lookup unavailable");
  }

  const { data: emergency, error: insertError } = await supabase
    .from("emergencies")
    .insert({
      user_id: user.id,
      latitude,
      longitude,
      description,
      assigned_ambulance_id: null,
      assigned_hospital_id: null,
      eta_minutes: null,
      status: "pending",
    })
    .select(
      "id,user_id,latitude,longitude,address,description,status,assigned_ambulance_id,assigned_hospital_id,eta_minutes,created_at,updated_at"
    )
    .single();

  if (insertError || !emergency) {
    console.error("[api/emergencies] persistence failed");
    return NextResponse.json(
      {
        error: "Emergency request could not be registered",
        emergencyCreated: false,
      },
      {
        status: 503,
        headers: { "Cache-Control": "no-store" },
      }
    );
  }

  let address: string | null = null;
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;

  if (apiKey) {
    try {
      const geoResponse = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${apiKey}`,
        { cache: "no-store" }
      );
      const geoData = await geoResponse.json();
      if (geoData.status === "OK" && geoData.results?.[0]?.formatted_address) {
        address = geoData.results[0].formatted_address;
        await supabase
          .from("emergencies")
          .update({ address })
          .eq("id", emergency.id)
          .eq("user_id", user.id);
      }
    } catch {
      console.warn("[api/emergencies] reverse geocoding unavailable");
    }
  }

  try {
    const { data: contacts } = await supabase
      .from("emergency_contacts")
      .select("name,phone,notification_method")
      .eq("user_id", user.id);

    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", user.id)
      .maybeSingle();

    if (contacts?.length) {
      const { notifyEmergencyContacts } = await import("@/lib/emergency-notifications");
      await notifyEmergencyContacts(contacts, {
        userName: profile?.full_name || "User",
        latitude,
        longitude,
        address,
        hospitalName: nearestHospital?.name || null,
        etaMinutes: null,
      });
    }
  } catch {
    // Notification failure must be visible in logs but must not invalidate the
    // durable SOS record that has already been created.
    console.error("[api/emergencies] emergency contact notification failed");
  }

  const hospitalNavUrl = nearestHospital
    ? `https://www.google.com/maps/dir/?api=1&origin=${latitude},${longitude}&destination=${nearestHospital.latitude},${nearestHospital.longitude}`
    : "https://www.google.com/maps/search/?api=1&query=hospital";

  return NextResponse.json(
    {
      emergency,
      emergencyCreated: true,
      nearestHospital,
      hospitalNavUrl,
    },
    {
      status: 201,
      headers: { "Cache-Control": "no-store" },
    }
  );
}

export async function PATCH(request: NextRequest) {
  const user = await getAuthenticatedUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const id = url.searchParams.get("id") || url.pathname.split("/").pop();

  if (!id || id === "emergencies") {
    return NextResponse.json({ error: "Emergency ID required" }, { status: 400 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (body.status !== "cancelled") {
    return NextResponse.json(
      { error: "Patients may only cancel their own active emergency" },
      { status: 403 }
    );
  }

  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase
    .from("emergencies")
    .update({
      status: "cancelled",
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("user_id", user.id)
    .in("status", ["pending", "dispatched", "en_route"])
    .select(
      "id,user_id,status,assigned_ambulance_id,assigned_hospital_id,updated_at"
    )
    .maybeSingle();

  if (error) {
    console.error("[api/emergencies] cancellation failed");
    return NextResponse.json(
      { error: "Unable to cancel emergency" },
      { status: 500 }
    );
  }

  if (!data) {
    return NextResponse.json(
      { error: "Emergency not found or cannot be cancelled" },
      { status: 404 }
    );
  }

  return NextResponse.json({ emergency: data });
}
