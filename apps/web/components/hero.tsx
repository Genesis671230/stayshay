"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { AREA_BY_SLUG, TYPE_LABEL, type ListingType } from "@stayshay/core";
import { useMarketplace } from "./marketplace";
import { SearchBar } from "./search-bar";
import { Icon, aed } from "./ui";
import { listingHref } from "./listing-card";

// Full-bleed hero. Set NEXT_PUBLIC_HERO_VIDEO to an mp4 URL to play a muted loop over the photo.
const HERO_IMAGE = "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=2400&q=80&auto=format&fit=crop";
const HERO_VIDEO = process.env.NEXT_PUBLIC_HERO_VIDEO;

const OWNER_TYPES: ListingType[] = ["bed_space", "partition", "room", "studio"];

export function Hero() {
  const router = useRouter();
  const [mode, setMode] = useState<"rent" | "list">("rent");
  const [ownerType, setOwnerType] = useState<ListingType>("bed_space");
  const { all: LISTINGS } = useMarketplace();
  const POPULAR = [...new Set(LISTINGS.map((l) => l.areaSlug))]
    .map((s) => ({ s, n: LISTINGS.filter((l) => l.areaSlug === s).length }))
    .sort((a, b) => b.n - a.n)
    .slice(0, 5)
    .map((x) => x.s);
  const featured = LISTINGS.find((l) => l.type === "studio" && l.photos.length >= 4) ?? LISTINGS.find((l) => l.photos.length >= 3) ?? LISTINGS[0];
  const areas = new Set(LISTINGS.map((l) => l.areaSlug)).size;
  const noDeposit = LISTINGS.filter((l) => !l.deposit).length;
  const from = LISTINGS.length ? Math.min(...LISTINGS.map((l) => l.priceAed)) : 0;

  return (
    <section className="px-2 pt-2 md:px-4 md:pt-3">
      <div className="relative overflow-hidden rounded-[28px] bg-brand-deep">
        <Image src={HERO_IMAGE} alt="Dubai skyline at golden hour" fill priority sizes="100vw" className="object-cover" />
        {HERO_VIDEO && <video className="absolute inset-0 h-full w-full object-cover" src={HERO_VIDEO} autoPlay muted loop playsInline poster={HERO_IMAGE} aria-hidden />}
        {/* Solid tint (no gradient) keeps white type readable on any photo. */}
        <div className="absolute inset-0 bg-[#0c3a2c]/62" aria-hidden />

        <div className="relative mx-auto max-w-[1240px] px-5 pb-8 pt-16 md:px-10 md:pb-10 md:pt-24 lg:pt-28">
          <span className="inline-flex items-center gap-2 rounded-full bg-mint px-3.5 py-1.5 text-[12.5px] font-semibold text-brand">
            <Icon name="shield" size={14} /> Verified listings · clear monthly prices
          </span>
          <h1 className="font-display mt-6 max-w-[820px] text-[42px] leading-[1.02] text-white sm:text-[58px] lg:text-[76px]">
            Find your space.
            <br />
            <span className="text-[#8fe3bd]">Pay less. Live better.</span>
          </h1>
          <p className="mt-5 max-w-[560px] text-[16.5px] leading-relaxed text-white/85 md:text-[18px]">
            Bed spaces, partitions, rooms and studios across the UAE, from <span className="font-semibold text-white">{aed(from)}</span> a month. See the real price, deposit and bills before you message anyone.
          </p>

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
              {POPULAR.map((slug) => {
                const a = AREA_BY_SLUG.get(slug);
                return a ? (
                  <Link key={slug} href={`/search?area=${slug}`} className="rounded-full border border-white/25 px-3 py-1 text-white/90 hover:border-white hover:text-white">
                    {a.name}
                  </Link>
                ) : null;
              })}
            </div>
          </div>

          <div className="mt-14 flex flex-col gap-6 border-t border-white/15 pt-6 md:flex-row md:items-end md:justify-between">
            <dl className="grid grid-cols-3 gap-6 text-white md:gap-14">
              {[
                [LISTINGS.length.toLocaleString("en-US"), "places to rent"],
                [String(areas), "areas"],
                [noDeposit.toLocaleString("en-US"), "with no deposit"],
              ].map(([n, label]) => (
                <div key={label}>
                  <dt className="text-[28px] font-extrabold leading-none tracking-[-0.03em] md:text-[34px]">{n}</dt>
                  <dd className="mt-1.5 text-[12.5px] text-white/70 md:text-[13.5px]">{label}</dd>
                </div>
              ))}
            </dl>
            {featured && (
              <Link href={listingHref(featured)} className="flex items-center gap-3 rounded-[18px] bg-white/95 p-2.5 pr-4 shadow-lg backdrop-blur md:w-[360px]">
                <span className="relative h-14 w-14 shrink-0 overflow-hidden rounded-[12px] bg-surface">
                  <Image src={featured.photos[0]} alt="" fill sizes="56px" className="object-cover" />
                </span>
                <span className="min-w-0">
                  <span className="block text-[11.5px] font-semibold uppercase tracking-[0.08em] text-fresh">Just listed</span>
                  <span className="block truncate text-[14px] font-semibold text-ink">{featured.title}</span>
                  <span className="block text-[12.5px] text-muted">
                    {AREA_BY_SLUG.get(featured.areaSlug)?.name} · <span className="font-semibold text-ink">{aed(featured.priceAed)}</span>/mo
                  </span>
                </span>
              </Link>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
