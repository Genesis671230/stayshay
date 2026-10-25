#!/usr/bin/env node
// Imports homebook.ae listings (used with the owner's permission, private testing only) into
// packages/core/src/data/homebook.json and downloads their photos to apps/web/public/hb/<id>/.
//
//   node scripts/import-homebook.mjs            # everything
//   node scripts/import-homebook.mjs --no-images
//   node scripts/import-homebook.mjs --max-photos 6
//
// Re-runnable: photos already on disk are skipped.

import { mkdir, writeFile, stat } from "node:fs/promises";
import { execFileSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const API = "https://homebook.ae/wp-json/wp/v2";
const UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128 Safari/537.36";
const args = process.argv.slice(2);
const WITH_IMAGES = !args.includes("--no-images");
const MAX_PHOTOS = Number(args[args.indexOf("--max-photos") + 1]) || 8;
// --limit N: newest N listings, taken round-robin across types so every category has stock. Raise it over time.
const LIMIT = args.includes("--limit") ? Number(args[args.indexOf("--limit") + 1]) : Infinity;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function get(url, tries = 4) {
  for (let i = 0; i < tries; i++) {
    let res;
    try {
      res = await fetch(url, { headers: { "user-agent": UA, accept: "application/json" }, signal: AbortSignal.timeout(60000) });
    } catch (e) {
      console.warn(`\n  retry ${i + 1}: ${url.slice(0, 90)}… (${e.name})`);
      await sleep(1500 * (i + 1));
      continue;
    }
    if (res.ok) return { json: await res.json(), headers: res.headers };
    console.warn(`\n  retry ${i + 1}: ${url} → ${res.status}`);
    if (res.status === 400 && url.includes("page=")) return { json: [], headers: res.headers };
    await sleep(1500 * (i + 1));
  }
  throw new Error(`GET ${url} failed`);
}

async function all(path, query = "") {
  const out = [];
  for (let page = 1; ; page++) {
    const { json, headers } = await get(`${API}/${path}?per_page=100&page=${page}${query}`);
    out.push(...json);
    const pages = Number(headers.get("x-wp-totalpages") ?? 1);
    process.stdout.write(`\r${path}: ${out.length}`);
    if (page >= pages || json.length === 0) break;
    await sleep(400);
  }
  process.stdout.write("\n");
  return out;
}

const decode = (s = "") =>
  s
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#039;|&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ");

// Contact details go through Stayshay during testing, so phone numbers / emails / links are stripped from text.
const PHONE = /(\+?\d[\d\s\-().]{7,}\d)/g;
const EMAIL = /[\w.+-]+@[\w-]+\.[\w.]+/g;
const URL_RE = /https?:\/\/\S+|www\.\S+/g;

function paragraphs(html = "") {
  return decode(html)
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|li|h\d|div)>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(URL_RE, "")
    .replace(EMAIL, "")
    .replace(PHONE, "")
    .split("\n")
    .map((l) => l.replace(/\s+/g, " ").trim())
    .filter((l) => l && !/^(📞|☎️)?\s*(for (viewing|inquir)|call|whats ?app|contact)\b[^a-z]*$/i.test(l) && !/^[📞☎️:\-–\s]+$/.test(l));
}

const one = (m, k) => (Array.isArray(m?.[k]) ? m[k][0] : m?.[k]) ?? null;
const many = (m, k) => (Array.isArray(m?.[k]) ? m[k].filter(Boolean) : m?.[k] ? [m[k]] : []);
const num = (v) => (v == null || v === "" || Number.isNaN(Number(String(v).replace(/,/g, ""))) ? null : Number(String(v).replace(/,/g, "")));

function mapType(slugs) {
  const s = slugs.join(" ");
  if (/bed-?space/.test(s)) return "bed_space";
  if (/partition/.test(s)) return "partition";
  if (/studio|bedroom/.test(s)) return "studio";
  if (/roommate|flatmate/.test(s)) return "roommate";
  return "room";
}

function gender(tenants) {
  const t = tenants.map((x) => x.toLowerCase());
  const male = t.some((x) => /male|man|men|boy|gents/.test(x) && !/female/.test(x));
  const female = t.some((x) => /female|lad(y|ies)|wom[ae]n|girl/.test(x));
  if (male && !female) return "male";
  if (female && !male) return "female";
  return "any";
}

async function download(url, file) {
  try {
    await stat(file);
    return true;
  } catch {}
  for (let i = 0; i < 3; i++) {
    try {
      const res = await fetch(url, { headers: { "user-agent": UA }, signal: AbortSignal.timeout(30000) });
      if (!res.ok) throw new Error(String(res.status));
      if (!String(res.headers.get("content-type") ?? "").startsWith("image/")) return false;
      await mkdir(dirname(file), { recursive: true });
      await writeFile(file, Buffer.from(await res.arrayBuffer()));
      // Some originals are 20MB+ phone shots: shrink anything over 600KB to 1400px (macOS sips).
      if ((await stat(file)).size > 600_000 && /\.(jpe?g|png)$/i.test(file)) {
        try {
          execFileSync("sips", ["-Z", "1400", "-s", "format", "jpeg", "-s", "formatOptions", "72", file, "--out", file], { stdio: "ignore" });
        } catch {}
      }
      return true;
    } catch {
      await sleep(800 * (i + 1));
    }
  }
  return false;
}

async function main() {
  const taxonomies = ["property_type", "property_status", "property_feature", "property_label", "property_city", "property_area"];
  const terms = {};
  for (const t of taxonomies) {
    const list = await all(t);
    terms[t] = new Map(list.map((x) => [x.id, { slug: x.slug, name: decode(x.name), parent: x.parent }]));
  }

  const allProps = await all("properties", "&status=publish");
  const typeOf = (p) => mapType((p.property_type ?? []).map((id) => terms.property_type.get(id)?.slug ?? ""));
  let props = allProps;
  if (Number.isFinite(LIMIT)) {
    const buckets = new Map();
    for (const p of [...allProps].sort((a, b) => b.date_gmt.localeCompare(a.date_gmt))) {
      if (!(p.property_meta?.fave_property_images ?? []).length) continue;
      const t = typeOf(p);
      buckets.set(t, [...(buckets.get(t) ?? []), p]);
    }
    props = [];
    while (props.length < LIMIT && [...buckets.values()].some((b) => b.length)) {
      for (const b of buckets.values()) if (b.length && props.length < LIMIT) props.push(b.shift());
    }
    console.log(`limit: ${props.length} of ${allProps.length} listings`);
  }

  // Lister display names only (no phone numbers): inquiries are routed through Stayshay while testing.
  const agentIds = [...new Set(props.flatMap((p) => many(p.property_meta, "fave_agents")).map(Number).filter(Boolean))];
  const agents = new Map();
  for (let i = 0; i < agentIds.length; i += 100) {
    const { json } = await get(`${API}/agents?per_page=100&include=${agentIds.slice(i, i + 100).join(",")}`);
    for (const a of json) agents.set(a.id, decode(a.title?.rendered ?? "").split(/\s+/)[0] || "Owner");
    await sleep(300);
  }
  console.log(`agents: ${agents.size}`);

  const mediaIds = [
    ...new Set(
      props.flatMap((p) => [one(p.property_meta, "_thumbnail_id"), ...many(p.property_meta, "fave_property_images")]).map(Number).filter(Boolean),
    ),
  ];
  const media = new Map();
  // Big include= lists time out on their server; 25 at a time stays well under a second each.
  for (let i = 0; i < mediaIds.length; i += 25) {
    const { json } = await get(`${API}/media?per_page=25&include=${mediaIds.slice(i, i + 25).join(",")}&_fields=id,source_url,media_details,mime_type`);
    for (const m of json) {
      // The media library also holds listing videos (MP4); only images become photos.
      if (m.mime_type && !String(m.mime_type).startsWith("image/")) continue;
      const sizes = m.media_details?.sizes ?? {};
      // Cloudflare Images URLs resize on request; otherwise take the largest WordPress size under ~1200px.
      const cf = /imagedelivery\.net/.test(m.source_url) ? m.source_url.replace(/\/w=\d+.*$/, "/w=1200,fit=scale-down") : null;
      const pick = sizes.large ?? sizes["houzez-gallery"] ?? sizes.medium_large ?? sizes.full;
      media.set(m.id, { full: m.source_url, url: cf ?? pick?.source_url ?? m.source_url });
    }
    process.stdout.write(`\rmedia: ${media.size}/${mediaIds.length}`);
    await sleep(300);
  }
  process.stdout.write("\n");

  const areaCount = new Map();
  const listings = [];
  let photosOk = 0;
  let photosFail = 0;

  for (const p of props) {
    const m = p.property_meta ?? {};
    const typeSlugs = (p.property_type ?? []).map((id) => terms.property_type.get(id)?.slug ?? "");
    const area = (p.property_area ?? []).map((id) => terms.property_area.get(id)).find(Boolean);
    const city = (p.property_city ?? []).map((id) => terms.property_city.get(id)).find(Boolean);
    const statusTerm = (p.property_status ?? []).map((id) => terms.property_status.get(id)?.slug).find(Boolean) ?? null;
    const label = (p.property_label ?? []).map((id) => terms.property_label.get(id)?.slug).find(Boolean) ?? null;
    const metroClass = (p.class_list ?? []).find((c) => c.startsWith("metro-"));
    const metro = metroClass
      ? metroClass
          .replace(/^metro-/, "")
          .replace(/-metro$/, "")
          .split("-")
          .map((w) => w[0].toUpperCase() + w.slice(1))
          .join(" ")
      : null;

    const imageIds = [...new Set([one(m, "_thumbnail_id"), ...many(m, "fave_property_images")].map(Number).filter(Boolean))];
    const photos = [];
    const wanted = imageIds.slice(0, MAX_PHOTOS).map((mid, i) => ({ md: media.get(mid), i })).filter((x) => x.md);
    const got = await Promise.all(
      wanted.map(async ({ md, i }) => {
        const ext = (md.url.match(/\.(jpe?g|png|webp|avif)(\?|$)/i)?.[1] ?? "jpg").toLowerCase();
        const rel = `/hb/${p.id}/${i + 1}.${ext}`;
        if (!WITH_IMAGES) return md.url;
        return (await download(md.url, join(ROOT, "apps/web/public", rel))) ? rel : null;
      }),
    );
    for (const g of got) {
      if (g) {
        photos.push(g);
        photosOk++;
      } else photosFail++;
    }
    if (listings.length % 25 === 0) process.stdout.write(`\rphotos: ${listings.length}/${props.length} listings`);

    // fave_property_location is "lng,lat" on this site (and geolocation_lat holds the longitude), so place by range.
    const coords = String(one(m, "fave_property_location") ?? "")
      .split(",")
      .map(Number)
      .filter((n) => Number.isFinite(n));
    const lat = coords.find((n) => n > 22 && n < 27) ?? null;
    const lng = coords.find((n) => n > 51 && n < 57) ?? null;
    // _nearest_metro_walking is PHP-serialised: pull the station name and walking duration (seconds).
    const metroRaw = String(one(m, "_nearest_metro_walking") ?? "");
    const metroName = metroRaw.match(/s:4:"name";s:\d+:"([^"]+)"/)?.[1]?.replace(/\s*Metro$/i, "") ?? null;
    const walkSec = Number(metroRaw.match(/s:16:"walking_duration";d:([\d.]+)/)?.[1]);
    const minPrice = num(one(m, "fave_property_min_price"));
    const maxPrice = num(one(m, "fave_property_max_price"));
    const tenants = many(m, "fave_preferred-tenant");
    const utilities = one(m, "fave_utilities");
    const deposit = num(one(m, "fave_security-deposit-aed")) ?? 0;
    const upfront = num(one(m, "fave_upfront-costs-aed")) ?? 0;
    const walk = Number.isFinite(walkSec) && walkSec > 0 ? Math.max(1, Math.round(walkSec / 60)) : null;
    const firstAvail = one(m, "first_availability") ?? one(m, "fave_first-availability");
    const availDate = one(m, "availability_date");
    const features = (p.property_feature ?? []).map((id) => terms.property_feature.get(id)?.name).filter(Boolean);
    const areaSlug = area?.slug ?? city?.slug ?? "uae";
    areaCount.set(areaSlug, { name: area?.name ?? city?.name ?? "UAE", city: city?.name ?? "Dubai", n: (areaCount.get(areaSlug)?.n ?? 0) + 1, lat, lng });

    listings.push({
      id: one(m, "fave_property_id") ?? `HB${p.id}`,
      sourceId: p.id,
      slug: p.slug,
      sourceUrl: p.link,
      type: mapType(typeSlugs),
      typeName: typeSlugs.map((s) => terms.property_type.get((p.property_type ?? []).find((id) => terms.property_type.get(id)?.slug === s))?.name).filter(Boolean)[0] ?? null,
      title: decode(p.title?.rendered ?? "").trim(),
      areaSlug,
      areaName: area?.name ?? null,
      city: city?.name ?? null,
      lat,
      lng,
      metro: metroName ?? metro,
      nearMetroMinutes: walk,
      priceAed: num(one(m, "fave_property_price")) ?? minPrice ?? 0,
      priceMaxAed: num(one(m, "fave_property_price")) ? null : maxPrice,
      pricePostfix: one(m, "fave_property_price_postfix"),
      negotiable: one(m, "fave_property_negotiable") === "1",
      billsIncluded: /all utilities included|included/i.test(utilities ?? ""),
      utilities,
      deposit,
      upfrontCost: upfront,
      commission: 0,
      availability: firstAvail,
      availableFrom: availDate && /^\d{4}-\d{2}-\d{2}/.test(availDate) ? availDate.slice(0, 10) : p.date.slice(0, 10),
      minimumStay: one(m, "fave_minimum-stay"),
      noticePeriod: one(m, "fave_notice-period"),
      maxCapacity: num(one(m, "fave_maximum-capacity")),
      flatmates: one(m, "fave_flatmates"),
      sleepingSet: one(m, "fave_sleeping-set"),
      bathroom: one(m, "fave_bathroom"),
      balcony: one(m, "fave_balcony"),
      preferredTenant: tenants,
      preferredNationality: many(m, "fave_preferred-nationality"),
      gender: gender(tenants),
      features,
      verifiedOnSource: statusTerm === "verified",
      sourceStatus: statusTerm,
      sourceLabel: label,
      listerName: agents.get(Number(one(m, "fave_agents"))) ?? "Owner",
      views: num(one(m, "houzez_total_property_views")),
      postedAt: p.date_gmt,
      updatedAt: p.modified_gmt,
      description: paragraphs(p.content?.rendered),
      photos,
    });
  }

  const out = {
    importedAt: new Date().toISOString(),
    source: "homebook.ae (owner permission, private testing)",
    count: listings.length,
    areas: [...areaCount.entries()].map(([slug, v]) => ({ slug, ...v })),
    listings,
  };
  const file = join(ROOT, "packages/core/src/data/homebook.json");
  await writeFile(file, JSON.stringify(out));
  console.log(`listings: ${listings.length} · areas: ${areaCount.size} · photos ok ${photosOk}, failed ${photosFail} → ${file}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
