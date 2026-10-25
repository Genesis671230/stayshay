import { NextResponse } from "next/server";
import { SESSION_COOKIE, sessionCookieOptions, sessionValue, signIn, toPublic } from "@/lib/auth";

// Small per-instance brake on password guessing.
const fails = new Map<string, number[]>();

export async function POST(req: Request) {
  const { email, password } = (await req.json().catch(() => ({}))) as { email?: string; password?: string };
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
  const recent = (fails.get(ip) ?? []).filter((t) => Date.now() - t < 15 * 60 * 1000);
  if (recent.length >= 10) return NextResponse.json({ ok: false, errors: { form: "Too many attempts. Try again in 15 minutes." } }, { status: 429 });
  const user = email && password ? await signIn(email, password) : null;
  if (!user) {
    fails.set(ip, [...recent, Date.now()]);
    return NextResponse.json({ ok: false, errors: { form: "Wrong email or password" } }, { status: 401 });
  }
  const res = NextResponse.json({ ok: true, user: toPublic(user) });
  res.cookies.set(SESSION_COOKIE, sessionValue(user.id), sessionCookieOptions);
  return res;
}
