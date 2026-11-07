import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { Header } from "@/components/header";
import { Footer } from "@/components/sections";
import { MarketplaceProvider } from "@/components/marketplace";
import { JsonLd } from "@/components/json-ld";
import { Icon, aed } from "@/components/ui";
import { getAllListings } from "@/lib/store";
import { publicRoommates } from "@/lib/roommates";
import { communityStats } from "@/lib/community";
import { PASS_PERKS, areaPhoto, rankedAreas } from "@/lib/community-meta";
import { breadcrumbLd, faqLd } from "@/lib/seo";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Neighbourhood communities in Dubai: meet roommates and residents before you move",
  description: "Join your Dubai neighbourhood’s Stayshay community: see every roommate profile, chat with residents, ask about buildings and landlords before you pay a deposit. AED 25 a month.",
  alternates: { canonical: "/community" },
};

const FAQ: [string, string][] = [
  ["What is the Stayshay Pass?", "A monthly membership (AED 25) for one neighbourhood community. It unlocks every roommate profile on Stayshay, the community’s group chat and Q&A, the member list, and introductions to tenants by our team."],
  ["Can I cancel?", "Yes, any time from the community page (Manage membership). You keep access until the end of the month you paid for."],
  ["Who can see what I post?", "Only signed-in members of that community. Posts are never public or shown on Google. Phone numbers and emails typed into posts are removed automatically, and our team removes anything abusive."],
  ["What can I see for free?", "The first 7 roommate profiles, the live places in each area and how active each community is."],
];

export default async function Page() {
  const [listings, roommates, stats] = await Promise.all([getAllListings(), publicRoommates(), communityStats()]);
  const areas = rankedAreas(listings, roommates.flatMap((r) => r.areaSlugs));
  const crumbs: [string, string][] = [["Home", "/"], ["Communities", "/community"]];
  return (
    <MarketplaceProvider>
      <JsonLd data={[breadcrumbLd(crumbs), faqLd(FAQ)]} />
      <Header />
      <main>
        <section className="px-2 pt-2 md:px-4 md:pt-3">
          <div className="relative overflow-hidden rounded-[30px] bg-brand-deep">
            <Image src="/photos/roommates.jpg" alt="" fill priority sizes="100vw" className="object-cover opacity-40" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgb(211_240_185/0.25),transparent_55%)]" />
            <div className="relative mx-auto grid max-w-[1240px] grid-cols-1 gap-10 px-5 py-14 md:px-10 md:py-20 lg:grid-cols-[1.2fr_1fr] lg:items-center">
              <div className="text-white">
                <p className="text-[12.5px] font-bold uppercase tracking-[0.16em] text-lime">Stayshay communities</p>
                <h1 className="font-display mt-3 text-[40px] leading-[1.0] md:text-[68px]">Know the neighbourhood before you move in.</h1>
                <p className="mt-5 max-w-[560px] text-[16.5px] leading-relaxed text-white/85">
                  Every area has its own community: the people looking for roommates, the residents who know the buildings, and a group chat where anyone can answer.
                </p>
                <div className="mt-7 flex flex-wrap items-center gap-3">
                  <a href="#areas" className="inline-flex h-12 items-center gap-2 rounded-[14px] bg-lime px-6 text-[15.5px] font-bold text-brand-deep hover:brightness-95">
                    Find your community <Icon name="arrow-right" size={16} />
                  </a>
                  <span className="text-[14px] text-white/75">AED 25/month · cancel any time</span>
                </div>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {PASS_PERKS.slice(0, 4).map((p) => (
                  <div key={p.t} className="rounded-[20px] bg-white/10 p-4 text-white ring-1 ring-white/15 backdrop-blur">
                    <span className="flex h-10 w-10 items-center justify-center rounded-[12px] bg-lime/90 text-brand-deep"><Icon name={p.icon} size={18} /></span>
                    <p className="mt-2 text-[15px] font-bold">{p.t}</p>
                    <p className="mt-1 text-[13px] leading-snug text-white/75">{p.d}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section id="areas" className="mx-auto max-w-[1240px] scroll-mt-24 px-4 pt-14 md:px-8">
          <p className="eyebrow">Pick your neighbourhood</p>
          <h2 className="font-display mt-2 text-[32px] md:text-[46px]">Communities</h2>
          <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {areas.map((a) => {
              const here = listings.filter((l) => l.areaSlug === a.slug);
              const people = roommates.filter((r) => r.areaSlugs.includes(a.slug)).length;
              const st = stats[a.slug];
              const from = here.length ? Math.min(...here.map((l) => l.priceAed)) : null;
              return (
                <Link key={a.slug} href={`/community/${a.slug}`} className="group overflow-hidden rounded-[24px] border border-line bg-white transition-shadow hover:shadow-[0_18px_44px_rgb(20_92_70/0.12)]">
                  <div className="relative aspect-[16/10] bg-surface">
                    <Image src={areaPhoto(a.slug, listings)} alt={a.name} fill sizes="(max-width: 640px) 100vw, 33vw" className="object-cover transition-transform duration-700 group-hover:scale-[1.04]" />
                    <span className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-brand-deep">
                      <Icon name="lock" size={15} />
                    </span>
                    {a.nearMetro && (
                      <span className="absolute bottom-3 left-3 inline-flex items-center gap-1.5 rounded-full bg-white/95 px-3 py-1 text-[12.5px] font-semibold text-ink">
                        <Icon name="train" size={13} /> {a.nearMetro}
                      </span>
                    )}
                  </div>
                  <div className="p-5">
                    <div className="flex items-baseline justify-between gap-2">
                      <p className="text-[19px] font-bold">{a.name}</p>
                      <p className="text-[12.5px] text-muted">{a.emirate}</p>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-1.5 text-[12.5px] font-semibold">
                      {!!here.length && <span className="rounded-full bg-mint px-2.5 py-1 text-brand">{here.length} places{from ? ` · from ${aed(from)}` : ""}</span>}
                      {!!people && <span className="rounded-full bg-[#fde9f1] px-2.5 py-1 text-[#9d2c5a]">{people} looking for roommates</span>}
                      {!!st?.members && <span className="rounded-full bg-surface px-2.5 py-1 text-ink-2">{st.members} members</span>}
                      {!!st?.questions && <span className="rounded-full bg-surface px-2.5 py-1 text-ink-2">{st.questions} questions</span>}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>

        <p className="mx-auto max-w-[1240px] px-4 pt-4 text-[11.5px] text-muted md:px-8">Neighbourhood photos by Wikimedia Commons contributors under Creative Commons licences, credited on each community page.</p>

        <section className="mx-auto max-w-[1240px] px-4 pt-16 md:px-8">
          <div className="rounded-[30px] bg-[#ecf8ee] p-6 md:p-10">
            <h2 className="font-display text-[30px] md:text-[42px]">What the Stayshay Pass gives you</h2>
            <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {PASS_PERKS.map((p) => (
                <div key={p.t} className="rounded-[20px] bg-white p-5">
                  <span className="flex h-10 w-10 items-center justify-center rounded-[12px] bg-[#ecf8ee] text-brand-deep"><Icon name={p.icon} size={18} /></span>
                  <p className="mt-2 text-[16px] font-bold">{p.t}</p>
                  <p className="mt-1 text-[14px] text-ink-2">{p.d}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <div className="mx-auto max-w-[820px] px-4 py-14 md:px-8">
          <h2 className="font-display text-[28px]">Questions</h2>
          <dl className="mt-4 divide-y divide-line">
            {FAQ.map(([q, a]) => (
              <div key={q} className="py-4">
                <dt className="text-[16px] font-bold">{q}</dt>
                <dd className="mt-1 text-[15px] text-ink-2">{a}</dd>
              </div>
            ))}
          </dl>
        </div>
      </main>
      <Footer />
    </MarketplaceProvider>
  );
}
