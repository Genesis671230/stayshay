"use client";

import Image from "next/image";
import Link from "next/link";
import { AREAS, AREA_BY_SLUG, PHOTOS, coverFor, fromPriceByType, median, type Listing, type ListingType } from "@stayshay/core/src/client.ts";
import { Icon, aed } from "./ui";
import { ListingCard } from "./listing-card";
import { useMarketplace } from "./marketplace";

const CATS: { type: ListingType; title: string; line: string }[] = [
  { type: "bed_space", title: "Bed space", line: "Shared room, your own bed." },
  { type: "partition", title: "Partition", line: "Your own partitioned space." },
  { type: "room", title: "Private room", line: "Your own door in a shared flat." },
  { type: "studio", title: "Studio & flats", line: "A place that’s all yours." },
];


const BENTO = ["md:col-span-2 md:row-span-2 col-span-2", "md:col-span-2 col-span-2", "col-span-1", "col-span-1"];

export function Categories() {
  const { all: LISTINGS } = useMarketplace();
  const from = fromPriceByType(LISTINGS);
  const count = (t: ListingType) => LISTINGS.filter((l) => l.type === t).length;
  return (
    <section className="mx-auto max-w-[1240px] px-4 pt-16 md:px-8 md:pt-24">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="eyebrow">Browse by type</p>
          <h2 className="font-display mt-2 text-[32px] leading-[1.08] md:text-[44px]">Find your place</h2>
        </div>
        <p className="max-w-[380px] text-[15px] text-muted">From a shared bed near the metro to a studio of your own. Every price shown is the real monthly rent.</p>
      </div>
      <div className="mt-8 grid grid-cols-2 gap-3 md:h-[540px] md:grid-cols-4 md:grid-rows-2 md:gap-4">
        {CATS.map((c, i) => (
          <Link
            key={c.type}
            href={`/search?type=${c.type}`}
            className={`group relative min-h-[180px] overflow-hidden rounded-[24px] bg-surface ${i === 0 ? "min-h-[260px]" : ""} ${BENTO[i]}`}
          >
            <Image src={PHOTOS.categories[c.type] ?? coverFor(LISTINGS, c.type, i) ?? ""} alt="" fill sizes={i === 0 ? "(min-width:768px) 50vw, 100vw" : "(min-width:768px) 25vw, 50vw"} className="object-cover transition-transform duration-700 group-hover:scale-[1.04]" />
            <span className="absolute inset-x-2 bottom-2 flex items-end justify-between gap-3 rounded-[18px] bg-white/95 p-3.5 backdrop-blur md:inset-x-3 md:bottom-3 md:p-4">
              <span className="min-w-0">
                <span className={`block font-bold tracking-[-0.02em] text-ink ${i === 0 ? "text-[20px] md:text-[24px]" : "text-[15px] md:text-[17px]"}`}>{c.title}</span>
                <span className="mt-0.5 block truncate text-[12.5px] text-muted">
                  {count(c.type)} places{from[c.type] != null ? ` · from ${aed(from[c.type]!)}` : ""}
                </span>
                {i === 0 && <span className="mt-1 hidden text-[13.5px] text-ink-2 md:block">{c.line}</span>}
              </span>
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand text-white transition-transform group-hover:translate-x-0.5">
                <Icon name="arrow-right" size={16} />
              </span>
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}

function Rail({ title, sub, href, items }: { title: string; sub: string; href: string; items: Listing[] }) {
  if (items.length < 2) return null;
  return (
    <div className="mt-14 first:mt-0">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h3 className="font-display text-[24px] leading-tight md:text-[30px]">{title}</h3>
          <p className="mt-1 text-[14px] text-muted">{sub}</p>
        </div>
        <Link href={href} className="flex h-10 shrink-0 items-center gap-1.5 rounded-[12px] border border-line px-4 text-[14px] font-semibold text-brand hover:border-brand">
          See all <Icon name="arrow-right" size={14} />
        </Link>
      </div>
      <div className="roomie-scroll -mx-4 mt-6 flex gap-4 overflow-x-auto px-4 pb-2 md:mx-0 md:grid md:grid-cols-4 md:overflow-visible md:px-0">
        {items.slice(0, 4).map((l) => (
          <div key={l.id} className="w-[78vw] shrink-0 sm:w-[44vw] md:w-auto">
            <ListingCard listing={l} />
          </div>
        ))}
      </div>
    </div>
  );
}

const newest = (a: Listing, b: Listing) => (b.postedAt ?? "").localeCompare(a.postedAt ?? "");

const SPOTLIGHT: Record<"partition" | "room", { eyebrow: string; title: string; line: string }> = {
  partition: { eyebrow: "Partitions", title: "Your own space, at a shared price.", line: "Private, furnished partitions in well-kept flats near the metro." },
  room: { eyebrow: "Private rooms", title: "Your own door. Your own pace.", line: "Furnished private rooms in shared apartments, kitchen and living room included." },
};

/** Homepage section for one type: headline, typical price, up to 8 real listings with photos. */
export function TypeSpotlight({ type, tone = "light" }: { type: "partition" | "room"; tone?: "light" | "tint" }) {
  const { all: LISTINGS } = useMarketplace();
  const of = LISTINGS.filter((l) => l.type === type);
  const items = of.filter((l) => l.photos.length >= 3).sort(newest).slice(0, 8);
  if (items.length < 2) return null;
  const c = SPOTLIGHT[type];
  const typical = median(of.map((l) => l.priceAed));
  const from = of.length ? Math.min(...of.map((l) => l.priceAed)) : null;
  return (
    <section className={tone === "tint" ? "bg-[#f3f7f4]" : ""}>
      <div className="mx-auto max-w-[1240px] px-4 py-14 md:px-8 md:py-20">
        <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="eyebrow">{c.eyebrow}</p>
            <h2 className="font-display mt-2 max-w-[620px] text-[32px] leading-[1.04] md:text-[48px]">{c.title}</h2>
            <p className="mt-3 max-w-[520px] text-[15.5px] text-ink-2">{c.line}</p>
          </div>
          <div className="flex items-center gap-6">
            <dl className="flex gap-6">
              {from != null && (
                <div>
                  <dt className="text-[12px] text-muted">From</dt>
                  <dd className="font-figure text-[22px] font-bold">{aed(from)}</dd>
                </div>
              )}
              {typical != null && (
                <div>
                  <dt className="text-[12px] text-muted">Typical</dt>
                  <dd className="font-figure text-[22px] font-bold">{aed(typical)}</dd>
                </div>
              )}
              <div>
                <dt className="text-[12px] text-muted">Available</dt>
                <dd className="font-figure text-[22px] font-bold">{of.length}</dd>
              </div>
            </dl>
            <Link href={`/search?type=${type}`} className="hidden h-11 shrink-0 items-center gap-2 rounded-full bg-ink px-5 text-[14.5px] font-semibold text-white hover:bg-brand-deep md:inline-flex">
              See all <Icon name="arrow-right" size={14} />
            </Link>
          </div>
        </div>
        <div className="roomie-scroll -mx-4 mt-8 flex gap-4 overflow-x-auto px-4 pb-2 md:mx-0 md:grid md:grid-cols-4 md:overflow-visible md:px-0">
          {items.map((l) => (
            <div key={l.id} className="w-[78vw] shrink-0 sm:w-[44vw] md:w-auto">
              <ListingCard listing={l} />
            </div>
          ))}
        </div>
        <Link href={`/search?type=${type}`} className="mt-6 flex h-12 items-center justify-center gap-2 rounded-full bg-ink text-[15px] font-semibold text-white md:hidden">
          See all {c.eyebrow.toLowerCase()} <Icon name="arrow-right" size={14} />
        </Link>
      </div>
    </section>
  );
}

export function Rails() {
  const { all: LISTINGS } = useMarketplace();
  const rich = LISTINGS.filter((l) => l.photos.length >= 3);
  const bed = rich.filter((l) => l.type === "bed_space").sort(newest);
  const allIn = rich.filter((l) => l.billsIncluded && !l.deposit).sort(newest);

  return (
    <section className="mx-auto max-w-[1240px] px-4 py-16 md:px-8 md:py-24">
      <Rail title="Fresh bed spaces" sub={`Typically ${aed(median(LISTINGS.filter((l) => l.type === "bed_space").map((l) => l.priceAed)) ?? 0)} a month`} href="/search?type=bed_space&sort=newest" items={bed} />
      <Rail title="Bills included, no deposit" sub="Move in with just the first month" href="/search?bills=1&nodeposit=1" items={allIn} />
    </section>
  );
}

export function Areas() {
  const { all: LISTINGS } = useMarketplace();
  const counts = LISTINGS.reduce<Record<string, number>>((acc, l) => ((acc[l.areaSlug] = (acc[l.areaSlug] ?? 0) + 1), acc), {});
  const top = Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .map(([s]) => s)
    .filter((s) => AREA_BY_SLUG.has(s))
    .slice(0, 8);
  const photoFor = (slug: string) => PHOTOS.areas[slug] ?? LISTINGS.find((l) => l.areaSlug === slug && l.photos.length)?.photos[0] ?? "";
  const emirates = [...new Set(AREAS.filter((a) => counts[a.slug]).map((a) => a.emirate))];

  return (
    <section className="mx-auto max-w-[1240px] px-4 py-16 md:px-8 md:py-24">
      <p className="eyebrow">Neighbourhoods</p>
      <h2 className="font-display mt-2 text-[34px] leading-[1.08] md:text-[44px]">Neighbourhoods</h2>
      <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-4">
        {top.map((slug) => {
          const a = AREA_BY_SLUG.get(slug)!;
          const m = median(LISTINGS.filter((l) => l.areaSlug === slug).map((l) => l.priceAed));
          return (
            <Link key={slug} href={`/search?area=${slug}`} className="group relative aspect-[4/3] overflow-hidden rounded-[18px] bg-surface">
              <Image src={photoFor(slug)} alt={`${a.name}, ${a.emirate}`} fill sizes="(min-width:768px) 25vw, 50vw" className="object-cover transition-transform duration-700 group-hover:scale-[1.03]" />
              <span className="absolute inset-x-2 bottom-2 rounded-[14px] bg-white/95 px-3 py-2.5 text-ink">
                <span className="block text-[14.5px] font-bold">{a.name}</span>
                <span className="block text-[12px] text-muted">
                  {counts[slug]} places{m ? ` · typically ${aed(m)}` : ""}
                </span>
              </span>
            </Link>
          );
        })}
      </div>
      <div className="mt-10 grid grid-cols-1 gap-8 border-t border-line pt-8 sm:grid-cols-2 lg:grid-cols-4">
        {emirates.map((em) => (
          <div key={em}>
            <p className="text-[13px] font-semibold">{em}</p>
            <ul className="mt-2 space-y-1.5">
              {AREAS.filter((a) => a.emirate === em && counts[a.slug])
                .sort((a, b) => (counts[b.slug] ?? 0) - (counts[a.slug] ?? 0))
                .slice(0, 10)
                .map((a) => (
                  <li key={a.slug}>
                    <Link href={`/search?area=${a.slug}`} className="text-[13.5px] text-muted hover:text-ink">
                      {a.name} <span className="font-figure text-[12px]">({counts[a.slug]})</span>
                    </Link>
                  </li>
                ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}

