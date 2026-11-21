import { Coordinates } from "./coordinates";

export interface DirectionsRequest {
  origin: Coordinates;
  destination: Coordinates;
  profile?: "driving-car" | "cycling-regular" | "foot-walking";
}

export interface DirectionsResult {
  coordinates: [number, number][]; // [lng, lat] GeoJSON format
  distanceMeters: number;
  durationSeconds: number;
  source: "openrouteservice" | "straight-line-fallback";
  warning?: string;
}

// In-memory cache for recent route calculations to preserve ORS free-tier limits (key -> { result, expiresAt })
const routeCache = new Map<string, { result: DirectionsResult; expiresAt: number }>();
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes

/**
 * Fetch directions via OpenRouteService (server-side only)
 * Follows ORS v2 API: POST https://api.openrouteservice.org/v2/directions/{profile}/geojson
 * Body format: coordinates: [[startLng, startLat], [endLng, endLat]]
 */
export async function fetchDirections(req: DirectionsRequest): Promise<DirectionsResult> {
  const profile = req.profile || "driving-car";
  const { origin, destination } = req;

  const cacheKey = `${profile}:${origin.lat.toFixed(5)},${origin.lng.toFixed(5)}->${destination.lat.toFixed(5)},${destination.lng.toFixed(5)}`;
  const cached = routeCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.result;
  }

  const apiKey = process.env.OPENROUTESERVICE_API_KEY;

  if (apiKey) {
    try {
      const url = `https://api.openrouteservice.org/v2/directions/${profile}/geojson`;
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: apiKey,
        },
        body: JSON.stringify({
          // OpenRouteService expects [longitude, latitude]
          coordinates: [
            [origin.lng, origin.lat],
            [destination.lng, destination.lat],
          ],
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const feature = data.features?.[0];
        if (feature) {
          const coords: [number, number][] = feature.geometry?.coordinates || [];
          const summary = feature.properties?.summary;
          const result: DirectionsResult = {
            coordinates: coords,
            distanceMeters: summary?.distance || 0,
            durationSeconds: summary?.duration || 0,
            source: "openrouteservice",
          };

          routeCache.set(cacheKey, { result, expiresAt: Date.now() + CACHE_TTL_MS });
          return result;
        }
      } else {
        const errorText = await response.text();
        console.warn("[Routing] OpenRouteService error response:", response.status, errorText);
      }
    } catch (err) {
      console.warn("[Routing] OpenRouteService fetch error:", err);
    }
  }

  // Graceful fallback to direct 2-point line when ORS is unconfigured, rate-limited, or offline
  const fallbackResult: DirectionsResult = {
    coordinates: [
      [origin.lng, origin.lat],
      [destination.lng, destination.lat],
    ],
    distanceMeters: 0,
    durationSeconds: 0,
    source: "straight-line-fallback",
    warning: "Turn-by-turn routing currently unavailable. Showing direct route.",
  };

  return fallbackResult;
}
