"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  AREAS,
  AREA_BY_SLUG,
  TYPE_LABEL,
  TYPE_LABEL_PLURAL,
  VERDICT_TEXT,
  parseListingMessage,
  rankDeals,
  rentBudget,
  rentVerdict,
  typicalRent,
  moveInCost,
  type Area,
  type Listing,
  type ListingType,
} from "@stayshay/core/src/client.ts";
import { useMarketplace } from "./marketplace";
import { ListingCard } from "./listing-card";
import { AreaCombobox } from "./search-bar";
import { track } from "./analytics";
import { stayshayWhatsapp } from "@/lib/contact";
import { ReviewPrompt } from "./review-prompt";

const TYPES: ListingType[] = ["bed_space", "partition", "room", "studio"];
const aed = (n: number) => `AED ${Math.round(n).toLocaleString("en-US")}`;
const areaName = (l: Listing) => AREA_BY_SLUG.get(l.areaSlug)?.name ?? l.areaName ?? "";
const pill = (on: boolean) => `h-9 shrink-0 rounded-[12px] border px-3.5 text-[13.5px] font-semibold ${on ? "border-brand bg-brand text-white" : "border-line bg-white text-ink-2"}`;

/* ---------- local streak + counters (per device) ---------- */

function useStreak() {
  const [streak, setStreak] = useState(1);
  useEffect(() => {
    try {
      const today = new Date().toISOString().slice(0, 10);
      const raw = JSON.parse(localStorage.getItem("stayshay:streak") ?? "{}") as { last?: string; n?: number };
      const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
      const n = raw.last === today ? (raw.n ?? 1) : raw.last === yesterday ? (raw.n ?? 0) + 1 : 1;
      localStorage.setItem("stayshay:streak", JSON.stringify({ last: today, n }));
      setStreak(n);
    } catch {
      /* storage blocked */
    }
  }, []);
  return streak;
}

/* ---------- Room Swipe ---------- */

export function RoomSwipe() {
  const { all, saved, toggleSaved } = useMarketplace();
  const [type, setType] = useState<ListingType | "all">("all");
  const [max, setMax] = useState<number>(0);
  const [i, setI] = useState(0);
  const [seen, setSeen] = useState(0);
  const [drag, setDrag] = useState(0);
  const [leaving, setLeaving] = useState<"left" | "right" | null>(null);
  const start = useRef<number | null>(null);
  const streak = useStreak();

  const deck = useMemo(() => {
    const pool = all.filter((l) => l.photos.length && l.type !== "roommate" && (type === "all" || l.type === type) && (!max || l.priceAed <= max));
    return rankDeals(pool, 500);
  }, [all, type, max]);

  useEffect(() => setI(0), [type, max]);

  const cur = deck[i];
  const next = deck[i + 1];
  const savedHere = deck.filter((d) => saved.has(d.listing.id));

  const decide = (dir: "left" | "right") => {
    if (!cur || leaving) return;
    if (dir === "right" && !saved.has(cur.listing.id)) toggleSaved(cur.listing.id);
    track(dir === "right" ? "swipe_save" : "swipe_skip", { listing_id: cur.listing.id });
    setLeaving(dir);
    setTimeout(() => {
      setLeaving(null);
      setDrag(0);
      setI((x) => x + 1);
      setSeen((x) => x + 1);
    }, 220);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") decide("right");
      if (e.key === "ArrowLeft") decide("left");
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const x = leaving === "right" ? 520 : leaving === "left" ? -520 : drag;
  const waText = `Hi Stayshay, I saved these on Room Swipe and would like to view them:\n${savedHere
    .slice(0, 10)
    .map((d) => `${d.listing.id} · ${TYPE_LABEL[d.listing.type]} · ${areaName(d.listing)} · ${aed(d.listing.priceAed)}`)
    .join("\n")}`;

  return (
    <div className="mx-auto max-w-[520px] px-4 pb-16">
      <div className="flex items-center justify-between gap-2 pt-4 text-[13px] text-muted">
        <span>
          Seen <b className="text-ink">{seen}</b> · Saved <b className="text-ink">{savedHere.length}</b>
        </span>
        <span className="chip">
          {streak} day{streak === 1 ? "" : "s"} streak
        </span>
      </div>
      <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
        <button className={pill(type === "all")} onClick={() => setType("all")}>
          All
        </button>
        {TYPES.map((t) => (
          <button key={t} className={pill(type === t)} onClick={() => setType(t)}>
            {TYPE_LABEL[t]}
          </button>
        ))}
      </div>
      <div className="mt-2 flex gap-2 overflow-x-auto pb-1">
        {[0, 800, 1200, 2000, 4000].map((m) => (
          <button key={m} className={pill(max === m)} onClick={() => setMax(m)}>
            {m ? `Under ${m.toLocaleString("en-US")}` : "Any budget"}
          </button>
        ))}
      </div>

      <div className="relative mt-4 h-[520px] select-none">
        {next && (
          <div className="absolute inset-0 scale-[0.96] overflow-hidden rounded-[28px] bg-surface opacity-70">
            <Image src={next.listing.photos[0]} alt="" fill sizes="520px" className="object-cover" />
          </div>
        )}
        {cur ? (
          <div
            className="absolute inset-0 cursor-grab touch-pan-y overflow-hidden rounded-[28px] bg-brand-deep text-white active:cursor-grabbing"
            style={{ transform: `translateX(${x}px) rotate(${x / 22}deg)`, transition: start.current != null ? "none" : "transform .22s ease-out" }}
            onPointerDown={(e) => {
              start.current = e.clientX;
              (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
            }}
            onPointerMove={(e) => start.current != null && setDrag(e.clientX - start.current)}
            onPointerUp={() => {
              const d = drag;
              start.current = null;
              if (d > 90) decide("right");
              else if (d < -90) decide("left");
              else setDrag(0);
            }}
          >
            <Image src={cur.listing.photos[0]} alt={cur.listing.title} fill priority sizes="520px" className="pointer-events-none object-cover" />
            <div className="absolute inset-0 bg-[linear-gradient(180deg,rgb(0_0_0/0)_35%,rgb(9_29_21/0.92)_100%)]" />
            {x > 40 && <span className="absolute left-5 top-5 rounded-[10px] border-2 border-[#d3f0b9] px-3 py-1 text-[15px] font-bold text-[#d3f0b9]">SAVE</span>}
            {x < -40 && <span className="absolute right-5 top-5 rounded-[10px] border-2 border-white/80 px-3 py-1 text-[15px] font-bold">SKIP</span>}
            <div className="absolute inset-x-0 bottom-0 p-5">
              {cur.typicalAed > cur.listing.priceAed && <span className="rounded-full bg-[#d3f0b9] px-2.5 py-1 text-[12px] font-bold text-[#0f3426]">{aed(cur.typicalAed - cur.listing.priceAed)} below typical</span>}
              <p className="font-figure mt-3 text-[34px] font-bold leading-none">
                {aed(cur.listing.priceAed)}
                <span className="text-[14px] font-medium text-white/70"> /month</span>
              </p>
              <p className="mt-1.5 text-[15px] font-semibold">
                {TYPE_LABEL[cur.listing.type]} · {areaName(cur.listing)}
              </p>
              <p className="mt-0.5 line-clamp-1 text-[13px] text-white/70">{cur.listing.title}</p>
              {!!cur.reasons.length && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {cur.reasons.slice(0, 3).map((r) => (
                    <span key={r} className="rounded-full bg-white/12 px-2.5 py-1 text-[12px]">
                      {r}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="card absolute inset-0 flex flex-col items-center justify-center p-8 text-center">
            <p className="font-display text-[26px]">You've seen them all</p>
            <p className="mt-2 text-[14.5px] text-muted">{savedHere.length ? `You saved ${savedHere.length}. Send them to Stayshay and we'll set up the viewings.` : "Try another type or budget."}</p>
            <button onClick={() => setI(0)} className="mt-5 h-11 rounded-[12px] border border-line px-5 text-[14px] font-semibold">
              Start again
            </button>
          </div>
        )}
      </div>

      <div className="mt-5 grid grid-cols-3 gap-2">
        <button onClick={() => decide("left")} disabled={!cur} className="h-13 rounded-[14px] border border-line bg-white py-3.5 text-[15px] font-semibold disabled:opacity-40">
          Skip
        </button>
        {cur ? (
          <Link href={`/listing/${cur.listing.id.toLowerCase()}`} className="flex items-center justify-center rounded-[14px] border border-line bg-white text-[15px] font-semibold">
            Details
          </Link>
        ) : (
          <span />
        )}
        <button onClick={() => decide("right")} disabled={!cur} className="h-13 rounded-[14px] bg-brand py-3.5 text-[15px] font-semibold text-white disabled:opacity-40">
          Save
        </button>
      </div>
      <p className="mt-3 text-center text-[12.5px] text-muted">Swipe, or use the arrow keys.</p>

      {savedHere.length > 0 && (
        <div className="glow-panel mt-6 rounded-[22px] p-5 text-white">
          <p className="text-[16px] font-bold">
            {savedHere.length} saved {savedHere.length === 1 ? "place" : "places"}
          </p>
          <p className="mt-1 text-[13.5px] text-white/75">Send your list and we'll arrange the viewings, free.</p>
          <a href={stayshayWhatsapp(waText)} target="_blank" rel="noopener noreferrer" className="mt-4 flex h-11 items-center justify-center rounded-[12px] bg-[#d3f0b9] text-[14.5px] font-bold text-[#0f3426]">
            Book viewings on WhatsApp
          </a>
        </div>
      )}
    </div>
  );
}

/* ---------- Is my rent fair? ---------- */

export function FairRent() {
  const { all } = useMarketplace();
  const [type, setType] = useState<ListingType>("bed_space");
  const [area, setArea] = useState<Area | null>(null);
  const [price, setPrice] = useState("");
  const [paste, setPaste] = useState("");
  const [shown, setShown] = useState(false);

  const p = Number(price.replace(/\D/g, ""));
  const typical = useMemo(() => typicalRent(all, type, area?.slug), [all, type, area]);
  const result = typical && p >= 100 ? rentVerdict(p, typical.median) : null;
  const cheaper = useMemo(
    () => (result ? all.filter((l) => l.type === type && l.priceAed < p && (!area || l.areaSlug === area.slug || result.diffPct > 0)).sort((a, b) => a.priceAed - b.priceAed).slice(0, 3) : []),
    [all, type, area, p, result],
  );

  const fromAd = () => {
    const r = parseListingMessage(paste, AREAS);
    if (r.type && r.type !== "roommate") setType(r.type);
    if (r.areaSlug) setArea(AREA_BY_SLUG.get(r.areaSlug) ?? null);
    if (r.priceAed) setPrice(String(r.priceAed));
    setShown(true);
  };

  const share = result
    ? `My ${TYPE_LABEL[type].toLowerCase()} rent${area ? ` in ${area.name}` : ""} is ${Math.abs(result.diffPct)}% ${result.diffPct < 0 ? "below" : "above"} the going rate. Check yours free: https://stayshay.com/tools/fair-rent`
    : "";

  return (
    <div className="mx-auto grid max-w-[1080px] grid-cols-1 gap-6 px-4 pb-16 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      <div className="card space-y-4 p-5 md:p-6">
        <div>
          <p className="text-[13px] font-semibold">Paste an ad (optional)</p>
          <textarea value={paste} onChange={(e) => setPaste(e.target.value)} placeholder="e.g. Partition available in Al Barsha 1, AED 1,400 all bills included, ladies only" className="mt-1.5 min-h-[84px] w-full rounded-[14px] border border-line px-4 py-3 text-[14.5px] focus:border-brand focus:outline-none" />
          <button onClick={fromAd} disabled={!paste.trim()} className="mt-2 h-10 rounded-[12px] border border-line px-4 text-[13.5px] font-semibold disabled:opacity-40">
            Read the ad
          </button>
        </div>
        <div>
          <p className="text-[13px] font-semibold">Kind of place</p>
          <div className="mt-1.5 flex flex-wrap gap-2">
            {TYPES.map((t) => (
              <button key={t} className={pill(type === t)} onClick={() => setType(t)}>
                {TYPE_LABEL[t]}
              </button>
            ))}
          </div>
        </div>
        <div>
          <p className="mb-1.5 text-[13px] font-semibold">Area</p>
          <AreaCombobox value={area} onChange={setArea} />
        </div>
        <label className="block">
          <span className="text-[13px] font-semibold">Monthly rent (AED)</span>
          <input inputMode="numeric" value={price} onChange={(e) => setPrice(e.target.value.replace(/[^\d]/g, ""))} placeholder="e.g. 900" className="mt-1.5 w-full rounded-[14px] border border-line px-4 py-3 text-[16px] focus:border-brand focus:outline-none" />
        </label>
        <button
          onClick={() => {
            setShown(true);
            track("fair_rent_check", { type, area: area?.slug });
          }}
          disabled={p < 100}
          className="h-12 w-full rounded-[12px] bg-brand text-[15px] font-semibold text-white disabled:opacity-40"
        >
          Check my rent
        </button>
      </div>

      <div>
        {shown && result && typical ? (
          <div className="space-y-4">
            <div className="glow-panel rounded-[26px] p-6 text-white">
              <p className="text-[12px] font-bold uppercase tracking-[0.14em] text-[#8fe3bd]">Verdict</p>
              <p className="font-display mt-2 text-[34px] leading-none">{VERDICT_TEXT[result.verdict].title}</p>
              <p className="mt-3 text-[15px] text-white/80">
                {aed(p)} is <b className="text-white">{Math.abs(result.diffPct)}% {result.diffPct < 0 ? "below" : "above"}</b> the typical {aed(typical.median)} for a {TYPE_LABEL[type].toLowerCase()}
                {typical.scope === "area" && area ? ` in ${area.name}` : " across the UAE"} ({typical.count} live listings).
              </p>
              <div className="mt-5 h-2.5 overflow-hidden rounded-full bg-white/10">
                <div className="h-full rounded-full bg-[linear-gradient(90deg,#d3f0b9,#6ee7b7)]" style={{ width: `${Math.max(6, Math.min(100, 50 + result.diffPct))}%` }} />
              </div>
              <div className="mt-1 flex justify-between text-[11.5px] text-white/50">
                <span>Cheaper</span>
                <span>Typical</span>
                <span>Pricier</span>
              </div>
              <p className="mt-4 text-[14px] text-white/75">{VERDICT_TEXT[result.verdict].line}</p>
              <a href={`https://wa.me/?text=${encodeURIComponent(share)}`} target="_blank" rel="noopener noreferrer" className="mt-5 inline-flex h-10 items-center rounded-[12px] bg-[#d3f0b9] px-4 text-[13.5px] font-bold text-[#0f3426]">
                Share my result
              </a>
            </div>
            <ReviewPrompt tool="fair-rent" question="Was this verdict useful?" />
            {cheaper.length > 0 && (
              <div>
                <p className="text-[15px] font-bold">Cheaper {TYPE_LABEL_PLURAL[type].toLowerCase()} right now</p>
                <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {cheaper.map((l) => (
                    <ListingCard key={l.id} listing={l} />
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="card flex h-full min-h-[260px] flex-col justify-center p-6">
            <p className="font-display text-[24px]">Paying too much?</p>
            <p className="mt-2 text-[14.5px] leading-relaxed text-muted">Compare any rent with what people pay for the same kind of place in the same area today, from live listings. Free, no sign-up.</p>
          </div>
        )}
      </div>
    </div>
  );
}

/* ---------- Salary to rent ---------- */

export function BudgetTool() {
  const { all } = useMarketplace();
  const [salary, setSalary] = useState(5000);
  const b = rentBudget(salary);
  const fits = (t: ListingType) => all.filter((l) => l.type === t && l.priceAed <= b.comfortable);
  const areas = useMemo(() => {
    const m = new Map<string, number>();
    for (const l of all) if (l.priceAed <= b.comfortable && l.type !== "roommate") m.set(l.areaSlug, (m.get(l.areaSlug) ?? 0) + 1);
    return [...m].sort((a, c) => c[1] - a[1]).slice(0, 6);
  }, [all, b.comfortable]);
  const picks = useMemo(() => rankDeals(all.filter((l) => l.priceAed <= b.comfortable && l.type !== "roommate"), 4).map((d) => d.listing), [all, b.comfortable]);
  const saving = Math.max(0, (typicalRent(all, "studio")?.median ?? 0) - b.comfortable);

  return (
    <div className="mx-auto max-w-[1080px] px-4 pb-16">
      <div className="glow-panel rounded-[28px] p-6 text-white md:p-8">
        <label className="block">
          <span className="text-[13px] font-semibold text-white/70">Your monthly salary</span>
          <span className="font-figure mt-1 block text-[40px] font-bold leading-none md:text-[52px]">{aed(salary)}</span>
          <input type="range" min={1500} max={30000} step={250} value={salary} onChange={(e) => setSalary(Number(e.target.value))} className="mt-5 w-full accent-[#d3f0b9]" aria-label="Monthly salary" />
        </label>
        <div className="mt-6 grid grid-cols-2 gap-3">
          <div className="rounded-[18px] border border-white/12 bg-white/[0.06] p-4">
            <p className="text-[12px] text-white/60">Comfortable rent</p>
            <p className="font-figure mt-1 text-[24px] font-bold text-[#d3f0b9]">{aed(b.comfortable)}</p>
            <p className="text-[12px] text-white/50">about a quarter of your pay</p>
          </div>
          <div className="rounded-[18px] border border-white/12 bg-white/[0.06] p-4">
            <p className="text-[12px] text-white/60">Stretch</p>
            <p className="font-figure mt-1 text-[24px] font-bold">{aed(b.max)}</p>
            <p className="text-[12px] text-white/50">a third, the upper limit</p>
          </div>
        </div>
        {saving > 0 && <p className="mt-4 text-[14px] text-white/75">Sharing instead of a studio could save you about {aed(saving)} a month, {aed(saving * 12)} a year.</p>}
        <div className="mt-5">
          <ReviewPrompt tool="budget" question="Did this help you set a budget?" dark />
        </div>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        {TYPES.map((t) => (
          <Link key={t} href={`/search?type=${t}&max=${b.comfortable}`} className="card p-4 hover:border-brand">
            <p className="text-[13px] text-muted">{TYPE_LABEL_PLURAL[t]}</p>
            <p className="font-figure mt-1 text-[24px] font-bold text-brand">{fits(t).length}</p>
            <p className="text-[12px] text-muted">within your budget</p>
          </Link>
        ))}
      </div>

      {areas.length > 0 && (
        <div className="mt-6">
          <p className="text-[15px] font-bold">Where your budget goes furthest</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {areas.map(([slug, n]) => (
              <Link key={slug} href={`/search?area=${slug}&max=${b.comfortable}`} className="chip h-9 px-3.5 text-[13px]">
                {AREA_BY_SLUG.get(slug)?.name ?? slug} · {n}
              </Link>
            ))}
          </div>
        </div>
      )}
      {picks.length > 0 && (
        <div className="mt-8">
          <p className="text-[15px] font-bold">Best value in your budget</p>
          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {picks.map((l) => (
              <ListingCard key={l.id} listing={l} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------- Move-in cost (yearly lease) ---------- */

const CHEQUES = [1, 2, 4, 6, 12];

export function MoveInCost() {
  const { all } = useMarketplace();
  const [monthly, setMonthly] = useState(7000);
  const [cheques, setCheques] = useState(4);
  const [furnished, setFurnished] = useState(false);
  const [viaAgent, setViaAgent] = useState(true);
  const [villa, setVilla] = useState(false);
  const r = moveInCost({ yearlyRent: monthly * 12, cheques, furnished, viaAgent, villa });
  const studio = typicalRent(all, "studio");
  const room = typicalRent(all, "room");
  const share = `Moving in to a AED ${monthly.toLocaleString("en-US")}/month flat in Dubai (${cheques} cheques${viaAgent ? ", via agent" : ""}) needs about ${aed(r.total)} on day one. Work out yours: https://stayshay.com/tools/move-in-cost`;
  const brief = `Hi Stayshay, I'm looking for a family home around AED ${monthly.toLocaleString("en-US")}/month (${cheques} cheques${furnished ? ", furnished" : ""}${villa ? ", villa" : ""}). Please send options.`;

  return (
    <div className="mx-auto grid max-w-[1080px] grid-cols-1 gap-6 px-4 pb-16 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      <div className="card space-y-5 self-start p-5 md:p-6">
        <label className="block">
          <span className="text-[13px] font-semibold">Monthly rent you're looking at</span>
          <span className="font-figure mt-1 block text-[34px] font-bold leading-none text-brand">{aed(monthly)}</span>
          <input type="range" min={1500} max={40000} step={250} value={monthly} onChange={(e) => setMonthly(Number(e.target.value))} className="mt-4 w-full accent-brand" aria-label="Monthly rent" />
          <span className="mt-1 block text-[12.5px] text-muted">{aed(monthly * 12)} a year</span>
        </label>
        <div>
          <p className="text-[13px] font-semibold">Cheques per year</p>
          <div className="mt-1.5 flex flex-wrap gap-2">
            {CHEQUES.map((c) => (
              <button key={c} className={pill(cheques === c)} onClick={() => setCheques(c)}>
                {c}
              </button>
            ))}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button className={pill(furnished)} onClick={() => setFurnished(!furnished)}>Furnished</button>
          <button className={pill(viaAgent)} onClick={() => setViaAgent(!viaAgent)}>Through an agent</button>
          <button className={pill(villa)} onClick={() => setVilla(!villa)}>Villa / townhouse</button>
        </div>
        <p className="text-[12.5px] leading-relaxed text-muted">Deposit and agency percentages are typical Dubai market practice. Ejari and DEWA amounts are approximate; check the current fees before you pay.</p>
      </div>

      <div className="space-y-4">
        <div className="glow-panel rounded-[26px] p-6 text-white">
          <p className="text-[12px] font-bold uppercase tracking-[0.14em] text-[#8fe3bd]">Cash needed on day one</p>
          <p className="font-figure mt-2 text-[42px] font-bold leading-none">{aed(r.total)}</p>
          <p className="mt-2 text-[14px] text-white/75">
            {aed(r.refundable)} of it comes back when you leave. After that, rent averages {aed(r.monthly)} a month.
          </p>
          <ul className="mt-5 divide-y divide-white/10 text-[14px]">
            {r.lines.map((l) => (
              <li key={l.label} className="flex items-start justify-between gap-3 py-2.5">
                <span>
                  {l.label}
                  <span className="block text-[12px] text-white/50">
                    {l.note}
                    {l.refundable ? " · refundable" : ""}
                  </span>
                </span>
                <span className="font-figure font-semibold">{aed(l.amount)}</span>
              </li>
            ))}
          </ul>
          <div className="mt-5 flex flex-wrap gap-2">
            <a href={stayshayWhatsapp(brief)} target="_blank" rel="noopener noreferrer" onClick={() => track("generate_lead", { method: "move_in_cost" })} className="inline-flex h-10 items-center rounded-[12px] bg-[#d3f0b9] px-4 text-[13.5px] font-bold text-[#0f3426]">
              Find me a home at this rent
            </a>
            <a href={`https://wa.me/?text=${encodeURIComponent(share)}`} target="_blank" rel="noopener noreferrer" className="inline-flex h-10 items-center rounded-[12px] border border-white/25 px-4 text-[13.5px] font-semibold">
              Share
            </a>
          </div>
          {!viaAgent ? null : <p className="mt-3 text-[12.5px] text-white/60">Renting direct from the owner skips the agency fee and VAT: {aed(r.lines.filter((l) => l.label.includes("gency")).reduce((s, l) => s + l.amount, 0))} saved.</p>}
        </div>
        {(studio || room) && (
          <div className="card p-5">
            <p className="text-[15px] font-bold">Not ready for all that upfront?</p>
            <p className="mt-1 text-[14px] text-muted">
              Monthly places on Stayshay need roughly one month&apos;s rent plus a deposit, no cheques. Typical today:
              {room ? ` private room ${aed(room.median)}` : ""}
              {room && studio ? "," : ""}
              {studio ? ` studio ${aed(studio.median)}` : ""} a month.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Link href="/rent/studios" className="chip h-9 px-3.5 text-[13px]">Monthly studios</Link>
              <Link href="/family/furnished-family-apartment-monthly-dubai" className="chip h-9 px-3.5 text-[13px]">Furnished family flats</Link>
              <Link href="/family#request" className="chip h-9 px-3.5 text-[13px]">Send a family brief</Link>
            </div>
          </div>
        )}
        <ReviewPrompt tool="move-in-cost" question="Was this calculator useful?" />
      </div>
    </div>
  );
}
