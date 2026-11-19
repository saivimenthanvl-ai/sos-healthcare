import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase-server";
import { getAuthenticatedUser } from "@/lib/authorization";

interface DoctorProfileQueryRow {
  user_id: string;
  specialization: string;
  hospital_id: string | null;
  hospital_name: string | null;
  experience_years: number | null;
  consultation_hours: string | null;
  profiles: {
    full_name: string | null;
    email: string | null;
  } | null;
}

interface DoctorAvailabilityRow {
  doctor_id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  slot_duration_minutes: number | null;
  is_active: boolean;
}

/**
 * GET /api/doctors — List verified doctors and their real schedules
 * Strictly queries database-backed approved doctor records.
 * Never fabricates or returns hardcoded specialists when no approved doctors exist.
 */
export async function GET(request: NextRequest) {
  const user = await getAuthenticatedUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = await getSupabaseServerClient();

  try {
    // 1. Query verified doctor profiles with profile join
    const { data: dbDoctors, error: docError } = await supabase
      .from("doctor_profiles")
      .select("user_id, specialization, hospital_id, hospital_name, experience_years, consultation_hours, profiles:user_id(full_name, email)")
      .eq("verification_status", "VERIFIED");

    if (docError) {
      console.warn("[doctors/route] Query notice:", docError.message);
      return NextResponse.json({ doctors: [] });
    }

    if (!dbDoctors || dbDoctors.length === 0) {
      return NextResponse.json({ doctors: [] });
    }

    const doctorIds = dbDoctors.map((d) => d.user_id);

    // 2. Query active availability slots for these verified doctors
    const { data: dbAvailability, error: availError } = await supabase
      .from("doctor_availability")
      .select("doctor_id, day_of_week, start_time, end_time, slot_duration_minutes, is_active")
      .in("doctor_id", doctorIds)
      .eq("is_active", true);

    if (availError) {
      console.warn("[doctors/route] Availability query notice:", availError.message);
    }

    const availabilityByDoctor = new Map<string, string[]>();

    if (dbAvailability && dbAvailability.length > 0) {
      for (const row of dbAvailability as DoctorAvailabilityRow[]) {
        const slots = availabilityByDoctor.get(row.doctor_id) || [];
        // Format slot display (e.g., "09:00 - 12:00")
        const formattedSlot = `${row.start_time.slice(0, 5)} - ${row.end_time.slice(0, 5)}`;
        if (!slots.includes(formattedSlot)) {
          slots.push(formattedSlot);
        }
        availabilityByDoctor.set(row.doctor_id, slots);
      }
    }

    const doctors = (dbDoctors as unknown as DoctorProfileQueryRow[]).map((doc) => {
      const activeSlots = availabilityByDoctor.get(doc.user_id) || [];
      return {
        id: doc.user_id,
        name: doc.profiles?.full_name ? `Dr. ${doc.profiles.full_name}` : "Clinical Specialist",
        specialty: doc.specialization,
        hospitalId: doc.hospital_id,
        hospital: doc.hospital_name || "SOS Healthcare Network",
        experienceYears: doc.experience_years ?? 0,
        consultationHours: doc.consultation_hours || (activeSlots.length > 0 ? activeSlots.join(", ") : "By Appointment"),
        availableSlots: activeSlots,
      };
    });

    return NextResponse.json({ doctors });
  } catch (err: unknown) {
    console.error("[doctors/route] unexpected error:", err);
    return NextResponse.json({ doctors: [] });
  }
}
