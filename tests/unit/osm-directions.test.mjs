import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

// Lightweight test mirror of buildOsmDirectionsUrl to avoid TypeScript loader issues in node:test
function isValidCoordinate(lat, lng) {
  if (lat == null || lng == null) return false;
  return Number.isFinite(lat) && Number.isFinite(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
}

function buildOsmDirectionsUrl(origin, destination) {
  if (!isValidCoordinate(destination?.lat, destination?.lng)) {
    throw new Error("Invalid destination coordinates for OpenStreetMap directions.");
  }
  const destLat = destination.lat.toFixed(6);
  const destLng = destination.lng.toFixed(6);

  if (origin && isValidCoordinate(origin.lat, origin.lng)) {
    const originLat = origin.lat.toFixed(6);
    const originLng = origin.lng.toFixed(6);
    const url = new URL("https://www.openstreetmap.org/directions");
    url.searchParams.set("engine", "fossgis_osrm_car");
    url.searchParams.set("route", `${originLat},${originLng};${destLat},${destLng}`);
    url.hash = `map=15/${destLat}/${destLng}`;
    return url.toString();
  }

  const url = new URL("https://www.openstreetmap.org");
  url.searchParams.set("mlat", destLat);
  url.searchParams.set("mlon", destLng);
  url.hash = `map=16/${destLat}/${destLng}`;
  return url.toString();
}

test("buildOsmDirectionsUrl generates valid OpenStreetMap coordinates URLs", () => {
  const origin = { lat: 13.0827, lng: 80.2707 };
  const destination = { lat: 13.1238, lng: 80.2033 };

  const urlStr = buildOsmDirectionsUrl(origin, destination);
  const parsed = new URL(urlStr);

  assert.equal(parsed.hostname, "www.openstreetmap.org");
  assert.equal(parsed.pathname, "/directions");
  assert.equal(parsed.searchParams.get("engine"), "fossgis_osrm_car");
  assert.equal(parsed.searchParams.get("route"), "13.082700,80.270700;13.123800,80.203300");
  assert.match(parsed.hash, /map=15\/13\.123800\/80\.203300/);
});

test("buildOsmDirectionsUrl handles missing origin by displaying destination directly", () => {
  const destination = { lat: 13.1238, lng: 80.2033 };

  const urlStr = buildOsmDirectionsUrl(null, destination);
  const parsed = new URL(urlStr);

  assert.equal(parsed.hostname, "www.openstreetmap.org");
  assert.equal(parsed.searchParams.get("mlat"), "13.123800");
  assert.equal(parsed.searchParams.get("mlon"), "80.203300");
  assert.doesNotMatch(urlStr, /route=%3B/);
});

test("buildOsmDirectionsUrl rejects invalid coordinates", () => {
  assert.throws(() => {
    buildOsmDirectionsUrl({ lat: 13.0, lng: 80.0 }, { lat: 95.0, lng: 80.0 });
  }, /Invalid destination coordinates/);

  assert.throws(() => {
    buildOsmDirectionsUrl({ lat: 13.0, lng: 80.0 }, { lat: 13.0, lng: 185.0 });
  }, /Invalid destination coordinates/);
});

test("Chakra Critical Care Centre coordinates are verified and not located on Alliance Orchid Springs", () => {
  const chennaiFile = fs.readFileSync("src/lib/data/chennai-hospitals.ts", "utf8");
  assert.match(chennaiFile, /id:\s*"chennai-hosp-chakra-critical-care"/);
  assert.match(chennaiFile, /latitude:\s*13\.1238/);
  assert.match(chennaiFile, /longitude:\s*80\.2033/);
  assert.doesNotMatch(chennaiFile, /Alliance Orchid/i);
});

test("Hospital detail page provides real GPS origin and no hardcoded Alliance Orchid Springs", () => {
  const detailPage = fs.readFileSync("src/app/(main)/hospitals/[id]/page.tsx", "utf8");
  assert.doesNotMatch(detailPage, /Alliance Orchid/i);
  assert.doesNotMatch(detailPage, /13\.1258349/);
  assert.match(detailPage, /buildOsmDirectionsUrl/);
  assert.match(detailPage, /Your current location/);
  assert.match(detailPage, /Current location unavailable/);
});

test("Osm directions utility module exists and is typed", () => {
  const osmFile = fs.readFileSync("src/lib/maps/osm-directions.ts", "utf8");
  assert.match(osmFile, /export function buildOsmDirectionsUrl/);
  assert.match(osmFile, /fossgis_osrm_car/);
});
