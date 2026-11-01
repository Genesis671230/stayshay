import { NextResponse } from "next/server";
import { normalizeRefCode } from "@stayshay/core";
import { readUsers } from "@/lib/auth";

export const dynamic = "force-dynamic";

/** Is this a real referral code? Returns only the referrer's first name, to confirm who referred you. */
export async function GET(req: Request) {
  const code = normalizeRefCode(new URL(req.url).searchParams.get("code"));
  if (!code) return NextResponse.json({ ok: false });
  const u = (await readUsers()).find((x) => x.refCode === code);
  return NextResponse.json(u ? { ok: true, code, name: u.name.split(" ")[0] } : { ok: false }, { headers: { "cache-control": "no-store" } });
}
