"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import * as maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
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
  routeCoordinates?: [number, number][]; // [lng, lat]
  onMapClick?: (coords: Coordinates) => void;
  showRecenterButton?: boolean;
}

const PIN_COLORS: Record<MapMarkerSpec["kind"], { fill: string; stroke: string }> = {
  hospital: { fill: "#10b981", stroke: "#065f4f" },
  ambulance: { fill: "#ef4444", stroke: "#7f1d1d" },
  user: { fill: "#3b82f6", stroke: "#ffffff" },
  emergency: { fill: "#dc2626", stroke: "#ffffff" },
};

export const OPENFREEMAP_STYLE = "https://tiles.openfreemap.org/styles/liberty";

/**
 * Free, open-source MapView powered by MapLibre GL JS + OpenFreeMap.
 * Zero Google Maps billing required.
 */
export function MapView({
  center,
  markers,
  zoom = 13,
  className = "w-full h-[500px]",
  routeCoordinates,
  onMapClick,
  showRecenterButton = true,
}: MapViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<Map<string, maplibregl.Marker>>(new Map());
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [userHasPanned, setUserHasPanned] = useState(false);

  // Serialise markers and route
  const markersKey = JSON.stringify(markers);
  const routeKey = JSON.stringify(routeCoordinates || []);

  // Initialize MapLibre
  useEffect(() => {
    if (!containerRef.current) return;
    let isCancelled = false;

    try {
      const map = new maplibregl.Map({
        container: containerRef.current,
        style: OPENFREEMAP_STYLE,
        center: [center.lng, center.lat],
        zoom,
        attributionControl: false,
      });

      map.addControl(
        new maplibregl.AttributionControl({
          compact: true,
          customAttribution: "© OpenStreetMap contributors | © OpenFreeMap",
        }),
        "bottom-right"
      );

      map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");

      map.on("load", () => {
        if (isCancelled) return;
        setStatus("ready");
      });

      map.on("error", (e: unknown) => {
        console.warn("[MapLibre notice]:", e);
      });

      map.on("dragstart", () => {
        setUserHasPanned(true);
      });

      if (onMapClick) {
        map.on("click", (e: { lngLat: { lat: number; lng: number } }) => {
          onMapClick({ lat: e.lngLat.lat, lng: e.lngLat.lng });
        });
      }

      mapRef.current = map;
    } catch (err) {
      console.error("[MapLibre init error]:", err);
      // Defer error state to avoid synchronous setState inside effect body
      setTimeout(() => {
        if (!isCancelled) setStatus("error");
      }, 0);
    }

    return () => {
      isCancelled = true;
      markersRef.current.forEach((m) => m.remove());
      markersRef.current.clear();
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []); // Run once on mount

  // Update Markers
  useEffect(() => {
    const map = mapRef.current;
    if (!map || status !== "ready") return;

    const specs: MapMarkerSpec[] = JSON.parse(markersKey);
    const currentKeys = new Set(specs.map((s) => s.id));

    // Remove obsolete markers
    markersRef.current.forEach((marker, id) => {
      if (!currentKeys.has(id)) {
        marker.remove();
        markersRef.current.delete(id);
      }
    });

    // Add or update markers
    specs.forEach((spec) => {
      let marker = markersRef.current.get(spec.id);
      const color = PIN_COLORS[spec.kind];

      if (!marker) {
        // Create custom DOM element for marker
        const el = document.createElement("div");
        el.className = "sos-map-marker";
        el.style.width = spec.kind === "user" ? "22px" : "28px";
        el.style.height = spec.kind === "user" ? "22px" : "28px";
        el.style.borderRadius = "50%";
        el.style.backgroundColor = color.fill;
        el.style.border = `2.5px solid ${color.stroke}`;
        el.style.boxShadow = "0 2px 6px rgba(0,0,0,0.35)";
        el.style.cursor = spec.info ? "pointer" : "default";

        marker = new maplibregl.Marker({ element: el })
          .setLngLat([spec.position.lng, spec.position.lat])
          .addTo(map);

        if (spec.info) {
          const popup = new maplibregl.Popup({ offset: 25 }).setHTML(
            `<div style="padding:6px;font-size:13px;font-family:sans-serif;"><strong>${spec.title}</strong><br/>${spec.info}</div>`
          );
          marker.setPopup(popup);
        }

        markersRef.current.set(spec.id, marker);
      } else {
        marker.setLngLat([spec.position.lng, spec.position.lat]);
      }
    });
  }, [markersKey, status]);

  // Update Route Polyline
  useEffect(() => {
    const map = mapRef.current;
    if (!map || status !== "ready") return;

    const coords: [number, number][] = JSON.parse(routeKey);

    const sourceId = "route-source";
    const layerId = "route-layer";

    if (coords.length >= 2) {
      const geojson: GeoJSON.Feature<GeoJSON.LineString> = {
        type: "Feature",
        properties: {},
        geometry: {
          type: "LineString",
          coordinates: coords,
        },
      };

      if (map.getSource(sourceId)) {
        (map.getSource(sourceId) as maplibregl.GeoJSONSource).setData(geojson);
      } else {
        map.addSource(sourceId, {
          type: "geojson",
          data: geojson,
        });

        map.addLayer({
          id: layerId,
          type: "line",
          source: sourceId,
          layout: {
            "line-join": "round",
            "line-cap": "round",
          },
          paint: {
            "line-color": "#3b82f6",
            "line-width": 4.5,
            "line-opacity": 0.85,
          },
        });
      }
    } else {
      if (map.getLayer(layerId)) map.removeLayer(layerId);
      if (map.getSource(sourceId)) map.removeSource(sourceId);
    }
  }, [routeKey, status]);

  const handleRecenter = useCallback(() => {
    if (mapRef.current) {
      mapRef.current.flyTo({
        center: [center.lng, center.lat],
        zoom,
        essential: true,
      });
      setUserHasPanned(false);
    }
  }, [center.lat, center.lng, zoom]);

  return (
    <div className={`relative rounded-lg overflow-hidden bg-gray-100 ${className}`}>
      <div ref={containerRef} className="w-full h-full" />

      {/* Recenter Button when user has panned away */}
      {showRecenterButton && userHasPanned && status === "ready" && (
        <button
          onClick={handleRecenter}
          className="absolute bottom-4 left-4 z-10 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 text-xs font-semibold px-3 py-1.5 rounded-full shadow-md border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        >
          📍 Recenter
        </button>
      )}

      {/* Loading state */}
      {status === "loading" && (
        <div className="absolute inset-0 flex items-center justify-center text-sm text-gray-500 bg-gray-100 dark:bg-gray-900">
          Loading OpenFreeMap…
        </div>
      )}

      {/* Error state */}
      {status === "error" && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 p-4 text-center text-sm text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-900">
          <span className="font-semibold text-gray-800 dark:text-gray-100">Map unavailable</span>
          <span>Could not render OpenFreeMap tiles. Hospital and location directory remain functional.</span>
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
      hospital.phone ? `Phone: ${hospital.phone}` : null,
    ]
      .filter(Boolean)
      .join("<br/>"),
  };
}
