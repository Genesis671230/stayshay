import { NextResponse } from "next/server";
import { activeAnnouncement } from "@/lib/store";

export const dynamic = "force-dynamic";

/** The live announcement for the website banner and the app (null when there is none). */
export async function GET() {
  const a = await activeAnnouncement();
  return NextResponse.json(a ? { id: a.id, title: a.title, message: a.message, link: a.link ?? null } : null, {
    headers: { "cache-control": "public, max-age=60", "access-control-allow-origin": "*" },
  });
}
