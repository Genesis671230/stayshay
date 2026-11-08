import { NextResponse } from "next/server";
import { denyUnlessAdmin } from "@/lib/admin-guard";
import { decideRedemption } from "@/lib/wallet";

/** Applies held credits to a confirmed booking, or releases them back to the tenant. */
export async function PATCH(req: Request) {
  const deny = await denyUnlessAdmin();
  if (deny) return deny;
  const { id, status } = (await req.json().catch(() => ({}))) as { id?: string; status?: string };
  if (!id || (status !== "applied" && status !== "cancelled")) return NextResponse.json({ ok: false }, { status: 400 });
  const r = await decideRedemption(id, status);
  return r ? NextResponse.json({ ok: true, redemption: r }) : NextResponse.json({ ok: false }, { status: 404 });
}
