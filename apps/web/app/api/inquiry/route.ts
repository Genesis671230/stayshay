import { NextResponse } from "next/server";
import { validateInquiry } from "@stayshay/core";
import { getListing } from "@/lib/store";

// Best-effort per-instance throttle. Replace with a shared store (Upstash/Supabase) once inquiries persist.
const hits = new Map<string, number[]>();
const WINDOW_MS = 10 * 60 * 1000;
const MAX_PER_WINDOW = 8;

function limited(key: string): boolean {
  const now = Date.now();
  const recent = (hits.get(key) ?? []).filter((t) => now - t < WINDOW_MS);
  recent.push(now);
  hits.set(key, recent);
  return recent.length > MAX_PER_WINDOW;
}

export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "bad_json" }, { status: 400 });
  }

  const check = validateInquiry(body);
  if (!check.ok || !check.value) return NextResponse.json({ ok: false, errors: check.errors }, { status: 422 });

  // Honeypot filled: pretend success so bots don't retry.
  if (check.value.website) return NextResponse.json({ ok: true });

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
  if (limited(`${ip}:${check.value.phone}`)) return NextResponse.json({ ok: false, error: "rate_limited" }, { status: 429 });

  const listing = check.value.listingId ? await getListing(check.value.listingId) : null;
  const record = {
    ...check.value,
    website: undefined,
    via: body.via === "form" ? "form" : "whatsapp",
    listingTitle: listing?.title ?? null,
    receivedAt: new Date().toISOString(),
    userAgent: req.headers.get("user-agent")?.slice(0, 200) ?? null,
  };

  const hook = process.env.STAYSHAY_INQUIRY_WEBHOOK;
  if (hook) {
    try {
      const res = await fetch(hook, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(record),
        signal: AbortSignal.timeout(5000),
      });
      if (!res.ok) throw new Error(`webhook ${res.status}`);
    } catch (err) {
      console.error("[stayshay] inquiry webhook failed", err, record);
      return NextResponse.json({ ok: false, error: "delivery_failed" }, { status: 502 });
    }
  } else {
    console.info("[stayshay] inquiry (no webhook configured)", record);
  }

  return NextResponse.json({ ok: true });
}
