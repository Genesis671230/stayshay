import { NextResponse } from "next/server";
import { currentUser, ensureRefCode } from "@/lib/auth";
import { summaryFor } from "@/lib/referrals";

export const dynamic = "force-dynamic";

/** The signed-in user's referral code, the people who joined through it and their rewards. */
export async function GET() {
  const user = await currentUser();
  if (!user) return NextResponse.json({ ok: false }, { status: 401 });
  const code = await ensureRefCode(user.id);
  if (!code) return NextResponse.json({ ok: false }, { status: 404 });
  return NextResponse.json({ ok: true, code, ...(await summaryFor(code)) });
}
