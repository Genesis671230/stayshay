import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { createHash } from "node:crypto";
import { LISTINGS, type Listing } from "@stayshay/core";

/**
 * Listings the admin creates (from details listers send on WhatsApp) live in a JSON file next to the app.
 * Good for testing on one server; swap for a database (Supabase) before running more than one instance.
 */
export const DATA_DIR = process.env.STAYSHAY_DATA_DIR || join(process.cwd(), ".data");
const FILE = join(DATA_DIR, "listings.json");
export const UPLOAD_DIR = join(DATA_DIR, "uploads");

export async function readAdminListings(): Promise<Listing[]> {
  try {
    return JSON.parse(await readFile(FILE, "utf8")) as Listing[];
  } catch {
    return [];
  }
}

async function writeAdminListings(list: Listing[]) {
  await mkdir(DATA_DIR, { recursive: true });
  const tmp = `${FILE}.tmp`;
  await writeFile(tmp, JSON.stringify(list, null, 2));
  await rename(tmp, FILE); // atomic swap so a crash never leaves half a file
}

export async function upsertAdminListing(l: Listing) {
  const list = await readAdminListings();
  const i = list.findIndex((x) => x.id === l.id);
  if (i >= 0) list[i] = l;
  else list.unshift(l);
  await writeAdminListings(list);
}

export async function deleteAdminListing(id: string) {
  await writeAdminListings((await readAdminListings()).filter((l) => l.id !== id));
}

export async function nextAdminId(): Promise<string> {
  const list = await readAdminListings();
  const max = list.reduce((m, l) => Math.max(m, Number(l.id.replace(/\D/g, "")) || 0), 1000);
  return `SS${max + 1}`;
}

/** Everything renters can see: admin listings that are live, newest first, then the imported test catalogue. */
export async function getAllListings(): Promise<Listing[]> {
  const admin = (await readAdminListings())
    .filter((l) => (l.status ?? "live") === "live")
    .map(({ listerPhone: _private, ...l }) => l);
  return [...admin, ...LISTINGS];
}

export async function getListing(id: string): Promise<Listing | undefined> {
  return (await getAllListings()).find((l) => l.id.toLowerCase() === id.toLowerCase());
}

/* ---------- admin auth: one shared password (ADMIN_PASSWORD), stored hashed in a cookie ---------- */

export const ADMIN_COOKIE = "stayshay_admin";

export function adminToken(): string | null {
  const pw = process.env.ADMIN_PASSWORD;
  return pw ? createHash("sha256").update(`stayshay:${pw}`).digest("hex") : null;
}

export function isAdmin(cookieValue: string | undefined): boolean {
  const t = adminToken();
  return !!t && cookieValue === t;
}
