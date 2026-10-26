import type { Metadata } from "next";
import { ListFunnel } from "@/components/list-funnel";
import { MarketplaceProvider } from "@/components/marketplace";
import { getAllListings } from "@/lib/store";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "List your room, bed space or studio for free", description: "Owners and tenants: list a bed space, partition, room or studio in Dubai and the UAE for free. Reviewed by our team, shown to renters across the UAE.", alternates: { canonical: "/list" } };

export default async function Page() {
  return (
    <MarketplaceProvider listings={await getAllListings()}>
      <ListFunnel />
    </MarketplaceProvider>
  );
}
