import type { RoommateLead } from "./lead.ts";

export interface RoommateMatch {
  score: number;
  reasons: string[];
}

const days = (a: string, b: string) => Math.abs(Date.parse(a) - Date.parse(b)) / 86400000;

/**
 * How well two roommate profiles fit, 0–100, with the reasons in plain words.
 * Gender is a hard rule (shared flats here are single-gender); everything else adds up:
 * budget 30 · areas 25 · move-in 15 · lifestyle 20 · one has a place and the other is looking 10.
 */
export function roommateMatch(a: RoommateLead, b: RoommateLead): RoommateMatch {
  if (a.gender !== b.gender) return { score: 0, reasons: ["Different household (male / female)"] };
  const reasons: string[] = [];
  let score = 0;

  const gap = Math.abs(a.budget - b.budget) / Math.max(a.budget, b.budget);
  const budget = Math.max(0, 1 - gap * 2) * 30;
  score += budget;
  if (gap <= 0.15) reasons.push("Similar budget");

  const shared = a.areaSlugs.filter((s) => b.areaSlugs.includes(s));
  if (shared.length) {
    score += 25;
    reasons.push(shared.length === 1 ? "Same area" : `${shared.length} areas in common`);
  } else if (!a.areaSlugs.length || !b.areaSlugs.length) {
    score += 12;
    reasons.push("Flexible on area");
  }

  const d = days(a.moveIn, b.moveIn);
  score += Math.max(0, 1 - d / 45) * 15;
  if (d <= 14) reasons.push("Moving around the same time");

  const la = new Set(a.lifestyle.map((x) => x.toLowerCase()));
  const lb = new Set(b.lifestyle.map((x) => x.toLowerCase()));
  const union = new Set([...la, ...lb]);
  const common = [...la].filter((x) => lb.has(x));
  score += union.size ? (common.length / union.size) * 20 : 10;
  if (common.length) reasons.push(`Both: ${common.slice(0, 3).join(", ")}`);

  if (a.mode !== b.mode) {
    score += 10;
    reasons.push(a.mode === "has_place" ? `${a.name.split(" ")[0]} has a place` : `${b.name.split(" ")[0]} has a place`);
  }

  return { score: Math.round(Math.min(100, score)), reasons };
}
