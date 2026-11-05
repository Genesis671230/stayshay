"use client";

import { useState } from "react";
import { track } from "./analytics";

const field = "w-full rounded-[12px] border border-line bg-white px-3.5 py-2.5 text-[14.5px] text-ink focus:border-brand focus:outline-none";

/**
 * "Did this help?" stars that open into a short testimonial. Sits inside each tool's result, so every review is
 * tied to the tool the person actually used. Submissions are held for approval before they show anywhere.
 */
export function ReviewPrompt({ tool, question = "Did this help you?", dark = false }: { tool: string; question?: string; dark?: boolean }) {
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [text, setText] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [phone, setPhone] = useState("");
  const [hp, setHp] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [state, setState] = useState<"idle" | "busy" | "done">("idle");

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    setState("busy");
    const r = await fetch("/api/reviews", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ tool, rating, text, name, role, phone, website: hp }) }).catch(() => null);
    const j = (await r?.json().catch(() => null)) as { ok?: boolean; errors?: Record<string, string> } | null;
    if (j?.ok) {
      setState("done");
      track("review_submit", { tool, rating });
    } else {
      setErrors(j?.errors ?? { text: r?.status === 429 ? "Thanks, we already have your review." : "Couldn't send, try again." });
      setState("idle");
    }
  };

  const tone = dark ? "text-white" : "text-ink";
  if (state === "done")
    return <p className={`not-prose rounded-[16px] ${dark ? "bg-white/10 text-white" : "bg-mint text-ink"} px-4 py-3 text-[14.5px] font-medium`}>Thank you! Your review will appear once our team has checked it.</p>;

  return (
    <form onSubmit={send} className={`not-prose rounded-[18px] ${dark ? "border border-white/15 bg-white/[0.06]" : "border border-line bg-white"} p-4`}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className={`text-[14.5px] font-semibold ${tone}`}>{question}</p>
        <div className="flex" onMouseLeave={() => setHover(0)} role="radiogroup" aria-label="Rating">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              type="button"
              key={n}
              role="radio"
              aria-checked={rating === n}
              aria-label={`${n} star${n > 1 ? "s" : ""}`}
              onMouseEnter={() => setHover(n)}
              onClick={() => {
                setRating(n);
                track("review_stars", { tool, rating: n });
              }}
              className={`px-0.5 text-[26px] leading-none transition ${(hover || rating) >= n ? "text-[#f5b301]" : dark ? "text-white/25" : "text-line"}`}
            >
              ★
            </button>
          ))}
        </div>
      </div>
      {rating > 0 && (
        <div className="mt-3 space-y-2.5">
          <textarea className={`${field} min-h-[76px]`} value={text} onChange={(e) => setText(e.target.value)} maxLength={600} placeholder={rating >= 4 ? "What did it help you with? Others will read this." : "What should we do better?"} />
          {errors.text && <p className="text-[13px] text-[#e5484d]">{errors.text}</p>}
          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
            <input className={field} value={name} onChange={(e) => setName(e.target.value)} placeholder="First name" maxLength={40} autoComplete="given-name" />
            <input className={field} value={role} onChange={(e) => setRole(e.target.value)} placeholder="e.g. Moved to Karama, family from London" maxLength={60} />
          </div>
          {errors.name && <p className="text-[13px] text-[#e5484d]">{errors.name}</p>}
          <input className={field} value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="WhatsApp (optional, private, only to confirm you're real)" inputMode="tel" maxLength={20} />
          <input className="hidden" tabIndex={-1} autoComplete="off" value={hp} onChange={(e) => setHp(e.target.value)} aria-hidden />
          <button disabled={state === "busy"} className="h-11 rounded-[12px] bg-brand px-5 text-[14.5px] font-semibold text-white hover:bg-brand-deep disabled:opacity-60">
            {state === "busy" ? "Sending…" : "Share my review"}
          </button>
        </div>
      )}
    </form>
  );
}
