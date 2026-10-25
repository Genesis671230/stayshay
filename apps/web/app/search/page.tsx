import type { Metadata } from "next";
import { Header } from "@/components/header";
import { Explorer } from "@/components/explorer";
import { MarketplaceProvider } from "@/components/marketplace";

export const metadata: Metadata = { title: "Search rooms, bed spaces, partitions and studios | Stayshay" };

export default function SearchPage() {
  return (
    <MarketplaceProvider>
      <Header />
      <main>
        <Explorer variant="search" />
      </main>
    </MarketplaceProvider>
  );
}
