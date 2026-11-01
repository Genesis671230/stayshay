import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Header } from "@/components/header";
import { Footer } from "@/components/sections";
import { MarketplaceProvider } from "@/components/marketplace";
import { RefCapture } from "@/components/ref-capture";
import { JsonLd } from "@/components/json-ld";
import { partnerByCode } from "@/lib/referrals";
import { stayshayWhatsapp } from "@/lib/contact";
import { SITE, breadcrumbLd } from "@/lib/seo";

export const dynamic = "force-dynamic";

async function load(code: string) {
  const p = await partnerByCode(code);
  return p?.status === "approved" ? p : null;
}

export async function generateMetadata({ params }: { params: Promise<{ code: string }> }): Promise<Metadata> {
  const p = await load((await params).code);
  if (!p) return { title: "Partner not found", robots: { index: false } };
  const where = p.areas.length ? ` in ${p.areas.slice(0, 3).join(", ")}` : " in the UAE";
  return {
    title: `${p.name} — rental partner${where}`,
    description: `${p.name} helps people find bed spaces, partitions, rooms and studios${where} with Stayshay. ${p.bio}`.slice(0, 158),
    alternates: { canonical: `/partners/${p.code.toLowerCase()}` },
    openGraph: p.photo ? { images: [{ url: p.photo }] } : undefined,
  };
}

export default async function Page({ params }: { params: Promise<{ code: string }> }) {
  const p = await load((await params).code);
  if (!p) notFound();
  const wa = stayshayWhatsapp(`Hi Stayshay, ${p.name} (partner ${p.code}) sent me. I'm looking for a place. My budget is AED `);
  return (
    <MarketplaceProvider>
      <RefCapture code={p.code} />
      <JsonLd
        data={[
          breadcrumbLd([["Home", "/"], ["Partners", "/partners"], [p.name, `/partners/${p.code.toLowerCase()}`]]),
          { "@context": "https://schema.org", "@type": "RealEstateAgent", name: p.name, url: `${SITE}/partners/${p.code.toLowerCase()}`, image: p.photo ? new URL(p.photo, SITE).toString() : undefined, areaServed: p.areas, knowsLanguage: p.languages, description: p.bio, memberOf: { "@type": "Organization", name: "Stayshay", url: SITE } },
        ]}
      />
      <Header />
      <main className="px-2 pb-20 pt-2 md:px-4 md:pt-3">
        <section className="glow-panel relative overflow-hidden rounded-[32px] px-5 py-12 text-white md:px-10 md:py-16">
          <div className="mx-auto flex max-w-[960px] flex-col gap-6 md:flex-row md:items-center">
            {p.photo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={p.photo} alt={p.name} className="h-28 w-28 rounded-full object-cover ring-4 ring-[#6ee7b7]/40 md:h-36 md:w-36" />
            ) : (
              <span className="flex h-28 w-28 items-center justify-center rounded-full bg-white/10 text-[44px] font-bold text-[#8fe3bd] ring-4 ring-[#6ee7b7]/30 md:h-36 md:w-36">{p.name[0]}</span>
            )}
            <div>
              <p className="text-[12px] font-bold uppercase tracking-[0.14em] text-[#8fe3bd]">Stayshay partner</p>
              <h1 className="font-display mt-2 text-[36px] leading-[1.05] md:text-[52px]">{p.name}</h1>
              <p className="mt-1 text-[14.5px] text-white/70">{[p.company, p.brn && `BRN ${p.brn}`].filter(Boolean).join(" · ")}</p>
            </div>
          </div>
        </section>
        <div className="mx-auto mt-10 grid max-w-[960px] grid-cols-1 gap-8 px-3 md:grid-cols-[minmax(0,1fr)_320px]">
          <div>
            <p className="text-[16.5px] leading-relaxed text-ink-2">{p.bio}</p>
            {p.areas.length > 0 && (
              <>
                <h2 className="mt-8 text-[15px] font-bold uppercase tracking-[0.08em] text-muted">Areas</h2>
                <div className="mt-3 flex flex-wrap gap-2">
                  {p.areas.map((a) => (
                    <Link key={a} href={`/search?q=${encodeURIComponent(a)}`} className="rounded-[12px] bg-mint px-3.5 py-1.5 text-[13.5px] font-medium text-brand">
                      {a}
                    </Link>
                  ))}
                </div>
              </>
            )}
            {p.languages.length > 0 && <p className="mt-6 text-[14.5px] text-ink-2">Speaks {p.languages.join(", ")}.</p>}
          </div>
          <aside className="h-fit rounded-[22px] border border-line p-5">
            <p className="text-[15px] font-bold">Find a place with {p.name.split(" ")[0]}</p>
            <p className="mt-1 text-[13.5px] text-muted">Message Stayshay and we'll bring {p.name.split(" ")[0]} in. No broker fee for you.</p>
            <a href={wa} target="_blank" rel="noopener noreferrer" className="mt-4 flex h-12 items-center justify-center rounded-[14px] bg-whatsapp text-[15px] font-semibold text-white">
              Message on WhatsApp
            </a>
            <Link href="/search" className="mt-2 flex h-12 items-center justify-center rounded-[14px] border border-line text-[15px] font-semibold">
              Browse places
            </Link>
          </aside>
        </div>
      </main>
      <Footer />
    </MarketplaceProvider>
  );
}
