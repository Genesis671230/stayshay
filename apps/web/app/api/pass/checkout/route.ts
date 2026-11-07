import { NextResponse } from "next/server";
import { AREA_BY_SLUG } from "@stayshay/core";
import { currentUser, siteUrl } from "@/lib/auth";
import { createPassCheckout, stripeEnabled } from "@/lib/stripe";

export const dynamic = "force-dynamic";

/** Starts Stripe Checkout for a community pass. Sign-in comes first so the pass lands on the right account. */
export async function POST(req: Request) {
  const b = (await req.json().catch(() => ({}))) as { area?: string; returnTo?: string };
  const returnTo = (["/swipe", "/messages", "/roommates"] as const).find((r) => r === b.returnTo);
  // From the swipe or messages, a profile without an area still gets a pass (it unlocks every profile); it joins Dubai Marina's community.
  const area = AREA_BY_SLUG.get(String(b.area ?? "")) ?? (returnTo ? AREA_BY_SLUG.get("dubai-marina") : undefined);
  if (!area) return NextResponse.json({ ok: false, error: "area" }, { status: 400 });
  const user = await currentUser();
  if (!user) return NextResponse.json({ ok: false, error: "signin", next: returnTo ?? `/community/${area.slug}?join=1` }, { status: 401 });
  if (!stripeEnabled()) return NextResponse.json({ ok: false, error: "payments_off" }, { status: 503 });
  try {
    const s = await createPassCheckout({ userId: user.id, email: user.email, area: area.slug, areaName: area.name, origin: siteUrl(req), returnTo });
    return NextResponse.json({ ok: true, url: s.url });
  } catch (e) {
    console.error("[pass] checkout", e);
    return NextResponse.json({ ok: false, error: "stripe" }, { status: 502 });
  }
}
