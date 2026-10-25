import { NextResponse } from "next/server";
import { SESSION_COOKIE, sessionCookieOptions, sessionValue, signUp, toPublic } from "@/lib/auth";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const { user, errors } = await signUp(body);
  if (!user) return NextResponse.json({ ok: false, errors }, { status: 422 });
  const res = NextResponse.json({ ok: true, user: toPublic(user) });
  res.cookies.set(SESSION_COOKIE, sessionValue(user.id), sessionCookieOptions);
  return res;
}
