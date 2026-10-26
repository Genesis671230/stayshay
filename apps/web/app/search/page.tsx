import type { Metadata } from "next";
import { Header } from "@/components/header";
import { Explorer } from "@/components/explorer";
import { MarketplaceProvider } from "@/components/marketplace";
import { getAllListings } from "@/lib/store";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Search rooms, bed spaces, partitions and studios", description: "Search every live monthly bed space, partition, private room and studio on Stayshay by area, budget, metro and more.", alternates: { canonical: "/search" } };

export default async function SearchPage() {
  return (
    <MarketplaceProvider listings={await getAllListings()}>
      <Header />
      <main>
        <Explorer variant="search" />
      </main>
    </MarketplaceProvider>
  );
}
