import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { normalizePhone } from "@stayshay/core";
import { denyUnlessAdmin } from "@/lib/admin-guard";
import { getListingsForAdmin, readTenancies, saveTenancies, setOverride, type Tenancy } from "@/lib/store";

const isDate = (s: unknown): s is string => typeof s === "string" && /^\d{4}-\d{2}-\d{2}$/.test(s);
function addMonths(iso: string, months: number) {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCMonth(d.getUTCMonth() + months);
  return d.toISOString().slice(0, 10);
}

/** Beds still free after active tenancies; a listing with none left is hidden as "rented". */
async function syncAvailability(listingId: string) {
  const listing = (await getListingsForAdmin()).find((l) => l.id === listingId);
  if (!listing) return;
  const taken = (await readTenancies()).filter((t) => t.listingId === listingId && t.status === "active").reduce((n, t) => n + t.beds, 0);
  const capacity = listing.type === "bed_space" || listing.type === "partition" ? Math.max(1, listing.bedsInRoom ?? 1) : 1;
  const free = Math.max(0, capacity - taken);
  await setOverride(listingId, { bedsAvailable: free, status: free === 0 ? "rented" : "live" });
}

export async function GET() {
  return (await denyUnlessAdmin()) ?? NextResponse.json({ ok: true, tenancies: await readTenancies() });
}

/** Assign a listing (or N beds of it) to a tenant from a start date for a number of months. */
export async function POST(req: Request) {
  const deny = await denyUnlessAdmin();
  if (deny) return deny;
  const b = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const phone = normalizePhone(String(b.tenantPhone ?? ""));
  const months = Number(b.months);
  const listing = (await getListingsForAdmin()).find((l) => l.id === b.listingId);
  if (!listing || !phone || !String(b.tenantName ?? "").trim() || !isDate(b.startDate) || !(months >= 1 && months <= 36)) {
    return NextResponse.json({ ok: false, error: "Listing, tenant name, valid WhatsApp, start date and 1–36 months are required" }, { status: 422 });
  }
  const t: Tenancy = {
    id: randomUUID().slice(0, 8),
    listingId: listing.id,
    listingTitle: listing.title,
    tenantName: String(b.tenantName).trim().slice(0, 80),
    tenantPhone: phone,
    startDate: b.startDate,
    endDate: addMonths(b.startDate, months),
    rentAed: Number(b.rentAed) || listing.priceAed,
    beds: Math.max(1, Math.floor(Number(b.beds) || 1)),
    status: "active",
    createdAt: new Date().toISOString(),
    note: b.note ? String(b.note).slice(0, 500) : undefined,
  };
  await saveTenancies((all) => [t, ...all]);
  await syncAvailability(listing.id);
  return NextResponse.json({ ok: true, tenancy: t });
}

/** action: "end" frees the beds · "renew" extends by `months` · "reminded" records a reminder was sent. */
export async function PATCH(req: Request) {
  const deny = await denyUnlessAdmin();
  if (deny) return deny;
  const { id, action, months } = (await req.json().catch(() => ({}))) as { id?: string; action?: string; months?: number };
  let changed: Tenancy | undefined;
  await saveTenancies((all) =>
    all.map((t) => {
      if (t.id !== id) return t;
      if (action === "end") changed = { ...t, status: "ended", endedAt: new Date().toISOString() };
      else if (action === "renew") changed = { ...t, endDate: addMonths(t.endDate, Math.min(36, Math.max(1, Number(months) || 1))), lastReminderAt: undefined };
      else if (action === "reminded") changed = { ...t, lastReminderAt: new Date().toISOString() };
      return changed ?? t;
    }),
  );
  if (!changed) return NextResponse.json({ ok: false }, { status: 404 });
  if (action === "end") await syncAvailability(changed.listingId);
  return NextResponse.json({ ok: true, tenancy: changed });
}
