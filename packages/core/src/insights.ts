import type { Listing, ListingType } from "./types.ts";

/** Middle monthly rent for a kind of place: same area when there are 3+ listings, else UAE-wide. */
export function typicalRent(listings: Listing[], type: ListingType, areaSlug?: string): { median: number; count: number; scope: "area" | "uae" } | null {
  const pick = (ls: Listing[]) => {
    const p = ls.map((l) => l.priceAed).filter((n) => n > 0).sort((a, b) => a - b);
    if (!p.length) return null;
    const m = Math.floor(p.length / 2);
    return { median: p.length % 2 ? p[m] : Math.round((p[m - 1] + p[m]) / 2), count: p.length };
  };
  const ofType = listings.filter((l) => l.type === type);
  const local = areaSlug ? pick(ofType.filter((l) => l.areaSlug === areaSlug)) : null;
  if (local && local.count >= 3) return { ...local, scope: "area" };
  const all = pick(ofType);
  return all ? { ...all, scope: "uae" } : null;
}

export type Verdict = "steal" | "good" | "fair" | "high" | "overpriced";

export const VERDICT_TEXT: Record<Verdict, { title: string; line: string }> = {
  steal: { title: "That's a steal", line: "Well below what people pay for the same kind of place. Grab it, after you've viewed it." },
  good: { title: "Good deal", line: "Below the going rate. Worth moving on quickly." },
  fair: { title: "Fair price", line: "Right around what similar places cost right now." },
  high: { title: "A bit high", line: "Above the going rate. Ask what's included, or compare a few cheaper options." },
  overpriced: { title: "Overpriced", line: "Well above similar places. You can probably do better nearby." },
};

/** How a rent compares with the typical rent: percentage difference (negative = cheaper) and a verdict. */
export function rentVerdict(price: number, median: number): { diffPct: number; verdict: Verdict } {
  const diffPct = Math.round(((price - median) / median) * 100);
  const verdict: Verdict = diffPct <= -25 ? "steal" : diffPct <= -8 ? "good" : diffPct < 8 ? "fair" : diffPct < 25 ? "high" : "overpriced";
  return { diffPct, verdict };
}

/** Comfortable monthly rent for a salary: about a quarter keeps room for savings, a third is the ceiling. */
export function rentBudget(monthlySalary: number): { comfortable: number; max: number } {
  const s = Math.max(0, monthlySalary);
  return { comfortable: Math.round((s * 0.25) / 50) * 50, max: Math.round((s / 3) / 50) * 50 };
}
