import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

test("Google Maps loader uses loading=async and marker library", () => {
  const code = fs.readFileSync("src/lib/google-maps.ts", "utf8");

  // 1. Script tag includes loading=async
  assert.match(code, /loading=async/);

  // 2. Script tag includes marker library for AdvancedMarkerElement
  assert.match(code, /libraries=marker,places/);

  // 3. getGoogleMapsMapId helper exists and reads environment variable
  assert.match(code, /export function getGoogleMapsMapId/);
  assert.match(code, /NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID/);

  // 4. Ensures idempotent script insertion check
  assert.match(code, /document\.querySelector/);
});

test("MapView uses AdvancedMarkerElement with PinElement and Map ID", () => {
  const code = fs.readFileSync("src/components/MapView.tsx", "utf8");

  // 1. Imports getGoogleMapsMapId
  assert.match(code, /getGoogleMapsMapId/);

  // 2. Configures mapId on Google Map instance
  assert.match(code, /mapId:\s*mapId\s*\|\|\s*undefined/);

  // 3. Uses AdvancedMarkerElement and PinElement
  assert.match(code, /google\.maps\.marker\.AdvancedMarkerElement/);
  assert.match(code, /google\.maps\.marker\.PinElement/);

  // 4. Properly cleans up markers on effect teardown and unmount
  assert.match(code, /marker\.map = null/);
});

test("EmergencyMap uses AdvancedMarkerElement with clean removal and Map ID", () => {
  const code = fs.readFileSync("src/components/EmergencyMap.tsx", "utf8");

  // 1. Imports getGoogleMapsMapId
  assert.match(code, /getGoogleMapsMapId/);

  // 2. Configures mapId on Google Map instance
  assert.match(code, /mapId:\s*mapId\s*\|\|\s*undefined/);

  // 3. Uses AdvancedMarkerElement and PinElement
  assert.match(code, /google\.maps\.marker\.AdvancedMarkerElement/);
  assert.match(code, /google\.maps\.marker\.PinElement/);

  // 4. Uses removeMarker helper to prevent memory leaks and duplicate markers
  assert.match(code, /removeMarker/);
  assert.match(code, /existing\.map = null/);
});
