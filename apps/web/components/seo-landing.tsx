import Link from "next/link";
import { AREAS, TYPE_LABEL_PLURAL, type Area, type Listing, type ListingType } from "@stayshay/core";
import { Header } from "./header";
import { Footer } from "./sections";
import { MarketplaceProvider } from "./marketplace";
import { JsonLd } from "./json-ld";
import { Cta, Faq, ListingGrid, PriceTable } from "./seo-blocks";
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
}) {
  const stats = priceStats(listings);
  const billsShare = listings.length ? Math.round((listings.filter((l) => l.billsIncluded).length / listings.length) * 100) : 0;
  const busiest = liveAreas(all.filter((l) => !type || l.type === type)).slice(0, 16);
  const near = area ? nearbyAreas(area).filter((a) => all.some((l) => l.areaSlug === a.slug && (!type || l.type === type))) : [];
  const fallback = !listings.length ? all.filter((l) => (!type || l.type === type) && near.some((a) => a.slug === l.areaSlug)).slice(0, 6) : [];

  return (
    <MarketplaceProvider listings={all}>
      <JsonLd data={[breadcrumbLd(crumbs), itemListLd(h1, listings), ...(faq.length ? [faqLd(faq)] : [])]} />
      <Header />
      <main>
        <section className="px-2 pt-2 md:px-4 md:pt-3">
          <div className="rounded-[28px] bg-brand px-5 py-12 md:px-10 md:py-16">
            <div className="mx-auto max-w-[1180px]">
              <nav className="flex flex-wrap items-center gap-1.5 text-[13px] text-white/70" aria-label="Breadcrumb">
                {crumbs.map(([name, href], i) => (
                  <span key={href} className="flex items-center gap-1.5">
                    {i > 0 && <Icon name="chevron-right" size={12} />}
                    {i < crumbs.length - 1 ? <Link href={href} className="hover:text-white">{name}</Link> : <span className="text-white">{name}</span>}
                  </span>
                ))}
              </nav>
              <p className="mt-6 text-[12px] font-bold uppercase tracking-[0.12em] text-[#8fe3bd]">{eyebrow}</p>
              <h1 className="font-display mt-3 max-w-[900px] text-[34px] leading-[1.05] text-white md:text-[52px]">{h1}</h1>
              <p className="mt-4 max-w-[720px] text-[16.5px] leading-relaxed text-white/85">{intro}</p>
              {stats && (
                <dl className="mt-8 flex flex-wrap gap-x-10 gap-y-4 text-white">
                  <div><dt className="text-[12px] text-white/60">Live now</dt><dd className="font-figure text-[26px] font-bold">{stats.count}</dd></div>
                  <div><dt className="text-[12px] text-white/60">From</dt><dd className="font-figure text-[26px] font-bold">{aed(stats.min)}<span className="text-[14px] font-medium text-white/70">/mo</span></dd></div>
                  <div><dt className="text-[12px] text-white/60">Typical</dt><dd className="font-figure text-[26px] font-bold">{aed(stats.median)}</dd></div>
                  <div><dt className="text-[12px] text-white/60">Bills included</dt><dd className="font-figure text-[26px] font-bold">{billsShare}%</dd></div>
                </dl>
              )}
            </div>
          </div>
        </section>

        <div className="mx-auto max-w-[1240px] px-4 py-12 md:px-8">
          {listings.length ? (
            <>
              <div className="flex flex-wrap items-end justify-between gap-4">
                <h2 className="font-display text-[26px]">{listings.length} {listings.length === 1 ? "place" : "places"} available</h2>
                <Link href={`/search?${new URLSearchParams({ ...(type && { type }), ...(area && { area: area.slug }) })}`} className="text-[14px] font-medium underline underline-offset-4">
                  Filter & map view
                </Link>
              </div>
              <ListingGrid listings={listings.slice(0, 48)} />
            </>
          ) : (
            <div className="rounded-[18px] bg-surface p-6">
              <p className="text-[17px] font-semibold">Nothing live here right this minute.</p>
              <p className="mt-1 text-[15px] text-ink-2">New places come in every day. Tell us what you need and we’ll WhatsApp you the moment one fits, or look nearby:</p>
              <ListingGrid listings={fallback} />
            </div>
          )}

          <Cta kind="find" />

          {type && !area && (
            <section className="mt-12">
              <h2 className="font-display text-[26px]">{TYPE_LABEL_PLURAL[type]} prices by area</h2>
              <PriceTable listings={all} type={type} limit={20} />
            </section>
          )}

          {area && (
            <section className="mt-12">
              <h2 className="font-display text-[22px]">More in {area.name}</h2>
              <div className="mt-4 flex flex-wrap gap-2">
                {!!type && (
                  <Link href={`/areas/${area.slug}`} className="rounded-full border border-line px-4 py-2 text-[14px] hover:border-brand">
                    Everything in {area.name}
                  </Link>
                )}
                {RENT_TYPES.filter((t) => t !== type).map((t) => (
                  <Link key={t} href={rentPath(t, area.slug)} className="rounded-full border border-line px-4 py-2 text-[14px] hover:border-brand">
                    {TYPE_LABEL_PLURAL[t]} in {area.name}
                  </Link>
                ))}
              </div>
              {!!near.length && (
                <>
                  <h2 className="font-display mt-10 text-[22px]">{type ? TYPE_LABEL_PLURAL[type] : "Places"} near {area.name}</h2>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {near.map((a) => (
                      <Link key={a.slug} href={type ? rentPath(type, a.slug) : `/areas/${a.slug}`} className="rounded-full border border-line px-4 py-2 text-[14px] hover:border-brand">
                        {a.name}
                      </Link>
                    ))}
                  </div>
                </>
              )}
            </section>
          )}

          <section className="mt-12">
            <h2 className="font-display text-[22px]">Popular areas{type ? ` for ${TYPE_LABEL_PLURAL[type].toLowerCase()}` : ""}</h2>
            <div className="mt-4 flex flex-wrap gap-2">
              {busiest.map(({ area: a, count }) => (
                <Link key={a.slug} href={type ? rentPath(type, a.slug) : `/areas/${a.slug}`} className="rounded-full border border-line px-4 py-2 text-[14px] hover:border-brand">
                  {a.name} <span className="text-muted">({count})</span>
                </Link>
              ))}
            </div>
          </section>

          <div className="max-w-[820px]">
            <Faq faq={faq} />
          </div>
        </div>
      </main>
      <Footer />
    </MarketplaceProvider>
  );
}
