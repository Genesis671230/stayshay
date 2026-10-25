"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { AREA_BY_SLUG, PHOTOS, TYPE_LABEL, coverFor, leadMessage, median, validateLead, type Area, type OwnerLead, type Gender, type ListingType } from "@stayshay/core";
import { AsideStat, FunnelShell, OptionCard, fieldCls } from "@/components/funnel";
import { AreaCombobox } from "@/components/search-bar";
import { useMarketplace } from "@/components/marketplace";
import { Badge, Icon, aed } from "@/components/ui";
import { stayshayWhatsapp } from "@/lib/contact";

const TYPES: { type: ListingType; hint: string }[] = [
  { type: "bed_space", hint: "Beds in a shared room" },
  { type: "partition", hint: "Needs landlord consent and a permit" },
  { type: "room", hint: "A private room in a shared flat" },
  { type: "studio", hint: "A whole studio or apartment" },
];
const HOUSEHOLD: { v: Gender | "couple"; label: string }[] = [
  { v: "male", label: "Male" },
  { v: "female", label: "Female" },
  { v: "couple", label: "Couples" },
  { v: "any", label: "Anyone" },
];
const TOTAL = 5;

export function ListFunnel() {
  const { all: LISTINGS } = useMarketplace();
  const [step, setStep] = useState(1);
  const [type, setType] = useState<ListingType | null>(null);
  const [area, setArea] = useState<Area | null>(null);
  const [rent, setRent] = useState("");
  const [billsIncluded, setBills] = useState(true);
  const [deposit, setDeposit] = useState("");
  const [spaces, setSpaces] = useState(1);
  const [household, setHousehold] = useState<Gender | "couple">("any");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);

  // Hero "List your place" passes ?type=; start the owner on that card.
  useEffect(() => {
    const t = new URLSearchParams(window.location.search).get("type");
    if (t && TYPES.some((x) => x.type === t)) setType(t as ListingType);
  }, []);

  // Market guidance from live listings: same type, same area first, then city-wide.
  const market = useMemo(() => {
    if (!type) return null;
    const local = area ? LISTINGS.filter((l) => l.type === type && l.areaSlug === area.slug) : [];
    const pool = local.length >= 3 ? local : LISTINGS.filter((l) => l.type === type);
    const prices = pool.map((l) => l.priceAed);
    return {
      scope: local.length >= 3 && area ? area.name : "across the UAE",
      n: pool.length,
      median: median(prices),
      low: prices.length ? Math.min(...prices) : null,
      high: prices.length ? Math.max(...prices) : null,
      billsShare: pool.length ? Math.round((pool.filter((l) => l.billsIncluded).length / pool.length) * 100) : 0,
    };
  }, [type, area]);

  const lead = { kind: "owner", type, areaSlug: area?.slug, rent, billsIncluded, deposit, spaces, household, name, phone };

  const submit = async () => {
    const check = validateLead(lead);
    setErrors(check.errors);
    if (!check.ok || !check.value) return;
    setBusy(true);
    await fetch("/api/lead", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(check.value) }).catch(() => null);
    setBusy(false);
    setStep(6);
  };

  // Curated brand interior behind the proof panel; listing photos stay on the option cards.
  const image = PHOTOS.hero[step % PHOTOS.hero.length];
  const aside = market?.median ? (
    <AsideStat value={aed(market.median)} label={`Typical ${TYPE_LABEL[type!].toLowerCase()} rent ${market.scope}`} note={`Median of ${market.n} live listings. ${market.billsShare}% include bills.`} />
  ) : (
    <AsideStat value="Free" label="to list on Stayshay" note="No commission, no card. Inquiries arrive on WhatsApp with move-in date and budget." />
  );

  if (step === 6) {
    const value = validateLead(lead).value as OwnerLead;
    return (
      <>
        <div className="mx-auto grid max-w-[1100px] grid-cols-1 gap-12 px-5 py-12 md:px-10 md:py-16 lg:grid-cols-[minmax(0,1fr)_380px]">
          <div>
            <p className="eyebrow">You’re in, {name.split(" ")[0]}</p>
            <h1 className="font-display mt-2 text-[36px] leading-[1.08] md:text-[48px]">One last step: send your photos</h1>
            <p className="mt-3 max-w-[540px] text-[15.5px] leading-relaxed text-ink-2">
              Open WhatsApp and send 4 to 8 clear photos. We’ll write the listing, check it, and put it live. Usually the same day.
            </p>
            <a href={stayshayWhatsapp(leadMessage(value, (s) => AREA_BY_SLUG.get(s)?.name ?? s))} target="_blank" rel="noopener noreferrer" className="mt-6 inline-flex h-12 items-center gap-2 rounded-[12px] bg-whatsapp px-6 text-[15px] font-medium text-white">
              <Icon name="whatsapp" size={18} /> Send photos on WhatsApp
            </a>
            <ol className="mt-10 space-y-5">
              {[
                ["Photos", "Bright, wide shots of the room, bathroom, kitchen and building entrance."],
                ["Verification", "We confirm your phone and ID. For partitions and bed spaces, share the landlord’s consent and permit to earn the Verified compliant badge."],
                ["Live", "Your listing goes live and inquiries reach you on WhatsApp with move-in date and budget."],
              ].map(([t, d], i) => (
                <li key={t} className="flex gap-4">
                  <span className="font-figure flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-brand text-[14px] font-semibold">{i + 1}</span>
                  <span>
                    <span className="block text-[15px] font-medium">{t}</span>
                    <span className="block text-[14px] text-muted">{d}</span>
                  </span>
                </li>
              ))}
            </ol>
          </div>
          <div>
            <p className="mb-3 text-[13px] font-semibold">How your listing will look</p>
            <div className="overflow-hidden rounded-[22px] border border-line">
              <div className="relative aspect-[4/3] bg-surface">
                <Image src={coverFor(LISTINGS, value.type) ?? ""} alt="" fill sizes="380px" className="object-cover opacity-90" />
                <span className="absolute left-3 top-3 rounded-full bg-white px-2 py-1 text-[11px] font-medium">Your photos here</span>
              </div>
              <div className="p-4">
                <p className="text-[12px] uppercase tracking-[0.1em] text-muted">
                  {TYPE_LABEL[value.type]} · {AREA_BY_SLUG.get(value.areaSlug)?.name}
                </p>
                <p className="mt-1 text-[15.5px] font-medium">
                  {TYPE_LABEL[value.type]} in {AREA_BY_SLUG.get(value.areaSlug)?.name}
                </p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {value.billsIncluded && <Badge>Bills included</Badge>}
                  {!value.deposit && <Badge>No deposit</Badge>}
                  <Badge>{HOUSEHOLD.find((h) => h.v === value.household)?.label}</Badge>
                </div>
                <p className="mt-3 text-[15px]">
                  <span className="font-figure font-semibold">{aed(value.rent)}</span> <span className="text-muted">/ month</span>
                </p>
              </div>
            </div>
            <Link href="/" className="mt-4 inline-block text-[13.5px] text-muted underline underline-offset-4">Back to Stayshay</Link>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      {step === 1 && (
        <FunnelShell step={1} total={TOTAL} title="What are you renting out?" subtitle="List for free. Takes about two minutes." aside={aside} image={image} onNext={() => setStep(2)} nextDisabled={!type}>
          <div className="space-y-3">
            {TYPES.map((t) => (
              <OptionCard key={t.type} selected={type === t.type} onClick={() => setType(t.type)} title={TYPE_LABEL[t.type]} hint={t.hint} image={coverFor(LISTINGS, t.type, 1)} />
            ))}
          </div>
        </FunnelShell>
      )}

      {step === 2 && (
        <FunnelShell step={2} total={TOTAL} title="Where is it?" subtitle="Area or nearest metro. The exact address stays private until you share it." aside={aside} image={image} onBack={() => setStep(1)} onNext={() => setStep(3)} nextDisabled={!area}>
          <div className="rounded-[16px] border border-line px-4 py-3">
            <AreaCombobox value={area} onChange={setArea} />
          </div>
          {area && type && (
            <p className="mt-5 rounded-[16px] bg-surface px-4 py-3 text-[14px]">
              <span className="font-figure font-semibold">{LISTINGS.filter((l) => l.areaSlug === area.slug).length}</span> places are listed in {area.name} right now.
              {" "}
              {LISTINGS.filter((l) => l.areaSlug === area.slug && l.type === type).length > 0 && (
                <>
                  <span className="font-figure font-semibold">{LISTINGS.filter((l) => l.areaSlug === area.slug && l.type === type).length}</span> of them are {TYPE_LABEL[type].toLowerCase()}s.
                </>
              )}
            </p>
          )}
        </FunnelShell>
      )}

      {step === 3 && (
        <FunnelShell step={3} total={TOTAL} title="Set your rent and terms" aside={aside} image={image} onBack={() => setStep(2)} onNext={() => setStep(4)} nextDisabled={!(Number(rent) >= 200)}>
          <label className="block">
            <span className="mb-1.5 block text-[13px] font-medium">Monthly rent (AED)</span>
            <input className={`${fieldCls} font-figure text-[22px]`} inputMode="numeric" value={rent} onChange={(e) => setRent(e.target.value.replace(/\D/g, ""))} placeholder={market?.median ? String(market.median) : "1500"} />
          </label>
          {market?.median && (
            <p className="mt-2 text-[13px] text-muted">
              Similar places {market.scope}: <span className="font-figure text-ink">{aed(market.low!)} – {aed(market.high!)}</span>, typically <span className="font-figure text-ink">{aed(market.median)}</span>.
            </p>
          )}
          <div className="mt-6 grid grid-cols-2 gap-2">
            {[true, false].map((b) => (
              <button key={String(b)} onClick={() => setBills(b)} className={`h-11 rounded-[12px] border text-[14px] ${billsIncluded === b ? "border-brand bg-brand text-white" : "border-line text-ink-2"}`}>
                {b ? "Bills included" : "Bills extra"}
              </button>
            ))}
          </div>
          <div className="mt-6 grid grid-cols-2 gap-4">
            <label className="block">
              <span className="mb-1.5 block text-[13px] font-medium">Deposit (AED)</span>
              <input className={fieldCls} inputMode="numeric" value={deposit} onChange={(e) => setDeposit(e.target.value.replace(/\D/g, ""))} placeholder="0" />
            </label>
            <div>
              <span className="mb-1.5 block text-[13px] font-medium">{type === "bed_space" ? "Beds available" : "Spaces available"}</span>
              <div className="flex h-[54px] items-center justify-between rounded-[16px] border border-line px-2">
                <button onClick={() => setSpaces(Math.max(1, spaces - 1))} className="h-10 w-10 rounded-[12px] text-[20px] hover:bg-surface" aria-label="Fewer">−</button>
                <span className="font-figure text-[18px] font-semibold">{spaces}</span>
                <button onClick={() => setSpaces(Math.min(50, spaces + 1))} className="h-10 w-10 rounded-[12px] text-[20px] hover:bg-surface" aria-label="More">+</button>
              </div>
            </div>
          </div>
        </FunnelShell>
      )}

      {step === 4 && (
        <FunnelShell step={4} total={TOTAL} title="Who can live there?" subtitle="Renters filter by this, so being clear brings better inquiries." aside={aside} image={image} onBack={() => setStep(3)} onNext={() => setStep(5)}>
          <div className="grid grid-cols-2 gap-3">
            {HOUSEHOLD.map((h) => (
              <OptionCard key={h.v} selected={household === h.v} onClick={() => setHousehold(h.v)} title={h.label} icon="users" />
            ))}
          </div>
          {type === "partition" && (
            <p className="mt-6 rounded-[16px] border border-line px-4 py-3 text-[13.5px] leading-relaxed text-ink-2">
              Partitions need the landlord’s written consent and a permit under Dubai’s shared-housing rules. You can share them after signing up to earn the Verified compliant badge.
            </p>
          )}
        </FunnelShell>
      )}

      {step === 5 && (
        <FunnelShell step={5} total={TOTAL} title="Who should renters contact?" subtitle="Inquiries come to you on WhatsApp with name, move-in date and budget." aside={aside} image={image} onBack={() => setStep(4)} onNext={submit} nextLabel="Create my listing" busy={busy}>
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
            {Object.keys(errors).filter((k) => k !== "name" && k !== "phone").length > 0 && (
              <p className="text-[12.5px] text-warn">Go back and check: {Object.values(errors).join(", ")}.</p>
            )}
          </div>
        </FunnelShell>
      )}
    </>
  );
}
