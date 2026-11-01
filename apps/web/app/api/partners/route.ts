import { NextResponse } from "next/server";
import { currentUser, ensureRefCode } from "@/lib/auth";
import { publicPartners, savePartner } from "@/lib/referrals";

export const dynamic = "force-dynamic";

/** Approved partner profiles (no phone numbers). */
export async function GET() {
  return NextResponse.json({ partners: await publicPartners() }, { headers: { "cache-control": "public, max-age=60" } });
}

/** Create or update the signed-in user's partner profile (multipart: fields + optional photo). Goes to review. */
export async function POST(req: Request) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ ok: false, error: "Sign in first" }, { status: 401 });
  const form = await req.formData().catch(() => null);
  if (!form) return NextResponse.json({ ok: false, error: "bad form" }, { status: 400 });
  const code = await ensureRefCode(user.id);
  if (!code) return NextResponse.json({ ok: false, error: "Account not found" }, { status: 404 });
  const input = Object.fromEntries([...form.entries()].filter(([, v]) => typeof v === "string"));
  const photo = form.get("photo");
  const { partner, errors } = await savePartner(user, code, input, photo instanceof File ? photo : null);
  if (!partner) return NextResponse.json({ ok: false, errors }, { status: 422 });
  return NextResponse.json({ ok: true, code, status: partner.status });
}
