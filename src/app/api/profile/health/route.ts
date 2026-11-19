import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase-server";
import { getAuthenticatedUser } from "@/lib/authorization";

const ALLOWED_BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-", "UNKNOWN", ""];

/**
 * GET /api/profile/health
 * Loads the authenticated patient's:
 * 1. Physical profile from public.patient_profiles (height_cm, weight_kg, blood_group, pre_arrival_sharing_consent)
 * 2. Latest clinical vital signs and medical history from public.health_records
 */
export async function GET(request: NextRequest) {
  const user = await getAuthenticatedUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = await getSupabaseServerClient();

  try {
    // 1. Fetch patient profile
    const { data: patientProfile, error: profileErr } = await supabase
      .from("patient_profiles")
      .select("height_cm, weight_kg, blood_group, pre_arrival_sharing_consent")
      .eq("user_id", user.id)
      .maybeSingle();

    if (profileErr) {
      console.warn("[profile/health/route] patient_profiles read notice:", profileErr.message);
    }

    // 2. Fetch latest health record
    const { data: latestRecord, error: recordErr } = await supabase
      .from("health_records")
      .select("systolic_bp, diastolic_bp, heart_rate, oxygen_saturation, body_temperature, blood_group, allergies, medical_conditions, current_medications, recorded_at")
      .eq("patient_id", user.id)
      .order("recorded_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (recordErr) {
      console.warn("[profile/health/route] health_records read notice:", recordErr.message);
    }

    const sharingConsent = Boolean(patientProfile?.pre_arrival_sharing_consent);

    return NextResponse.json({
      height: patientProfile?.height_cm != null ? String(patientProfile.height_cm) : "",
      weight: patientProfile?.weight_kg != null ? String(patientProfile.weight_kg) : "",
      bloodGroup: patientProfile?.blood_group || latestRecord?.blood_group || "",
      systolic: latestRecord?.systolic_bp != null ? String(latestRecord.systolic_bp) : "",
      diastolic: latestRecord?.diastolic_bp != null ? String(latestRecord.diastolic_bp) : "",
      heartRate: latestRecord?.heart_rate != null ? String(latestRecord.heart_rate) : "",
      spO2: latestRecord?.oxygen_saturation != null ? String(latestRecord.oxygen_saturation) : "",
      temperature: latestRecord?.body_temperature != null ? String(latestRecord.body_temperature) : "",
      allergies: latestRecord?.allergies || "",
      conditions: latestRecord?.medical_conditions || "",
      medications: latestRecord?.current_medications || "",
      sharingConsent,
    });
  } catch (err: unknown) {
    console.error("[profile/health/route] Unexpected error:", err);
    return NextResponse.json({ error: "Failed to load health profile" }, { status: 500 });
  }
}

/**
 * PUT /api/profile/health
 * Persists updated physical measurements, clinical vitals, medical history, and sharing consent.
 */
export async function PUT(request: NextRequest) {
  const user = await getAuthenticatedUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const {
    height,
    weight,
    bloodGroup,
    systolic,
    diastolic,
    heartRate,
    spO2,
    temperature,
    allergies,
    conditions,
    medications,
    sharingConsent,
  } = body;

  // Validation
  let parsedHeight: number | null = null;
  if (height !== undefined && height !== null && String(height).trim() !== "") {
    parsedHeight = Number(height);
    if (!Number.isFinite(parsedHeight) || parsedHeight < 30 || parsedHeight > 300) {
      return NextResponse.json({ error: "Height must be between 30 cm and 300 cm" }, { status: 422 });
    }
  }

  let parsedWeight: number | null = null;
  if (weight !== undefined && weight !== null && String(weight).trim() !== "") {
    parsedWeight = Number(weight);
    if (!Number.isFinite(parsedWeight) || parsedWeight < 2 || parsedWeight > 500) {
      return NextResponse.json({ error: "Weight must be between 2 kg and 500 kg" }, { status: 422 });
    }
  }

  const normalizedBloodGroup = typeof bloodGroup === "string" ? bloodGroup.trim().toUpperCase() : "";
  if (normalizedBloodGroup && !ALLOWED_BLOOD_GROUPS.includes(normalizedBloodGroup)) {
    return NextResponse.json({ error: "Invalid blood group format (e.g. O+, A-, B+)" }, { status: 422 });
  }

  let parsedSystolic: number | null = null;
  if (systolic !== undefined && systolic !== null && String(systolic).trim() !== "") {
    parsedSystolic = Math.round(Number(systolic));
    if (!Number.isFinite(parsedSystolic) || parsedSystolic < 40 || parsedSystolic > 300) {
      return NextResponse.json({ error: "Systolic blood pressure must be between 40 and 300 mmHg" }, { status: 422 });
    }
  }

  let parsedDiastolic: number | null = null;
  if (diastolic !== undefined && diastolic !== null && String(diastolic).trim() !== "") {
    parsedDiastolic = Math.round(Number(diastolic));
    if (!Number.isFinite(parsedDiastolic) || parsedDiastolic < 20 || parsedDiastolic > 200) {
      return NextResponse.json({ error: "Diastolic blood pressure must be between 20 and 200 mmHg" }, { status: 422 });
    }
  }

  let parsedHeartRate: number | null = null;
  if (heartRate !== undefined && heartRate !== null && String(heartRate).trim() !== "") {
    parsedHeartRate = Math.round(Number(heartRate));
    if (!Number.isFinite(parsedHeartRate) || parsedHeartRate < 20 || parsedHeartRate > 300) {
      return NextResponse.json({ error: "Heart rate must be between 20 and 300 BPM" }, { status: 422 });
    }
  }

  let parsedSpO2: number | null = null;
  if (spO2 !== undefined && spO2 !== null && String(spO2).trim() !== "") {
    parsedSpO2 = Math.round(Number(spO2));
    if (!Number.isFinite(parsedSpO2) || parsedSpO2 < 50 || parsedSpO2 > 100) {
      return NextResponse.json({ error: "Oxygen saturation (SpO2) must be between 50% and 100%" }, { status: 422 });
    }
  }

  let parsedTemp: number | null = null;
  if (temperature !== undefined && temperature !== null && String(temperature).trim() !== "") {
    parsedTemp = Number(temperature);
    if (!Number.isFinite(parsedTemp) || parsedTemp < 80 || parsedTemp > 115) {
      return NextResponse.json({ error: "Body temperature must be between 80°F and 115°F" }, { status: 422 });
    }
  }

  const cleanAllergies = typeof allergies === "string" ? allergies.trim().slice(0, 1000) : null;
  const cleanConditions = typeof conditions === "string" ? conditions.trim().slice(0, 1000) : null;
  const cleanMedications = typeof medications === "string" ? medications.trim().slice(0, 1000) : null;

  const supabase = await getSupabaseServerClient();

  try {
    // 1. Upsert patient_profiles (height, weight, blood_group, pre_arrival_sharing_consent)
    const { error: profileUpsertErr } = await supabase
      .from("patient_profiles")
      .upsert(
        {
          user_id: user.id,
          height_cm: parsedHeight,
          weight_kg: parsedWeight,
          blood_group: normalizedBloodGroup || null,
          pre_arrival_sharing_consent: Boolean(sharingConsent),
          sharing_consent_updated_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id" }
      );

    if (profileUpsertErr) {
      console.error("[profile/health/route] patient_profiles upsert failed:", profileUpsertErr);
      return NextResponse.json({ error: "Failed to persist physical measurements" }, { status: 500 });
    }

    // 2. Insert snapshot into health_records
    const hasVitalsOrHistory =
      parsedSystolic !== null ||
      parsedDiastolic !== null ||
      parsedHeartRate !== null ||
      parsedSpO2 !== null ||
      parsedTemp !== null ||
      Boolean(cleanAllergies) ||
      Boolean(cleanConditions) ||
      Boolean(cleanMedications) ||
      Boolean(normalizedBloodGroup);

    if (hasVitalsOrHistory) {
      const { error: recordInsertErr } = await supabase
        .from("health_records")
        .insert({
          patient_id: user.id,
          systolic_bp: parsedSystolic,
          diastolic_bp: parsedDiastolic,
          heart_rate: parsedHeartRate,
          oxygen_saturation: parsedSpO2,
          body_temperature: parsedTemp,
          blood_group: normalizedBloodGroup || null,
          allergies: cleanAllergies,
          medical_conditions: cleanConditions,
          current_medications: cleanMedications,
          source: "PATIENT_ENTERED",
          recorded_at: new Date().toISOString(),
        });

      if (recordInsertErr) {
        console.error("[profile/health/route] health_records insert failed:", recordInsertErr);
        return NextResponse.json({ error: "Failed to persist clinical records" }, { status: 500 });
      }
    }

    return NextResponse.json({ success: true, message: "Health profile updated successfully" }, { status: 200 });
  } catch (err: unknown) {
    console.error("[profile/health/route] PUT unexpected error:", err);
    return NextResponse.json({ error: "Service unavailable. Could not save health profile." }, { status: 503 });
  }
}
