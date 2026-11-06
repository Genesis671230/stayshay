import Image from "next/image";
import { Header } from "./header";
import { Footer } from "./sections";
import { MarketplaceProvider } from "./marketplace";
import { JsonLd } from "./json-ld";
import { getAllListings, slim } from "@/lib/store";
import { SITE } from "@/lib/seo";
import type { ToolKey } from "@/lib/reviews";

/** Page frame for the free tools: photo hero, the tool, footer. */
export async function ToolShell({ eyebrow, title, intro, photo, path, children, tool }: { eyebrow: string; title: string; intro: string; photo: string; path: string; children: React.ReactNode; /** Which tool this is (reviews are collected inside the tool result). */ tool?: ToolKey }) {
  return (
    <MarketplaceProvider listings={slim(await getAllListings())}>
      <JsonLd data={[{ "@context": "https://schema.org", "@type": "WebApplication", name: title, url: `${SITE}${path}`, applicationCategory: "LifestyleApplication", operatingSystem: "Any", offers: { "@type": "Offer", price: 0, priceCurrency: "AED" }, publisher: { "@type": "Organization", name: "Stayshay", url: SITE } }]} />
      <Header />
      <main>
        <section className="px-2 pt-2 md:px-4 md:pt-3">
          <div className="relative overflow-hidden rounded-[28px] bg-brand-deep px-5 py-10 text-white md:px-10 md:py-14">
            <Image src={photo} alt="" fill priority sizes="100vw" className="object-cover" />
            <div className="absolute inset-0 bg-[linear-gradient(100deg,rgb(9_29_21/0.94)_0%,rgb(9_29_21/0.8)_50%,rgb(9_29_21/0.4)_100%)]" />
            <div className="relative mx-auto max-w-[1080px]">
              <p className="text-[12px] font-bold uppercase tracking-[0.14em] text-[#8fe3bd]">{eyebrow}</p>
              <h1 className="font-display mt-3 max-w-[760px] text-[32px] leading-[1.05] md:text-[50px]">{title}</h1>
              <p className="m-short mt-3 max-w-[580px] text-[15px] text-white/80 md:text-[16.5px]">{intro}</p>
            </div>
          </div>
        </section>
        <div className="pt-6">{children}</div>
      </main>
      <Footer />
    </MarketplaceProvider>
  );
}
