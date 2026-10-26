import { AREAS, AREA_BY_SLUG, BRAND, TYPE_LABEL, filterListings, parseSearchText, rankDeals, searchAreas, validateInquiry, whatsappLink, whatsappMessage, type Listing, type ListingFilters, type ListingType } from "@stayshay/core";
import { addLead, getAllListings, getListing } from "./store";
import { SITE, absolute, areaName, listingUrl } from "./seo";

/**
 * Stayshay MCP server (Model Context Protocol, Streamable HTTP, stateless JSON responses) at /mcp.
 * Lets ChatGPT (connectors / apps / deep research), Claude (custom connectors), Cursor and any MCP client
 * search live listings, rank deals and book viewings. `search` + `fetch` follow the shape ChatGPT expects.
 */

export const SERVER_INFO = { name: "stayshay", title: "Stayshay: monthly rooms & bed spaces in the UAE", version: "1.0.0", websiteUrl: SITE };
const VERSIONS = ["2025-11-25", "2025-06-18", "2025-03-26", "2024-11-05"];

export const INSTRUCTIONS = `Stayshay (${SITE}) lists affordable monthly housing in the UAE: bed spaces, partitions, private rooms and studios in Dubai, Sharjah and nearby. Use search_listings (or search with plain words) to find places, best_deals for below-market picks, fetch for full details, and request_viewing when the person wants to see a place. Always give the listing link. Prices are monthly in AED. Remind people never to pay before viewing. Renters can also WhatsApp Stayshay on ${BRAND.whatsappDisplay}.`;

const TYPES = ["bed_space", "partition", "room", "studio"] as const;

const READ_ONLY = { readOnlyHint: true, destructiveHint: false, openWorldHint: false, idempotentHint: true };

export const TOOLS = [
  {
    name: "search",
    title: "Search Stayshay listings",
    description:
      "Search live Stayshay rentals in plain words, e.g. 'cheap female bed space in Karama under 900 with bills', 'studio JLT budget 4.5k', 'partition near metro Barsha'. Returns matching listings (id, title, url).",
    inputSchema: { type: "object", properties: { query: { type: "string", description: "What the person is looking for, in plain words" } }, required: ["query"] },
    annotations: READ_ONLY,
  },
  {
    name: "fetch",
    title: "Get a listing",
    description: "Full details of one Stayshay listing by id (e.g. HB429841 or SS1001): rent, deposit, bills, upfront cost, minimum stay, who can live there, location, photos and link.",
    inputSchema: { type: "object", properties: { id: { type: "string", description: "Listing id from search results" } }, required: ["id"] },
    annotations: READ_ONLY,
  },
  {
    name: "search_listings",
    title: "Search with filters",
    description:
      "Search live Stayshay rentals with filters. Leave out any filter the person didn't give. Results are monthly prices in AED with a link to each listing.",
    inputSchema: {
      type: "object",
      properties: {
        area: { type: "string", description: "Area, community, metro station or emirate as said, e.g. 'Barsha', 'JLT', 'Karama', 'Sharjah'" },
        type: { type: "string", enum: TYPES, description: "Kind of place" },
        max_price: { type: "number", description: "Maximum monthly rent in AED" },
        min_price: { type: "number", description: "Minimum monthly rent in AED" },
        gender: { type: "string", enum: ["male", "female"], description: "Household needed (female also shows mixed places)" },
        bills_included: { type: "boolean" },
        no_deposit: { type: "boolean" },
        near_metro: { type: "boolean", description: "About 10 minutes' walk or less to a metro station" },
        sort: { type: "string", enum: ["recommended", "price_asc", "price_desc", "newest"] },
        limit: { type: "number", description: "1–20, default 8" },
      },
    },
    annotations: READ_ONLY,
  },
  {
    name: "best_deals",
    title: "Best deals right now",
    description:
      "Shay's best-value picks: live listings ranked by how far below the typical price for the same kind of place and area they are, plus bills included, no deposit and metro access. Optional filters.",
    inputSchema: {
      type: "object",
      properties: {
        type: { type: "string", enum: TYPES },
        area: { type: "string" },
        max_price: { type: "number" },
        limit: { type: "number", description: "1–20, default 6" },
      },
    },
    annotations: READ_ONLY,
  },
  {
    name: "request_viewing",
    title: "Request a viewing",
    description:
      "Send a viewing request for a listing to the Stayshay team, who then contact the person on WhatsApp to fix a time. Only call this after the person agrees and gives their name and WhatsApp number.",
    inputSchema: {
      type: "object",
      properties: {
        listing_id: { type: "string" },
        name: { type: "string" },
        whatsapp: { type: "string", description: "WhatsApp number with country code, e.g. +971 50 123 4567" },
        move_in: { type: "string", description: "Move-in date YYYY-MM-DD" },
        note: { type: "string", description: "Anything the team should know (people, questions)" },
      },
      required: ["listing_id", "name", "whatsapp", "move_in"],
    },
    annotations: { readOnlyHint: false, destructiveHint: false, openWorldHint: true, idempotentHint: false },
  },
];

/* ---------- formatting ---------- */

function summary(l: Listing) {
  return {
    id: l.id,
    title: l.title,
    type: TYPE_LABEL[l.type],
    area: areaName(l),
    emirate: AREA_BY_SLUG.get(l.areaSlug)?.emirate ?? l.city ?? null,
    price_aed_per_month: l.priceAed,
    ...(l.priceMaxAed ? { price_up_to_aed: l.priceMaxAed } : {}),
    bills_included: l.billsIncluded,
    deposit_aed: l.deposit,
    who_can_live: l.gender === "any" ? "mixed" : `${l.gender} only`,
    metro: l.metro ?? AREA_BY_SLUG.get(l.areaSlug)?.nearMetro ?? null,
    metro_walk_minutes: l.nearMetroMinutes,
    photo: l.photos[0] ? absolute(l.photos[0]) : null,
    url: listingUrl(l),
  };
}

function details(l: Listing) {
  return {
    ...summary(l),
    photos: l.photos.slice(0, 8).map(absolute),
    upfront_cost_aed: l.upfrontCost ?? 0,
    commission_aed: l.commission,
    utilities: l.utilities ?? (l.billsIncluded ? "Included" : "Not included"),
    availability: l.availability ?? l.availableFrom,
    minimum_stay: l.minimumStay ?? `${l.minStayMonths} month(s)`,
    notice_period: l.noticePeriod,
    bathroom: l.bathroom,
    sleeping_set: l.sleepingSet,
    max_people: l.maxCapacity,
    tenants: l.preferredTenant,
    nationalities: l.preferredNationality,
    features: l.features,
    verified: l.verifiedLister,
    description: (l.descriptionLines?.length ? l.descriptionLines.join("\n") : l.description).slice(0, 2000),
    book_viewing: `${listingUrl(l)}#book`,
    whatsapp_stayshay: whatsappLink(BRAND.whatsapp, whatsappMessage(l, {})),
  };
}

function areaFilter(raw: unknown): Pick<ListingFilters, "areaSlugs" | "emirate"> {
  if (typeof raw !== "string" || !raw.trim()) return {};
  const em = raw.trim().toLowerCase().match(/^(dubai|sharjah|ajman|abu dhabi)$/)?.[1];
  if (em && em !== "dubai") return { emirate: em.replace(/\b\w/g, (c) => c.toUpperCase()) };
  if (em) return { emirate: "Dubai" };
  const hit = searchAreas(AREAS, raw, 1)[0];
  return hit ? { areaSlugs: [hit.area.slug] } : {};
}

const clamp = (n: unknown, def: number) => (typeof n === "number" && Number.isFinite(n) ? Math.max(1, Math.min(20, Math.round(n))) : def);

const text = (data: unknown, structured?: Record<string, unknown>) => ({
  content: [{ type: "text", text: typeof data === "string" ? data : JSON.stringify(data) }],
  ...(structured ? { structuredContent: structured } : {}),
});

/* ---------- tools ---------- */

const viewingHits = new Map<string, number[]>();

export async function callTool(name: string, args: Record<string, unknown>, ip: string) {
  if (name === "search") {
    const q = String(args.query ?? "").trim();
    const f = parseSearchText(AREAS, q);
    let found = filterListings(await getAllListings(), AREAS, f);
    if (!found.length && (f.areaSlugs || f.maxPrice)) found = filterListings(await getAllListings(), AREAS, { ...f, areaSlugs: undefined, emirate: undefined });
    const results = found.slice(0, 10).map((l) => ({ id: l.id, title: `${l.title} · AED ${l.priceAed.toLocaleString("en-US")}/month · ${areaName(l)}`, url: listingUrl(l) }));
    return text({ results }, { results, total: found.length, understood: f });
  }

  if (name === "fetch") {
    const l = await getListing(String(args.id ?? "").trim());
    if (!l) return { ...text({ error: "No live listing with that id. It may have been rented." }), isError: true };
    const d = details(l);
    const doc = { id: l.id, title: l.title, text: JSON.stringify(d, null, 1), url: d.url, metadata: { price_aed_per_month: String(l.priceAed), area: d.area, type: d.type } };
    return text(doc, doc);
  }

  if (name === "search_listings") {
    const type = TYPES.find((t) => t === args.type) as ListingType | undefined;
    const f: ListingFilters = {
      ...areaFilter(args.area),
      types: type ? [type] : undefined,
      maxPrice: typeof args.max_price === "number" ? args.max_price : undefined,
      minPrice: typeof args.min_price === "number" ? args.min_price : undefined,
      gender: args.gender === "male" || args.gender === "female" ? args.gender : undefined,
      billsIncluded: args.bills_included === true || undefined,
      noDeposit: args.no_deposit === true || undefined,
      nearMetro: args.near_metro === true || undefined,
      sort: (["recommended", "price_asc", "price_desc", "newest"] as const).find((s) => s === args.sort),
    };
    const found = filterListings(await getAllListings(), AREAS, f);
    const places = found.slice(0, clamp(args.limit, 8)).map(summary);
    const note = typeof args.area === "string" && args.area.trim() && !f.areaSlugs && !f.emirate ? `No known area matched "${args.area}"; searched everywhere.` : undefined;
    const out = { total: found.length, note, places, more: `${SITE}/search?${new URLSearchParams({ ...(type && { type }), ...(f.areaSlugs && { area: f.areaSlugs[0] }), ...(f.maxPrice && { max: String(f.maxPrice) }) })}` };
    return text(out, out);
  }

  if (name === "best_deals") {
    const type = TYPES.find((t) => t === args.type) as ListingType | undefined;
    const pool = filterListings(await getAllListings(), AREAS, {
      ...areaFilter(args.area),
      types: type ? [type] : undefined,
      maxPrice: typeof args.max_price === "number" ? args.max_price : undefined,
    });
    // Rank against the whole catalogue so "below typical" means the market, not just this slice.
    const all = await getAllListings();
    const ids = new Set(pool.map((l) => l.id));
    const deals = rankDeals(all, all.length)
      .filter((d) => ids.has(d.listing.id))
      .slice(0, clamp(args.limit, 6))
      .map((d) => ({ ...summary(d.listing), deal_score: d.score, typical_price_aed: d.typicalAed, why: d.reasons }));
    const out = { deals, all_deals: `${SITE}/deals` };
    return text(out, out);
  }

  if (name === "request_viewing") {
    const now = Date.now();
    const recent = (viewingHits.get(ip) ?? []).filter((t) => now - t < 3_600_000);
    if (recent.length >= 5) return { ...text("Too many requests from here. Ask the person to WhatsApp Stayshay directly: " + `https://wa.me/${BRAND.whatsapp}`), isError: true };
    viewingHits.set(ip, [...recent, now]);
    const l = await getListing(String(args.listing_id ?? ""));
    if (!l) return { ...text({ error: "No live listing with that id." }), isError: true };
    const check = validateInquiry({ listingId: l.id, name: args.name, phone: args.whatsapp, moveIn: args.move_in, budget: l.priceAed, message: String(args.note ?? "") });
    if (!check.ok || !check.value) return { ...text({ error: "Please fix these and try again", fields: check.errors }), isError: true };
    await addLead("inquiry", { ...check.value, website: undefined, via: "ai-assistant" } as Record<string, unknown> & { name: string; phone: string }, {
      listingId: l.id,
      listingTitle: l.title,
      source: "ai",
    });
    return text({
      ok: true,
      message: `Viewing request sent for "${l.title}". The Stayshay team will WhatsApp ${check.value.name} on +${check.value.phone} to fix a time. Never pay anything before the viewing.`,
      listing: listingUrl(l),
    });
  }

  return { ...text(`Unknown tool: ${name}`), isError: true };
}

/* ---------- JSON-RPC ---------- */

type Rpc = { jsonrpc: "2.0"; id?: string | number | null; method: string; params?: Record<string, unknown> };

export async function handleRpc(msg: Rpc, ip: string): Promise<object | null> {
  const reply = (result: unknown) => ({ jsonrpc: "2.0", id: msg.id ?? null, result });
  const fail = (code: number, message: string) => ({ jsonrpc: "2.0", id: msg.id ?? null, error: { code, message } });
  if (msg.id === undefined) return null; // notification (e.g. notifications/initialized): no response

  switch (msg.method) {
    case "initialize": {
      const asked = String(msg.params?.protocolVersion ?? "");
      return reply({
        protocolVersion: VERSIONS.includes(asked) ? asked : VERSIONS[0],
        capabilities: { tools: { listChanged: false }, resources: {}, prompts: {} },
        serverInfo: SERVER_INFO,
        instructions: INSTRUCTIONS,
      });
    }
    case "ping":
      return reply({});
    case "tools/list":
      return reply({ tools: TOOLS });
    case "tools/call": {
      const name = String(msg.params?.name ?? "");
      const args = (msg.params?.arguments ?? {}) as Record<string, unknown>;
      try {
        return reply(await callTool(name, args, ip));
      } catch (e) {
        console.error("[mcp] tool failed", name, e);
        return reply({ ...text("Something went wrong on our side. Try again, or see " + SITE), isError: true });
      }
    }
    case "resources/list":
      return reply({ resources: [] });
    case "resources/templates/list":
      return reply({ resourceTemplates: [] });
    case "prompts/list":
      return reply({ prompts: [] });
    default:
      return fail(-32601, `Method not found: ${msg.method}`);
  }
}
