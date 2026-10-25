"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { BRAND } from "@stayshay/core";
import { Shay } from "./shay";
import { Icon } from "./ui";

type Msg = { role: "user" | "assistant"; text: string };

const KEY = "stayshay:chat";
const STARTERS = ["Bed space under AED 1,000 in Karama", "Female partition near the metro", "I need a roommate", "مرحبا، أبحث عن غرفة قريبة من المترو", "Kailangan ko ng bed space sa Deira"];
const field = "w-full rounded-[12px] border border-line bg-white px-3.5 py-2.5 text-[14px] focus:border-brand focus:outline-none";

/** Turns plain URLs in Shay's replies into links (listing links get a compact label). */
function Linkified({ text }: { text: string }) {
  const parts = text.split(/(https?:\/\/[^\s)]+)/g);
  return (
    <>
      {parts.map((p, i) =>
        /^https?:\/\//.test(p) ? (
          <a key={i} href={p.replace(/^https:\/\/stayshay\.com/, "")} className="font-semibold text-brand underline underline-offset-2" target={p.includes("stayshay.com") ? undefined : "_blank"} rel="noopener noreferrer">
            {/\/listing\/([a-z0-9]+)/i.test(p) ? `View ${p.match(/\/listing\/([a-z0-9]+)/i)![1].toUpperCase()} →` : p.replace(/^https?:\/\//, "")}
          </a>
        ) : (
          <span key={i}>{p}</span>
        ),
      )}
    </>
  );
}

export function ShayChat() {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  const [hello, setHello] = useState(false);
  const [enabled, setEnabled] = useState<boolean | null>(null);
  const [chatId, setChatId] = useState<string | null>(null);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [intro, setIntro] = useState(true);
  const [contact, setContact] = useState({ name: "", phone: "", email: "" });
  const [signedIn, setSignedIn] = useState(false);
  const end = useRef<HTMLDivElement>(null);

  // Restore an earlier conversation and the signed-in user's details.
  useEffect(() => {
    let id: string | null = null;
    try {
      id = localStorage.getItem(KEY);
    } catch {}
    fetch(`/api/agent${id ? `?id=${id}` : ""}`)
      .then((r) => r.json())
      .then((j) => {
        setEnabled(!!j.enabled);
        if (j.chat) {
          setChatId(j.chat.id);
          setMsgs(j.chat.transcript.map((t: Msg) => ({ role: t.role, text: t.text })));
          if (j.chat.transcript.length || j.chat.contact?.phone) setIntro(false);
        }
      })
      .catch(() => setEnabled(false));
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((j) => {
        if (j.user) {
          setSignedIn(true);
          setContact({ name: j.user.name ?? "", phone: j.user.phone ? `+${j.user.phone}` : "", email: j.user.email ?? "" });
          if (j.user.phone) setIntro(false);
        }
      })
      .catch(() => {});
    const t = setTimeout(() => {
      try {
        if (!sessionStorage.getItem("stayshay:hello")) setHello(true);
      } catch {
        setHello(true);
      }
    }, 3500);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => end.current?.scrollIntoView({ behavior: "smooth" }), [msgs, busy, open]);

  if (path?.startsWith("/admin")) return null;

  const remember = (id: string) => {
    setChatId(id);
    try {
      localStorage.setItem(KEY, id);
    } catch {}
  };

  const send = async (text: string) => {
    const message = text.trim();
    if (!message || busy) return;
    setInput("");
    setMsgs((m) => [...m, { role: "user", text: message }]);
    setBusy(true);
    try {
      const res = await fetch("/api/agent", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ chatId, message }) });
      const j = await res.json();
      if (j.chatId) remember(j.chatId);
      const fallback = res.status === 429 ? "You're typing faster than I can think! Give me a minute 🙂" : `I'm having trouble right now. You can always WhatsApp the team: ${BRAND.whatsappDisplay}`;
      setMsgs((m) => [...m, { role: "assistant", text: j.reply ?? fallback }]);
    } catch {
      setMsgs((m) => [...m, { role: "assistant", text: `I couldn't connect. WhatsApp the team on ${BRAND.whatsappDisplay}.` }]);
    } finally {
      setBusy(false);
    }
  };

  const startChat = async (skip: boolean) => {
    setIntro(false);
    if (skip || !(contact.name || contact.phone || contact.email)) return;
    const res = await fetch("/api/agent", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ chatId, contact }) }).catch(() => null);
    const j = await res?.json().catch(() => null);
    if (j?.chatId) remember(j.chatId);
  };

  const first = contact.name.trim().split(/\s+/)[0];

  return (
    <>
      {!open && (
        <div className={`fixed right-4 z-[60] flex items-end gap-2 md:bottom-6 md:right-6 ${/^\/(listing|find|list)\b/.test(path ?? "") ? "bottom-24 lg:bottom-6" : "bottom-4"}`}>
          {hello && (
            <button
              onClick={() => {
                setOpen(true);
                setHello(false);
              }}
              className="shay-pop mb-3 max-w-[220px] rounded-[18px] rounded-br-[6px] bg-white px-4 py-3 text-left text-[13.5px] leading-snug text-ink shadow-[0_10px_30px_rgb(0_0_0/0.14)]"
            >
              <span className="font-bold">Hi, I’m Shay!</span> Want help finding a place? I speak your language.
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
            className="flex h-[72px] w-[72px] items-center justify-center rounded-full bg-white shadow-[0_10px_30px_rgb(20_92_70/0.28)] ring-1 ring-line transition-transform hover:scale-105"
          >
            <Shay size={52} waving={hello} />
          </button>
        </div>
      )}

      {open && (
        <div className="shay-pop fixed inset-0 z-[70] flex flex-col bg-white md:inset-auto md:bottom-6 md:right-6 md:h-[640px] md:max-h-[calc(100vh-48px)] md:w-[400px] md:overflow-hidden md:rounded-[28px] md:shadow-[0_24px_70px_rgb(0_0_0/0.22)] md:ring-1 md:ring-line" role="dialog" aria-label="Chat with Shay">
          <div className="flex items-center gap-3 bg-brand px-4 py-3 text-white">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white">
              <Shay size={38} talking={busy} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[16px] font-bold leading-tight">Shay</p>
              <p className="text-[12px] text-white/75">Stayshay assistant · speaks your language</p>
            </div>
            <button onClick={() => setOpen(false)} aria-label="Close chat" className="rounded-full p-2 hover:bg-white/10">
              <Icon name="close" size={18} />
            </button>
          </div>

          {enabled === false ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center">
              <Shay size={110} />
              <p className="text-[17px] font-bold">Shay is taking a short break</p>
              <p className="text-[14px] text-muted">Our team answers on WhatsApp right away.</p>
              <a href={`https://wa.me/${BRAND.whatsapp}?text=${encodeURIComponent("Hi Stayshay, I need help finding a place.")}`} target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex h-11 items-center gap-2 rounded-full bg-whatsapp px-5 text-[14.5px] font-semibold text-white">
                <Icon name="whatsapp" size={17} /> WhatsApp {BRAND.whatsappDisplay}
              </a>
            </div>
          ) : (
            <>
              <div className="flex-1 space-y-3 overflow-y-auto bg-surface/60 px-4 py-4">
                <div className="flex items-end gap-2">
                  <div className="shrink-0">
                    <Shay size={30} />
                  </div>
                  <div className="max-w-[85%] rounded-[18px] rounded-bl-[6px] bg-white px-3.5 py-2.5 text-[14px] leading-relaxed text-ink shadow-sm">
                    {first ? `Hi ${first}! ` : "Hi! "}I’m Shay. Tell me where you want to live, your budget and when you’ll move, and I’ll find places that fit. Write in any language you like.
                  </div>
                </div>

                {intro && !msgs.length && (
                  <div className="shay-pop rounded-[20px] border border-line bg-white p-4">
                    <p className="text-[14px] font-bold">So the team can send you matches</p>
                    <p className="mt-0.5 text-[12.5px] text-muted">Optional. We never share your number publicly.</p>
                    <div className="mt-3 space-y-2">
                      <input className={field} placeholder="Your name" value={contact.name} onChange={(e) => setContact({ ...contact, name: e.target.value })} autoComplete="name" />
                      <input className={field} placeholder="WhatsApp number" type="tel" inputMode="tel" value={contact.phone} onChange={(e) => setContact({ ...contact, phone: e.target.value })} autoComplete="tel" />
                      <input className={field} placeholder="Email (optional)" type="email" value={contact.email} onChange={(e) => setContact({ ...contact, email: e.target.value })} autoComplete="email" />
                    </div>
                    <div className="mt-3 flex gap-2">
                      <button onClick={() => startChat(false)} className="h-10 flex-1 rounded-full bg-brand text-[14px] font-semibold text-white">
                        Start chatting
                      </button>
                      <button onClick={() => startChat(true)} className="h-10 rounded-full px-4 text-[13.5px] text-muted">
                        Skip
                      </button>
                    </div>
                    {!signedIn && (
                      <a href="/login" className="mt-2 block text-center text-[12.5px] font-semibold text-brand underline">
                        Or sign in with Google
                      </a>
                    )}
                  </div>
                )}

                {msgs.map((m, i) =>
                  m.role === "user" ? (
                    <div key={i} className="flex justify-end">
                      <div className="max-w-[85%] whitespace-pre-wrap rounded-[18px] rounded-br-[6px] bg-brand px-3.5 py-2.5 text-[14px] leading-relaxed text-white">{m.text}</div>
                    </div>
                  ) : (
                    <div key={i} className="flex items-end gap-2">
                      <div className="shrink-0">
                        <Shay size={30} />
                      </div>
                      <div className="max-w-[85%] whitespace-pre-wrap rounded-[18px] rounded-bl-[6px] bg-white px-3.5 py-2.5 text-[14px] leading-relaxed text-ink shadow-sm" dir="auto">
                        <Linkified text={m.text} />
                      </div>
                    </div>
                  ),
                )}
                {busy && (
                  <div className="flex items-end gap-2">
                    <div className="shrink-0">
                      <Shay size={30} talking />
                    </div>
                    <div className="flex gap-1 rounded-[18px] rounded-bl-[6px] bg-white px-4 py-3.5 shadow-sm">
                      {[0, 1, 2].map((d) => (
                        <span key={d} className="shay-dot h-2 w-2 rounded-full bg-brand" style={{ animationDelay: `${d * 0.15}s` }} />
                      ))}
                    </div>
                  </div>
                )}
                {!intro && !msgs.length && (
                  <div className="flex flex-wrap gap-2 pt-1">
                    {STARTERS.map((s) => (
                      <button key={s} onClick={() => send(s)} dir="auto" className="rounded-full border border-line bg-white px-3 py-1.5 text-[12.5px] font-medium text-ink-2 hover:border-brand hover:text-brand">
                        {s}
                      </button>
                    ))}
                  </div>
                )}
                <div ref={end} />
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  send(input);
                }}
                className="flex items-center gap-2 border-t border-line bg-white p-3"
              >
                <input
                  className="h-11 flex-1 rounded-full border border-line px-4 text-[14.5px] focus:border-brand focus:outline-none"
                  placeholder={intro && !msgs.length ? "Or just start typing…" : "Message Shay…"}
                  value={input}
                  onChange={(e) => {
                    setInput(e.target.value);
                    if (intro) setIntro(false);
                  }}
                  dir="auto"
                  maxLength={2000}
                  aria-label="Message"
                />
                <button type="submit" disabled={!input.trim() || busy} aria-label="Send" className="flex h-11 w-11 items-center justify-center rounded-full bg-brand text-white disabled:opacity-40">
                  <Icon name="arrow-right" size={18} />
                </button>
              </form>
            </>
          )}
        </div>
      )}
    </>
  );
}
