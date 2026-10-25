import { NextResponse } from "next/server";
import { AREA_BY_SLUG, TYPE_LABEL } from "@stayshay/core";
import { getAllListings, getListing, readLeads } from "@/lib/store";
import { publicRoommates } from "@/lib/roommates";

export const dynamic = "force-dynamic";

export interface ActivityEvent {
  id: string;
  kind: "listing" | "roommate" | "viewing";
  text: string;
  href: string;
  at: string;
  lat: number | null;
  lng: number | null;
  photo: string | null;
}

/**
 * Real recent activity for the "hook" notifications: newest listings, approved roommate profiles and
 * (anonymised) viewing requests from the last 3 days. Nothing here is made up.
 */
export async function GET() {
  const [listings, roommates, leads] = await Promise.all([getAllListings(), publicRoommates(), readLeads()]);
  const events: ActivityEvent[] = [];

  for (const l of [...listings].sort((a, b) => (b.postedAt ?? "").localeCompare(a.postedAt ?? "")).slice(0, 14)) {
    const area = AREA_BY_SLUG.get(l.areaSlug);
    events.push({
      id: `l:${l.id}`,
      kind: "listing",
      text: `AED ${l.priceAed.toLocaleString("en-US")} ${TYPE_LABEL[l.type].toLowerCase()} listed in ${area?.name ?? l.areaName ?? "the UAE"}${l.billsIncluded ? ", bills included" : ""}`,
      href: `/listing/${l.id.toLowerCase()}`,
      at: l.postedAt ?? new Date().toISOString(),
      lat: l.lat ?? area?.lat ?? null,
      lng: l.lng ?? area?.lng ?? null,
      photo: l.photos[0] ?? null,
    });
  }

  for (const r of roommates.slice(0, 8)) {
    const area = r.areaSlugs.map((s) => AREA_BY_SLUG.get(s)).find(Boolean);
    events.push({
      id: `r:${r.id}`,
      kind: "roommate",
      text: `${r.firstName}${r.age ? `, ${r.age},` : ""} is looking for a roommate${area ? ` in ${area.name}` : ""} · up to AED ${r.budget.toLocaleString("en-US")}`,
      href: "/roommates#board",
      at: r.createdAt,
      lat: area?.lat ?? null,
      lng: area?.lng ?? null,
      photo: r.photo,
    });
  }

  const since = Date.now() - 3 * 86400000;
  for (const lead of leads.filter((x) => x.kind === "inquiry" && Date.parse(x.createdAt) > since).slice(0, 8)) {
    const l = lead.listingId ? await getListing(lead.listingId) : undefined;
    const area = l ? AREA_BY_SLUG.get(l.areaSlug) : undefined;
    if (!l || !area) continue;
    events.push({ id: `v:${lead.id}`, kind: "viewing", text: `Someone just requested a viewing in ${area.name}`, href: `/listing/${l.id.toLowerCase()}`, at: lead.createdAt, lat: area.lat, lng: area.lng, photo: l.photos[0] ?? null });
  }

  return NextResponse.json({ events }, { headers: { "cache-control": "public, max-age=120" } });
}
