"use client";

import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import {
  APIProvider,
  Map as GoogleMap,
  useMap,
  useMapsLibrary,
  Marker,
  InfoWindow,
} from "@vis.gl/react-google-maps";
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
  encodedPolyline?: string | null;
  onMapClick?: (coords: Coordinates) => void;
  showRecenterButton?: boolean;
  accuracyRadiusMeters?: number | null;
  hasLocationFix?: boolean;
  selectedMarkerId?: string | null;
  onMarkerSelect?: (markerId: string | null) => void;
}

/**
 * Inner component to manage dynamic map features:
 * - 2D vs 3D vector tilt
 * - Accuracy circles
 * - Decoded route polyline overlays
 */
function MapEffects({
  center,
  zoom,
  hasLocationFix,
  accuracyRadiusMeters,
  encodedPolyline,
  mapMode,
}: {
  center: Coordinates;
  zoom: number;
  hasLocationFix?: boolean;
  accuracyRadiusMeters?: number | null;
  encodedPolyline?: string | null;
  mapMode: "2d" | "3d" | "streetview";
}) {
  const map = useMap();
  const geometry = useMapsLibrary("geometry");
  const polylineRef = useRef<google.maps.Polyline | null>(null);
  const accuracyCircleRef = useRef<google.maps.Circle | null>(null);

  // Sync mode tilt (2D vs 3D)
  useEffect(() => {
    if (!map) return;
    try {
      if (mapMode === "3d") {
        map.setTilt(45);
        map.setHeading(-17.6);
      } else if (mapMode === "2d") {
        map.setTilt(0);
        map.setHeading(0);
      }
    } catch (e) {
      console.warn("[GoogleMap tilt notice]:", e);
    }
  }, [map, mapMode]);

  // Render and update Accuracy Circle
  useEffect(() => {
    if (!map) return;

    if (hasLocationFix && accuracyRadiusMeters && accuracyRadiusMeters > 0) {
      if (!accuracyCircleRef.current) {
        accuracyCircleRef.current = new google.maps.Circle({
          strokeColor: "#2563eb",
          strokeOpacity: 0.6,
          strokeWeight: 1.5,
          fillColor: "#3b82f6",
          fillOpacity: 0.15,
          map,
          center: { lat: center.lat, lng: center.lng },
          radius: accuracyRadiusMeters,
          clickable: false,
        });
      } else {
        accuracyCircleRef.current.setCenter({ lat: center.lat, lng: center.lng });
        accuracyCircleRef.current.setRadius(accuracyRadiusMeters);
        accuracyCircleRef.current.setMap(map);
      }
    } else if (accuracyCircleRef.current) {
      accuracyCircleRef.current.setMap(null);
    }

    return () => {
      if (accuracyCircleRef.current) {
        accuracyCircleRef.current.setMap(null);
      }
    };
  }, [map, center.lat, center.lng, accuracyRadiusMeters, hasLocationFix]);

  // Decode and render route polyline
  useEffect(() => {
    if (!map) return;

    if (polylineRef.current) {
      polylineRef.current.setMap(null);
      polylineRef.current = null;
    }

    if (encodedPolyline && geometry) {
      try {
        const decodedPath = geometry.encoding.decodePath(encodedPolyline);
        polylineRef.current = new google.maps.Polyline({
          path: decodedPath,
          geodesic: true,
          strokeColor: "#1d4ed8",
          strokeOpacity: 0.9,
          strokeWeight: 5,
          map,
        });

        // Fit map bounds to show route clearly
        const bounds = new google.maps.LatLngBounds();
        decodedPath.forEach((pt) => bounds.extend(pt));
        map.fitBounds(bounds, { top: 60, right: 60, bottom: 60, left: 60 });
      } catch (err) {
        console.warn("[Polyline decode error]:", err);
      }
    }

    return () => {
      if (polylineRef.current) {
        polylineRef.current.setMap(null);
      }
    };
  }, [map, encodedPolyline, geometry]);

  return null;
}

/**
 * Dedicated Google Street View Component
 * Uses StreetViewService to check panorama availability and renders StreetViewPanorama.
 */
function StreetViewContainer({
  position,
  onClose,
}: {
  position: Coordinates;
  onClose: () => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const panoramaRef = useRef<google.maps.StreetViewPanorama | null>(null);
  const [unavailable, setUnavailable] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (!containerRef.current || typeof google === "undefined" || !google.maps) return;

    const svService = new google.maps.StreetViewService();
    const latLng = new google.maps.LatLng(position.lat, position.lng);

    svService.getPanorama({ location: latLng, radius: 100 }, (data, status) => {
      setChecking(false);
      if (status === google.maps.StreetViewStatus.OK && data?.location?.latLng) {
        setUnavailable(false);
        panoramaRef.current = new google.maps.StreetViewPanorama(containerRef.current!, {
          position: data.location.latLng,
          pov: { heading: 34, pitch: 10 },
          zoom: 1,
          addressControl: true,
          showRoadLabels: true,
          enableCloseButton: false,
        });
      } else {
        setUnavailable(true);
      }
    });

    return () => {
      if (panoramaRef.current) {
        panoramaRef.current.setVisible(false);
        panoramaRef.current = null;
      }
    };
  }, [position.lat, position.lng]);

  return (
    <div className="absolute inset-0 z-20 bg-gray-900 text-white flex flex-col">
      <div className="absolute top-3 right-3 z-30">
        <button
          type="button"
          onClick={onClose}
          className="bg-black/70 hover:bg-black text-white text-xs font-semibold px-3 py-1.5 rounded-full border border-gray-600 transition-colors shadow-md flex items-center gap-1"
        >
          ✕ Exit Street View
        </button>
      </div>

      <div ref={containerRef} className="w-full h-full" />

      {checking && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-950/80 text-xs text-gray-300">
          Checking Street View coverage…
        </div>
      )}

      {unavailable && !checking && (
        <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-gray-900/95 space-y-3">
          <p className="text-base font-bold text-gray-100">Street View Unavailable</p>
          <p className="text-xs text-gray-400 max-w-sm leading-relaxed">
            Street View imagery is not available for this immediate location. Standard 2D and 3D maps remain fully functional.
          </p>
          <button
            type="button"
            onClick={onClose}
            className="mt-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-2 rounded-lg transition-colors shadow"
          >
            Return to 2D Map
          </button>
        </div>
      )}
    </div>
  );
}

/**
 * Modern Google Maps street-level MapView powered by @vis.gl/react-google-maps.
 * Supports:
 * - 2D Map (Pitch 0, North-Up)
 * - 3D Map (Vector Tilt 45°, Rotated Heading)
 * - Interactive Street View (with StreetViewService availability checks)
 * - GPS beacon with accuracy circle
 * - Decoded driving route overlays
 */
export function MapView({
  center,
  markers,
  zoom = 15,
  className = "w-full h-125",
  encodedPolyline,
  onMapClick,
  showRecenterButton = true,
  accuracyRadiusMeters,
  hasLocationFix = true,
  selectedMarkerId,
  onMarkerSelect,
}: MapViewProps) {
  const [mapMode, setMapMode] = useState<"2d" | "3d" | "streetview">("2d");
  const [userHasPanned, setUserHasPanned] = useState(false);
  const [activeInfoWindowId, setActiveInfoWindowId] = useState<string | null>(null);

  const apiKey =
    process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ||
    "AIzaSyCbaz3JaBHR50jf3_AX_CkTvEkLx_1_zmA";

  const mapId = process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID || undefined;

  const handleRecenter = useCallback(() => {
    setUserHasPanned(false);
  }, []);

  const activeMarker = useMemo(() => {
    return markers.find((m) => m.id === (activeInfoWindowId || selectedMarkerId));
  }, [markers, activeInfoWindowId, selectedMarkerId]);

  if (!apiKey) {
    return (
      <div className={`relative rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center p-6 text-center text-xs text-gray-500 ${className}`}>
        Google Maps API key is not configured.
      </div>
    );
  }

  return (
    <div className={`relative rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-900 ${className}`}>
      <APIProvider apiKey={apiKey} libraries={["geometry", "marker"]}>
        <GoogleMap
          defaultCenter={{ lat: center.lat, lng: center.lng }}
          center={{ lat: center.lat, lng: center.lng }}
          defaultZoom={zoom}
          zoom={userHasPanned ? undefined : zoom}
          mapId={mapId}
          gestureHandling="greedy"
          disableDefaultUI={false}
          zoomControl={true}
          mapTypeControl={false}
          scaleControl={true}
          streetViewControl={false}
          rotateControl={true}
          fullscreenControl={false}
          onDragstart={() => setUserHasPanned(true)}
          onClick={(e) => {
            if (e.detail?.latLng && onMapClick) {
              onMapClick({ lat: e.detail.latLng.lat, lng: e.detail.latLng.lng });
            }
            setActiveInfoWindowId(null);
            onMarkerSelect?.(null);
          }}
          className="w-full h-full"
        >
          <MapEffects
            center={center}
            zoom={zoom}
            hasLocationFix={hasLocationFix}
            accuracyRadiusMeters={accuracyRadiusMeters}
            encodedPolyline={encodedPolyline}
            mapMode={mapMode}
          />

          {/* Render Map Markers */}
          {markers.map((marker) => {
            const isUser = marker.kind === "user";
            return (
              <Marker
                key={marker.id}
                position={{ lat: marker.position.lat, lng: marker.position.lng }}
                title={marker.title}
                onClick={() => {
                  setActiveInfoWindowId(marker.id);
                  onMarkerSelect?.(marker.id);
                }}
                icon={
                  isUser
                    ? {
                        path: google.maps.SymbolPath.CIRCLE,
                        scale: 8.5,
                        fillColor: "#2563eb",
                        fillOpacity: 1,
                        strokeColor: "#ffffff",
                        strokeWeight: 2.5,
                      }
                    : {
                        path: "M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z",
                        fillColor: marker.kind === "hospital" ? "#059669" : "#dc2626",
                        fillOpacity: 1,
                        strokeColor: "#ffffff",
                        strokeWeight: 1.5,
                        scale: 1.5,
                        anchor: new google.maps.Point(12, 22),
                      }
                }
              />
            );
          })}

          {/* Active InfoWindow for selected marker */}
          {activeMarker && (
            <InfoWindow
              position={{
                lat: activeMarker.position.lat,
                lng: activeMarker.position.lng,
              }}
              onCloseClick={() => {
                setActiveInfoWindowId(null);
                onMarkerSelect?.(null);
              }}
              pixelOffset={[0, activeMarker.kind === "user" ? -12 : -32]}
            >
              <div className="p-1 max-w-xs text-xs font-sans text-gray-900 leading-snug">
                <p className="font-bold text-sm mb-1">{activeMarker.title}</p>
                {activeMarker.info && (
                  <div
                    dangerouslySetInnerHTML={{ __html: activeMarker.info }}
                    className="text-gray-600 space-y-0.5"
                  />
                )}
              </div>
            </InfoWindow>
          )}
        </GoogleMap>

        {/* Street View Overlay Container */}
        {mapMode === "streetview" && (
          <StreetViewContainer
            position={activeMarker ? activeMarker.position : center}
            onClose={() => setMapMode("2d")}
          />
        )}
      </APIProvider>

      {/* 2D / 3D / Street View Segmented Control */}
      <div className="absolute top-3 left-3 z-10 flex items-center bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-0.5 text-xs font-semibold">
        <button
          type="button"
          onClick={() => setMapMode("2d")}
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
          onClick={() => setMapMode("3d")}
          className={`px-3 py-1 rounded-md transition-colors ${
            mapMode === "3d"
              ? "bg-blue-600 text-white shadow-sm"
              : "text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
          }`}
          aria-label="Switch to 3D view"
        >
          3D
        </button>
        <button
          type="button"
          onClick={() => setMapMode("streetview")}
          className={`px-3 py-1 rounded-md transition-colors ${
            mapMode === "streetview"
              ? "bg-blue-600 text-white shadow-sm"
              : "text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
          }`}
          aria-label="Switch to Street View"
        >
          Street View
        </button>
      </div>

      {/* Recenter Button when user has panned away */}
      {showRecenterButton && userHasPanned && mapMode !== "streetview" && (
        <button
          onClick={handleRecenter}
          className="absolute bottom-4 left-4 z-10 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 text-xs font-semibold px-3 py-1.5 rounded-full shadow-md border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center gap-1"
        >
          📍 Recenter on GPS
        </button>
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
      hospital.distance_km != null ? `<strong>${hospital.distance_km} km</strong> away` : null,
      hospital.phone ? `Phone: <a href="tel:${hospital.phone}" class="text-blue-600">${hospital.phone}</a>` : null,
      hospital.verification_status === "verified" ? "✓ Verified Hospital" : "Unverified Geographic Listing",
    ]
      .filter(Boolean)
      .join("<br/>"),
  };
}
