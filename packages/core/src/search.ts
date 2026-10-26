import type { Area, Gender, Lifestyle, Listing, ListingType } from "./types.ts";

/** Lowercase, drop the "al"/"el" article, punctuation and extra spaces. "Al-Barsha 1" → "barsha 1". */
export function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\b(al|el|ad|as|ar)\s+/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/** Levenshtein distance, capped: stops early once it exceeds `max`. */
export function editDistance(a: string, b: string, max = 3): number {
  if (Math.abs(a.length - b.length) > max) return max + 1;
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const cur = [i];
    let rowMin = i;
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + cost);
      rowMin = Math.min(rowMin, cur[j]);
    }
    if (rowMin > max) return max + 1;
    prev = cur;
  }
  return prev[b.length];
}

function scoreTerm(query: string, term: string): number {
  const t = normalize(term);
  if (!t) return 0;
  if (t === query) return 100;
  if (t.startsWith(query)) return 85 - Math.min(10, t.length - query.length);
  if (t.split(" ").some((w) => w.startsWith(query))) return 70;
  if (t.includes(query)) return 60;
  // Typo tolerance only once the query is long enough to mean something.
  if (query.length >= 4) {
    const d = editDistance(query, t.slice(0, query.length + 1), 2);
    if (d <= 2) return 45 - d * 10;
  }
  return 0;
}

export interface AreaMatch {
  area: Area;
  score: number;
}

/** Area autocomplete: name, Arabic name, aliases (JLT, DSO…), metro station and emirate, typo-tolerant. */
export function searchAreas(areas: Area[], raw: string, limit = 8): AreaMatch[] {
  const query = normalize(raw);
  if (!query) return [];
  const arabicQuery = raw.trim();
  const matches: AreaMatch[] = [];
  for (const area of areas) {
    let score = Math.max(
      scoreTerm(query, area.name),
      ...area.aliases.map((a) => scoreTerm(query, a)),
      area.nearMetro ? scoreTerm(query, area.nearMetro) * 0.8 : 0,
      scoreTerm(query, area.emirate) * 0.5,
    );
    if (arabicQuery && area.nameAr.includes(arabicQuery)) score = Math.max(score, 90);
    if (score > 0) matches.push({ area, score });
  }
  return matches.sort((a, b) => b.score - a.score || a.area.name.localeCompare(b.area.name)).slice(0, limit);
}

export type SortKey = "recommended" | "price_asc" | "price_desc" | "newest";

export interface ListingFilters {
  areaSlugs?: string[];
  emirate?: string;
  types?: ListingType[];
  maxPrice?: number;
  minPrice?: number;
  gender?: Gender;
  billsIncluded?: boolean;
  noDeposit?: boolean;
  noCommission?: boolean;
  nearMetro?: boolean;
  verifiedOnly?: boolean;
  /** ISO date: listing must be available on or before this day. */
  moveInBy?: string;
  sort?: SortKey;
}

/** Both declarations present. Partitions and shared beds are only "verified compliant" with both. */
export function isVerifiedCompliant(l: Listing): boolean {
  if (l.type === "partition") return l.compliance.dmPermit && l.compliance.landlordConsent;
  return l.compliance.landlordConsent;
}

export function filterListings(listings: Listing[], areas: Area[], f: ListingFilters): Listing[] {
  const areaBySlug = new Map(areas.map((a) => [a.slug, a]));
  const out = listings.filter((l) => {
    if (f.areaSlugs?.length && !f.areaSlugs.includes(l.areaSlug)) return false;
    if (f.emirate && areaBySlug.get(l.areaSlug)?.emirate !== f.emirate) return false;
    if (f.types?.length && !f.types.includes(l.type)) return false;
    if (f.maxPrice != null && l.priceAed > f.maxPrice) return false;
    if (f.minPrice != null && l.priceAed < f.minPrice) return false;
    // A "female" search shows female-only and mixed; it never shows male-only.
    if (f.gender && f.gender !== "any" && l.gender !== "any" && l.gender !== f.gender) return false;
    if (f.billsIncluded && !l.billsIncluded) return false;
    if (f.noDeposit && l.deposit > 0) return false;
    if (f.noCommission && l.commission > 0) return false;
    if (f.nearMetro && (l.nearMetroMinutes == null || l.nearMetroMinutes > 10)) return false;
    if (f.verifiedOnly && !(isVerifiedCompliant(l) || l.verifiedLister)) return false;
    if (f.moveInBy && l.availableFrom > f.moveInBy) return false;
    return true;
  });
  return sortListings(out, f.sort ?? "recommended");
}

function trustScore(l: Listing): number {
  return (
    (isVerifiedCompliant(l) ? 3 : 0) +
    (l.verifiedLister ? 2 : 0) +
    (l.billsIncluded ? 0.5 : 0) +
    (l.commission === 0 ? 0.5 : 0) +
    l.rating * Math.min(1, l.reviews / 20)
  );
}

export function sortListings(listings: Listing[], sort: SortKey): Listing[] {
  const copy = [...listings];
  switch (sort) {
    case "price_asc":
      return copy.sort((a, b) => a.priceAed - b.priceAed);
    case "price_desc":
      return copy.sort((a, b) => b.priceAed - a.priceAed);
    case "newest":
      return copy.sort((a, b) => b.id.localeCompare(a.id));
    default:
      return copy.sort((a, b) => trustScore(b) - trustScore(a));
  }
}

/** Lowest monthly price per type, for "from AED X" on category cards. */
export function fromPriceByType(listings: Listing[]): Partial<Record<ListingType, number>> {
  const out: Partial<Record<ListingType, number>> = {};
  for (const l of listings) {
    const cur = out[l.type];
    if (cur == null || l.priceAed < cur) out[l.type] = l.priceAed;
  }
  return out;
}

/**
 * Roommate compatibility 0–100: shared lifestyle tags (Jaccard), plus a gender fit gate
 * and a budget fit when the seeker gave one.
 */
export function compatibility(
  seeker: { lifestyle: Lifestyle[]; gender?: Gender; budget?: number },
  listing: Listing,
): number {
  if (seeker.gender && seeker.gender !== "any" && listing.gender !== "any" && listing.gender !== seeker.gender) {
    return 0;
  }
  const theirs = new Set(listing.profile?.lifestyle ?? []);
  const mine = new Set(seeker.lifestyle);
  const union = new Set([...theirs, ...mine]);
  const shared = [...mine].filter((t) => theirs.has(t)).length;
  const lifestyle = union.size ? shared / union.size : 0.5;
  let budget = 1;
  if (seeker.budget) {
    budget = listing.priceAed <= seeker.budget ? 1 : Math.max(0, 1 - (listing.priceAed - seeker.budget) / seeker.budget);
  }
  return Math.round((0.7 * lifestyle + 0.3 * budget) * 100);
}

const TYPE_WORDS: [RegExp, ListingType][] = [
  [/\b(bed ?spaces?|bedspaces?|sharing beds?|beds?)\b/, "bed_space"],
  [/\b(partitions?|partition rooms?)\b/, "partition"],
  [/\b(studios?|studio apartments?|studio flats?)\b/, "studio"],
  [/\b(private rooms?|master rooms?|rooms?)\b/, "room"],
];

/**
 * Free text → filters: "cheap female bed space in Karama under 900 with bills" →
 * { types: [bed_space], areaSlugs: [al-karama], maxPrice: 900, gender: female, billsIncluded }.
 * Used by the site's ?q= search and by the ChatGPT / Claude connectors.
 */
export function parseSearchText(areas: Area[], raw: string): ListingFilters {
  let text = normalize(raw);
  const f: ListingFilters = {};
  const take = (re: RegExp) => {
    const m = text.match(re);
    if (m) text = text.replace(re, " ");
    return m;
  };
  // Prices are read from the raw text: normalize() would split "1,500" and "1.5k".
  const price = raw.toLowerCase().match(/\b(?:under|below|max|maximum|upto|up to|less than|within|budget|aed|dhs?|dirhams?)\s*(\d[\d,]*(?:\.\d+)?)\s*(k)?\b|\b(\d[\d,]*(?:\.\d+)?)\s*(k)?\s*(?:aed|dhs?|dirhams?)\b|\b(\d+(?:\.\d+)?)(k)\b/);
  if (price) {
    const n = Number((price[1] ?? price[3] ?? price[5]).replace(/,/g, "")) * (price[2] || price[4] || price[6] ? 1000 : 1);
    if (Number.isFinite(n) && n > 0) f.maxPrice = n;
  }
  text = text.replace(/\b\d+k?\b|\b(under|below|max|maximum|upto|up to|less than|within|aed|dhs?|dirhams?)\b/g, " ");
  for (const [re, t] of TYPE_WORDS) if (take(re)) (f.types ??= []).includes(t) || f.types.push(t);
  if (take(/\b(female|ladies|lady|women|girls?)\b( only)?/)) f.gender = "female";
  else if (take(/\b(male|gents|men|boys?)\b( only)?/)) f.gender = "male";
  if (take(/\b(bills?|dewa|utilities)( included)?\b|\ball inclusive\b/)) f.billsIncluded = true;
  if (take(/\bno deposit\b|\bwithout deposit\b/)) f.noDeposit = true;
  if (take(/\b(near|close to|walking to) (the )?metro\b|\bmetro\b/)) f.nearMetro = true;
  if (take(/\bcheap(est)?\b|\bbudget\b|\baffordable\b|\blow cost\b/)) f.sort = "price_asc";
  // Whatever is left (minus filler words) is the place.
  const place = text.replace(/\b(in|at|near|for|rent|rental|monthly|month|per|a|an|the|with|and|available|uae|dubai|apartment|apartments|flat|flats|clean|furnished|looking|need|want|find|me|i|to|only|executive|sharing|shared)\b/g, " ").replace(/\s+/g, " ").trim();
  const emirate = take(/\b(sharjah|ajman|abu dhabi)\b/)?.[1];
  const where = place.replace(/\b(sharjah|ajman|abu dhabi)\b/g, " ").trim();
  if (where) {
    const hits = searchAreas(areas, where, 6).filter((m) => m.score >= 35);
    const hit = (emirate && hits.find((m) => normalize(m.area.emirate) === emirate)) || hits[0];
    if (hit) f.areaSlugs = [hit.area.slug];
  }
  if (!f.areaSlugs && emirate) f.emirate = emirate.replace(/\b\w/g, (c) => c.toUpperCase());
  return f;
}
