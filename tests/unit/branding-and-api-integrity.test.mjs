import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

test("canonical SVG logo matches approved teal heartbeat artwork", () => {
  const svg = fs.readFileSync("public/sos-logo.svg", "utf8");
  assert.match(svg, /viewBox="0 0 512 512"/);
  assert.match(svg, /#0B3C5D/);
  assert.match(svg, /#0FA3A3/);
  assert.match(svg, /#FF6B4A/);
  assert.match(svg, />SOS</);
});

test("derived favicon and icons exist and are populated from SVG", () => {
  const iconSvg = fs.readFileSync("src/app/icon.svg", "utf8");
  assert.match(iconSvg, /viewBox="0 0 512 512"/);
  assert.match(iconSvg, /#0B3C5D/);

  const faviconSvg = fs.readFileSync("public/favicon.svg", "utf8");
  assert.match(faviconSvg, /viewBox="0 0 512 512"/);
  assert.match(faviconSvg, /#0B3C5D/);

  assert.ok(fs.existsSync("src/app/favicon.ico") && fs.statSync("src/app/favicon.ico").size > 1000);
  assert.ok(fs.existsSync("public/favicon-16x16.png") && fs.statSync("public/favicon-16x16.png").size > 500);
  assert.ok(fs.existsSync("public/favicon-32x32.png") && fs.statSync("public/favicon-32x32.png").size > 1000);
  assert.ok(fs.existsSync("public/apple-touch-icon.png") && fs.statSync("public/apple-touch-icon.png").size > 5000);
  assert.ok(fs.existsSync("public/icon-192.png") && fs.statSync("public/icon-192.png").size > 5000);
  assert.ok(fs.existsSync("public/icon-512.png") && fs.statSync("public/icon-512.png").size > 10000);
});

test("/api/appointments returns 503 instead of simulated 200 on schema error or failure", () => {
  const code = fs.readFileSync("src/app/api/appointments/route.ts", "utf8");
  assert.doesNotMatch(
    code,
    /if\s*\(\s*error\s*\)\s*\{\s*\/\/\s*If table doesn't exist yet/i,
    "Must not simulate 200 on appointment insert error"
  );
  assert.match(
    code,
    /status:\s*503/,
    "Must return 503 when database schema is updating or unavailable"
  );
});

test("/api/appointment-requests returns 503 instead of simulated 200 on insert error", () => {
  const code = fs.readFileSync("src/app/api/appointment-requests/route.ts", "utf8");
  assert.doesNotMatch(
    code,
    /insert fallback notice/i,
    "Must not simulate successful appointment request when database insert fails"
  );
  assert.match(
    code,
    /status:\s*503/,
    "Must return 503 when appointment request database dependency is unavailable"
  );
});

test("manifest.json uses approved theme color and references valid icons", () => {
  const manifest = JSON.parse(fs.readFileSync("public/manifest.json", "utf8"));
  assert.equal(manifest.theme_color, "#0FA3A3");
  assert.ok(manifest.icons.some(i => i.src === "/sos-logo.svg"));
});
