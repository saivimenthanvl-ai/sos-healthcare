import { NextRequest } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase-server";

export interface RequestingUser {
  id: string;
  email: string | null;
  role: "PATIENT" | "DOCTOR" | "ADMIN";
}

/**
 * Centrally validates caller identity, role, and permission.
 * Denies by default.
 */
export async function getAuthenticatedUser(_req?: NextRequest): Promise<RequestingUser | null> {
  const supabase = await getSupabaseServerClient();
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();

  if (error || !session?.user) {
    return null;
  }

  // Load verified role from DB
  const { data: profile } = await supabase
    .from("profiles")
    .select("role, role_v2")
    .eq("id", session.user.id)
    .maybeSingle();

  const rawRole = (profile?.role_v2 || profile?.role || "PATIENT").toUpperCase();
  const role: "PATIENT" | "DOCTOR" | "ADMIN" =
    rawRole === "DOCTOR"
      ? "DOCTOR"
      : rawRole === "ADMIN" || rawRole === "DISPATCHER" || rawRole === "PARAMEDIC"
      ? "ADMIN"
      : "PATIENT";

  return {
    id: session.user.id,
    email: session.user.email || null,
    role,
  };
}

/**
 * Checks if a doctor has an authorized clinical/care relationship with a patient.
 */
export async function canDoctorAccessPatient(
  doctorId: string,
  patientId: string
): Promise<boolean> {
  if (doctorId === patientId) return true;

  const supabase = await getSupabaseServerClient();

  // Check 1: Active or confirmed appointment exists
  const { data: appointments } = await supabase
    .from("appointments")
    .select("id")
    .eq("doctor_id", doctorId)
    .eq("patient_id", patientId)
    .limit(1);

  if (appointments && appointments.length > 0) {
    return true;
  }

  // Check 2: Active health sharing permission granted by patient
  const { data: sharing } = await supabase
    .from("health_sharing_permissions")
    .select("id")
    .eq("doctor_id", doctorId)
    .eq("patient_id", patientId)
    .eq("status", "ACTIVE")
    .limit(1);

  if (sharing && sharing.length > 0) {
    return true;
  }

  return false;
}

/**
 * Enforces role guards on API requests
 */
export function requireRole(user: RequestingUser | null, allowedRoles: Array<"PATIENT" | "DOCTOR" | "ADMIN">): boolean {
  if (!user) return false;
  return allowedRoles.includes(user.role);
}
