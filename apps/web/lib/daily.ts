import Anthropic from "@anthropic-ai/sdk";
import { readdir } from "node:fs/promises";
import { join } from "node:path";
import sitemap from "@/app/sitemap";
import { readJson, readLeads, getListingsForAdmin, updateJson } from "./store";
import { readUsers } from "./auth";
import { readRoommates } from "./roommates";
import { managerOverview } from "./manager";
import { SITE } from "./seo";

/**
 * Daily growth report for the founder, sent to Telegram:
 * yesterday's traffic (Cloudflare), leads, new pages and images since the last report, and an AI research pass
 * (keywords to double down on, competitor pages that win, new page ideas, public posts from people looking for a room
 * with a reply DRAFT for each). Nothing is posted or sent to anyone but the founder: outreach stays a human decision.
 */

interface DailyState {
  date: string;
  urls: string[];
  photos: string[];
}

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const dayAgo = () => new Date(Date.now() - 24 * 3600 * 1000).toISOString();

async function cloudflare(): Promise<string | null> {
  const token = process.env.CLOUDFLARE_API_TOKEN;
  const zone = process.env.CLOUDFLARE_ZONE_ID;
  if (!token || !zone) return null;
  const since = new Date(Date.now() - 2 * 86400_000).toISOString().slice(0, 10);
  const query = `query($zone:String!,$since:Date!){viewer{zones(filter:{zoneTag:$zone}){httpRequests1dGroups(limit:2,filter:{date_geq:$since},orderBy:[date_DESC]){dimensions{date} sum{requests pageViews threats} uniq{uniques}}}}}`;
  try {
    const res = await fetch("https://api.cloudflare.com/client/v4/graphql", {
      method: "POST",
      headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
      body: JSON.stringify({ query, variables: { zone, since } }),
      signal: AbortSignal.timeout(15000),
    });
    const j = await res.json();
    const days = j?.data?.viewer?.zones?.[0]?.httpRequests1dGroups as { dimensions: { date: string }; sum: { requests: number; pageViews: number; threats: number }; uniq: { uniques: number } }[] | undefined;
    if (!days?.length) return "Cloudflare: no data yet";
    const [d, prev] = days;
    const delta = prev ? ` (${d.uniq.uniques >= prev.uniq.uniques ? "+" : ""}${d.uniq.uniques - prev.uniq.uniques} vs day before)` : "";
    return `${d.uniq.uniques.toLocaleString("en-US")} visitors${delta}, ${d.sum.pageViews.toLocaleString("en-US")} page views, ${d.sum.requests.toLocaleString("en-US")} requests (${d.dimensions.date})`;
  } catch {
    return "Cloudflare: request failed";
  }
}

/** Opus 5.5 with web search: competitors, keywords, page ideas and public room-seeker posts (drafts only). */
async function research(pages: string[]): Promise<string | null> {
  if (!process.env.ANTHROPIC_API_KEY) return null;
  const client = new Anthropic();
  const system = `You are the growth analyst for Stayshay (${SITE}), a UAE marketplace for monthly bed spaces, partitions, rooms, studios and roommates, free for renters, plus a free management dashboard for bed-space operators.
Work only from what web search returns; give the URL behind every claim and say "no data" instead of guessing.
Write plain text for a Telegram message: short lines, no markdown tables, no emojis, under 2,800 characters.`;
  const prompt = `Today's research, four sections:
1. KEYWORDS: 5 search queries renters in Dubai/Sharjah use right now for bed spaces, partitions, rooms or cheap apartments where Stayshay could rank. For each: who ranks top (URL) and the one thing that page does that ours should do better.
2. DOUBLE DOWN: which 3 of our existing pages (list below) to improve first and exactly what to add.
3. NEW PAGES: 3 new page ideas (URL slug + title) with the evidence.
4. LEADS (drafts only, do not contact anyone): up to 5 public posts or threads from the last 7 days (Reddit, forums, public groups, Q&A sites) where someone in the UAE is looking for a room, bed space or roommate, or an owner has empty beds. For each: URL, one line on what they need, and a short helpful reply draft that mentions Stayshay only if it genuinely fits. Skip anything private or behind a login.

Our pages (${pages.length}): ${pages.slice(0, 120).join(" ")}`;
  try {
    const messages: Anthropic.Beta.BetaMessageParam[] = [{ role: "user", content: prompt }];
    let text = "";
    for (let turn = 0; turn < 4; turn++) {
      const msg = await client.beta.messages
        .stream({
          model: "claude-opus-5-5",
          max_tokens: 16000,
          betas: ["server-side-fallback-2026-07-01"],
          fallbacks: "default",
          output_config: { effort: "medium" },
          system,
          tools: [{ type: "web_search_20260209", name: "web_search", max_uses: 12, user_location: { type: "approximate", country: "AE", city: "Dubai" } }],
          messages,
        } as Anthropic.Beta.MessageCreateParamsStreaming)
        .finalMessage();
      if (msg.stop_reason === "refusal") return "Research: declined by safety filters today.";
      text = msg.content.map((b) => (b.type === "text" ? b.text : "")).join("");
      if (msg.stop_reason !== "pause_turn") break;
      messages.push({ role: "assistant", content: msg.content });
    }
    return text.trim() || null;
  } catch (e) {
    return `Research failed: ${e instanceof Error ? e.message.slice(0, 160) : "unknown error"}`;
  }
}

export async function buildDailyReport(opts: { withResearch?: boolean } = {}): Promise<{ text: string; newPages: string[]; newPhotos: string[] }> {
  const since = dayAgo();
  const [leads, users, roommates, listings, owners, map, photos, state, traffic] = await Promise.all([
    readLeads(),
    readUsers(),
    readRoommates(),
    getListingsForAdmin(),
    managerOverview(new Date().toISOString().slice(0, 10)),
    sitemap(),
    readdir(join(process.cwd(), "public/photos")).catch(() => [] as string[]),
    readJson<DailyState | null>("daily-state.json", null),
    cloudflare(),
  ]);

  const urls = map.map((m) => m.url).filter((u) => !/\/listing\//.test(u));
  const newPages = state ? urls.filter((u) => !state.urls.includes(u)) : [];
  const newPhotos = state ? photos.filter((p) => !state.photos.includes(p)) : [];
  const fresh = leads.filter((l) => l.createdAt >= since);
  const byKind = (k: string) => fresh.filter((l) => l.kind === k).length;
  const referred = fresh.filter((l) => l.refCode).length;

  const lines: string[] = [];
  lines.push(`<b>Stayshay daily report</b> · ${new Date().toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Dubai" })}`);
  lines.push("");
  lines.push(`<b>Traffic</b>: ${esc(traffic ?? "add CLOUDFLARE_API_TOKEN + CLOUDFLARE_ZONE_ID to see visitors")}`);
  lines.push(`<b>Leads (24h)</b>: ${fresh.length} · viewings ${byKind("inquiry")}, find-me-a-room ${byKind("tenant")}, owners ${byKind("owner")}, roommates ${byKind("roommate")}, Shay chats ${byKind("chat")}${referred ? ` · ${referred} via referral` : ""}`);
  lines.push(`<b>New accounts</b>: ${users.filter((u) => u.createdAt >= since).length} · total ${users.length}`);
  lines.push(`<b>To review</b>: ${listings.filter((l) => l.status === "pending_review").length} listings, ${roommates.filter((r) => r.status === "pending").length} roommate profiles`);
  lines.push(`<b>Owners on Manager</b>: ${owners.owners} · ${owners.apartments} apartments · ${owners.toFill} tenants needed`);
  lines.push(`<b>Live listings</b>: ${listings.filter((l) => (l.status ?? "live") === "live").length} · <b>indexable pages</b>: ${urls.length}`);
  lines.push("");
  lines.push(`<b>New pages since last report</b> (${newPages.length})`);
  for (const u of newPages.slice(0, 25)) lines.push(`• ${esc(u.replace(SITE, ""))}`);
  if (newPages.length > 25) lines.push(`• …and ${newPages.length - 25} more`);
  if (!state) lines.push("First report: baseline saved, new pages show from tomorrow.");
  if (newPhotos.length) {
    lines.push("");
    lines.push(`<b>New images</b> (${newPhotos.length}): ${newPhotos.map(esc).join(", ")}`);
  }

  if (opts.withResearch !== false) {
    const r = await research(urls.map((u) => u.replace(SITE, "") || "/"));
    lines.push("");
    lines.push("<b>Research and drafts</b> (nothing has been sent to anyone)");
    lines.push(esc(r ?? "Add ANTHROPIC_API_KEY on the server to turn on competitor, keyword and lead research."));
  }

  await updateJson<DailyState | null>("daily-state.json", null, () => ({ date: new Date().toISOString(), urls, photos }));
  await updateJson<{ date: string; leads: number; pages: number; newPages: string[] }[]>("daily-log.json", [], (all) => [{ date: new Date().toISOString(), leads: fresh.length, pages: urls.length, newPages }, ...all].slice(0, 400));
  return { text: lines.join("\n"), newPages, newPhotos };
}

/**
 * Without TELEGRAM_CHAT_ID set, the report goes to the first private chat that messaged the bot
 * (the founder sends /start once), remembered in telegram.json.
 */
async function telegramChat(token: string | undefined): Promise<string | null> {
  if (!token) return null;
  const saved = await readJson<{ chatId?: string }>("telegram.json", {});
  if (saved.chatId) return saved.chatId;
  const res = await fetch(`https://api.telegram.org/bot${token}/getUpdates`).catch(() => null);
  const j = (await res?.json().catch(() => null)) as { result?: { message?: { chat?: { id: number; type: string } } }[] } | null;
  const chat = j?.result?.map((u) => u.message?.chat).find((c) => c?.type === "private");
  if (!chat) return null;
  await updateJson<{ chatId?: string; savedAt?: string }>("telegram.json", {}, () => ({ chatId: String(chat.id), savedAt: new Date().toISOString() }));
  return String(chat.id);
}

/** Telegram allows 4,096 characters per message; split on line breaks. */
export async function sendTelegram(text: string): Promise<boolean> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chat = process.env.TELEGRAM_CHAT_ID || (await telegramChat(token));
  if (!token || !chat) return false;
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
  for (const c of chunks) {
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ chat_id: chat, text: c, parse_mode: "HTML", disable_web_page_preview: true }),
    }).catch(() => null);
    ok = ok && !!res?.ok;
  }
  return ok;
}
