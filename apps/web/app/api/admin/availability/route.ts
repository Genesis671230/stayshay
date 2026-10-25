import { NextResponse } from "next/server";
import type { ListingStatus } from "@stayshay/core";
import { denyUnlessAdmin } from "@/lib/admin-guard";
import { setOverride } from "@/lib/store";

const STATUSES: ListingStatus[] = ["live", "reserved", "rented", "draft", "expired", "pending_review"];

/** Mark any listing live / reserved / rented, or set how many beds are left. */
export async function POST(req: Request) {
  const deny = await denyUnlessAdmin();
  if (deny) return deny;
  const { id, status, bedsAvailable } = (await req.json().catch(() => ({}))) as { id?: string; status?: ListingStatus; bedsAvailable?: number };
  if (!id || (status && !STATUSES.includes(status))) return NextResponse.json({ ok: false }, { status: 400 });
  await setOverride(id, { ...(status && { status }), ...(bedsAvailable != null && { bedsAvailable: Math.max(0, Math.floor(bedsAvailable)) }) });
  return NextResponse.json({ ok: true });
}
