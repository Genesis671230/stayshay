import Anthropic from "@anthropic-ai/sdk";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { randomUUID } from "node:crypto";
import { AREAS, AREA_BY_SLUG, TYPE_LABEL, filterListings, normalizePhone, searchAreas, type Listing, type ListingType } from "@stayshay/core";
import { DATA_DIR, addLead, getAllListings, getListing, readLeads, updateLead } from "./store";

/**
 * "Shay", the Stayshay assistant: finds places from the live catalogue, answers questions in the visitor's
 * language, and collects their contact details for the team. Conversations are stored append-only in
 * STAYSHAY_DATA_DIR/chats.json (the full assistant content, thinking blocks included, is sent back unchanged).
 */

export const MODEL = "claude-opus-5-5";
const MAX_TURNS = 40;
const SITE = "https://stayshay.com";

export const agentEnabled = () => !!process.env.ANTHROPIC_API_KEY;

const client = () => new Anthropic({ timeout: 60_000, maxRetries: 2 });

export interface Chat {
  id: string;
  createdAt: string;
  updatedAt: string;
  userId: string | null;
  contact: { name?: string; phone?: string; email?: string };
  leadId: string | null;
  /** Full API history, append-only. */
  messages: Anthropic.Beta.BetaMessageParam[];
  /** Plain transcript for the widget and the admin. */
  transcript: { role: "user" | "assistant"; text: string; at: string }[];
}

/* ---------- storage ---------- */

const FILE = () => join(DATA_DIR, "chats.json");
let queue: Promise<unknown> = Promise.resolve();

export async function readChats(): Promise<Chat[]> {
  try {
    return JSON.parse(await readFile(FILE(), "utf8")) as Chat[];
  } catch {
    return [];
  }
}

async function saveChat(chat: Chat) {
  const run = queue.then(async () => {
    const all = (await readChats()).filter((c) => c.id !== chat.id);
    await mkdir(DATA_DIR, { recursive: true });
    await writeFile(`${FILE()}.tmp`, JSON.stringify([chat, ...all].slice(0, 3000)));
    await rename(`${FILE()}.tmp`, FILE());
  });
  queue = run.catch(() => {});
  return run;
}

export async function getChat(id: string | undefined | null): Promise<Chat | null> {
  if (!id) return null;
  return (await readChats()).find((c) => c.id === id) ?? null;
}

export function newChat(userId: string | null, contact: Chat["contact"]): Chat {
  const now = new Date().toISOString();
  return { id: randomUUID(), createdAt: now, updatedAt: now, userId, contact, leadId: null, messages: [], transcript: [] };
}

/* ---------- prompt ---------- */

const AREA_NAMES = AREAS.map((a) => a.name).join(", ");

const SYSTEM = `You are Shay, the concierge of Stayshay (stayshay.com): monthly bed spaces, partitions, private rooms, studios and roommates across the UAE. Your job is to turn "I need a place" into a booked viewing, kindly and fast, in the visitor's own language. Stayshay's team is on WhatsApp at +971 56 904 8493.

Personality: warm, a little playful, concrete, honest and protective. Replies are short (1–4 sentences), plain text, no headings, tables or markdown. Reply in the language the visitor writes in.

How a conversation goes:
1. Hello: one line and one question. Use the context you're given (their area, the listing they're looking at).
2. Understand: fill only what's missing, one question at a time: where (area, metro line or workplace), monthly budget in AED, and type (bed space / partition / room / studio; under ~AED 1,000 usually means bed space). Ask about move-in date or household (male / female / couple) only when it matters.
3. Recommend: call search_listings and present 2–3 places, each with ONE reason it fits (price, bills, metro minutes, who can live there). Mention each place's title so the website can show it as a card. Don't paste long URLs; the cards link to the pages.
4. Refine: offer exactly one next step (cheaper, closer to the metro, female-only, another area).
5. Convert: when they like a place, offer to book a viewing. Only now ask for contact details. If you already have their name and WhatsApp (see context), confirm and book. Otherwise ask for name + WhatsApp number and mention they can also sign in with Google in one tap. Then call request_viewing.
6. Follow-up: say the team will WhatsApp them to fix a time, remind them not to pay anything before viewing, and offer one more useful thing.

Branches: roommates → understand budget, area, gender, move-in and habits, then send them to ${SITE}/roommates to create a profile with a photo (people already looking are listed there). Owners → ${SITE}/list, free. Off-topic → one helpful line, then back to housing.

Rules:
- Only state facts that tools returned. Never invent a listing, price, availability, distance, photo or review. If nothing fits, say so and suggest one change.
- Use nearby_areas when they mention "near me", a workplace, a landmark or a metro station you're not sure about.
- Never ask for or accept payments, card numbers, passwords or ID documents. Contact details are optional; keep helping if they don't share them. Call save_contact whenever they do share details or clear needs.
- Shared housing and partitions need landlord consent and, for partitions, a permit. You are not a lawyer and Stayshay is not a government body.

Known areas: ${AREA_NAMES}.`;

/* ---------- tools ---------- */

const str = { type: ["string", "null"] } as const;
const num = { type: ["number", "null"] } as const;
const bool = { type: ["boolean", "null"] } as const;

const TOOLS: Anthropic.Beta.BetaTool[] = [
  {
    name: "search_listings",
    description:
      "Search live Stayshay listings. Use null for any filter the person didn't give. Returns up to 6 places with id, title, type, area, monthly price (AED), bills, deposit, who can live there, nearest metro and link.",
    strict: true,
    input_schema: {
      type: "object",
      additionalProperties: false,
      properties: {
        area: { ...str, description: "Area, community or metro station as the person said it, e.g. 'Barsha', 'JLT', 'Karama'" },
        type: { type: ["string", "null"], enum: ["bed_space", "partition", "room", "studio", null], description: "Kind of place" },
        max_price: { ...num, description: "Maximum monthly rent in AED" },
        gender: { type: ["string", "null"], enum: ["male", "female", null], description: "Household the person needs (male-only / female-only)" },
        bills_included: bool,
        no_deposit: bool,
        near_metro: { ...bool, description: "Within ~10 minutes' walk of a metro station" },
      },
      required: ["area", "type", "max_price", "gender", "bills_included", "no_deposit", "near_metro"],
    },
  },
  {
    name: "get_listing",
    description: "Full details of one listing by its id (e.g. HB429841 or SS1001): rent, deposit, upfront cost, utilities, bathroom, minimum stay, who can live there, description.",
    strict: true,
    input_schema: { type: "object", additionalProperties: false, properties: { id: { type: "string" } }, required: ["id"] },
  },
  {
    name: "nearby_areas",
    description:
      "Areas close to a place: an area, metro station, landmark or workplace the visitor mentions, or 'me' for the visitor's shared location. Returns the closest known areas with distance in km and how many live listings each has.",
    strict: true,
    input_schema: {
      type: "object",
      additionalProperties: false,
      properties: { near: { type: "string", description: "Area / metro / landmark name, or 'me'" } },
      required: ["near"],
    },
  },
  {
    name: "save_contact",
    description:
      "Save or update the person's details for the Stayshay team. Call it whenever they share a name, WhatsApp/phone, email or what they're looking for. Use null for anything unknown.",
    strict: true,
    input_schema: {
      type: "object",
      additionalProperties: false,
      properties: {
        name: str,
        phone: { ...str, description: "WhatsApp / phone number exactly as given" },
        email: str,
        looking_for: { ...str, description: "Short summary in English: type, areas, budget, move-in, household" },
        language: { ...str, description: "Language the person is writing in" },
      },
      required: ["name", "phone", "email", "looking_for", "language"],
    },
  },
  {
    name: "request_viewing",
    description: "Book a viewing request for a listing. The team then contacts the person on WhatsApp.",
    strict: true,
    input_schema: {
      type: "object",
      additionalProperties: false,
      properties: {
        listing_id: { type: "string" },
        name: { type: "string" },
        phone: { type: "string", description: "WhatsApp number" },
        move_in: { type: "string", description: "Move-in date as YYYY-MM-DD" },
        note: str,
      },
      required: ["listing_id", "name", "phone", "move_in", "note"],
    },
  },
];

const brief = (l: Listing) => ({
  id: l.id,
  title: l.title,
  type: TYPE_LABEL[l.type],
  area: AREA_BY_SLUG.get(l.areaSlug)?.name ?? l.areaName,
  price_aed: l.priceAed,
  ...(l.priceMaxAed && { price_up_to_aed: l.priceMaxAed }),
  bills_included: l.billsIncluded,
  deposit_aed: l.deposit,
  who: l.gender === "any" ? "mixed" : `${l.gender} only`,
  metro: l.metro ? `${l.metro}${l.nearMetroMinutes != null ? `, ${l.nearMetroMinutes} min walk` : ""}` : null,
  link: `${SITE}/listing/${l.id.toLowerCase()}`,
});

function km(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const r = (x: number) => (x * Math.PI) / 180;
  const h = Math.sin(r(b.lat - a.lat) / 2) ** 2 + Math.cos(r(a.lat)) * Math.cos(r(b.lat)) * Math.sin(r(b.lng - a.lng) / 2) ** 2;
  return 2 * 6371 * Math.asin(Math.sqrt(h));
}

/** Listings surfaced during a turn, so the widget can show them as cards. */
export interface Card {
  id: string;
  title: string;
  type: string;
  area: string;
  priceAed: number;
  photo: string | null;
  billsIncluded: boolean;
}

export interface TurnContext {
  /** Visitor's shared location (browser), never stored. */
  location?: { lat: number; lng: number } | null;
  /** Listing page the visitor is on. */
  listingId?: string | null;
}

async function runTool(chat: Chat, name: string, input: Record<string, unknown>, ctx: TurnContext, seen: Map<string, Listing>): Promise<string> {
  if (name === "nearby_areas") {
    const near = String(input.near ?? "").trim();
    let point: { lat: number; lng: number } | null = null;
    if (/^(me|my location|here)$/i.test(near) && ctx.location) point = ctx.location;
    else {
      const hit = searchAreas(AREAS, near, 1)[0]?.area;
      if (hit) point = { lat: hit.lat, lng: hit.lng };
    }
    if (!point) return JSON.stringify({ error: `I don't know where "${near}" is. Ask for the nearest area or metro station.` });
    const live = await getAllListings();
    const counts = live.reduce<Record<string, number>>((m, l) => ((m[l.areaSlug] = (m[l.areaSlug] ?? 0) + 1), m), {});
    const near6 = AREAS.map((a) => ({ area: a.name, km: Math.round(km(point!, a) * 10) / 10, listings: counts[a.slug] ?? 0, metro: a.nearMetro }))
      .sort((a, b) => a.km - b.km)
      .slice(0, 6);
    return JSON.stringify({ areas: near6 });
  }

  if (name === "search_listings") {
    const area = typeof input.area === "string" && input.area.trim() ? searchAreas(AREAS, input.area, 3).map((m) => m.area.slug) : undefined;
    const results = filterListings(await getAllListings(), AREAS, {
      areaSlugs: area?.length ? area.slice(0, 1) : undefined,
      types: typeof input.type === "string" ? [input.type as ListingType] : undefined,
      maxPrice: typeof input.max_price === "number" ? input.max_price : undefined,
      gender: input.gender === "male" || input.gender === "female" ? input.gender : undefined,
      billsIncluded: input.bills_included === true || undefined,
      noDeposit: input.no_deposit === true || undefined,
      nearMetro: input.near_metro === true || undefined,
    });
    const areaNote = typeof input.area === "string" && input.area.trim() && !area?.length ? `No known area matched "${input.area}"; searched everywhere.` : undefined;
    const top = results.slice(0, 6);
    for (const l of top) seen.set(l.id, l);
    return JSON.stringify({ total: results.length, note: areaNote, places: top.map(brief) });
  }

  if (name === "get_listing") {
    const l = await getListing(String(input.id ?? ""));
    if (!l) return JSON.stringify({ error: "No live listing with that id" });
    seen.set(l.id, l);
    return JSON.stringify({
      ...brief(l),
      upfront_cost_aed: l.upfrontCost ?? 0,
      utilities: l.utilities,
      bathroom: l.bathroom,
      sleeping_set: l.sleepingSet,
      minimum_stay: l.minimumStay,
      notice_period: l.noticePeriod,
      availability: l.availability,
      tenants: l.preferredTenant,
      nationalities: l.preferredNationality,
      features: l.features,
      description: (l.descriptionLines ?? [l.description]).join(" ").slice(0, 1200),
    });
  }

  if (name === "save_contact") {
    const phone = typeof input.phone === "string" ? normalizePhone(input.phone) : null;
    const email = typeof input.email === "string" && /\S+@\S+\.\S+/.test(input.email) ? input.email.trim().toLowerCase() : undefined;
    chat.contact = {
      ...chat.contact,
      ...(typeof input.name === "string" && input.name.trim() && { name: input.name.trim().slice(0, 80) }),
      ...(phone && { phone }),
      ...(email && { email }),
    };
    const data = { looking_for: input.looking_for ?? null, language: input.language ?? null, chatId: chat.id, email: chat.contact.email ?? null };
    if (chat.leadId && (await readLeads()).some((l) => l.id === chat.leadId)) {
      await updateLead(chat.leadId, { note: [input.looking_for, chat.contact.email].filter(Boolean).join(" · ").slice(0, 1000) });
    } else {
      const rec = await addLead("chat", { ...data, name: chat.contact.name ?? "Chat visitor", phone: chat.contact.phone ?? "" }, { email: chat.contact.email ?? null, userId: chat.userId });
      chat.leadId = rec.id;
    }
    return JSON.stringify({ saved: true, has_phone: !!chat.contact.phone, phone_valid: input.phone == null || !!phone });
  }

  if (name === "request_viewing") {
    const l = await getListing(String(input.listing_id ?? ""));
    const phone = normalizePhone(String(input.phone ?? ""));
    if (!l) return JSON.stringify({ error: "That listing isn't available any more" });
    if (!phone) return JSON.stringify({ error: "Phone number looks invalid; ask for a WhatsApp number with country code" });
    await addLead(
      "inquiry",
      { name: String(input.name), phone, moveIn: String(input.move_in), message: String(input.note ?? ""), listingId: l.id, via: "chat" },
      { listingId: l.id, listingTitle: l.title, userId: chat.userId, email: chat.contact.email ?? null },
    );
    chat.contact = { ...chat.contact, name: String(input.name), phone };
    return JSON.stringify({ booked: true, listing: l.title, next: "The Stayshay team will WhatsApp them to fix a time." });
  }

  return JSON.stringify({ error: `Unknown tool ${name}` });
}

/* ---------- one visitor turn ---------- */

export async function chatTurn(chat: Chat, text: string, ctx: TurnContext = {}): Promise<{ reply: string; cards: Card[] }> {
  const now = () => new Date().toISOString();
  if (chat.transcript.filter((t) => t.role === "user").length >= MAX_TURNS) {
    return { reply: "We've talked a lot! For anything else, message the team on WhatsApp: +971 56 904 8493.", cards: [] };
  }
  // Context travels inside the user turn (append-only history keeps the cache and thinking blocks valid).
  const notes: string[] = [];
  const known = [chat.contact.name && `name ${chat.contact.name}`, chat.contact.phone && `WhatsApp +${chat.contact.phone}`, chat.contact.email && `email ${chat.contact.email}`].filter(Boolean).join(", ");
  if (known) notes.push(`Visitor details on file: ${known}.`);
  if (ctx.location) {
    const nearest = [...AREAS].sort((a, b) => km(ctx.location!, a) - km(ctx.location!, b))[0];
    if (nearest) notes.push(`Visitor shared their location: nearest area is ${nearest.name}.`);
  }
  if (ctx.listingId) {
    const l = await getListing(ctx.listingId);
    if (l) notes.push(`Visitor is looking at listing ${l.id}: "${l.title}", ${AREA_BY_SLUG.get(l.areaSlug)?.name}, AED ${l.priceAed}/month.`);
  }
  const seen = new Map<string, Listing>();
  chat.messages.push({ role: "user", content: notes.length ? `${text}\n\n[Context, not written by the visitor: ${notes.join(" ")}]` : text });
  chat.transcript.push({ role: "user", text, at: now() });

  let reply = "";
  for (let step = 0; step < 6; step++) {
    const res = await client().beta.messages.create({
      model: MODEL,
      max_tokens: 16000,
      system: [{ type: "text", text: SYSTEM, cache_control: { type: "ephemeral" } }],
      tools: TOOLS,
      messages: chat.messages,
      output_config: { effort: "low" },
      // Opt-in server-side fallback: if the model declines, the API retries on a fallback model in the same call.
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
    } as Anthropic.Beta.MessageCreateParamsNonStreaming);

    chat.messages.push({ role: "assistant", content: res.content as Anthropic.Beta.BetaContentBlockParam[] });
    const text = res.content.flatMap((b) => (b.type === "text" ? [b.text] : [])).join("\n").trim();

    if (res.stop_reason === "refusal") {
      reply = "Sorry, I can't help with that one. I'm here to help you find a place to live in the UAE.";
      break;
    }
    if (res.stop_reason === "pause_turn") continue;
    if (res.stop_reason !== "tool_use") {
      reply = text || (res.stop_reason === "max_tokens" ? "Sorry, that got long. Could you ask again in a simpler way?" : "");
      break;
    }

    const results: Anthropic.Beta.BetaToolResultBlockParam[] = [];
    for (const block of res.content) {
      if (block.type !== "tool_use") continue;
      try {
        results.push({ type: "tool_result", tool_use_id: block.id, content: await runTool(chat, block.name, block.input as Record<string, unknown>, ctx, seen) });
      } catch (e) {
        results.push({ type: "tool_result", tool_use_id: block.id, content: `Tool failed: ${(e as Error).message}`, is_error: true });
      }
    }
    chat.messages.push({ role: "user", content: results });
  }

  reply ||= "Sorry, I lost my train of thought. Could you say that again?";
  chat.transcript.push({ role: "assistant", text: reply, at: now() });
  chat.updatedAt = now();
  await saveChat(chat);

  // Cards: places Shay actually named in the reply (by title or id); otherwise none.
  const lower = reply.toLowerCase();
  const cards = [...seen.values()]
    .filter((l) => lower.includes(l.id.toLowerCase()) || lower.includes(l.title.toLowerCase().slice(0, 28)))
    .slice(0, 3)
    .map((l) => ({ id: l.id, title: l.title, type: TYPE_LABEL[l.type], area: AREA_BY_SLUG.get(l.areaSlug)?.name ?? l.areaName ?? "", priceAed: l.priceAed, photo: l.photos[0] ?? null, billsIncluded: l.billsIncluded }));
  return { reply, cards };
}

export async function saveContactOnly(chat: Chat) {
  await saveChat(chat);
}
