// Produces a Chrome Web Store ready zip in dist/ containing only runtime files.
// Requires the `zip` command (present on macOS and Linux).
import { execFileSync } from "node:child_process";
import { mkdirSync, rmSync, existsSync, readFileSync } from "node:fs";

const version = JSON.parse(readFileSync("manifest.json", "utf8")).version;
const OUT = `dist/bulwark-${version}.zip`;
const INCLUDE = ["manifest.json", "src", "rules", "pages", "icons", "_locales"];

for (const p of INCLUDE) {
  if (!existsSync(p)) { console.error(`Missing ${p}. Run "npm run build:rules" first.`); process.exit(1); }
}

rmSync("dist", { recursive: true, force: true });
mkdirSync("dist");
execFileSync("zip", ["-r", "-q", OUT, ...INCLUDE, "-x", "*/.DS_Store", "-x", "*.map"], { stdio: "inherit" });
console.log(`Packaged ${OUT}`);
