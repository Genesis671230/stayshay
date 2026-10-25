import { Header } from "./header";
import { Footer } from "./sections";
import { MarketplaceProvider } from "./marketplace";

/** Plain reading page (About, Terms, Privacy): green title band, narrow column. */
export function DocPage({ eyebrow, title, intro, updated, children }: { eyebrow: string; title: string; intro?: string; updated?: string; children: React.ReactNode }) {
  return (
    <MarketplaceProvider>
      <Header />
      <main>
        <section className="px-2 pt-2 md:px-4 md:pt-3">
          <div className="rounded-[28px] bg-brand px-5 py-14 md:px-10 md:py-20">
            <div className="mx-auto max-w-[820px]">
              <p className="text-[12px] font-bold uppercase tracking-[0.12em] text-[#8fe3bd]">{eyebrow}</p>
              <h1 className="font-display mt-3 text-[38px] leading-[1.05] text-white md:text-[56px]">{title}</h1>
              {intro && <p className="mt-4 max-w-[640px] text-[17px] leading-relaxed text-white/85">{intro}</p>}
              {updated && <p className="mt-4 text-[13px] text-white/60">Last updated {updated}</p>}
            </div>
          </div>
        </section>
        <article className="doc mx-auto max-w-[820px] px-5 py-14 md:px-8">{children}</article>
      </main>
      <Footer />
    </MarketplaceProvider>
  );
}
