import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Header } from "@/components/header";
import { Footer } from "@/components/sections";
import { MarketplaceProvider } from "@/components/marketplace";
import { JsonLd } from "@/components/json-ld";
import { WaButton } from "@/components/wa-button";
import { Icon } from "@/components/ui";
import { ExpertiseBand, ProjectCard } from "@/components/work-showcase";
import { PROJECTS, PROJECT_BY_SLUG, allImages, imgSize, workMessage } from "@/lib/portfolio";
import { ProjectGallery, ViewerTrigger, type Pattern } from "@/components/project-gallery";
import { SERVICE_BY_SLUG } from "@/lib/services";
import { SITE, breadcrumbLd } from "@/lib/seo";

export function generateStaticParams() {
  return PROJECTS.map((x) => ({ slug: x.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const x = PROJECT_BY_SLUG.get((await params).slug);
  if (!x) return {};
  const title = `${x.name}: ${x.category.toLowerCase()} ${x.scope.toLowerCase()} in ${x.location}`;
  return { title, description: x.summary.slice(0, 158), alternates: { canonical: `/work/${x.slug}` }, openGraph: { title, description: x.summary, images: [x.cover] } };
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const x = PROJECT_BY_SLUG.get((await params).slug);
  if (!x) notFound();
  const i = PROJECTS.indexOf(x);
  const next = PROJECTS[(i + 1) % PROJECTS.length];
  const more = PROJECTS.filter((p) => p.slug !== x.slug && p.slug !== next.slug).slice(0, 3);
  const crumbs: [string, string][] = [["Home", "/"], ["Our work", "/work"], [x.name, `/work/${x.slug}`]];
  const photos = allImages(x).map((p) => {
    const [w, h] = imgSize(p.src);
    return { ...p, w, h };
  });
  const at = (src: string) => photos.findIndex((p) => p.src === src);
  // Each project gets its own gallery layout, stable per project.
  const PATTERNS: Pattern[] = ["justified", "editorial", "cascade", "filmstrip"];
  const pattern = PATTERNS[[...x.slug].reduce((a, c) => a + c.charCodeAt(0), 0) % PATTERNS.length];
  const ld = {
    "@context": "https://schema.org",
    "@type": "CreativeWork",
    name: `${x.name}, ${x.location}`,
    about: `${x.category} ${x.scope}`,
    description: x.summary,
    url: `${SITE}/work/${x.slug}`,
    image: [x.cover, ...x.chapters.map((c) => c.img)].map((u) => `${SITE}${u}`),
    creator: { "@id": `${SITE}/#org` },
    locationCreated: { "@type": "Place", name: x.location },
  };
  return (
    <MarketplaceProvider>
      <JsonLd data={[breadcrumbLd(crumbs), ld]} />
      <Header />
      <main>
        {/* Hero */}
        <section className="px-2 pt-2 md:px-4 md:pt-3">
          <div className="relative min-h-[86vh] overflow-hidden rounded-[30px] bg-ink">
            <Image src={x.cover} alt={`${x.name}, ${x.location}`} fill priority sizes="100vw" className="object-cover" />
            <div className="absolute inset-0 bg-[linear-gradient(180deg,rgb(0_0_0/0.35)_0%,rgb(0_0_0/0)_35%,rgb(0_0_0/0.8)_100%)]" />
            <nav className="absolute left-5 top-5 flex flex-wrap items-center gap-1.5 text-[13px] text-white/80 md:left-10 md:top-8" aria-label="Breadcrumb">
              {crumbs.map(([name, href], k) => (
                <span key={href} className="flex items-center gap-1.5">
                  {k > 0 && <Icon name="chevron-right" size={12} />}
                  {k < crumbs.length - 1 ? <Link href={href} className="hover:text-white">{name}</Link> : <span className="text-white">{name}</span>}
                </span>
              ))}
            </nav>
            <div className="absolute inset-x-0 bottom-0 mx-auto max-w-[1240px] px-5 pb-10 md:px-10 md:pb-14">
              <p className="text-[12.5px] font-bold uppercase tracking-[0.16em] text-lime">
                {x.category} · {x.location}
              </p>
              <h1 className="font-display mt-3 text-[54px] leading-[0.95] text-white md:text-[112px]">{x.name}</h1>
              <p className="mt-4 max-w-[640px] text-[17px] text-white/90 md:text-[21px]">{x.tagline}</p>
              <div className="mt-7 flex flex-wrap gap-3">
                <WaButton text={workMessage(x)} kind="service" label={`Work: ${x.name}`} className="inline-flex h-13 items-center gap-2 rounded-[14px] bg-[#25d366] px-7 py-3.5 text-[16px] font-semibold text-white hover:brightness-95">
                  <Icon name="whatsapp" size={20} /> Start a project like this
                </WaButton>
                <a href="#story" className="inline-flex h-13 items-center rounded-[14px] border border-white/40 px-7 py-3.5 text-[16px] font-semibold text-white hover:bg-white/10">
                  Explore the {x.category.toLowerCase()}
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* Facts */}
        <section className="mx-auto max-w-[1240px] px-4 md:px-8">
          <dl className="relative z-10 -mt-8 grid grid-cols-2 gap-px overflow-hidden rounded-[22px] bg-line shadow-[0_18px_50px_rgb(0_0_0/0.08)] md:grid-cols-4">
            {x.facts.map(([k, v]) => (
              <div key={k} className="bg-white px-5 py-5">
                <dt className="text-[12px] font-bold uppercase tracking-[0.1em] text-muted">{k}</dt>
                <dd className="mt-1 text-[15.5px] font-semibold text-ink">{v}</dd>
              </div>
            ))}
          </dl>
        </section>

        {/* Story */}
        <section id="story" className="mx-auto grid max-w-[1240px] scroll-mt-24 grid-cols-1 gap-10 px-4 pt-16 md:px-8 lg:grid-cols-[1fr_1fr] lg:gap-16">
          <div>
            <p className="eyebrow">The project</p>
            <p className="font-display mt-3 text-[28px] leading-[1.15] md:text-[38px]">{x.summary}</p>
            <div className="mt-8 flex items-center gap-3">
              {x.palette.map((c) => (
                <span key={c} className="h-12 w-12 rounded-full ring-1 ring-black/10" style={{ background: c }} title={c} />
              ))}
              <span className="ml-2 text-[13px] font-semibold uppercase tracking-[0.1em] text-muted">Palette</span>
            </div>
          </div>
          <div className="space-y-5 text-[16.5px] leading-relaxed text-ink-2">
            {x.story.map((s) => (
              <p key={s.slice(0, 20)}>{s}</p>
            ))}
            <div className={x.highlights.length ? "grid grid-cols-1 gap-3 pt-3" : "hidden"}>
              {x.highlights.map((h) => (
                <div key={h.t} className="rounded-[18px] bg-[#ecf8ee] p-5">
                  <p className="text-[16px] font-bold text-ink">{h.t}</p>
                  <p className="mt-1 text-[14.5px]">{h.d}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Chapters */}
        <section className="mx-auto max-w-[1240px] space-y-16 px-4 pt-20 md:px-8 md:space-y-24">
          {x.chapters.map((c, k) => (
            <article key={c.img} className={`grid grid-cols-1 items-center gap-8 lg:grid-cols-[1.4fr_1fr] lg:gap-14 ${k % 2 ? "lg:[&>*:first-child]:order-2 lg:grid-cols-[1fr_1.4fr]" : ""}`}>
              <ViewerTrigger index={at(c.img)}>
                <div className="relative aspect-[4/3] overflow-hidden rounded-[28px] bg-surface">
                  <Image src={c.img} alt={c.title} fill sizes="(max-width: 1024px) 100vw, 60vw" className="object-cover transition-transform duration-700 group-hover:scale-[1.03]" />
                </div>
              </ViewerTrigger>
              <div>
                <p className="text-[12.5px] font-bold uppercase tracking-[0.14em] text-brand">{c.eyebrow}</p>
                <h2 className="font-display mt-3 text-[32px] leading-[1.04] md:text-[46px]">{c.title}</h2>
                <p className="mt-4 text-[16.5px] leading-relaxed text-ink-2">{c.text}</p>
              </div>
            </article>
          ))}
        </section>

        {/* Gallery */}
        <section className="mx-auto max-w-[1240px] px-4 pt-20 md:px-8">
          <p className="eyebrow">Gallery</p>
          <h2 className="font-display mt-2 text-[32px] md:text-[46px]">Every room of {x.name}</h2>
          <p className="mt-2 text-[14.5px] text-ink-2">{photos.length} photos. Tap any photo to view it full screen.</p>
          <div className="mt-8">
            <ProjectGallery images={photos} pattern={pattern} name={x.name} />
          </div>
        </section>

        {/* Services used */}
        <section className="mx-auto max-w-[1240px] px-4 pt-16 md:px-8">
          <div className="flex flex-wrap items-center gap-2">
            <span className="mr-2 text-[13px] font-bold uppercase tracking-[0.1em] text-muted">Services on this project</span>
            {x.services.map((s) => SERVICE_BY_SLUG.get(s)).filter((s) => !!s).map((s) => (
              <Link key={s!.slug} href={`/services/${s!.slug}`} className="rounded-full border border-line px-4 py-2 text-[14px] font-semibold hover:border-brand hover:text-brand">
                {s!.name} ↗
              </Link>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-[1240px] px-4 pt-16 md:px-8">
          <ExpertiseBand />
        </section>

        {/* Next */}
        <section className="mx-auto max-w-[1240px] px-4 pt-16 md:px-8">
          <p className="eyebrow">Next project</p>
          <div className="mt-4">
            <ProjectCard x={next} big />
          </div>
          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
            {more.map((p) => (
              <ProjectCard key={p.slug} x={p} />
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-[1240px] px-4 py-16 md:px-8">
          <div className="flex flex-col items-start justify-between gap-6 rounded-[30px] bg-lime p-7 md:flex-row md:items-center md:p-10">
            <div>
              <h2 className="font-display text-[30px] leading-[1.05] text-brand-deep md:text-[42px]">Want a {x.category === "Office" ? "workplace" : "home"} like {x.name}?</h2>
              <p className="mt-2 max-w-[560px] text-[15.5px] text-brand-deep/80">Send photos and a rough budget. You get a design approach and a clear quote, no obligation.</p>
            </div>
            <WaButton text={workMessage(x)} kind="service" label={`Work: ${x.name} (footer)`} className="inline-flex h-13 shrink-0 items-center gap-2 rounded-[14px] bg-brand-deep px-7 py-3.5 text-[16px] font-semibold text-white hover:brightness-110">
              <Icon name="whatsapp" size={20} /> WhatsApp the team
            </WaButton>
          </div>
        </section>
      </main>
      <Footer />
    </MarketplaceProvider>
  );
}
