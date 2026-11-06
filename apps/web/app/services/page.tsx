import Image from "next/image";
import type { Metadata } from "next";
import { Header } from "@/components/header";
import { Footer } from "@/components/sections";
import { MarketplaceProvider } from "@/components/marketplace";
import { JsonLd } from "@/components/json-ld";
import { ServiceCard } from "@/components/service-card";
import { WaButton } from "@/components/wa-button";
import { Icon } from "@/components/ui";
import { Faq } from "@/components/seo-blocks";
import { ExpertiseBand, WorkShowcase } from "@/components/work-showcase";
import { GROUP_LABEL, SERVICES, type ServiceGroup } from "@/lib/services";
import { SITE, breadcrumbLd, faqLd } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Home maintenance & interior design in Dubai: AC, plumbing, cleaning, fit-out",
  description: "AC service, plumbing, electrical, painting, deep cleaning, pest control, movers, interior design, renovation, partitions, curtains and furnishing in Dubai. One tap to WhatsApp, quote before anyone comes.",
  alternates: { canonical: "/services" },
};

const FAQ: [string, string][] = [
  ["How do I book a home service with Stayshay?", "Tap the job you need. WhatsApp opens with it typed out. Send a photo, your area and a time, and we reply with a quote and a slot. Nothing is booked until you agree the price."],
  ["Which areas do you cover?", "Dubai first, including Deira, Bur Dubai, Karama, Al Barsha, JLT, Dubai Marina, JVC, Business Bay, Downtown and International City. Sharjah and Ajman on request."],
  ["Can landlords and holiday home owners use this too?", "Yes. Owners use us for move-out painting, deep cleaning, AC servicing between tenants, furnishing packages and holiday home setup."],
];

export default function Page() {
  const groups: ServiceGroup[] = ["maintenance", "interiors"];
  const crumbs: [string, string][] = [["Home", "/"], ["Services", "/services"]];
  const list = { "@context": "https://schema.org", "@type": "ItemList", name: "Stayshay home services", itemListElement: SERVICES.map((s, i) => ({ "@type": "ListItem", position: i + 1, url: `${SITE}/services/${s.slug}`, name: s.name })) };
  return (
    <MarketplaceProvider>
      <JsonLd data={[breadcrumbLd(crumbs), list, faqLd(FAQ)]} />
      <Header />
      <main>
        <section className="px-2 pt-2 md:px-4 md:pt-3">
          <div className="relative overflow-hidden rounded-[32px] bg-brand-deep px-5 py-14 md:px-10 md:py-20">
            <Image src="/work/villa-pinea/living.jpg" alt="" fill priority sizes="100vw" className="object-cover" />
            <div className="absolute inset-0 bg-[linear-gradient(100deg,rgb(9_29_21/0.93)_0%,rgb(9_29_21/0.75)_50%,rgb(9_29_21/0.3)_100%)]" aria-hidden />
            <div className="relative mx-auto max-w-[1180px] text-white">
              <p className="text-[12px] font-bold uppercase tracking-[0.14em] text-[#8fe3bd]">Maintenance & interiors</p>
              <h1 className="font-display mt-3 max-w-[820px] text-[38px] leading-[1.02] md:text-[64px]">Home services in Dubai, one tap away</h1>
              <p className="mt-4 max-w-[600px] text-[16px] leading-relaxed text-white/85 md:text-[18px]">
                From a leaking tap to a full interior makeover. Tap the job, WhatsApp opens with it typed out, and you get a quote before anyone comes.
              </p>
              <WaButton text="Hi Stayshay, I need help at home: … Area: … Best time: …" kind="service" label="Services hub" className="mt-7 inline-flex h-12 items-center gap-2 rounded-[14px] bg-[#25d366] px-6 text-[15.5px] font-semibold text-white hover:brightness-95">
                <Icon name="whatsapp" size={18} /> WhatsApp us the job
              </WaButton>
            </div>
          </div>
        </section>

        {groups.map((g) => (
          <section key={g} className="mx-auto max-w-[1240px] px-4 pt-14 md:px-8 md:pt-20">
            <h2 className="font-display text-[30px] md:text-[44px]">{GROUP_LABEL[g]}</h2>
            <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {SERVICES.filter((s) => s.group === g).map((s) => (
                <ServiceCard key={s.slug} s={s} />
              ))}
            </div>
          </section>
        ))}

        <WorkShowcase className="pt-16 md:pt-24" />
        <section className="mx-auto max-w-[1240px] px-4 pt-14 md:px-8">
          <ExpertiseBand />
        </section>

        <div className="mx-auto max-w-[820px] px-4 py-14 md:px-8">
          <Faq faq={FAQ} />
        </div>
      </main>
      <Footer />
    </MarketplaceProvider>
  );
}
