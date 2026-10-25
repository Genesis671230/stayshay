import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { SESSION_COOKIE, googleProfile, sessionCookieOptions, sessionValue, siteUrl, upsertGoogleUser } from "@/lib/auth";

export async function GET(req: Request) {
  const base = siteUrl(req);
  const url = new URL(req.url);
  const jar = await cookies();
  const state = url.searchParams.get("state");
  const code = url.searchParams.get("code");
  if (!code || !state || state !== jar.get("ss_oauth_state")?.value) return NextResponse.redirect(`${base}/login?error=google_state`);
  try {
    const profile = await googleProfile(code, `${base}/api/auth/google/callback`);
    const user = await upsertGoogleUser(profile);
    // New Google accounts have no phone yet: send them to finish their profile first.
    const next = user.phone ? (jar.get("ss_oauth_next")?.value ?? "/account") : "/account?complete=1";
    const res = NextResponse.redirect(`${base}${next}`);
    res.cookies.set(SESSION_COOKIE, sessionValue(user.id), sessionCookieOptions);
    res.cookies.delete("ss_oauth_state");
    res.cookies.delete("ss_oauth_next");
    return res;
  } catch (e) {
    console.error("[stayshay] google sign-in failed", e);
    return NextResponse.redirect(`${base}/login?error=google_failed`);
  }
}
