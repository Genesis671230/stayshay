import { NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { accessFor } from "@/lib/community";
import { readRoommates } from "@/lib/roommates";
import { checkContact } from "@stayshay/core";
import { limitNotice, strikeResponse } from "@/lib/chat-rules";
import { addStrike, canContact, FREE_MESSAGES, inbox, isMatch, messageQuota, myProfile, readDms, sendDm, thread, toCard } from "@/lib/swipe";
import { walletEnabled } from "@/lib/wallet";
import { esc, notify } from "@/lib/telegram";

export const dynamic = "force-dynamic";
const noStore = { headers: { "cache-control": "no-store" } };

/** Inbox, or one conversation with ?with=<profileId>. Reading is free; free accounts get a limited number of sends. */
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
  const [quota, messages, matched] = await Promise.all([messageQuota(user.id, access.anyPass), thread(user.id, me.id, other), isMatch(user.id, me.id, other.id)]);
  return NextResponse.json({ ok: true, pass: access.anyPass, quota, canGift: walletEnabled() && matched && !!other.userId, profile: toCard(other), messages }, noStore);
}

/** { to: profileId, text } */
export async function POST(req: Request) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ ok: false, error: "signin" }, { status: 401 });
  const me = await myProfile(user.id);
  if (!me) return NextResponse.json({ ok: false, error: "profile" }, { status: 409 });
  const access = await accessFor(user);
  const b = (await req.json().catch(() => ({}))) as { to?: string; text?: string };
  const text = String(b.text ?? "").trim();
  if (!text || text.length > 1000) return NextResponse.json({ ok: false, error: "text" }, { status: 400 });
  const other = (await readRoommates()).find((r) => r.id === b.to && r.status === "approved");
  if (!other || other.id === me.id || !(await canContact(user.id, me.id, other.id))) return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });
  // Gentle flood guard: 30 messages per 10 minutes per sender.
  const dms = await readDms();
  const recent = dms.filter((m) => m.fromUser === user.id && Date.now() - Date.parse(m.createdAt) < 600_000);
  if (recent.length >= 30) return NextResponse.json({ ok: false, error: "slow_down" }, { status: 429 });
  const quota = await messageQuota(user.id, access.anyPass);
  if (quota.left <= 0) {
    const theyReplied = dms.some((m) => m.fromProfile === other.id && (m.toUser === user.id || m.toProfile === me.id));
    return NextResponse.json({ ok: false, error: "limit", quota, notice: limitNotice(other.firstName, FREE_MESSAGES, theyReplied) }, { status: 402 });
  }
  // Checked with the sender's last messages here, so details split across several short messages are still caught.
  const contact = checkContact(text, recent.filter((m) => m.toProfile === other.id).map((m) => m.text));
  if (contact.blocked) {
    const strikes = await addStrike(user.id, contact.reason);
    if (strikes === 3 || strikes % 5 === 0) notify(`🚫 <b>Contact-sharing attempts</b> · ${strikes}\n${esc(user.email)} · last type: ${contact.reason}`);
    return NextResponse.json({ ok: false, strikes, ...strikeResponse(strikes, contact.reason, access.anyPass, other.firstName) }, { status: 422 });
  }
  const msg = await sendDm({ user, profile: me }, other, text);
  if (!other.userId) {
    // No account behind that profile: the team passes the message on over WhatsApp.
    notify(`✉️ <b>Roommate message to forward</b>\nFrom ${esc(me.firstName)} (${esc(user.email)}) to ${esc(other.firstName)} (profile ${other.id}, lead ${other.leadId})\n\n${esc(text.slice(0, 600))}`, { urgent: true });
  }
  return NextResponse.json({ ok: true, quota: await messageQuota(user.id, access.anyPass), message: { id: msg.id, mine: true, text: msg.text, createdAt: msg.createdAt } });
}
