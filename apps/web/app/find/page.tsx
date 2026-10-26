import type { Metadata } from "next";
import { FindFunnel } from "@/components/find-funnel";
import { MarketplaceProvider } from "@/components/marketplace";
import { getAllListings } from "@/lib/store";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Find me a room: tell us your budget and area, get matches on WhatsApp", description: "Tell Stayshay your budget, area and move-in date and get matching bed spaces, partitions, rooms and studios on WhatsApp. Free.", alternates: { canonical: "/find" } };

export default async function Page() {
  return (
    <MarketplaceProvider listings={await getAllListings()}>
      <FindFunnel />
    </MarketplaceProvider>
  );
}
