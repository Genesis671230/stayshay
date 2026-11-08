import { NextResponse } from "next/server";
import { AREA_BY_SLUG } from "@stayshay/core";
import { currentUser } from "@/lib/auth";
import { accessFor } from "@/lib/community";
import { connections, decide, explore, incomingCount, myProfile, messageQuota, nextCard, reveal, toCard, unreadCount, type Filters } from "@/lib/swipe";

export const dynamic = "force-dynamic";
const noStore = { headers: { "cache-control": "no-store" } };
const MODES = ["all", "looking", "has_place"] as const;

function filtersFrom(sp: URLSearchParams): Filters {
  const max = Number(sp.get("max"));
  const area = sp.get("area");
  const gender = sp.get("gender");
  const ageMin = Number(sp.get("ageMin"));
  const ageMax = Number(sp.get("ageMax"));
  const tag = (sp.get("tag") ?? "").slice(0, 30);
  return {
    mode: MODES.find((m) => m === sp.get("mode")) ?? "all",
    ...(max > 0 && { max }),
    ...(area && AREA_BY_SLUG.has(area) && { area }),
    ...((gender === "female" || gender === "male") && { gender }),
    ...(ageMin > 0 && { ageMin }),
    ...(ageMax > 0 && { ageMax }),
    ...(tag && { tag }),
  };
}

/**
 * Roommate app data. Needs an account and a roommate profile.
 *   ?view=deck (default)  the current swipe card, or locked / empty
 *   ?view=explore         the grid: opened profiles in full, the rest as teasers for non-members
 *   ?view=connections     requests to connect, matches, requests sent
 */
export async function GET(req: Request) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ ok: false, error: "signin" }, { status: 401 });
  const me = await myProfile(user.id);
  if (!me) return NextResponse.json({ ok: false, error: "profile" }, { status: 409 });
  const sp = new URL(req.url).searchParams;
  const view = sp.get("view") ?? "deck";
  const access = await accessFor(user);
  // Filters are a Pass feature, enforced here: without it the deck is random whatever the URL says.
  const f: Filters = access.anyPass ? filtersFrom(sp) : { mode: "all" };
  const [unread, incoming, quota] = await Promise.all([unreadCount(user.id, me.id), incomingCount(user.id, me.id), messageQuota(user.id, access.anyPass)]);
  const base = { ok: true, pass: access.anyPass, unread, incoming, quota, me: { ...toCard(me), status: me.status, prefs: me.prefs ?? null } };
  if (view === "explore") return NextResponse.json({ ...base, explore: await explore(user, me, access.anyPass, f) }, noStore);
  if (view === "connections") return NextResponse.json({ ...base, connections: await connections(user, me) }, noStore);
  return NextResponse.json({ ...base, deck: await nextCard(user, me, access.anyPass, f) }, noStore);
}

/** { id, action: "like" | "skip" | "reveal" }. Like = request to connect (or accept one); skip = pass (or decline). */
export async function POST(req: Request) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ ok: false, error: "signin" }, { status: 401 });
  const me = await myProfile(user.id);
  if (!me) return NextResponse.json({ ok: false, error: "profile" }, { status: 409 });
  const b = (await req.json().catch(() => ({}))) as { id?: string; action?: string };
  if (typeof b.id !== "string") return NextResponse.json({ ok: false }, { status: 400 });
  if (b.action === "reveal") {
    const access = await accessFor(user);
    const r = await reveal(user, me, access.anyPass, b.id);
    return NextResponse.json({ ok: r.state === "card", ...r }, { status: r.state === "missing" ? 404 : 200 });
  }
  if (b.action !== "like" && b.action !== "skip") return NextResponse.json({ ok: false }, { status: 400 });
  const r = await decide(user, me, b.id, b.action);
  return NextResponse.json(r, { status: r.ok ? 200 : 404 });
}
