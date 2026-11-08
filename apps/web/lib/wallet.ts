import { randomUUID } from "node:crypto";
import { readJson, updateJson } from "./store";
import type { CheckoutSession } from "./stripe";

/**
 * Rent credits. Closed loop: bought with a card, giftable to a mutual match, spendable only on rent through
 * Stayshay, never paid out as cash. 1 credit = AED 1. Off unless STAYSHAY_WALLET_ENABLED=1, pending legal review
 * of UAE stored-value rules and Stripe's approval.
 */
export const walletEnabled = () => process.env.STAYSHAY_WALLET_ENABLED === "1";

export const TOPUP_PRESETS = [100, 250, 500, 1000, 2500, 5000];
export const TOPUP_MIN = 50;
export const TOPUP_MAX = 5000;
export const GIFT_MIN = 10;
export const GIFT_MAX = 5000;
export const GIFT_MAX_30D = 10000;

export type EntryType = "topup" | "gift_in" | "gift_out" | "hold" | "release";
export interface Entry {
  id: string;
  userId: string;
  type: EntryType;
  /** Signed AED. Balance is the sum of a user's entries. */
  amount: number;
  note: string;
  sessionId?: string;
  redemptionId?: string;
  createdAt: string;
}
export interface Redemption {
  id: string;
  userId: string;
  name: string;
  email: string;
  listingId: string;
  listingTitle: string;
  rentAed: number;
  amount: number;
  status: "requested" | "applied" | "cancelled";
  createdAt: string;
  decidedAt: string | null;
}
interface Store {
  entries: Entry[];
  redemptions: Redemption[];
}

const FILE = "wallet.json";
const empty = (): Store => ({ entries: [], redemptions: [] });
export const readWallet = () => readJson<Store>(FILE, empty());
const sum = (s: Store, userId: string) => s.entries.filter((e) => e.userId === userId).reduce((n, e) => n + e.amount, 0);
const entry = (userId: string, type: EntryType, amount: number, note: string, extra: Partial<Entry> = {}): Entry => ({ id: randomUUID().slice(0, 12), userId, type, amount, note, createdAt: new Date().toISOString(), ...extra });

export async function walletFor(userId: string) {
  const s = await readWallet();
  return {
    balance: sum(s, userId),
    entries: s.entries.filter((e) => e.userId === userId).reverse().slice(0, 100),
    redemptions: s.redemptions.filter((r) => r.userId === userId).reverse(),
  };
}

/** Credits a paid top-up exactly once, whichever of the redirect or the webhook arrives first. */
export async function creditTopup(s: CheckoutSession, userId: string): Promise<{ amount: number; fresh: boolean } | null> {
  const amount = Number(s.metadata.creditAed);
  if (s.status !== "complete" || s.payment_status !== "paid" || !Number.isInteger(amount) || amount <= 0 || s.amount_total !== amount * 100) return null;
  let fresh = false;
  await updateJson<Store>(FILE, empty(), (st) => {
    if (st.entries.some((e) => e.sessionId === s.id)) return st;
    fresh = true;
    st.entries.push(entry(userId, "topup", amount, "Added with card", { sessionId: s.id }));
    return st;
  });
  return { amount, fresh };
}

export type GiftResult = { ok: true; balance: number } | { ok: false; error: "amount" | "balance" | "cap" };

export async function gift(from: { userId: string; name: string }, to: { userId: string; name: string }, amount: number): Promise<GiftResult> {
  if (!Number.isInteger(amount) || amount < GIFT_MIN || amount > GIFT_MAX) return { ok: false, error: "amount" };
  let result: GiftResult = { ok: false, error: "balance" };
  await updateJson<Store>(FILE, empty(), (st) => {
    const since = Date.now() - 30 * 86400_000;
    const sent = st.entries.filter((e) => e.userId === from.userId && e.type === "gift_out" && Date.parse(e.createdAt) > since).reduce((n, e) => n - e.amount, 0);
    const balance = sum(st, from.userId);
    if (sent + amount > GIFT_MAX_30D) {
      result = { ok: false, error: "cap" };
      return st;
    }
    if (balance < amount) return st;
    st.entries.push(entry(from.userId, "gift_out", -amount, `Gift to ${to.name}`), entry(to.userId, "gift_in", amount, `Gift from ${from.name}`));
    result = { ok: true, balance: balance - amount };
    return st;
  });
  return result;
}

export type RedeemResult = { ok: true; redemption: Redemption } | { ok: false; error: "amount" | "balance" | "open" };

/** Holds credits against a listing. The team applies them when the booking is confirmed, or releases them. */
export async function requestRedemption(u: { id: string; name: string; email: string }, l: { id: string; title: string; priceAed: number }, amount: number): Promise<RedeemResult> {
  if (!Number.isInteger(amount) || amount <= 0 || amount > l.priceAed) return { ok: false, error: "amount" };
  let result: RedeemResult = { ok: false, error: "balance" };
  await updateJson<Store>(FILE, empty(), (st) => {
    if (st.redemptions.some((r) => r.userId === u.id && r.listingId === l.id && r.status === "requested")) {
      result = { ok: false, error: "open" };
      return st;
    }
    if (sum(st, u.id) < amount) return st;
    const redemption: Redemption = { id: randomUUID().slice(0, 12), userId: u.id, name: u.name, email: u.email, listingId: l.id, listingTitle: l.title, rentAed: l.priceAed, amount, status: "requested", createdAt: new Date().toISOString(), decidedAt: null };
    st.redemptions.push(redemption);
    st.entries.push(entry(u.id, "hold", -amount, `Held for ${l.title}`, { redemptionId: redemption.id }));
    result = { ok: true, redemption };
    return st;
  });
  return result;
}

/** Applied keeps the hold (the credits are spent). Cancelled returns them. Only an open request can change. */
export async function decideRedemption(id: string, status: "applied" | "cancelled", onlyUser?: string): Promise<Redemption | null> {
  let out: Redemption | null = null;
  await updateJson<Store>(FILE, empty(), (st) => {
    const r = st.redemptions.find((x) => x.id === id && (!onlyUser || x.userId === onlyUser));
    if (!r || r.status !== "requested") return st;
    r.status = status;
    r.decidedAt = new Date().toISOString();
    if (status === "cancelled") st.entries.push(entry(r.userId, "release", r.amount, `Released from ${r.listingTitle}`, { redemptionId: r.id }));
    out = r;
    return st;
  });
  return out;
}
