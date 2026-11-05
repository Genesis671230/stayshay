import { NextResponse } from "next/server";
import { addReview, validateReview } from "@/lib/reviews";

export const dynamic = "force-dynamic";

const recent = new Map<string, number[]>();

/** Public testimonial submission. Lands as pending; nothing shows until approved. */
export async function POST(req: Request) {
  const ip = req.headers.get("cf-connecting-ip") || req.headers.get("x-real-ip") || "";
  const now = Date.now();
  const hits = (recent.get(ip) ?? []).filter((t) => now - t < 3600_000);
  if (hits.length >= 3) return NextResponse.json({ ok: false, error: "rate_limited" }, { status: 429 });
  hits.push(now);
  recent.set(ip, hits);
  if (recent.size > 5000) recent.clear();

  const b = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  if (!b) return NextResponse.json({ ok: false }, { status: 400 });
  if (b.website) return NextResponse.json({ ok: true }); // honeypot
  const v = validateReview(b);
  if (!v.ok) return NextResponse.json({ ok: false, errors: v.errors }, { status: 422 });
  await addReview(v.value);
  return NextResponse.json({ ok: true });
}
