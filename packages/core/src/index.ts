import areasJson from "./data/areas.json";
import homebookJson from "./data/homebook.json";
import type { Area, Listing } from "./types.ts";
import { fromHomebook, mergeAreas, type HomebookFile } from "./homebook.ts";
import { pointIn } from "./util.ts";

export * from "./types.ts";
export * from "./brand.ts";
export * from "./search.ts";
export * from "./inquiry.ts";
export * from "./lead.ts";
export * from "./parse-message.ts";
export * from "./match.ts";
export * from "./deals.ts";
export * from "./referral.ts";
export { PHOTOS, similarListings, coverFor, median, type PhotoSet } from "./util.ts";
export { stripPhones } from "./text.ts";

const homebook = homebookJson as unknown as HomebookFile;
const imported = homebook.listings.filter((l) => l.priceAed > 0 && l.photos.length > 0).map(fromHomebook);
const merged = mergeAreas(areasJson as Area[], homebook, imported);

export const AREAS: Area[] = merged.areas;
/** Test catalogue: homebook listings, area slugs folded onto the curated area list. Server only. */
export const LISTINGS: Listing[] = imported.map((l) => ({ ...l, areaSlug: merged.remap.get(l.areaSlug) ?? l.areaSlug }));
export const IMPORTED_AT = homebook.importedAt;

export const AREA_BY_SLUG: ReadonlyMap<string, Area> = new Map(AREAS.map((a) => [a.slug, a]));
export const LISTING_BY_ID: ReadonlyMap<string, Listing> = new Map(LISTINGS.map((l) => [l.id.toLowerCase(), l]));

/** Exact pin when the source has one, else the area centre. */
export const listingPoint = (l: Listing) => pointIn(AREA_BY_SLUG, l);
