import { NextResponse } from "next/server";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import sharp from "sharp";
import { AMENITY_LABEL, AREA_BY_SLUG, normalizePhone, type Amenity, type Listing, type ListingType } from "@stayshay/core";
import { UPLOAD_DIR, addLead, nextAdminId, upsertAdminListing } from "@/lib/store";
import { currentUser } from "@/lib/auth";

/**
 * Self-serve listing from any owner (website or app). Saved as "pending_review": invisible to renters until
 * an admin approves it in /admin → Listings. multipart/form-data: `listing` (JSON) + up to 10 `photos`.
 */
const TYPES: ListingType[] = ["bed_space", "partition", "room", "studio", "roommate"];
const MAX_PHOTOS = 10;
const hits = new Map<string, number[]>();

export async function POST(req: Request) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
  const recent = (hits.get(ip) ?? []).filter((t) => Date.now() - t < 60 * 60 * 1000);
  if (recent.length >= 6) return NextResponse.json({ ok: false, error: "Too many listings from this connection. Try again in an hour." }, { status: 429 });

  const form = await req.formData().catch(() => null);
  if (!form) return NextResponse.json({ ok: false, error: "bad form" }, { status: 400 });
  let d: Record<string, unknown>;
  try {
    d = JSON.parse(String(form.get("listing") ?? "{}"));
  } catch {
    return NextResponse.json({ ok: false, error: "bad listing json" }, { status: 400 });
  }
  if (d.website) return NextResponse.json({ ok: true }); // honeypot

  const errors: Record<string, string> = {};
  const type = TYPES.find((t) => t === d.type);
  const area = AREA_BY_SLUG.get(String(d.areaSlug ?? ""));
  const price = Number(d.priceAed);
  const name = String(d.listerName ?? "").trim();
  const phone = normalizePhone(String(d.listerPhone ?? ""));
  const title = String(d.title ?? "").trim();
  if (!type) errors.type = "Pick what you’re renting out";
  if (!area) errors.areaSlug = "Pick the area";
  if (!(price >= 200 && price <= 100000)) errors.priceAed = "Enter the monthly rent";
  if (title.length < 6) errors.title = "Add a short title";
  if (name.length < 2) errors.listerName = "Enter your name";
  if (!phone) errors.listerPhone = "Enter a valid WhatsApp number";
  const files = form.getAll("photos").filter((f): f is File => f instanceof File && f.size > 0 && f.size <= 12 * 1024 * 1024 && /^image\//.test(f.type));
  if (!files.length) errors.photos = "Add at least one photo";
  if (Object.keys(errors).length) return NextResponse.json({ ok: false, errors }, { status: 422 });
  hits.set(ip, [...recent, Date.now()]);

  const id = await nextAdminId();
  const dir = join(UPLOAD_DIR, id);
  await mkdir(dir, { recursive: true });
  const photos: string[] = [];
  for (const [i, file] of files.slice(0, MAX_PHOTOS).entries()) {
    try {
      // Normalise every upload: rotate, cap at 1600px, JPEG, strip metadata (incl. GPS).
      const out = await sharp(Buffer.from(await file.arrayBuffer())).rotate().resize({ width: 1600, height: 1600, fit: "inside", withoutEnlargement: true }).jpeg({ quality: 80, mozjpeg: true }).toBuffer();
      const fileName = `${Date.now()}-${i}.jpg`;
      await writeFile(join(dir, fileName), out);
      photos.push(`/api/media/${id}/${fileName}`);
    } catch {
      /* unreadable image: skip */
    }
  }

  const user = await currentUser();
  const amenities = (Array.isArray(d.amenities) ? d.amenities : []).filter((a): a is Amenity => typeof a === "string" && a in AMENITY_LABEL);
  const gender = d.gender === "male" || d.gender === "female" ? d.gender : "any";
  const couple = d.occupancy === "couple";
  const description = String(d.description ?? "").slice(0, 3000);
  const now = new Date().toISOString();
  const text = (v: unknown, n = 80) => (v == null || v === "" ? null : String(v).slice(0, n));

  const listing: Listing = {
    id,
    type: type!,
    title: title.slice(0, 100),
    areaSlug: area!.slug,
    areaName: area!.name,
    city: area!.emirate,
    building: d.metro ? `Near ${text(d.metro)} Metro` : area!.name,
    metro: text(d.metro),
    nearMetroMinutes: Number(d.nearMetroMinutes) > 0 ? Math.round(Number(d.nearMetroMinutes)) : null,
    priceAed: price,
    priceMaxAed: Number(d.priceMaxAed) > price ? Number(d.priceMaxAed) : null,
    billsIncluded: !!d.billsIncluded,
    utilities: d.billsIncluded ? "All Utilities Included" : "Not included",
    deposit: Math.max(0, Number(d.deposit) || 0),
    upfrontCost: Math.max(0, Number(d.upfrontCost) || 0),
    commission: 0,
    availableFrom: /^\d{4}-\d{2}-\d{2}$/.test(String(d.availableFrom)) ? String(d.availableFrom) : now.slice(0, 10),
    availability: text(d.availability, 40) ?? "Ready to move",
    minStayMonths: 1,
    minimumStay: text(d.minimumStay, 40),
    occupancy: couple ? "couple" : type === "bed_space" ? "shared" : "single",
    bedsInRoom: Math.max(1, Number(d.bedsInRoom) || 1),
    bedsAvailable: Math.max(1, Number(d.bedsAvailable) || 1),
    gender,
    preferredTenant: gender === "female" ? ["Female"] : gender === "male" ? ["Male"] : couple ? ["Male", "Female", "Couple"] : ["Male", "Female"],
    furnished: d.furnished !== false,
    amenities,
    bathroom: text(d.bathroom, 40),
    compliance: { landlordConsent: false, dmPermit: false },
    verifiedLister: false,
    listerName: name.split(/\s+/)[0],
    listerPhone: phone!,
    listerType: "owner",
    rating: 0,
    reviews: 0,
    photos,
    description,
    descriptionLines: description.split(/\n+/).map((s) => s.trim()).filter(Boolean),
    status: "pending_review",
    postedAt: now,
  };
  await upsertAdminListing(listing);

  await addLead(
    "owner",
    { kind: "owner", type: listing.type, areaSlug: listing.areaSlug, rent: price, billsIncluded: listing.billsIncluded, deposit: listing.deposit, spaces: listing.bedsAvailable, household: couple ? "couple" : gender, name, phone: phone!, listingId: id },
    { listingId: id, listingTitle: listing.title, source: d.source === "app" ? "app" : "web", userId: user?.id ?? null, email: user?.email ?? (typeof d.listerEmail === "string" && /\S+@\S+\.\S+/.test(d.listerEmail) ? d.listerEmail : null) },
  );

  return NextResponse.json({ ok: true, id, status: "pending_review", photos: photos.length });
}
