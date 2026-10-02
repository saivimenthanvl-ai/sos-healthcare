"use client";

import { useEffect, useRef, useState } from "react";
import { loadGoogleMaps } from "@/lib/google-maps";
import type { Coordinates, Hospital } from "@/types/app";

export interface MapMarkerSpec {
  id: string;
  position: Coordinates;
  title: string;
  kind: "hospital" | "user" | "ambulance" | "emergency";
  info?: string;
}

interface MapViewProps {
  center: Coordinates;
  markers: MapMarkerSpec[];
  zoom?: number;
  className?: string;
}

const PIN_COLORS: Record<MapMarkerSpec["kind"], { fill: string; stroke: string }> = {
  hospital: { fill: "#10b981", stroke: "#065f4f" },
  ambulance: { fill: "#ef4444", stroke: "#7f1d1d" },
  user: { fill: "#3b82f6", stroke: "#ffffff" },
  emergency: { fill: "#dc2626", stroke: "#ffffff" },
};

/**
 * Thin wrapper around the Google Maps JS API.
 *
 * Markers are rebuilt whenever `markers` changes identity, so callers should
 * memoise the array (or rely on the shallow JSON signature below) to avoid
 * tearing down and recreating the map on every render.
 */
export function MapView({
  center,
  markers,
  zoom = 13,
  className = "w-full h-[500px]",
}: MapViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const overlayRef = useRef<google.maps.Marker[]>([]);
  const infoWindowRef = useRef<google.maps.InfoWindow | null>(null);

  // Tracks the last camera we actually applied, so a marker-only update does
  // not yank the map back to `center` after the user has panned away.
  const appliedCameraRef = useRef<string | null>(null);

  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");

  // Serialise so the effect only re-runs when the marker set really changes.
  const markersKey = JSON.stringify(markers);
  const centerKey = `${center.lat},${center.lng},${zoom}`;

  useEffect(() => {
    if (!containerRef.current) return;
    let cancelled = false;

    const init = async () => {
      try {
        const google = await loadGoogleMaps();
        if (cancelled || !containerRef.current) return;

        if (!mapRef.current) {
          mapRef.current = new google.maps.Map(containerRef.current, {
            center: { lat: center.lat, lng: center.lng },
            zoom,
            mapTypeControl: false,
            streetViewControl: false,
            fullscreenControl: false,
          });
          infoWindowRef.current = new google.maps.InfoWindow();
          appliedCameraRef.current = centerKey;
        }

        const map = mapRef.current;

        // Only move the camera when it has genuinely changed. This effect also
        // runs for marker-only updates, and re-centring on those would undo
        // any panning the user did.
        if (appliedCameraRef.current !== centerKey) {
          const [lat, lng] = centerKey.split(",");
          map.setCenter({ lat: Number(lat), lng: Number(lng) });
          map.setZoom(zoom);
          appliedCameraRef.current = centerKey;
        }

        // Clear the previous overlay.
        overlayRef.current.forEach((marker) => marker.setMap(null));
        overlayRef.current = [];

        const specs: MapMarkerSpec[] = JSON.parse(markersKey);

        specs.forEach((spec) => {
          const color = PIN_COLORS[spec.kind];
          const marker = new google.maps.Marker({
            position: { lat: spec.position.lat, lng: spec.position.lng },
            map,
            title: spec.title,
            icon: {
              path: google.maps.SymbolPath.BACKWARD_CLOSED_ARROW,
              fillColor: color.fill,
              fillOpacity: 0.95,
              strokeColor: color.stroke,
              strokeWeight: 2,
              scale: spec.kind === "user" ? 8 : 11,
            },
          });

          if (spec.info && infoWindowRef.current) {
            const info = infoWindowRef.current;
            marker.addListener("click", () => {
              info.setContent(
                `<div style="padding:6px;font-size:13px"><strong>${spec.title}</strong><br/>${spec.info}</div>`
              );
              info.open(map, marker);
            });
          }

          overlayRef.current.push(marker);
        });

        if (!cancelled) setStatus("ready");
      } catch (error) {
        console.error("Map init error:", error);
        if (!cancelled) setStatus("error");
      }
    };

    void init();

    return () => {
      cancelled = true;
    };
    // `markers` and `center` are read through their serialised keys so an
    // inline array literal does not tear down the map on every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [markersKey, centerKey]);

  // Drop the map instance when the component goes away.
  useEffect(() => {
    return () => {
      overlayRef.current.forEach((marker) => marker.setMap(null));
      overlayRef.current = [];
      mapRef.current = null;
    };
  }, []);

  return (
    <div className={`relative rounded-lg overflow-hidden bg-gray-100 ${className}`}>
      <div ref={containerRef} className="w-full h-full" />

      {/* Surface load failures instead of leaving a blank grey box: a missing
          or unauthorised API key otherwise looks identical to a slow map. */}
      {status === "loading" && (
        <div className="absolute inset-0 flex items-center justify-center text-sm text-gray-500 bg-gray-100">
          Loading map…
        </div>
      )}

      {status === "error" && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 p-4 text-center text-sm text-gray-600 bg-gray-100">
          <span className="font-medium text-gray-800">Map unavailable</span>
          <span>
            Check that the Maps JavaScript API is enabled and that the key is
            valid for this domain.
          </span>
        </div>
      )}
    </div>
  );
}

/** Build a marker spec for a hospital result. */
export function hospitalMarker(hospital: Hospital): MapMarkerSpec {
  return {
    id: `hospital-${hospital.id}`,
    position: { lat: hospital.latitude, lng: hospital.longitude },
    title: hospital.name,
    kind: "hospital",
    info: [
      hospital.address,
      hospital.distance_km != null ? `${hospital.distance_km} km away` : null,
    ]
      .filter(Boolean)
      .join("<br/>"),
  };
}