import type { Metadata } from "next";
import { DocPage } from "@/components/doc-page";
import { Cta, DealList } from "@/components/seo-blocks";
import { JsonLd } from "@/components/json-ld";
import { getAllListings } from "@/lib/store";
import { itemListLd } from "@/lib/seo";
import { rankDeals } from "@stayshay/core";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Best rental deals in Dubai this week: cheap bed spaces, rooms & studios",
  description: "Shay ranks every live Stayshay listing against the going rate for its area and type. Below-market rent, bills included, no deposit and near the metro.",
  alternates: { canonical: "/deals" },
};

export default async function DealsPage() {
  const all = await getAllListings();
  return (
    <DocPage
      eyebrow="Shay’s best deals"
      title="Below-market places, ranked."
      intro="Shay compares every live listing with the typical price for the same kind of place in the same area, then adds points for bills included, no deposit, no fees and a short walk to the metro. Updated continuously."
    >
      <JsonLd data={itemListLd("Best rental deals on Stayshay", rankDeals(all, 30).map((d) => d.listing))} />
      <DealList listings={all} n={30} />
      <Cta kind="ai" />
    </DocPage>
  );
}
