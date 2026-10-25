import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { ADMIN_COOKIE, isAdmin } from "./store";
import { currentUser, isAdminEmail } from "./auth";

/** Signed in as admin: the shared password cookie, or a Google/password account listed in ADMIN_EMAILS. */
export async function adminAllowed(): Promise<boolean> {
  if (isAdmin((await cookies()).get(ADMIN_COOKIE)?.value)) return true;
  const u = await currentUser();
  return !!u && isAdminEmail(u.email);
}

/** Returns a 401 response when the caller isn't signed in as admin, otherwise null. */
export async function denyUnlessAdmin(): Promise<NextResponse | null> {
  return (await adminAllowed()) ? null : NextResponse.json({ ok: false }, { status: 401 });
}
