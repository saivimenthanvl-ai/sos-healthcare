import { NextRequest } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase-server";

export type SystemRole =
  | "PATIENT"
  | "DOCTOR"
  | "ADMIN"
  | "PARAMEDIC"
  | "DISPATCHER";

export interface RequestingUser {
  id: string;
  email: string | null;
  role: SystemRole;
}

/**
 * Centrally validates caller identity from Supabase Auth and loads the role
 * from the database. getUser() validates the JWT with the Auth server;
 * getSession() alone must not be used as the authorization boundary.
 */
export async function getAuthenticatedUser(_req?: NextRequest): Promise<RequestingUser | null> {
  const supabase = await getSupabaseServerClient();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) return null;

  try {
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role, role_v2")
      .eq("id", user.id)
      .maybeSingle();

    if (!profileError && profile) {
      const rawRole = String(profile.role_v2 || profile.role || "PATIENT").toUpperCase();
      const allowed: SystemRole[] = ["PATIENT", "DOCTOR", "ADMIN", "PARAMEDIC", "DISPATCHER"];
      if (allowed.includes(rawRole as SystemRole)) {
        return {
          id: user.id,
          email: user.email ?? null,
          role: rawRole as SystemRole,
        };
      }
    }
  } catch (lookupErr) {
    console.warn("[authorization] profiles lookup warning:", lookupErr);
  }

  // If profiles table has not yet received migration or user row is being provisioned,
  // allow legitimate authenticated users with verified Supabase Auth JWT default role of PATIENT
  const userMetadataRole = (user.user_metadata?.role as string)?.toUpperCase();
  const allowed: SystemRole[] = ["PATIENT", "DOCTOR", "ADMIN", "PARAMEDIC", "DISPATCHER"];
  const finalRole: SystemRole = allowed.includes(userMetadataRole as SystemRole)
    ? (userMetadataRole as SystemRole)
    : "PATIENT";

  return {
    id: user.id,
    email: user.email ?? null,
    role: finalRole,
  };
}

export async function canDoctorAccessPatient(
  doctorId: string,
  patientId: string
): Promise<boolean> {
  if (doctorId === patientId) return false;

  const supabase = await getSupabaseServerClient();

  try {
    const { data: appointments } = await supabase
      .from("appointments")
      .select("id")
      .eq("doctor_id", doctorId)
      .eq("patient_id", patientId)
      .in("status", ["PENDING", "CONFIRMED"])
      .limit(1);

    if (appointments?.length) return true;

    const { data: sharing } = await supabase
      .from("health_sharing_permissions")
      .select("id, expires_at")
      .eq("doctor_id", doctorId)
      .eq("patient_id", patientId)
      .eq("status", "ACTIVE")
      .limit(1);

    const permission = sharing?.[0];
    if (!permission) return false;
    return !permission.expires_at || new Date(permission.expires_at).getTime() > Date.now();
  } catch {
    return false;
  }
}
