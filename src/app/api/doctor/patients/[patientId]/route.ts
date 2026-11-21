import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase-server";
import { getAuthenticatedUser, canDoctorAccessPatient } from "@/lib/authorization";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * GET /api/doctor/patients/[patientId]
 * Allows an authorized, verified doctor to retrieve the clinical summary of an assigned patient.
 * Strictly verifies:
 * 1. Authenticated DOCTOR or ADMIN role.
 * 2. Active clinical relationship via appointments or health_sharing_permissions.
 * 3. Never returns hardcoded fake measurements; loads real data from Supabase.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ patientId: string }> }
) {
  const user = await getAuthenticatedUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (user.role !== "DOCTOR" && user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden: Clinical access restricted to doctors and administrators." }, { status: 403 });
  }

  const { patientId } = await params;
  if (!patientId || !UUID_REGEX.test(patientId)) {
    return NextResponse.json({ error: "Invalid patient identifier" }, { status: 400 });
  }

  // Verify clinical access relationship
  if (user.role === "DOCTOR") {
    const hasAccess = await canDoctorAccessPatient(user.id, patientId);
    if (!hasAccess) {
      return NextResponse.json(
        { error: "Clinical Access Denied: No active care relationship, assigned appointment, or valid consent." },
        { status: 403 }
      );
    }
  }

  const supabase = await getSupabaseServerClient();

  try {
    // 1. Fetch patient profile details
    const { data: patientProfile, error: profileErr } = await supabase
      .from("patient_profiles")
      .select("height_cm, weight_kg, blood_group, pre_arrival_sharing_consent")
      .eq("user_id", patientId)
      .maybeSingle();

    if (profileErr) {
      console.warn("[doctor/patients/route] patient_profiles read notice:", profileErr.message);
    }

    // 2. Fetch latest health record vitals
    const { data: records, error: recordsErr } = await supabase
      .from("health_records")
      .select("systolic_bp, diastolic_bp, heart_rate, oxygen_saturation, body_temperature, temperature_unit, blood_group, allergies, medical_conditions, current_medications, recorded_at")
      .eq("patient_id", patientId)
      .order("recorded_at", { ascending: false })
      .limit(1);

    if (recordsErr) {
      console.warn("[doctor/patients/route] health_records read notice:", recordsErr.message);
    }

    const latest = records && records.length > 0 ? records[0] : null;

    return NextResponse.json({
      patientId,
      profile: {
        height: patientProfile?.height_cm != null ? String(patientProfile.height_cm) : null,
        weight: patientProfile?.weight_kg != null ? String(patientProfile.weight_kg) : null,
        bloodGroup: patientProfile?.blood_group || latest?.blood_group || null,
        preArrivalSharingConsent: Boolean(patientProfile?.pre_arrival_sharing_consent),
      },
      vitals: {
        systolic: latest?.systolic_bp != null ? String(latest.systolic_bp) : null,
        diastolic: latest?.diastolic_bp != null ? String(latest.diastolic_bp) : null,
        heartRate: latest?.heart_rate != null ? String(latest.heart_rate) : null,
        spO2: latest?.oxygen_saturation != null ? String(latest.oxygen_saturation) : null,
        temperature: latest?.body_temperature != null ? String(latest.body_temperature) : null,
        temperatureUnit: latest?.temperature_unit || "FAHRENHEIT",
        allergies: latest?.allergies || null,
        conditions: latest?.medical_conditions || null,
        medications: latest?.current_medications || null,
        recordedAt: latest?.recorded_at || null,
      },
    });
  } catch (err: unknown) {
    console.error("[doctor/patients/route] Unexpected error:", err);
    return NextResponse.json({ error: "Failed to load patient clinical summary" }, { status: 500 });
  }
}
