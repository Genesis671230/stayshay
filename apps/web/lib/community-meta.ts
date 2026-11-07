import { AREAS, PHOTOS, type Listing } from "@stayshay/core";
import type { IconName } from "@/components/ui";
import credits from "./area-photos.json";

export type AreaCredit = { src: string; title: string; artist: string; license: string; page: string };
/** Openly licensed (Wikimedia Commons) photos of each neighbourhood, with the credit the licence requires. */
export const AREA_CREDITS = credits as Record<string, AreaCredit>;

/** What the Stayshay Pass gives you. Shared by the hub, the community page and the roommate board. */
export const PASS_PERKS: { icon: IconName; t: string; d: string }[] = [
  { icon: "users", t: "Every roommate profile", d: "See everyone looking in your area, not just the first 7. Ask the team to introduce you." },
  { icon: "chat", t: "The neighbourhood group chat", d: "Talk to people who already live there and others moving in. Anyone can reply." },
  { icon: "search", t: "Ask before you pay a deposit", d: "Noise, cleanliness, the building, the landlord, the walk to the metro: ask residents first." },
  { icon: "heart", t: "Tenant introductions", d: "Tell us who you’re looking for and we introduce you to matching tenants on WhatsApp." },
  { icon: "map", t: "Personal recommendations", d: "Not sure which building or area? Our team shortlists places for you." },
  { icon: "shield", t: "A safer start", d: "Members are real, signed-in people. Numbers stay private until you choose to share." },
];

export function areaPhoto(slug: string, listings: Listing[]): string {
  return AREA_CREDITS[slug]?.src ?? PHOTOS.areas[slug] ?? listings.find((l) => l.areaSlug === slug && l.photos.length)?.photos[0] ?? "/photos/roommates.jpg";
}

/** Communities worth showing: areas with places or people, busiest first. */
export function rankedAreas(listings: Listing[], roommateAreas: string[]) {
  const n = new Map<string, number>();
  for (const l of listings) n.set(l.areaSlug, (n.get(l.areaSlug) ?? 0) + 1);
  for (const s of roommateAreas) n.set(s, (n.get(s) ?? 0) + 1);
  return AREAS.filter((a) => n.has(a.slug)).sort((a, b) => (n.get(b.slug) ?? 0) - (n.get(a.slug) ?? 0));
}
