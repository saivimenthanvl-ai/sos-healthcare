import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/authorization";
import { getSupabaseServerClient } from "@/lib/supabase-server";

const ACTIVE_STATUSES = ["pending", "dispatched", "en_route", "arrived"];

async function dispatcher() {
  const user = await getAuthenticatedUser();
  if (!user) return { user: null, response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  if (user.role !== "DISPATCHER" && user.role !== "PARAMEDIC") {
    return { user, response: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }
  return { user, response: null };
}

export async function GET() {
  const { response } = await dispatcher();
  if (response) return response;
  const supabase = await getSupabaseServerClient();
  const [incidentResult, vehicleResult] = await Promise.all([
    supabase.from("emergencies")
      .select("*, assigned_ambulance:ambulances(*), assigned_hospital:hospitals(*)")
      .in("status", ACTIVE_STATUSES).order("created_at", { ascending: true }),
    supabase.from("ambulances").select("*").order("vehicle_number", { ascending: true }),
  ]);
  if (incidentResult.error || vehicleResult.error)
    return NextResponse.json({ error: "Dispatch data unavailable" }, { status: 503 });
  return NextResponse.json({ emergencies: incidentResult.data ?? [], ambulances: vehicleResult.data ?? [] });
}

export async function POST(request: NextRequest) {
  const { user, response } = await dispatcher();
  if (response) return response;
  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object" || !["assign", "status", "release"].includes(body.action)
    || typeof body.emergency_id !== "string") {
    return NextResponse.json({ error: "Invalid dispatch request" }, { status: 400 });
  }
  if (body.action !== "status" && user!.role !== "DISPATCHER")
    return NextResponse.json({ error: "Only dispatchers may assign or release" }, { status: 403 });
  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase.rpc("dispatch_transition", {
    p_action: body.action,
    p_emergency_id: body.emergency_id,
    p_ambulance_id: typeof body.ambulance_id === "string" ? body.ambulance_id : null,
    p_status: typeof body.status === "string" ? body.status : null,
  });
  if (error) {
    const status = error.code === "42501" ? 403
      : error.code === "P0002" ? 404
      : ["23505", "23514"].includes(error.code) ? 409 : 503;
    return NextResponse.json({ error: "Dispatch operation rejected", code: error.code }, { status });
  }
  return NextResponse.json(data);
}
