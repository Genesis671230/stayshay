import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { ADMIN_COOKIE, isAdmin } from "./store";

/** Returns a 401 response when the caller isn't signed in as admin, otherwise null. */
export async function denyUnlessAdmin(): Promise<NextResponse | null> {
  return isAdmin((await cookies()).get(ADMIN_COOKIE)?.value) ? null : NextResponse.json({ ok: false }, { status: 401 });
}
