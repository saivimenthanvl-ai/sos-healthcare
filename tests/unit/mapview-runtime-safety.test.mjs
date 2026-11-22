import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

test("MapView does not invoke raw google.* constructors in top-level render tree", () => {
  const code = fs.readFileSync("src/components/MapView.tsx", "utf8");

  // In top-level component render functions, google.maps.Point, SymbolPath, etc. must be guarded
  assert.doesNotMatch(
    code,
    /anchor:\s*new google\.maps\.Point/,
    "new google.maps.Point must not be called unguarded in JSX props"
  );
  assert.doesNotMatch(
    code,
    /path:\s*google\.maps\.SymbolPath\.CIRCLE/,
    "google.maps.SymbolPath.CIRCLE must not be referenced unguarded without typeof check"
  );

  // Must contain safe check before referencing google
  assert.match(
    code,
    /typeof google !== "undefined"/,
    "MapView must check typeof google !== 'undefined' before accessing properties"
  );

  // SafeMapMarkers component or wrapper must be present
  assert.match(code, /SafeMapMarkers/);
});

test("Error boundary does not unconditionally claim crews can see user location", () => {
  const code = fs.readFileSync("src/app/error.tsx", "utf8");
  assert.doesNotMatch(
    code,
    /crews can see your location/i,
    "Error boundary must not unconditionally claim crews can see user location"
  );
  assert.match(
    code,
    /confirmed by dispatch/i,
    "Error boundary must state location access is contingent on dispatch confirmation"
  );
});

test("MapView provides fallback for billing/auth failure and missing keys", () => {
  const code = fs.readFileSync("src/components/MapView.tsx", "utf8");
  assert.match(code, /Google Maps API key is not configured/);
  assert.match(code, /gm_authFailure/);
  assert.match(code, /Street View is unavailable/);
});
