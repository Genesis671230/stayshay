import { test } from "node:test";
import assert from "node:assert/strict";
import { compatibility, filterListings, normalize, searchAreas } from "./search.ts";
import { normalizePhone, validateInquiry, whatsappLink } from "./inquiry.ts";
import type { Area, Listing } from "./types.ts";

const areas: Area[] = [
  { slug: "al-barsha-1", name: "Al Barsha 1", nameAr: "البرشاء 1", emirate: "Dubai", lat: 25.11, lng: 55.2, nearMetro: "Mall of the Emirates", aliases: ["Barsha 1", "Barsha"] },
  { slug: "jlt", name: "Jumeirah Lake Towers", nameAr: "أبراج بحيرات جميرا", emirate: "Dubai", lat: 25.07, lng: 55.14, nearMetro: "DMCC", aliases: ["JLT"] },
  { slug: "dso", name: "Dubai Silicon Oasis", nameAr: "واحة دبي للسيليكون", emirate: "Dubai", lat: 25.12, lng: 55.38, nearMetro: null, aliases: ["DSO"] },
  { slug: "al-nahda-sharjah", name: "Al Nahda", nameAr: "النهدة", emirate: "Sharjah", lat: 25.3, lng: 55.37, nearMetro: null, aliases: ["Nahda"] },
];

const base: Listing = {
  id: "SK-1", type: "bed_space", title: "t", areaSlug: "jlt", building: "b", priceAed: 900, billsIncluded: true,
  deposit: 0, commission: 0, availableFrom: "2026-11-01", minStayMonths: 1, occupancy: "shared", bedsInRoom: 3,
  bedsAvailable: 1, gender: "female", furnished: true, amenities: [], nearMetroMinutes: 5,
  compliance: { landlordConsent: true, dmPermit: false }, verifiedLister: true, listerName: "A", listerType: "owner",
  rating: 4.8, reviews: 10, photos: [], description: "d",
};

test("normalize drops the Al article and punctuation", () => {
  assert.equal(normalize("Al-Barsha 1"), "barsha 1");
});

test("area search: aliases, typos, Arabic, emirate", () => {
  assert.equal(searchAreas(areas, "jlt")[0].area.slug, "jlt");
  assert.equal(searchAreas(areas, "DSO")[0].area.slug, "dso");
  assert.equal(searchAreas(areas, "barsa")[0].area.slug, "al-barsha-1");
  assert.equal(searchAreas(areas, "البرشاء")[0].area.slug, "al-barsha-1");
  assert.equal(searchAreas(areas, "sharjah")[0].area.slug, "al-nahda-sharjah");
  assert.equal(searchAreas(areas, "   ").length, 0);
});

test("gender filter keeps mixed listings, drops the other gender", () => {
  const male = { ...base, id: "SK-2", gender: "male" as const };
  const any = { ...base, id: "SK-3", gender: "any" as const };
  const ids = filterListings([base, male, any], areas, { gender: "female" }).map((l) => l.id).sort();
  assert.deepEqual(ids, ["SK-1", "SK-3"]);
});

test("verifiedOnly: verified lister, or both partition declarations", () => {
  const partition = { ...base, id: "SK-4", type: "partition" as const, verifiedLister: false };
  assert.equal(filterListings([partition], areas, { verifiedOnly: true }).length, 0);
  const ok = { ...partition, compliance: { landlordConsent: true, dmPermit: true } };
  assert.equal(filterListings([ok], areas, { verifiedOnly: true }).length, 1);
});

test("emirate and budget filters", () => {
  const shj = { ...base, id: "SK-5", areaSlug: "al-nahda-sharjah", priceAed: 700 };
  assert.deepEqual(filterListings([base, shj], areas, { emirate: "Sharjah" }).map((l) => l.id), ["SK-5"]);
  assert.deepEqual(filterListings([base, shj], areas, { maxPrice: 800 }).map((l) => l.id), ["SK-5"]);
});

test("compatibility: gender gate and lifestyle overlap", () => {
  const rm = { ...base, type: "roommate" as const, profile: { age: 28, profession: "x", lifestyle: ["quiet", "non_smoker"] as const } } as Listing;
  assert.equal(compatibility({ lifestyle: ["quiet"], gender: "male" }, rm), 0);
  assert.ok(compatibility({ lifestyle: ["quiet", "non_smoker"] }, rm) > compatibility({ lifestyle: ["social"] }, rm));
});

test("UAE phone normalisation", () => {
  assert.equal(normalizePhone("050 123 4567"), "971501234567");
  assert.equal(normalizePhone("+971 50 123 4567"), "971501234567");
  assert.equal(normalizePhone("00971501234567"), "971501234567");
  assert.equal(normalizePhone("97150123"), null);
  assert.equal(normalizePhone("+91 98765 43210"), "919876543210");
});

test("inquiry validation and WhatsApp link", () => {
  assert.equal(validateInquiry({ name: "Sara", phone: "0501234567", moveIn: "2026-11-01" }).ok, true);
  const bad = validateInquiry({ name: "", phone: "12", moveIn: "soon" });
  assert.equal(bad.ok, false);
  assert.deepEqual(Object.keys(bad.errors).sort(), ["moveIn", "name", "phone"]);
  assert.match(whatsappLink("+971 50 000 0000", "a b"), /^https:\/\/wa\.me\/971500000000\?text=a%20b$/);
});

import { parseListingMessage } from "./parse-message.ts";

test("reads a lister's WhatsApp message", () => {
  const p = parseListingMessage(
    "🏠 Partition available in Al Barsha 1\nAED 1,400 all bills included\nDeposit 500\nLadies only, near Mall of the Emirates metro\nCall 050 123 4567",
    areas,
  );
  assert.equal(p.type, "partition");
  assert.equal(p.areaSlug, "al-barsha-1");
  assert.equal(p.priceAed, 1400);
  assert.equal(p.deposit, 500);
  assert.equal(p.billsIncluded, true);
  assert.equal(p.gender, "female");
  assert.equal(p.metro, "Mall of the Emirates");
  assert.equal(p.listerPhone, "971501234567");
  assert.equal(p.title, "Partition available in Al Barsha 1");
  assert.ok(!p.description?.includes("050"));
});

import { roommateMatch } from "./match.ts";
import type { RoommateLead } from "./lead.ts";

test("roommate match: gender gate, then budget/area/move-in/lifestyle", () => {
  const base: RoommateLead = { kind: "roommate", mode: "looking", name: "Aisha K", phone: "971501111111", age: 27, gender: "female", nationality: "", profession: "", budget: 1500, areaSlugs: ["al-barsha-1"], moveIn: "2026-11-10", lifestyle: ["Non-smoker", "Quiet"], about: "" };
  const close = { ...base, name: "Maria L", mode: "has_place" as const, budget: 1600, moveIn: "2026-11-15", lifestyle: ["Quiet"] };
  const far = { ...base, name: "Sara", budget: 4000, areaSlugs: ["dubai-marina"], moveIn: "2027-02-01", lifestyle: ["Social"] };
  assert.equal(roommateMatch(base, { ...close, gender: "male" }).score, 0);
  const good = roommateMatch(base, close);
  assert.ok(good.score >= 75, `good match scored ${good.score}`);
  assert.ok(good.reasons.includes("Same area"));
  assert.ok(roommateMatch(base, far).score < 30);
});

test("rankDeals puts the below-market, bills-included place first", async () => {
  const { rankDeals } = await import("./deals.ts");
  const mk = (id: string, priceAed: number, billsIncluded: boolean) => ({ ...base, id, priceAed, billsIncluded, deposit: 500, nearMetroMinutes: 20, verifiedLister: false });
  const deals = rankDeals([mk("a", 1000, false), mk("b", 800, true), mk("c", 1200, false)]);
  assert.equal(deals[0].listing.id, "b");
  assert.equal(deals[0].typicalAed, 1000);
  assert.ok(deals[0].reasons.includes("Bills included"));
});

test("parseSearchText reads type, area, budget and household from free text", async () => {
  const { parseSearchText } = await import("./search.ts");
  const f = parseSearchText(areas, "cheap female bed space in Barsha under 1,500 AED with bills");
  assert.deepEqual(f.types, ["bed_space"]);
  assert.deepEqual(f.areaSlugs, ["al-barsha-1"]);
  assert.equal(f.maxPrice, 1500);
  assert.equal(f.gender, "female");
  assert.equal(f.billsIncluded, true);
  assert.equal(f.sort, "price_asc");
  assert.equal(parseSearchText(areas, "studio JLT 4.5k").maxPrice, 4500);
  assert.deepEqual(parseSearchText(areas, "studio JLT budget 4.5k").maxPrice, 4500);
  assert.deepEqual(parseSearchText(areas, "partition in nahda sharjah").areaSlugs, ["al-nahda-sharjah"]);
  assert.equal(parseSearchText(areas, "room in sharjah").emirate, "Sharjah");
});
