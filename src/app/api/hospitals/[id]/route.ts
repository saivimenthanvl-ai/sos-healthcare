import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase-server";
import type { Hospital } from "@/types/app";

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

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  if (!id) {
    return NextResponse.json({ error: "Hospital ID required" }, { status: 400 });
  }

  // 1. If UUID or standard Supabase ID, query Supabase
  if (!id.startsWith("osm-")) {
    try {
      const supabase = await getSupabaseServerClient();
      const { data, error } = await supabase
        .from("hospitals")
        .select("*")
        .eq("id", id)
        .single();

      if (!error && data) {
        const hospital: Hospital = {
          id: data.id,
          name: data.name,
          address: data.address,
          phone: data.phone || null,
          latitude: data.latitude,
          longitude: data.longitude,
          emergency_department: data.emergency_department ?? false,
          icu_beds: data.icu_beds ?? null,
          total_beds: data.total_beds ?? null,
          rating: data.rating ? Number(data.rating) : null,
          distance_from_user: null,
          created_at: data.created_at,
          website: sanitizeOfficialWebsite((data as { website?: string | null }).website || null),
          facility_type: classifyFacilityType(data.name),
          verification_status: "verified",
          data_source: "supabase",
          emergency_capability: data.emergency_department ? "confirmed_24_7" : "none",
          last_verified: data.created_at ? data.created_at.split("T")[0] : null,
        };
        return NextResponse.json({ hospital });
      }
    } catch (dbErr) {
      console.warn("[api/hospitals/[id]] DB query notice:", dbErr);
    }
  }

  // 2. If OSM record (e.g. osm-123456)
  if (id.startsWith("osm-")) {
    const rawOsmId = id.replace("osm-", "");
    try {
      // Try Nominatim lookup by place_id or osm_id
      const nomUrl = `https://nominatim.openstreetmap.org/details?place_id=${rawOsmId}&format=json`;
      const res = await fetch(nomUrl, {
        signal: AbortSignal.timeout(4000),
        headers: { "User-Agent": "SOSHealthcareApp/1.0" },
      });

      if (res.ok) {
        const details = await res.json();
        if (details && (details.centroid || details.localname)) {
          const lat = details.centroid?.coordinates?.[1] || 0;
          const lng = details.centroid?.coordinates?.[0] || 0;
          const name = details.localname || details.names?.name || "Hospital (OSM)";
          const address = details.calculated_address || details.display_name || "Address unverified (OpenStreetMap)";
          const extratags = details.extratags || {};
          const website = sanitizeOfficialWebsite(extratags.website || extratags["contact:website"] || null);

          const hospital: Hospital = {
            id,
            name,
            address,
            phone: extratags.phone || extratags["contact:phone"] || null,
            latitude: lat,
            longitude: lng,
            emergency_department: extratags.emergency === "yes",
            icu_beds: null,
            total_beds: null,
            rating: null,
            distance_from_user: null,
            created_at: new Date().toISOString(),
            website,
            facility_type: classifyFacilityType(name, extratags),
            verification_status: "unverified",
            data_source: "osm",
            emergency_capability: extratags.emergency === "yes" ? "confirmed_24_7" : "unconfirmed",
            last_verified: null,
          };
          return NextResponse.json({ hospital });
        }
      }
    } catch (osmErr) {
      console.warn("[api/hospitals/[id]] OSM lookup notice:", osmErr);
    }
  }

  return NextResponse.json({ error: "Hospital not found" }, { status: 404 });
}
