#!/usr/bin/env node
// Push stayshay.com URLs to IndexNow (Bing, Yandex, Seznam, Naver; Bing shares with Copilot/ChatGPT search).
// Usage: node scripts/indexnow.mjs            -> every URL in the live sitemap
//        node scripts/indexnow.mjs /family /move/uk   -> only these paths
// The key file lives at apps/web/public/<key>.txt and is served from the site root.
import { readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const SITE = process.env.PUBLIC_BASE_URL || "https://stayshay.com";
const pub = join(dirname(fileURLToPath(import.meta.url)), "../apps/web/public");
const key = readdirSync(pub).find((f) => /^[0-9a-f]{32}\.txt$/.test(f))?.slice(0, -4);
if (!key) throw new Error("No IndexNow key file in apps/web/public");

let urls = process.argv.slice(2).map((p) => (p.startsWith("http") ? p : SITE + p));
if (!urls.length) {
  const xml = await (await fetch(`${SITE}/sitemap.xml`)).text();
  urls = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
}
const host = new URL(SITE).host;
for (let i = 0; i < urls.length; i += 10000) {
  const batch = urls.slice(i, i + 10000);
  const r = await fetch("https://api.indexnow.org/indexnow", {
    method: "POST",
    headers: { "content-type": "application/json; charset=utf-8" },
    body: JSON.stringify({ host, key, keyLocation: `${SITE}/${key}.txt`, urlList: batch }),
  });
  console.log(`IndexNow: ${batch.length} URLs -> ${r.status} ${r.statusText}`);
}
