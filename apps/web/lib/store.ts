import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { createHash, randomUUID } from "node:crypto";
import { LISTINGS, type Listing, type ListingStatus } from "@stayshay/core";

/**
 * File-backed store for one server (pm2 on EC2): admin listings, leads, tenancies, availability
 * overrides and announcements, each a JSON file in STAYSHAY_DATA_DIR. Move to a database before
 * running more than one instance.
 */
export const DATA_DIR = process.env.STAYSHAY_DATA_DIR || join(process.cwd(), ".data");
export const UPLOAD_DIR = join(DATA_DIR, "uploads");

async function readJson<T>(name: string, fallback: T): Promise<T> {
  try {
    return JSON.parse(await readFile(join(DATA_DIR, name), "utf8")) as T;
  } catch {
    return fallback;
  }
}

// Writes are serialised per file so two quick requests can't interleave read-modify-write.
const queues = new Map<string, Promise<unknown>>();
async function updateJson<T>(name: string, fallback: T, fn: (cur: T) => T | Promise<T>): Promise<T> {
  const prev = queues.get(name) ?? Promise.resolve();
  const run = prev.then(async () => {
    const next = await fn(await readJson(name, fallback));
    await mkdir(DATA_DIR, { recursive: true });
    const file = join(DATA_DIR, name);
    await writeFile(`${file}.tmp`, JSON.stringify(next, null, 2));
    await rename(`${file}.tmp`, file); // atomic swap so a crash never leaves half a file
    return next;
  });
  queues.set(name, run.catch(() => {}));
  return run;
}

/* ---------- listings ---------- */

export const readAdminListings = () => readJson<Listing[]>("listings.json", []);

export async function upsertAdminListing(l: Listing) {
  await updateJson<Listing[]>("listings.json", [], (list) => {
    const i = list.findIndex((x) => x.id === l.id);
    if (i >= 0) list[i] = l;
    else list.unshift(l);
    return list;
  });
}

export async function deleteAdminListing(id: string) {
  await updateJson<Listing[]>("listings.json", [], (list) => list.filter((l) => l.id !== id));
}

export async function nextAdminId(): Promise<string> {
  const list = await readAdminListings();
  const max = list.reduce((m, l) => Math.max(m, Number(l.id.replace(/\D/g, "")) || 0), 1000);
  return `SS${max + 1}`;
}

/** Availability set from the admin (reserved / rented / beds left), for admin and imported listings alike. */
export interface ListingOverride {
  status?: ListingStatus;
  bedsAvailable?: number;
  updatedAt: string;
}
export const readOverrides = () => readJson<Record<string, ListingOverride>>("overrides.json", {});

export async function setOverride(id: string, patch: Partial<ListingOverride>) {
  await updateJson<Record<string, ListingOverride>>("overrides.json", {}, (all) => {
    all[id] = { ...all[id], ...patch, updatedAt: new Date().toISOString() };
    return all;
  });
}

/** Admin + imported listings with overrides applied, every status (for the admin). */
export async function getListingsForAdmin(): Promise<Listing[]> {
  const [admin, overrides] = await Promise.all([readAdminListings(), readOverrides()]);
  return [...admin, ...LISTINGS].map((l) => {
    const o = overrides[l.id];
    return o ? { ...l, ...(o.status && { status: o.status }), ...(o.bedsAvailable != null && { bedsAvailable: o.bedsAvailable }) } : l;
  });
}

/** What renters can see: live only, lister phone stripped. */
export async function getAllListings(): Promise<Listing[]> {
  return (await getListingsForAdmin()).filter((l) => (l.status ?? "live") === "live").map(({ listerPhone: _private, ...l }) => l);
}

export async function getListing(id: string): Promise<Listing | undefined> {
  return (await getAllListings()).find((l) => l.id.toLowerCase() === id.toLowerCase());
}

/* ---------- leads: viewing inquiries + tenant / owner / roommate requests ---------- */

export type LeadKind = "inquiry" | "tenant" | "owner" | "roommate" | "chat";
export type LeadStatus = "new" | "contacted" | "matched" | "closed";

export interface LeadRecord {
  id: string;
  kind: LeadKind;
  status: LeadStatus;
  createdAt: string;
  updatedAt: string;
  name: string;
  phone: string;
  source: "web" | "app" | "ai";
  /** Signed-in account that sent it, when there was one. */
  userId?: string | null;
  email?: string | null;
  listingId?: string | null;
  listingTitle?: string | null;
  /** The validated request exactly as submitted. */
  data: Record<string, unknown>;
  note?: string;
}

export const readLeads = () => readJson<LeadRecord[]>("leads.json", []);

export async function addLead(kind: LeadKind, data: Record<string, unknown> & { name: string; phone: string }, extra: Partial<LeadRecord> = {}) {
  const now = new Date().toISOString();
  const rec: LeadRecord = { id: randomUUID().slice(0, 8), kind, status: "new", createdAt: now, updatedAt: now, name: data.name, phone: data.phone, source: "web", data, ...extra };
  await updateJson<LeadRecord[]>("leads.json", [], (all) => [rec, ...all].slice(0, 5000));
  return rec;
}

export async function updateLead(id: string, patch: Partial<Pick<LeadRecord, "status" | "note">>) {
  let found: LeadRecord | undefined;
  await updateJson<LeadRecord[]>("leads.json", [], (all) =>
    all.map((l) => (l.id === id ? (found = { ...l, ...patch, updatedAt: new Date().toISOString() }) : l)),
  );
  return found;
}

/* ---------- tenancies: a listing (or some of its beds) assigned to a tenant for a period ---------- */

export interface Tenancy {
  id: string;
  listingId: string;
  listingTitle: string;
  tenantName: string;
  tenantPhone: string;
  startDate: string;
  endDate: string;
  rentAed: number;
  beds: number;
  status: "active" | "ended";
  createdAt: string;
  endedAt?: string;
  lastReminderAt?: string;
  note?: string;
}

export const readTenancies = () => readJson<Tenancy[]>("tenancies.json", []);

export async function saveTenancies(fn: (all: Tenancy[]) => Tenancy[]) {
  return updateJson<Tenancy[]>("tenancies.json", [], fn);
}

/* ---------- announcements: site + app banner, optional WhatsApp broadcast ---------- */

export interface Announcement {
  id: string;
  title: string;
  message: string;
  link?: string;
  active: boolean;
  createdAt: string;
  expiresAt?: string;
}

export const readAnnouncements = () => readJson<Announcement[]>("announcements.json", []);

export async function saveAnnouncements(fn: (all: Announcement[]) => Announcement[]) {
  return updateJson<Announcement[]>("announcements.json", [], fn);
}

export async function activeAnnouncement(): Promise<Announcement | null> {
  const today = new Date().toISOString().slice(0, 10);
  return (await readAnnouncements()).find((a) => a.active && (!a.expiresAt || a.expiresAt >= today)) ?? null;
}

/* ---------- admin auth: one shared password (ADMIN_PASSWORD), stored hashed in a cookie ---------- */

export const ADMIN_COOKIE = "stayshay_admin";

export function adminToken(): string | null {
  const pw = process.env.ADMIN_PASSWORD;
  return pw ? createHash("sha256").update(`stayshay:${pw}`).digest("hex") : null;
}

/** Admin = the shared ADMIN_PASSWORD cookie, or a signed-in account whose email is in ADMIN_EMAILS (checked in admin-guard). */
export function isAdmin(cookieValue: string | undefined): boolean {
  const t = adminToken();
  return !!t && cookieValue === t;
}
