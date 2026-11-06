import type { Metadata } from "next";
import { Header } from "@/components/header";
import { Footer } from "@/components/sections";
import { MarketplaceProvider } from "@/components/marketplace";
import { RoommatesPage } from "@/components/roommates-page";
import { getAllListings, slim } from "@/lib/store";
import { gateRoommates, publicRoommates } from "@/lib/roommates";
import { FREE_PROFILES, accessFor } from "@/lib/community";
import { currentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Find a roommate in Dubai and the UAE", description: "Browse people looking for roommates and flatmates in Dubai and the UAE, or add your profile with budget, area and habits. Free.", alternates: { canonical: "/roommates" } };

export default async function Page() {
  const [listings, profiles, me] = await Promise.all([getAllListings(), publicRoommates(), currentUser()]);
  const access = await accessFor(me);
  const { open, locked } = gateRoommates(profiles, access.anyPass, FREE_PROFILES);
  return (
    <MarketplaceProvider listings={slim(listings)}>
      <Header />
      <RoommatesPage profiles={open} locked={locked} me={me && { name: me.name, phone: me.phone, email: me.email }} />
      <Footer />
    </MarketplaceProvider>
  );
}
