import { readJson, updateJson } from "./store";

/**
 * The founder's Telegram line (@Stayshay_bot): instant alerts with buttons, plus the daily report.
 * Only the founder's chat (TELEGRAM_CHAT_ID, or the first private chat that messaged the bot) ever receives anything.
 *
 * Two kinds of buttons:
 * - callback buttons ("Live now", "Mute 1h"): the bot answers itself through /api/telegram/webhook.
 * - task buttons ("Write a blog post", "SEO pass"…): open @stayshay_manager_bot with the task already typed, so a
 *   Claude Code session on the founder's Mac picks it up after one tap on Send. Nothing runs without that tap.
 */

export type Button = { text: string; data: string } | { text: string; url: string };
export type Keyboard = Button[][];

interface TelegramState {
  chatId?: string;
  savedAt?: string;
  mutedUntil?: string;
}

export const MANAGER_BOT = process.env.TELEGRAM_MANAGER_BOT || "stayshay_manager_bot";

export const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const api = (method: string, body: unknown) => {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) return Promise.resolve(null);
  return fetch(`https://api.telegram.org/bot${token}/${method}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(10000),
  }).catch(() => null);
};

/** TELEGRAM_CHAT_ID, else the first private chat that messaged the bot (only works while no webhook is set). */
export async function ownerChat(): Promise<string | null> {
  if (process.env.TELEGRAM_CHAT_ID) return process.env.TELEGRAM_CHAT_ID;
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) return null;
  const saved = await readJson<TelegramState>("telegram.json", {});
  if (saved.chatId) return saved.chatId;
  const res = await fetch(`https://api.telegram.org/bot${token}/getUpdates`).catch(() => null);
  const j = (await res?.json().catch(() => null)) as { result?: { message?: { chat?: { id: number; type: string } } }[] } | null;
  const chat = j?.result?.map((u) => u.message?.chat).find((c) => c?.type === "private");
  if (!chat) return null;
  await updateJson<TelegramState>("telegram.json", {}, (s) => ({ ...s, chatId: String(chat.id), savedAt: new Date().toISOString() }));
  return String(chat.id);
}

/** A button that opens the manager bot with `task` pre-typed (Telegram's ?text= draft link). */
export function taskButton(text: string, task: string): Button {
  return { text, url: `https://t.me/${MANAGER_BOT}?text=${encodeURIComponent(task.slice(0, 1500))}` };
}

const markup = (kb?: Keyboard) =>
  kb?.length ? { inline_keyboard: kb.map((row) => row.map((b) => ("url" in b ? { text: b.text, url: b.url } : { text: b.text, callback_data: b.data.slice(0, 64) }))) } : undefined;

/** Split on line breaks under Telegram's 4,096-character limit; buttons go on the last chunk. */
export async function sendTelegram(text: string, opts: { buttons?: Keyboard; urgent?: boolean; chatId?: string } = {}): Promise<boolean> {
  const chat = opts.chatId ?? (await ownerChat());
  if (!process.env.TELEGRAM_BOT_TOKEN || !chat) return false;
  if (!opts.urgent && (await isMuted())) return false;
  const chunks: string[] = [];
  let cur = "";
  for (const line of text.split("\n")) {
    if ((cur + line).length > 3800) {
      chunks.push(cur);
      cur = "";
    }
    cur += `${line}\n`;
  }
  if (cur.trim()) chunks.push(cur);
  let ok = true;
  for (let i = 0; i < chunks.length; i++) {
    const res = await api("sendMessage", {
      chat_id: chat,
      text: chunks[i],
      parse_mode: "HTML",
      disable_web_page_preview: true,
      reply_markup: i === chunks.length - 1 ? markup(opts.buttons) : undefined,
    });
    ok = ok && !!res?.ok;
  }
  return ok;
}

/** Fire-and-forget for request handlers: an alert must never slow down or break the page that triggered it. */
export function notify(text: string, opts: { buttons?: Keyboard; urgent?: boolean } = {}) {
  void sendTelegram(text, opts).catch(() => {});
}

export const answerCallback = (id: string, text?: string) => api("answerCallbackQuery", { callback_query_id: id, text });

export async function isMuted(): Promise<boolean> {
  const s = await readJson<TelegramState>("telegram.json", {});
  return !!s.mutedUntil && s.mutedUntil > new Date().toISOString();
}

export async function muteFor(minutes: number) {
  const until = minutes > 0 ? new Date(Date.now() + minutes * 60_000).toISOString() : undefined;
  await updateJson<TelegramState>("telegram.json", {}, (s) => ({ ...s, mutedUntil: until }));
  return until;
}

/** Registers /api/telegram/webhook with Telegram (secret header) and the bot's command menu. */
export async function setupWebhook(base: string) {
  const secret = webhookSecret();
  if (!secret) return { ok: false, error: "TELEGRAM_WEBHOOK_SECRET (24+ chars) missing" };
  const hook = await api("setWebhook", { url: `${base}/api/telegram/webhook`, secret_token: secret, allowed_updates: ["message", "callback_query"], drop_pending_updates: true });
  await api("setMyCommands", {
    commands: [
      { command: "live", description: "Who is on the site right now" },
      { command: "today", description: "Visitors, leads and top pages today" },
      { command: "actions", description: "Growth actions for Claude Code" },
      { command: "mute", description: "Pause visitor alerts for 1 hour" },
      { command: "unmute", description: "Resume alerts" },
    ],
  });
  return (await hook?.json().catch(() => null)) ?? { ok: false };
}

export const webhookSecret = () => {
  const s = process.env.TELEGRAM_WEBHOOK_SECRET ?? "";
  return s.length >= 24 ? s : null;
};
