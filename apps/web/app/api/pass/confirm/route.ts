import { NextResponse } from "next/server";
import { AREA_BY_SLUG } from "@stayshay/core";
import { currentUser, readUsers, siteUrl } from "@/lib/auth";
import { getCheckoutSession } from "@/lib/stripe";
import { grantFromSession } from "@/lib/community";
import { notify, esc } from "@/lib/telegram";

export const dynamic = "force-dynamic";

/** Stripe sends people back here after paying. We check the session with Stripe ourselves before unlocking anything. */
export async function GET(req: Request) {
  const base = siteUrl(req);
  const id = new URL(req.url).searchParams.get("session_id") ?? "";
  if (!/^cs_(live|test)_[A-Za-z0-9]+$/.test(id)) return NextResponse.redirect(`${base}/community`);
  try {
    const s = await getCheckoutSession(id);
    const me = await currentUser();
    const owner = me && me.id === s.client_reference_id ? me : (await readUsers()).find((u) => u.id === s.client_reference_id);
    if (!owner) return NextResponse.redirect(`${base}/community`);
    const pass = await grantFromSession(s, owner);
    const area = AREA_BY_SLUG.get(s.metadata.area);
    if (pass && pass.createdAt === pass.checkedAt) {
      notify(`💳 <b>New Stayshay Pass</b> · AED ${pass.amountAed}\n${esc(owner.name)} joined the <b>${esc(area?.name ?? pass.area)}</b> community`, { urgent: true });
    }
    const back = ["/swipe", "/messages", "/roommates"].includes(s.metadata.returnTo) ? s.metadata.returnTo : `/community/${s.metadata.area}`;
    return NextResponse.redirect(`${base}${back}?welcome=${pass ? 1 : 0}`);
  } catch (e) {
    console.error("[pass] confirm", e);
    return NextResponse.redirect(`${base}/community?error=payment`);
  }
}
