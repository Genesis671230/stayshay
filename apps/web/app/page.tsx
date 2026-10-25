import { Header } from "@/components/header";
import { Hero } from "@/components/hero";
import { Areas, Categories, Rails } from "@/components/categories";
import { Faq, FinalCta, Footer, HowItWorks, ListerCta, Trust } from "@/components/sections";
import { MarketplaceProvider } from "@/components/marketplace";

export default function Home() {
  return (
    <MarketplaceProvider>
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
