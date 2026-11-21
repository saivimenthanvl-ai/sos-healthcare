/**
 * Geographic coordinate representations and mathematical calculations.
 * Completely free of external mapping libraries.
 */

export interface Coordinates {
  lat: number;
  lng: number;
}

export interface LocationFix {
  latitude: number;
  longitude: number;
  accuracyMeters: number;
  timestamp: number;
  source: "browser" | "manual";
}

/**
 * Validates whether numeric coordinates fall within valid geographic bounds:
 * Latitude: [-90, 90]
 * Longitude: [-180, 180]
 */
export function isValidCoordinate(lat: number | null | undefined, lng: number | null | undefined): boolean {
  if (lat == null || lng == null) return false;
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return false;
  if (lat < -90 || lat > 90) return false;
  if (lng < -180 || lng > 180) return false;
  return true;
}

/**
 * Calculate straight-line distance between two coordinates in kilometers using Haversine formula.
 */
export function calculateDistance(coord1: Coordinates, coord2: Coordinates): number {
  if (!isValidCoordinate(coord1.lat, coord1.lng) || !isValidCoordinate(coord2.lat, coord2.lng)) {
    return 0;
  }
  const R = 6371; // Earth's radius in km
  const dLat = toRad(coord2.lat - coord1.lat);
  const dLng = toRad(coord2.lng - coord1.lng);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(coord1.lat)) *
      Math.cos(toRad(coord2.lat)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return parseFloat((R * c).toFixed(1));
}

function toRad(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

/**
 * Estimate travel time in minutes based on distance and average urban speed (40 km/h).
 * Note: This is an unverified straight-line heuristic and must not be claimed as a guaranteed road ETA.
 */
export function calculateETA(distanceKm: number): number {
  if (distanceKm <= 0) return 0;
  const avgSpeedKmH = 40; // average city speed heuristic
  return Math.ceil((distanceKm / avgSpeedKmH) * 60);
}
