import { Header } from "@/components/header";
import { Hero } from "@/components/hero";
import { Areas, Categories, Rails } from "@/components/categories";
import { Faq, FinalCta, Footer, HowItWorks, ListerCta, Trust } from "@/components/sections";
import { MarketplaceProvider } from "@/components/marketplace";
import { getAllListings } from "@/lib/store";

// Admin listings appear as soon as they are saved.
export const dynamic = "force-dynamic";

export default async function Home() {
  return (
    <MarketplaceProvider listings={await getAllListings()}>
      <Header />
      <main>
        <Hero />
        <Categories />
        <Rails />
        <HowItWorks />
        <Trust />
        <ListerCta />
        <Areas />
        <Faq />
        <FinalCta />
      </main>
      <Footer />
    </MarketplaceProvider>
  );
}
