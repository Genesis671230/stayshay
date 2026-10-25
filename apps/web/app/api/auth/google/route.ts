import { NextResponse } from "next/server";
import { googleAuthUrl, googleEnabled, newState, siteUrl } from "@/lib/auth";

/** Starts Google sign-in. `?next=/path` returns there afterwards. */
export async function GET(req: Request) {
  const base = siteUrl(req);
  if (!googleEnabled()) return NextResponse.redirect(`${base}/login?error=google_off`);
  const next = new URL(req.url).searchParams.get("next") ?? "/account";
  const state = newState();
  const res = NextResponse.redirect(googleAuthUrl(`${base}/api/auth/google/callback`, state));
  const opts = { httpOnly: true, sameSite: "lax" as const, secure: base.startsWith("https:"), path: "/", maxAge: 600 };
  res.cookies.set("ss_oauth_state", state, opts);
  res.cookies.set("ss_oauth_next", next.startsWith("/") && !next.startsWith("//") ? next : "/account", opts);
  return res;
}
