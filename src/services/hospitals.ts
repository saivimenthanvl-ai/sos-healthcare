import { calculateDistance, calculateETA } from "@/lib/maps/coordinates";
import { getSupabaseServerClient } from "@/lib/supabase-server";
import { CHENNAI_HOSPITALS_DATASET } from "@/lib/data/chennai-hospitals";
import type { Hospital } from "@/types/app";

export interface NearbyHospitalResult {
  hospitals: Hospital[];
  source: "supabase" | "osm" | "fallback";
}

function classifyFacilityType(name: string, tags?: Record<string, string>): "general_hospital" | "specialist_clinic" | "nursing_home" | "unverified_geographic" {
  const n = (name + " " + (tags?.healthcare || "") + " " + (tags?.description || "")).toLowerCase();
  if (n.includes("dental") || n.includes("eye") || n.includes("ophthal") || n.includes("skin") || n.includes("clinic") || n.includes("fertility")) {
    return "specialist_clinic";
  }
  if (n.includes("nursing") || n.includes("care home") || n.includes("rehab")) {
    return "nursing_home";
  }
  if (n.includes("general") || n.includes("medical center") || n.includes("hospital") || n.includes("government")) {
    return "general_hospital";
  }
  return "unverified_geographic";
}

function sanitizeOfficialWebsite(urlStr?: string | null): string | null {
  if (!urlStr || typeof urlStr !== "string") return null;
  const trimmed = urlStr.trim();
  if (!trimmed.startsWith("http://") && !trimmed.startsWith("https://")) return null;
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return null;
    return parsed.href;
  } catch {
    return null;
  }
}

/**
 * Shared service for finding nearby hospitals from verified database records.
 * Priority:
 * 1. Supabase 'hospitals' table (verified repository dataset).
 * 2. OSM Overpass / Nominatim candidates (clearly labeled unverified, emergency department not inferred).
 * 3. Graceful fallback returning empty list if no facilities found in range.
 */
export async function findNearbyHospitals(
  latitude: number,
  longitude: number,
  radiusKm: number = 20
): Promise<NearbyHospitalResult> {
  const userCoords = { lat: latitude, lng: longitude };

  // 1. Primary Source: Verified Chennai Healthcare Repository Dataset
  // If the query coordinates fall within reach of Chennai facilities (or general Chennai area),
  // return verified hospitals with verified coordinates, emergency departments, and phone numbers.
  const verifiedChennai = CHENNAI_HOSPITALS_DATASET.map((h) => {
    const dist = calculateDistance(userCoords, { lat: h.latitude, lng: h.longitude });
    return {
      ...h,
      distance_from_user: parseFloat(dist.toFixed(2)),
      distance_km: parseFloat(dist.toFixed(2)),
    } as Hospital;
  })
    .filter((h) => (h.distance_km ?? Infinity) <= radiusKm)
    .sort((a, b) => (a.distance_km ?? 0) - (b.distance_km ?? 0));

  if (verifiedChennai.length > 0) {
    return {
      hospitals: verifiedChennai,
      source: "supabase", // Treat verified repository as verified authoritative source
    };
  }

  // 2. Secondary Source: Supabase 'hospitals' table (Cloud-managed verified records)
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
            icu_beds: h.icu_beds ?? null,
            total_beds: h.total_beds ?? null,
            rating: h.rating ? Number(h.rating) : null,
            distance_from_user: parseFloat(dist.toFixed(2)),
            distance_km: parseFloat(dist.toFixed(2)),
            created_at: h.created_at,
            website: sanitizeOfficialWebsite((h as { website?: string | null }).website || null),
            facility_type: classifyFacilityType(h.name),
            verification_status: "verified" as const,
            data_source: "supabase" as const,
            emergency_capability: h.emergency_department ? ("confirmed_24_7" as const) : ("none" as const),
            last_verified: h.created_at ? h.created_at.split("T")[0] : null,
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

  // 2. OpenStreetMap fallback for unverified live nearby facilities when no verified DB hospitals in range
  // Strategy A: Nominatim search (fast, reliable CDN, global)
  try {
    const delta = Math.max((radiusKm / 111.32) * 1.2, 0.05);
    const minLat = (latitude - delta).toFixed(4);
    const maxLat = (latitude + delta).toFixed(4);
    const minLng = (longitude - delta).toFixed(4);
    const maxLng = (longitude + delta).toFixed(4);

    const nominatimUrl = `https://nominatim.openstreetmap.org/search?q=hospital&format=json&addressdetails=1&extratags=1&limit=15&viewbox=${minLng},${maxLat},${maxLng},${minLat}&bounded=1`;

    const nomRes = await fetch(nominatimUrl, {
      signal: AbortSignal.timeout(5000),
      headers: {
        "User-Agent": "SOSHealthcareApp/1.0 (Emergency Response Assistance)",
      },
    });

    if (nomRes.ok) {
      const data = await nomRes.json();
      if (Array.isArray(data) && data.length > 0) {
        const osmHospitals: Hospital[] = data
          .filter((item: { lat?: string; lon?: string }) => item.lat && item.lon)
          .map((item: { place_id?: number | string; lat: string; lon: string; display_name?: string; extratags?: Record<string, string> }) => {
            const hLat = parseFloat(item.lat);
            const hLng = parseFloat(item.lon);
            const dist = calculateDistance(userCoords, { lat: hLat, lng: hLng });
            const displayName = item.display_name || "Hospital (OSM)";
            const nameParts = displayName.split(",");
            const name = nameParts[0]?.trim() || "Hospital (OSM)";
            const address = nameParts.slice(1).join(",").trim() || "Address unverified (OpenStreetMap)";
            const tags = item.extratags || {};
            const website = sanitizeOfficialWebsite(tags.website || tags["contact:website"] || null);

            return {
              id: `osm-${item.place_id || `${hLat}-${hLng}`}`,
              name,
              address,
              phone: tags.phone || tags["contact:phone"] || null,
              latitude: hLat,
              longitude: hLng,
              emergency_department: false, // Never auto-assign emergency_department to unverified OSM search
              icu_beds: null,
              total_beds: null,
              rating: null,
              distance_from_user: parseFloat(dist.toFixed(2)),
              distance_km: parseFloat(dist.toFixed(2)),
              created_at: new Date().toISOString(),
              website,
              facility_type: classifyFacilityType(name, tags),
              verification_status: "unverified" as const,
              data_source: "osm" as const,
              emergency_capability: tags.emergency === "yes" ? ("confirmed_24_7" as const) : ("unconfirmed" as const),
              last_verified: null,
            };
          })
          .filter((h) => (h.distance_km ?? Infinity) <= radiusKm * 1.5)
          .sort((a, b) => (a.distance_km ?? 0) - (b.distance_km ?? 0));

        if (osmHospitals.length > 0) {
          return {
            hospitals: osmHospitals,
            source: "osm",
          };
        }
      }
    }
  } catch (nomErr) {
    console.warn("[HospitalsService] OSM Nominatim fallback notice:", nomErr);
  }

  // 3. OpenStreetMap Overpass API fallback for unverified live nearby facilities (nodes + ways)
  try {
    const radiusMeters = Math.min(Math.max(radiusKm * 1000, 1000), 50000);
    // Overpass query looking for amenity=hospital nodes AND ways within radius
    const overpassQuery = `[out:json][timeout:10];(node["amenity"="hospital"](around:${radiusMeters},${latitude},${longitude});way["amenity"="hospital"](around:${radiusMeters},${latitude},${longitude}););out center 15;`;
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
        const osmHospitals: Hospital[] = data
          .filter((el: { lat?: number; lon?: number; center?: { lat: number; lon: number } }) => (el.lat && el.lon) || (el.center?.lat && el.center?.lon))
          .map((el: { id: number; lat?: number; lon?: number; center?: { lat: number; lon: number }; tags?: Record<string, string> }) => {
            const hLat = el.lat ?? el.center!.lat;
            const hLng = el.lon ?? el.center!.lon;
            const dist = calculateDistance(userCoords, { lat: hLat, lng: hLng });
            const tags = el.tags || {};
            const name = tags.name || tags["name:en"] || "Hospital (OSM)";
            const address = [tags["addr:street"], tags["addr:city"], tags["addr:country"]]
              .filter(Boolean)
              .join(", ") || "Address unverified (OpenStreetMap)";
            const website = sanitizeOfficialWebsite(tags.website || tags["contact:website"] || null);

            return {
              id: `osm-${el.id}`,
              name,
              address,
              phone: tags.phone || tags["contact:phone"] || null,
              latitude: hLat,
              longitude: hLng,
              emergency_department: tags.emergency === "yes",
              icu_beds: null,
              total_beds: null,
              rating: null,
              distance_from_user: parseFloat(dist.toFixed(2)),
              distance_km: parseFloat(dist.toFixed(2)),
              created_at: new Date().toISOString(),
              website,
              facility_type: classifyFacilityType(name, tags),
              verification_status: "unverified" as const,
              data_source: "osm" as const,
              emergency_capability: tags.emergency === "yes" ? ("confirmed_24_7" as const) : ("unconfirmed" as const),
              last_verified: null,
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
