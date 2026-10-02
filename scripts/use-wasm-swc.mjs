/**
 * Next.js ships a prebuilt `@next/swc-linux-x64-*` native binary that crashes
 * with `Bus error (core dumped)` (SIGBUS) on hosts running glibc >= 2.42 —
 * see anthropics/claude-code#40400. The crash kills both `next build` and
 * `next dev`, so nothing can be verified until it is worked around.
 *
 * When we detect such a host, drop the native binaries so Next falls back to
 * the pure-WASM compiler, which runs anywhere at the cost of some speed.
 *
 * Runs automatically on `npm install` via the `postinstall` hook.
 */
import { existsSync, rmSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const INCOMPATIBLE_GLIBC_MAJOR = 2;
const INCOMPATIBLE_GLIBC_MINOR = 42;

/** Returns true on Linux hosts whose glibc is new enough to SIGBUS on SWC. */
function hasIncompatibleGlibc() {
  if (process.platform !== "linux") return false;

  try {
    const output = execFileSync("ldd", ["--version"], { encoding: "utf8" });
    const match = output.match(/(\d+)\.(\d+)/);
    if (!match) return false;

    const major = Number(match[1]);
    const minor = Number(match[2]);

    return (
      major > INCOMPATIBLE_GLIBC_MAJOR ||
      (major === INCOMPATIBLE_GLIBC_MAJOR && minor >= INCOMPATIBLE_GLIBC_MINOR)
    );
  } catch {
    // If we cannot determine the glibc version, leave the native binaries in
    // place rather than degrading performance on a host that was fine.
    return false;
  }
}

if (hasIncompatibleGlibc()) {
  const nextScope = join(dirname(fileURLToPath(import.meta.url)), "..", "node_modules", "@next");

  for (const pkg of ["swc-linux-x64-gnu", "swc-linux-x64-musl"]) {
    const dir = join(nextScope, pkg);
    if (existsSync(dir)) {
      rmSync(dir, { recursive: true, force: true });
      console.log(`[use-wasm-swc] removed ${pkg}: incompatible with this glibc, using WASM instead`);
    }
  }
}