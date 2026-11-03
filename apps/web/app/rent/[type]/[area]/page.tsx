import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AREA_BY_SLUG, TYPE_LABEL_PLURAL } from "@stayshay/core";
import { SeoLanding } from "@/components/seo-landing";
import { getAllListings } from "@/lib/store";
import { COLLECTION_BY_SLUG, type Collection } from "@/lib/collections";
import { TYPE_BY_SLUG, TYPE_KEYWORDS, landingFaq, priceStats, rentPath, typeTitle } from "@/lib/seo";

export const dynamic = "force-dynamic";

async function resolve(params: Promise<{ type: string; area: string }>) {
  const p = await params;
  const type = TYPE_BY_SLUG.get(p.type);
  const area = AREA_BY_SLUG.get(p.area);
  return type && area ? { type, area } : null;
}

/** /rent/bed-space/ladies, /rent/partitions/couples ... : the "need" pages. */
async function resolveCollection(params: Promise<{ type: string; area: string }>) {
  const p = await params;
  const type = TYPE_BY_SLUG.get(p.type);
  const c = COLLECTION_BY_SLUG.get(p.area);
  return type && c && c.types.includes(type) ? { type, c } : null;
}

const named = (c: Collection, type: Parameters<typeof rentPath>[0]) => {
  const t = TYPE_LABEL_PLURAL[type];
  return c.pattern.replace("{type}", t.toLowerCase()).replace("{Type}", t);
};

const collectionListings = async (type: string, c: Collection) => (await getAllListings()).filter((l) => l.type === type && c.match(l)).sort((a, b) => a.priceAed - b.priceAed);

export async function generateMetadata({ params }: { params: Promise<{ type: string; area: string }> }): Promise<Metadata> {
  const col = await resolveCollection(params);
  if (col) {
    const listings = await collectionListings(col.type, col.c);
    const s = priceStats(listings);
    const label = TYPE_LABEL_PLURAL[col.type].toLowerCase();
    const title = `${named(col.c, col.type)}${s ? ` from AED ${s.min.toLocaleString("en-US")}` : ""}`;
    const path = `${rentPath(col.type)}/${col.c.slug}`;
    return {
      title,
      description: s ? `${s.count} ${label}: ${col.c.description}` : col.c.description,
      keywords: col.c.keywords,
      alternates: { canonical: path },
      openGraph: { title, url: path },
      robots: s ? undefined : { index: false, follow: true },
    };
  }
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
  const col = await resolveCollection(params);
  if (col) {
    const label = TYPE_LABEL_PLURAL[col.type];
    const listings = await collectionListings(col.type, col.c);
    return (
      <SeoLanding
        all={await getAllListings()}
        listings={listings}
        type={col.type}
        photo={col.c.photo}
        eyebrow={`${label} · ${col.c.slug.replace(/-/g, " ")}`}
        h1={named(col.c, col.type)}
        intro={col.c.intro}
        crumbs={[["Home", "/"], [label, rentPath(col.type)], [col.c.slug.replace(/-/g, " ").replace(/^\w/, (x) => x.toUpperCase()), `${rentPath(col.type)}/${col.c.slug}`]]}
        faq={[...col.c.faq, ...landingFaq(listings, col.type)]}
      />
    );
  }
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
