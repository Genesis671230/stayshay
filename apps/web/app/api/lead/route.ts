import { NextResponse } from "next/server";
import { validateLead } from "@stayshay/core";

// Tenant "find me a room" and owner "list my place" funnels. Same delivery as /api/inquiry.
export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "bad_json" }, { status: 400 });
  }
  const check = validateLead(body);
  if (!check.ok || !check.value) return NextResponse.json({ ok: false, errors: check.errors }, { status: 422 });

  const record = { ...check.value, receivedAt: new Date().toISOString(), userAgent: req.headers.get("user-agent")?.slice(0, 200) ?? null };
  const hook = process.env.STAYSHAY_INQUIRY_WEBHOOK;
  if (hook) {
    try {
      const res = await fetch(hook, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(record), signal: AbortSignal.timeout(5000) });
      if (!res.ok) throw new Error(`webhook ${res.status}`);
    } catch (err) {
      console.error("[stayshay] lead webhook failed", err, record);
      return NextResponse.json({ ok: false, error: "delivery_failed" }, { status: 502 });
    }
  } else {
    console.info("[stayshay] lead (no webhook configured)", record);
  }
  return NextResponse.json({ ok: true });
}
