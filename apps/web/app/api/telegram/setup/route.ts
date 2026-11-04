import { NextResponse } from "next/server";
import { denyUnlessAdmin } from "@/lib/admin-guard";
import { setupWebhook } from "@/lib/telegram";
import { SITE } from "@/lib/seo";

export const dynamic = "force-dynamic";

/** Admin-only: (re)register the Telegram webhook and command menu. Also callable by the server with CRON_SECRET. */
export async function POST(req: Request) {
  const cron = process.env.CRON_SECRET ?? "";
  const viaCron = cron.length >= 24 && req.headers.get("x-cron-secret") === cron;
  if (!viaCron) {
    const deny = await denyUnlessAdmin();
    if (deny) return deny;
  }
  return NextResponse.json(await setupWebhook(SITE));
}
