#!/usr/bin/env node
// homebook.json is local-only test data (gitignored: the repo is public). A fresh clone gets an empty
// catalogue so it still builds; run `node scripts/import-homebook.mjs --limit 120` to fill it.
// Also writes data/areas-merged.json (curated areas + areas found in the catalogue) for browser bundles,
// so client code never has to import the catalogue itself.
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const data = join(dirname(fileURLToPath(import.meta.url)), "../packages/core/src/data");
const file = join(data, "homebook.json");
if (!existsSync(file)) {
  writeFileSync(file, JSON.stringify({ importedAt: "", count: 0, areas: [], listings: [] }));
  console.log("[stayshay] no local listing data: wrote an empty catalogue. Run scripts/import-homebook.mjs to load test listings.");
}

process.removeAllListeners("warning");
const { fromHomebook, mergeAreas } = await import("../packages/core/src/homebook.ts");
const homebook = JSON.parse(readFileSync(file, "utf8"));
const curated = JSON.parse(readFileSync(join(data, "areas.json"), "utf8"));
const imported = homebook.listings.filter((l) => l.priceAed > 0 && l.photos.length > 0).map(fromHomebook);
const { areas } = mergeAreas(curated, homebook, imported);
writeFileSync(join(data, "areas-merged.json"), JSON.stringify(areas));
