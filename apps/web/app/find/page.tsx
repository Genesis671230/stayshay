import { FindFunnel } from "@/components/find-funnel";
import { MarketplaceProvider } from "@/components/marketplace";
import { getAllListings } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function Page() {
  return (
    <MarketplaceProvider listings={await getAllListings()}>
      <FindFunnel />
    </MarketplaceProvider>
  );
}
