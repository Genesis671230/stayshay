import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { randomUUID } from "node:crypto";
import sharp from "sharp";
import type { RoommateLead } from "@stayshay/core";
import { DATA_DIR, UPLOAD_DIR } from "./store";

/**
 * Public roommate board. A profile is created from the /roommates form (web or app) and shows publicly
 * only after the person agreed AND an admin approved it. Phone numbers are never part of the public card.
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
}

export type PublicRoommate = Omit<RoommateProfile, "leadId" | "userId" | "status">;

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

export async function publicRoommates(): Promise<PublicRoommate[]> {
  return (await readRoommates())
    .filter((r) => r.status === "approved")
    .map(({ leadId: _l, userId: _u, status: _s, ...pub }) => pub);
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

export async function addRoommate(lead: RoommateLead, leadId: string, userId: string | null, photo: File | null): Promise<RoommateProfile> {
  const id = randomUUID().slice(0, 8);
  const photoUrl = photo ? await savePhoto(id, photo).catch(() => null) : null;
  const profile: RoommateProfile = {
    id,
    leadId,
    userId,
    status: "pending",
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
  };
  return update((all) => ({ all: [profile, ...all], result: profile }));
}

export async function setRoommateStatus(id: string, status: RoommateProfile["status"]) {
  return update((all) => {
    const i = all.findIndex((r) => r.id === id);
    if (i >= 0) all[i] = { ...all[i], status };
    return { all, result: all[i] };
  });
}
