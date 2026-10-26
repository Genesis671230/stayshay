import { AREAS, AREA_BY_SLUG, BRAND, TYPE_LABEL, TYPE_LABEL_PLURAL, TYPE_SLUG, type Area, type Listing, type ListingType } from "@stayshay/core";

/** Canonical origin for links, sitemaps, JSON-LD, the MCP server and llms.txt. */
export const SITE = (process.env.PUBLIC_BASE_URL || `https://${BRAND.domain}`).replace(/\/$/, "");

export const GA_ID = process.env.NEXT_PUBLIC_GA_ID || "G-12X8446CFV";

/** Kinds of place with their own landing pages (/rent/bed-space, /rent/bed-space/deira …). */
export const RENT_TYPES: ListingType[] = ["bed_space", "partition", "room", "studio"];
export const TYPE_BY_SLUG = new Map(RENT_TYPES.map((t) => [TYPE_SLUG[t], t]));

/** Search phrases people actually type, per kind of place. Used in titles, intros and FAQ. */
export const TYPE_KEYWORDS: Record<ListingType, string[]> = {
  bed_space: ["bed space", "bedspace", "sharing bed space", "cheap bed space", "executive bed space"],
  partition: ["partition", "partition room", "partition for couples", "master partition", "cheap partition"],
  room: ["room for rent", "private room", "sharing room", "master room", "monthly room"],
  studio: ["studio for rent", "monthly studio", "cheap studio apartment", "furnished studio", "studio flat"],
  roommate: ["roommate", "flatmate"],
};

export const listingUrl = (l: Pick<Listing, "id">) => `${SITE}/listing/${l.id.toLowerCase()}`;
export const rentPath = (type: ListingType, area?: string) => `/rent/${TYPE_SLUG[type]}${area ? `/${area}` : ""}`;
export const absolute = (path: string) => (/^https?:\/\//.test(path) ? path : `${SITE}${path.startsWith("/") ? "" : "/"}${path}`);

export function areaName(l: Listing): string {
  return AREA_BY_SLUG.get(l.areaSlug)?.name ?? l.areaName ?? "UAE";
}

export interface PriceStats {
  count: number;
  min: number;
  median: number;
}

export function priceStats(listings: Listing[]): PriceStats | null {
  if (!listings.length) return null;
  const p = listings.map((l) => l.priceAed).sort((a, b) => a - b);
  return { count: p.length, min: p[0], median: p[p.length >> 1] };
}

/** Areas that have live listings, busiest first, with counts per type. */
export function liveAreas(listings: Listing[]): { area: Area; count: number; types: Partial<Record<ListingType, number>> }[] {
  const m = new Map<string, { count: number; types: Partial<Record<ListingType, number>> }>();
  for (const l of listings) {
    const cur = m.get(l.areaSlug) ?? { count: 0, types: {} };
    cur.count++;
    cur.types[l.type] = (cur.types[l.type] ?? 0) + 1;
    m.set(l.areaSlug, cur);
  }
  return AREAS.filter((a) => m.has(a.slug))
    .map((a) => ({ area: a, ...m.get(a.slug)! }))
    .sort((a, b) => b.count - a.count);
}

export const typeTitle = (t: ListingType, area?: Area) =>
  `${TYPE_LABEL_PLURAL[t]} for monthly rent in ${area ? `${area.name}, ${area.emirate}` : "Dubai & UAE"}`;

export const typeNoun = (t: ListingType) => TYPE_LABEL[t].toLowerCase();

/* ---------- JSON-LD ---------- */

export function organizationLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${SITE}/#org`,
    name: BRAND.name,
    url: SITE,
    logo: `${SITE}/brand/stayshay-mark.svg`,
    email: BRAND.supportEmail,
    description: "UAE marketplace for affordable monthly bed spaces, partitions, private rooms, studios and roommates.",
    areaServed: ["Dubai", "Sharjah", "Abu Dhabi", "Ajman", "United Arab Emirates"],
    contactPoint: [{ "@type": "ContactPoint", telephone: `+${BRAND.whatsapp}`, contactType: "customer support", availableLanguage: ["English", "Arabic", "Hindi", "Urdu"] }],
  };
}

export function websiteLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${SITE}/#website`,
    url: SITE,
    name: BRAND.name,
    publisher: { "@id": `${SITE}/#org` },
    potentialAction: { "@type": "SearchAction", target: `${SITE}/search?q={search_term_string}`, "query-input": "required name=search_term_string" },
  };
}

export function breadcrumbLd(items: [string, string][]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map(([name, path], i) => ({ "@type": "ListItem", position: i + 1, name, item: absolute(path) })),
  };
}

export function listingLd(l: Listing) {
  const area = areaName(l);
  return {
    "@context": "https://schema.org",
    "@type": "RealEstateListing",
    name: l.title,
    url: listingUrl(l),
    description: l.description.slice(0, 500),
    image: l.photos.slice(0, 6).map(absolute),
    datePosted: l.postedAt,
    about: {
      "@type": l.type === "studio" ? "Apartment" : "Room",
      name: l.title,
      address: { "@type": "PostalAddress", addressLocality: area, addressRegion: AREA_BY_SLUG.get(l.areaSlug)?.emirate ?? l.city ?? "Dubai", addressCountry: "AE" },
      ...(l.lat && l.lng ? { geo: { "@type": "GeoCoordinates", latitude: l.lat, longitude: l.lng } } : {}),
      ...(l.maxCapacity ? { occupancy: { "@type": "QuantitativeValue", maxValue: l.maxCapacity } } : {}),
    },
    offers: {
      "@type": "Offer",
      price: l.priceAed,
      priceCurrency: "AED",
      availability: "https://schema.org/InStock",
      businessFunction: "http://purl.org/goodrelations/v1#LeaseOut",
      priceSpecification: { "@type": "UnitPriceSpecification", price: l.priceAed, priceCurrency: "AED", unitCode: "MON", referenceQuantity: { "@type": "QuantitativeValue", value: 1, unitCode: "MON" } },
    },
  };
}

export function itemListLd(name: string, listings: Listing[]) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name,
    numberOfItems: listings.length,
    itemListElement: listings.slice(0, 30).map((l, i) => ({ "@type": "ListItem", position: i + 1, url: listingUrl(l), name: l.title })),
  };
}

export function faqLd(faq: [string, string][]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faq.map(([q, a]) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a } })),
  };
}

/** FAQ for programmatic pages, answered from live numbers only. */
export function landingFaq(listings: Listing[], type?: ListingType, area?: Area): [string, string][] {
  const s = priceStats(listings);
  const where = area ? area.name : "Dubai and the UAE";
  const what = type ? TYPE_LABEL_PLURAL[type].toLowerCase() : "rooms, bed spaces, partitions and studios";
  const one = type ? typeNoun(type) : "place";
  const faq: [string, string][] = [];
  if (s)
    faq.push([
      `How much does a ${one} cost in ${where}?`,
      `Right now ${s.count} ${s.count === 1 ? "listing is" : "listings are"} live on Stayshay in ${where}, from AED ${s.min.toLocaleString("en-US")} a month, with a typical price of AED ${s.median.toLocaleString("en-US")}. Every listing shows rent, deposit, upfront cost and whether bills are included.`,
    ]);
  const bills = listings.filter((l) => l.billsIncluded).length;
  if (s) faq.push([`Are bills included?`, `${bills} of ${s.count} live ${what} in ${where} include bills (DEWA/electricity, water and usually Wi-Fi). Filter by "Bills included" to see only those.`]);
  faq.push(
    [`Can I rent ${type ? `a ${one}` : "a place"} in ${where} monthly?`, `Yes. Stayshay lists monthly ${what} with no yearly contract. Minimum stay and notice period are shown on each listing.`],
    [`How do I book a viewing?`, `Open a listing and tap Book a viewing, or message Shay, our assistant. We'll WhatsApp you to fix a time. Never pay before you've seen the place.`],
    [`Is Stayshay free for renters?`, `Yes. There's no booking fee and no commission from Stayshay.`],
  );
  if (type === "partition") faq.push([`Are partitions allowed?`, `Partitions need landlord consent and a permit, and flats must not be overcrowded. Look for the Verified badge, which shows the lister provided both.`]);
  return faq;
}
