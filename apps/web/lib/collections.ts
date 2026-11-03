import type { Listing, ListingType } from "@stayshay/core";

/**
 * Programmatic pages that match how people actually search (from what ranks on Dubizzle today: "near X metro",
 * "executive", "ladies only", "bachelors", "all inclusive", "no deposit"). Each one is a live, filtered view of
 * the catalogue, so prices and counts stay true.
 */

const text = (l: Listing) => `${l.title} ${l.description ?? ""} ${(l.preferredTenant ?? []).join(" ")} ${l.typeName ?? ""}`.toLowerCase();

export interface Collection {
  /** URL: /rent/<type-slug>/<slug> */
  slug: string;
  types: ListingType[];
  /** Page name with {type} for the kind of place, e.g. "Ladies-only {type} in Dubai". */
  pattern: string;
  /** Hero photo for the page. */
  photo?: string;
  h1: string;
  title: string;
  description: string;
  intro: string;
  keywords: string[];
  match: (l: Listing) => boolean;
  faq: [string, string][];
}

const female = (l: Listing) => l.gender === "female" || /\b(ladies|lady|female|women|girls?)\b/.test(text(l));
const male = (l: Listing) => l.gender === "male" || /\b(bachelors?|gents|men|male|boys?)\b/.test(text(l));

export const COLLECTIONS: Collection[] = [
  {
    slug: "ladies",
    photo: "/photos/ladies.jpg",
    pattern: "Ladies-only {type} in Dubai",
    types: ["bed_space", "partition", "room"],
    h1: "Ladies-only bed spaces, partitions and rooms in Dubai",
    title: "Ladies bed space & female partitions in Dubai",
    description: "Female-only bed spaces, partitions and rooms in Dubai with monthly rent, bills and deposit shown. Ladies-only flats near the metro.",
    intro: "Female-only flats and rooms, where only women live. Real rent, deposit and bills on every listing, and viewings arranged by Stayshay.",
    keywords: ["ladies bed space Dubai", "female partition Dubai", "ladies only room Dubai", "female bed space near metro", "girls sharing room Dubai"],
    match: female,
    faq: [
      ["Are these flats only for women?", "Yes. These listings are female-only or marked for ladies. Confirm the house rules at the viewing."],
      ["Can I visit before paying?", "Always. Never pay a deposit before you've seen the place and met the person renting it."],
    ],
  },
  {
    slug: "bachelors",
    photo: "/photos/bed-space.jpg",
    pattern: "Bachelor {type} in Dubai",
    types: ["bed_space", "partition", "room"],
    h1: "Bachelor bed spaces and rooms in Dubai",
    title: "Bachelor bed space & rooms for men in Dubai",
    description: "Bed spaces, partitions and rooms for single men (bachelors) in Dubai, monthly, with bills and deposit shown up front.",
    intro: "Places for single working men, from budget bed spaces in Deira and Karama to executive partitions near the metro.",
    keywords: ["bachelor bed space Dubai", "bed space for men Dubai", "gents bed space", "bachelor room Dubai monthly", "executive bachelor bed space"],
    match: male,
    faq: [["Where are the cheapest bachelor bed spaces?", "Deira, Al Rigga, Naif, Bur Dubai and Karama usually have the lowest prices. See the live prices on this page."]],
  },
  {
    slug: "executive",
    photo: "/photos/executive.jpg",
    pattern: "Executive {type} in Dubai",
    types: ["bed_space", "partition"],
    h1: "Executive bed spaces and partitions in Dubai",
    title: "Executive bed space & executive partitions in Dubai",
    description: "Executive bed spaces and partitions in Dubai: fewer people per room, proper beds, cleaner buildings. Monthly prices, bills included or not, near the metro.",
    intro: "\"Executive\" usually means two or three people per room, proper beds instead of bunks and a better building. Compare them here with real prices.",
    keywords: ["executive bed space Dubai", "executive partition Dubai", "premium bed space Dubai", "executive bedspace near metro"],
    match: (l) => /\b(executive|premium|luxury)\b/.test(text(l)) || (l.type === "bed_space" && l.bedsInRoom > 0 && l.bedsInRoom <= 3),
    faq: [["What is an executive bed space?", "A shared room with fewer people, usually 2 or 3, with proper beds and a better-kept flat than a standard bed space."]],
  },
  {
    slug: "all-inclusive",
    photo: "/photos/living.jpg",
    pattern: "All-inclusive {type} in Dubai (bills included)",
    types: ["bed_space", "partition", "room", "studio"],
    h1: "All-inclusive monthly rentals in Dubai: bills, Wi-Fi and DEWA included",
    title: "All-inclusive bed space & rooms in Dubai (bills included)",
    description: "Monthly bed spaces, partitions, rooms and studios in Dubai where DEWA, Wi-Fi and gas are included in the rent. One price, no surprises.",
    intro: "One monthly price with DEWA, Wi-Fi and gas included, so there's nothing extra to split at the end of the month.",
    keywords: ["all inclusive bed space Dubai", "bills included room Dubai", "DEWA included partition", "room with WiFi and DEWA included"],
    match: (l) => l.billsIncluded,
    faq: [["What does all-inclusive mean?", "DEWA (electricity and water), Wi-Fi and usually gas are part of the rent. Some places also include cleaning."]],
  },
  {
    slug: "no-deposit",
    photo: "/photos/room.jpg",
    pattern: "{Type} in Dubai with no deposit",
    types: ["bed_space", "partition", "room", "studio"],
    h1: "Rooms and bed spaces in Dubai with no deposit",
    title: "No deposit bed space, partitions & rooms in Dubai",
    description: "Move in without a deposit: bed spaces, partitions, rooms and studios in Dubai that ask for no security deposit. Live monthly prices.",
    intro: "Places that don't ask for a security deposit, so you only need the first month's rent to move in.",
    keywords: ["no deposit room Dubai", "bed space without deposit Dubai", "partition no deposit", "move in without deposit Dubai"],
    match: (l) => !l.deposit,
    faq: [["Is it safe to rent without a deposit?", "Yes, as long as you view the place first and get a written agreement with the rent, notice period and what's included."]],
  },
  {
    slug: "couples",
    photo: "/photos/couples.jpg",
    pattern: "{Type} for couples in Dubai",
    types: ["partition", "room", "studio"],
    h1: "Couple partitions, rooms and studios in Dubai",
    title: "Couple partition & rooms for couples in Dubai",
    description: "Partitions, private rooms and studios in Dubai that accept couples, monthly, with real prices and the house rules shown.",
    intro: "Places where couples can live together, from budget partitions to private rooms and studios.",
    keywords: ["couple partition Dubai", "room for couple Dubai", "couple room monthly Dubai", "studio for couple Dubai"],
    match: (l) => l.occupancy === "couple" || /\bcouples?\b/.test(text(l)) || l.type === "studio",
    faq: [["Can couples rent a partition in Dubai?", "Many places accept couples. Check the listing's rules and ask about the building's policy at the viewing."]],
  },
];

export const COLLECTION_BY_SLUG = new Map(COLLECTIONS.map((c) => [c.slug, c]));

/* ---------- metro stations ---------- */

export interface Station {
  slug: string;
  name: string;
  line: "Red" | "Green" | "Red and Green";
  /** Names the station goes by in listings (renamed stations keep their old names in ads). */
  aliases: string[];
  /** Areas within walking distance. */
  areas: string[];
}

export const STATIONS: Station[] = [
  { slug: "union", name: "Union", line: "Red and Green", aliases: ["union"], areas: ["deira", "muraqqabat", "al-rigga"] },
  { slug: "al-rigga", name: "Al Rigga", line: "Red", aliases: ["rigga"], areas: ["al-rigga", "deira"] },
  { slug: "baniyas-square", name: "Baniyas Square", line: "Green", aliases: ["baniyas"], areas: ["naif", "deira"] },
  { slug: "salah-al-din", name: "Salah Al Din", line: "Green", aliases: ["salah al din", "salahuddin"], areas: ["muraqqabat", "deira"] },
  { slug: "gold-souq", name: "Gold Souq", line: "Green", aliases: ["gold souq", "gold souk", "palm deira"], areas: ["naif", "deira"] },
  { slug: "stadium", name: "Stadium", line: "Green", aliases: ["stadium"], areas: ["al-nahda-dubai", "al-qusais"] },
  { slug: "al-nahda", name: "Al Nahda", line: "Green", aliases: ["al nahda"], areas: ["al-nahda-dubai"] },
  { slug: "al-qusais", name: "Al Qusais", line: "Green", aliases: ["qusais"], areas: ["al-qusais"] },
  { slug: "ggico", name: "GGICO", line: "Red", aliases: ["ggico", "garhoud"], areas: ["al-garhoud"] },
  { slug: "adcb", name: "ADCB (Al Karama)", line: "Red", aliases: ["adcb", "karama"], areas: ["al-karama", "al-mankhool"] },
  { slug: "burjuman", name: "BurJuman", line: "Red and Green", aliases: ["burjuman"], areas: ["al-karama", "bur-dubai", "al-mankhool"] },
  { slug: "sharaf-dg-al-fahidi", name: "Sharaf DG (Al Fahidi)", line: "Green", aliases: ["al fahidi", "sharaf dg"], areas: ["bur-dubai", "al-fahidi"] },
  { slug: "al-ghubaiba", name: "Al Ghubaiba", line: "Green", aliases: ["ghubaiba"], areas: ["bur-dubai"] },
  { slug: "oud-metha", name: "Oud Metha", line: "Green", aliases: ["oud metha"], areas: ["oud-metha"] },
  { slug: "al-jafiliya", name: "Al Jafiliya (Max)", line: "Red", aliases: ["jafiliya", "jafilia", "max"], areas: ["al-satwa"] },
  { slug: "business-bay", name: "Business Bay", line: "Red", aliases: ["business bay"], areas: ["business-bay"] },
  { slug: "mall-of-the-emirates", name: "Mall of the Emirates", line: "Red", aliases: ["mall of the emirates", "moe"], areas: ["al-barsha-1"] },
  { slug: "mashreq", name: "Mashreq (InsuranceMarket)", line: "Red", aliases: ["mashreq", "insurancemarket", "insurance market"], areas: ["al-barsha-1", "al-barsha-heights"] },
  { slug: "dubai-internet-city", name: "Dubai Internet City", line: "Red", aliases: ["internet city"], areas: ["al-barsha-heights"] },
  { slug: "dmcc", name: "DMCC (JLT)", line: "Red", aliases: ["dmcc", "jlt", "jumeirah lakes"], areas: ["jlt", "jumeirah-lakes-towers-jlt", "dubai-marina"] },
  { slug: "discovery-gardens", name: "Discovery Gardens", line: "Red", aliases: ["discovery gardens", "the gardens"], areas: ["discovery-gardens"] },
  { slug: "al-furjan", name: "Al Furjan", line: "Red", aliases: ["al furjan"], areas: ["al-furjan"] },
];

export const STATION_BY_SLUG = new Map(STATIONS.map((s) => [s.slug, s]));

export function nearStation(s: Station, l: Listing): boolean {
  const m = (l.metro ?? "").toLowerCase();
  if (m && s.aliases.some((a) => m.includes(a))) return true;
  return s.areas.includes(l.areaSlug);
}
