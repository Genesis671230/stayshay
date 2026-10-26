import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { TYPE_LABEL_PLURAL } from "@stayshay/core";
import { SeoLanding } from "@/components/seo-landing";
import { getAllListings } from "@/lib/store";
import { TYPE_BY_SLUG, TYPE_KEYWORDS, landingFaq, priceStats, rentPath, typeTitle } from "@/lib/seo";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ type: string }> }): Promise<Metadata> {
  const type = TYPE_BY_SLUG.get((await params).type);
  if (!type) return {};
  const s = priceStats((await getAllListings()).filter((l) => l.type === type));
  const title = `${typeTitle(type)}${s ? ` from AED ${s.min.toLocaleString("en-US")}` : ""}`;
  const description = `${s ? `${s.count} ` : ""}verified ${TYPE_LABEL_PLURAL[type].toLowerCase()} for monthly rent in Dubai, Sharjah and across the UAE. Real prices, bills and deposit shown up front. Free for renters.`;
  return { title, description, keywords: TYPE_KEYWORDS[type], alternates: { canonical: rentPath(type) }, openGraph: { title, description, url: rentPath(type) } };
}

export default async function RentTypePage({ params }: { params: Promise<{ type: string }> }) {
  const type = TYPE_BY_SLUG.get((await params).type);
  if (!type) notFound();
  const all = await getAllListings();
  const listings = all.filter((l) => l.type === type).sort((a, b) => a.priceAed - b.priceAed);
  const label = TYPE_LABEL_PLURAL[type];
  return (
    <SeoLanding
      all={all}
      listings={listings}
      type={type}
      eyebrow={`${label} · Monthly`}
      h1={typeTitle(type)}
      intro={`Compare every live ${label.toLowerCase()} on Stayshay: monthly rent, deposit, bills and who can live there, before you message anyone. Cheapest first.`}
      crumbs={[["Home", "/"], [label, rentPath(type)]]}
      faq={landingFaq(listings, type)}
    />
  );
}
