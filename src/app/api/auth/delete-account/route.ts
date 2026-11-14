import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase-server";
import { getAuthenticatedUser } from "@/lib/authorization";

/**
 * POST /api/auth/delete-account
 * Secure, coordinated account deletion workflow.
 * 1. Authenticates requesting user.
 * 2. Cleans up user-owned records (appointment requests, emergency contacts, profile).
 * 3. Signs out the user session.
 */
export async function POST(request: Request) {
  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  if (!body || body.confirmation !== "DELETE_MY_ACCOUNT") {
    return NextResponse.json(
      { error: "Explicit confirmation required. Please confirm deletion to proceed." },
      { status: 400 }
    );
  }

  const supabase = await getSupabaseServerClient();

  try {
    // 1. Delete user-owned appointment requests
    await supabase.from("appointment_requests").delete().eq("patient_id", user.id);

    // 2. Delete user-owned emergency contacts
    await supabase.from("emergency_contacts").delete().eq("user_id", user.id);

    // 3. Delete user-owned device connections
    await supabase.from("device_connections").delete().eq("user_id", user.id);

    // 4. Anonymize/Clear profile personal data
    await supabase
      .from("profiles")
      .update({
        full_name: "Deleted User",
        phone: null,
        emergency_contact_name: null,
        emergency_contact_phone: null,
        medical_conditions: null,
        allergies: null,
        blood_type: null,
        smartwatch_connected: false,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id);

    // 5. Sign out the session
    await supabase.auth.signOut();

    return NextResponse.json({
      success: true,
      message: "Your account data has been successfully deleted and active sessions invalidated.",
      receipt: {
        userId: user.id,
        deletedAt: new Date().toISOString(),
        status: "COMPLETED",
      },
    });
  } catch (err: unknown) {
    console.error("[api/auth/delete-account] deletion error:", err);
    return NextResponse.json(
      { error: "Failed to complete account deletion. Please contact administrator at admin@soshospital.com." },
      { status: 500 }
    );
  }
}
