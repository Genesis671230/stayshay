import { NextResponse } from "next/server";
import { esc, notify } from "@/lib/telegram";

export const dynamic = "force-dynamic";

const recent = new Map<string, number[]>();

/**
 * Someone tapped a WhatsApp button. No personal data: just what they asked about and the page, so the team sees
 * the tap in Telegram before the WhatsApp message lands (and knows a chat is coming even if they never hit send).
 */
export async function POST(req: Request) {
  const ip = req.headers.get("cf-connecting-ip") || req.headers.get("x-real-ip") || "";
  const ua = req.headers.get("user-agent") || "";
  if (/bot|crawl|spider|headless|lighthouse/i.test(ua)) return NextResponse.json({ ok: true });
  const now = Date.now();
  const hits = (recent.get(ip) ?? []).filter((t) => now - t < 600_000);
  if (hits.length >= 4) return NextResponse.json({ ok: true });
  hits.push(now);
  recent.set(ip, hits);
  if (recent.size > 5000) recent.clear();

  const b = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  const label = String(b?.label ?? "").slice(0, 80);
  const page = String(b?.page ?? "").slice(0, 120);
  const kind = String(b?.kind ?? "ask").replace(/[^a-z_-]/g, "").slice(0, 20);
  if (!label) return NextResponse.json({ ok: false }, { status: 400 });
  const icon = kind === "service" ? "🛠" : kind === "campaign" ? "🏆" : kind === "family" ? "👨‍👩‍👧" : "💬";
  notify(`${icon} <b>WhatsApp tap</b>: ${esc(label)}\n${esc(page)}\n<i>Their message should arrive on WhatsApp now.</i>`);
  return NextResponse.json({ ok: true });
}
