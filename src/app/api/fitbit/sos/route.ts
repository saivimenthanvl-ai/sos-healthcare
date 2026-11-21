import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase-server";
import { calculateDistance } from "@/lib/google-maps";
import { notifyEmergencyContacts } from "@/lib/emergency-notifications";
import { getAuthenticatedUser } from "@/lib/authorization";

/**
 * POST /api/fitbit/sos
 * Endpoint triggered directly by Smart Watch / Fitbit companion apps or webhook
 * when an emergency condition (extreme heart rate spike/drop, fall detection, or watch SOS button) occurs.
 */
export async function POST(request: NextRequest) {
  const supabase = await getSupabaseServerClient();
  // Browser-session requests only. Device webhooks require separate signed credentials.
  const user = await getAuthenticatedUser(request);
  if (!user || user.role !== "PATIENT") {
    return NextResponse.json({ error: "Authenticated patient required" }, { status: 401 });
  }
  const body = await request.json().catch(() => ({}));
  const userId = user.id;

  const {
    latitude,
    longitude,
    heartRate,
    triggerReason = "Smartwatch SOS / Fall Detected",
  } = body;

  if (!Number.isFinite(Number(latitude)) || !Number.isFinite(Number(longitude)) || Math.abs(Number(latitude)) > 90 || Math.abs(Number(longitude)) > 180 || latitude == null || longitude == null) {
    return NextResponse.json(
      { error: "Location coordinates (latitude, longitude) required" },
      { status: 400 }
    );
  }

  const userCoords = { lat: Number(latitude), lng: Number(longitude) };

  // 1. Locate nearest hospital
  const { data: hospitals } = await supabase.from("hospitals").select("*").limit(50);
  let nearestHospital: NonNullable<typeof hospitals>[number] | null = null;
  let minHospitalDist = Infinity;

  for (const h of hospitals || []) {
    const dist = calculateDistance(userCoords, { lat: h.latitude, lng: h.longitude });
    if (dist < minHospitalDist) {
      minHospitalDist = dist;
      nearestHospital = h;
    }
  }

  // Provider matching is performed after a dispatcher accepts the request.
  const etaMinutes = null; // No verified ambulance position or dispatch estimate.

  // 3. Create emergency record
  const safeReason = typeof triggerReason === "string" ? triggerReason.slice(0, 200) : "Smartwatch SOS";
  const safeHeartRate = Number.isInteger(Number(heartRate)) && Number(heartRate) > 0 && Number(heartRate) < 350 ? Number(heartRate) : null;
  const description = `${safeReason}${safeHeartRate ? ` (BPM: ${safeHeartRate})` : ""}`;
  const { data: emergency, error: emergencyError } = await supabase
    .from("emergencies")
    .insert({
      user_id: userId,
      latitude: Number(latitude),
      longitude: Number(longitude),
      description,
      assigned_hospital_id: nearestHospital?.id || null,
      assigned_ambulance_id: null,
      eta_minutes: null,
      status: "pending",
    })
    .select()
    .single();

  if (emergencyError) {
    return NextResponse.json({ error: emergencyError.message }, { status: 500 });
  }

  // Ambulance assignment must occur separately through an authorized dispatcher.

  // 4. Reverse Geocoding via OpenStreetMap Nominatim
  let formattedAddress: string | null = null;
  try {
    const nominatimUrl = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`;
    const geoRes = await fetch(nominatimUrl, {
      signal: AbortSignal.timeout(4000),
      headers: { "User-Agent": "SOSHealthcareFitbit/1.0" },
    });
    if (geoRes.ok) {
      const geoJson = await geoRes.json();
      if (geoJson && geoJson.display_name) {
        formattedAddress = geoJson.display_name;
      }
    }
  } catch (e) {
    console.warn("Geocoding notice handled:", e);
  }

  // 5. Notify Emergency Contacts with live Map Navigation
  const { data: contacts } = await supabase
    .from("emergency_contacts")
    .select("name, phone, notification_method")
    .eq("user_id", userId);

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", userId)
    .single();

  if (contacts && contacts.length > 0) {
    await notifyEmergencyContacts(contacts, {
      userName: profile?.full_name || "Watch Wearer",
      latitude: Number(latitude),
      longitude: Number(longitude),
      address: formattedAddress,
      hospitalName: nearestHospital?.name,
      etaMinutes,
    });
  }

  // OpenStreetMap redirection URL to the nearest hospital
  const hospitalNavUrl = nearestHospital
    ? `https://www.openstreetmap.org/directions?engine=fossgis_osrm_car&route=${latitude}%2C${longitude}%3B${nearestHospital.latitude}%2C${nearestHospital.longitude}`
    : `https://www.openstreetmap.org/search?query=hospital`;

  return NextResponse.json({
    success: true,
    emergency,
    nearestHospital,
    hospitalNavUrl,
    message: "Emergency request recorded; dispatch and contact delivery are not yet confirmed.",
  });
}
