import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AREA_BY_SLUG } from "@stayshay/core";
import { SeoLanding } from "@/components/seo-landing";
import { getAllListings } from "@/lib/store";
import { STATION_BY_SLUG, nearStation } from "@/lib/collections";
import { landingFaq, priceStats } from "@/lib/seo";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ station: string }> }): Promise<Metadata> {
  const s = STATION_BY_SLUG.get((await params).station);
  if (!s) return {};
  const l = (await getAllListings()).filter((x) => nearStation(s, x));
  const st = priceStats(l);
  const title = `Bed space & rooms near ${s.name} metro${st ? ` from AED ${st.min.toLocaleString("en-US")}` : ""}`;
  return {
    title,
    description: `${st ? `${st.count} ` : ""}bed spaces, partitions, rooms and studios near ${s.name} metro station (${s.line} Line), Dubai. Monthly rent, bills and deposit shown. Free viewings, no broker fee.`,
    keywords: [`bed space near ${s.name} metro`, `partition near ${s.name} metro`, `room near ${s.name} metro station`, `${s.name} metro bed space`],
    alternates: { canonical: `/metro/${s.slug}` },
    robots: st ? undefined : { index: false, follow: true },
  };
}

export default async function Page({ params }: { params: Promise<{ station: string }> }) {
  const s = STATION_BY_SLUG.get((await params).station);
  if (!s) notFound();
  const all = await getAllListings();
  const listings = all.filter((x) => nearStation(s, x)).sort((a, b) => a.priceAed - b.priceAed);
  const areas = s.areas.map((a) => AREA_BY_SLUG.get(a)?.name).filter(Boolean).join(", ");
  return (
    <SeoLanding
      all={all}
      listings={listings}
      photo="/photos/metro-station.jpg"
      eyebrow={`${s.line} Line · Dubai Metro`}
      h1={`Bed spaces, partitions and rooms near ${s.name} metro`}
      intro={`Monthly places within walking distance of ${s.name} station${areas ? ` in ${areas}` : ""}. Real rent, deposit and bills on every listing, and viewings arranged for free.`}
      crumbs={[["Home", "/"], ["Metro", "/metro"], [s.name, `/metro/${s.slug}`]]}
      faq={[
        [`How much is a bed space near ${s.name} metro?`, listings.length ? `Right now from AED ${Math.min(...listings.map((l) => l.priceAed)).toLocaleString("en-US")} a month. See the live list on this page.` : "Nothing is listed right now. Tell us your budget and we'll WhatsApp you when one comes up."],
        ...landingFaq(listings),
      ]}
    />
  );
}
