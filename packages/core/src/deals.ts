import type { Listing } from "./types.ts";

function median(nums: number[]): number | null {
  if (!nums.length) return null;
  const s = [...nums].sort((a, b) => a - b);
  const m = s.length >> 1;
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}

export interface Deal {
  listing: Listing;
  /** Higher is better. ~0 = typical price, 0.3 = clearly below market with perks. */
  score: number;
  /** Typical monthly rent this listing is compared against (same type, same area when there are enough). */
  typicalAed: number;
  /** Plain-English reasons, best first. */
  reasons: string[];
}

/**
 * Value ranking ("Shay's best deals"): how far below the typical price for the same kind of place
 * (same area when it has 3+ listings of that type, otherwise UAE-wide) plus perks renters care about.
 */
export function rankDeals(listings: Listing[], limit = 20): Deal[] {
  const byType = new Map<string, number[]>();
  const byTypeArea = new Map<string, number[]>();
  for (const l of listings) {
    byType.set(l.type, [...(byType.get(l.type) ?? []), l.priceAed]);
    const k = `${l.type}|${l.areaSlug}`;
    byTypeArea.set(k, [...(byTypeArea.get(k) ?? []), l.priceAed]);
  }
  return listings
    .filter((l) => l.priceAed > 0)
    .map((l) => {
      const local = byTypeArea.get(`${l.type}|${l.areaSlug}`) ?? [];
      const typical = (local.length >= 3 ? median(local) : median(byType.get(l.type) ?? [])) ?? l.priceAed;
      const below = (typical - l.priceAed) / typical;
      const reasons: string[] = [];
      if (below >= 0.05) reasons.push(`${Math.round(below * 100)}% below the typical AED ${Math.round(typical).toLocaleString("en-US")}`);
      if (l.billsIncluded) reasons.push("Bills included");
      if (l.deposit === 0) reasons.push("No deposit");
      if (!l.upfrontCost && l.commission === 0) reasons.push("No upfront fees");
      if (l.nearMetroMinutes != null && l.nearMetroMinutes <= 10) reasons.push(`${l.nearMetroMinutes} min to metro`);
      const score =
        below +
        (l.billsIncluded ? 0.08 : 0) +
        (l.deposit === 0 ? 0.05 : 0) +
        (!l.upfrontCost && l.commission === 0 ? 0.03 : 0) +
        (l.nearMetroMinutes != null && l.nearMetroMinutes <= 10 ? 0.05 : 0) +
        (l.verifiedLister ? 0.02 : 0);
      return { listing: l, score: Math.round(score * 1000) / 1000, typicalAed: Math.round(typical), reasons };
    })
    .sort((a, b) => b.score - a.score || a.listing.priceAed - b.listing.priceAed)
    .slice(0, limit);
}
