"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { AREA_BY_SLUG, TYPE_LABEL, type ListingType } from "@stayshay/core";
import { SearchBar } from "./search-bar";
import { Icon, aed } from "./ui";
import { useMarketplace } from "./marketplace";
import { Shay } from "./shay";
import { openShay } from "./shay-chat";

// Full-bleed hero. Set NEXT_PUBLIC_HERO_VIDEO to an mp4 URL to play a muted loop over the photo.
const HERO_IMAGE = "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=2400&q=80&auto=format&fit=crop";
const HERO_VIDEO = process.env.NEXT_PUBLIC_HERO_VIDEO;
const OWNER_TYPES: ListingType[] = ["bed_space", "partition", "room", "studio"];

export function Hero() {
  const router = useRouter();
  const { all: LISTINGS } = useMarketplace();
  const [mode, setMode] = useState<"rent" | "list">("rent");
  const [ownerType, setOwnerType] = useState<ListingType>("bed_space");
  const from = LISTINGS.length ? Math.min(...LISTINGS.map((l) => l.priceAed)) : 0;
  const billsIn = LISTINGS.filter((l) => l.billsIncluded).length;
  const popular = [...new Set(LISTINGS.map((l) => l.areaSlug))]
    .map((s) => ({ s, n: LISTINGS.filter((l) => l.areaSlug === s).length }))
    .sort((a, b) => b.n - a.n)
    .slice(0, 5)
    .map((x) => x.s);

  const pillars: { icon: Parameters<typeof Icon>[0]["name"]; title: string; text: string }[] = [
    { icon: "key", title: "Luxury, furnished", text: "Hand-picked rooms and studios with real photos, ready to move in." },
    { icon: "wallet", title: "Affordable, honest", text: `From ${aed(from)} a month. Rent, deposit and bills shown up front${billsIn ? `, ${billsIn} with bills included` : ""}.` },
    { icon: "shield", title: "Smart, AI-matched", text: "Shay finds places and roommates for you, in any language, in seconds." },
  ];

  return (
    <section className="px-2 pt-2 md:px-4 md:pt-3">
      <div className="relative overflow-hidden rounded-[32px] bg-brand-deep">
        <Image src={HERO_IMAGE} alt="A bright, elegant furnished living room" fill priority sizes="100vw" className="object-cover" />
        {HERO_VIDEO && <video className="absolute inset-0 h-full w-full object-cover" src={HERO_VIDEO} autoPlay muted loop playsInline poster={HERO_IMAGE} aria-hidden />}
        {/* Tint: deep on the text side, lighter where the room shows. */}
        <div className="absolute inset-0 bg-[linear-gradient(100deg,rgb(9_44_34/0.9)_0%,rgb(9_44_34/0.72)_45%,rgb(9_44_34/0.35)_100%)]" aria-hidden />

        <div className="relative mx-auto max-w-[1240px] px-5 pb-8 pt-14 md:px-10 md:pb-10 md:pt-20">
          <div className="grid grid-cols-1 items-end gap-10 lg:grid-cols-[minmax(0,1fr)_340px]">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3.5 py-1.5 text-[12.5px] font-semibold text-white backdrop-blur">
                <span className="h-1.5 w-1.5 rounded-full bg-[#6ee7b7] shadow-[0_0_10px_#6ee7b7]" /> Luxury spaces · Affordable rent · Smart living
              </span>
              <h1 className="font-display mt-6 text-[44px] leading-[0.98] text-white sm:text-[62px] lg:text-[80px]">
                Live like it’s luxury.
                <br />
                <span className="bg-[linear-gradient(90deg,#8fe3bd,#d9fbe9)] bg-clip-text text-transparent">Pay like it’s shared.</span>
              </h1>
              <p className="mt-5 max-w-[560px] text-[16.5px] leading-relaxed text-white/85 md:text-[18px]">
                Furnished rooms, partitions and studios across the UAE from <span className="font-semibold text-white">{aed(from)}</span> a month, often with bills, Wi-Fi and cleaning included. No commission, no surprises.
              </p>
            </div>

            <button
              onClick={() => openShay()}
              className="group hidden rounded-[28px] border border-white/15 bg-white/10 p-5 text-left text-white backdrop-blur-md transition-colors hover:bg-white/15 lg:block"
            >
              <div className="flex items-center gap-4">
                <Shay size={72} mood="happy" />
                <div>
                  <p className="text-[12px] font-bold uppercase tracking-[0.12em] text-[#8fe3bd]">Smart living</p>
                  <p className="text-[17px] font-bold leading-snug">Hi, I’m Shay</p>
                </div>
              </div>
              <p className="mt-4 rounded-[18px] rounded-tl-[6px] bg-white px-4 py-3 text-[14.5px] leading-snug text-ink">Tell me your budget and where you work. I’ll find your place in seconds, in any language.</p>
              <span className="mt-4 inline-flex h-10 items-center gap-2 rounded-full bg-[#6ee7b7] px-4 text-[14px] font-bold text-brand-deep">
                Ask Shay <Icon name="arrow-right" size={15} />
              </span>
            </button>
          </div>

          <div className="mt-10 max-w-[1060px]">
            <div className="mb-3 inline-flex rounded-full bg-white/12 p-1 backdrop-blur" role="tablist" aria-label="I want to">
              {(
                [
                  ["rent", "Find a place"],
                  ["list", "List your place"],
                ] as const
              ).map(([m, label]) => (
                <button
                  key={m}
                  role="tab"
                  aria-selected={mode === m}
                  onClick={() => setMode(m)}
                  className={`h-9 rounded-full px-5 text-[14px] font-semibold transition-colors ${mode === m ? "bg-white text-brand" : "text-white/85 hover:text-white"}`}
                >
                  {label}
                </button>
              ))}
            </div>

            {mode === "rent" ? (
              <SearchBar />
            ) : (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  router.push(`/list?type=${ownerType}`);
                }}
                className="grid grid-cols-1 gap-3 rounded-[22px] bg-white p-3 shadow-[0_20px_50px_rgb(0_0_0/0.25)] md:grid-cols-[1fr_auto] md:items-center"
              >
                <div className="flex flex-wrap items-center gap-2 px-2">
                  <span className="w-full text-[12.5px] font-semibold text-ink md:w-auto md:pr-2">What are you renting out?</span>
                  {OWNER_TYPES.map((t) => (
                    <button
                      type="button"
                      key={t}
                      onClick={() => setOwnerType(t)}
                      aria-pressed={ownerType === t}
                      className={`h-10 rounded-full border px-4 text-[14px] font-medium ${ownerType === t ? "border-brand bg-brand text-white" : "border-line text-ink-2"}`}
                    >
                      {TYPE_LABEL[t]}
                    </button>
                  ))}
                </div>
                <button type="submit" className="flex h-12 items-center justify-center gap-2 rounded-[14px] bg-fresh px-6 text-[15px] font-semibold text-white hover:brightness-95">
                  List for free <Icon name="arrow-right" size={16} />
                </button>
              </form>
            )}

            <div className="mt-4 flex flex-wrap items-center gap-2 text-[13px] text-white/75">
              <span className="mr-1">Popular:</span>
              {popular.map((slug) => {
                const a = AREA_BY_SLUG.get(slug);
                return a ? (
                  <Link key={slug} href={`/search?area=${slug}`} className="rounded-full border border-white/25 px-3 py-1 text-white/90 hover:border-white hover:text-white">
                    {a.name}
                  </Link>
                ) : null;
              })}
              <button onClick={() => openShay()} className="flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 font-semibold text-white hover:bg-white/25 lg:hidden">
                <Shay size={16} glow={false} /> Ask Shay
              </button>
            </div>
          </div>

          <div className="mt-12 grid grid-cols-1 gap-3 md:grid-cols-3">
            {pillars.map((p) => (
              <div key={p.title} className="flex items-start gap-3 rounded-[22px] border border-white/12 bg-white/8 p-4 text-white backdrop-blur-md">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[14px] bg-[#6ee7b7]/20 text-[#8fe3bd]">
                  <Icon name={p.icon} size={19} />
                </span>
                <span>
                  <span className="block text-[15.5px] font-bold">{p.title}</span>
                  <span className="mt-0.5 block text-[13.5px] leading-snug text-white/75">{p.text}</span>
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
