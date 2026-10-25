import { NextResponse } from "next/server";
import { currentUser, googleEnabled, toPublic } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const u = await currentUser();
  return NextResponse.json({ user: u ? toPublic(u) : null, google: googleEnabled() }, { headers: { "cache-control": "no-store" } });
}
