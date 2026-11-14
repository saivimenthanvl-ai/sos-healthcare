import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase-server";
import { getAuthenticatedUser } from "@/lib/authorization";

/**
 * POST /api/auth/export-data
 * Allows an authenticated patient to securely export their authorized personal data records.
 * Excludes internal credentials, password hashes, and third-party secrets.
 */
export async function POST() {
  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = await getSupabaseServerClient();

  try {
    const [
      profileRes,
      emergenciesRes,
      appointmentRequestsRes,
      appointmentsRes,
      contactsRes,
      devicesRes,
    ] = await Promise.all([
      supabase.from("profiles").select("id, full_name, email, phone, emergency_contact_name, emergency_contact_phone, medical_conditions, allergies, blood_type, created_at, updated_at").eq("id", user.id).maybeSingle(),
      supabase.from("emergencies").select("id, latitude, longitude, status, description, created_at, updated_at").eq("user_id", user.id),
      supabase.from("appointment_requests").select("id, hospital_name_snapshot, specialty, consultation_type, consultation_mode, preferred_starts_at, timezone, notes, status, created_at, updated_at, cancelled_at").eq("patient_id", user.id),
      supabase.from("appointments").select("id, specialty, hospital_name, starts_at, ends_at, reason, status, created_at").eq("patient_id", user.id),
      supabase.from("emergency_contacts").select("id, name, phone, relationship, notification_method, created_at").eq("user_id", user.id),
      supabase.from("device_connections").select("id, provider, device_name, status, last_sync_at, created_at").eq("user_id", user.id),
    ]);

    const exportBundle = {
      exportMetadata: {
        platform: "SOS Healthcare",
        exportedAt: new Date().toISOString(),
        userId: user.id,
        userEmail: user.email,
        formatVersion: "1.0",
        notice: "This archive contains your personal health preferences and records stored in SOS Healthcare.",
      },
      profile: profileRes.data || null,
      emergencyIncidents: emergenciesRes.data || [],
      privateAppointmentRequests: appointmentRequestsRes.data || [],
      specialistAppointments: appointmentsRes.data || [],
      emergencyContacts: contactsRes.data || [],
      deviceConnections: devicesRes.data || [],
    };

    return NextResponse.json({ success: true, data: exportBundle });
  } catch (err: unknown) {
    console.error("[api/auth/export-data] export error:", err);
    return NextResponse.json(
      { error: "Failed to generate personal data export. Please try again." },
      { status: 500 }
    );
  }
}
