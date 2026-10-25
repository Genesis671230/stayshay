import type { Metadata } from "next";
import { Header } from "@/components/header";
import { Footer } from "@/components/sections";
import { MarketplaceProvider } from "@/components/marketplace";
import { RoommatesPage } from "@/components/roommates-page";
import { getAllListings } from "@/lib/store";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Find a roommate in Dubai and the UAE | Stayshay" };

export default async function Page() {
  return (
    <MarketplaceProvider listings={await getAllListings()}>
      <Header />
      <RoommatesPage />
      <Footer />
    </MarketplaceProvider>
  );
}
