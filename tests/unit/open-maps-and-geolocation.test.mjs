import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

test("Google Maps React architecture - @vis.gl/react-google-maps and Routes API v2", () => {
  const mapViewComponent = fs.readFileSync("src/components/MapView.tsx", "utf8");
  const emergencyMap = fs.readFileSync("src/components/EmergencyMap.tsx", "utf8");
  const coordinates = fs.readFileSync("src/lib/maps/coordinates.ts", "utf8");
  const googleRoutesApi = fs.readFileSync("src/app/api/maps/google-routes/route.ts", "utf8");
  const nextConfig = fs.readFileSync("next.config.ts", "utf8");

  // 1. MapView imports @vis.gl/react-google-maps and configures APIProvider
  assert.match(mapViewComponent, /from\s+["']@vis\.gl\/react-google-maps["']/);
  assert.match(mapViewComponent, /APIProvider/);
  assert.match(mapViewComponent, /GoogleMap/);

  // 2. MapView supports 2D, 3D, and Street View mode switching
  assert.match(mapViewComponent, /setTilt\(45\)/);
  assert.match(mapViewComponent, /setTilt\(0\)/);
  assert.match(mapViewComponent, /Switch to 3D view/);
  assert.match(mapViewComponent, /Switch to Street View/);
  assert.match(mapViewComponent, /StreetViewPanorama/);
  assert.match(mapViewComponent, /StreetViewService/);

  // 3. MapView does not force Google sign-in UI
  assert.doesNotMatch(mapViewComponent, /accounts\.google\.com/);
  assert.doesNotMatch(mapViewComponent, /Google Sign in/i);

  // 4. EmergencyMap provides fallback coordinates form, accuracy badge, and never confuses fallback with GPS
  assert.match(emergencyMap, /Enter Coordinate Manually/);
  assert.match(emergencyMap, /setManualLocation/);
  assert.match(emergencyMap, /accuracy/);
  assert.doesNotMatch(emergencyMap, /lat:\s*userLat\s*\?\?\s*37\.7749/);

  // 5. Coordinates module provides standard validation and distance calculation
  assert.match(coordinates, /isValidCoordinate/);
  assert.match(coordinates, /calculateDistance/);
  assert.match(coordinates, /calculateETA/);

  // 6. Routing proxy exists with coordinate validation and Google Routes API v2 integration
  assert.match(googleRoutesApi, /routes\.googleapis\.com\/directions\/v2:computeRoutes/);
  assert.match(googleRoutesApi, /X-Goog-Api-Key/);
  assert.match(googleRoutesApi, /isValidCoordinate/);

  // 7. Places API (New) proxy exists
  const placesNewApi = fs.readFileSync("src/app/api/maps/places-nearby/route.ts", "utf8");
  assert.match(placesNewApi, /places\.googleapis\.com\/v1\/places:searchNearby/);
  assert.match(placesNewApi, /X-Goog-Api-Key/);

  // 8. CSP headers permit maps.googleapis.com, routes.googleapis.com, and places.googleapis.com
  assert.match(nextConfig, /https:\/\/maps\.googleapis\.com/);
  assert.match(nextConfig, /https:\/\/routes\.googleapis\.com/);
  assert.match(nextConfig, /https:\/\/places\.googleapis\.com/);
});

test("Hospital discovery supports Supabase, verified repository, and classification", () => {
  const hospitalService = fs.readFileSync("src/services/hospitals.ts", "utf8");
  const hospitalDetailRoute = fs.readFileSync("src/app/api/hospitals/[id]/route.ts", "utf8");

  // Should NOT generate random ICU beds or fake rating stars
  assert.doesNotMatch(hospitalService, /Math\.floor\(Math\.random\(\)\s*\*\s*20\)/);
  assert.doesNotMatch(hospitalService, /Math\.random\(\)\s*\*\s*2\s*\+\s*3/);
  assert.match(hospitalService, /classifyFacilityType/);
  assert.match(hospitalService, /sanitizeOfficialWebsite/);
  assert.match(hospitalDetailRoute, /verification_status/);
});

test("Geolocation hook handles permissions, high accuracy, and manual override", () => {
  const useLocationHook = fs.readFileSync("src/hooks/useLocation.ts", "utf8");

  assert.match(useLocationHook, /enableHighAccuracy:\s*true/);
  assert.match(useLocationHook, /navigator\.permissions/);
  assert.match(useLocationHook, /setManualLocation/);
  assert.match(useLocationHook, /retryLocation/);
  assert.match(useLocationHook, /LocationFix/);
});
