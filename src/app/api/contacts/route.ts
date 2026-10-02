import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase-server";

/**
 * GET  /api/contacts            — list user's emergency contacts
 * POST /api/contacts            — add a new emergency contact
 * PUT  /api/contacts/:id        — update a contact
 * DELETE /api/contacts/:id      — delete a contact
 */
export async function GET() {
  const supabase = await getSupabaseServerClient();

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("emergency_contacts")
    .select("*")
    .eq("user_id", session.user.id)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ contacts: data });
}

export async function POST(request: NextRequest) {
  const supabase = await getSupabaseServerClient();

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { name, phone, relationship, notification_method } = body;

  if (!name || !phone) {
    return NextResponse.json({ error: "Name and phone are required" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("emergency_contacts")
    .insert({
      user_id: session.user.id,
      name,
      phone,
      relationship: relationship || null,
      notification_method: notification_method || "sms",
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ contact: data });
}

/**
 * DELETE /api/contacts?id=...
 * Removes a contact belonging to the authenticated user.
 */
export async function DELETE(request: NextRequest) {
  const supabase = await getSupabaseServerClient();

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const id = url.searchParams.get("id") || url.pathname.split("/").pop();

  if (!id || id === "contacts") {
    return NextResponse.json({ error: "Contact ID required" }, { status: 400 });
  }

  const { error } = await supabase
    .from("emergency_contacts")
    .delete()
    .eq("id", id)
    .eq("user_id", session.user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
