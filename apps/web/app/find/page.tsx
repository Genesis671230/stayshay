"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { AREAS, AREA_BY_SLUG, LISTINGS, PHOTOS, TYPE_LABEL, coverFor, filterListings, leadMessage, validateLead, type Area, type TenantRequest, type Gender, type ListingType } from "@stayshay/core";
import { AsideStat, FunnelShell, OptionCard, fieldCls } from "@/components/funnel";
import { AreaCombobox } from "@/components/search-bar";
import { ListingCard } from "@/components/listing-card";
import { MarketplaceProvider, searchHref } from "@/components/marketplace";
import { Icon, aed } from "@/components/ui";
import { stayshayWhatsapp } from "@/lib/contact";

const TYPES: { type: ListingType; hint: string }[] = [
  { type: "bed_space", hint: "Shared room, your own bed" },
  { type: "partition", hint: "A private partitioned space" },
  { type: "room", hint: "Your own room in a shared flat" },
  { type: "studio", hint: "Your own place" },
];
const HOUSEHOLD: { v: Gender | "couple"; label: string }[] = [
  { v: "male", label: "Male" },
  { v: "female", label: "Female" },
  { v: "couple", label: "Couple" },
  { v: "any", label: "Any / mixed" },
];
const TOTAL = 5;

function addDays(n: number) {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}

export default function FindPage() {
  const [step, setStep] = useState(1);
  const [types, setTypes] = useState<ListingType[]>([]);
  const [areas, setAreas] = useState<Area[]>([]);
  const [budget, setBudget] = useState(2000);
  const [moveIn, setMoveIn] = useState(addDays(7));
  const [household, setHousehold] = useState<Gender | "couple">("any");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);

  const filters = useMemo(
    () => ({
      types: types.length ? types : undefined,
      areaSlugs: step >= 2 && areas.length ? areas.map((a) => a.slug) : undefined,
      maxPrice: step >= 3 ? budget : undefined,
      gender: step >= 4 && (household === "male" || household === "female") ? household : undefined,
    }),
    [types, areas, budget, household, step],
  );
  const matches = useMemo(() => {
    const base = filterListings(LISTINGS, AREAS, filters);
    return step >= 4 && household === "couple" ? base.filter((l) => l.occupancy === "couple" || l.type === "studio") : base;
  }, [filters, household, step]);

  const submit = async () => {
    const lead = { kind: "tenant", types, areaSlugs: areas.map((a) => a.slug), budget, moveIn, household, name, phone };
    const check = validateLead(lead);
    setErrors(check.errors);
    if (!check.ok || !check.value) return;
    setBusy(true);
    await fetch("/api/lead", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(check.value) }).catch(() => null);
    setBusy(false);
    setStep(6);
  };

  const aside = <AsideStat value={matches.length.toLocaleString("en-US")} label={matches.length === 1 ? "place matches so far" : "places match so far"} note="Updates as you answer. Free to use, no commission from Stayshay." />;
  // Curated brand interior behind the proof panel; listing photos stay on the option cards.
  const image = PHOTOS.hero[step % PHOTOS.hero.length];

  if (step === 6) {
    const lead = validateLead({ kind: "tenant", types, areaSlugs: areas.map((a) => a.slug), budget, moveIn, household, name, phone }).value as TenantRequest;
    return (
      <MarketplaceProvider>
        <div className="mx-auto max-w-[1140px] px-5 py-12 md:px-10 md:py-16">
          <p className="eyebrow">Done, {name.split(" ")[0]}</p>
          <h1 className="font-display mt-2 text-[36px] leading-[1.08] md:text-[48px]">
            <span className="font-figure font-semibold">{matches.length}</span> {matches.length === 1 ? "place fits" : "places fit"} what you need
          </h1>
          <p className="mt-3 max-w-[560px] text-[15.5px] text-ink-2">
            We’ve saved your request. Message us on WhatsApp and we’ll line up viewings, or browse the matches yourself.
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <a href={stayshayWhatsapp(leadMessage(lead, (s) => AREA_BY_SLUG.get(s)?.name ?? s))} target="_blank" rel="noopener noreferrer" className="flex h-12 items-center justify-center gap-2 rounded-[12px] bg-whatsapp px-6 text-[15px] font-medium text-white">
              <Icon name="whatsapp" size={18} /> Get viewings on WhatsApp
            </a>
            <Link href={searchHref(filters)} className="flex h-12 items-center justify-center rounded-[12px] border border-brand px-6 text-[15px] font-medium">
              See all {matches.length} matches
            </Link>
          </div>
          <div className="mt-12 grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
            {matches.slice(0, 6).map((l) => (
              <ListingCard key={l.id} listing={l} />
            ))}
          </div>
        </div>
      </MarketplaceProvider>
    );
  }

  return (
    <MarketplaceProvider>
      {step === 1 && (
        <FunnelShell step={1} total={TOTAL} title="What are you looking for?" subtitle="Pick one or more. You can change this later." aside={aside} image={image} onNext={() => setStep(2)} nextDisabled={!types.length}>
          <div className="space-y-3">
            {TYPES.map((t) => (
              <OptionCard
                key={t.type}
                selected={types.includes(t.type)}
                onClick={() => setTypes((cur) => (cur.includes(t.type) ? cur.filter((x) => x !== t.type) : [...cur, t.type]))}
                title={TYPE_LABEL[t.type]}
                hint={`${t.hint} · ${LISTINGS.filter((l) => l.type === t.type).length} places`}
                image={coverFor(t.type)}
              />
            ))}
          </div>
        </FunnelShell>
      )}

      {step === 2 && (
        <FunnelShell step={2} total={TOTAL} title="Where do you want to live?" subtitle="Add up to 5 areas, or skip if you’re flexible." aside={aside} image={image} onBack={() => setStep(1)} onNext={() => setStep(3)} nextLabel={areas.length ? "Continue" : "I’m flexible"}>
          <div className="rounded-[16px] border border-line px-4 py-3">
            <AreaCombobox
              value={null}
              onChange={(a) => {
                if (a && !areas.some((x) => x.slug === a.slug) && areas.length < 5) setAreas([...areas, a]);
              }}
            />
          </div>
          {areas.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {areas.map((a) => (
                <button key={a.slug} onClick={() => setAreas(areas.filter((x) => x.slug !== a.slug))} className="flex h-9 items-center gap-2 rounded-[12px] bg-brand px-3 text-[13.5px] text-white">
                  {a.name} <Icon name="close" size={13} />
                </button>
              ))}
            </div>
          )}
          <p className="mt-6 text-[13px] font-semibold">Popular with renters</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {[...new Set(LISTINGS.map((l) => l.areaSlug))]
              .map((s) => ({ s, n: LISTINGS.filter((l) => l.areaSlug === s).length }))
              .sort((a, b) => b.n - a.n)
              .slice(0, 10)
              .map(({ s, n }) => {
                const a = AREA_BY_SLUG.get(s);
                if (!a) return null;
                const on = areas.some((x) => x.slug === s);
                return (
                  <button key={s} onClick={() => setAreas(on ? areas.filter((x) => x.slug !== s) : areas.length < 5 ? [...areas, a] : areas)} className={`h-9 rounded-[12px] border px-3 text-[13.5px] ${on ? "border-brand bg-brand text-white" : "border-line text-ink-2 hover:border-brand"}`}>
                    {a.name} <span className={on ? "text-white/70" : "text-muted"}>{n}</span>
                  </button>
                );
              })}
          </div>
        </FunnelShell>
      )}

      {step === 3 && (
        <FunnelShell step={3} total={TOTAL} title="What’s your monthly budget?" subtitle="Rent only. Many places include bills." aside={aside} image={image} onBack={() => setStep(2)} onNext={() => setStep(4)}>
          <p className="font-figure text-[48px] font-semibold leading-none">{aed(budget)}</p>
          <input type="range" min={500} max={8000} step={50} value={budget} onChange={(e) => setBudget(Number(e.target.value))} className="mt-6 w-full accent-[var(--brand)]" aria-label="Budget" />
          <div className="font-figure mt-1 flex justify-between text-[12px] text-muted">
            <span>AED 500</span>
            <span>AED 8,000</span>
          </div>
          <div className="mt-6 flex flex-wrap gap-2">
            {[800, 1200, 1500, 2000, 3000, 4500].map((b) => (
              <button key={b} onClick={() => setBudget(b)} className={`h-9 rounded-[12px] border px-3 text-[13.5px] ${budget === b ? "border-brand bg-brand text-white" : "border-line text-ink-2"}`}>
                Up to {b.toLocaleString("en-US")}
              </button>
            ))}
          </div>
          <p className="mt-6 rounded-[16px] bg-surface px-4 py-3 text-[14px]">
            <span className="font-figure font-semibold">{matches.length}</span> places at or under this budget
            {areas.length ? ` in ${areas.map((a) => a.name).join(", ")}` : ""}.
          </p>
        </FunnelShell>
      )}

      {step === 4 && (
        <FunnelShell step={4} total={TOTAL} title="When, and who’s moving?" aside={aside} image={image} onBack={() => setStep(3)} onNext={() => setStep(5)}>
          <p className="text-[13px] font-semibold">Move-in date</p>
          <div className="mt-2 grid grid-cols-3 gap-2">
            {[
              ["As soon as possible", 0],
              ["In a week", 7],
              ["Next month", 30],
            ].map(([label, d]) => (
              <button key={label} onClick={() => setMoveIn(addDays(d as number))} className={`h-11 rounded-[12px] border text-[13.5px] ${moveIn === addDays(d as number) ? "border-brand bg-brand text-white" : "border-line text-ink-2"}`}>
                {label}
              </button>
            ))}
          </div>
          <input type="date" value={moveIn} min={addDays(0)} onChange={(e) => setMoveIn(e.target.value)} className={`${fieldCls} mt-3`} />
          <p className="mt-7 text-[13px] font-semibold">Who’s moving in?</p>
          <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {HOUSEHOLD.map((h) => (
              <button key={h.v} onClick={() => setHousehold(h.v)} className={`h-11 rounded-[12px] border text-[14px] ${household === h.v ? "border-brand bg-brand text-white" : "border-line text-ink-2"}`}>
                {h.label}
              </button>
            ))}
          </div>
        </FunnelShell>
      )}

      {step === 5 && (
        <FunnelShell
          step={5}
          total={TOTAL}
          title="Where should we send your matches?"
          subtitle="We’ll WhatsApp you new places that fit, and help book viewings. No spam."
          aside={aside}
          image={image}
          onBack={() => setStep(4)}
          onNext={submit}
          nextLabel={`See my ${matches.length} matches`}
          busy={busy}
        >
          <div className="space-y-4">
            <label className="block">
              <span className="mb-1.5 block text-[13px] font-medium">Your name</span>
              <input className={fieldCls} autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} />
              {errors.name && <span className="mt-1 block text-[12.5px] text-warn">{errors.name}</span>}
            </label>
            <label className="block">
              <span className="mb-1.5 block text-[13px] font-medium">WhatsApp number</span>
              <input className={fieldCls} type="tel" inputMode="tel" autoComplete="tel" placeholder="050 123 4567" value={phone} onChange={(e) => setPhone(e.target.value)} />
              {errors.phone && <span className="mt-1 block text-[12.5px] text-warn">{errors.phone}</span>}
            </label>
            <p className="flex items-start gap-2 text-[12.5px] text-muted">
              <Icon name="shield" size={14} className="mt-0.5 shrink-0" /> Only used to send you matches and arrange viewings. Never pay anyone before viewing.
            </p>
          </div>
        </FunnelShell>
      )}
    </MarketplaceProvider>
  );
}
