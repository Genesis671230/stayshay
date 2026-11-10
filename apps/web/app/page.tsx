import type { Metadata } from "next";
import { Testimonials } from "@/components/testimonials";
import { FamilyStrip } from "@/components/family-strip";
import { ServicesShowcase } from "@/components/services-showcase";
import { CampaignBand } from "@/components/campaign-band";
import { WorkShowcase } from "@/components/work-showcase";
import { Header } from "@/components/header";
import { Hero } from "@/components/hero";
import { RoommateFan } from "@/components/roommate-fan";
import { publicRoommates } from "@/lib/roommates";
import { Areas, Categories, Rails, TypeSpotlight } from "@/components/categories";
import { Faq, FinalCta, Footer, HowItWorks, ListerCta, ToolsStrip, Trust } from "@/components/sections";
import { MarketplaceProvider } from "@/components/marketplace";
import { getAllListings, slim } from "@/lib/store";

// Admin listings appear as soon as they are saved.
export const dynamic = "force-dynamic";

export const metadata: Metadata = { alternates: { canonical: "/" } };

export default async function Home() {
  const [listings, roommates] = await Promise.all([getAllListings(), publicRoommates()]);
  // Profiles with a photo first, newest first; at most 11 cards in the fan.
  const people = [...roommates].sort((a, b) => Number(!!b.photo) - Number(!!a.photo) || b.createdAt.localeCompare(a.createdAt)).slice(0, 11);
  return (
    <MarketplaceProvider listings={slim(listings)}>
      <Header />
      <main>
        <Hero />
        <TypeSpotlight type="partition" />
        <TypeSpotlight type="room" tone="tint" />
        <Categories />
        <RoommateFan people={people} />
        <ServicesShowcase />
        <WorkShowcase compact className="py-12" />
        <Rails />
        <CampaignBand />
        <ToolsStrip />
        <HowItWorks />
        <Trust />
        <ListerCta />
        <Areas />
        <Testimonials />
        <Faq />
        <FamilyStrip />
        <FinalCta />
      </main>
      <Footer />
    </MarketplaceProvider>
  );
}
