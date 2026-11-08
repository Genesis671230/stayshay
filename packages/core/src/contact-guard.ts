/**
 * Keeps roommate chat on Stayshay: spots phone numbers, emails, links, handles and any attempt to move the
 * conversation to another app, including spelled-out digits, spaced letters, leetspeak, look-alike letters,
 * Arabic / Hindi / Tagalog phrasing, code words, and details split across several short messages.
 *
 * Rent talk has to survive this, so budgets, dates, flat numbers and "on the red line" are deliberately allowed.
 */

export type ContactReason = "phone" | "email" | "link" | "handle" | "app" | "ask";
export type ContactCheck = { blocked: false } | { blocked: true; reason: ContactReason };

const ZERO_WIDTH = /[​-‏‪-‮⁠-⁤﻿­]/g;
const LOOKALIKE: Record<string, string> = { а: "a", е: "e", о: "o", р: "p", с: "c", х: "x", у: "y", і: "i", ј: "j", ѕ: "s", һ: "h", ԝ: "w", ո: "n", ν: "v", ο: "o", α: "a", ρ: "p" };
const NUMBER_WORD: Record<string, string> = {
  zero: "0", oh: "0", one: "1", two: "2", three: "3", four: "4", five: "5", six: "6", seven: "7", eight: "8", nine: "9",
  ek: "1", do: "2", teen: "3", char: "4", paanch: "5", panch: "5", chhe: "6", saat: "7", aath: "8", nau: "9", shunya: "0",
  isa: "1", dalawa: "2", tatlo: "3", apat: "4", lima: "5", anim: "6", pito: "7", walo: "8", siyam: "9",
  صفر: "0", واحد: "1", اثنين: "2", ثلاثة: "3", اربعة: "4", أربعة: "4", خمسة: "5", ستة: "6", سبعة: "7", ثمانية: "8", تسعة: "9",
};
const LEET: Record<string, string> = { "0": "o", "1": "i", "3": "e", "4": "a", "5": "s", "7": "t", "@": "a", $: "s", "!": "i" };

function base(text: string): string {
  return text
    .normalize("NFKC")
    .replace(ZERO_WIDTH, "")
    .replace(/️|⃣/g, "")
    .toLowerCase()
    .replace(/[аеорсхуіјѕһԝոνορ]/g, (c) => LOOKALIKE[c] ?? c)
    .replace(/[٠-٩]/g, (c) => String(c.charCodeAt(0) - 0x0660))
    .replace(/[۰-۹]/g, (c) => String(c.charCodeAt(0) - 0x06f0));
}

/** "zero five double two" becomes "0 5 22". A lone "do" or "one" only matters inside a long run of digits. */
function digitView(s: string): string {
  return s
    .replace(/\b(double|triple)[\s-]+(\d|[a-z]+)\b/g, (m, k: string, w: string) => {
      const d = /\d/.test(w) ? w : NUMBER_WORD[w];
      return d ? d.repeat(k === "double" ? 2 : 3) : m;
    })
    .split(/(\s+|[-.,/_*:|~()+])/)
    .map((t) => NUMBER_WORD[t] ?? t)
    .join("");
}

const SEP = "[\\s\\-.,/_*:|~()+]{0,3}";
const DIGIT_RUN = new RegExp(`\\d(?:${SEP}\\d)+`, "g");

/** Prices such as "2500 3500 4000": every group is a round rent figure. */
const looksLikePrices = (run: string) => {
  const groups = run.split(/\D+/).filter(Boolean);
  return groups.length > 1 && groups.every((g) => g.length >= 3 && g.length <= 5 && /(00|50)$/.test(g));
};

function hasPhone(raw: string): boolean {
  let view = digitView(raw).replace(/(?<=\d)o(?=\d)|\bo(?=\d)/g, "0");
  for (const run of view.match(DIGIT_RUN) ?? []) {
    const digits = run.replace(/\D/g, "");
    if (looksLikePrices(run)) {
      view = view.replace(run, " ");
      continue;
    }
    if (digits.length >= 9) return true;
    if (digits.length >= 7 && /^(05\d|5\d{7}|971|00971)/.test(digits)) return true;
  }
  // Digits scattered through otherwise short text: "0a5b0c1d2e3f4g5h6i7".
  const all = view.replace(/\D/g, "");
  const dense = view.replace(/\s/g, "");
  return all.length >= 10 && all.length / Math.max(1, dense.length) > 0.4;
}

const HARD_APP_SQUASHED =
  /whatsapp|whatsap|watsapp|watsap|wattsapp|wtsapp|whtsapp|whatapp|whatssapp|whazzapp|wazzap|wassap|whtsap|instagram|instagrm|instgram|insta(?:gm|id)|telegram|telegrm|telgram|facebook|faceboook|fbmessenger|messenger|snapchat|tiktok|tictok|wechat|viber|botim|linkedin|skype|gmail|hotmail|outlook|yahoo|icloud|protonmail/;
const ARABIC_APP = /واتس|وتساب|واتساب|انستا|إنستا|انستقرام|انستغرام|تلجرام|تليجرام|تيليجرام|فيسبوك|فيس بوك|ماسنجر|سناب|تيك توك|تيكتوك|بوتيم/;
const SHORT_APP_TOKEN = /(?:^|[^a-z0-9])(insta|ig|fb|tg|wapp|whats|wats)(?:[^a-z0-9]|$)/;

/** Ordinary words that only count when the sentence is clearly about reaching someone there. */
const SOFT_APPS = "signal|imo|discord|snap|sc|kik|twitter|threads|zoom|teams|wa|tele|gram|x";
const SOFT_APP_CONTEXT = new RegExp(`\\b(?:on|via|through|add me|find me|follow me|dm me|text me|message me|ping me|use|got|have you got)\\s+(?:the\\s+)?(?:${SOFT_APPS})\\b(?!\\s+(?:line|road|street|tower))|\\b(?:${SOFT_APPS})\\s*(?:id|handle|username|app|number|no)\\b|\\bsnap\\s+me\\b|\\bline\\s*(?:id|app)\\b|\\b(?:add|find|text|message) me on line\\b`);

const CODE_WORDS =
  /\b(?:green|blue|purple|yellow|ghost|camera|bird|paper ?plane|chat)\s+app\b|\bthe\s+(?:blue|little)\s+bird\b|\bpaper ?plane app\b|\bthe gram\b|\bmeta app\b|\bapp (?:with|that has) the (?:ghost|camera|bird|phone)\b|\b(?:other|another|different|better|outside|real) (?:app|apps|platform|site|chat|number)\b|\b(?:outside|off|leave|away from)\s+(?:of\s+)?(?:this|the|here|stayshay)\s*(?:app|site|platform|chat)?\b.*\b(?:talk|chat|text|speak|message|continue|contact|reach)\b|\b(?:talk|chat|text|speak|message|continue|contact|reach)\b.*\b(?:outside|off|away from)\s+(?:of\s+)?(?:this|the|stayshay)\s*(?:app|site|platform|chat)?\b|\b(?:talk|chat|continue) (?:elsewhere|somewhere else)\b/;

const ASKS =
  /\b(?:your|ur|yr|my|send|share|give|drop|got|have|need|what(?:'|’)?s|whats)\s+(?:me\s+)?(?:your\s+|ur\s+|my\s+|a\s+)?(?:phone|mobile|cell|contact|digits|socials?|handle|username|e-?mail|number|num|nmbr|no\.)(?!\s+of\b)(?!\s+(?:\d|plate))\b|\b(?:mera|meri|apna|apni|tera|teri|tumhara|aapka|aapki)\s+(?:number|no|nambar|mobile|contact|id)\b|\b(?:number|numero|fb|ig|insta) mo\b|\bmy id is\b|\bphone me\b|\bgive me a (?:call|ring|buzz)\b|\bmissed call\b|\bcall me (?:on|at|when|now|later|tonight|tomorrow|today|back)\b|\b(?:let(?:'|’)?s|can we|could we|can i|shall we) (?:call|phone|video call|facetime)\b|\bfacetime\b|رقمي|رقمك|رقم الجوال|رقم الموبايل|تواصل معي على|كلمني على/;

const EMAIL = /[a-z0-9._%+-]+\s*(?:@|\(at\)|\[at\]|\{at\}|\sat\s)\s*[a-z0-9-]+\s*(?:\.|\(dot\)|\[dot\]|\sdot\s)\s*[a-z]{2,}/;
const LINK = /\bhttps?:|\bwww\.|\bwa\.me\b|\bt\.me\b|\bbit\.ly\b|\bfb\.(?:me|com)\b|\big\.me\b|\bm\.me\b|\b[a-z0-9-]{2,}\s?\.\s?(?:com|net|org|me|io|co|ae|app|ly|link|gg|xyz)\b(?!\s*\.)/;
const HANDLE = /(?:^|[\s(:])@[a-z0-9_.]{3,}/;

function checkOne(raw: string): ContactCheck {
  const s = base(raw);
  if (EMAIL.test(s)) return { blocked: true, reason: "email" };
  if (LINK.test(s)) return { blocked: true, reason: "link" };
  if (HANDLE.test(s)) return { blocked: true, reason: "handle" };
  if (hasPhone(s)) return { blocked: true, reason: "phone" };

  const leet = s.replace(/[013457@$!]/g, (c) => LEET[c] ?? c);
  const squashed = leet.replace(/[^a-z؀-ۿ]/g, "");
  if (HARD_APP_SQUASHED.test(squashed) || ARABIC_APP.test(s) || ARABIC_APP.test(s.replace(/\s/g, ""))) return { blocked: true, reason: "app" };
  if (SHORT_APP_TOKEN.test(s) || SHORT_APP_TOKEN.test(leet)) return { blocked: true, reason: "app" };
  if (SOFT_APP_CONTEXT.test(s) || SOFT_APP_CONTEXT.test(leet) || CODE_WORDS.test(s)) return { blocked: true, reason: "app" };
  if (ASKS.test(s)) return { blocked: true, reason: "ask" };
  return { blocked: false };
}

const SHORT_PIECE = 16;

/**
 * Checks a new message. `recent` is what the same sender just sent in this chat (oldest first):
 * short fragments are joined so "050" + "123" + "4567" or "whats" + "app" are caught together.
 */
export function checkContact(text: string, recent: string[] = []): ContactCheck {
  const alone = checkOne(text);
  if (alone.blocked || text.trim().length > SHORT_PIECE) return alone;
  const pieces: string[] = [];
  for (const r of [...recent].reverse().slice(0, 6)) {
    if (r.trim().length > SHORT_PIECE) break;
    pieces.unshift(r.trim());
  }
  if (!pieces.length) return alone;
  const all = [...pieces, text.trim()];
  const joined = checkOne(all.join(" "));
  if (joined.blocked) return joined;
  return checkOne(all.join(""));
}
