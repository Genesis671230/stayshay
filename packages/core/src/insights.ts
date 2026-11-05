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

/** Day-one cash for a yearly Dubai lease. Typical market percentages; government fees are approximate and flagged. */
export interface MoveInInput {
  yearlyRent: number;
  cheques: number;
  furnished: boolean;
  viaAgent: boolean;
  villa: boolean;
}
export interface MoveInLine {
  label: string;
  amount: number;
  note: string;
  refundable?: boolean;
  approx?: boolean;
}
export const EJARI_FEE_APPROX = 220;
export const DEWA_DEPOSIT_APPROX = { apartment: 2000, villa: 4000 } as const;

export function moveInCost(i: MoveInInput): { lines: MoveInLine[]; total: number; refundable: number; monthly: number } {
  const rent = Math.max(0, i.yearlyRent);
  const cheques = Math.min(12, Math.max(1, Math.round(i.cheques)));
  const lines: MoveInLine[] = [
    { label: "First rent cheque", amount: rent / cheques, note: `${cheques} cheque${cheques > 1 ? "s" : ""} a year` },
    { label: "Security deposit", amount: rent * (i.furnished ? 0.1 : 0.05), note: `about ${i.furnished ? "10" : "5"}% of yearly rent`, refundable: true },
  ];
  if (i.viaAgent) {
    lines.push({ label: "Agency fee", amount: rent * 0.05, note: "about 5% of yearly rent" }, { label: "VAT on agency fee", amount: rent * 0.05 * 0.05, note: "5% VAT" });
  }
  lines.push(
    { label: "Ejari registration", amount: EJARI_FEE_APPROX, note: "approx., check the current fee", approx: true },
    { label: "DEWA connection deposit", amount: i.villa ? DEWA_DEPOSIT_APPROX.villa : DEWA_DEPOSIT_APPROX.apartment, note: "approx., paid when you open the account", refundable: true, approx: true },
  );
  const round = (n: number) => Math.round(n);
  for (const l of lines) l.amount = round(l.amount);
  return {
    lines,
    total: lines.reduce((s, l) => s + l.amount, 0),
    refundable: lines.filter((l) => l.refundable).reduce((s, l) => s + l.amount, 0),
    monthly: round(rent / 12),
  };
}
