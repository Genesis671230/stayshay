import { NextResponse } from "next/server";
import { siteUrl } from "@/lib/auth";
import { getCheckoutSession } from "@/lib/stripe";
import { notify } from "@/lib/telegram";
import { creditTopup } from "@/lib/wallet";

export const dynamic = "force-dynamic";

/** Stripe returns here after a top-up. The session is checked with Stripe before anything is credited. */
export async function GET(req: Request) {
  const base = siteUrl(req);
  const id = new URL(req.url).searchParams.get("session_id") ?? "";
  if (!/^cs_(live|test)_[A-Za-z0-9]+$/.test(id)) return NextResponse.redirect(`${base}/wallet`);
  try {
    const s = await getCheckoutSession(id);
    if (s.metadata.product !== "stayshay_wallet" || !s.client_reference_id) return NextResponse.redirect(`${base}/wallet?error=1`);
    const r = await creditTopup(s, s.client_reference_id);
    if (r?.fresh) notify(`💳 <b>Wallet top-up</b> · AED ${r.amount}`, { urgent: true });
    return NextResponse.redirect(`${base}/wallet?added=${r?.amount ?? 0}`);
  } catch (e) {
    console.error("[wallet] confirm", e);
    return NextResponse.redirect(`${base}/wallet?error=1`);
  }
}
