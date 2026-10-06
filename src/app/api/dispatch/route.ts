import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase-server";
import { calculateDistance } from "@/lib/google-maps";
import type { UserRole } from "@/types/app";

/**
 * Dispatch console API.
 *
 * GET   — the incident board: every active emergency plus the ambulance fleet.
 * POST  — drive the dispatch lifecycle.
 *         { action: "assign" | "status" | "release", ... }
 *
 * Every mutation keeps `emergencies` and `ambulances` in step, because a
 * disagreement between the two leaves a patient watching a stale status.
 */

type DispatchAction = "assign" | "status" | "release";

const VALID_STATUSES = [
  "pending",
  "dispatched",
  "en_route",
  "arrived",
  "resolved",
  "cancelled",
] as const;

/** Statuses that still have an ambulance working them. */
const ACTIVE_STATUSES = ["pending", "dispatched", "en_route", "arrived"];

async function getRole(supabase: Awaited<ReturnType<typeof getSupabaseServerClient>>) {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { user: null, role: null as UserRole | null };

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, role_v2")
    .eq("id", user.id)
    .maybeSingle();

  const rawRole = String(profile?.role_v2 || profile?.role || "patient").toLowerCase();
  const role = rawRole as UserRole;

  return { user, role };
}

export async function GET() {
  const supabase = await getSupabaseServerClient();
  const { user, role } = await getRole(supabase);

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (role !== "dispatcher" && role !== "paramedic") {
    return NextResponse.json(
      { error: "Dispatch access is limited to dispatchers and paramedics" },
      { status: 403 }
    );
  }

  const [{ data: emergencies, error: emergencyError }, { data: ambulances, error: fleetError }] =
    await Promise.all([
      supabase
        .from("emergencies")
        .select("*, assigned_ambulance:ambulances(*), assigned_hospital:hospitals(*)")
        .in("status", ACTIVE_STATUSES)
        .order("created_at", { ascending: true }),
      supabase
        .from("ambulances")
        .select("*")
        .order("vehicle_number", { ascending: true }),
    ]);

  if (emergencyError) {
    return NextResponse.json({ error: emergencyError.message }, { status: 500 });
  }

  if (fleetError) {
    return NextResponse.json({ error: fleetError.message }, { status: 500 });
  }

  return NextResponse.json({ emergencies: emergencies ?? [], ambulances: ambulances ?? [] });
}

export async function POST(request: NextRequest) {
  const supabase = await getSupabaseServerClient();
  const { user, role } = await getRole(supabase);

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (role !== "dispatcher" && role !== "paramedic") {
    return NextResponse.json(
      { error: "Dispatch access is limited to dispatchers and paramedics" },
      { status: 403 }
    );
  }

  const body = (await request.json()) as {
    action?: DispatchAction;
    emergency_id?: string;
    ambulance_id?: string;
    status?: string;
  };

  const { action, emergency_id: emergencyId, ambulance_id: ambulanceId } = body;

  if (!emergencyId) {
    return NextResponse.json({ error: "emergency_id is required" }, { status: 400 });
  }

  const { data: emergency, error: lookupError } = await supabase
    .from("emergencies")
    .select("*")
    .eq("id", emergencyId)
    .single();

  if (lookupError || !emergency) {
    return NextResponse.json({ error: "Emergency not found" }, { status: 404 });
  }

  const now = new Date().toISOString();

  switch (action) {
    // ---------------------------------------------------------------
    // Assign an ambulance to an emergency.
    // ---------------------------------------------------------------
    case "assign": {
      // Only dispatchers choose which crew takes a job.
      if (role !== "dispatcher") {
        return NextResponse.json(
          { error: "Only dispatchers can assign ambulances" },
          { status: 403 }
        );
      }

      if (!ambulanceId) {
        return NextResponse.json({ error: "ambulance_id is required" }, { status: 400 });
      }

      const { data: ambulance } = await supabase
        .from("ambulances")
        .select("*")
        .eq("id", ambulanceId)
        .single();

      if (!ambulance) {
        return NextResponse.json({ error: "Ambulance not found" }, { status: 404 });
      }

      if (ambulance.current_emergency_id && ambulance.current_emergency_id !== emergencyId) {
        return NextResponse.json(
          { error: "That ambulance is already on another call" },
          { status: 409 }
        );
      }

      const distanceKm = calculateDistance(
        { lat: ambulance.latitude, lng: ambulance.longitude },
        { lat: emergency.latitude, lng: emergency.longitude }
      );
      const etaMinutes = Math.max(Math.round((distanceKm / 40) * 60), 5);

      const { error: ambulanceError } = await supabase
        .from("ambulances")
        .update({ status: "dispatched", current_emergency_id: emergencyId })
        .eq("id", ambulanceId);

      if (ambulanceError) {
        return NextResponse.json({ error: ambulanceError.message }, { status: 500 });
      }

      const { error: emergencyError } = await supabase
        .from("emergencies")
        .update({
          assigned_ambulance_id: ambulanceId,
          status: emergency.status === "pending" ? "dispatched" : emergency.status,
          eta_minutes: etaMinutes,
          updated_at: now,
        })
        .eq("id", emergencyId);

      if (emergencyError) {
        // Roll the ambulance back so the fleet is not left showing a job
        // the emergency does not know about.
        await supabase
          .from("ambulances")
          .update({ status: ambulance.status, current_emergency_id: null })
          .eq("id", ambulanceId);
        return NextResponse.json({ error: emergencyError.message }, { status: 500 });
      }

      return NextResponse.json({ ok: true, etaMinutes, distanceKm });
    }

    // ---------------------------------------------------------------
    // Move an emergency (and its ambulance) to the next status.
    // ---------------------------------------------------------------
    case "status": {
      const next = body.status;

      if (!next || !VALID_STATUSES.includes(next as (typeof VALID_STATUSES)[number])) {
        return NextResponse.json({ error: "Invalid status" }, { status: 400 });
      }

      const status = next as (typeof VALID_STATUSES)[number];

      // Paramedics drive the response forward; dispatchers may also close
      // or cancel. Neither may move an incident backwards to 'pending'.
      if (status === "pending") {
        return NextResponse.json(
          { error: "An emergency cannot return to pending" },
          { status: 400 }
        );
      }

      const assignedId = emergency.assigned_ambulance_id;

      const { error: emergencyError } = await supabase
        .from("emergencies")
        .update({ status, updated_at: now })
        .eq("id", emergencyId);

      if (emergencyError) {
        return NextResponse.json({ error: emergencyError.message }, { status: 500 });
      }

      if (assignedId) {
        const ambulanceStatus =
          status === "en_route"
            ? "en_route"
            : status === "arrived"
              ? "arrived"
              : status === "resolved" || status === "cancelled"
                ? "available"
                : null;

        const update = ambulanceStatus
          ? {
              status: ambulanceStatus,
              ...(ambulanceStatus === "available" ? { current_emergency_id: null } : {}),
            }
          : null;

        if (update) {
          await supabase.from("ambulances").update(update).eq("id", assignedId);
        }
      }

      return NextResponse.json({ ok: true, status });
    }

    // ---------------------------------------------------------------
    // Release an ambulance from an emergency without closing it.
    // ---------------------------------------------------------------
    case "release": {
      if (role !== "dispatcher") {
        return NextResponse.json(
          { error: "Only dispatchers can release an ambulance" },
          { status: 403 }
        );
      }

      if (emergency.assigned_ambulance_id) {
        await supabase
          .from("ambulances")
          .update({ status: "available", current_emergency_id: null })
          .eq("id", emergency.assigned_ambulance_id);
      }

      await supabase
        .from("emergencies")
        .update({
          assigned_ambulance_id: null,
          status: "pending",
          updated_at: now,
        })
        .eq("id", emergencyId);

      return NextResponse.json({ ok: true });
    }

    default:
      return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  }
}