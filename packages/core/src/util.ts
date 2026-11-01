import photosJson from "./data/photos.json";
import type { Area, Listing } from "./types.ts";

export interface PhotoSet {
  hero: string[];
  areas: Record<string, string>;
  categories: Record<string, string>;
  /** Page heroes: refer, partners, manager, roommates, metro. */
  pages?: Record<string, string>;
  credits?: unknown[];
}

export const PHOTOS = photosJson as PhotoSet;

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

export function pointIn(areaBySlug: ReadonlyMap<string, Area>, l: Listing): [number, number] | null {
  if (l.lat && l.lng) return [l.lat, l.lng];
  const a = areaBySlug.get(l.areaSlug);
  return a ? [a.lat, a.lng] : null;
}
