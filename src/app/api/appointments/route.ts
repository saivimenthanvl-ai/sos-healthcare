import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase-server";
import { getAuthenticatedUser } from "@/lib/authorization";

/**
 * GET /api/appointments — Patient gets their own appointments; Doctor gets assigned appointments; Admin gets all.
 */
export async function GET(request: NextRequest) {
  const user = await getAuthenticatedUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = await getSupabaseServerClient();
  let query = supabase.from("appointments").select("*").order("starts_at", { ascending: true });

  if (user.role === "PATIENT") {
    query = query.eq("patient_id", user.id);
  } else if (user.role === "DOCTOR") {
    query = query.eq("doctor_id", user.id);
  } // ADMIN gets all

  const { data, error } = await query;
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ appointments: data || [] });
}

/**
 * POST /api/appointments — Book an appointment with concurrency check against double booking
 */
export async function POST(request: NextRequest) {
  const user = await getAuthenticatedUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (user.role !== "PATIENT") {
    return NextResponse.json({ error: "Only patients can book appointments" }, { status: 403 });
  }

  const body = await request.json();
  const { doctorId, hospitalId, hospitalName, specialty, startsAt, endsAt, reason } = body;

  if (!doctorId || !specialty || !startsAt || !endsAt) {
    return NextResponse.json({ error: "Missing required booking details" }, { status: 400 });
  }

  const start = new Date(startsAt);
  const end = new Date(endsAt);
  if (
    Number.isNaN(start.getTime()) ||
    Number.isNaN(end.getTime()) ||
    end <= start ||
    start <= new Date()
  ) {
    return NextResponse.json({ error: "Invalid appointment time" }, { status: 400 });
  }

  if (String(specialty).length > 100 || String(reason || "").length > 1000) {
    return NextResponse.json({ error: "Appointment details are too long" }, { status: 400 });
  }

  const supabase = await getSupabaseServerClient();

  // Server-side double booking prevention check
  const { data: existingConflict } = await supabase
    .from("appointments")
    .select("id")
    .eq("doctor_id", doctorId)
    .eq("starts_at", startsAt)
    .neq("status", "CANCELLED")
    .limit(1);

  if (existingConflict && existingConflict.length > 0) {
    return NextResponse.json(
      { error: "This time slot is already reserved with this specialist. Please choose another time." },
      { status: 409 }
    );
  }

  // Atomic insert with database constraint backup
  const { data, error } = await supabase
    .from("appointments")
    .insert({
      patient_id: user.id,
      doctor_id: doctorId,
      hospital_id: hospitalId || null,
      hospital_name: hospitalName || null,
      specialty,
      starts_at: startsAt,
      ends_at: endsAt,
      reason: reason || "General consultation",
      status: "CONFIRMED",
    })
    .select()
    .single();

  if (error) {
    if (error.code === "23505") { // unique constraint violation
      return NextResponse.json(
        { error: "Conflict: This slot was just reserved by another patient." },
        { status: 409 }
      );
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ appointment: data });
}
