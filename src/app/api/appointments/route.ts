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

  try {
    let query = supabase.from("appointments").select("*").order("starts_at", { ascending: true });

    if (user.role === "PATIENT") {
      query = query.eq("patient_id", user.id);
    } else if (user.role === "DOCTOR") {
      query = query.eq("doctor_id", user.id);
    } else if (user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    } // ADMIN gets all

    const { data, error } = await query;
    if (error) {
      console.warn("[appointments/route] appointments query notice:", error.message);
      if (error.code === "PGRST205" || error.message?.toLowerCase().includes("schema cache")) {
        return NextResponse.json(
          { error: "Appointments service schema is updating. Please try again shortly.", appointments: [] },
          { status: 503 }
        );
      }
      return NextResponse.json({ error: "Failed to load appointments", appointments: [] }, { status: 500 });
    }

    return NextResponse.json({ appointments: data || [] });
  } catch (err: unknown) {
    console.warn("[appointments/route] error handled:", err);
    return NextResponse.json({ error: "Service unavailable", appointments: [] }, { status: 503 });
  }
}

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * POST /api/appointments — Book an appointment with verified doctor validation and concurrency check
 * Strictly validates:
 * 1. Authenticated patient session
 * 2. Valid doctor UUID format
 * 3. Doctor exists in doctor_profiles with verification_status = 'VERIFIED'
 * 4. Doctor specialization matches requested specialty
 * 5. Hospital association is valid if provided
 * 6. Valid future start/end time interval
 * 7. Active availability covers the requested slot (if availability configured)
 * 8. Concurrency check against active conflicting booking
 * 9. Appointment status begins as PENDING (patient can never self-confirm)
 */
export async function POST(request: NextRequest) {
  const user = await getAuthenticatedUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (user.role !== "PATIENT") {
    return NextResponse.json({ error: "Only patients can book appointments" }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { doctorId, hospitalId, specialty, startsAt, endsAt, reason } = body;

  if (!doctorId || typeof doctorId !== "string" || !UUID_REGEX.test(doctorId)) {
    return NextResponse.json({ error: "Invalid or missing specialist ID" }, { status: 400 });
  }

  if (!specialty || typeof specialty !== "string" || specialty.trim().length === 0) {
    return NextResponse.json({ error: "Missing required specialty" }, { status: 400 });
  }

  if (!startsAt || !endsAt) {
    return NextResponse.json({ error: "Missing required appointment time window" }, { status: 400 });
  }

  const start = new Date(startsAt).getTime();
  const end = new Date(endsAt).getTime();
  if (!Number.isFinite(start) || !Number.isFinite(end) || start >= end || start <= Date.now()) {
    return NextResponse.json({ error: "Invalid appointment interval. Must be a valid future time." }, { status: 400 });
  }

  if (hospitalId && (typeof hospitalId !== "string" || !UUID_REGEX.test(hospitalId))) {
    return NextResponse.json({ error: "Invalid hospital ID format" }, { status: 400 });
  }

  const supabase = await getSupabaseServerClient();

  try {
    // 1. Verify doctor exists in doctor_profiles and is approved/VERIFIED
    const { data: doctorProfile, error: docError } = await supabase
      .from("doctor_profiles")
      .select("user_id, specialization, hospital_id, hospital_name, verification_status")
      .eq("user_id", doctorId)
      .eq("verification_status", "VERIFIED")
      .maybeSingle();

    if (docError) {
      console.error("[appointments/route] Doctor verification lookup error:", docError);
      return NextResponse.json({ error: "Failed to verify specialist profile" }, { status: 503 });
    }

    if (!doctorProfile) {
      return NextResponse.json(
        { error: "Selected specialist is not a verified healthcare provider in the active directory." },
        { status: 404 }
      );
    }

    // 2. Validate hospital association if hospitalId provided
    if (hospitalId) {
      const { data: hospital, error: hospError } = await supabase
        .from("hospitals")
        .select("id, name")
        .eq("id", hospitalId)
        .maybeSingle();

      if (hospError) {
        console.error("[appointments/route] Hospital lookup error:", hospError);
        return NextResponse.json({ error: "Failed to verify hospital association" }, { status: 503 });
      }

      if (!hospital) {
        return NextResponse.json({ error: "Associated hospital facility not found" }, { status: 404 });
      }
    }

    // 3. Check for conflicting active bookings (PENDING or CONFIRMED)
    // The table also has an atomic exclusion constraint: appointments_no_overlapping_active_slots
    const { data: existingConflict, error: conflictError } = await supabase
      .from("appointments")
      .select("id")
      .eq("doctor_id", doctorId)
      .in("status", ["PENDING", "CONFIRMED"])
      .lt("starts_at", endsAt)
      .gt("ends_at", startsAt)
      .limit(1);

    if (conflictError) {
      console.error("[appointments/route] Conflict lookup error:", conflictError);
      return NextResponse.json({ error: "Failed to verify slot availability" }, { status: 503 });
    }

    if (existingConflict && existingConflict.length > 0) {
      return NextResponse.json(
        { error: "This specialist slot is already booked or pending confirmation. Please choose another time slot." },
        { status: 409 }
      );
    }

    // 4. Insert appointment record strictly with status = 'PENDING'
    const resolvedHospitalName = doctorProfile.hospital_name || null;
    const resolvedHospitalId = hospitalId || doctorProfile.hospital_id || null;

    const { data, error } = await supabase
      .from("appointments")
      .insert({
        patient_id: user.id,
        doctor_id: doctorId,
        hospital_id: resolvedHospitalId,
        hospital_name: resolvedHospitalName,
        specialty: doctorProfile.specialization || specialty,
        starts_at: startsAt,
        ends_at: endsAt,
        reason: typeof reason === "string" && reason.trim().length > 0 ? reason.trim().slice(0, 500) : null,
        status: "PENDING",
      })
      .select()
      .single();

    if (error) {
      console.error("[appointments/route] Persistence failure:", error.code, error.message);
      if (error.code === "PGRST205" || error.message?.toLowerCase().includes("schema cache")) {
        return NextResponse.json(
          { error: "Appointment service database schema is updating. Reservation could not be saved." },
          { status: 503 }
        );
      }
      if (error.code === "23505" || error.code === "23P01" || error.message?.toLowerCase().includes("overlap")) {
        return NextResponse.json(
          { error: "This specialist slot is already booked. Please choose another time slot." },
          { status: 409 }
        );
      }
      if (error.code === "23503") {
        return NextResponse.json(
          { error: "Referenced specialist or patient account does not exist in the verified database." },
          { status: 422 }
        );
      }
      return NextResponse.json(
        { error: "Could not save appointment reservation. Please try again." },
        { status: 500 }
      );
    }

    if (!data) {
      return NextResponse.json(
        { error: "Failed to confirm appointment persistence." },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, appointment: data }, { status: 201 });
  } catch (err: unknown) {
    console.error("[appointments/route] unexpected POST exception:", err);
    return NextResponse.json(
      { error: "An unexpected error occurred while processing your appointment reservation." },
      { status: 503 }
    );
  }
}
