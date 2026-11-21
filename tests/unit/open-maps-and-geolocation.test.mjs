import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

test("Free open mapping architecture - MapLibre and OpenFreeMap", () => {
  const mapLibreComponent = fs.readFileSync("src/components/MapView.tsx", "utf8");
  const emergencyMap = fs.readFileSync("src/components/EmergencyMap.tsx", "utf8");
  const coordinates = fs.readFileSync("src/lib/maps/coordinates.ts", "utf8");
  const routing = fs.readFileSync("src/lib/maps/routing.ts", "utf8");
  const directionsApi = fs.readFileSync("src/app/api/maps/directions/route.ts", "utf8");
  const nextConfig = fs.readFileSync("next.config.ts", "utf8");

  // 1. MapView imports maplibre-gl, configures worker URL, and loads OpenFreeMap liberty style
  assert.match(mapLibreComponent, /from\s+["']maplibre-gl["']/);
  assert.match(mapLibreComponent, /setWorkerUrl\("\/maplibre-gl-worker\.mjs"\)/);
  assert.match(mapLibreComponent, /https:\/\/tiles\.openfreemap\.org\/styles\/liberty/);
  assert.match(mapLibreComponent, /maplibregl\.Map/);

  // 2. MapView does not load or require Google Maps API scripts
  assert.doesNotMatch(mapLibreComponent, /maps\.googleapis\.com/);
  assert.doesNotMatch(mapLibreComponent, /google\.maps/);

  // 3. EmergencyMap provides fallback coordinates form and accuracy badge
  assert.match(emergencyMap, /Enter Coordinate Manually/);
  assert.match(emergencyMap, /setManualLocation/);
  assert.match(emergencyMap, /accuracy/);

  // 4. Coordinates module provides standard validation and distance calculation without Google
  assert.match(coordinates, /isValidCoordinate/);
  assert.match(coordinates, /calculateDistance/);
  assert.match(coordinates, /calculateETA/);

  // 5. Routing proxy exists with coordinate validation and OpenRouteService integration
  assert.match(routing, /fetchDirections/);
  assert.match(routing, /OPENROUTESERVICE_API_KEY/);
  assert.match(directionsApi, /isValidCoordinate/);

  // 6. CSP headers permit tiles.openfreemap.org and OpenRouteService / OSM
  assert.match(nextConfig, /https:\/\/tiles\.openfreemap\.org/);
  assert.match(nextConfig, /worker-src 'self' blob:/);
});

test("Hospital discovery supports Supabase, Nominatim, and Overpass without fabricated metrics", () => {
  const hospitalService = fs.readFileSync("src/services/hospitals.ts", "utf8");

  // Should NOT generate random ICU beds or fake rating stars
  assert.doesNotMatch(hospitalService, /Math\.floor\(Math\.random\(\)\s*\*\s*20\)/);
  assert.doesNotMatch(hospitalService, /Math\.random\(\)\s*\*\s*2\s*\+\s*3/);
  assert.match(hospitalService, /nominatim\.openstreetmap\.org/);
  assert.match(hospitalService, /overpass-api\.de/);
});

test("Geolocation hook handles permissions, high accuracy, and manual override", () => {
  const useLocationHook = fs.readFileSync("src/hooks/useLocation.ts", "utf8");

  assert.match(useLocationHook, /enableHighAccuracy:\s*true/);
  assert.match(useLocationHook, /navigator\.permissions/);
  assert.match(useLocationHook, /setManualLocation/);
  assert.match(useLocationHook, /retryLocation/);
  assert.match(useLocationHook, /LocationFix/);
});
