// Browser-safe entry: everything in the package except the listing catalogue.
// The merged area list is written by scripts/ensure-data.mjs before every build, so client bundles stay small.
import areasJson from "./data/areas-merged.json";
import type { Area, Listing } from "./types.ts";
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

export const AREAS: Area[] = areasJson as Area[];
export const AREA_BY_SLUG: ReadonlyMap<string, Area> = new Map(AREAS.map((a) => [a.slug, a]));
export const listingPoint = (l: Listing) => pointIn(AREA_BY_SLUG, l);
