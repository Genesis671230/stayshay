import { randomUUID } from "node:crypto";
import { roommateMatch, stripPhones, type RoommateLead } from "@stayshay/core";
import { readJson, updateJson } from "./store";
import { readRoommates, type PublicRoommate, type RoommatePrefs, type RoommateProfile } from "./roommates";
import type { User } from "./auth";

/**
 * Roommate Swipe, dating-app style. You need an account and your own roommate profile to swipe.
 * Without a Stayshay Pass you can open FREE_SWIPES profiles in total (counted on the server, so clearing the
 * browser doesn't reset it); after that the deck locks until you subscribe. Liking is free; sending a
 * message needs the pass. Receiving and reading messages is free, so non-members still see who wrote.
 */

export const FREE_SWIPES = 6;

interface SwipeState {
  /** Profile ids revealed to this user, in order. Counts toward the free limit. */
  viewed: string[];
  liked: string[];
  skipped: string[];
}
type SwipeStore = Record<string, SwipeState>;
const SWIPES = "swipes.json";
const empty = (): SwipeState => ({ viewed: [], liked: [], skipped: [] });

/** The user's own profile (the newest one that isn't hidden). Pending profiles can swipe; they show to others once approved. */
export async function myProfile(userId: string): Promise<RoommateProfile | null> {
  return (await readRoommates()).find((r) => r.userId === userId && r.status !== "hidden") ?? null;
}

const asLead = (p: Pick<RoommateProfile, "firstName" | "mode" | "age" | "gender" | "nationality" | "profession" | "budget" | "areaSlugs" | "moveIn" | "lifestyle" | "about">): RoommateLead => ({
  kind: "roommate",
  name: p.firstName,
  phone: "",
  mode: p.mode,
  age: p.age,
  gender: p.gender,
  nationality: p.nationality,
  profession: p.profession,
  budget: p.budget,
  areaSlugs: p.areaSlugs,
  moveIn: p.moveIn,
  lifestyle: p.lifestyle,
  about: p.about,
});

export const toCard = ({ leadId: _l, userId: _u, status: _s, prefs: _p, ...pub }: RoommateProfile): PublicRoommate => ({ ...pub, about: stripPhones(pub.about), profession: stripPhones(pub.profession) });

export type SwipeCard = PublicRoommate & { score: number; reasons: string[]; likedYou: boolean };

/** What a non-member sees of a profile they haven't opened yet: enough to want it, nothing personal. */
export interface Teaser {
  id: string;
  locked: true;
  mode: PublicRoommate["mode"];
  budget: number;
  area: string | null;
  score: number;
}

export interface Filters {
  mode: "all" | "looking" | "has_place";
  max?: number;
  area?: string;
}

export type DeckResult =
  | { state: "card"; card: SwipeCard; used: number; free: number; unlimited: boolean; liked: number }
  | { state: "locked"; used: number; free: number; remaining: number; liked: number }
  | { state: "empty"; used: number; free: number; unlimited: boolean; liked: number };

/** The approved profiles this user can be shown, best fit first. Same-gender only (shared flats here are single-gender). */
async function candidates(me: RoommateProfile, f: Filters) {
  const all = (await readRoommates()).filter((r) => r.status === "approved" && r.id !== me.id && (!me.userId || r.userId !== me.userId));
  const mine = asLead(me);
  return all
    .filter((r) => r.gender === me.gender && (f.mode === "all" || r.mode === f.mode) && (!f.max || r.budget <= f.max) && (!f.area || !r.areaSlugs.length || r.areaSlugs.includes(f.area)))
    .map((r) => ({ r, m: roommateMatch(mine, asLead(r)) }))
    .map((c) => ({ ...c, rank: c.m.score + prefFit(me, c.r) }))
    .sort((a, b) => b.rank - a.rank || b.r.createdAt.localeCompare(a.r.createdAt));
}

/** Nudges the order by what this person said they're looking for. Never hides anyone; filters do that. */
function prefFit(me: RoommateProfile, r: RoommateProfile): number {
  const p = me.prefs;
  if (!p) return 0;
  let n = 0;
  if (p.seeking !== "any") n += r.mode === p.seeking ? 10 : -20;
  if (r.age != null && (p.ageMin || p.ageMax)) n += (!p.ageMin || r.age >= p.ageMin) && (!p.ageMax || r.age <= p.ageMax) ? 8 : -15;
  const theirs = new Set(r.lifestyle.map((x) => x.toLowerCase()));
  for (const m of p.mustHave) n += theirs.has(m.toLowerCase()) ? 5 : -3;
  return n;
}

/**
 * Live hints while someone builds their profile: how many people fit so far, the typical budget and the
 * popular areas among people like them. Counts only, never anyone's details.
 */
export async function suggest(q: { gender: "male" | "female"; budget: number; areas: string[]; seeking: RoommatePrefs["seeking"]; ageMin: number | null; ageMax: number | null }, excludeUserId: string) {
  const pool = (await readRoommates()).filter((r) => r.status === "approved" && r.gender === q.gender && r.userId !== excludeUserId);
  const inAreas = (r: RoommateProfile) => !q.areas.length || !r.areaSlugs.length || r.areaSlugs.some((a) => q.areas.includes(a));
  const fits = pool.filter(
    (r) =>
      inAreas(r) &&
      (!q.budget || Math.abs(r.budget - q.budget) / Math.max(r.budget, q.budget) <= 0.35) &&
      (q.seeking === "any" || r.mode === q.seeking) &&
      (r.age == null || ((!q.ageMin || r.age >= q.ageMin) && (!q.ageMax || r.age <= q.ageMax))),
  );
  const local = pool.filter(inAreas).map((r) => r.budget).sort((a, b) => a - b);
  const areaCount = new Map<string, number>();
  for (const r of pool) for (const a of r.areaSlugs) areaCount.set(a, (areaCount.get(a) ?? 0) + 1);
  const tagCount = new Map<string, number>();
  for (const r of pool) for (const t of r.lifestyle) tagCount.set(t, (tagCount.get(t) ?? 0) + 1);
  const top = (m: Map<string, number>, n: number) => [...m.entries()].filter(([, c]) => c >= 2).sort((a, b) => b[1] - a[1]).slice(0, n).map(([k]) => k);
  return {
    fit: fits.length,
    total: pool.length,
    typicalBudget: local.length >= 3 ? Math.round(local[local.length >> 1] / 50) * 50 : null,
    popularAreas: top(areaCount, 5),
    popularHabits: top(tagCount, 4),
  };
}

/** Profile ids whose owners sent me a request to connect (liked my profile). */
async function requesterIds(myProfileId: string): Promise<Set<string>> {
  const [store, all] = await Promise.all([readJson<SwipeStore>(SWIPES, {}), readRoommates()]);
  const out = new Set<string>();
  for (const r of all) if (r.status === "approved" && r.userId && store[r.userId]?.liked.includes(myProfileId)) out.add(r.id);
  return out;
}

const cardOf = (c: { r: RoommateProfile; m: { score: number; reasons: string[] } }, likedYou: boolean): SwipeCard => ({ ...toCard(c.r), score: c.m.score, reasons: c.m.reasons, likedYou });

/**
 * The card to show now. An undecided card already revealed comes back first (a refresh never burns a view).
 * Otherwise the next best profile is revealed and counted, unless the free views are used up.
 */
export async function nextCard(user: User, me: RoommateProfile, unlimited: boolean, f: Filters = { mode: "all" }): Promise<DeckResult> {
  const [pool, req] = await Promise.all([candidates(me, f), requesterIds(me.id)]);
  let picked: (typeof pool)[number] | null = null;
  let result: DeckResult | null = null;
  await updateJson<SwipeStore>(SWIPES, {}, (store) => {
    const s = (store[user.id] ??= empty());
    const decided = new Set([...s.liked, ...s.skipped]);
    const used = s.viewed.length;
    // People who asked to connect come first and never count toward the free views.
    const pending = pool.find((c) => (s.viewed.includes(c.r.id) || req.has(c.r.id)) && !decided.has(c.r.id));
    if (pending) {
      picked = pending;
      return store;
    }
    const fresh = pool.filter((c) => !s.viewed.includes(c.r.id) && !decided.has(c.r.id));
    if (!fresh.length) {
      result = { state: "empty", used, free: FREE_SWIPES, unlimited, liked: s.liked.length };
      return store;
    }
    if (!unlimited && used >= FREE_SWIPES) {
      result = { state: "locked", used, free: FREE_SWIPES, remaining: fresh.length, liked: s.liked.length };
      return store;
    }
    picked = fresh[0];
    s.viewed.push(fresh[0].r.id);
    return store;
  });
  if (result) return result;
  const s = (await readJson<SwipeStore>(SWIPES, {}))[user.id] ?? empty();
  const p = picked as unknown as (typeof pool)[number];
  return { state: "card", card: cardOf(p, req.has(p.r.id)), used: s.viewed.length, free: FREE_SWIPES, unlimited, liked: s.liked.length };
}

/** Explore grid: opened profiles in full, the rest as teasers for non-members. */
export async function explore(user: User, me: RoommateProfile, unlimited: boolean, f: Filters) {
  const [pool, req, store] = await Promise.all([candidates(me, f), requesterIds(me.id), readJson<SwipeStore>(SWIPES, {})]);
  const s = store[user.id] ?? empty();
  const items = pool.map((c): (SwipeCard & { liked: boolean }) | Teaser =>
    unlimited || s.viewed.includes(c.r.id) || req.has(c.r.id) || s.liked.includes(c.r.id)
      ? { ...cardOf(c, req.has(c.r.id)), liked: s.liked.includes(c.r.id) }
      : { id: c.r.id, locked: true, mode: c.r.mode, budget: Math.round(c.r.budget / 100) * 100, area: c.r.areaSlugs[0] ?? null, score: c.m.score },
  );
  return { items, used: s.viewed.length, free: FREE_SWIPES, unlimited };
}

/** Opens one profile from the grid, counting it as a view if it's new. */
export async function reveal(user: User, me: RoommateProfile, unlimited: boolean, profileId: string): Promise<{ state: "card"; card: SwipeCard; used: number } | { state: "locked"; used: number } | { state: "missing" }> {
  const [pool, req] = await Promise.all([candidates(me, { mode: "all" }), requesterIds(me.id)]);
  const c = pool.find((x) => x.r.id === profileId);
  if (!c) return { state: "missing" };
  let allowed = false;
  let used = 0;
  await updateJson<SwipeStore>(SWIPES, {}, (store) => {
    const s = (store[user.id] ??= empty());
    if (s.viewed.includes(profileId) || req.has(profileId) || s.liked.includes(profileId)) allowed = true;
    else if (unlimited || s.viewed.length < FREE_SWIPES) {
      s.viewed.push(profileId);
      allowed = true;
    }
    used = s.viewed.length;
    return store;
  });
  return allowed ? { state: "card", card: cardOf(c, req.has(profileId)), used } : { state: "locked", used };
}

/** Like (request to connect / accept) or skip (decline). Returns whether it's now a match. */
export async function decide(user: User, me: RoommateProfile, profileId: string, action: "like" | "skip"): Promise<{ ok: boolean; match: boolean }> {
  const req = await requesterIds(me.id);
  let ok = false;
  await updateJson<SwipeStore>(SWIPES, {}, (store) => {
    const s = (store[user.id] ??= empty());
    if (!s.viewed.includes(profileId) && !req.has(profileId) && !s.liked.includes(profileId)) return store;
    ok = true;
    s.liked = s.liked.filter((x) => x !== profileId);
    s.skipped = s.skipped.filter((x) => x !== profileId);
    (action === "like" ? s.liked : s.skipped).push(profileId);
    return store;
  });
  return { ok, match: ok && action === "like" && req.has(profileId) };
}

/** Requests to connect waiting for me, my matches, and the requests I've sent. */
export async function connections(user: User, me: RoommateProfile) {
  const [store, all, req] = await Promise.all([readJson<SwipeStore>(SWIPES, {}), readRoommates(), requesterIds(me.id)]);
  const s = store[user.id] ?? empty();
  const mine = asLead(me);
  const byId = new Map(all.filter((r) => r.status === "approved").map((r) => [r.id, r]));
  const card = (r: RoommateProfile) => cardOf({ r, m: roommateMatch(mine, asLead(r)) }, req.has(r.id));
  const pick = (ids: Iterable<string>) => [...ids].map((id) => byId.get(id)).filter((r): r is RoommateProfile => !!r).map(card);
  return {
    incoming: pick([...req].filter((id) => !s.liked.includes(id) && !s.skipped.includes(id))),
    matches: pick([...s.liked].reverse().filter((id) => req.has(id))),
    sent: pick([...s.liked].reverse().filter((id) => !req.has(id))),
  };
}

export async function incomingCount(userId: string, myProfileId: string) {
  const s = (await readJson<SwipeStore>(SWIPES, {}))[userId] ?? empty();
  return [...(await requesterIds(myProfileId))].filter((id) => !s.liked.includes(id) && !s.skipped.includes(id)).length;
}

/* ---------------- direct messages ---------------- */

export interface DirectMessage {
  id: string;
  fromUser: string;
  fromProfile: string;
  /** Recipient account. null when the profile was made without an account; the team forwards it on WhatsApp. */
  toUser: string | null;
  toProfile: string;
  text: string;
  createdAt: string;
  readAt: string | null;
}
const DMS = "direct-messages.json";
export const readDms = () => readJson<DirectMessage[]>(DMS, []);

export async function sendDm(from: { user: User; profile: RoommateProfile }, to: RoommateProfile, text: string): Promise<DirectMessage> {
  const msg: DirectMessage = {
    id: randomUUID().slice(0, 12),
    fromUser: from.user.id,
    fromProfile: from.profile.id,
    toUser: to.userId,
    toProfile: to.id,
    text: text.trim().slice(0, 1000),
    createdAt: new Date().toISOString(),
    readAt: null,
  };
  await updateJson<DirectMessage[]>(DMS, [], (all) => [...all, msg].slice(-50000));
  return msg;
}

/** Messages between me and the person behind `otherProfile`. Marks the ones sent to me as read. */
export async function thread(userId: string, myProfileId: string, other: RoommateProfile) {
  const mine = (m: DirectMessage) => m.fromUser === userId;
  const inThread = (m: DirectMessage) =>
    (m.fromUser === userId && m.toProfile === other.id) || (m.toUser === userId && m.fromProfile === other.id) || (m.toProfile === myProfileId && m.fromProfile === other.id);
  const msgs = (await readDms()).filter(inThread);
  if (msgs.some((m) => !mine(m) && !m.readAt)) {
    const now = new Date().toISOString();
    const ids = new Set(msgs.filter((m) => !mine(m) && !m.readAt).map((m) => m.id));
    await updateJson<DirectMessage[]>(DMS, [], (all) => all.map((m) => (ids.has(m.id) ? { ...m, readAt: now } : m)));
  }
  return msgs.map((m) => ({ id: m.id, mine: mine(m), text: m.text, createdAt: m.createdAt }));
}

/** One row per person I've talked to: their card, the last message and how many unread. */
export async function inbox(userId: string, myProfileId: string | null) {
  const [dms, profiles] = await Promise.all([readDms(), readRoommates()]);
  const byId = new Map(profiles.map((p) => [p.id, p]));
  const rows = new Map<string, { other: string; last: DirectMessage; unread: number }>();
  for (const m of dms) {
    const sent = m.fromUser === userId;
    const got = m.toUser === userId || (!!myProfileId && m.toProfile === myProfileId);
    if (!sent && !got) continue;
    const other = sent ? m.toProfile : m.fromProfile;
    const row = rows.get(other) ?? { other, last: m, unread: 0 };
    row.last = m;
    if (!sent && !m.readAt) row.unread++;
    rows.set(other, row);
  }
  return [...rows.values()]
    .map((r) => {
      const p = byId.get(r.other);
      if (!p || p.status === "hidden") return null;
      return { profile: toCard(p), last: { text: r.last.text, mine: r.last.fromUser === userId, createdAt: r.last.createdAt }, unread: r.unread };
    })
    .filter((x): x is NonNullable<typeof x> => !!x)
    .sort((a, b) => b.last.createdAt.localeCompare(a.last.createdAt));
}

export async function unreadCount(userId: string, myProfileId: string | null) {
  return (await readDms()).filter((m) => m.fromUser !== userId && !m.readAt && (m.toUser === userId || (!!myProfileId && m.toProfile === myProfileId))).length;
}

/** Someone may open a conversation only with a profile they've been shown on the swipe, or one that wrote to them. */
export async function canContact(userId: string, myProfileId: string, profileId: string): Promise<boolean> {
  const s = (await readJson<SwipeStore>(SWIPES, {}))[userId];
  if (s?.viewed.includes(profileId) || s?.liked.includes(profileId)) return true;
  if ((await requesterIds(myProfileId)).has(profileId)) return true;
  return (await readDms()).some((m) => m.fromProfile === profileId && (m.toUser === userId || m.toProfile === myProfileId));
}
