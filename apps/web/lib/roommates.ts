import { stripPhones } from "@stayshay/core";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { randomUUID } from "node:crypto";
import sharp from "sharp";
import type { RoommateLead } from "@stayshay/core";
import { DATA_DIR, UPLOAD_DIR } from "./store";

/**
 * Public roommate board. A profile is created from the /roommates onboarding (web or app) and is live in
 * Roommates straight away, unless the person chose to hide it (`prefs.hidden`) or an admin hid it
 * (`status: "hidden"`). Phone numbers are never part of the public card.
 */
export interface RoommateProfile {
  id: string;
  leadId: string;
  userId: string | null;
  status: "pending" | "approved" | "hidden";
  createdAt: string;
  mode: RoommateLead["mode"];
  firstName: string;
  age: number | null;
  gender: RoommateLead["gender"];
  nationality: string;
  profession: string;
  budget: number;
  areaSlugs: string[];
  moveIn: string;
  lifestyle: string[];
  about: string;
  photo: string | null;
  /** Who they'd like to live with. Private: shapes their own deck, never shown to others. */
  prefs?: RoommatePrefs;
}

export interface RoommatePrefs {
  seeking: "any" | "has_place" | "looking";
  ageMin: number | null;
  ageMax: number | null;
  mustHave: string[];
  /** Who can find them on the swipe. Missing means "same": older profiles never agreed to be shown more widely. */
  visibility?: "same" | "everyone";
  /** Neighbourhood answers. Private: they only nudge the order of the deck. */
  commute?: string;
  vibe?: string;
  nearby?: string[];
  /** The person chose to hide their profile from Roommates. Existing connections and chats keep working. */
  hidden?: boolean;
}

/** Cleans whatever the form sent into valid preferences (or undefined). */
export function cleanPrefs(v: unknown): RoommatePrefs | undefined {
  if (!v || typeof v !== "object") return undefined;
  const o = v as Record<string, unknown>;
  const age = (x: unknown) => (Number.isInteger(Number(x)) && Number(x) >= 18 && Number(x) <= 99 ? Number(x) : null);
  let ageMin = o.ageMin == null ? null : age(o.ageMin);
  let ageMax = o.ageMax == null ? null : age(o.ageMax);
  if (ageMin && ageMax && ageMin > ageMax) [ageMin, ageMax] = [ageMax, ageMin];
  return {
    seeking: o.seeking === "has_place" || o.seeking === "looking" ? o.seeking : "any",
    ageMin,
    ageMax,
    mustHave: (Array.isArray(o.mustHave) ? o.mustHave : []).map((x) => String(x).slice(0, 30)).slice(0, 6),
    visibility: o.visibility === "everyone" ? "everyone" : "same",
    commute: String(o.commute ?? "").slice(0, 30),
    vibe: String(o.vibe ?? "").slice(0, 30),
    nearby: (Array.isArray(o.nearby) ? o.nearby : []).map((x) => String(x).slice(0, 30)).slice(0, 6),
    hidden: o.hidden === true,
  };
}

export type PublicRoommate = Omit<RoommateProfile, "leadId" | "userId" | "status" | "prefs">;

const FILE = () => join(DATA_DIR, "roommates.json");
let queue: Promise<unknown> = Promise.resolve();

export async function readRoommates(): Promise<RoommateProfile[]> {
  try {
    return JSON.parse(await readFile(FILE(), "utf8")) as RoommateProfile[];
  } catch {
    return [];
  }
}

function update<T>(fn: (all: RoommateProfile[]) => { all: RoommateProfile[]; result: T }): Promise<T> {
  const run = queue.then(async () => {
    const { all, result } = fn(await readRoommates());
    await mkdir(DATA_DIR, { recursive: true });
    await writeFile(`${FILE()}.tmp`, JSON.stringify(all, null, 2));
    await rename(`${FILE()}.tmp`, FILE());
    return result;
  });
  queue = run.catch(() => {});
  return run;
}

/** Not hidden by the team. Older "pending" profiles count as live too. */
export const isLive = (r: RoommateProfile) => r.status !== "hidden";
/** Live and not hidden by the person themselves: can be shown to others. */
export const isListed = (r: RoommateProfile) => isLive(r) && !r.prefs?.hidden;

export async function publicRoommates(): Promise<PublicRoommate[]> {
  return (await readRoommates())
    .filter(isListed)
    // Contact goes through Stayshay: numbers typed into the text are removed from the public card.
    .map(({ leadId: _l, userId: _u, status: _s, prefs: _p, ...pub }) => ({ ...pub, about: stripPhones(pub.about), profession: stripPhones(pub.profession) }));
}

/** Square-crops and shrinks an uploaded photo (strips EXIF/location data too). Returns its public URL. */
export async function savePhoto(id: string, file: File): Promise<string | null> {
  if (!/^image\/(jpeg|png|webp|heic|heif|avif)$/.test(file.type) || file.size > 10 * 1024 * 1024) return null;
  const out = await sharp(Buffer.from(await file.arrayBuffer()))
    .rotate()
    .resize(600, 600, { fit: "cover", position: "attention" })
    .jpeg({ quality: 82, mozjpeg: true })
    .toBuffer();
  const dir = join(UPLOAD_DIR, "roommates");
  await mkdir(dir, { recursive: true });
  const name = `${id}-${Date.now()}.jpg`;
  await writeFile(join(dir, name), out);
  return `/api/media/roommates/${name}`;
}

export async function addRoommate(lead: RoommateLead, leadId: string, userId: string | null, photo: File | null, prefs?: RoommatePrefs): Promise<RoommateProfile> {
  const id = randomUUID().slice(0, 8);
  const photoUrl = photo ? await savePhoto(id, photo).catch(() => null) : null;
  const profile: RoommateProfile = {
    id,
    leadId,
    userId,
    status: "approved",
    createdAt: new Date().toISOString(),
    mode: lead.mode,
    firstName: lead.name.trim().split(/\s+/)[0] ?? lead.name,
    age: lead.age,
    gender: lead.gender,
    nationality: lead.nationality,
    profession: lead.profession,
    budget: lead.budget,
    areaSlugs: lead.areaSlugs,
    moveIn: lead.moveIn,
    lifestyle: lead.lifestyle,
    about: lead.about,
    photo: photoUrl,
    ...(prefs && { prefs }),
  };
  return update((all) => ({ all: [profile, ...all], result: profile }));
}

/** Edits a profile in place (likes and messages keep pointing at it). Edits show straight away. */
export async function updateRoommate(id: string, lead: RoommateLead, photo: File | null, removePhoto = false, prefs?: RoommatePrefs): Promise<RoommateProfile | undefined> {
  const photoUrl = photo ? await savePhoto(id, photo).catch(() => null) : null;
  return update((all) => {
    const i = all.findIndex((r) => r.id === id);
    if (i < 0) return { all, result: undefined };
    const cur = all[i];
    all[i] = {
      ...cur,
      status: cur.status === "hidden" ? "hidden" : "approved",
      mode: lead.mode,
      firstName: lead.name.trim().split(/\s+/)[0] ?? lead.name,
      age: lead.age,
      gender: lead.gender,
      nationality: lead.nationality,
      profession: lead.profession,
      budget: lead.budget,
      areaSlugs: lead.areaSlugs,
      moveIn: lead.moveIn,
      lifestyle: lead.lifestyle,
      about: lead.about,
      photo: photoUrl ?? (removePhoto ? null : cur.photo),
      prefs: prefs ?? cur.prefs,
    };
    return { all, result: all[i] };
  });
}

export async function setRoommateStatus(id: string, status: RoommateProfile["status"]) {
  return update((all) => {
    const i = all.findIndex((r) => r.id === id);
    if (i >= 0) all[i] = { ...all[i], status };
    return { all, result: all[i] };
  });
}

/** A profile behind the pass: only what's needed to show there's someone there (no name, photo, text or profession). */
export interface LockedRoommate {
  id: string;
  locked: true;
  mode: PublicRoommate["mode"];
  gender: PublicRoommate["gender"];
  budget: number;
  areaSlugs: string[];
}

/** The first `free` profiles are open to everyone; the rest need a Stayshay Pass. */
export function gateRoommates(all: PublicRoommate[], unlocked: boolean, free: number): { open: PublicRoommate[]; locked: LockedRoommate[] } {
  if (unlocked) return { open: all, locked: [] };
  return {
    open: all.slice(0, free),
    locked: all.slice(free).map((p) => ({ id: p.id, locked: true, mode: p.mode, gender: p.gender, budget: Math.round(p.budget / 100) * 100, areaSlugs: p.areaSlugs })),
  };
}
