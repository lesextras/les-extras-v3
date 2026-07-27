import { existsSync, readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const __dirname = dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);

const CRITICAL_FILES = [
  "dist/compiled/jest-worker/processChild.js",
  "dist/server/next.js",
  "package.json",
];

function resolveNextRoot() {
  try {
    const pkgPath = require.resolve("next/package.json", {
      paths: [resolve(__dirname, "../apps/web")],
    });
    return dirname(pkgPath);
  } catch {
    return null;
  }
}

const nextRoot = resolveNextRoot();

if (!nextRoot) {
  console.error("ERROR: Cannot resolve 'next' package from apps/web.");
  console.error("Run: pnpm run clean:install");
  process.exit(1);
}

let failed = false;
for (const file of CRITICAL_FILES) {
  const full = resolve(nextRoot, file);
  if (!existsSync(full)) {
    console.error(`MISSING: ${full}`);
    failed = true;
  }
}

if (failed) {
  console.error("");
  console.error(
    "Next.js installation is incomplete or corrupted (pnpm store corruption detected)."
  );
  console.error("Fix: pnpm run clean:install");
  process.exit(1);
}

const pkg = JSON.parse(readFileSync(resolve(nextRoot, "package.json"), "utf8"));
console.log(`OK: next@${pkg.version} verified at ${nextRoot}`);
