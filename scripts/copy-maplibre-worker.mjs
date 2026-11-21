/**
 * Copies MapLibre GL worker files from node_modules to public directory
 * to ensure reliable, same-origin static worker asset loading without bundler URL corruption.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const srcDir = path.join(root, "node_modules", "maplibre-gl", "dist");
const destDir = path.join(root, "public");

const files = [
  "maplibre-gl-worker.mjs",
  "maplibre-gl-worker.mjs.map",
  "maplibre-gl-worker-dev.mjs",
  "maplibre-gl-worker-dev.mjs.map",
];

for (const file of files) {
  const src = path.join(srcDir, file);
  const dest = path.join(destDir, file);
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, dest);
    console.log(`[copy-maplibre-worker] Copied ${file} to public/`);
  }
}
