import { NextResponse } from "next/server";
import { currentUser, readUsers, siteUrl } from "@/lib/auth";
import { readRoommates } from "@/lib/roommates";
import { createWalletCheckout, stripeEnabled } from "@/lib/stripe";
import { getListing } from "@/lib/store";
import { isMatch, myProfile, sendDm } from "@/lib/swipe";
import { esc, notify } from "@/lib/telegram";
import { GIFT_MAX, GIFT_MAX_30D, GIFT_MIN, TOPUP_MAX, TOPUP_MIN, TOPUP_PRESETS, decideRedemption, gift, requestRedemption, walletEnabled, walletFor } from "@/lib/wallet";

export const dynamic = "force-dynamic";
const noStore = { headers: { "cache-control": "no-store" } };
const fail = (error: string, status = 400) => NextResponse.json({ ok: false, error }, { status });

export async function GET() {
  if (!walletEnabled()) return fail("off", 404);
  const user = await currentUser();
  if (!user) return fail("signin", 401);
  return NextResponse.json({ ok: true, ...(await walletFor(user.id)), presets: TOPUP_PRESETS, limits: { topupMin: TOPUP_MIN, topupMax: TOPUP_MAX, giftMin: GIFT_MIN, giftMax: GIFT_MAX, giftMax30d: GIFT_MAX_30D } }, noStore);
}

/** { action: "topup", amount } | { action: "gift", to, amount, confirm } | { action: "redeem", listingId, amount } | { action: "cancel", id } */
export async function POST(req: Request) {
  if (!walletEnabled()) return fail("off", 404);
  const user = await currentUser();
  if (!user) return fail("signin", 401);
  const b = (await req.json().catch(() => ({}))) as { action?: string; amount?: number; to?: string; confirm?: boolean; listingId?: string; id?: string };
  const amount = Number(b.amount);

  if (b.action === "topup") {
    if (!Number.isInteger(amount) || amount < TOPUP_MIN || amount > TOPUP_MAX) return fail("amount");
    if (!stripeEnabled()) return fail("payments_off", 503);
    try {
      const s = await createWalletCheckout({ userId: user.id, email: user.email, amount, origin: siteUrl(req) });
      return NextResponse.json({ ok: true, url: s.url });
    } catch (e) {
      console.error("[wallet] checkout", e);
      return fail("stripe", 502);
    }
  }

  if (b.action === "gift") {
    if (b.confirm !== true) return fail("confirm");
    const me = await myProfile(user.id);
    const other = (await readRoommates()).find((r) => r.id === b.to && r.status === "approved");
    if (!me || !other?.userId || !(await isMatch(user.id, me.id, other.id))) return fail("not_match", 403);
    const receiver = (await readUsers()).find((u) => u.id === other.userId);
    if (!receiver) return fail("not_match", 403);
    const r = await gift({ userId: user.id, name: me.firstName }, { userId: receiver.id, name: other.firstName }, amount);
    if (!r.ok) return fail(r.error);
    await sendDm({ user, profile: me }, other, `Sent you AED ${amount.toLocaleString("en-US")} in Stayshay rent credits. They’re in your wallet, ready to use on a booking.`, true);
    notify(`🎁 <b>Rent credit gift</b> · AED ${amount}\n${esc(user.email)} to ${esc(receiver.email)}`, { urgent: amount >= 1000 });
    return NextResponse.json({ ok: true, balance: r.balance });
  }

  if (b.action === "redeem") {
    const l = await getListing(String(b.listingId ?? ""));
    if (!l) return fail("not_found", 404);
    const r = await requestRedemption(user, { id: l.id, title: l.title, priceAed: l.priceAed }, amount);
    if (!r.ok) return fail(r.error);
    notify(`🏠 <b>Rent credits to apply</b> · AED ${amount}\n${esc(user.name)} (${esc(user.email)}) on ${esc(l.title)}\nConfirm in /admin/wallet`, { urgent: true });
    return NextResponse.json({ ok: true, redemption: r.redemption });
  }

  if (b.action === "cancel") {
    const r = await decideRedemption(String(b.id ?? ""), "cancelled", user.id);
    return r ? NextResponse.json({ ok: true }) : fail("not_found", 404);
  }
  return fail("action");
}
