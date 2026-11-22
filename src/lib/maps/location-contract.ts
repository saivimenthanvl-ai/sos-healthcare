/**
 * Shared Single Location Data Contract.
 * Ensures consistent coordinate typing, origin/destination clarity,
 * and eliminates hardcoded fake coordinates across the application.
 */

export interface Coordinates {
  lat: number;
  lng: number;
}

export interface LocationFix {
  coordinates: Coordinates;
  accuracyMeters: number | null;
  timestamp: number;
  source: "browser" | "manual";
}

export interface HospitalLocation {
  id: string;
  name: string;
  address: string | null;
  coordinates: Coordinates;
  website: string | null;
  phone: string | null;
  source: string;
  verificationStatus: "verified" | "unverified";
}

export function isValidCoordinate(lat?: number | null, lng?: number | null): boolean {
  if (lat == null || lng == null) return false;
  return (
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180
  );
}

export function areCoordinatesEqual(c1?: Coordinates | null, c2?: Coordinates | null, precision = 5): boolean {
  if (!c1 || !c2) return false;
  return (
    c1.lat.toFixed(precision) === c2.lat.toFixed(precision) &&
    c1.lng.toFixed(precision) === c2.lng.toFixed(precision)
  );
}
