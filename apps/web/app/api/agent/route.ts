import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { normalizePhone } from "@stayshay/core";
import { agentEnabled, chatTurn, getChat, newChat, saveContactOnly } from "@/lib/agent";
import { currentUser } from "@/lib/auth";

// Per-visitor brake on cost: 30 messages per 10 minutes per IP.
const hits = new Map<string, number[]>();
function limited(ip: string) {
  const recent = (hits.get(ip) ?? []).filter((t) => Date.now() - t < 10 * 60 * 1000);
  recent.push(Date.now());
  hits.set(ip, recent);
  return recent.length > 30;
}

/** Restore a conversation for the widget (transcript only). */
export async function GET(req: Request) {
  const chat = await getChat(new URL(req.url).searchParams.get("id"));
  return NextResponse.json({ enabled: agentEnabled(), chat: chat && { id: chat.id, contact: chat.contact, transcript: chat.transcript } }, { headers: { "cache-control": "no-store" } });
}

/**
 * Body: { chatId?, message?, contact?: { name, phone, email } }.
 * `contact` alone (the optional intro card) just records details; `message` runs a turn with Shay.
 */
export async function POST(req: Request) {
  if (!agentEnabled()) return NextResponse.json({ ok: false, error: "offline" }, { status: 503 });
  const body = (await req.json().catch(() => ({}))) as {
    chatId?: string;
    message?: string;
    contact?: { name?: string; phone?: string; email?: string };
    context?: { location?: { lat: number; lng: number } | null; listingId?: string | null };
  };
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
  if (limited(ip)) return NextResponse.json({ ok: false, error: "slow_down" }, { status: 429 });

  const user = await currentUser();
  const chat =
    (await getChat(body.chatId)) ??
    newChat(user?.id ?? null, user ? { name: user.name, email: user.email, ...(user.phone && { phone: user.phone }) } : {});
  // Signed in after the chat started: pick up their details.
  if (user && !chat.userId) {
    chat.userId = user.id;
    chat.contact = { name: user.name, email: user.email, ...(user.phone && { phone: user.phone }), ...chat.contact };
  }

  if (body.contact) {
    const phone = body.contact.phone ? normalizePhone(body.contact.phone) : null;
    chat.contact = {
      ...chat.contact,
      ...(body.contact.name?.trim() && { name: body.contact.name.trim().slice(0, 80) }),
      ...(phone && { phone }),
      ...(body.contact.email && /\S+@\S+\.\S+/.test(body.contact.email) && { email: body.contact.email.trim().toLowerCase() }),
    };
  }

  const message = String(body.message ?? "").trim().slice(0, 2000);
  if (!message) {
    await saveContactOnly(chat);
    return NextResponse.json({ ok: true, chatId: chat.id, contact: chat.contact });
  }

  try {
    const loc = body.context?.location;
    const location = loc && Number.isFinite(loc.lat) && Number.isFinite(loc.lng) && Math.abs(loc.lat) <= 90 && Math.abs(loc.lng) <= 180 ? { lat: loc.lat, lng: loc.lng } : null;
    const { reply, cards } = await chatTurn(chat, message, { location, listingId: body.context?.listingId?.slice(0, 32) ?? null });
    return NextResponse.json({ ok: true, chatId: chat.id, reply, cards });
  } catch (e) {
    if (e instanceof Anthropic.RateLimitError) return NextResponse.json({ ok: false, error: "busy" }, { status: 503 });
    if (e instanceof Anthropic.APIError) console.error("[stayshay] agent API error", e.status, e.message);
    else console.error("[stayshay] agent error", e);
    return NextResponse.json({ ok: false, error: "failed" }, { status: 500 });
  }
}
