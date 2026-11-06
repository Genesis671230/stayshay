import { NextResponse } from "next/server";
import { AREA_BY_SLUG } from "@stayshay/core";
import { currentUser, siteUrl } from "@/lib/auth";
import { createPassCheckout, stripeEnabled } from "@/lib/stripe";

export const dynamic = "force-dynamic";

/** Starts Stripe Checkout for a community pass. Sign-in comes first so the pass lands on the right account. */
export async function POST(req: Request) {
  const b = (await req.json().catch(() => ({}))) as { area?: string };
  const area = AREA_BY_SLUG.get(String(b.area ?? ""));
  if (!area) return NextResponse.json({ ok: false, error: "area" }, { status: 400 });
  const user = await currentUser();
  if (!user) return NextResponse.json({ ok: false, error: "signin", next: `/community/${area.slug}?join=1` }, { status: 401 });
  if (!stripeEnabled()) return NextResponse.json({ ok: false, error: "payments_off" }, { status: 503 });
  try {
    const s = await createPassCheckout({ userId: user.id, email: user.email, area: area.slug, areaName: area.name, origin: siteUrl(req) });
    return NextResponse.json({ ok: true, url: s.url });
  } catch (e) {
    console.error("[pass] checkout", e);
    return NextResponse.json({ ok: false, error: "stripe" }, { status: 502 });
  }
}
