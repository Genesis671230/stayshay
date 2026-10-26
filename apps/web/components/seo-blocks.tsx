import Link from "next/link";
import { AREAS, AREA_BY_SLUG, TYPE_LABEL_PLURAL, filterListings, rankDeals, type Listing, type ListingType } from "@stayshay/core";
import type { Block } from "@/lib/blog";
import { liveAreas, priceStats, rentPath } from "@/lib/seo";
import { ListingCard } from "./listing-card";
import { Icon, aed } from "./ui";

/** "[text](/path)" links and "**bold**" inside plain strings. */
export function Inline({ text }: { text: string }) {
  const parts = text.split(/(\[[^\]]+\]\([^)]+\)|\*\*[^*]+\*\*)/g);
  return (
    <>
      {parts.map((part, i) => {
        const link = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
        if (link) return /^https?:/.test(link[2]) ? <a key={i} href={link[2]} target="_blank" rel="noopener noreferrer">{link[1]}</a> : <Link key={i} href={link[2]}>{link[1]}</Link>;
        const bold = part.match(/^\*\*([^*]+)\*\*$/);
        if (bold) return <strong key={i}>{bold[1]}</strong>;
        return part;
      })}
    </>
  );
}

export function ListingGrid({ listings }: { listings: Listing[] }) {
  if (!listings.length) return null;
  return (
    <div className="not-prose my-8 grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
      {listings.map((l) => (
        <ListingCard key={l.id} listing={l} />
      ))}
    </div>
  );
}

/** Live "from / typical / count" table per area for one kind of place, cheapest first. */
export function PriceTable({ listings, type, limit = 12 }: { listings: Listing[]; type: ListingType; limit?: number }) {
  const rows = liveAreas(listings.filter((l) => l.type === type))
    .map(({ area }) => ({ area, s: priceStats(listings.filter((l) => l.type === type && l.areaSlug === area.slug))! }))
    .sort((a, b) => a.s.min - b.s.min)
    .slice(0, limit);
  if (!rows.length) return null;
  return (
    <div className="not-prose my-6 overflow-x-auto rounded-[16px] border border-line">
      <table className="w-full min-w-[420px] text-left text-[14px]">
        <caption className="sr-only">{TYPE_LABEL_PLURAL[type]} prices by area</caption>
        <thead className="bg-surface text-[12px] uppercase tracking-wide text-muted">
          <tr>
            <th className="px-4 py-3 font-semibold">Area</th>
            <th className="px-4 py-3 font-semibold">From / month</th>
            <th className="px-4 py-3 font-semibold">Typical</th>
            <th className="px-4 py-3 font-semibold">Live</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(({ area, s }) => (
            <tr key={area.slug} className="border-t border-line">
              <td className="px-4 py-3">
                <Link href={rentPath(type, area.slug)} className="font-medium text-brand underline-offset-4 hover:underline">
                  {area.name}
                </Link>
                <span className="text-muted">, {area.emirate}</span>
              </td>
              <td className="font-figure px-4 py-3 font-semibold">{aed(s.min)}</td>
              <td className="font-figure px-4 py-3">{aed(s.median)}</td>
              <td className="px-4 py-3 text-muted">{s.count}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function DealList({ listings, n }: { listings: Listing[]; n: number }) {
  const deals = rankDeals(listings, n);
  return (
    <div className="not-prose my-8 grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
      {deals.map((d) => (
        <div key={d.listing.id}>
          <ListingCard listing={d.listing} />
          {!!d.reasons.length && <p className="mt-2 text-[13px] font-medium text-fresh">{d.reasons.slice(0, 3).join(" · ")}</p>}
        </div>
      ))}
    </div>
  );
}

const CTAS = {
  find: { title: "Tell us what you need", body: "Budget, area and move-in date. We'll WhatsApp you matching places, free.", href: "/find", label: "Find me a room" },
  list: { title: "List your place for free", body: "Reviewed by our team and shown to renters across the UAE.", href: "/list", label: "List your place" },
  roommates: { title: "Find a roommate", body: "Browse people already looking, or add your own profile.", href: "/roommates", label: "Open the roommate board" },
  deals: { title: "See today's best deals", body: "Shay ranks every live listing against the going rate for its area.", href: "/deals", label: "Best deals" },
  ai: { title: "Ask Shay, here or in ChatGPT and Claude", body: "Search live Stayshay listings in plain words, wherever you chat.", href: "/ai", label: "How it works" },
} as const;

export function Cta({ kind }: { kind: keyof typeof CTAS }) {
  const c = CTAS[kind];
  return (
    <div className="not-prose my-10 flex flex-col items-start gap-4 rounded-[22px] bg-mint p-6 md:flex-row md:items-center md:justify-between">
      <div>
        <p className="text-[18px] font-bold text-ink">{c.title}</p>
        <p className="mt-1 text-[14.5px] text-ink-2">{c.body}</p>
      </div>
      <Link href={c.href} className="inline-flex h-11 shrink-0 items-center gap-2 rounded-[12px] bg-brand px-5 text-[14.5px] font-semibold text-white hover:bg-brand-deep">
        {c.label} <Icon name="chevron-right" size={16} />
      </Link>
    </div>
  );
}

export function Blocks({ blocks, listings }: { blocks: Block[]; listings: Listing[] }) {
  return (
    <>
      {blocks.map((b, i) => {
        if ("h2" in b) return <h2 key={i}>{b.h2}</h2>;
        if ("p" in b) return <p key={i}><Inline text={b.p} /></p>;
        if ("ul" in b) return <ul key={i}>{b.ul.map((t, j) => <li key={j}><Inline text={t} /></li>)}</ul>;
        if ("ol" in b) return <ol key={i} className="ml-5 list-decimal">{b.ol.map((t, j) => <li key={j}><Inline text={t} /></li>)}</ol>;
        if ("tip" in b) return <p key={i} className="rounded-[14px] border border-line bg-surface px-4 py-3"><strong>Tip: </strong><Inline text={b.tip} /></p>;
        if ("prices" in b) return <PriceTable key={i} listings={listings} type={b.prices} limit={b.limit} />;
        if ("deals" in b) return <DealList key={i} listings={listings} n={b.deals} />;
        if ("cta" in b) return <Cta key={i} kind={b.cta} />;
        const q = b.listings;
        const found = filterListings(listings, AREAS, {
          types: q.type ? [q.type] : undefined,
          areaSlugs: q.area && AREA_BY_SLUG.has(q.area) ? [q.area] : undefined,
          maxPrice: q.maxPrice,
          gender: q.gender,
          billsIncluded: q.billsIncluded,
        });
        return <ListingGrid key={i} listings={found.slice(0, q.limit ?? 6)} />;
      })}
    </>
  );
}

export function Faq({ faq }: { faq: [string, string][] }) {
  if (!faq.length) return null;
  return (
    <section className="not-prose mt-12">
      <h2 className="font-display text-[26px]">Frequently asked questions</h2>
      <div className="mt-4 divide-y divide-line rounded-[18px] border border-line">
        {faq.map(([q, a]) => (
          <details key={q} className="group px-5 py-4">
            <summary className="cursor-pointer list-none text-[15.5px] font-semibold text-ink marker:hidden">{q}</summary>
            <p className="mt-2 text-[15px] leading-relaxed text-ink-2">{a}</p>
          </details>
        ))}
      </div>
    </section>
  );
}
