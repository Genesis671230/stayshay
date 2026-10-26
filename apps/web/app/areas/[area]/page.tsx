import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AREA_BY_SLUG } from "@stayshay/core";
import { SeoLanding } from "@/components/seo-landing";
import { getAllListings } from "@/lib/store";
import { landingFaq, priceStats } from "@/lib/seo";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ area: string }> }): Promise<Metadata> {
  const area = AREA_BY_SLUG.get((await params).area);
  if (!area) return {};
  const listings = (await getAllListings()).filter((l) => l.areaSlug === area.slug);
  const s = priceStats(listings);
  const title = `Rooms, bed spaces & studios for rent in ${area.name}, ${area.emirate}${s ? ` from AED ${s.min.toLocaleString("en-US")}` : ""}`;
  const description = `Monthly bed spaces, partitions, private rooms and studios in ${area.name}${area.nearMetro ? ` near ${area.nearMetro} metro` : ""}. Real prices, bills and deposit shown up front.`;
  return {
    title,
    description,
    keywords: [`room for rent ${area.name}`, `bed space ${area.name}`, `partition ${area.name}`, `studio ${area.name}`, `cheap apartment ${area.name}`, ...area.aliases.map((a) => `room ${a}`)],
    alternates: { canonical: `/areas/${area.slug}` },
    openGraph: { title, description, url: `/areas/${area.slug}`, images: listings[0]?.photos[0] ? [listings[0].photos[0]] : undefined },
    robots: s ? undefined : { index: false, follow: true },
  };
}

export default async function AreaPage({ params }: { params: Promise<{ area: string }> }) {
  const area = AREA_BY_SLUG.get((await params).area);
  if (!area) notFound();
  const all = await getAllListings();
  const listings = all.filter((l) => l.areaSlug === area.slug).sort((a, b) => a.priceAed - b.priceAed);
  return (
    <SeoLanding
      all={all}
      listings={listings}
      area={area}
      eyebrow={`${area.emirate}${area.nearMetro ? ` · ${area.nearMetro} metro` : ""}`}
      h1={`Monthly rooms, bed spaces & studios in ${area.name}`}
      intro={`Everything live in ${area.name}${area.aliases.length ? ` (${area.aliases.slice(0, 3).join(", ")})` : ""}: bed spaces, partitions, private rooms and studios with the full monthly cost shown.`}
      crumbs={[["Home", "/"], ["Areas", "/areas"], [area.name, `/areas/${area.slug}`]]}
      faq={landingFaq(listings, undefined, area)}
    />
  );
}
