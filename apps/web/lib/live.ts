import { appendFile, mkdir, readdir, readFile, unlink } from "node:fs/promises";
import { join } from "node:path";
import { DATA_DIR } from "./store";
import { esc, notify, taskButton, type Keyboard } from "./telegram";
import { SITE } from "./seo";

/**
 * Live visitors for the founder's Telegram: one alert per new visit (IP, place, device, where they came from),
 * a surge alert with growth actions when 10+ people are on the site at once, and /live and /today on demand.
 *
 * Sessions live in memory (one pm2 process); every page view is also appended to visits/YYYY-MM-DD.jsonl so
 * /today survives restarts. Logs older than 30 days are deleted.
 */

export interface Hit {
  sid: string;
  path: string;
  ref?: string;
  w?: number;
  tz?: string;
  lang?: string;
  utm?: string;
}

interface Geo {
  city?: string;
  region?: string;
  country?: string;
  isp?: string;
}

export interface Session {
  sid: string;
  ip: string;
  ua: string;
  device: string;
  geo: Geo;
  ref: string;
  utm?: string;
  first: number;
  last: number;
  pages: string[];
  admin: boolean;
  returning: boolean;
}

const LIVE_MS = 5 * 60_000;
const SURGE_AT = Number(process.env.LIVE_SURGE_AT || 10);
/** Above this many visit alerts in an hour, single-visit alerts pause and only the surge/hourly summary is sent. */
const MAX_VISIT_ALERTS_PER_HOUR = Number(process.env.LIVE_MAX_ALERTS_PER_HOUR || 40);

const g = globalThis as unknown as { __live?: { sessions: Map<string, Session>; geo: Map<string, Geo>; alerts: number[]; surging: boolean; lastSurge: number } };
const state = (g.__live ??= { sessions: new Map(), geo: new Map(), alerts: [], surging: false, lastSurge: 0 });

const BOT = /bot|crawl|spider|slurp|preview|facebookexternalhit|whatsapp|telegram|headless|lighthouse|pingdom|uptime|curl|wget|python|axios|node-fetch|go-http|monitor/i;
export const isBot = (ua: string) => !ua || BOT.test(ua);

export function device(ua: string, w?: number): string {
  const os = /iPhone/.test(ua) ? "iPhone" : /iPad/.test(ua) ? "iPad" : /Android/.test(ua) ? (/Mobile/.test(ua) ? "Android phone" : "Android tablet") : /Windows/.test(ua) ? "Windows" : /Mac OS X/.test(ua) ? "Mac" : /Linux/.test(ua) ? "Linux" : "Unknown";
  const br = /EdgA?\//.test(ua) ? "Edge" : /SamsungBrowser/.test(ua) ? "Samsung Internet" : /OPR\//.test(ua) ? "Opera" : /Chrome\//.test(ua) ? "Chrome" : /Firefox\//.test(ua) ? "Firefox" : /Safari\//.test(ua) ? "Safari" : "browser";
  const inApp = /Instagram/.test(ua) ? " (Instagram app)" : /FBAN|FBAV/.test(ua) ? " (Facebook app)" : /TikTok|musical_ly/.test(ua) ? " (TikTok app)" : /Snapchat/.test(ua) ? " (Snapchat)" : "";
  return `${os} · ${br}${inApp}${w ? ` · ${w}px` : ""}`;
}

export function source(ref: string | undefined, utm?: string): string {
  if (utm) return utm;
  if (!ref) return "direct";
  try {
    const h = new URL(ref).hostname.replace(/^www\./, "");
    if (h === new URL(SITE).hostname.replace(/^www\./, "")) return "internal";
    return h;
  } catch {
    return "direct";
  }
}

const COUNTRY: Record<string, string> = { AE: "UAE", IN: "India", PK: "Pakistan", PH: "Philippines", GB: "UK", US: "USA", SA: "Saudi Arabia", EG: "Egypt", BD: "Bangladesh", NP: "Nepal", LK: "Sri Lanka" };

async function lookup(ip: string, cfCountry?: string | null): Promise<Geo> {
  const hit = state.geo.get(ip);
  if (hit) return hit;
  let geo: Geo = { country: cfCountry ? COUNTRY[cfCountry] ?? cfCountry : undefined };
  if (ip && !/^(127\.|10\.|192\.168\.|::1)/.test(ip)) {
    try {
      const r = await fetch(`https://ipwho.is/${encodeURIComponent(ip)}?fields=success,city,region,country,connection`, { signal: AbortSignal.timeout(2500) });
      const j = (await r.json()) as { success?: boolean; city?: string; region?: string; country?: string; connection?: { isp?: string; org?: string } };
      if (j.success) geo = { city: j.city, region: j.region, country: j.country ?? geo.country, isp: j.connection?.isp || j.connection?.org };
    } catch {
      /* keep the Cloudflare country */
    }
  }
  if (state.geo.size > 5000) state.geo.clear();
  state.geo.set(ip, geo);
  return geo;
}

export const place = (g: Geo) => [g.city, g.region && g.region !== g.city ? g.region : null, g.country].filter(Boolean).join(", ") || "unknown place";

const day = (t = Date.now()) => new Date(t + 4 * 3600_000).toISOString().slice(0, 10); // Dubai date
const VISIT_DIR = join(DATA_DIR, "visits");

async function log(row: Record<string, unknown>) {
  try {
    await mkdir(VISIT_DIR, { recursive: true });
    await appendFile(join(VISIT_DIR, `${day()}.jsonl`), `${JSON.stringify(row)}\n`);
  } catch {
    /* logging never breaks tracking */
  }
}

let lastPrune = 0;
async function prune() {
  if (Date.now() - lastPrune < 6 * 3600_000) return;
  lastPrune = Date.now();
  const cutoff = day(Date.now() - 30 * 86400_000);
  for (const f of await readdir(VISIT_DIR).catch(() => [] as string[])) if (f.slice(0, 10) < cutoff) await unlink(join(VISIT_DIR, f)).catch(() => {});
  for (const [k, s] of state.sessions) if (Date.now() - s.last > 3 * 3600_000) state.sessions.delete(k);
}

export const liveSessions = () => [...state.sessions.values()].filter((s) => !s.admin && Date.now() - s.last < LIVE_MS).sort((a, b) => b.last - a.last);

/** Records one page view or heartbeat. Returns quietly; alerts go out in the background. */
export async function record(hit: Hit, req: { ip: string; ua: string; cfCountry?: string | null; admin: boolean; returning: boolean }) {
  const now = Date.now();
  let s = state.sessions.get(hit.sid);
  const isNew = !s;
  if (!s) {
    s = {
      sid: hit.sid,
      ip: req.ip,
      ua: req.ua,
      device: device(req.ua, hit.w),
      geo: await lookup(req.ip, req.cfCountry),
      ref: source(hit.ref, hit.utm),
      utm: hit.utm,
      first: now,
      last: now,
      pages: [],
      admin: req.admin,
      returning: req.returning,
    };
    state.sessions.set(hit.sid, s);
  }
  s.last = now;
  const path = hit.path.slice(0, 200);
  const pageView = s.pages[s.pages.length - 1] !== path;
  if (pageView) s.pages.push(path);
  if (s.pages.length > 60) s.pages.splice(0, s.pages.length - 60);

  if (pageView) void log({ t: new Date(now).toISOString(), sid: s.sid, ip: s.ip, path, ref: s.ref, device: s.device, place: place(s.geo), admin: s.admin || undefined, new: isNew || undefined });
  void prune();

  if (s.admin) return;
  if (isNew) visitAlert(s);
  surgeCheck();
}

function visitAlert(s: Session) {
  const now = Date.now();
  state.alerts = state.alerts.filter((t) => now - t < 3600_000);
  if (state.alerts.length >= MAX_VISIT_ALERTS_PER_HOUR) return;
  state.alerts.push(now);
  const live = liveSessions().length;
  const text = [
    `<b>${s.returning ? "Returning visitor" : "New visitor"}</b> · ${esc(place(s.geo))}`,
    `${esc(s.device)}`,
    `From <b>${esc(s.ref)}</b> → ${esc(s.pages[0] ?? "/")}`,
    `IP ${esc(s.ip)}${s.geo.isp ? ` · ${esc(s.geo.isp)}` : ""}`,
    `${live} on the site now${state.alerts.length === MAX_VISIT_ALERTS_PER_HOUR ? "\n<i>Busy hour: single-visit alerts paused, use /live.</i>" : ""}`,
  ].join("\n");
  notify(text, { buttons: [[{ text: "Who's live", data: "live" }, { text: "Today", data: "today" }, { text: "Mute 1h", data: "mute60" }]] });
}

function surgeCheck() {
  const live = liveSessions();
  if (!state.surging && live.length >= SURGE_AT && Date.now() - state.lastSurge > 30 * 60_000) {
    state.surging = true;
    state.lastSurge = Date.now();
    const { text, buttons } = surgeMessage(live);
    notify(text, { buttons, urgent: true });
  } else if (state.surging && live.length < Math.max(3, SURGE_AT - 3)) {
    state.surging = false;
  }
}

const tally = (xs: string[]) => [...xs.reduce((m, x) => m.set(x, (m.get(x) ?? 0) + 1), new Map<string, number>())].sort((a, b) => b[1] - a[1]);

function surgeMessage(live: Session[]): { text: string; buttons: Keyboard } {
  const pages = tally(live.map((s) => s.pages[s.pages.length - 1] ?? "/"));
  const sources = tally(live.map((s) => s.ref));
  const places = tally(live.map((s) => s.geo.city || s.geo.country || "unknown"));
  const top = pages[0]?.[0] ?? "/";
  const text = [
    `<b>Traffic surge: ${live.length} people on Stayshay right now</b>`,
    `Top pages: ${pages.slice(0, 4).map(([p, n]) => `${esc(p)} (${n})`).join(", ")}`,
    `Sources: ${sources.slice(0, 4).map(([p, n]) => `${esc(p)} (${n})`).join(", ")}`,
    `Where: ${places.slice(0, 4).map(([p, n]) => `${esc(p)} (${n})`).join(", ")}`,
    "",
    "Pick an action. It opens @" + esc(process.env.TELEGRAM_MANAGER_BOT || "stayshay_manager_bot") + " with the task typed; press Send and Claude Code does it, then replies with the link.",
  ].join("\n");
  return { text, buttons: actionKeyboard({ live: live.length, top, sources: sources.slice(0, 3).map(([s]) => s) }) };
}

/** Growth actions as manager-bot task buttons. Context makes each task specific to what's happening now. */
export function actionKeyboard(ctx: { live?: number; top?: string; sources?: string[] } = {}): Keyboard {
  const why = ctx.live ? `${ctx.live} people are on stayshay.com right now, most on ${ctx.top}${ctx.sources?.length ? `, coming from ${ctx.sources.join(", ")}` : ""}.` : "Routine growth step.";
  const page = ctx.top && ctx.top !== "/" ? ctx.top : null;
  const t = (job: string) => `Stayshay task. ${why}\n${job}\nUse the stayshay skill. Build, test, deploy, then reply here with the live link and a two-line summary. Ask me before anything risky.`;
  return [
    [
      taskButton("New landing page", t(`Create a new SEO landing page that catches the demand behind ${page ?? "today's top searches"}: real listings, FAQ schema, internal links.`)),
      taskButton("Write a blog post", t(`Write and publish one blog post for the search intent behind ${page ?? "our best-performing page"}, with a premium cover photo and links to live listings.`)),
    ],
    [
      taskButton("SEO + AEO pass", t(`Do an SEO and AEO pass on ${page ?? "the top 3 pages"}: title, meta, headings, FAQ/JSON-LD, llms.txt entry, internal links. Keep the design.`)),
      taskButton("Run an offer", t(`Draft a time-limited offer for these visitors (announcement bar + landing section, real terms only, no fake urgency). Show me the copy before publishing.`)),
    ],
    [
      taskButton("Invite owners", t(`Draft invitation messages to bring more bed-space owners onto Stayshay Manager, for WhatsApp and Facebook groups. Drafts only; do not send.`)),
      taskButton("New feature idea", t(`Look at what these visitors do (visits log on the server) and propose one small feature that would turn more of them into viewings. Spec it, then wait for my go.`)),
    ],
    [taskButton("Plan next steps", t(`Review the last 7 days (visits, leads, pages) and give me a short plan for the next 3 days, ranked by impact. No code yet.`)), { text: "Who's live", data: "live" }],
  ];
}

export function liveText(): string {
  const live = liveSessions();
  if (!live.length) return "Nobody on the site right now (last 5 minutes, you excluded).";
  const lines = [`<b>${live.length} on the site now</b>`];
  for (const s of live.slice(0, 15)) {
    const mins = Math.max(1, Math.round((s.last - s.first) / 60_000));
    lines.push(`• ${esc(s.geo.city || s.geo.country || "?")} · ${esc(s.device.split(" · ").slice(0, 2).join(" "))} · ${esc(s.ref)} · ${s.pages.length}p/${mins}m · now ${esc(s.pages[s.pages.length - 1] ?? "/")}`);
  }
  if (live.length > 15) lines.push(`…and ${live.length - 15} more`);
  return lines.join("\n");
}

export async function todayText(leads: { createdAt: string; kind: string }[]): Promise<string> {
  const raw = await readFile(join(VISIT_DIR, `${day()}.jsonl`), "utf8").catch(() => "");
  const rows = raw
    .split("\n")
    .filter(Boolean)
    .map((l) => {
      try {
        return JSON.parse(l) as { sid: string; path: string; ref: string; place: string; device: string; admin?: boolean };
      } catch {
        return null;
      }
    })
    .filter((r): r is NonNullable<typeof r> => !!r && !r.admin);
  const sessions = new Map<string, (typeof rows)[number]>();
  for (const r of rows) if (!sessions.has(r.sid)) sessions.set(r.sid, r);
  const v = [...sessions.values()];
  const since = new Date(`${day()}T00:00:00+04:00`).toISOString();
  const fresh = leads.filter((l) => l.createdAt >= since);
  const fmt = (xs: [string, number][]) => xs.slice(0, 5).map(([k, n]) => `${esc(k)} (${n})`).join(", ") || "none";
  return [
    `<b>Today so far</b> (Dubai time)`,
    `Visitors: <b>${v.length}</b> · page views ${rows.length} · live now ${liveSessions().length}`,
    `Leads: <b>${fresh.length}</b>${fresh.length ? ` (${fmt(tally(fresh.map((l) => l.kind)))})` : ""}`,
    `Top pages: ${fmt(tally(rows.map((r) => r.path)))}`,
    `Sources: ${fmt(tally(v.map((r) => r.ref)))}`,
    `Places: ${fmt(tally(v.map((r) => r.place.split(", ")[0])))}`,
    `Devices: ${fmt(tally(v.map((r) => r.device.split(" · ")[0])))}`,
  ].join("\n");
}
