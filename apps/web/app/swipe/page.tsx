import type { Metadata } from "next";
import { Header } from "@/components/header";
import { Footer } from "@/components/sections";
import { MarketplaceProvider } from "@/components/marketplace";
import { RoomieStage } from "@/components/roomie/section";
import { getAllListings, slim } from "@/lib/store";
import { publicRoommates } from "@/lib/roommates";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Roommate Swipe: find a flatmate in Dubai",
  description: "Swipe through real people looking for roommates in Dubai, best fit first by budget, area, move-in date and routine. Match and message your future flatmate.",
  alternates: { canonical: "/swipe" },
};

export default async function Page() {
  const [listings, profiles] = await Promise.all([getAllListings(), publicRoommates()]);
  return (
    <MarketplaceProvider listings={slim(listings)}>
      <Header />
      <main>
        <RoomieStage people={profiles.length} returnTo="/swipe" title="Swipe to find your flatmate." intro="Real people, best fit first by budget, area and routine. Right to like, left to pass." />
      </main>
      <Footer />
    </MarketplaceProvider>
  );
}
