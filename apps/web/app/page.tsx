import type { Metadata } from "next";
import { Testimonials } from "@/components/testimonials";
import { FamilyStrip } from "@/components/family-strip";
import { ServicesShowcase } from "@/components/services-showcase";
import { CampaignBand } from "@/components/campaign-band";
import { WorkShowcase } from "@/components/work-showcase";
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
        <Testimonials />
        <FamilyStrip />
        <ServicesShowcase />
        <WorkShowcase compact className="py-12" />
        <Rails />
        <CampaignBand />
        <ToolsStrip />
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
