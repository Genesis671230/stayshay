"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { AREAS, BRAND, TYPE_LABEL, filterListings, type Listing, type ListingType } from "@stayshay/core";
import { Shay, type ShayMood } from "./shay";
import { Icon, aed } from "./ui";

type Card = { id: string; title: string; type: string; area: string; priceAed: number; photo: string | null; billsIncluded: boolean };
type Msg = { role: "user" | "assistant"; text: string; cards?: Card[]; chips?: { label: string; value: string }[] };

const CHAT_KEY = "stayshay:chat";
export const LOC_KEY = "stayshay:loc";
const STARTERS = ["Bed space under AED 1,000 in Karama", "Female partition near the metro", "Find me a roommate", "مرحبا، أبحث عن غرفة قريبة من المترو", "Kailangan ko ng bed space sa Deira"];

/** Open the assistant from anywhere (hero, buttons), optionally with a first message. */
export function openShay(message?: string) {
  window.dispatchEvent(new CustomEvent("shay:open", { detail: { message } }));
}

export function getSavedLocation(): { lat: number; lng: number } | null {
  try {
    const v = JSON.parse(localStorage.getItem(LOC_KEY) ?? "null");
    return v && Number.isFinite(v.lat) && Number.isFinite(v.lng) ? v : null;
  } catch {
    return null;
  }
}

/** Browser location, rounded to ~100 m and kept only in this browser. */
export function askLocation(): Promise<{ lat: number; lng: number } | null> {
  return new Promise((resolve) => {
    if (!navigator.geolocation) return resolve(null);
    navigator.geolocation.getCurrentPosition(
      (p) => {
        const loc = { lat: Math.round(p.coords.latitude * 1000) / 1000, lng: Math.round(p.coords.longitude * 1000) / 1000 };
        try {
          localStorage.setItem(LOC_KEY, JSON.stringify(loc));
        } catch {}
        window.dispatchEvent(new CustomEvent("stayshay:location", { detail: loc }));
        resolve(loc);
      },
      () => resolve(null),
      { timeout: 10000, maximumAge: 600000 },
    );
  });
}

export const km = (a: { lat: number; lng: number }, b: { lat: number; lng: number }) => {
  const r = (x: number) => (x * Math.PI) / 180;
  const h = Math.sin(r(b.lat - a.lat) / 2) ** 2 + Math.cos(r(a.lat)) * Math.cos(r(b.lat)) * Math.sin(r(b.lng - a.lng) / 2) ** 2;
  return 2 * 6371 * Math.asin(Math.sqrt(h));
};

function Cards({ cards }: { cards: Card[] }) {
  return (
    <div className="-mx-1 mt-2 flex gap-2 overflow-x-auto px-1 pb-1">
      {cards.map((c) => (
        <a key={c.id} href={`/listing/${c.id.toLowerCase()}`} className="w-[190px] shrink-0 overflow-hidden rounded-[16px] border border-line bg-white transition-shadow hover:shadow-md">
          <div className="relative h-[104px] bg-mint">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            {c.photo && <img src={c.photo} alt="" className="h-full w-full object-cover" />}
            <span className="absolute bottom-2 left-2 rounded-full bg-white px-2 py-0.5 text-[12px] font-extrabold text-ink shadow">{aed(c.priceAed)}</span>
          </div>
          <div className="p-2.5">
            <p className="line-clamp-1 text-[13px] font-bold text-ink">{c.title}</p>
            <p className="text-[11.5px] text-muted">
              {c.type} · {c.area}
              {c.billsIncluded ? " · bills incl." : ""}
            </p>
          </div>
        </a>
      ))}
    </div>
  );
}

/** URLs in Shay's replies become links (listing links get a short label). */
function Text({ text }: { text: string }) {
  const parts = text.split(/(https?:\/\/[^\s)]+)/g);
  return (
    <>
      {parts.map((p, i) =>
        /^https?:\/\//.test(p) ? (
          <a key={i} href={p.replace(/^https:\/\/stayshay\.com/, "") || "/"} className="font-semibold text-brand underline underline-offset-2">
            {/\/listing\/([a-z0-9]+)/i.test(p) ? `View ${p.match(/\/listing\/([a-z0-9]+)/i)![1].toUpperCase()}` : p.replace(/^https?:\/\/(www\.)?/, "")}
          </a>
        ) : (
          <span key={i}>{p}</span>
        ),
      )}
    </>
  );
}

/* ---------------- guided finder (works without the AI) ---------------- */

type Guide = { step: "type" | "budget" | "area" | "done"; type?: ListingType; max?: number };
const BUDGETS = [800, 1200, 1800, 3000, 5000];

function toCard(l: Listing): Card {
  const area = AREAS.find((a) => a.slug === l.areaSlug)?.name ?? l.areaName ?? "";
  return { id: l.id, title: l.title, type: TYPE_LABEL[l.type], area, priceAed: l.priceAed, photo: l.photos[0] ?? null, billsIncluded: l.billsIncluded };
}

function guideAsk(g: Guide): Msg {
  if (g.step === "type")
    return {
      role: "assistant",
      text: "Hi! I’m Shay ✨ Let’s find your place in three taps. What are you looking for?",
      chips: [
        { label: "Bed space", value: "bed_space" },
        { label: "Partition", value: "partition" },
        { label: "Private room", value: "room" },
        { label: "Studio", value: "studio" },
        { label: "Roommate", value: "roommate" },
      ],
    };
  if (g.step === "budget") return { role: "assistant", text: "Nice. What’s your monthly budget?", chips: BUDGETS.map((b) => ({ label: `Up to ${b.toLocaleString("en-US")}`, value: String(b) })) };
  const popular = ["al-barsha-1", "al-karama", "deira", "jlt", "al-nahda-sharjah", "bur-dubai"].filter((s) => AREAS.some((a) => a.slug === s));
  return {
    role: "assistant",
    text: "And where would you like to live?",
    chips: [{ label: "📍 Near me", value: "near-me" }, ...popular.map((s) => ({ label: AREAS.find((a) => a.slug === s)!.name, value: s })), { label: "Anywhere", value: "any" }],
  };
}

/* ---------------- widget ---------------- */

export function ShayChat() {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  const [hello, setHello] = useState(false);
  const [ai, setAi] = useState<boolean | null>(null);
  const [chatId, setChatId] = useState<string | null>(null);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [guide, setGuide] = useState<Guide>({ step: "type" });
  const listings = useRef<Listing[] | null>(null);
  const end = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let id: string | null = null;
    try {
      id = localStorage.getItem(CHAT_KEY);
    } catch {}
    fetch(`/api/agent${id ? `?id=${id}` : ""}`)
      .then((r) => r.json())
      .then((j) => {
        setAi(!!j.enabled);
        if (j.enabled && j.chat?.transcript?.length) {
          setChatId(j.chat.id);
          setMsgs(j.chat.transcript.map((t: Msg) => ({ role: t.role, text: t.text })));
        }
      })
      .catch(() => setAi(false));
    // Say hello once the visitor has had a look around (not over the first screen's search).
    const t = setInterval(() => {
      try {
        if (sessionStorage.getItem("stayshay:hello")) return clearInterval(t);
      } catch {}
      if (window.location.pathname !== "/" || window.scrollY > 520) {
        setHello(true);
        clearInterval(t);
      }
    }, 5000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    end.current?.scrollIntoView({ behavior: "smooth" });
  }, [msgs, busy, open]);

  const listingId = path?.match(/^\/listing\/([a-z0-9]+)/i)?.[1] ?? null;

  const sendAi = useCallback(
    async (text: string) => {
      const message = text.trim();
      if (!message) return;
      setMsgs((m) => [...m, { role: "user", text: message }]);
      setBusy(true);
      try {
        const res = await fetch("/api/agent", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ chatId, message, context: { location: getSavedLocation(), listingId } }),
        });
        const j = await res.json();
        if (j.chatId) {
          setChatId(j.chatId);
          try {
            localStorage.setItem(CHAT_KEY, j.chatId);
          } catch {}
        }
        const fallback = res.status === 429 ? "You're quick! Give me a few seconds and try again." : `I'm having a moment. The team is on WhatsApp: ${BRAND.whatsappDisplay}`;
        setMsgs((m) => [...m, { role: "assistant", text: j.reply ?? fallback, cards: j.cards ?? [] }]);
      } catch {
        setMsgs((m) => [...m, { role: "assistant", text: `I couldn't connect. WhatsApp the team on ${BRAND.whatsappDisplay}.` }]);
      } finally {
        setBusy(false);
      }
    },
    [chatId, listingId],
  );

  const guideAnswer = async (label: string, value: string) => {
    setMsgs((m) => [...m.map((x) => ({ ...x, chips: undefined })), { role: "user", text: label }]);
    if (guide.step === "type") {
      if (value === "roommate") {
        setMsgs((m) => [...m, { role: "assistant", text: "Lovely! Our roommate board shows people already looking, and you can add your own profile with a photo.", chips: [{ label: "Open roommates", value: "go:/roommates" }] }]);
        return;
      }
      const g: Guide = { step: "budget", type: value as ListingType };
      setGuide(g);
      setMsgs((m) => [...m, guideAsk(g)]);
      return;
    }
    if (guide.step === "budget") {
      const g: Guide = { ...guide, step: "area", max: Number(value) };
      setGuide(g);
      setMsgs((m) => [...m, guideAsk(g)]);
      return;
    }
    setBusy(true);
    if (!listings.current) listings.current = ((await fetch("/api/listings").then((r) => r.json()).catch(() => ({ listings: [] }))) as { listings: Listing[] }).listings;
    let areaSlugs: string[] | undefined;
    let near = "";
    if (value === "near-me") {
      const loc = getSavedLocation() ?? (await askLocation());
      if (loc) {
        const closest = [...AREAS].sort((a, b) => km(loc, a) - km(loc, b)).slice(0, 4);
        areaSlugs = closest.map((a) => a.slug);
        near = closest[0]?.name ?? "";
      }
    } else if (value !== "any") areaSlugs = [value];
    const found = filterListings(listings.current, AREAS, { types: guide.type ? [guide.type] : undefined, maxPrice: guide.max, areaSlugs });
    setBusy(false);
    setGuide({ step: "done" });
    const q = new URLSearchParams({ ...(guide.type ? { type: guide.type } : {}), ...(guide.max ? { max: String(guide.max) } : {}), ...(areaSlugs ? { area: areaSlugs.join(",") } : {}) });
    setMsgs((m) => [
      ...m,
      found.length
        ? {
            role: "assistant",
            text: `Found ${found.length} ${found.length === 1 ? "place" : "places"}${near ? ` around ${near}` : ""}. Here are the best ones. Tap one to see photos and book a viewing.`,
            cards: found.slice(0, 5).map(toCard),
            chips: [
              { label: `See all ${found.length}`, value: `go:/search?${q}` },
              { label: "Start again", value: "restart" },
              { label: "Talk to a person", value: "whatsapp" },
            ],
          }
        : {
            role: "assistant",
            text: "Nothing fits exactly right now. Try a higher budget or another area, or let the team find one for you.",
            chips: [
              { label: "Start again", value: "restart" },
              { label: "Find me a room", value: "go:/find" },
              { label: "Talk to a person", value: "whatsapp" },
            ],
          },
    ]);
  };

  const onChip = (label: string, value: string) => {
    if (value.startsWith("go:")) {
      window.location.href = value.slice(3);
      return;
    }
    if (value === "whatsapp") {
      window.open(`https://wa.me/${BRAND.whatsapp}?text=${encodeURIComponent("Hi Stayshay, I need help finding a place.")}`, "_blank");
      return;
    }
    if (value === "restart") {
      const g: Guide = { step: "type" };
      setGuide(g);
      setMsgs((m) => [...m.map((x) => ({ ...x, chips: undefined })), guideAsk(g)]);
      return;
    }
    void guideAnswer(label, value);
  };

  // Open from anywhere (hero "Ask Shay", buttons).
  useEffect(() => {
    const onOpen = (e: Event) => {
      setOpen(true);
      setHello(false);
      const message = (e as CustomEvent<{ message?: string }>).detail?.message;
      if (message && ai) void sendAi(message);
    };
    window.addEventListener("shay:open", onOpen);
    return () => window.removeEventListener("shay:open", onOpen);
  }, [ai, sendAi]);

  // Guided mode greets by itself the first time the panel opens.
  useEffect(() => {
    if (open && ai === false && !msgs.length) setMsgs([guideAsk({ step: "type" })]);
  }, [open, ai, msgs.length]);

  if (path?.startsWith("/admin")) return null;

  const mood: ShayMood = busy ? "thinking" : hello ? "happy" : "idle";
  const lift = /^\/(listing|find|list)\b/.test(path ?? "") ? "bottom-24 lg:bottom-6" : "bottom-4";
  const wa = `https://wa.me/${BRAND.whatsapp}?text=${encodeURIComponent("Hi Stayshay, I need help finding a place.")}`;

  return (
    <>
      {!open && (
        <div className={`fixed right-4 z-[60] flex items-end gap-2 md:bottom-6 md:right-6 ${lift}`}>
          {hello && (
            <button
              onClick={() => {
                setOpen(true);
                setHello(false);
              }}
              className="shay-pop mb-4 max-w-[230px] rounded-[20px] rounded-br-[6px] bg-white px-4 py-3 text-left text-[13.5px] leading-snug text-ink shadow-[0_12px_34px_rgb(0_0_0/0.16)]"
            >
              <span className="font-bold">Hi, I’m Shay ✨</span> Tell me your budget and I’ll find your place in seconds.
              <span
                role="button"
                tabIndex={0}
                aria-label="Dismiss"
                onClick={(e) => {
                  e.stopPropagation();
                  setHello(false);
                  try {
                    sessionStorage.setItem("stayshay:hello", "1");
                  } catch {}
                }}
                className="ml-2 inline-block align-middle text-muted"
              >
                <Icon name="close" size={12} />
              </span>
            </button>
          )}
          <button
            onClick={() => {
              setOpen(true);
              setHello(false);
            }}
            aria-label="Chat with Shay, the Stayshay assistant"
            className="flex h-[76px] w-[76px] items-center justify-center rounded-full bg-white/90 shadow-[0_12px_34px_rgb(20_92_70/0.3)] ring-1 ring-line backdrop-blur transition-transform hover:scale-105"
          >
            <Shay size={48} mood={mood} />
          </button>
        </div>
      )}

      {open && (
        <div className="shay-pop fixed inset-0 z-[70] flex flex-col bg-white md:inset-auto md:bottom-6 md:right-6 md:h-[660px] md:max-h-[calc(100vh-48px)] md:w-[410px] md:overflow-hidden md:rounded-[30px] md:shadow-[0_28px_80px_rgb(0_0_0/0.24)] md:ring-1 md:ring-line" role="dialog" aria-label="Chat with Shay">
          <div className="relative overflow-hidden bg-[linear-gradient(135deg,#0f4a38,#145c46_55%,#1d7a5c)] px-4 pb-4 pt-3 text-white">
            <div className="absolute -right-10 -top-12 h-40 w-40 rounded-full bg-[#6ee7b7]/20 blur-2xl" />
            <div className="relative flex items-center gap-3">
              <Shay size={46} mood={busy ? "talking" : "happy"} />
              <div className="min-w-0 flex-1">
                <p className="text-[17px] font-bold leading-tight">Shay</p>
                <p className="flex items-center gap-1.5 text-[12px] text-white/80">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#6ee7b7] shadow-[0_0_8px_#6ee7b7]" />
                  {ai ? "Online · any language" : "Guided search · team on WhatsApp"}
                </p>
              </div>
              <a href={wa} target="_blank" rel="noopener noreferrer" aria-label="WhatsApp the team" title="WhatsApp the team" className="flex h-9 w-9 items-center justify-center rounded-full bg-white/12 hover:bg-white/20">
                <Icon name="whatsapp" size={17} />
              </a>
              <a href={`tel:+${BRAND.whatsapp}`} aria-label="Call the team" title="Call the team" className="flex h-9 w-9 items-center justify-center rounded-full bg-white/12 hover:bg-white/20">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2" />
                </svg>
              </a>
              <button onClick={() => setOpen(false)} aria-label="Close chat" className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-white/12">
                <Icon name="close" size={18} />
              </button>
            </div>
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto bg-surface/60 px-4 py-4">
            {ai && (
              <div className="flex items-end gap-2">
                <Shay size={28} glow={false} />
                <div className="max-w-[86%] rounded-[18px] rounded-bl-[6px] bg-white px-3.5 py-2.5 text-[14px] leading-relaxed text-ink shadow-sm">
                  Hi! I’m Shay ✨ Tell me where you’d like to live and your monthly budget. I’ll find places that fit, in any language.
                </div>
              </div>
            )}
            {msgs.map((m, i) =>
              m.role === "user" ? (
                <div key={i} className="flex justify-end">
                  <div className="max-w-[86%] whitespace-pre-wrap rounded-[18px] rounded-br-[6px] bg-brand px-3.5 py-2.5 text-[14px] leading-relaxed text-white" dir="auto">
                    {m.text}
                  </div>
                </div>
              ) : (
                <div key={i} className="flex items-end gap-2">
                  <Shay size={28} glow={false} />
                  <div className="min-w-0 max-w-[86%]">
                    <div className="whitespace-pre-wrap rounded-[18px] rounded-bl-[6px] bg-white px-3.5 py-2.5 text-[14px] leading-relaxed text-ink shadow-sm" dir="auto">
                      <Text text={m.text} />
                    </div>
                    {!!m.cards?.length && <Cards cards={m.cards} />}
                    {!!m.chips?.length && (
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {m.chips.map((c) => (
                          <button key={c.value} onClick={() => onChip(c.label, c.value)} className="rounded-full border border-brand/30 bg-white px-3 py-1.5 text-[13px] font-semibold text-brand hover:bg-mint">
                            {c.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ),
            )}
            {busy && (
              <div className="flex items-end gap-2">
                <Shay size={28} mood="thinking" glow={false} />
                <div className="flex gap-1 rounded-[18px] rounded-bl-[6px] bg-white px-4 py-3.5 shadow-sm">
                  {[0, 1, 2].map((d) => (
                    <span key={d} className="shay-dot h-2 w-2 rounded-full bg-brand" style={{ animationDelay: `${d * 0.15}s` }} />
                  ))}
                </div>
              </div>
            )}
            {ai && !msgs.length && (
              <div className="flex flex-wrap gap-2 pt-1">
                {STARTERS.map((s) => (
                  <button key={s} onClick={() => sendAi(s)} dir="auto" className="rounded-full border border-line bg-white px-3 py-1.5 text-[12.5px] font-medium text-ink-2 hover:border-brand hover:text-brand">
                    {s}
                  </button>
                ))}
                <button
                  onClick={async () => {
                    const loc = await askLocation();
                    void sendAi(loc ? "Show me places near me" : "Show me popular places");
                  }}
                  className="rounded-full border border-brand/30 bg-mint px-3 py-1.5 text-[12.5px] font-semibold text-brand"
                >
                  📍 Places near me
                </button>
              </div>
            )}
            <div ref={end} />
          </div>

          {ai ? (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const t = input;
                setInput("");
                void sendAi(t);
              }}
              className="flex items-center gap-2 border-t border-line bg-white p-3"
            >
              <input
                className="h-11 flex-1 rounded-full border border-line px-4 text-[14.5px] focus:border-brand focus:outline-none"
                placeholder="Message Shay…"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                dir="auto"
                maxLength={2000}
                aria-label="Message"
              />
              <button type="submit" disabled={!input.trim() || busy} aria-label="Send" className="flex h-11 w-11 items-center justify-center rounded-full bg-brand text-white disabled:opacity-40">
                <Icon name="arrow-right" size={18} />
              </button>
            </form>
          ) : (
            <div className="flex gap-2 border-t border-line bg-white p-3">
              <a href={wa} target="_blank" rel="noopener noreferrer" className="flex h-11 flex-1 items-center justify-center gap-2 rounded-full bg-whatsapp text-[14px] font-semibold text-white">
                <Icon name="whatsapp" size={16} /> WhatsApp the team
              </a>
              <a href="/find" className="flex h-11 flex-1 items-center justify-center rounded-full border border-line text-[14px] font-semibold">
                Find me a room
              </a>
            </div>
          )}
        </div>
      )}
    </>
  );
}
