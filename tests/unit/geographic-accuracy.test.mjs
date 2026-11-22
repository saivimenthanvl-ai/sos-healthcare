import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

function haversineDistance(c1, c2) {
  const R = 6371;
  const dLat = ((c2.lat - c1.lat) * Math.PI) / 180;
  const dLng = ((c2.lng - c1.lng) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((c1.lat * Math.PI) / 180) *
      Math.cos((c2.lat * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

test("Geographic Hospital Discovery: hospitals change based on user coordinates without hardcoding", () => {
  const chennaiFile = fs.readFileSync("src/lib/data/chennai-hospitals.ts", "utf8");
  
  // Extract all hospitals from dataset file
  const idMatches = [...chennaiFile.matchAll(/id:\s*"([^"]+)",\s*name:\s*"([^"]+)",[\s\S]*?latitude:\s*([0-9.]+),\s*longitude:\s*([0-9.]+)/g)];
  assert.ok(idMatches.length >= 25, "Dataset should have at least 25 hospitals");

  const hospitals = idMatches.map(m => ({
    id: m[1],
    name: m[2],
    latitude: parseFloat(m[3]),
    longitude: parseFloat(m[4]),
  }));

  // Geographic Test Scenario A: User in Porur (13.0382, 80.1565)
  const porurCoords = { lat: 13.0382, lng: 80.1565 };
  const porurNearby = hospitals
    .map(h => ({ ...h, dist: haversineDistance(porurCoords, { lat: h.latitude, lng: h.longitude }) }))
    .filter(h => h.dist <= 5)
    .sort((a, b) => a.dist - b.dist);

  assert.ok(porurNearby.length > 0, "Should find hospitals near Porur");
  assert.equal(porurNearby[0].name, "Sri Ramachandra Medical College and Research Institute", "Sri Ramachandra should be closest to Porur (~1.5 km)");
  assert.ok(porurNearby[0].dist < 2.0, "Sri Ramachandra must be within 2km of Porur");

  // Geographic Test Scenario B: User in Mogappair (13.0837, 80.1750)
  const mogappairCoords = { lat: 13.0837, lng: 80.1750 };
  const mogappairNearby = hospitals
    .map(h => ({ ...h, dist: haversineDistance(mogappairCoords, { lat: h.latitude, lng: h.longitude }) }))
    .filter(h => h.dist <= 5)
    .sort((a, b) => a.dist - b.dist);

  assert.ok(mogappairNearby.length > 0, "Should find hospitals near Mogappair");
  assert.equal(mogappairNearby[0].name, "Medway Hospitals - Mogappair", "Medway Mogappair should be closest to Mogappair (<1 km)");

  // Geographic Test Scenario C: User in Manapakkam (13.0185, 80.1884)
  const manapakkamCoords = { lat: 13.0185, lng: 80.1884 };
  const manapakkamNearby = hospitals
    .map(h => ({ ...h, dist: haversineDistance(manapakkamCoords, { lat: h.latitude, lng: h.longitude }) }))
    .filter(h => h.dist <= 5)
    .sort((a, b) => a.dist - b.dist);

  assert.ok(manapakkamNearby.length > 0, "Should find hospitals near Manapakkam");
  assert.equal(manapakkamNearby[0].name, "MIOT International", "MIOT International should be closest to Manapakkam (<0.5 km)");

  // Geographic Test Scenario D: User in Aminjikarai (13.0722, 80.2173)
  const aminjikaraiCoords = { lat: 13.0722, lng: 80.2173 };
  const aminjikaraiNearby = hospitals
    .map(h => ({ ...h, dist: haversineDistance(aminjikaraiCoords, { lat: h.latitude, lng: h.longitude }) }))
    .filter(h => h.dist <= 5)
    .sort((a, b) => a.dist - b.dist);

  assert.ok(aminjikaraiNearby.length > 0, "Should find hospitals near Aminjikarai");
  assert.equal(aminjikaraiNearby[0].name, "MGM Healthcare", "MGM Healthcare should be closest to Aminjikarai (<0.5 km)");

  // Geographic Test Scenario E: Far outside Chennai (Bangalore: 12.9716, 77.5946)
  const bangaloreCoords = { lat: 12.9716, lng: 77.5946 };
  const bangaloreNearby = hospitals
    .map(h => ({ ...h, dist: haversineDistance(bangaloreCoords, { lat: h.latitude, lng: h.longitude }) }))
    .filter(h => h.dist <= 25);

  assert.equal(bangaloreNearby.length, 0, "Chennai hospitals must NOT be returned for user in Bangalore within 25 km");
});

test("Emergency map does not show default directions form or Google Maps elements", () => {
  const code = fs.readFileSync("src/components/EmergencyMap.tsx", "utf8");
  assert.doesNotMatch(code, /google\.maps/);
  assert.doesNotMatch(code, /maps\.googleapis\.com/);
  assert.doesNotMatch(code, /accounts\.google\.com/);
  assert.doesNotMatch(code, /Google Sign in/i);
});

test("Emergency map does not auto-request directions on initial load", () => {
  const code = fs.readFileSync("src/components/EmergencyMap.tsx", "utf8");
  // Directions should not auto-trigger inside an unconditioned mount effect
  assert.doesNotMatch(code, /void getRoute\(\);[\s\S]*?\[userLat,\s*userLng,\s*hospitals\]/);
});
