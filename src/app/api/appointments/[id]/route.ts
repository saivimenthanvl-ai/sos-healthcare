import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase-server";
import { getAuthenticatedUser } from "@/lib/authorization";

/**
 * PATCH /api/appointments/[id] — Update status (CANCEL, COMPLETE, REJECT)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthenticatedUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json();
  const { status } = body;

  const allowedStatuses = ["PENDING", "CONFIRMED", "CANCELLED", "COMPLETED", "NO_SHOW", "REJECTED"] as const;
  if (!allowedStatuses.includes(status)) {
    return NextResponse.json({ error: "Invalid appointment status" }, { status: 400 });
  }

  const supabase = await getSupabaseServerClient();

  // Load existing appointment to verify access
  const { data: existing, error: loadErr } = await supabase
    .from("appointments")
    .select("*")
    .eq("id", id)
    .single();

  if (loadErr || !existing) {
    return NextResponse.json({ error: "Appointment not found" }, { status: 404 });
  }

  // Authorization check: Patient can only cancel their own; Doctor can update their assigned; Admin can update any
  if (user.role === "PATIENT" && existing.patient_id !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  if (user.role === "PATIENT" && status !== "CANCELLED") {
    return NextResponse.json({ error: "Patients may only cancel appointments" }, { status: 403 });
  }
  if (user.role === "DOCTOR" && existing.doctor_id !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { data, error } = await supabase
    .from("appointments")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ appointment: data });
}
