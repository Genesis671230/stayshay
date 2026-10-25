import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { mkdir, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import type { Listing, ListingStatus } from "@stayshay/core";
import { ADMIN_COOKIE, UPLOAD_DIR, deleteAdminListing, isAdmin, nextAdminId, readAdminListings, upsertAdminListing } from "@/lib/store";

async function guard() {
  return isAdmin((await cookies()).get(ADMIN_COOKIE)?.value);
}

const IMAGE_EXT: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/avif": "avif", "image/heic": "heic" };
const MAX_PHOTO = 8 * 1024 * 1024;

export async function GET() {
  if (!(await guard())) return NextResponse.json({ ok: false }, { status: 401 });
  return NextResponse.json({ ok: true, listings: await readAdminListings() });
}

/**
 * Create or update. multipart/form-data: `listing` (JSON) + `photos` (new files, appended after any kept photos).
 */
export async function POST(req: Request) {
  if (!(await guard())) return NextResponse.json({ ok: false }, { status: 401 });
  const form = await req.formData();
  let data: Partial<Listing>;
  try {
    data = JSON.parse(String(form.get("listing") ?? "{}"));
  } catch {
    return NextResponse.json({ ok: false, error: "bad listing json" }, { status: 400 });
  }
  if (!data.title || !data.type || !data.areaSlug || !(Number(data.priceAed) > 0)) {
    return NextResponse.json({ ok: false, error: "Title, type, area and price are required" }, { status: 422 });
  }

  const id = data.id || (await nextAdminId());
  const kept = (data.photos ?? []).filter((p) => typeof p === "string");
  const files = form.getAll("photos").filter((f): f is File => f instanceof File && f.size > 0);
  const added: string[] = [];
  if (files.length) await mkdir(join(UPLOAD_DIR, id), { recursive: true });
  for (const [i, file] of files.entries()) {
    const ext = IMAGE_EXT[file.type];
    if (!ext || file.size > MAX_PHOTO) continue;
    const name = `${Date.now()}-${i}.${ext}`;
    await writeFile(join(UPLOAD_DIR, id, name), Buffer.from(await file.arrayBuffer()));
    added.push(`/api/media/${id}/${name}`);
  }

  const now = new Date().toISOString();
  const listing: Listing = {
    occupancy: "single",
    bedsInRoom: 1,
    bedsAvailable: 1,
    gender: "any",
    furnished: true,
    amenities: [],
    nearMetroMinutes: null,
    compliance: { landlordConsent: false, dmPermit: false },
    verifiedLister: false,
    listerName: "Owner",
    listerType: "owner",
    rating: 0,
    reviews: 0,
    deposit: 0,
    commission: 0,
    billsIncluded: false,
    minStayMonths: 1,
    availableFrom: now.slice(0, 10),
    building: "",
    description: "",
    ...data,
    id,
    priceAed: Number(data.priceAed),
    photos: [...kept, ...added],
    status: (data.status ?? "live") as ListingStatus,
    postedAt: data.postedAt ?? now,
  } as Listing;
  listing.descriptionLines = (listing.description ?? "").split(/\n+/).map((s) => s.trim()).filter(Boolean);
  await upsertAdminListing(listing);
  return NextResponse.json({ ok: true, listing });
}

export async function DELETE(req: Request) {
  if (!(await guard())) return NextResponse.json({ ok: false }, { status: 401 });
  const id = new URL(req.url).searchParams.get("id");
  if (!id || !/^[\w-]+$/.test(id)) return NextResponse.json({ ok: false }, { status: 400 });
  await deleteAdminListing(id);
  await rm(join(UPLOAD_DIR, id), { recursive: true, force: true });
  return NextResponse.json({ ok: true });
}
