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

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role, role_v2")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError || !profile) {
    console.error("[authorization] role lookup failed");
    return null;
  }

  const rawRole = String(profile.role_v2 || profile.role || "").toUpperCase();
  const allowed: SystemRole[] = ["PATIENT", "DOCTOR", "ADMIN", "PARAMEDIC", "DISPATCHER"];
  if (!allowed.includes(rawRole as SystemRole)) return null;
  const role = rawRole as SystemRole;

  return {
    id: user.id,
    email: user.email ?? null,
    role,
  };
}

export async function canDoctorAccessPatient(
  doctorId: string,
  patientId: string
): Promise<boolean> {
  if (doctorId === patientId) return false;

  const supabase = await getSupabaseServerClient();

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
}

export function requireRole(
  user: RequestingUser | null,
  allowedRoles: SystemRole[]
): boolean {
  return !!user && allowedRoles.includes(user.role);
}
