import { setReviewStatus } from "@/lib/reviews";
import { NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { readLeads } from "@/lib/store";
import { actionKeyboard, liveSessions, liveText, todayText } from "@/lib/live";
import { answerCallback, esc, muteFor, ownerChat, sendTelegram, webhookSecret, type Keyboard } from "@/lib/telegram";

export const dynamic = "force-dynamic";

const ok = () => NextResponse.json({ ok: true });
const help =
  "<b>Stayshay live</b>\n/live — who is on the site now\n/today — visitors, leads, top pages\n/actions — growth actions (open Claude Code in @stayshay_manager_bot)\n/mute — pause visitor alerts 1h (leads and surges still come)\n/unmute — resume";

/** Telegram → Stayshay. Only the founder's chat is answered; everyone else is ignored silently. */
export async function POST(req: Request) {
  const want = webhookSecret();
  const got = req.headers.get("x-telegram-bot-api-secret-token") ?? "";
  if (!want || got.length !== want.length || !timingSafeEqual(Buffer.from(got), Buffer.from(want))) return NextResponse.json({ ok: false }, { status: 401 });

  const u = (await req.json().catch(() => null)) as {
    message?: { chat: { id: number }; text?: string };
    callback_query?: { id: string; data?: string; message?: { chat: { id: number } } };
  } | null;
  const owner = await ownerChat();
  const chat = String(u?.message?.chat.id ?? u?.callback_query?.message?.chat.id ?? "");
  if (!u || !owner || chat !== owner) {
    if (u?.callback_query) await answerCallback(u.callback_query.id);
    return ok();
  }

  const cmd = (u.message?.text ?? u.callback_query?.data ?? "").trim().split(/[\s@]/)[0].replace(/^\//, "").toLowerCase();
  if (u.callback_query) await answerCallback(u.callback_query.id, cmd === "mute60" ? "Muted for 1 hour" : undefined);
  const say = (text: string, buttons?: Keyboard) => sendTelegram(text, { urgent: true, buttons, chatId: owner });

  const rv = cmd.match(/^rv(ok|no):([\w-]{4,12})$/);
  if (rv) {
    const r = await setReviewStatus(rv[2], rv[1] === "ok" ? "approved" : "rejected");
    await say(r ? (rv[1] === "ok" ? `Review by ${esc(r.name)} is live on the site.` : `Review by ${esc(r.name)} rejected.`) : "Review not found.");
    return ok();
  }

  switch (cmd) {
    case "live":
      await say(liveText(), [[{ text: "Refresh", data: "live" }, { text: "Today", data: "today" }, { text: "Actions", data: "actions" }]]);
      break;
    case "today":
      await say(await todayText(await readLeads()), [[{ text: "Who's live", data: "live" }, { text: "Actions", data: "actions" }]]);
      break;
    case "actions": {
      const live = liveSessions();
      const top = live.map((s) => s.pages[s.pages.length - 1]).find(Boolean);
      await say("<b>Growth actions</b>\nEach opens @stayshay_manager_bot with the task typed. Press Send there and Claude Code does it.", actionKeyboard(live.length ? { live: live.length, top } : {}));
      break;
    }
    case "mute":
    case "mute60":
      await muteFor(60);
      if (cmd === "mute") await say("Visitor alerts paused for 1 hour. Leads and surges still come through. /unmute to resume.");
      break;
    case "unmute":
      await muteFor(0);
      await say("Alerts back on.");
      break;
    default:
      await say(help);
  }
  return ok();
}
