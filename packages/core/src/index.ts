import areasJson from "./data/areas.json";
import homebookJson from "./data/homebook.json";
import photosJson from "./data/photos.json";
import type { Area, Listing } from "./types.ts";
import { fromHomebook, mergeAreas, type HomebookFile } from "./homebook.ts";

export * from "./types.ts";
export * from "./brand.ts";
export * from "./search.ts";
export * from "./inquiry.ts";
export * from "./lead.ts";
export * from "./parse-message.ts";

export interface PhotoSet {
  hero: string[];
  areas: Record<string, string>;
  categories: Record<string, string>;
  credits?: unknown[];
}

const homebook = homebookJson as unknown as HomebookFile;
const imported = homebook.listings.filter((l) => l.priceAed > 0 && l.photos.length > 0).map(fromHomebook);
const merged = mergeAreas(areasJson as Area[], homebook, imported);

export const AREAS: Area[] = merged.areas;
/** Test catalogue: homebook listings, area slugs folded onto the curated area list. */
export const LISTINGS: Listing[] = imported.map((l) => ({ ...l, areaSlug: merged.remap.get(l.areaSlug) ?? l.areaSlug }));
export const PHOTOS = photosJson as PhotoSet;
export const IMPORTED_AT = homebook.importedAt;

export const AREA_BY_SLUG: ReadonlyMap<string, Area> = new Map(AREAS.map((a) => [a.slug, a]));
export const LISTING_BY_ID: ReadonlyMap<string, Listing> = new Map(LISTINGS.map((l) => [l.id.toLowerCase(), l]));

/** Exact pin when the source has one, else the area centre. */
export function listingPoint(l: Listing): [number, number] | null {
  if (l.lat && l.lng) return [l.lat, l.lng];
  const a = AREA_BY_SLUG.get(l.areaSlug);
  return a ? [a.lat, a.lng] : null;
}

/** Same area first, then same type, closest price. */
export function similarListings(listings: Listing[], l: Listing, n = 4): Listing[] {
  return listings.filter((x) => x.id !== l.id)
    .map((x) => ({ x, s: (x.areaSlug === l.areaSlug ? 0 : 2) + (x.type === l.type ? 0 : 1) + Math.abs(x.priceAed - l.priceAed) / 2000 }))
    .sort((a, b) => a.s - b.s)
    .slice(0, n)
    .map((r) => r.x);
}

/** A real listing photo for a type (verified listings with several photos first), for category and funnel art. */
export function coverFor(listings: Listing[], type: Listing["type"], offset = 0): string | undefined {
  const pool = listings.filter((l) => l.type === type && l.photos.length >= 3).sort((a, b) => Number(b.verifiedLister) - Number(a.verifiedLister) || b.photos.length - a.photos.length);
  return pool[offset % Math.max(pool.length, 1)]?.photos[0] ?? PHOTOS.categories[type];
}

export function median(nums: number[]): number | null {
  if (!nums.length) return null;
  const s = [...nums].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : Math.round((s[m - 1] + s[m]) / 2);
}
