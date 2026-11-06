import { NextResponse } from "next/server";
import { normalizePhone } from "@stayshay/core";
import { addLead } from "@/lib/store";
import { TRACK_KEYS, type CampaignTrack } from "@/lib/campaign";

export const dynamic = "force-dynamic";

const recent = new Map<string, number[]>();
const clean = (v: unknown, max: number) => String(v ?? "").replace(/\s+/g, " ").trim().slice(0, max);

/** Challenge application. Lands in /admin (kind "campaign") and Telegram; contact stays private. */
export async function POST(req: Request) {
  const ip = req.headers.get("cf-connecting-ip") || req.headers.get("x-real-ip") || "";
  const now = Date.now();
  const hits = (recent.get(ip) ?? []).filter((t) => now - t < 3600_000);
  if (hits.length >= 5) return NextResponse.json({ ok: false, error: "rate_limited" }, { status: 429 });
  hits.push(now);
  recent.set(ip, hits);
  if (recent.size > 5000) recent.clear();

  const b = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  if (!b) return NextResponse.json({ ok: false }, { status: 400 });
  if (b.website) return NextResponse.json({ ok: true }); // honeypot
  const errors: Record<string, string> = {};
  const name = clean(b.name, 60);
  const phone = normalizePhone(String(b.phone ?? ""));
  const track = String(b.track ?? "") as CampaignTrack;
  if (name.length < 2) errors.name = "Enter your name";
  if (!phone) errors.phone = "Enter a valid WhatsApp number";
  if (!TRACK_KEYS.includes(track)) errors.track = "Pick a challenge";
  if (Object.keys(errors).length) return NextResponse.json({ ok: false, errors }, { status: 422 });

  const rec = await addLead("campaign", {
    name,
    phone: `+${phone}`,
    track,
    role: clean(b.role, 60),
    reach: clean(b.reach, 60),
    note: clean(b.note, 300),
  });
  return NextResponse.json({ ok: true, id: rec.id });
}
