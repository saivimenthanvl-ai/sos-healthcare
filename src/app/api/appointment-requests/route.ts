import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase-server";
import { getAuthenticatedUser } from "@/lib/authorization";

export interface AppointmentRequest {
  id: string;
  patient_id: string;
  hospital_id: string | null;
  hospital_name_snapshot: string;
  specialty: string | null;
  consultation_type: string;
  consultation_mode: string;
  preferred_starts_at: string;
  timezone: string;
  notes: string | null;
  status: "PLANNED" | "COMPLETED" | "CANCELLED";
  created_at: string;
  updated_at: string;
  cancelled_at: string | null;
}

/**
 * GET /api/appointment-requests
 * Patient retrieves only their own private appointment requests.
 */
export async function GET(request: NextRequest) {
  const user = await getAuthenticatedUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = await getSupabaseServerClient();

  try {
    const { data, error } = await supabase
      .from("appointment_requests")
      .select("*")
      .eq("patient_id", user.id)
      .order("preferred_starts_at", { ascending: true });

    if (error) {
      console.warn("[appointment-requests] query notice:", error.message);
      if (error.code === "PGRST205" || error.message?.toLowerCase().includes("schema cache")) {
        return NextResponse.json(
          { error: "Appointment requests schema is updating. Please try again shortly.", requests: [] },
          { status: 503 }
        );
      }
      return NextResponse.json({ error: "Failed to load appointment requests", requests: [] }, { status: 500 });
    }

    return NextResponse.json({ requests: data || [] });
  } catch (err: unknown) {
    console.warn("[appointment-requests] error handled:", err);
    return NextResponse.json({ error: "Service unavailable", requests: [] }, { status: 503 });
  }
}

/**
 * POST /api/appointment-requests
 * Creates a patient-owned private custom appointment planning request.
 * Strictly stored within SOS Healthcare Supabase — NO external hospital API or EMR writes.
 */
export async function POST(request: NextRequest) {
  const user = await getAuthenticatedUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (user.role !== "PATIENT" && user.role !== "ADMIN") {
    return NextResponse.json({ error: "Only patients can plan custom appointments" }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const {
    hospitalId,
    hospitalName,
    specialty,
    consultationType = "Specialist Consultation",
    consultationMode = "IN_PERSON",
    preferredStartsAt,
    timezone = "UTC",
    notes = "",
  } = body;

  if (!hospitalName || typeof hospitalName !== "string" || hospitalName.trim() === "") {
    return NextResponse.json({ error: "Hospital name is required" }, { status: 400 });
  }

  if (!preferredStartsAt) {
    return NextResponse.json({ error: "Preferred appointment date and time are required" }, { status: 400 });
  }

  const timestamp = new Date(preferredStartsAt).getTime();
  if (!Number.isFinite(timestamp) || timestamp <= Date.now()) {
    return NextResponse.json({ error: "Preferred appointment time must be in the future" }, { status: 400 });
  }

  const supabase = await getSupabaseServerClient();

  const newRecord = {
    patient_id: user.id,
    hospital_id: hospitalId || null,
    hospital_name_snapshot: hospitalName.trim(),
    specialty: specialty || "General Medicine",
    consultation_type: consultationType,
    consultation_mode: consultationMode,
    preferred_starts_at: new Date(timestamp).toISOString(),
    timezone: timezone || "UTC",
    notes: typeof notes === "string" ? notes.slice(0, 500) : null,
    status: "PLANNED",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    cancelled_at: null,
  };

  try {
    const { data, error } = await supabase
      .from("appointment_requests")
      .insert(newRecord)
      .select()
      .single();

    if (error) {
      console.error("[appointment-requests] insert failure:", error.code, error.message);
      if (error.code === "PGRST205" || error.message?.toLowerCase().includes("schema cache")) {
        return NextResponse.json(
          { error: "Appointment planning service schema is updating. Request could not be saved." },
          { status: 503 }
        );
      }
      return NextResponse.json(
        { error: "Could not save appointment planning request. Please try again." },
        { status: 500 }
      );
    }

    if (!data) {
      return NextResponse.json(
        { error: "Failed to confirm request persistence." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      request: data,
      notice: "This request is saved only in SOS Healthcare. It has not been sent to or confirmed by the selected hospital.",
    }, { status: 201 });
  } catch (err: unknown) {
    console.error("[appointment-requests] unexpected POST exception:", err);
    return NextResponse.json(
      { error: "An unexpected error occurred while processing your appointment request." },
      { status: 503 }
    );
  }
}
