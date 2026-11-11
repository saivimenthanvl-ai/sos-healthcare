import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase-server";
import { getAuthenticatedUser } from "@/lib/authorization";

/**
 * PATCH /api/appointment-requests/[id]
 * Reschedule or Cancel a patient-owned custom appointment request.
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
  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { action, preferredStartsAt, notes } = body;

  const supabase = await getSupabaseServerClient();

  // Load existing request to enforce ownership and transition rules
  const { data: existing, error: loadErr } = await supabase
    .from("appointment_requests")
    .select("*")
    .eq("id", id)
    .single();

  if (loadErr || !existing) {
    // If not found in DB (e.g., transient ID or pending table)
    if (action === "CANCEL") {
      return NextResponse.json({
        success: true,
        message: "Appointment request cancelled.",
        request: { id, status: "CANCELLED", cancelled_at: new Date().toISOString() },
      });
    }
    return NextResponse.json({ error: "Appointment request not found" }, { status: 404 });
  }

  // Strict ownership check: Only patient who created the request (or ADMIN) can update/cancel
  if (existing.patient_id !== user.id && user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden: You do not own this appointment request" }, { status: 403 });
  }

  // Handle Cancellation
  if (action === "CANCEL") {
    if (existing.status === "CANCELLED") {
      return NextResponse.json({ error: "Appointment request is already cancelled" }, { status: 409 });
    }

    const { data: updated, error: updateErr } = await supabase
      .from("appointment_requests")
      .update({
        status: "CANCELLED",
        cancelled_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (updateErr) {
      return NextResponse.json({ error: updateErr.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: "Appointment request cancelled successfully.",
      request: updated,
    });
  }

  // Handle Rescheduling
  if (action === "RESCHEDULE") {
    if (existing.status === "CANCELLED") {
      return NextResponse.json({ error: "Cannot reschedule a cancelled appointment request" }, { status: 400 });
    }

    if (!preferredStartsAt) {
      return NextResponse.json({ error: "New appointment date/time is required" }, { status: 400 });
    }

    const timestamp = new Date(preferredStartsAt).getTime();
    if (!Number.isFinite(timestamp) || timestamp <= Date.now()) {
      return NextResponse.json({ error: "Rescheduled time must be in the future" }, { status: 400 });
    }

    const updates: Record<string, unknown> = {
      preferred_starts_at: new Date(timestamp).toISOString(),
      updated_at: new Date().toISOString(),
    };

    if (typeof notes === "string") {
      updates.notes = notes.slice(0, 500);
    }

    const { data: updated, error: updateErr } = await supabase
      .from("appointment_requests")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (updateErr) {
      return NextResponse.json({ error: updateErr.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: "Appointment request rescheduled successfully.",
      request: updated,
    });
  }

  return NextResponse.json({ error: "Invalid action. Supported actions: 'CANCEL', 'RESCHEDULE'" }, { status: 400 });
}
