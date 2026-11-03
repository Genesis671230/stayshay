import type { Metadata } from "next";
import { SeoLanding } from "@/components/seo-landing";
import { getAllListings } from "@/lib/store";
import { landingFaq } from "@/lib/seo";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "StayFit: rooms, partitions and studios in Dubai with a gym or pool",
  description: "Monthly rooms, bed spaces, partitions and studios in Dubai buildings with a gym or swimming pool. Save on a gym membership by living where you train.",
  alternates: { canonical: "/stayfit" },
};

const fit = (l: { amenities: string[]; title: string; description?: string }) => l.amenities.includes("gym") || l.amenities.includes("pool") || /\b(gym|pool|fitness)\b/i.test(`${l.title} ${l.description ?? ""}`);

export default async function Page() {
  const all = await getAllListings();
  const listings = all.filter((l) => l.type !== "roommate" && fit(l)).sort((a, b) => a.priceAed - b.priceAed);
  return (
    <SeoLanding
      all={all}
      listings={listings}
      photo="/photos/area-jvc.jpg"
      eyebrow="StayFit"
      h1="Live where you train"
      intro="Rooms, partitions and studios in buildings with a gym or pool. A Dubai gym membership costs hundreds a month; these come with one downstairs."
      crumbs={[["Home", "/"], ["Tools", "/tools"], ["StayFit", "/stayfit"]]}
      faq={[["Is the gym included in the rent?", "In most buildings residents use the gym and pool free. Confirm access cards at the viewing."], ...landingFaq(listings)]}
    />
  );
}
