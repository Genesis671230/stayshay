import { randomUUID } from "node:crypto";
import { REFERRAL_REWARDS, STAGE_ORDER, normalizePhone, normalizeRefCode, type ReferralStage, type RewardKind } from "@stayshay/core";
import { readJson, readLeads, readTenancies, updateJson, type LeadRecord } from "./store";
import { readUsers, type User } from "./auth";
import { savePhoto } from "./roommates";

/* ---------- partners: brokers and agents with a public profile ---------- */

export interface Partner {
  id: string;
  userId: string;
  /** Same as the user's referral code: the profile lives at /partners/<code>. */
  code: string;
  name: string;
  company: string;
  /** Optional RERA / BRN number the partner gives us; shown only when present. */
  brn: string;
  bio: string;
  areas: string[];
  languages: string[];
  photo: string | null;
  /** Private: Stayshay uses it to pay rewards and coordinate. Never shown publicly. */
  phone: string;
  status: "pending" | "approved" | "hidden";
  createdAt: string;
  updatedAt: string;
}

export type PublicPartner = Omit<Partner, "phone" | "userId" | "status">;

export const readPartners = () => readJson<Partner[]>("partners.json", []);

export async function publicPartners(): Promise<PublicPartner[]> {
  return (await readPartners()).filter((p) => p.status === "approved").map(toPublicPartner);
}

export function toPublicPartner({ phone: _p, userId: _u, status: _s, ...p }: Partner): PublicPartner {
  return p;
}

export async function partnerByCode(code: string): Promise<Partner | undefined> {
  const c = normalizeRefCode(code);
  return c ? (await readPartners()).find((p) => p.code === c) : undefined;
}

const clean = (v: unknown, max: number) => String(v ?? "").replace(/\s+/g, " ").trim().slice(0, max);
const list = (v: unknown, max: number) =>
  String(v ?? "")
    .split(",")
    .map((s) => clean(s, 40))
    .filter(Boolean)
    .slice(0, max);

export type PartnerErrors = Partial<Record<"name" | "phone" | "bio" | "form", string>>;

/** Create or update the signed-in user's partner profile. Any edit goes back to review before it's public. */
export async function savePartner(user: User, code: string, input: Record<string, unknown>, photo: File | null): Promise<{ partner?: Partner; errors: PartnerErrors }> {
  const errors: PartnerErrors = {};
  const name = clean(input.name || user.name, 60);
  const phone = normalizePhone(String(input.phone || user.phone || ""));
  const bio = clean(input.bio, 400).replace(/(?:\+|00)?\d[\d\s-]{7,}\d/g, "");
  if (name.length < 2) errors.name = "Enter your name";
  if (!phone) errors.phone = "Enter your WhatsApp number (kept private)";
  if (bio.length < 20) errors.bio = "Write a line or two about how you help people (20+ characters)";
  if (Object.keys(errors).length) return { errors };

  const existing = (await readPartners()).find((p) => p.userId === user.id);
  const id = existing?.id ?? randomUUID().slice(0, 8);
  const photoUrl = photo && photo.size ? await savePhoto(`partner-${id}`, photo) : null;
  const now = new Date().toISOString();
  const partner: Partner = {
    id,
    userId: user.id,
    code,
    name,
    company: clean(input.company, 60),
    brn: clean(input.brn, 20).replace(/[^\w-]/g, ""),
    bio,
    areas: list(input.areas, 8),
    languages: list(input.languages, 6),
    photo: photoUrl ?? existing?.photo ?? user.picture ?? null,
    phone: phone!,
    status: "pending",
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  };
  await updateJson<Partner[]>("partners.json", [], (all) => [partner, ...all.filter((p) => p.id !== id)]);
  return { partner, errors: {} };
}

export async function setPartnerStatus(id: string, status: Partner["status"]) {
  await updateJson<Partner[]>("partners.json", [], (all) => all.map((p) => (p.id === id ? { ...p, status, updatedAt: new Date().toISOString() } : p)));
}

/* ---------- rewards ---------- */

export interface Reward {
  id: string;
  code: string;
  kind: RewardKind;
  amount: number;
  /** Who the reward is for: first name + initial of the referred person. */
  personLabel: string;
  personKey: string;
  leadId: string | null;
  status: "approved" | "paid" | "cancelled";
  note: string;
  createdAt: string;
  updatedAt: string;
}

export const readRewards = () => readJson<Reward[]>("rewards.json", []);

export async function addReward(input: { code: string; kind: RewardKind; personLabel: string; personKey: string; leadId?: string | null; note?: string }): Promise<Reward | null> {
  const code = normalizeRefCode(input.code);
  if (!code) return null;
  const now = new Date().toISOString();
  const reward: Reward = {
    id: randomUUID().slice(0, 8),
    code,
    kind: input.kind,
    amount: REFERRAL_REWARDS[input.kind],
    personLabel: input.personLabel,
    personKey: input.personKey,
    leadId: input.leadId ?? null,
    status: "approved",
    note: clean(input.note, 200),
    createdAt: now,
    updatedAt: now,
  };
  let dup = false;
  await updateJson<Reward[]>("rewards.json", [], (all) => {
    dup = all.some((r) => r.code === code && r.personKey === reward.personKey && r.kind === reward.kind && r.status !== "cancelled");
    return dup ? all : [reward, ...all];
  });
  return dup ? null : reward;
}

export async function setRewardStatus(id: string, status: Reward["status"]) {
  await updateJson<Reward[]>("rewards.json", [], (all) => all.map((r) => (r.id === id ? { ...r, status, updatedAt: new Date().toISOString() } : r)));
}

/* ---------- who each code brought in ---------- */

export interface Referred {
  /** Phone or email: one row per person even if they sent several requests. */
  key: string;
  /** "Ahmed K." — referrers see who joined, never contact details. */
  label: string;
  stage: ReferralStage;
  joinedAt: string;
  lastActivity: string;
  /** Admin-only extras. */
  phone?: string;
  leadIds: string[];
  userId?: string;
}

export const personLabel = (name: string) => {
  const [first = "", second = ""] = name.trim().split(/\s+/);
  return `${first.slice(0, 1).toUpperCase()}${first.slice(1)}${second ? ` ${second[0].toUpperCase()}.` : ""}`;
};

const later = (a: ReferralStage, b: ReferralStage) => (STAGE_ORDER.indexOf(a) >= STAGE_ORDER.indexOf(b) ? a : b);

function stageOfLead(l: LeadRecord, movedIn: boolean): ReferralStage {
  if (movedIn) return "moved_in";
  if (l.kind === "owner") return "listed";
  return "searching";
}

/** Everyone who arrived through each code, merged by phone/email, with the furthest stage they reached. */
export async function referralsByCode(): Promise<Map<string, Referred[]>> {
  const [users, leads, tenancies, rewards] = await Promise.all([readUsers(), readLeads(), readTenancies(), readRewards()]);
  const movedPhones = new Set(tenancies.map((t) => t.tenantPhone));
  const out = new Map<string, Map<string, Referred>>();
  const put = (code: string, key: string, r: Omit<Referred, "key" | "leadIds"> & { leadId?: string }) => {
    const byKey = out.get(code) ?? new Map<string, Referred>();
    out.set(code, byKey);
    const cur = byKey.get(key);
    if (!cur) {
      byKey.set(key, { key, label: r.label, stage: r.stage, joinedAt: r.joinedAt, lastActivity: r.lastActivity, phone: r.phone, userId: r.userId, leadIds: r.leadId ? [r.leadId] : [] });
      return;
    }
    cur.stage = later(cur.stage, r.stage);
    cur.joinedAt = cur.joinedAt < r.joinedAt ? cur.joinedAt : r.joinedAt;
    cur.lastActivity = cur.lastActivity > r.lastActivity ? cur.lastActivity : r.lastActivity;
    cur.phone ??= r.phone;
    cur.userId ??= r.userId;
    if (r.leadId) cur.leadIds.push(r.leadId);
  };

  const userByRef = new Map<string, string>(); // user id -> referral code they joined with
  for (const u of users) {
    const code = normalizeRefCode(u.referredBy);
    if (!code || code === u.refCode) continue;
    userByRef.set(u.id, code);
    put(code, u.phone || u.email, { label: personLabel(u.name), stage: u.phone && movedPhones.has(u.phone) ? "moved_in" : "joined", joinedAt: u.createdAt, lastActivity: u.lastLoginAt, phone: u.phone ?? undefined, userId: u.id });
  }
  for (const l of leads) {
    const code = normalizeRefCode(l.refCode) ?? (l.userId ? userByRef.get(l.userId) : undefined);
    if (!code) continue;
    const user = l.userId ? users.find((u) => u.id === l.userId) : undefined;
    if (user?.refCode === code) continue; // no self-referrals
    const key = user ? user.phone || user.email : l.phone;
    put(code, key, { label: personLabel(l.name), stage: stageOfLead(l, movedPhones.has(l.phone)), joinedAt: l.createdAt, lastActivity: l.updatedAt, phone: l.phone, leadId: l.id });
  }
  for (const r of rewards) {
    if (r.status === "cancelled") continue;
    const p = out.get(r.code)?.get(r.personKey);
    if (p && r.status === "paid") p.stage = "rewarded";
  }
  return new Map([...out].map(([code, m]) => [code, [...m.values()].sort((a, b) => b.lastActivity.localeCompare(a.lastActivity))]));
}

export interface ReferralSummary {
  people: Referred[];
  rewards: Reward[];
  earned: number;
  paid: number;
  pending: number;
}

/** What a referrer sees on their dashboard: people (no contact details) and rewards. */
export async function summaryFor(code: string): Promise<ReferralSummary> {
  const [byCode, rewards] = await Promise.all([referralsByCode(), readRewards()]);
  // Referrers see names and progress only: no phone, email or internal ids.
  const people = (byCode.get(code) ?? []).map(({ label, stage, joinedAt, lastActivity }, i) => ({ key: String(i), label, stage, joinedAt, lastActivity, leadIds: [] as string[] }));
  const mine = rewards.filter((r) => r.code === code && r.status !== "cancelled");
  const paid = mine.filter((r) => r.status === "paid").reduce((s, r) => s + r.amount, 0);
  const earned = mine.reduce((s, r) => s + r.amount, 0);
  const safe = mine.map((r) => ({ ...r, personKey: "", leadId: null, note: "" }));
  return { people, rewards: safe, earned, paid, pending: earned - paid };
}
