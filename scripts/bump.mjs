// Bump the version in package.json and manifest.json in lockstep, preserving
// each file's formatting. Usage: node scripts/bump.mjs [patch|minor|major]
import { readFile, writeFile } from "node:fs/promises";

const kind = process.argv[2] || "patch";
if (!["patch", "minor", "major"].includes(kind)) {
  console.error(`Unknown bump kind: ${kind}. Use patch, minor, or major.`);
  process.exit(1);
}

function next(version, kind) {
  const [maj, min, pat] = version.split(".").map((n) => parseInt(n, 10) || 0);
  if (kind === "major") return `${maj + 1}.0.0`;
  if (kind === "minor") return `${maj}.${min + 1}.0`;
  return `${maj}.${min}.${pat + 1}`;
}

const VERSION_RE = /("version"\s*:\s*")(\d+\.\d+\.\d+)(")/;

async function bumpFile(path, to) {
  const raw = await readFile(path, "utf8");
  if (!VERSION_RE.test(raw)) throw new Error(`No version field found in ${path}`);
  await writeFile(path, raw.replace(VERSION_RE, `$1${to}$3`));
}

const pkg = await readFile("package.json", "utf8");
const from = pkg.match(VERSION_RE)[2];
const to = next(from, kind);
await bumpFile("package.json", to);
await bumpFile("manifest.json", to);
console.log(`${from} -> ${to}`);
