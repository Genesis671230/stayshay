"use client";

import { useState } from "react";
import { AREAS, AREA_BY_SLUG, FAMILY_HOMES, FAMILY_HOME_LABEL, leadMessage, validateLead, type FamilyHome } from "@stayshay/core/src/client.ts";
import { stayshayWhatsapp } from "@/lib/contact";
import { track } from "./analytics";

const field = "w-full rounded-[12px] border border-line bg-white px-3.5 py-3 text-[15px] focus:border-brand focus:outline-none";
const chip = (on: boolean) => `h-10 rounded-full border px-4 text-[14px] font-medium transition ${on ? "border-brand bg-brand text-white" : "border-line bg-white hover:border-brand"}`;
const BUDGETS = [2500, 3500, 4500, 6000, 8000, 10000, 13000, 16000, 20000, 30000];
const SHORT: Record<FamilyHome, string> = { sharing: "Family sharing", studio: "Studio", "1bhk": "1BHK", "2bhk": "2BHK", "3bhk": "3BHK", "4bhk": "4BHK / villa" };

function inDays(n: number) {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}

/**
 * Family / apartment request. Stayshay's live catalogue is shared housing, so family homes are a concierge: the
 * request lands in /admin + Telegram instantly and the family gets a WhatsApp thread with their brief typed out.
 */
export function FamilyForm({ home: initialHome = "2bhk", area, metro: initialMetro = false, from: initialFrom = "", heading = "Get 5 real options on WhatsApp", id = "request" }: { home?: FamilyHome; area?: string; metro?: boolean; from?: string; heading?: string; id?: string }) {
  const [home, setHome] = useState<FamilyHome>(initialHome);
  const [areas, setAreas] = useState<string[]>(area && AREA_BY_SLUG.has(area) ? [area] : []);
  const [budget, setBudget] = useState(initialHome === "3bhk" ? 13000 : initialHome === "1bhk" ? 6000 : initialHome === "sharing" || initialHome === "studio" ? 3500 : 8000);
  const [metro, setMetro] = useState(initialMetro);
  const [furnished, setFurnished] = useState(false);
  const [adults, setAdults] = useState(2);
  const [kids, setKids] = useState(1);
  const [moveIn, setMoveIn] = useState(inDays(30));
  const [from, setFrom] = useState(initialFrom);
  const [note, setNote] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState<string | null>(null);

  const areaName = (s: string) => AREA_BY_SLUG.get(s)?.name ?? s;
  const toggleArea = (s: string) => setAreas((a) => (a.includes(s) ? a.filter((x) => x !== s) : [...a, s].slice(-5)));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const check = validateLead({ kind: "family", home, budget, areaSlugs: areas, metro, furnished, moveIn, adults, kids, from, note, name, phone });
    setErrors(check.errors);
    if (!check.ok || !check.value) return;
    setBusy(true);
    track("generate_lead", { method: "family_home", home, budget });
    await fetch("/api/lead", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ ...check.value, page: location.pathname }) }).catch(() => null);
    setBusy(false);
    setSent(leadMessage(check.value, areaName));
  };

  if (sent)
    return (
      <div id={id} className="not-prose scroll-mt-24 rounded-[22px] bg-mint p-6 md:p-8">
        <p className="text-[20px] font-bold text-ink">Got it, {name.split(" ")[0]}. Your brief is with our team.</p>
        <p className="mt-2 text-[15px] text-ink-2">Tap below to open WhatsApp with your brief typed out. We reply with real options, prices and viewing times, usually the same day.</p>
        <a href={stayshayWhatsapp(sent)} target="_blank" rel="noopener noreferrer" onClick={() => track("whatsapp_click", { method: "family_home" })} className="mt-5 inline-flex h-12 items-center rounded-[12px] bg-brand px-6 text-[15px] font-semibold text-white hover:bg-brand-deep">
          Open WhatsApp
        </a>
      </div>
    );

  const err = (k: string) => errors[k] && <p className="mt-1 text-[13px] text-[#b42318]">{errors[k]}</p>;
  return (
    <form id={id} onSubmit={submit} className="not-prose scroll-mt-24 rounded-[22px] border border-line bg-white p-5 shadow-[0_8px_30px_rgb(0_0_0/0.05)] md:p-7">
      <p className="font-display text-[24px] leading-tight text-ink">{heading}</p>
      <p className="mt-1 text-[14px] text-ink-2">Free for families. No broker fee from Stayshay. We only share your number with owners you agree to.</p>

      <fieldset className="mt-5">
        <legend className="text-[13px] font-semibold uppercase tracking-wide text-muted">Home</legend>
        <div className="mt-2 flex flex-wrap gap-2">
          {FAMILY_HOMES.map((h) => (
            <button type="button" key={h} title={FAMILY_HOME_LABEL[h]} onClick={() => setHome(h)} className={chip(home === h)}>
              {SHORT[h]}
            </button>
          ))}
        </div>
        {err("home")}
      </fieldset>

      <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="text-[13px] font-semibold uppercase tracking-wide text-muted">Monthly budget</span>
          <select className={`${field} mt-2`} value={budget} onChange={(e) => setBudget(Number(e.target.value))}>
            {BUDGETS.map((b) => (
              <option key={b} value={b}>
                Up to AED {b.toLocaleString("en-US")} / month
              </option>
            ))}
          </select>
          {err("budget")}
        </label>
        <label className="block">
          <span className="text-[13px] font-semibold uppercase tracking-wide text-muted">Move-in</span>
          <input type="date" className={`${field} mt-2`} value={moveIn} min={inDays(0)} onChange={(e) => setMoveIn(e.target.value)} />
          {err("moveIn")}
        </label>
      </div>

      <fieldset className="mt-5">
        <legend className="text-[13px] font-semibold uppercase tracking-wide text-muted">Areas (pick up to 5, or leave open)</legend>
        <div className="mt-2 flex flex-wrap gap-2">
          {areas.map((s) => (
            <button type="button" key={s} onClick={() => toggleArea(s)} className={chip(true)}>
              {areaName(s)} ×
            </button>
          ))}
          <select className="h-10 rounded-full border border-line bg-white px-3 text-[14px]" value="" onChange={(e) => e.target.value && toggleArea(e.target.value)} aria-label="Add an area">
            <option value="">+ Add area</option>
            {AREAS.filter((a) => !areas.includes(a.slug)).map((a) => (
              <option key={a.slug} value={a.slug}>
                {a.name}, {a.emirate}
              </option>
            ))}
          </select>
        </div>
      </fieldset>

      <div className="mt-5 flex flex-wrap gap-2">
        <button type="button" onClick={() => setMetro(!metro)} className={chip(metro)}>Walk to metro</button>
        <button type="button" onClick={() => setFurnished(!furnished)} className={chip(furnished)}>Furnished</button>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <label className="block">
          <span className="text-[13px] font-semibold uppercase tracking-wide text-muted">Adults</span>
          <input type="number" min={1} max={12} className={`${field} mt-2`} value={adults} onChange={(e) => setAdults(Number(e.target.value))} />
          {err("adults")}
        </label>
        <label className="block">
          <span className="text-[13px] font-semibold uppercase tracking-wide text-muted">Children</span>
          <input type="number" min={0} max={12} className={`${field} mt-2`} value={kids} onChange={(e) => setKids(Number(e.target.value))} />
          {err("kids")}
        </label>
        <label className="col-span-2 block">
          <span className="text-[13px] font-semibold uppercase tracking-wide text-muted">Moving from</span>
          <input className={`${field} mt-2`} value={from} onChange={(e) => setFrom(e.target.value)} placeholder="e.g. London, Abu Dhabi, already in Dubai" maxLength={60} />
        </label>
      </div>

      <label className="mt-5 block">
        <span className="text-[13px] font-semibold uppercase tracking-wide text-muted">Anything else (optional)</span>
        <input className={`${field} mt-2`} value={note} onChange={(e) => setNote(e.target.value)} placeholder="School nearby, work in Business Bay, 12 cheques, parking…" maxLength={400} />
      </label>

      <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="text-[13px] font-semibold uppercase tracking-wide text-muted">Your name</span>
          <input className={`${field} mt-2`} value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" />
          {err("name")}
        </label>
        <label className="block">
          <span className="text-[13px] font-semibold uppercase tracking-wide text-muted">WhatsApp number</span>
          <input className={`${field} mt-2`} value={phone} onChange={(e) => setPhone(e.target.value)} inputMode="tel" autoComplete="tel" placeholder="+971 or your home number" />
          {err("phone")}
        </label>
      </div>

      <button disabled={busy} className="mt-6 inline-flex h-12 w-full items-center justify-center rounded-[12px] bg-brand px-6 text-[15.5px] font-semibold text-white hover:bg-brand-deep disabled:opacity-60 sm:w-auto">
        {busy ? "Sending…" : "Send my brief"}
      </button>
    </form>
  );
}
