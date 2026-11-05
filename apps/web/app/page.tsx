import { FamilyStrip } from "@/components/family-strip";
import type { Metadata } from "next";
import { Header } from "@/components/header";
import { Hero } from "@/components/hero";
import { RoomFan } from "@/components/room-fan";
import { Areas, Categories, Rails } from "@/components/categories";
import { Faq, FinalCta, Footer, HowItWorks, ListerCta, ToolsStrip, Trust } from "@/components/sections";
import { MarketplaceProvider } from "@/components/marketplace";
import { getAllListings, slim } from "@/lib/store";

// Admin listings appear as soon as they are saved.
export const dynamic = "force-dynamic";

export const metadata: Metadata = { alternates: { canonical: "/" } };

export default async function Home() {
  return (
    <MarketplaceProvider listings={slim(await getAllListings())}>
      <Header />
      <main>
        <Hero />
        <Categories />
        <FamilyStrip />
        <ToolsStrip />
        <Rails />
        <HowItWorks />
        <Trust />
        <ListerCta />
        <Areas />
        <Faq />
        <FinalCta />
        <RoomFan />
      </main>
      <Footer />
    </MarketplaceProvider>
  );
}
