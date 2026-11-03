import { NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { buildDailyReport, sendTelegram } from "@/lib/daily";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

const allowed = (req: Request) => {
  const want = process.env.CRON_SECRET ?? "";
  const got = req.headers.get("x-cron-secret") ?? "";
  return want.length >= 24 && got.length === want.length && timingSafeEqual(Buffer.from(got), Buffer.from(want));
};

/**
 * Called by the server's cron every morning (09:00 Dubai). ?dry=1 returns the report without sending it,
 * ?research=0 skips the AI research pass (faster, free).
 */
export async function POST(req: Request) {
  if (!allowed(req)) return NextResponse.json({ ok: false }, { status: 401 });
  const q = new URL(req.url).searchParams;
  const report = await buildDailyReport({ withResearch: q.get("research") !== "0" });
  const sent = q.get("dry") === "1" ? false : await sendTelegram(report.text);
  return NextResponse.json({ ok: true, sent, newPages: report.newPages.length, newPhotos: report.newPhotos.length, text: q.get("dry") === "1" ? report.text : undefined });
}
