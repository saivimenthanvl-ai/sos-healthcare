import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase-server";

/**
 * POST /api/hospitals/book
 * Handles customized emergency hospital bed/appointment/ambulance booking
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
  const {
    hospitalId,
    hospitalName,
    customization = {
      bedType: "General / ER Bed",
      requireAmbulance: true,
      priorityLevel: "Urgent",
      specialtyNeeds: "None",
      notes: "",
    },
    userLocation,
  } = body;

  if (!hospitalId) {
    return NextResponse.json({ error: "Hospital ID is required" }, { status: 400 });
  }

  // Create an emergency record or appointment customization
  const description = `Emergency Booking: ${hospitalName || "Hospital"} | Bed: ${
    customization.bedType
  } | Priority: ${customization.priorityLevel} | Specialty: ${
    customization.specialtyNeeds || "Emergency"
  } ${customization.notes ? `| Notes: ${customization.notes}` : ""}`;

  if (!userLocation?.lat || !userLocation?.lng) {
    return NextResponse.json(
      { error: "Location coordinates (userLocation.lat, userLocation.lng) are required" },
      { status: 400 }
    );
  }

  const { data: createdEmergency, error: bookingErr } = await supabase
    .from("emergencies")
    .insert({
      user_id: session.user.id,
      latitude: Number(userLocation.lat),
      longitude: Number(userLocation.lng),
      assigned_hospital_id: null,
      assigned_ambulance_id: null,
      eta_minutes: null,
      description,
      status: "pending",
    })
    .select()
    .single();

  if (bookingErr || !createdEmergency) {
    console.error("[HospitalBooking] emergencies insert failure:", bookingErr?.code, bookingErr?.message);
    if (bookingErr?.code === "PGRST205" || bookingErr?.message?.toLowerCase().includes("schema cache")) {
      return NextResponse.json(
        { error: "Emergency triage database schema is updating. Request could not be saved." },
        { status: 503 }
      );
    }
    return NextResponse.json(
      { error: "Failed to persist emergency triage booking. Please call emergency services directly." },
      { status: 500 }
    );
  }

  return NextResponse.json({
    success: true,
    bookingId: createdEmergency.id,
    hospitalId,
    hospitalName,
    customization,
    message: `Emergency triage and facility notification request recorded. Live bed allocation is confirmed on-site by ER staff.`,
    emergency: createdEmergency,
  }, { status: 201 });
}
