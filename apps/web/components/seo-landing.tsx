import Image from "next/image";
import { WaButton } from "./wa-button";
import Link from "next/link";
import { AREAS, TYPE_LABEL, TYPE_LABEL_PLURAL, type Area, type Listing, type ListingType, PHOTOS } from "@stayshay/core/src/client.ts";
import { Header } from "./header";
import { Footer } from "./sections";
import { MarketplaceProvider } from "./marketplace";
import { slim } from "@/lib/store";
import { JsonLd } from "./json-ld";
import { Faq, ListingGrid, PriceTable } from "./seo-blocks";
import { Icon, aed } from "./ui";
import { RENT_TYPES, breadcrumbLd, faqLd, itemListLd, liveAreas, priceStats, rentPath } from "@/lib/seo";

function km(a: Area, b: Area) {
  const r = (x: number) => (x * Math.PI) / 180;
  const h = Math.sin(r(b.lat - a.lat) / 2) ** 2 + Math.cos(r(a.lat)) * Math.cos(r(b.lat)) * Math.sin(r(b.lng - a.lng) / 2) ** 2;
  return 2 * 6371 * Math.asin(Math.sqrt(h));
}

export function nearbyAreas(area: Area, n = 8): Area[] {
  return AREAS.filter((a) => a.slug !== area.slug)
    .sort((a, b) => km(area, a) - km(area, b))
    .slice(0, n);
}

/** Programmatic landing page: /rent/[type], /rent/[type]/[area], /areas/[area]. */
export function SeoLanding({
  all,
  listings,
  type,
  area,
  eyebrow,
  h1,
  intro,
  crumbs,
  faq,
  photo,
}: {
  all: Listing[];
  listings: Listing[];
  type?: ListingType;
  area?: Area;
  eyebrow: string;
  h1: string;
  intro: string;
  crumbs: [string, string][];
  faq: [string, string][];
  /** Hero photo override (metro and collection pages). */
  photo?: string;
}) {
  const stats = priceStats(listings);
  const billsShare = listings.length ? Math.round((listings.filter((l) => l.billsIncluded).length / listings.length) * 100) : 0;
  const busiest = liveAreas(all.filter((l) => !type || l.type === type)).slice(0, 16);
  const near = area ? nearbyAreas(area).filter((a) => all.some((l) => l.areaSlug === a.slug && (!type || l.type === type))) : [];
  const fallback = !listings.length ? all.filter((l) => (!type || l.type === type) && near.some((a) => a.slug === l.areaSlug)).slice(0, 6) : [];

  const heroPhoto = photo || (area && PHOTOS.areas[area.slug]) || (type && PHOTOS.categories[type]) || PHOTOS.hero[0];
  // Real photos of places on this page, cheapest first, one per listing. Falls back to the page photo.
  const shots = [...listings].filter((l) => l.photos.length).sort((x, y) => x.priceAed - y.priceAed).slice(0, 3);
  const cheapest = shots[0];
  const lead = intro.split(/(?<=[.!?])\s+/)[0];
  const waText = `Hi Stayshay, I'm looking for ${type ? `a ${TYPE_LABEL[type].toLowerCase()}` : "a place"}${area ? ` in ${area.name}` : ""}. Budget: … Move-in: …`;
  const searchHref = `/search?${new URLSearchParams({ ...(type && { type }), ...(area && { area: area.slug }) })}`;
  const pill = "inline-flex h-9 shrink-0 items-center rounded-full bg-surface px-3.5 text-[13.5px] text-ink-2";
  return (
    <MarketplaceProvider listings={slim(all)}>
      <JsonLd data={[breadcrumbLd(crumbs), itemListLd(h1, listings), ...(faq.length ? [faqLd(faq)] : [])]} />
      <Header />
      <main>
        <section className="mx-auto max-w-[1240px] px-4 pt-4 md:px-8 md:pt-8">
          <nav className="flex flex-wrap items-center gap-1.5 text-[12.5px] text-muted" aria-label="Breadcrumb">
            {crumbs.map(([name, href], i) => (
              <span key={href} className="flex items-center gap-1.5">
                {i > 0 && <Icon name="chevron-right" size={11} />}
                {i < crumbs.length - 1 ? <Link href={href} className="hover:text-ink">{name}</Link> : <span className="text-ink-2">{name}</span>}
              </span>
            ))}
          </nav>

          <div className="mt-4 grid grid-cols-1 items-center gap-6 md:mt-6 md:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] md:gap-12">
            {/* real photos */}
            <div className="relative order-first grid h-[230px] grid-cols-[1.4fr_1fr] grid-rows-2 gap-2 md:order-last md:h-[400px]">
              {(shots.length ? shots.map((l) => l.photos[0]) : [heroPhoto]).map((src, i, arr) => (
                <div key={src + i} className={`relative overflow-hidden rounded-[22px] bg-surface ${i === 0 ? (arr.length === 1 ? "col-span-2 row-span-2" : "row-span-2") : arr.length === 2 ? "row-span-2" : ""}`}>
                  <Image src={src} alt="" fill priority={i === 0} sizes="(min-width: 768px) 40vw, 70vw" className="object-cover" />
                </div>
              ))}
              {cheapest && (
                <Link href={`/listing/${cheapest.id.toLowerCase()}`} className="absolute bottom-3 left-3 rounded-[16px] bg-white/95 px-3.5 py-2.5 shadow-[0_10px_30px_rgb(0_0_0/0.15)] backdrop-blur">
                  <span className="block text-[11.5px] text-muted">Cheapest right now</span>
                  <span className="font-figure text-[17px] font-bold text-ink">{aed(cheapest.priceAed)}<span className="text-[12px] font-medium text-muted">/mo</span></span>
                </Link>
              )}
            </div>

            <div>
              {stats && (
                <span className="inline-flex items-center gap-2 rounded-full bg-mint px-3 py-1.5 text-[12.5px] font-semibold text-brand">
                  <span className="h-2 w-2 rounded-full bg-fresh" /> {stats.count} live now
                </span>
              )}
              <h1 className="font-display mt-3 text-[32px] leading-[1.05] text-ink md:text-[50px]">{h1}</h1>
              <p className="mt-3 max-w-[520px] text-[15.5px] leading-relaxed text-ink-2">{lead}</p>
              {stats && (
                <div className="roomie-scroll -mx-4 mt-5 flex gap-2 overflow-x-auto px-4 md:mx-0 md:flex-wrap md:px-0">
                  <span className={pill}>From&nbsp;<b className="font-figure text-ink">{aed(stats.min)}</b></span>
                  <span className={pill}>Typical&nbsp;<b className="font-figure text-ink">{aed(stats.median)}</b></span>
                  {billsShare > 0 && <span className={pill}><b className="text-ink">{billsShare}%</b>&nbsp;bills included</span>}
                </div>
              )}
              <div className="mt-6 grid grid-cols-2 gap-2.5 sm:flex">
                <WaButton text={waText} kind="ask" label={eyebrow} className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-whatsapp px-5 text-[15px] font-semibold text-white">
                  <Icon name="whatsapp" size={18} /> WhatsApp
                </WaButton>
                <Link href={searchHref} className="inline-flex h-12 items-center justify-center gap-2 rounded-full border border-line px-5 text-[15px] font-semibold text-ink hover:border-ink">
                  <Icon name="map" size={17} /> Map & filters
                </Link>
              </div>
            </div>
          </div>

          {!area && (
            <div className="roomie-scroll -mx-4 mt-8 flex gap-2 overflow-x-auto px-4 md:mx-0 md:px-0">
              {RENT_TYPES.map((t) => (
                <Link key={t} href={rentPath(t)} className={`inline-flex h-10 shrink-0 items-center rounded-full border px-4 text-[14px] font-semibold ${t === type ? "border-ink bg-ink text-white" : "border-line text-ink-2 hover:border-ink"}`}>
                  {TYPE_LABEL_PLURAL[t]}
                </Link>
              ))}
            </div>
          )}
        </section>

        <div className="mx-auto max-w-[1240px] px-4 pb-12 pt-4 md:px-8">
          {listings.length ? (
            <ListingGrid listings={listings.slice(0, 48)} />
          ) : (
            <div className="mt-6 rounded-[22px] bg-surface p-6">
              <p className="text-[17px] font-semibold">Nothing live here right now</p>
              <p className="mt-1 text-[15px] text-ink-2">New places come in every day. Here’s what’s close by:</p>
              <ListingGrid listings={fallback} />
            </div>
          )}

          {type && !area && (
            <details className="group mt-6 rounded-[22px] border border-line px-5 py-4">
              <summary className="flex cursor-pointer list-none items-center justify-between text-[16px] font-semibold">
                Prices by area <Icon name="chevron-down" size={18} className="transition group-open:rotate-180" />
              </summary>
              <PriceTable listings={all} type={type} limit={20} />
            </details>
          )}

          <section className="mt-10">
            <h2 className="text-[18px] font-bold">{area ? `Near ${area.name}` : "Popular areas"}</h2>
            <div className="roomie-scroll -mx-4 mt-3 flex gap-2 overflow-x-auto px-4 pb-1 md:mx-0 md:flex-wrap md:px-0">
              {(area && near.length ? near.map((a) => ({ area: a, count: 0 })) : busiest).map(({ area: a, count }) => (
                <Link key={a.slug} href={type ? rentPath(type, a.slug) : `/areas/${a.slug}`} className="inline-flex h-10 shrink-0 items-center gap-1.5 rounded-full border border-line px-4 text-[14px] hover:border-ink">
                  {a.name} {count > 0 && <span className="text-muted">{count}</span>}
                </Link>
              ))}
              {area &&
                RENT_TYPES.filter((t) => t !== type).map((t) => (
                  <Link key={t} href={rentPath(t, area.slug)} className="inline-flex h-10 shrink-0 items-center rounded-full bg-surface px-4 text-[14px] text-ink-2 hover:text-ink">
                    {TYPE_LABEL_PLURAL[t]} here
                  </Link>
                ))}
            </div>
          </section>

          <div className="max-w-[820px]">
            <Faq faq={faq} />
            <p className="mt-10 text-[13.5px] leading-relaxed text-muted">{intro}</p>
          </div>
        </div>
      </main>
      <Footer />
    </MarketplaceProvider>
  );
}
