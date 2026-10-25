import type { Amenity, Area, Listing, ListingType, Occupancy } from "./types.ts";
import { normalize } from "./search.ts";

/** Shape written by scripts/import-homebook.mjs. */
export interface HomebookListing {
  id: string;
  sourceId: number;
  slug: string;
  sourceUrl: string;
  type: ListingType;
  typeName: string | null;
  title: string;
  areaSlug: string;
  areaName: string | null;
  city: string | null;
  lat: number | null;
  lng: number | null;
  metro: string | null;
  nearMetroMinutes: number | null;
  priceAed: number;
  priceMaxAed?: number | null;
  billsIncluded: boolean;
  utilities: string | null;
  deposit: number;
  upfrontCost: number;
  commission: number;
  availability: string | null;
  availableFrom: string;
  minimumStay: string | null;
  noticePeriod: string | null;
  maxCapacity: number | null;
  flatmates: string | null;
  sleepingSet: string | null;
  bathroom: string | null;
  balcony: string | null;
  preferredTenant: string[];
  preferredNationality: string[];
  gender: "male" | "female" | "any";
  features: string[];
  verifiedOnSource: boolean;
  sourceStatus: string | null;
  sourceLabel: string | null;
  listerName: string;
  views: number | null;
  postedAt: string;
  updatedAt: string;
  description: string[];
  photos: string[];
}

export interface HomebookFile {
  importedAt: string;
  count: number;
  areas: { slug: string; name: string; city: string; n: number }[];
  listings: HomebookListing[];
}

const AMENITY_RULES: [RegExp, Amenity][] = [
  [/wi-?fi|internet/i, "wifi"],
  [/\bac\b|a\/c|air ?condition|chiller/i, "ac"],
  [/kitchen|stove|oven|cook/i, "kitchen"],
  [/wash(ing)?|laundry|dryer/i, "washer"],
  [/parking/i, "parking"],
  [/\bgym\b|fitness/i, "gym"],
  [/pool/i, "pool"],
  [/clean/i, "cleaning"],
  [/balcony/i, "balcony"],
  [/(private|attached|en-?suite) ?bath/i, "private_bath"],
  [/dewa|utilit/i, "dewa_included"],
];

function amenities(l: HomebookListing): Amenity[] {
  const text = [...l.features, l.bathroom ?? "", l.balcony ?? "", l.utilities ?? ""].join(" | ");
  const out = new Set<Amenity>();
  for (const [re, a] of AMENITY_RULES) if (re.test(text)) out.add(a);
  if (l.balcony && /no/i.test(l.balcony)) out.delete("balcony");
  return [...out];
}

function minStayMonths(text: string | null): number {
  const n = Number(text?.match(/\d+/)?.[0]);
  if (!n) return 1;
  return /year/i.test(text ?? "") ? n * 12 : /week|day/i.test(text ?? "") ? 1 : n;
}

function occupancy(l: HomebookListing): Occupancy {
  if (l.preferredTenant.some((t) => /couple/i.test(t))) return "couple";
  if (l.type === "bed_space") return "shared";
  return "single";
}

/** Homebook's "Ready to move" etc. are relative; treat them as available from the posting date. */
export function fromHomebook(l: HomebookListing): Listing {
  return {
    id: l.id,
    type: l.type,
    title: l.title,
    areaSlug: l.areaSlug,
    building: l.metro ? `Near ${l.metro} Metro` : (l.areaName ?? l.city ?? "UAE"),
    priceAed: l.priceAed,
    priceMaxAed: l.priceMaxAed ?? null,
    billsIncluded: l.billsIncluded,
    deposit: l.deposit,
    commission: l.commission,
    availableFrom: l.availableFrom,
    minStayMonths: minStayMonths(l.minimumStay),
    occupancy: occupancy(l),
    bedsInRoom: l.type === "bed_space" ? Math.max(l.maxCapacity ?? 2, 2) : 1,
    bedsAvailable: 1,
    gender: l.gender,
    furnished: true,
    amenities: amenities(l),
    nearMetroMinutes: l.nearMetroMinutes,
    // The source doesn't carry consent / permit declarations: show them as not declared yet.
    compliance: { landlordConsent: false, dmPermit: false },
    verifiedLister: l.verifiedOnSource,
    listerName: l.listerName,
    listerType: "owner",
    rating: 0,
    reviews: 0,
    photos: l.photos,
    description: l.description.slice(0, 2).join(" "),
    descriptionLines: l.description,
    slug: l.slug,
    typeName: l.typeName,
    areaName: l.areaName,
    city: l.city,
    lat: l.lat,
    lng: l.lng,
    metro: l.metro,
    utilities: l.utilities,
    upfrontCost: l.upfrontCost,
    availability: l.availability,
    minimumStay: l.minimumStay,
    noticePeriod: l.noticePeriod,
    maxCapacity: l.maxCapacity,
    flatmates: l.flatmates,
    sleepingSet: l.sleepingSet,
    bathroom: l.bathroom,
    balcony: l.balcony,
    preferredTenant: l.preferredTenant,
    preferredNationality: l.preferredNationality,
    features: l.features,
    views: l.views,
    postedAt: l.postedAt,
    status: "live",
  };
}

const CITY_CENTRE: Record<string, [number, number]> = {
  dubai: [25.2048, 55.2708],
  sharjah: [25.3463, 55.4209],
  "abu dhabi": [24.4539, 54.3773],
  ajman: [25.4052, 55.5136],
};

/**
 * Curated areas keep their aliases / Arabic names / metro; any area that only exists in the import
 * is added with its centre computed from that area's listing pins.
 */
export function mergeAreas(curated: Area[], file: HomebookFile, listings: Listing[]): { areas: Area[]; remap: Map<string, string> } {
  const byKey = new Map<string, Area>();
  for (const a of curated) {
    byKey.set(a.slug, a);
    byKey.set(normalize(a.name), a);
    for (const al of a.aliases) byKey.set(normalize(al), a);
  }
  const remap = new Map<string, string>();
  const extra = new Map<string, Area>();
  for (const src of file.areas) {
    const hit = byKey.get(src.slug) ?? byKey.get(normalize(src.name));
    if (hit) {
      remap.set(src.slug, hit.slug);
      continue;
    }
    const pins = listings.filter((l) => l.areaSlug === src.slug && l.lat && l.lng);
    const fallback = CITY_CENTRE[normalize(src.city || "dubai")] ?? CITY_CENTRE.dubai;
    const lat = pins.length ? pins.reduce((s, l) => s + l.lat!, 0) / pins.length : fallback[0];
    const lng = pins.length ? pins.reduce((s, l) => s + l.lng!, 0) / pins.length : fallback[1];
    extra.set(src.slug, { slug: src.slug, name: src.name, nameAr: "", emirate: src.city || "Dubai", lat, lng, nearMetro: null, aliases: [] });
  }
  return { areas: [...curated, ...extra.values()], remap };
}
