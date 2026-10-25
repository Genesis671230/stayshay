#!/usr/bin/env node
// homebook.json is local-only test data (gitignored: the repo is public). A fresh clone gets an empty
// catalogue so it still builds; run `node scripts/import-homebook.mjs --limit 120` to fill it.
import { existsSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const file = join(dirname(fileURLToPath(import.meta.url)), "../packages/core/src/data/homebook.json");
if (!existsSync(file)) {
  writeFileSync(file, JSON.stringify({ importedAt: "", count: 0, areas: [], listings: [] }));
  console.log("[stayshay] no local listing data: wrote an empty catalogue. Run scripts/import-homebook.mjs to load test listings.");
}
