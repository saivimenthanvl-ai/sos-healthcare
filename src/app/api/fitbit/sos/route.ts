import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase-server";
import { calculateDistance, calculateETA } from "@/lib/google-maps";
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
  let nearestHospital: any = null;
  let minHospitalDist = Infinity;

  for (const h of hospitals || []) {
    const dist = calculateDistance(userCoords, { lat: h.latitude, lng: h.longitude });
    if (dist < minHospitalDist) {
      minHospitalDist = dist;
      nearestHospital = h;
    }
  }

  // 2. Find nearest ambulance
  const { data: ambulances } = await supabase
    .from("ambulances")
    .select("*")
    .eq("status", "available")
    .limit(20);

  let nearestAmbulance: any = null;
  let minAmbulanceDist = Infinity;

  for (const a of ambulances || []) {
    const dist = calculateDistance(userCoords, { lat: a.latitude, lng: a.longitude });
    if (dist < minAmbulanceDist) {
      minAmbulanceDist = dist;
      nearestAmbulance = a;
    }
  }

  const etaMinutes = null; // No verified ambulance position or dispatch estimate.

  // 3. Create emergency record
  const description = `${triggerReason}${heartRate ? ` (BPM: ${heartRate})` : ""}`;
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

  // 4. Reverse Geocoding
  let formattedAddress: string | null = null;
  const apiKey = process.env.GOOGLE_MAPS_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  if (apiKey) {
    try {
      const geoRes = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${apiKey}`
      );
      const geoJson = await geoRes.json();
      if (geoJson.status === "OK" && geoJson.results?.length) {
        formattedAddress = geoJson.results[0].formatted_address;
        await supabase.from("emergencies").update({ address: formattedAddress }).eq("id", emergency.id);
      }
    } catch (e) {
      console.error("Geocoding failed:", e);
    }
  }

  // 5. Notify Emergency Contacts with live Google Maps Redirection
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

  // Google Maps redirection URL to the nearest hospital
  const hospitalNavUrl = nearestHospital
    ? `https://www.google.com/maps/dir/?api=1&origin=${latitude},${longitude}&destination=${nearestHospital.latitude},${nearestHospital.longitude}`
    : `https://www.google.com/maps/search/?api=1&query=hospital`;

  return NextResponse.json({
    success: true,
    emergency,
    nearestHospital,
    hospitalNavUrl,
    message: "Emergency request recorded; dispatch and contact delivery are not yet confirmed.",
  });
}
