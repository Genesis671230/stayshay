import { NextResponse } from "next/server";
import { ADMIN_COOKIE, adminToken } from "@/lib/store";

export async function POST(req: Request) {
  const { password } = (await req.json().catch(() => ({}))) as { password?: string };
  const token = adminToken();
  if (!token) return NextResponse.json({ ok: false, error: "ADMIN_PASSWORD is not set on the server" }, { status: 500 });
  if (!password || password !== process.env.ADMIN_PASSWORD) return NextResponse.json({ ok: false, error: "Wrong password" }, { status: 401 });
  const res = NextResponse.json({ ok: true });
  res.cookies.set(ADMIN_COOKIE, token, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production" && !!process.env.VERCEL, path: "/", maxAge: 60 * 60 * 24 * 30 });
  return res;
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.delete(ADMIN_COOKIE);
  return res;
}
