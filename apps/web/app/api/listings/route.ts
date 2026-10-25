import { NextResponse } from "next/server";
import { AREAS } from "@stayshay/core";
import { getAllListings } from "@/lib/store";

export const dynamic = "force-dynamic";

/** Public feed for the mobile app: every live listing, photo URLs made absolute. */
export async function GET(req: Request) {
  // Behind a proxy or bound to 0.0.0.0, req.url's host is useless to a phone: prefer the Host the client used.
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
  const proto = req.headers.get("x-forwarded-proto") ?? "http";
  const origin = process.env.PUBLIC_BASE_URL || (host ? `${proto}://${host}` : new URL(req.url).origin);
  const abs = (u: string) => (u.startsWith("http") ? u : `${origin}${u}`);
  const listings = (await getAllListings()).map((l) => ({ ...l, photos: l.photos.map(abs) }));
  const used = new Set(listings.map((l) => l.areaSlug));
  return NextResponse.json(
    { updatedAt: new Date().toISOString(), listings, areas: AREAS.filter((a) => used.has(a.slug)) },
    { headers: { "cache-control": "public, max-age=60", "access-control-allow-origin": "*" } },
  );
}
