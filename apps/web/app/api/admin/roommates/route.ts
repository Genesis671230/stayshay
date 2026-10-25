import { NextResponse } from "next/server";
import { denyUnlessAdmin } from "@/lib/admin-guard";
import { setRoommateStatus } from "@/lib/roommates";

/** Approve (show publicly), hide, or send a profile back to pending. */
export async function PATCH(req: Request) {
  const deny = await denyUnlessAdmin();
  if (deny) return deny;
  const { id, status } = (await req.json().catch(() => ({}))) as { id?: string; status?: string };
  if (!id || !["pending", "approved", "hidden"].includes(status ?? "")) return NextResponse.json({ ok: false }, { status: 400 });
  const p = await setRoommateStatus(id, status as "pending" | "approved" | "hidden");
  return p ? NextResponse.json({ ok: true, profile: p }) : NextResponse.json({ ok: false }, { status: 404 });
}
