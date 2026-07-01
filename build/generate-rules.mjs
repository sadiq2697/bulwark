import { writeFile, mkdir } from "node:fs/promises";
import { convertList } from "../src/lib/filter-converter.js";

const SOURCES = [
  { name: "easylist", url: "https://easylist.to/easylist/easylist.txt", networkFile: "rules/easylist.json", cosmeticFile: "rules/cosmetic-ads.json" },
  { name: "easyprivacy", url: "https://easylist.to/easylist/easyprivacy.txt", networkFile: "rules/easyprivacy.json", cosmeticFile: null },
  { name: "cookies", url: "https://secure.fanboy.co.nz/fanboy-cookiemonster.txt", networkFile: null, cosmeticFile: "rules/cosmetic-cookies.json" },
];

async function fetchText(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`fetch ${url} failed: ${res.status}`);
  return res.text();
}

async function main() {
  await mkdir("rules", { recursive: true });
  for (const src of SOURCES) {
    const text = await fetchText(src.url);
    const { rules, cosmetic, skipped } = convertList(text, 1);
    if (src.networkFile) {
      await writeFile(src.networkFile, JSON.stringify(rules));
      console.log(`${src.name}: ${rules.length} network rules (${skipped} skipped) -> ${src.networkFile}`);
    }
    if (src.cosmeticFile) {
      await writeFile(src.cosmeticFile, JSON.stringify(cosmetic));
      console.log(`${src.name}: ${cosmetic.length} cosmetic selectors -> ${src.cosmeticFile}`);
    }
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
