import { NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { managerAction, ownerData } from "@/lib/manager";

export const dynamic = "force-dynamic";

/** The signed-in owner's properties, tenants and payments. Private: never cached, never public. */
export async function GET() {
  const user = await currentUser();
  if (!user) return NextResponse.json({ ok: false }, { status: 401 });
  return NextResponse.json({ ok: true, ...(await ownerData(user.id)) }, { headers: { "cache-control": "no-store" } });
}

export async function POST(req: Request) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ ok: false, error: "Sign in first" }, { status: 401 });
  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object") return NextResponse.json({ ok: false, error: "Bad request" }, { status: 400 });
  const r = await managerAction(user.id, body as Record<string, unknown>);
  if (!r.ok) return NextResponse.json(r, { status: 422 });
  return NextResponse.json({ ok: true, id: r.id, ...r.data }, { headers: { "cache-control": "no-store" } });
}
