import { randomUUID } from "node:crypto";
import { readJson, updateJson } from "./store";
import { esc, notify } from "./telegram";

/**
 * Testimonials. Only real people: submitted from the tools / family form / homepage, held as `pending`, and shown
 * only after the founder approves (one tap in Telegram, or /admin/reviews). Never seeded, never edited for tone.
 */
export interface Review {
  id: string;
  name: string;
  /** "Moved to Al Karama", "Family from London" — the reviewer's own words. */
  role: string;
  rating: number;
  text: string;
  /** Which tool or flow they used: links the testimonial back to it. */
  tool: ToolKey;
  createdAt: string;
  status: "pending" | "approved" | "rejected";
  /** Private, optional: lets the team confirm the person is real. Never rendered. */
  phone?: string;
}

export const TOOLS = {
  "fair-rent": { name: "Fair Rent Check", href: "/tools/fair-rent" },
  budget: { name: "Salary to Rent", href: "/tools/budget" },
  "move-in-cost": { name: "Move-in Cost Calculator", href: "/tools/move-in-cost" },
  swipe: { name: "Roommate Swipe", href: "/swipe" },
  family: { name: "Family home search", href: "/family" },
  find: { name: "Find me a room", href: "/find" },
  shay: { name: "Shay, the AI assistant", href: "/ai" },
  stayshay: { name: "Stayshay", href: "/" },
} as const;
export type ToolKey = keyof typeof TOOLS;
export const isToolKey = (k: unknown): k is ToolKey => typeof k === "string" && k in TOOLS;

export const readReviews = () => readJson<Review[]>("reviews.json", []);

/** Approved reviews, the given tool's first, newest first within each group. */
export async function approvedReviews(tool?: ToolKey, limit = 6): Promise<Review[]> {
  const ok = (await readReviews()).filter((r) => r.status === "approved").sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return (tool ? [...ok.filter((r) => r.tool === tool), ...ok.filter((r) => r.tool !== tool)] : ok).slice(0, limit);
}

export async function reviewStats(): Promise<{ count: number; avg: number }> {
  const ok = (await readReviews()).filter((r) => r.status === "approved");
  return { count: ok.length, avg: ok.length ? Math.round((ok.reduce((s, r) => s + r.rating, 0) / ok.length) * 10) / 10 : 0 };
}

export function validateReview(b: Record<string, unknown>): { ok: true; value: Omit<Review, "id" | "createdAt" | "status"> } | { ok: false; errors: Record<string, string> } {
  const s = (v: unknown, n: number) => String(v ?? "").replace(/\s+/g, " ").trim().slice(0, n);
  const name = s(b.name, 40);
  const role = s(b.role, 60);
  const text = s(b.text, 600);
  const rating = Math.round(Number(b.rating));
  const phone = s(b.phone, 20).replace(/[^\d+]/g, "");
  const errors: Record<string, string> = {};
  if (name.length < 2) errors.name = "Your first name";
  if (!(rating >= 1 && rating <= 5)) errors.rating = "Pick 1 to 5 stars";
  if (text.length < 15) errors.text = "A sentence or two, please";
  if (/https?:\/\/|www\./i.test(text)) errors.text = "No links, please";
  if (Object.keys(errors).length) return { ok: false, errors };
  return { ok: true, value: { name, role, rating, text, tool: isToolKey(b.tool) ? b.tool : "stayshay", ...(phone.length >= 8 ? { phone } : {}) } };
}

export async function addReview(v: Omit<Review, "id" | "createdAt" | "status">): Promise<Review> {
  const r: Review = { ...v, id: randomUUID().slice(0, 8), createdAt: new Date().toISOString(), status: "pending" };
  await updateJson<Review[]>("reviews.json", [], (all) => [r, ...all].slice(0, 2000));
  notify(
    [`<b>New review ${"★".repeat(r.rating)}${"☆".repeat(5 - r.rating)}</b> · ${esc(TOOLS[r.tool].name)}`, `${esc(r.name)}${r.role ? ` · ${esc(r.role)}` : ""}${r.phone ? ` · ${esc(r.phone)}` : ""}`, `“${esc(r.text)}”`, "", "Approve to show it on the site."].join("\n"),
    { urgent: true, buttons: [[{ text: "Approve", data: `rvok:${r.id}` }, { text: "Reject", data: `rvno:${r.id}` }]] },
  );
  return r;
}

export async function setReviewStatus(id: string, status: Review["status"]): Promise<Review | undefined> {
  let found: Review | undefined;
  await updateJson<Review[]>("reviews.json", [], (all) => all.map((r) => (r.id === id ? (found = { ...r, status }) : r)));
  return found;
}
