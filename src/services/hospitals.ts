import { calculateDistance, calculateETA } from "@/lib/maps/coordinates";
import { getSupabaseServerClient } from "@/lib/supabase-server";
import type { Hospital } from "@/types/app";

export interface NearbyHospitalResult {
  hospitals: Hospital[];
  source: "supabase" | "osm" | "fallback";
}

/**
 * Shared service for finding nearby hospitals from verified database records.
 * Priority:
 * 1. Supabase 'hospitals' table (verified repository dataset).
 * 2. OSM Overpass fallback when database is empty (strictly unverified markers, no fake beds or fake ratings).
 * 3. Graceful fallback returning empty list if no facilities found in range.
 */
export async function findNearbyHospitals(
  latitude: number,
  longitude: number,
  radiusKm: number = 20
): Promise<NearbyHospitalResult> {
  const userCoords = { lat: latitude, lng: longitude };

  // 1. Primary Source: Supabase 'hospitals' table
  try {
    const supabase = await getSupabaseServerClient();
    const { data: dbHospitals, error } = await supabase
      .from("hospitals")
      .select("*")
      .limit(100);

    if (!error && dbHospitals && dbHospitals.length > 0) {
      const hospitals: Hospital[] = dbHospitals
        .map((h) => {
          const dist = calculateDistance(userCoords, { lat: h.latitude, lng: h.longitude });
          return {
            id: h.id,
            name: h.name,
            address: h.address,
            phone: h.phone || null,
            latitude: h.latitude,
            longitude: h.longitude,
            emergency_department: h.emergency_department ?? false,
            icu_beds: h.icu_beds ?? 0,
            total_beds: h.total_beds ?? 0,
            rating: h.rating ? Number(h.rating) : null,
            distance_from_user: parseFloat(dist.toFixed(2)),
            distance_km: parseFloat(dist.toFixed(2)),
            created_at: h.created_at,
          };
        })
        .filter((h) => (h.distance_km ?? Infinity) <= radiusKm)
        .sort((a, b) => (a.distance_km ?? 0) - (b.distance_km ?? 0));

      if (hospitals.length > 0) {
        return {
          hospitals,
          source: "supabase",
        };
      }
    }
  } catch (err) {
    console.warn("[HospitalsService] Supabase query notice:", err);
  }

  // 2. OpenStreetMap Overpass API fallback for unverified live nearby facilities
  try {
    const radiusMeters = Math.min(Math.max(radiusKm * 1000, 1000), 50000);
    // Overpass query looking for amenity=hospital within radius
    const overpassQuery = `[out:json][timeout:10];node["amenity"="hospital"](around:${radiusMeters},${latitude},${longitude});out 15;`;
    const overpassUrl = `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(overpassQuery)}`;

    const response = await fetch(overpassUrl, {
      signal: AbortSignal.timeout(6000),
      headers: {
        "User-Agent": "SOSHealthcareApp/1.0",
      },
    });

    if (response.ok) {
      const data = await response.json();
      if (data.elements && Array.isArray(data.elements) && data.elements.length > 0) {
        const osmHospitals: Hospital[] = data.elements
          .filter((el: { lat?: number; lon?: number }) => el.lat && el.lon)
          .map((el: { id: number; lat: number; lon: number; tags?: Record<string, string> }) => {
            const hLat = el.lat;
            const hLng = el.lon;
            const dist = calculateDistance(userCoords, { lat: hLat, lng: hLng });
            const tags = el.tags || {};
            const name = tags.name || tags["name:en"] || "Hospital (OSM)";
            const address = [tags["addr:street"], tags["addr:city"], tags["addr:country"]]
              .filter(Boolean)
              .join(", ") || "Address unverified (OpenStreetMap)";

            return {
              id: `osm-${el.id}`,
              name,
              address,
              phone: tags.phone || tags["contact:phone"] || null,
              latitude: hLat,
              longitude: hLng,
              emergency_department: tags.emergency === "yes",
              icu_beds: 0, // Never fabricate bed counts
              total_beds: 0,
              rating: null, // Never fabricate ratings
              distance_from_user: parseFloat(dist.toFixed(2)),
              distance_km: parseFloat(dist.toFixed(2)),
              created_at: new Date().toISOString(),
            };
          })
          .sort((a: Hospital, b: Hospital) => (a.distance_km ?? 0) - (b.distance_km ?? 0));

        return {
          hospitals: osmHospitals,
          source: "osm",
        };
      }
    }
  } catch (osmErr) {
    console.warn("[HospitalsService] OSM Overpass fallback notice:", osmErr);
  }

  return {
    hospitals: [],
    source: "fallback",
  };
}

export { calculateDistance, calculateETA };
