import Image from "next/image";
import type { Metadata } from "next";
import { Header } from "@/components/header";
import { Footer } from "@/components/sections";
import { MarketplaceProvider } from "@/components/marketplace";
import { JsonLd } from "@/components/json-ld";
import { WaButton } from "@/components/wa-button";
import { Icon } from "@/components/ui";
import { ExpertiseBand } from "@/components/work-showcase";
import { WorkBrowser, WorkVideos } from "@/components/work-browser";
import { ServiceCard } from "@/components/service-card";
import { PROJECTS, PROJECT_BY_SLUG, WORK_FILTERS, allImages } from "@/lib/portfolio";
import { SERVICE_BY_SLUG } from "@/lib/services";
import { SITE, breadcrumbLd } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Our work: villa, penthouse and office fit-out in Dubai",
  description: "Selected interior design, villa renovation and office fit-out projects by the Stayshay design & build team: Jumeirah Islands, The Greens, Dubai Marina, Dubai Hills. 15+ years of experience.",
  alternates: { canonical: "/work" },
  openGraph: { images: [PROJECTS[1].cover] },
};

const STEPS = [
  ["Brief", "Send photos, a floor plan or just an idea on WhatsApp. We visit, measure and listen."],
  ["Design", "Concept, 3D visuals, materials and a clear quote. Approvals handled for you."],
  ["Build", "One in-house team for MEP, joinery, stone, glazing and finishes, on a written timeline."],
  ["Handover", "Styled, snag-free and ready to live or work in, with aftercare."],
];

/** Video tours, trimmed to the walkthrough and hosted on stayshay.com (no YouTube). */
const VIDEOS = [
  { id: "villa-velora", title: "A fully renovated villa", place: "Jumeirah Islands", src: "/work/videos/villa-velora.mp4", seconds: 90, poster: PROJECT_BY_SLUG.get("villa-velora")!.cover },
  { id: "villa-pinea", title: "Four-bedroom villa renovation", place: "Jumeirah Islands", src: "/work/videos/villa-pinea.mp4", seconds: 83, poster: PROJECT_BY_SLUG.get("villa-pinea")!.cover },
];

export default function Page() {
  const hero = PROJECTS[1];
  const cards = PROJECTS.map((x) => ({ slug: x.slug, name: x.name, category: x.category, location: x.location, year: x.year, tagline: x.tagline, cover: x.cover, photos: allImages(x).length }));
  const crumbs: [string, string][] = [["Home", "/"], ["Our work", "/work"]];
  const list = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Stayshay design & build projects",
    itemListElement: PROJECTS.map((x, i) => ({ "@type": "ListItem", position: i + 1, url: `${SITE}/work/${x.slug}`, name: x.name })),
  };
  return (
    <MarketplaceProvider>
      <JsonLd data={[breadcrumbLd(crumbs), list]} />
      <Header />
      <main>
        <section className="px-2 pt-2 md:px-4 md:pt-3">
          <div className="relative min-h-[78vh] overflow-hidden rounded-[30px] bg-ink">
            <Image src={hero.cover} alt={`${hero.name}, ${hero.location}`} fill priority sizes="100vw" className="object-cover" />
            <div className="absolute inset-0 bg-[linear-gradient(180deg,rgb(0_0_0/0.25)_0%,rgb(0_0_0/0.15)_40%,rgb(0_0_0/0.78)_100%)]" />
            <div className="absolute inset-x-0 bottom-0 mx-auto max-w-[1240px] px-5 pb-10 md:px-10 md:pb-14">
              <p className="text-[12.5px] font-bold uppercase tracking-[0.16em] text-lime">Stayshay design & build · 15+ years</p>
              <h1 className="font-display mt-3 max-w-[920px] text-[42px] leading-[0.98] text-white md:text-[86px]">Spaces we design, and build.</h1>
              <p className="mt-5 max-w-[640px] text-[16px] leading-relaxed text-white/85 md:text-[18px]">Villas, penthouses, apartments, offices, restaurants and hotels across Dubai. One team from the first sketch to the last cushion.</p>
              <div className="mt-7 flex flex-wrap gap-3">
                <WaButton text={"Hi Stayshay, I'd like to talk about a design / fit-out project.\nProperty: …\nArea: …\nSize: …\nBudget: …"} kind="service" label="Work: hero" className="inline-flex h-13 items-center gap-2 rounded-[14px] bg-[#25d366] px-7 py-3.5 text-[16px] font-semibold text-white hover:brightness-95">
                  <Icon name="whatsapp" size={20} /> Start your project
                </WaButton>
                <a href="#projects" className="inline-flex h-13 items-center rounded-[14px] border border-white/40 px-7 py-3.5 text-[16px] font-semibold text-white hover:bg-white/10">
                  See the projects
                </a>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto grid max-w-[1240px] grid-cols-2 gap-px overflow-hidden px-4 pt-10 md:grid-cols-4 md:px-8">
          {[
            ["15+", "years of experience"],
            [String(PROJECTS.length), "projects shown here"],
            ["7", "sectors: villas to hotels"],
            ["1", "team, sketch to handover"],
          ].map(([n, l]) => (
            <div key={l} className="border-l border-line py-3 pl-5">
              <p className="font-display text-[44px] leading-none md:text-[56px]">{n}</p>
              <p className="mt-2 text-[14px] text-ink-2">{l}</p>
            </div>
          ))}
        </section>

        <section id="projects" className="mx-auto max-w-[1240px] scroll-mt-24 px-4 pt-14 md:px-8">
          <p className="eyebrow">Selected work</p>
          <h2 className="font-display mt-2 text-[32px] md:text-[48px]">{PROJECTS.length} projects across Dubai</h2>
          <div className="mt-6">
            <WorkBrowser cards={cards} filters={WORK_FILTERS} />
          </div>
        </section>

        <section className="mx-auto max-w-[1240px] px-4 pt-16 md:px-8">
          <p className="eyebrow">Walk through</p>
          <h2 className="font-display mt-2 text-[32px] md:text-[46px]">See it in motion</h2>
          <div className="mt-8">
            <WorkVideos videos={VIDEOS} />
          </div>
        </section>

        <section className="mx-auto max-w-[1240px] px-4 pt-16 md:px-8">
          <ExpertiseBand />
        </section>

        <section className="mx-auto max-w-[1240px] px-4 pt-16 md:px-8">
          <p className="eyebrow">How we work</p>
          <h2 className="font-display mt-2 text-[32px] md:text-[44px]">From idea to keys in four steps</h2>
          <ol className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map(([t, d], i) => (
              <li key={t} className="rounded-[24px] border border-line bg-white p-6">
                <span className="font-display text-[40px] leading-none text-brand">0{i + 1}</span>
                <p className="mt-4 text-[18px] font-bold">{t}</p>
                <p className="mt-1.5 text-[14.5px] leading-relaxed text-ink-2">{d}</p>
              </li>
            ))}
          </ol>
        </section>

        <section className="mx-auto max-w-[1240px] px-4 pt-16 md:px-8">
          <h2 className="font-display text-[28px] md:text-[38px]">Services</h2>
          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {["villa-renovation", "commercial-fit-out", "interior-design", "renovation"].map((s) => SERVICE_BY_SLUG.get(s)).filter((s) => !!s).map((s) => (
              <ServiceCard key={s!.slug} s={s!} />
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-[1240px] px-4 py-16 md:px-8">
          <div className="relative overflow-hidden rounded-[30px] bg-ink px-6 py-14 text-center text-white md:px-10">
            <Image src={PROJECTS[2].chapters[0].img} alt="" fill sizes="100vw" className="object-cover opacity-35" />
            <div className="relative">
              <h2 className="font-display mx-auto max-w-[760px] text-[34px] leading-[1.05] md:text-[56px]">Have a space in mind? Let’s make it yours.</h2>
              <p className="mx-auto mt-4 max-w-[560px] text-[16px] text-white/85">Send a few photos on WhatsApp. You get a design approach and a clear quote, with no obligation.</p>
              <WaButton text="Hi Stayshay, I'd like a quote for a design / fit-out project. Photos attached." kind="service" label="Work: footer" className="mt-7 inline-flex h-13 items-center gap-2 rounded-[14px] bg-[#25d366] px-7 py-3.5 text-[16px] font-semibold text-white hover:brightness-95">
                <Icon name="whatsapp" size={20} /> WhatsApp the design team
              </WaButton>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </MarketplaceProvider>
  );
}
