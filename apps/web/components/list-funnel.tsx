"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { QuickSignIn, useMe } from "@/components/quick-signin";
import { AMENITY_LABEL, AREA_BY_SLUG, PHOTOS, TYPE_LABEL, coverFor, median, type Amenity, type Area, type Gender, type ListingType } from "@stayshay/core";
import { AsideStat, FunnelShell, OptionCard, fieldCls } from "@/components/funnel";
import { AreaCombobox } from "@/components/search-bar";
import { useMarketplace } from "@/components/marketplace";
import { Badge, Icon, aed } from "@/components/ui";
import { Shay } from "@/components/shay";
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
const TOTAL = 6;

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
  const [email, setEmail] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  // Photos are shrunk in the browser to ~1600px JPEG data URLs: fast uploads, and they survive a Google sign-in round trip.
  const [photos, setPhotos] = useState<string[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [bathroom, setBathroom] = useState("Shared Bathroom");
  const [availability, setAvailability] = useState("Ready to move");
  const [amenities, setAmenities] = useState<Amenity[]>(["wifi", "ac", "kitchen", "washer"]);
  const [submitted, setSubmitted] = useState<string | null>(null);
  const { me, google } = useMe();
  const DRAFT = "stayshay:listing-draft";

  useEffect(() => {
    if (me) {
      setName((v) => v || me.name);
      setPhone((v) => v || (me.phone ? `+${me.phone}` : ""));
      setEmail((v) => v || me.email);
    }
  }, [me]);

  // Back from Google sign-in: put everything back where it was.
  useEffect(() => {
    try {
      const d = JSON.parse(sessionStorage.getItem(DRAFT) ?? "null");
      if (!d) return;
      sessionStorage.removeItem(DRAFT);
      setType(d.type);
      setArea(d.areaSlug ? (AREA_BY_SLUG.get(d.areaSlug) ?? null) : null);
      setRent(d.rent);
      setBills(d.billsIncluded);
      setDeposit(d.deposit);
      setSpaces(d.spaces);
      setHousehold(d.household);
      setPhotos(d.photos ?? []);
      setTitle(d.title);
      setDescription(d.description);
      setBathroom(d.bathroom);
      setAvailability(d.availability);
      setAmenities(d.amenities);
      setStep(6);
    } catch {}
  }, []);
  const saveDraft = () => {
    try {
      sessionStorage.setItem(DRAFT, JSON.stringify({ type, areaSlug: area?.slug, rent, billsIncluded, deposit, spaces, household, photos, title, description, bathroom, availability, amenities }));
    } catch {
      /* too big for session storage: they'll re-add photos */
    }
  };

  const addPhotos = async (files: FileList | null) => {
    const list = Array.from(files ?? []).filter((f) => f.type.startsWith("image/")).slice(0, 10 - photos.length);
    const shrunk = await Promise.all(list.map(shrink));
    setPhotos((p) => [...p, ...shrunk.filter((x): x is string => !!x)].slice(0, 10));
  };

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

  const submit = async () => {
    const e: Record<string, string> = {};
    if (name.trim().length < 2) e.name = "Enter your name";
    if (phone.replace(/\D/g, "").length < 9) e.phone = "Enter a valid WhatsApp number";
    setErrors(e);
    if (Object.keys(e).length) return;
    setBusy(true);
    const body = new FormData();
    body.set(
      "listing",
      JSON.stringify({
        type,
        areaSlug: area?.slug,
        priceAed: Number(rent),
        deposit: Number(deposit) || 0,
        billsIncluded,
        bedsInRoom: type === "bed_space" ? Math.max(2, spaces) : 1,
        bedsAvailable: spaces,
        gender: household === "male" || household === "female" ? household : "any",
        occupancy: household === "couple" ? "couple" : undefined,
        title,
        description,
        bathroom,
        availability,
        amenities,
        listerName: name,
        listerPhone: phone,
        listerEmail: email,
        source: "web",
      }),
    );
    for (const [i, url] of photos.entries()) body.append("photos", await (await fetch(url)).blob(), `photo-${i + 1}.jpg`);
    const res = await fetch("/api/listings/submit", { method: "POST", body }).catch(() => null);
    const j = await res?.json().catch(() => ({}));
    setBusy(false);
    if (!res?.ok) {
      setErrors({ form: j?.error ?? Object.values(j?.errors ?? {}).join(", ") ?? "Something went wrong. Try again." });
      if (j?.errors?.photos || j?.errors?.title) setStep(5);
      return;
    }
    setSubmitted(j.id);
    setStep(7);
  };

  // Curated brand interior behind the proof panel; listing photos stay on the option cards.
  const image = PHOTOS.hero[step % PHOTOS.hero.length];
  const aside = market?.median ? (
    <AsideStat value={aed(market.median)} label={`Typical ${TYPE_LABEL[type!].toLowerCase()} rent ${market.scope}`} note={`Median of ${market.n} live listings. ${market.billsShare}% include bills.`} />
  ) : (
    <AsideStat value="Free" label="to list on Stayshay" note="No commission, no card. Inquiries arrive on WhatsApp with move-in date and budget." />
  );

  if (step === 7 && submitted) {
    return (
      <div className="mx-auto grid max-w-[1100px] grid-cols-1 gap-12 px-5 py-12 md:px-10 md:py-16 lg:grid-cols-[minmax(0,1fr)_380px]">
        <div>
          <Shay size={84} mood="happy" />
          <p className="eyebrow mt-6">Submitted · ref {submitted}</p>
          <h1 className="font-display mt-2 text-[36px] leading-[1.08] md:text-[48px]">Thanks, {name.split(" ")[0]}! We’re reviewing it now.</h1>
          <p className="mt-3 max-w-[540px] text-[15.5px] leading-relaxed text-ink-2">
            Our team checks every listing before it goes public, usually within a few hours. We’ll WhatsApp you on {phone} when it’s live, or if we need anything.
          </p>
          <ol className="mt-8 space-y-5">
            {[
              ["Review", "We check the photos, price and details, and may tidy up the title."],
              ["Verification", "For partitions and bed spaces, share the landlord’s consent and permit to earn the Verified compliant badge."],
              ["Live", "Renters see it on stayshay.com and in the app. Inquiries reach you on WhatsApp with move-in date and budget."],
            ].map(([t, d], i) => (
              <li key={t} className="flex gap-4">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand text-[14px] font-bold text-white">{i + 1}</span>
                <span>
                  <span className="block text-[15px] font-semibold">{t}</span>
                  <span className="block text-[14px] text-muted">{d}</span>
                </span>
              </li>
            ))}
          </ol>
          <div className="mt-8 flex flex-wrap gap-3">
            <a href={stayshayWhatsapp(`Hi Stayshay, I just submitted listing ${submitted}.`)} target="_blank" rel="noopener noreferrer" className="inline-flex h-12 items-center gap-2 rounded-full bg-whatsapp px-6 text-[15px] font-semibold text-white">
              <Icon name="whatsapp" size={18} /> Message the team
            </a>
            <Link href="/list" onClick={() => window.location.reload()} className="inline-flex h-12 items-center rounded-full border border-line px-6 text-[15px] font-semibold">
              List another place
            </Link>
          </div>
        </div>
        <div>
          <p className="mb-3 text-[13px] font-semibold">Your listing (pending review)</p>
          <div className="overflow-hidden rounded-[24px] border border-line bg-white">
            <div className="relative aspect-[4/3] bg-surface">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              {photos[0] && <img src={photos[0]} alt="" className="h-full w-full object-cover" />}
              <span className="absolute left-3 top-3 rounded-full bg-white px-2.5 py-1 text-[11.5px] font-bold text-[#8a5a14]">Pending review</span>
              <span className="absolute bottom-3 left-3 rounded-full bg-white px-3 py-1.5 text-[14px] font-extrabold shadow-md">
                {aed(Number(rent))}
                <span className="font-medium text-muted">/mo</span>
              </span>
            </div>
            <div className="p-4">
              <p className="text-[15.5px] font-bold">{title}</p>
              <p className="text-[13px] text-muted">
                {type ? TYPE_LABEL[type] : ""} · {area?.name}
              </p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {billsIncluded && <Badge>Bills included</Badge>}
                {!Number(deposit) && <Badge>No deposit</Badge>}
                <Badge>{HOUSEHOLD.find((h) => h.v === household)?.label}</Badge>
              </div>
            </div>
          </div>
        </div>
      </div>
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
        <FunnelShell
          step={5}
          total={TOTAL}
          title="Show it off"
          subtitle="Bright photos and a clear title get far more inquiries. Our team reviews everything before it goes live."
          aside={aside}
          image={image}
          onBack={() => setStep(4)}
          onNext={() => {
            const e: Record<string, string> = {};
            if (!photos.length) e.photos = "Add at least one photo";
            if (title.trim().length < 6) e.title = "Add a short title";
            setErrors(e);
            if (!Object.keys(e).length) setStep(6);
          }}
        >
          <div className="space-y-5">
            <div>
              <span className="mb-2 block text-[13px] font-medium">Photos ({photos.length}/10)</span>
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                {photos.map((p, i) => (
                  <div key={i} className="group relative aspect-square overflow-hidden rounded-[14px] bg-surface">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={p} alt="" className="h-full w-full object-cover" />
                    {i === 0 && <span className="absolute left-1.5 top-1.5 rounded-full bg-white px-2 py-0.5 text-[10.5px] font-bold">Cover</span>}
                    <button type="button" onClick={() => setPhotos(photos.filter((_, j) => j !== i))} aria-label="Remove photo" className="absolute right-1.5 top-1.5 flex h-7 w-7 items-center justify-center rounded-full bg-white/95 text-ink shadow">
                      <Icon name="close" size={13} />
                    </button>
                  </div>
                ))}
                {photos.length < 10 && (
                  <label className="flex aspect-square cursor-pointer flex-col items-center justify-center gap-1 rounded-[14px] border-2 border-dashed border-line-strong text-[12px] font-semibold text-muted hover:border-brand hover:text-brand">
                    <Icon name="grid" size={20} />
                    Add photos
                    <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => addPhotos(e.target.files)} />
                  </label>
                )}
              </div>
              {errors.photos && <span className="mt-1 block text-[12.5px] text-warn">{errors.photos}</span>}
              <p className="mt-2 text-[12.5px] text-muted">Room, bathroom, kitchen and building. The first photo is the cover.</p>
            </div>
            <label className="block">
              <span className="mb-1.5 block text-[13px] font-medium">Title</span>
              <input className={fieldCls} value={title} onChange={(e) => setTitle(e.target.value)} placeholder={type && area ? `${TYPE_LABEL[type]} near ${area.nearMetro ?? area.name} metro` : "e.g. Partition near Mall of the Emirates metro"} maxLength={100} />
              {errors.title && <span className="mt-1 block text-[12.5px] text-warn">{errors.title}</span>}
            </label>
            <label className="block">
              <span className="mb-1.5 block text-[13px] font-medium">
                Description <span className="font-normal text-muted">(optional)</span>
              </span>
              <textarea className={`${fieldCls} min-h-[110px]`} value={description} onChange={(e) => setDescription(e.target.value)} maxLength={3000} placeholder="What’s included, who lives there, house rules, nearby shops and transport…" />
            </label>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="mb-1.5 block text-[13px] font-medium">Bathroom</span>
                <select className={fieldCls} value={bathroom} onChange={(e) => setBathroom(e.target.value)}>
                  <option>Shared Bathroom</option>
                  <option>Private Bathroom</option>
                  <option>Attached Bathroom</option>
                </select>
              </label>
              <label className="block">
                <span className="mb-1.5 block text-[13px] font-medium">Availability</span>
                <select className={fieldCls} value={availability} onChange={(e) => setAvailability(e.target.value)}>
                  <option>Ready to move</option>
                  <option>Available next week</option>
                  <option>Available next month</option>
                </select>
              </label>
            </div>
            <div>
              <span className="mb-2 block text-[13px] font-medium">What’s included</span>
              <div className="flex flex-wrap gap-2">
                {(Object.keys(AMENITY_LABEL) as Amenity[]).map((a) => (
                  <button
                    type="button"
                    key={a}
                    onClick={() => setAmenities(amenities.includes(a) ? amenities.filter((x) => x !== a) : [...amenities, a])}
                    className={`h-9 rounded-full border px-3.5 text-[13px] font-medium ${amenities.includes(a) ? "border-brand bg-mint text-brand" : "border-line bg-white text-ink-2"}`}
                  >
                    {AMENITY_LABEL[a]}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </FunnelShell>
      )}

      {step === 6 && (
        <FunnelShell step={6} total={TOTAL} title="Who should renters contact?" subtitle="Inquiries come to you on WhatsApp with name, move-in date and budget. Your number isn’t shown publicly." aside={aside} image={image} onBack={() => setStep(5)} onNext={submit} nextLabel="Submit for review" busy={busy}>
          <div className="space-y-4">
            {!me && <QuickSignIn next="/list" google={google} onBeforeLeave={saveDraft} note="Track your listing and get inquiries faster." />}
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
            <label className="block">
              <span className="mb-1.5 block text-[13px] font-medium">
                Email <span className="font-normal text-muted">(optional)</span>
              </span>
              <input className={fieldCls} type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </label>
            {errors.form && <p className="rounded-[12px] bg-warn-bg px-3.5 py-2.5 text-[13.5px] font-medium text-warn">{errors.form}</p>}
            <p className="flex items-start gap-2 text-[12.5px] text-muted">
              <Icon name="shield" size={14} className="mt-0.5 shrink-0" /> Nothing goes public until our team has reviewed it. Partitions and bed spaces need landlord consent and the applicable permit.
            </p>
          </div>
        </FunnelShell>
      )}
    </>
  );
}

/** Downscale a picked photo to ≤1600px JPEG (data URL) in the browser. */
function shrink(file: File): Promise<string | null> {
  return new Promise((resolve) => {
    const img = new window.Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const scale = Math.min(1, 1600 / Math.max(img.width, img.height));
      const c = document.createElement("canvas");
      c.width = Math.round(img.width * scale);
      c.height = Math.round(img.height * scale);
      c.getContext("2d")?.drawImage(img, 0, 0, c.width, c.height);
      URL.revokeObjectURL(url);
      resolve(c.toDataURL("image/jpeg", 0.82));
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(null);
    };
    img.src = url;
  });
}
