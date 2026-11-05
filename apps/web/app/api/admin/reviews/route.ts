import { NextResponse } from "next/server";
import { adminAllowed } from "@/lib/admin-guard";
import { setReviewStatus } from "@/lib/reviews";

export const dynamic = "force-dynamic";

export async function PATCH(req: Request) {
  if (!(await adminAllowed())) return NextResponse.json({ ok: false }, { status: 401 });
  const b = (await req.json().catch(() => ({}))) as { id?: string; status?: string };
  if (!b.id || !["approved", "rejected", "pending"].includes(b.status ?? "")) return NextResponse.json({ ok: false }, { status: 400 });
  const r = await setReviewStatus(b.id, b.status as "approved" | "rejected" | "pending");
  return NextResponse.json({ ok: !!r });
}
