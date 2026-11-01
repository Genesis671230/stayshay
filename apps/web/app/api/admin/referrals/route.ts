import { NextResponse } from "next/server";
import { REFERRAL_REWARDS, type RewardKind } from "@stayshay/core";
import { denyUnlessAdmin } from "@/lib/admin-guard";
import { addReward, setPartnerStatus, setRewardStatus } from "@/lib/referrals";

export const dynamic = "force-dynamic";

/** Record a reward for a referred person who moved in (or whose listing got its first tenant). */
export async function POST(req: Request) {
  const denied = await denyUnlessAdmin();
  if (denied) return denied;
  const b = await req.json().catch(() => ({}));
  if (!(b.kind in REFERRAL_REWARDS)) return NextResponse.json({ ok: false, error: "kind" }, { status: 400 });
  const reward = await addReward({ code: b.code, kind: b.kind as RewardKind, personLabel: String(b.personLabel ?? ""), personKey: String(b.personKey ?? ""), leadId: b.leadId ?? null, note: b.note });
  if (!reward) return NextResponse.json({ ok: false, error: "Already rewarded for this person" }, { status: 409 });
  return NextResponse.json({ ok: true, reward });
}

/** { partnerId, status } approves/hides a partner profile; { rewardId, status } marks a reward paid/cancelled. */
export async function PATCH(req: Request) {
  const denied = await denyUnlessAdmin();
  if (denied) return denied;
  const b = await req.json().catch(() => ({}));
  if (b.partnerId && ["pending", "approved", "hidden"].includes(b.status)) await setPartnerStatus(String(b.partnerId), b.status);
  else if (b.rewardId && ["approved", "paid", "cancelled"].includes(b.status)) await setRewardStatus(String(b.rewardId), b.status);
  else return NextResponse.json({ ok: false }, { status: 400 });
  return NextResponse.json({ ok: true });
}
