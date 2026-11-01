import { NextResponse } from "next/server";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { randomUUID } from "node:crypto";
import sharp from "sharp";
import { currentUser } from "@/lib/auth";
import { addPhoto } from "@/lib/manager";
import { UPLOAD_DIR } from "@/lib/store";

export const dynamic = "force-dynamic";

/** Owner uploads a photo of one of their apartments. Resized to 1600px, EXIF (incl. location) stripped. */
export async function POST(req: Request) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ ok: false, error: "Sign in first" }, { status: 401 });
  const form = await req.formData().catch(() => null);
  const file = form?.get("photo");
  const propertyId = String(form?.get("propertyId") ?? "");
  if (!(file instanceof File) || !file.size) return NextResponse.json({ ok: false, error: "Choose a photo" }, { status: 400 });
  if (!/^image\/(jpeg|png|webp|heic|heif|avif)$/.test(file.type) || file.size > 12 * 1024 * 1024) return NextResponse.json({ ok: false, error: "Use a JPG, PNG or HEIC photo under 12 MB" }, { status: 422 });
  const out = await sharp(Buffer.from(await file.arrayBuffer())).rotate().resize(1600, 1600, { fit: "inside", withoutEnlargement: true }).jpeg({ quality: 80, mozjpeg: true }).toBuffer().catch(() => null);
  if (!out) return NextResponse.json({ ok: false, error: "That photo couldn't be read" }, { status: 422 });
  const dir = join(UPLOAD_DIR, "manager", user.id.slice(0, 8));
  await mkdir(dir, { recursive: true });
  const name = `${randomUUID().slice(0, 12)}.jpg`;
  await writeFile(join(dir, name), out);
  const data = await addPhoto(user.id, propertyId, `/api/media/manager/${user.id.slice(0, 8)}/${name}`);
  if (!data) return NextResponse.json({ ok: false, error: "Apartment not found, or it already has 20 photos" }, { status: 422 });
  return NextResponse.json({ ok: true, ...data });
}
