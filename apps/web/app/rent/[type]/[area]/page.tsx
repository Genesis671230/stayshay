import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AREA_BY_SLUG, TYPE_LABEL_PLURAL } from "@stayshay/core";
import { SeoLanding } from "@/components/seo-landing";
import { getAllListings } from "@/lib/store";
import { TYPE_BY_SLUG, TYPE_KEYWORDS, landingFaq, priceStats, rentPath, typeTitle } from "@/lib/seo";

export const dynamic = "force-dynamic";

async function resolve(params: Promise<{ type: string; area: string }>) {
  const p = await params;
  const type = TYPE_BY_SLUG.get(p.type);
  const area = AREA_BY_SLUG.get(p.area);
  return type && area ? { type, area } : null;
}

export async function generateMetadata({ params }: { params: Promise<{ type: string; area: string }> }): Promise<Metadata> {
  const r = await resolve(params);
  if (!r) return {};
  const listings = (await getAllListings()).filter((l) => l.type === r.type && l.areaSlug === r.area.slug);
  const s = priceStats(listings);
  const title = `${typeTitle(r.type, r.area)}${s ? ` from AED ${s.min.toLocaleString("en-US")}` : ""}`;
  const description = s
    ? `${s.count} ${TYPE_LABEL_PLURAL[r.type].toLowerCase()} in ${r.area.name} from AED ${s.min.toLocaleString("en-US")}/month${r.area.nearMetro ? `, near ${r.area.nearMetro} metro` : ""}. Bills, deposit and rules shown up front. Book a viewing on WhatsApp.`
    : `${TYPE_LABEL_PLURAL[r.type]} for monthly rent in ${r.area.name}, ${r.area.emirate}. Get matched on WhatsApp when one becomes available.`;
  return {
    title,
    description,
    keywords: TYPE_KEYWORDS[r.type].map((k) => `${k} ${r.area.name}`),
    alternates: { canonical: rentPath(r.type, r.area.slug) },
    openGraph: { title, description, url: rentPath(r.type, r.area.slug), images: listings[0]?.photos[0] ? [listings[0].photos[0]] : undefined },
    // Empty combinations stay reachable for visitors but out of the index until they have listings.
    robots: s ? undefined : { index: false, follow: true },
  };
}

export default async function RentTypeAreaPage({ params }: { params: Promise<{ type: string; area: string }> }) {
  const r = await resolve(params);
  if (!r) notFound();
  const { type, area } = r;
  const all = await getAllListings();
  const listings = all.filter((l) => l.type === type && l.areaSlug === area.slug).sort((a, b) => a.priceAed - b.priceAed);
  const label = TYPE_LABEL_PLURAL[type];
  return (
    <SeoLanding
      all={all}
      listings={listings}
      type={type}
      area={area}
      eyebrow={`${area.name} · ${area.emirate}`}
      h1={typeTitle(type, area)}
      intro={`Monthly ${label.toLowerCase()} in ${area.name}${area.nearMetro ? `, close to ${area.nearMetro} metro` : ""}. See the real rent, deposit and bills, then book a viewing on WhatsApp. Free for renters.`}
      crumbs={[["Home", "/"], [label, rentPath(type)], [area.name, rentPath(type, area.slug)]]}
      faq={landingFaq(listings, type, area)}
    />
  );
}
