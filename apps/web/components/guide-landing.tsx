import Image from "next/image";
import Link from "next/link";
import { AREAS, AREA_BY_SLUG, filterListings, type Listing } from "@stayshay/core/src/client.ts";
import { Header } from "./header";
import { Footer } from "./sections";
import { MarketplaceProvider } from "./marketplace";
import { JsonLd } from "./json-ld";
import { Blocks, Faq, ListingGrid } from "./seo-blocks";
import { FamilyForm } from "./family-form";
import { Icon } from "./ui";
import { QuickAsk } from "./quick-ask";
import { WaButton } from "./wa-button";
import { slim } from "@/lib/store";
import { GUIDE_BY_PATH, type Guide } from "@/lib/guides";
import { SITE, breadcrumbLd, faqLd } from "@/lib/seo";

const label = (path: string) => GUIDE_BY_PATH.get(path)?.h1 ?? (path.startsWith("/blog/") ? "Guide: " + path.slice(6).replace(/-/g, " ") : path.replace(/^\//, "").replace(/[-/]/g, " "));

/** Family-home and relocation page: hero with a direct answer, the family brief form, guide blocks, live listings, FAQ. */
export function GuideLanding({ g, all, crumbs, children }: { g: Guide; all: Listing[]; crumbs: [string, string][]; children?: React.ReactNode }) {
  const live = g.live
    ? filterListings(all, AREAS, { types: g.live.type ? [g.live.type] : undefined, areaSlugs: g.live.area && AREA_BY_SLUG.has(g.live.area) ? [g.live.area] : undefined })
        .filter((l) => !g.form.metro || l.nearMetroMinutes != null || !!l.metro)
        .sort((a, b) => a.priceAed - b.priceAed)
        .slice(0, g.live.limit ?? 6)
    : [];
  const service = {
    "@context": "https://schema.org",
    "@type": "Service",
    name: g.h1,
    serviceType: "Home finding for families and people relocating",
    description: g.description,
    url: `${SITE}${g.path}`,
    provider: { "@id": `${SITE}/#org` },
    areaServed: { "@type": "City", name: "Dubai" },
    offers: { "@type": "Offer", price: 0, priceCurrency: "AED", description: "Free for families and renters" },
  };
  return (
    <MarketplaceProvider listings={slim(all)}>
      <JsonLd data={[breadcrumbLd(crumbs), service, ...(g.faq.length ? [faqLd(g.faq)] : [])]} />
      <Header />
      <main>
        <section className="px-2 pt-2 md:px-4 md:pt-3">
          <div className="relative overflow-hidden rounded-[28px] bg-brand-deep px-5 py-12 md:px-10 md:py-16">
            <Image src={g.photo} alt="" fill priority sizes="100vw" className="object-cover" />
            <div className="absolute inset-0 bg-[linear-gradient(100deg,rgb(9_44_34/0.94)_0%,rgb(9_44_34/0.8)_55%,rgb(9_44_34/0.5)_100%)]" aria-hidden />
            <div className="relative mx-auto max-w-[1180px]">
              <nav className="flex flex-wrap items-center gap-1.5 text-[13px] text-white/70" aria-label="Breadcrumb">
                {crumbs.map(([name, href], i) => (
                  <span key={href} className="flex items-center gap-1.5">
                    {i > 0 && <Icon name="chevron-right" size={12} />}
                    {i < crumbs.length - 1 ? <Link href={href} className="hover:text-white">{name}</Link> : <span className="text-white">{name}</span>}
                  </span>
                ))}
              </nav>
              <p className="mt-6 text-[12px] font-bold uppercase tracking-[0.12em] text-[#8fe3bd]">{g.eyebrow}</p>
              <h1 className="font-display mt-3 max-w-[900px] text-[34px] leading-[1.05] text-white md:text-[52px]">{g.h1}</h1>
              <p className="mt-5 max-w-[760px] text-[15.5px] leading-relaxed text-white/90 md:text-[17px]">{g.answer}</p>
              <div className="mt-7 flex flex-wrap gap-3">
                <WaButton text={`Hi Stayshay, I found you on "${g.h1}". I'm looking for a home. Type: … Area: … Budget: … Move-in: …`} kind="family" label={g.h1} className="inline-flex h-12 items-center gap-2 rounded-[12px] bg-[#25d366] px-6 text-[15px] font-semibold text-white hover:brightness-95">
                  <Icon name="whatsapp" size={18} /> WhatsApp us now
                </WaButton>
                <a href="#request" className="inline-flex h-12 items-center rounded-[12px] border border-white/40 px-6 text-[15px] font-semibold text-white hover:bg-white/10">
                  Send a detailed brief
                </a>
              </div>
              <div className="mt-6">
                <QuickAsk title="Or tap your home type" only={["Studio", "1BHK", "2BHK", "3BHK", "Family sharing"]} />
              </div>
            </div>
          </div>
        </section>

        <div className="mx-auto grid max-w-[1240px] grid-cols-1 gap-10 px-4 py-12 md:px-8 lg:grid-cols-[minmax(0,1fr)_420px]">
          <article className="doc min-w-0">
            <Blocks blocks={g.blocks} listings={all} />
            {children}
            <Link href="/tools/move-in-cost" className="not-prose mt-8 flex items-center justify-between gap-4 rounded-[18px] border border-line p-5 hover:border-brand">
              <span>
                <span className="block text-[16px] font-bold text-ink">How much cash do you need on day one?</span>
                <span className="mt-1 block text-[14px] text-ink-2">Deposit, agency fee, Ejari and DEWA for any rent: Move-in Cost Calculator.</span>
              </span>
              <Icon name="chevron-right" size={18} />
            </Link>
          </article>
          <aside className="lg:sticky lg:top-24 lg:self-start">
            <FamilyForm home={g.form.home} area={g.form.area} metro={g.form.metro} from={g.form.from} heading={g.form.heading} />
          </aside>
        </div>

        <div className="mx-auto max-w-[1240px] px-4 pb-12 md:px-8">
          {!!live.length && (
            <section>
              <h2 className="font-display text-[26px]">{g.live!.title}</h2>
              <ListingGrid listings={live} />
            </section>
          )}
          <div className="max-w-[820px]">
            <Faq faq={g.faq} />
          </div>
          <section className="mt-12">
            <h2 className="font-display text-[22px]">Related</h2>
            <div className="mt-4 flex flex-wrap gap-2">
              {g.related.map((p) => (
                <Link key={p} href={p} className="rounded-[12px] border border-line px-4 py-2 text-[14px] capitalize hover:border-brand">
                  {label(p)}
                </Link>
              ))}
            </div>
          </section>
        </div>
      </main>
      <Footer />
    </MarketplaceProvider>
  );
}
