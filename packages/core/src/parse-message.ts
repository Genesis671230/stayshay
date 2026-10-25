import type { Area, Gender, ListingType } from "./types.ts";
import { normalize } from "./search.ts";
import { normalizePhone } from "./inquiry.ts";

export interface ParsedListing {
  type?: ListingType;
  title?: string;
  areaSlug?: string;
  priceAed?: number;
  deposit?: number;
  billsIncluded?: boolean;
  gender?: Gender;
  metro?: string;
  listerPhone?: string;
  description?: string;
}

const num = (s?: string) => (s ? Number(s.replace(/[,\s]/g, "")) : undefined);

/**
 * Best-effort reading of a lister's WhatsApp message ("Partition available in Al Barsha 1, AED 1,400 all bills
 * included, ladies only, near MOE metro, call 050…"). The admin reviews every field before publishing.
 */
export function parseListingMessage(text: string, areas: Area[]): ParsedListing {
  const out: ParsedListing = {};
  const t = text.replace(/\r/g, "");
  const low = t.toLowerCase();

  if (/bed\s*-?\s*space|bunk/.test(low)) out.type = "bed_space";
  else if (/partition/.test(low)) out.type = "partition";
  else if (/studio|1\s*bhk|1\s*bed(room)?\s*(flat|apartment)/.test(low)) out.type = "studio";
  else if (/room\s*-?\s*mate|flat\s*-?\s*mate/.test(low)) out.type = "roommate";
  else if (/room/.test(low)) out.type = "room";

  const price =
    t.match(/(?:aed|dhs?|dirhams?)\.?\s*([\d][\d,]{2,6})/i)?.[1] ??
    t.match(/([\d][\d,]{2,6})\s*(?:aed|dhs?|dirhams?|\/\s*m(?:onth)?\b|per\s*month|monthly)/i)?.[1] ??
    t.match(/(?:rent|price)\D{0,12}([\d][\d,]{2,6})/i)?.[1];
  const p = num(price);
  if (p && p >= 200 && p <= 100000) out.priceAed = p;

  const dep = num(t.match(/deposit\D{0,15}([\d][\d,]{1,6})/i)?.[1]);
  if (dep != null && dep < 100000) out.deposit = dep;
  else if (/no\s*deposit/i.test(t)) out.deposit = 0;

  if (/(all\s*)?(bills?|utilities|dewa)[^.\n]{0,20}(included|inclusive|free)|including\s+(all\s*)?(bills|dewa|utilities)/i.test(t)) out.billsIncluded = true;

  const female = /\b(female|ladies|lady|girls?|women)\b/i.test(t);
  const male = /\b(male|gents|gentlemen|boys?|men)\b/i.test(t.replace(/\bfemale\b/gi, ""));
  out.gender = female && !male ? "female" : male && !female ? "male" : "any";

  const metro = t.match(/(?:near|next to|walking (?:distance )?to|close to)\s+(?:the\s+)?([A-Za-z][\w\s'()-]{2,40}?)\s+metro/i)?.[1];
  if (metro) out.metro = metro.trim();

  // Longest area name / alias found in the message wins ("Al Barsha 1" over "Barsha").
  const msg = ` ${normalize(t)} `;
  let best: { slug: string; len: number } | null = null;
  for (const a of areas) {
    for (const name of [a.name, ...a.aliases]) {
      const n = normalize(name);
      if (n.length >= 3 && msg.includes(` ${n} `) && (!best || n.length > best.len)) best = { slug: a.slug, len: n.length };
    }
  }
  if (best) out.areaSlug = best.slug;

  for (const m of t.matchAll(/(\+?\d[\d\s-]{7,}\d)/g)) {
    const ph = normalizePhone(m[1]);
    if (ph) {
      out.listerPhone = ph;
      break;
    }
  }

  const lines = t.split("\n").map((l) => l.replace(/[*_~]/g, "").trim()).filter(Boolean);
  const first = lines.find((l) => /[a-z]{3}/i.test(l) && !/^\+?\d/.test(l));
  if (first) out.title = first.replace(/^[^\w(]+/, "").slice(0, 80);
  out.description = lines
    .filter((l) => !/(\+?\d[\d\s-]{7,}\d)/.test(l))
    .join("\n")
    .slice(0, 2000);
  return out;
}
