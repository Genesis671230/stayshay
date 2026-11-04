import { NextResponse } from "next/server";
import { adminAllowed } from "@/lib/admin-guard";
import { isBot, record } from "@/lib/live";

export const dynamic = "force-dynamic";

const recent = new Map<string, number[]>();
const limited = (ip: string) => {
  const now = Date.now();
  const hits = (recent.get(ip) ?? []).filter((t) => now - t < 60_000);
  hits.push(now);
  recent.set(ip, hits);
  if (recent.size > 20000) recent.clear();
  return hits.length > 60;
};

/** Page-view and heartbeat beacon from <LiveBeacon/>. Always 204: tracking must never show an error to a visitor. */
export async function POST(req: Request) {
  const ua = req.headers.get("user-agent") ?? "";
  const ip = req.headers.get("cf-connecting-ip") || req.headers.get("x-real-ip") || req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "";
  const done = new NextResponse(null, { status: 204 });
  if (isBot(ua) || limited(ip)) return done;
  let b: Record<string, unknown>;
  try {
    b = JSON.parse(await req.text());
  } catch {
    return done;
  }
  const str = (v: unknown, n: number) => (typeof v === "string" ? v.slice(0, n) : undefined);
  const sid = str(b.sid, 40);
  const path = str(b.path, 200);
  if (!sid || !/^[\w-]{8,40}$/.test(sid) || !path?.startsWith("/")) return done;
  await record(
    { sid, path, ref: str(b.ref, 300), w: typeof b.w === "number" ? Math.round(b.w) : undefined, utm: str(b.utm, 80) },
    { ip, ua, cfCountry: req.headers.get("cf-ipcountry"), admin: await adminAllowed().catch(() => false), returning: b.r === 1 },
  ).catch(() => {});
  return done;
}
