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
  accuracyRadiusMeters?: number | null;
  hasLocationFix?: boolean;
}

const PIN_COLORS: Record<MapMarkerSpec["kind"], { fill: string; stroke: string }> = {
  hospital: { fill: "#10b981", stroke: "#065f4f" },
  ambulance: { fill: "#ef4444", stroke: "#7f1d1d" },
  user: { fill: "#3b82f6", stroke: "#ffffff" },
  emergency: { fill: "#dc2626", stroke: "#ffffff" },
};

// Configure static same-origin worker URL for MapLibre GL JS to prevent Turbopack/bundler URL resolution failure
if (typeof window !== "undefined") {
  maplibregl.setWorkerUrl("/maplibre-gl-worker.mjs");
}

export const OPENFREEMAP_STYLE = "https://tiles.openfreemap.org/styles/liberty";

/**
 * Free, open-source MapView powered by MapLibre GL JS + OpenFreeMap.
 * Supports smooth 2D and 3D building extrusion modes with zero Google Maps billing required.
 */
export function MapView({
  center,
  markers,
  zoom = 13,
  className = "w-full h-125",
  routeCoordinates,
  onMapClick,
  showRecenterButton = true,
  accuracyRadiusMeters,
  hasLocationFix = true,
}: MapViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<Map<string, maplibregl.Marker>>(new Map());
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [userHasPanned, setUserHasPanned] = useState(false);
  const [mapMode, setMapMode] = useState<"2d" | "3d">("2d");
  const [modeNotice, setModeNotice] = useState<string | null>(null);

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
        pitch: 0,
        bearing: 0,
        attributionControl: false,
      });

      map.addControl(
        new maplibregl.AttributionControl({
          compact: true,
          customAttribution: "© OpenStreetMap contributors | © OpenFreeMap",
        }),
        "bottom-right"
      );

      map.addControl(new maplibregl.NavigationControl({ showCompass: true }), "top-right");

      map.on("load", () => {
        if (isCancelled) return;
        setStatus("ready");
      });

      map.on("error", (e: unknown) => {
        console.warn("[MapLibre notice]:", e);
        const errObj = e as { error?: { message?: string }; message?: string } | undefined;
        const msg = String(errObj?.error?.message || errObj?.message || "");
        if (msg.toLowerCase().includes("worker") || msg.toLowerCase().includes("failed to fetch")) {
          setTimeout(() => {
            if (!isCancelled) setStatus("error");
          }, 0);
        }
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
      setTimeout(() => {
        if (!isCancelled) setStatus("error");
      }, 0);
    }

    const markersMap = markersRef.current;

    return () => {
      isCancelled = true;
      markersMap.forEach((m) => m.remove());
      markersMap.clear();
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []); // Run once on mount

  // Toggle 2D / 3D Mode
  const handleToggleMode = useCallback(
    (newMode: "2d" | "3d") => {
      const map = mapRef.current;
      if (!map || status !== "ready") return;

      setModeNotice(null);

      try {
        if (newMode === "3d") {
          // Check WebGL extrusion support
          map.easeTo({
            pitch: 55,
            bearing: -17.6,
            duration: 1000,
          });

          // OpenFreeMap includes a 'building-3d' layer with fill-extrusion in its Liberty style
          if (map.getLayer("building-3d")) {
            map.setLayoutProperty("building-3d", "visibility", "visible");
          }
          if (map.getLayer("building")) {
            map.setLayoutProperty("building", "visibility", "none");
          }
          setMapMode("3d");
        } else {
          map.easeTo({
            pitch: 0,
            bearing: 0,
            duration: 1000,
          });

          if (map.getLayer("building-3d")) {
            map.setLayoutProperty("building-3d", "visibility", "none");
          }
          if (map.getLayer("building")) {
            map.setLayoutProperty("building", "visibility", "visible");
          }
          setMapMode("2d");
        }
      } catch (err) {
        console.warn("[MapView mode toggle fallback]:", err);
        setModeNotice("3D rendering unsupported on this hardware; falling back to 2D view.");
        setMapMode("2d");
      }
    },
    [status]
  );

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

  // Update Accuracy Circle if provided
  useEffect(() => {
    const map = mapRef.current;
    if (!map || status !== "ready") return;

    const accSourceId = "accuracy-source";
    const accLayerId = "accuracy-layer";

    if (hasLocationFix && accuracyRadiusMeters && accuracyRadiusMeters > 0) {
      // Create a 32-point polygon approximating accuracy radius
      const points = 32;
      const coords: [number, number][] = [];
      const km = accuracyRadiusMeters / 1000;
      const distanceX = km / (111.32 * Math.cos((center.lat * Math.PI) / 180));
      const distanceY = km / 110.574;

      for (let i = 0; i < points; i++) {
        const theta = (i / points) * (2 * Math.PI);
        const x = distanceX * Math.cos(theta);
        const y = distanceY * Math.sin(theta);
        coords.push([center.lng + x, center.lat + y]);
      }
      coords.push(coords[0]); // close polygon

      const geojson: GeoJSON.Feature<GeoJSON.Polygon> = {
        type: "Feature",
        properties: {},
        geometry: {
          type: "Polygon",
          coordinates: [coords],
        },
      };

      if (map.getSource(accSourceId)) {
        (map.getSource(accSourceId) as maplibregl.GeoJSONSource).setData(geojson);
      } else {
        map.addSource(accSourceId, {
          type: "geojson",
          data: geojson,
        });

        map.addLayer(
          {
            id: accLayerId,
            type: "fill",
            source: accSourceId,
            paint: {
              "fill-color": "#3b82f6",
              "fill-opacity": 0.15,
              "fill-outline-color": "#2563eb",
            },
          },
          map.getLayer("route-layer") ? "route-layer" : undefined
        );
      }
    } else {
      if (map.getLayer(accLayerId)) map.removeLayer(accLayerId);
      if (map.getSource(accSourceId)) map.removeSource(accSourceId);
    }
  }, [center.lat, center.lng, accuracyRadiusMeters, hasLocationFix, status]);

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

      {/* 2D / 3D Segmented Control */}
      <div className="absolute top-3 left-3 z-10 flex items-center bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-0.5 text-xs font-semibold">
        <button
          type="button"
          onClick={() => handleToggleMode("2d")}
          className={`px-3 py-1 rounded-md transition-colors ${
            mapMode === "2d"
              ? "bg-blue-600 text-white shadow-sm"
              : "text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
          }`}
          aria-label="Switch to 2D view"
        >
          2D
        </button>
        <button
          type="button"
          onClick={() => handleToggleMode("3d")}
          className={`px-3 py-1 rounded-md transition-colors ${
            mapMode === "3d"
              ? "bg-blue-600 text-white shadow-sm"
              : "text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
          }`}
          aria-label="Switch to 3D buildings view"
        >
          3D
        </button>
      </div>

      {/* Recenter Button when user has panned away */}
      {showRecenterButton && userHasPanned && status === "ready" && (
        <button
          onClick={handleRecenter}
          className="absolute bottom-4 left-4 z-10 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 text-xs font-semibold px-3 py-1.5 rounded-full shadow-md border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        >
          📍 Recenter
        </button>
      )}

      {/* Mode fallback notice */}
      {modeNotice && (
        <div className="absolute top-12 left-3 z-10 bg-amber-50 dark:bg-amber-950/80 text-amber-800 dark:text-amber-200 text-xs px-2.5 py-1.5 rounded shadow border border-amber-200">
          {modeNotice}
        </div>
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
      hospital.verification_status === "verified" ? "Verified Hospital" : "Unverified Geographic Listing",
    ]
      .filter(Boolean)
      .join("<br/>"),
  };
}
