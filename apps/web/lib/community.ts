import { randomUUID } from "node:crypto";
import { AREA_BY_SLUG, stripPhones } from "@stayshay/core";
import { readJson, updateJson } from "./store";
import { isAdminEmail, type User } from "./auth";
import { getSubscription, periodEnd, type CheckoutSession, type StripeSubscription } from "./stripe";

/**
 * Neighbourhood communities. Anyone can see what a community has (counts, the first profiles);
 * the Stayshay Pass (AED 25/month via Stripe) unlocks the full roommate board, the members, the Q&A and the group chat.
 * Posts are visible only to members of that community, never public or indexed. Numbers typed into posts are removed,
 * the team gets each new question on Telegram and can hide any post from /admin/community.
 */

export const FREE_PROFILES = 7;
const GRACE_MS = 2 * 86400_000;

/* ---------------- passes ---------------- */

export interface Pass {
  id: string;
  userId: string;
  name: string;
  email: string;
  area: string;
  status: StripeSubscription["status"] | "manual";
  sessionId: string | null;
  subscriptionId: string | null;
  customerId: string | null;
  amountAed: number;
  periodEnd: string;
  createdAt: string;
  checkedAt: string;
}

const PASSES = "passes.json";
export const readPasses = () => readJson<Pass[]>(PASSES, []);

export const passActive = (p: Pass) => (p.status === "active" || p.status === "trialing" || p.status === "manual" || p.status === "past_due") && Date.parse(p.periodEnd) + GRACE_MS > Date.now();

/** Records (or refreshes) the pass a finished Checkout session paid for. Idempotent per session/subscription. */
export async function grantFromSession(s: CheckoutSession, user: Pick<User, "id" | "name" | "email">): Promise<Pass | null> {
  const sub = typeof s.subscription === "object" ? s.subscription : null;
  if (s.status !== "complete" || (s.payment_status !== "paid" && s.payment_status !== "no_payment_required")) return null;
  const area = s.metadata.area;
  if (!AREA_BY_SLUG.has(area)) return null;
  const now = new Date().toISOString();
  let saved: Pass | null = null;
  await updateJson<Pass[]>(PASSES, [], (all) => {
    const subId = sub?.id ?? (typeof s.subscription === "string" ? s.subscription : null);
    const i = all.findIndex((p) => p.sessionId === s.id || (subId && p.subscriptionId === subId));
    const pass: Pass = {
      id: i >= 0 ? all[i].id : randomUUID().slice(0, 10),
      userId: user.id,
      name: user.name,
      email: user.email,
      area,
      status: sub?.status ?? "active",
      sessionId: s.id,
      subscriptionId: subId,
      customerId: s.customer,
      amountAed: Math.round((s.amount_total ?? 0) / 100),
      periodEnd: new Date(sub ? periodEnd(sub) || Date.now() + 31 * 86400_000 : Date.now() + 31 * 86400_000).toISOString(),
      createdAt: i >= 0 ? all[i].createdAt : now,
      checkedAt: now,
    };
    saved = pass;
    if (i >= 0) all[i] = pass;
    else all.unshift(pass);
    return all;
  });
  return saved;
}

/** Applies a subscription update (webhook or a lazy re-check at period end). */
export async function syncSubscription(sub: StripeSubscription) {
  const end = periodEnd(sub);
  await updateJson<Pass[]>(PASSES, [], (all) =>
    all.map((p) => (p.subscriptionId === sub.id ? { ...p, status: sub.status, periodEnd: end ? new Date(end).toISOString() : p.periodEnd, checkedAt: new Date().toISOString() } : p)),
  );
}

/** A user's passes. Ones past their period end are re-checked with Stripe (renewals without needing a webhook). */
export async function userPasses(userId: string): Promise<Pass[]> {
  const mine = (await readPasses()).filter((p) => p.userId === userId);
  const stale = mine.filter((p) => p.subscriptionId && Date.parse(p.periodEnd) < Date.now() && Date.now() - Date.parse(p.checkedAt) > 3600_000);
  if (stale.length) {
    await Promise.all(stale.map((p) => getSubscription(p.subscriptionId!).then(syncSubscription).catch(() => {})));
    return (await readPasses()).filter((p) => p.userId === userId);
  }
  return mine;
}

export interface Access {
  signedIn: boolean;
  admin: boolean;
  /** Has an active pass for this community. */
  member: boolean;
  /** Has any active pass (unlocks the full roommate board everywhere). */
  anyPass: boolean;
  areas: string[];
}

export async function accessFor(user: User | null, area?: string): Promise<Access> {
  if (!user) return { signedIn: false, admin: false, member: false, anyPass: false, areas: [] };
  const admin = isAdminEmail(user.email);
  const active = (await userPasses(user.id)).filter(passActive);
  const areas = [...new Set(active.map((p) => p.area))];
  return { signedIn: true, admin, member: admin || (!!area && areas.includes(area)), anyPass: admin || areas.length > 0, areas };
}

/* ---------------- posts ---------------- */

export interface Post {
  id: string;
  area: string;
  kind: "question" | "answer" | "chat";
  parentId: string | null;
  userId: string;
  name: string;
  text: string;
  createdAt: string;
  hidden?: boolean;
}

/** What members see: no user ids. */
export type PublicPost = Omit<Post, "userId" | "hidden"> & { mine: boolean };

const POSTS = "community-posts.json";
export const readPosts = () => readJson<Post[]>(POSTS, []);

export const displayName = (name: string) => {
  const [first, last] = name.trim().split(/\s+/);
  return `${first ?? "Member"}${last ? ` ${last[0].toUpperCase()}.` : ""}`;
};

export async function addPost(user: User, area: string, kind: Post["kind"], text: string, parentId: string | null): Promise<Post> {
  const post: Post = {
    id: randomUUID().slice(0, 12),
    area,
    kind,
    parentId: kind === "answer" ? parentId : null,
    userId: user.id,
    name: displayName(user.name),
    // Contact goes through the chat itself or through Stayshay: numbers and emails are removed.
    text: stripPhones(text).replace(/[^\s@]+@[^\s@]+\.[a-z]{2,}/gi, "[email removed]").slice(0, 1500),
    createdAt: new Date().toISOString(),
  };
  await updateJson<Post[]>(POSTS, [], (all) => [post, ...all].slice(0, 20000));
  return post;
}

export async function setPostHidden(id: string, hidden: boolean) {
  await updateJson<Post[]>(POSTS, [], (all) => all.map((p) => (p.id === id ? { ...p, hidden } : p)));
}

const toPublic = (p: Post, me: string): PublicPost => ({ id: p.id, area: p.area, kind: p.kind, parentId: p.parentId, name: p.name, text: p.text, createdAt: p.createdAt, mine: p.userId === me });

export async function communityFeed(area: string, me: string) {
  const all = (await readPosts()).filter((p) => p.area === area && !p.hidden);
  const questions = all.filter((p) => p.kind === "question");
  const answers = all.filter((p) => p.kind === "answer");
  return {
    questions: questions.map((q) => ({ ...toPublic(q, me), answers: answers.filter((a) => a.parentId === q.id).reverse().map((a) => toPublic(a, me)) })),
    chat: all.filter((p) => p.kind === "chat").slice(0, 150).reverse().map((p) => toPublic(p, me)),
  };
}

export async function chatSince(area: string, me: string, since: string) {
  return (await readPosts())
    .filter((p) => p.area === area && !p.hidden && p.kind === "chat" && p.createdAt > since)
    .reverse()
    .map((p) => toPublic(p, me));
}

/** Public numbers for the hub and the locked view: counts only, no content. */
export async function communityStats(): Promise<Record<string, { members: number; questions: number; messages: number }>> {
  const [passes, posts] = await Promise.all([readPasses(), readPosts()]);
  const out: Record<string, { members: number; questions: number; messages: number }> = {};
  const get = (a: string) => (out[a] ??= { members: 0, questions: 0, messages: 0 });
  const seen = new Set<string>();
  for (const p of passes.filter(passActive)) {
    if (seen.has(`${p.area}:${p.userId}`)) continue;
    seen.add(`${p.area}:${p.userId}`);
    get(p.area).members++;
  }
  for (const p of posts) if (!p.hidden) p.kind === "question" ? get(p.area).questions++ : p.kind === "chat" ? get(p.area).messages++ : null;
  return out;
}

/** Members of a community (shown to members only): first name + initial, joined date. */
export async function communityMembers(area: string) {
  const passes = (await readPasses()).filter((p) => p.area === area && passActive(p));
  const byUser = new Map<string, Pass>();
  for (const p of passes) if (!byUser.has(p.userId) || p.createdAt < byUser.get(p.userId)!.createdAt) byUser.set(p.userId, p);
  return [...byUser.values()].map((p) => ({ id: p.id, userId: p.userId, name: displayName(p.name), since: p.createdAt }));
}
