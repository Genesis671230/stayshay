#!/usr/bin/env node
// AVIF photos (homebook serves many) don't decode on older Android phones: convert them to JPG and
// point homebook.json at the new files. Safe to re-run. Called automatically at the end of import-homebook.mjs.
import { readFile, writeFile, readdir, unlink } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const PUB = join(ROOT, "apps/web/public");
const DATA = join(ROOT, "packages/core/src/data/homebook.json");

let converted = 0;
const hb = join(PUB, "hb");
for (const dir of await readdir(hb).catch(() => [])) {
  for (const f of await readdir(join(hb, dir)).catch(() => [])) {
    if (!f.endsWith(".avif")) continue;
    const src = join(hb, dir, f);
    await sharp(src).rotate().resize({ width: 1400, withoutEnlargement: true }).jpeg({ quality: 80, mozjpeg: true }).toFile(src.replace(/\.avif$/, ".jpg"));
    await unlink(src);
    converted++;
  }
}

const data = JSON.parse(await readFile(DATA, "utf8").catch(() => "null"));
if (data?.listings) {
  for (const l of data.listings) l.photos = l.photos.map((p) => (p.startsWith("/hb/") ? p.replace(/\.avif$/, ".jpg") : p));
  await writeFile(DATA, JSON.stringify(data));
}
console.log(`[stayshay] photos: ${converted} AVIF converted to JPG`);
