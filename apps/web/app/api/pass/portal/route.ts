import { NextResponse } from "next/server";
import { currentUser, siteUrl } from "@/lib/auth";
import { readPasses } from "@/lib/community";
import { createPortal } from "@/lib/stripe";

export const dynamic = "force-dynamic";

/** Stripe's billing page: cancel, change card, download invoices. */
export async function POST(req: Request) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ ok: false }, { status: 401 });
  const pass = (await readPasses()).find((p) => p.userId === user.id && p.customerId);
  if (!pass?.customerId) return NextResponse.json({ ok: false, error: "none" }, { status: 404 });
  try {
    const p = await createPortal(pass.customerId, `${siteUrl(req)}/community/${pass.area}`);
    return NextResponse.json({ ok: true, url: p.url });
  } catch (e) {
    console.error("[pass] portal", e);
    return NextResponse.json({ ok: false, error: "stripe" }, { status: 502 });
  }
}
