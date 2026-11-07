import { NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { accessFor } from "@/lib/community";
import { readRoommates } from "@/lib/roommates";
import { canContact, inbox, myProfile, readDms, sendDm, thread, toCard } from "@/lib/swipe";
import { esc, notify } from "@/lib/telegram";

export const dynamic = "force-dynamic";
const noStore = { headers: { "cache-control": "no-store" } };

/** Inbox, or one conversation with ?with=<profileId>. Reading is free; sending needs the Stayshay Pass. */
export async function GET(req: Request) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ ok: false, error: "signin" }, { status: 401 });
  const me = await myProfile(user.id);
  const access = await accessFor(user);
  const withId = new URL(req.url).searchParams.get("with");
  if (!withId) return NextResponse.json({ ok: true, pass: access.anyPass, hasProfile: !!me, threads: await inbox(user.id, me?.id ?? null) }, noStore);
  if (!me) return NextResponse.json({ ok: false, error: "profile" }, { status: 409 });
  const other = (await readRoommates()).find((r) => r.id === withId && r.status !== "hidden");
  if (!other || !(await canContact(user.id, me.id, other.id))) return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });
  return NextResponse.json({ ok: true, pass: access.anyPass, profile: toCard(other), messages: await thread(user.id, me.id, other) }, noStore);
}

/** { to: profileId, text } */
export async function POST(req: Request) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ ok: false, error: "signin" }, { status: 401 });
  const me = await myProfile(user.id);
  if (!me) return NextResponse.json({ ok: false, error: "profile" }, { status: 409 });
  const access = await accessFor(user);
  if (!access.anyPass) return NextResponse.json({ ok: false, error: "pass", area: me.areaSlugs[0] ?? null }, { status: 402 });
  const b = (await req.json().catch(() => ({}))) as { to?: string; text?: string };
  const text = String(b.text ?? "").trim();
  if (!text || text.length > 1000) return NextResponse.json({ ok: false, error: "text" }, { status: 400 });
  const other = (await readRoommates()).find((r) => r.id === b.to && r.status === "approved");
  if (!other || other.id === me.id || !(await canContact(user.id, me.id, other.id))) return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });
  // Gentle flood guard: 30 messages per 10 minutes per sender.
  const recent = (await readDms()).filter((m) => m.fromUser === user.id && Date.now() - Date.parse(m.createdAt) < 600_000).length;
  if (recent >= 30) return NextResponse.json({ ok: false, error: "slow_down" }, { status: 429 });
  const msg = await sendDm({ user, profile: me }, other, text);
  if (!other.userId) {
    // No account behind that profile: the team passes the message on over WhatsApp.
    notify(`✉️ <b>Roommate message to forward</b>\nFrom ${esc(me.firstName)} (${esc(user.email)}) to ${esc(other.firstName)} (profile ${other.id}, lead ${other.leadId})\n\n${esc(text.slice(0, 600))}`, { urgent: true });
  }
  return NextResponse.json({ ok: true, message: { id: msg.id, mine: true, text: msg.text, createdAt: msg.createdAt } });
}
