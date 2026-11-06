import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Header } from "@/components/header";
import { Footer } from "@/components/sections";
import { MarketplaceProvider } from "@/components/marketplace";
import { JsonLd } from "@/components/json-ld";
import { ServiceCard } from "@/components/service-card";
import { WaButton } from "@/components/wa-button";
import { Icon } from "@/components/ui";
import { Faq } from "@/components/seo-blocks";
import { SERVICES, SERVICE_BY_SLUG, serviceMessage } from "@/lib/services";
import { SITE, breadcrumbLd, faqLd } from "@/lib/seo";

export function generateStaticParams() {
  return SERVICES.map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const s = SERVICE_BY_SLUG.get((await params).slug);
  if (!s) return {};
  return {
    title: s.h1,
    description: s.answer.slice(0, 158),
    keywords: s.keywords,
    alternates: { canonical: `/services/${s.slug}` },
    openGraph: { title: s.h1, description: s.answer, images: [s.photo] },
  };
}

const STEPS = [
  ["Tap the job", "WhatsApp opens with your request typed out. No forms, no sign-up."],
  ["Send a photo", "Add a photo, your area and a time that suits you."],
  ["Get a quote", "We reply with the price and a slot. Nothing happens until you say yes."],
];

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const s = SERVICE_BY_SLUG.get((await params).slug);
  if (!s) notFound();
  const crumbs: [string, string][] = [["Home", "/"], ["Services", "/services"], [s.name, `/services/${s.slug}`]];
  const related = SERVICES.filter((x) => x.slug !== s.slug && x.group === s.group).slice(0, 3);
  const service = {
    "@context": "https://schema.org",
    "@type": "Service",
    name: s.h1,
    serviceType: s.name,
    description: s.answer,
    url: `${SITE}/services/${s.slug}`,
    image: `${SITE}${s.photo}`,
    provider: { "@id": `${SITE}/#org` },
    areaServed: { "@type": "City", name: "Dubai" },
  };
  return (
    <MarketplaceProvider>
      <JsonLd data={[breadcrumbLd(crumbs), service, faqLd(s.faq)]} />
      <Header />
      <main>
        <section className="mx-auto grid max-w-[1240px] grid-cols-1 items-center gap-8 px-4 pt-6 md:px-8 md:pt-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-14">
          <div>
            <nav className="flex flex-wrap items-center gap-1.5 text-[13px] text-muted" aria-label="Breadcrumb">
              {crumbs.map(([name, href], i) => (
                <span key={href} className="flex items-center gap-1.5">
                  {i > 0 && <Icon name="chevron-right" size={12} />}
                  {i < crumbs.length - 1 ? <Link href={href} className="hover:text-ink">{name}</Link> : <span className="text-ink">{name}</span>}
                </span>
              ))}
            </nav>
            <h1 className="font-display mt-5 text-[36px] leading-[1.04] md:text-[56px]">{s.h1}</h1>
            <p className="mt-4 text-[16px] leading-relaxed text-ink-2 md:text-[17.5px]">{s.answer}</p>
            <WaButton text={serviceMessage(s)} kind="service" label={s.name} className="mt-7 inline-flex h-13 items-center gap-2 rounded-[14px] bg-[#25d366] px-7 py-3.5 text-[16px] font-semibold text-white hover:brightness-95">
              <Icon name="whatsapp" size={20} /> WhatsApp for a quote
            </WaButton>
            <p className="mt-6 text-[13px] font-semibold uppercase tracking-wide text-muted">Or tap your job</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {s.jobs.map((j) => (
                <WaButton key={j} text={serviceMessage(s, j)} kind="service" label={`${s.name}: ${j}`} className="inline-flex h-10 items-center rounded-full border border-line bg-white px-4 text-[14px] font-medium hover:border-[#25d366] hover:bg-[#25d366] hover:text-white">
                  {j}
                </WaButton>
              ))}
            </div>
          </div>
          <div className="relative aspect-[4/3.4] overflow-hidden rounded-[30px] bg-surface">
            <Image src={s.photo} alt={s.name} fill priority sizes="(max-width: 1024px) 100vw, 50vw" className="object-cover" />
          </div>
        </section>

        <section className="mx-auto mt-14 max-w-[1240px] px-4 md:px-8">
          <div className="grid grid-cols-1 gap-8 rounded-[30px] bg-brand-deep p-6 text-white md:p-10 lg:grid-cols-2">
            <div>
              <h2 className="font-display text-[28px] md:text-[38px]">What we can do</h2>
              <ul className="mt-5 space-y-3">
                {s.includes.map((x) => (
                  <li key={x} className="flex items-start gap-3 text-[15.5px] text-white/90">
                    <span className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-lime text-[11px] font-bold text-brand-deep">✓</span>
                    {x}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h2 className="font-display text-[28px] md:text-[38px]">How it works</h2>
              <ol className="mt-5 divide-y divide-white/15">
                {STEPS.map(([t, d], i) => (
                  <li key={t} className="flex gap-4 py-4 first:pt-0">
                    <span className="font-figure flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-[15px] font-bold text-brand-deep">{i + 1}</span>
                    <span>
                      <span className="block text-[16.5px] font-semibold">{t}</span>
                      <span className="text-[14.5px] text-white/75">{d}</span>
                    </span>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </section>

        <div className="mx-auto max-w-[820px] px-4 pt-6 md:px-8">
          <Faq faq={s.faq} />
        </div>

        <section className="mx-auto max-w-[1240px] px-4 py-14 md:px-8">
          <div className="flex items-end justify-between gap-4">
            <h2 className="font-display text-[26px] md:text-[34px]">More services</h2>
            <Link href="/services" className="text-[14.5px] font-semibold underline underline-offset-4">All services</Link>
          </div>
          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((x) => (
              <ServiceCard key={x.slug} s={x} />
            ))}
          </div>
        </section>
      </main>
      <Footer />
    </MarketplaceProvider>
  );
}
