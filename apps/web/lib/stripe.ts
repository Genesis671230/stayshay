import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Minimal Stripe client over the REST API (no SDK). Keys come from env only:
 *   STRIPE_SECRET_KEY, STRIPE_PUBLISHABLE_KEY, STRIPE_WEBHOOK_SECRET (optional)
 *   STAYSHAY_PASS_AED (default 25), STAYSHAY_PASS_PRICE_ID (optional: use a saved Stripe price instead of inline pricing)
 */
const key = () => process.env.STRIPE_SECRET_KEY ?? "";
export const stripeEnabled = () => /^sk_(live|test)_/.test(key());
export const stripeLive = () => key().startsWith("sk_live_");
export const PASS_AED = () => Math.max(1, Number(process.env.STAYSHAY_PASS_AED) || 25);

type Scalar = string | number | boolean | null | undefined;
interface Params {
  [k: string]: Scalar | Params | (Params | Scalar)[];
}

/** Stripe's form encoding: nested objects become a[b][c]=v, arrays a[0][b]=v. */
function encode(obj: Params, prefix = "", out = new URLSearchParams()): URLSearchParams {
  for (const [k, v] of Object.entries(obj)) {
    if (v === undefined || v === null) continue;
    const name = prefix ? `${prefix}[${k}]` : k;
    if (Array.isArray(v)) v.forEach((item, i) => (item && typeof item === "object" ? encode(item, `${name}[${i}]`, out) : out.append(`${name}[${i}]`, String(item))));
    else if (typeof v === "object") encode(v, name, out);
    else out.append(name, String(v));
  }
  return out;
}

async function call<T>(method: "GET" | "POST", path: string, params?: Params): Promise<T> {
  const qs = params ? encode(params).toString() : "";
  const res = await fetch(`https://api.stripe.com/v1/${path}${method === "GET" && qs ? `?${qs}` : ""}`, {
    method,
    headers: { Authorization: `Bearer ${key()}`, "content-type": "application/x-www-form-urlencoded" },
    body: method === "POST" ? qs : undefined,
    cache: "no-store",
  });
  const json = (await res.json()) as T & { error?: { message?: string } };
  if (!res.ok) throw new Error(`stripe ${path}: ${json.error?.message ?? res.status}`);
  return json;
}

export interface StripeSubscription {
  id: string;
  status: "active" | "trialing" | "past_due" | "canceled" | "unpaid" | "incomplete" | "incomplete_expired" | "paused";
  customer: string;
  current_period_end?: number;
  cancel_at_period_end?: boolean;
  items?: { data: { current_period_end?: number }[] };
  metadata?: Record<string, string>;
}

export interface CheckoutSession {
  id: string;
  url: string | null;
  status: "open" | "complete" | "expired";
  payment_status: "paid" | "unpaid" | "no_payment_required";
  client_reference_id: string | null;
  customer: string | null;
  amount_total: number | null;
  metadata: Record<string, string>;
  subscription: string | StripeSubscription | null;
}

/** Newer API versions moved the period end onto the subscription item. */
export const periodEnd = (s: StripeSubscription) => (s.current_period_end ?? s.items?.data[0]?.current_period_end ?? 0) * 1000;

export function createPassCheckout(o: { userId: string; email: string; area: string; areaName: string; origin: string; returnTo?: "/swipe" | "/messages" | "/roommates" }) {
  const price = process.env.STAYSHAY_PASS_PRICE_ID;
  return call<CheckoutSession>("POST", "checkout/sessions", {
    mode: "subscription",
    line_items: [
      price
        ? { price, quantity: 1 }
        : {
            quantity: 1,
            price_data: {
              currency: "aed",
              unit_amount: PASS_AED() * 100,
              recurring: { interval: "month" },
              product_data: { name: `Stayshay Pass · ${o.areaName} community`, description: "Full roommate profiles, the neighbourhood group chat, Q&A with residents and tenant introductions." },
            },
          },
    ],
    customer_email: o.email,
    client_reference_id: o.userId,
    metadata: { userId: o.userId, area: o.area, product: "stayshay_pass", ...(o.returnTo && { returnTo: o.returnTo }) },
    subscription_data: { metadata: { userId: o.userId, area: o.area, product: "stayshay_pass" } },
    allow_promotion_codes: true,
    success_url: `${o.origin}/api/pass/confirm?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: o.returnTo ? `${o.origin}${o.returnTo}?canceled=1` : `${o.origin}/community/${o.area}?canceled=1`,
  });
}

/** One-off card payment for rent credits. 1 credit = AED 1. */
export function createWalletCheckout(o: { userId: string; email: string; amount: number; origin: string }) {
  return call<CheckoutSession>("POST", "checkout/sessions", {
    mode: "payment",
    line_items: [{ quantity: 1, price_data: { currency: "aed", unit_amount: o.amount * 100, product_data: { name: `Stayshay rent credits · AED ${o.amount}`, description: "Usable only for rent booked through Stayshay. Cannot be withdrawn as cash." } } }],
    customer_email: o.email,
    client_reference_id: o.userId,
    metadata: { userId: o.userId, product: "stayshay_wallet", creditAed: String(o.amount) },
    success_url: `${o.origin}/api/wallet/confirm?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${o.origin}/wallet?canceled=1`,
  });
}

export const getCheckoutSession = (id: string) => call<CheckoutSession>("GET", `checkout/sessions/${encodeURIComponent(id)}`, { expand: ["subscription"] });
export const getSubscription = (id: string) => call<StripeSubscription>("GET", `subscriptions/${encodeURIComponent(id)}`);
export const createPortal = (customer: string, returnUrl: string) => call<{ url: string }>("POST", "billing_portal/sessions", { customer, return_url: returnUrl });

/** Checks the Stripe-Signature header (t=…,v1=…) against the raw body. */
export function verifyWebhook(raw: string, header: string | null, secret: string, toleranceSec = 300): boolean {
  if (!header || !secret) return false;
  const parts = Object.fromEntries(header.split(",").map((p) => p.split("=") as [string, string]));
  const t = Number(parts.t);
  const sigs = header.split(",").filter((p) => p.startsWith("v1=")).map((p) => p.slice(3));
  if (!t || !sigs.length || Math.abs(Date.now() / 1000 - t) > toleranceSec) return false;
  const expected = createHmac("sha256", secret).update(`${t}.${raw}`).digest("hex");
  return sigs.some((s) => s.length === expected.length && timingSafeEqual(Buffer.from(s), Buffer.from(expected)));
}
