/**
 * Shared domain types.
 *
 * Every component used to declare its own local `Emergency` / `Hospital`
 * interface, which meant two structurally different types with the same
 * name had to line up at every call site. Deriving them from the Database
 * type keeps a single source of truth.
 */
import type { Database } from "./supabase";
import type { UserRole } from "./supabase";

export type { UserRole };

export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type EmergencyRow = Database["public"]["Tables"]["emergencies"]["Row"];
export type AmbulanceRow = Database["public"]["Tables"]["ambulances"]["Row"];
export type HospitalRow = Database["public"]["Tables"]["hospitals"]["Row"];
export type ContactRow = Database["public"]["Tables"]["emergency_contacts"]["Row"];
export type AmbulancePingRow =
  Database["public"]["Tables"]["ambulance_locations"]["Row"];

export type EmergencyStatus = EmergencyRow["status"];
export type AmbulanceStatus = AmbulanceRow["status"];

export interface Coordinates {
  lat: number;
  lng: number;
}

/**
 * An emergency as consumed by the UI. Supabase joins come back with extra
 * nested relation keys, so the row type is intersected rather than replaced.
 */
export type Emergency = EmergencyRow & {
  assigned_ambulance?: Partial<AmbulanceRow> | null;
  assigned_hospital?: Partial<HospitalRow> | null;
};

export type Hospital = HospitalRow & { distance_km?: number };

export type Ambulance = AmbulanceRow;

export interface EmergencyContact {
  id: string;
  name: string;
  phone: string;
  relationship: string | null;
  notification_method: ContactRow["notification_method"];
  created_at: string;
}

export function isStaff(role: UserRole | null | undefined): boolean {
  return role === "paramedic" || role === "dispatcher";
}

export function isDispatcher(role: UserRole | null | undefined): boolean {
  return role === "dispatcher";
}

export const EMERGENCY_STATUS_LABELS: Record<EmergencyStatus, string> = {
  pending: "Awaiting Dispatch",
  dispatched: "Ambulance Dispatched",
  en_route: "Ambulance En Route",
  arrived: "Ambulance Arrived",
  resolved: "Resolved",
  cancelled: "Cancelled",
};

export const AMBULANCE_STATUS_LABELS: Record<AmbulanceStatus, string> = {
  available: "Available",
  dispatched: "Dispatched",
  en_route: "En Route",
  arrived: "Arrived",
  busy: "Busy",
};