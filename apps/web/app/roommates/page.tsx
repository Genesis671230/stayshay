import type { Metadata } from "next";
import { Header } from "@/components/header";
import { Footer } from "@/components/sections";
import { MarketplaceProvider } from "@/components/marketplace";
import { RoommatesPage } from "@/components/roommates-page";
import { getAllListings } from "@/lib/store";
import { publicRoommates } from "@/lib/roommates";
import { currentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Find a roommate in Dubai and the UAE | Stayshay" };

export default async function Page() {
  const [listings, profiles, me] = await Promise.all([getAllListings(), publicRoommates(), currentUser()]);
  return (
    <MarketplaceProvider listings={listings}>
      <Header />
      <RoommatesPage profiles={profiles} me={me && { name: me.name, phone: me.phone, email: me.email }} />
      <Footer />
    </MarketplaceProvider>
  );
}
