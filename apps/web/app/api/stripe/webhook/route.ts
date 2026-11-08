import { NextResponse } from "next/server";
import { readUsers } from "@/lib/auth";
import { grantFromSession, syncSubscription } from "@/lib/community";
import { creditTopup } from "@/lib/wallet";
import { getCheckoutSession, verifyWebhook, type CheckoutSession, type StripeSubscription } from "@/lib/stripe";

export const dynamic = "force-dynamic";

/**
 * Optional: keeps passes in sync when Stripe renews or cancels (set STRIPE_WEBHOOK_SECRET and point a Stripe webhook
 * at /api/stripe/webhook for checkout.session.completed and customer.subscription.*). Without it, passes are
 * re-checked with Stripe when their period ends.
 */
export async function POST(req: Request) {
  const raw = await req.text();
  if (!verifyWebhook(raw, req.headers.get("stripe-signature"), process.env.STRIPE_WEBHOOK_SECRET ?? "")) return NextResponse.json({ ok: false }, { status: 400 });
  const ev = JSON.parse(raw) as { type: string; data: { object: Record<string, unknown> } };
  try {
    if (ev.type === "checkout.session.completed") {
      const obj = ev.data.object as unknown as CheckoutSession;
      if (obj.metadata?.product === "stayshay_pass") {
        const s = await getCheckoutSession(obj.id);
        const user = (await readUsers()).find((u) => u.id === s.client_reference_id);
        if (user) await grantFromSession(s, user);
      } else if (obj.metadata?.product === "stayshay_wallet") {
        const s = await getCheckoutSession(obj.id);
        if (s.client_reference_id) await creditTopup(s, s.client_reference_id);
      }
    } else if (ev.type.startsWith("customer.subscription.")) {
      await syncSubscription(ev.data.object as unknown as StripeSubscription);
    }
  } catch (e) {
    console.error("[stripe] webhook", e);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
