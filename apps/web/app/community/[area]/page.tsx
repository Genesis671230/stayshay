import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AREA_BY_SLUG } from "@stayshay/core";
import { Header } from "@/components/header";
import { Footer } from "@/components/sections";
import { MarketplaceProvider } from "@/components/marketplace";
import { JsonLd } from "@/components/json-ld";
import { Icon, aed } from "@/components/ui";
import { CommunityRoom } from "@/components/community-room";
import { getAllListings, slim } from "@/lib/store";
import { gateRoommates, publicRoommates } from "@/lib/roommates";
import { FREE_PROFILES, accessFor, communityFeed, communityMembers, communityStats, readPasses } from "@/lib/community";
import { PASS_PERKS, areaPhoto } from "@/lib/community-meta";
import { currentUser } from "@/lib/auth";
import { stripeEnabled } from "@/lib/stripe";
import { breadcrumbLd } from "@/lib/seo";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ area: string }> }): Promise<Metadata> {
  const a = AREA_BY_SLUG.get((await params).area);
  if (!a) return {};
  return {
    title: `${a.name} community: roommates, residents and rooms`,
    description: `Meet roommates and residents in ${a.name}, ${a.emirate}. Ask about buildings, landlords and the metro${a.nearMetro ? ` (${a.nearMetro})` : ""} before you move. Stayshay community.`,
    alternates: { canonical: `/community/${a.slug}` },
  };
}

export default async function Page({ params, searchParams }: { params: Promise<{ area: string }>; searchParams: Promise<{ welcome?: string; join?: string; canceled?: string }> }) {
  const [{ area: slug }, sp] = await Promise.all([params, searchParams]);
  const a = AREA_BY_SLUG.get(slug);
  if (!a) notFound();
  const user = await currentUser();
  const [listings, roommates, access, stats] = await Promise.all([getAllListings(), publicRoommates(), accessFor(user, slug), communityStats()]);
  const here = listings.filter((l) => l.areaSlug === slug).sort((x, y) => x.priceAed - y.priceAed);
  const people = roommates.filter((r) => r.areaSlugs.includes(slug));
  const { open, locked } = gateRoommates(people, access.member || access.anyPass, FREE_PROFILES);
  const feed = access.member && user ? await communityFeed(slug, user.id) : null;
  const members = access.member ? await communityMembers(slug) : [];
  const st = stats[slug] ?? { members: 0, questions: 0, messages: 0 };
  const hasBilling = !!user && (await readPasses()).some((p) => p.userId === user.id && p.customerId);
  const crumbs: [string, string][] = [["Home", "/"], ["Communities", "/community"], [a.name, `/community/${slug}`]];
  const from = here.length ? here[0].priceAed : null;

  return (
    <MarketplaceProvider listings={slim(here)}>
      <JsonLd data={[breadcrumbLd(crumbs)]} />
      <Header />
      <main>
        <section className="px-2 pt-2 md:px-4 md:pt-3">
          <div className="relative overflow-hidden rounded-[30px] bg-brand-deep">
            <Image src={areaPhoto(slug, listings)} alt={a.name} fill priority sizes="100vw" className="object-cover" />
            <div className="absolute inset-0 bg-[linear-gradient(100deg,rgb(9_29_21/0.94)_0%,rgb(9_29_21/0.8)_50%,rgb(9_29_21/0.45)_100%)]" />
            <div className="relative mx-auto max-w-[1240px] px-5 py-12 md:px-10 md:py-16">
              <nav className="flex flex-wrap items-center gap-1.5 text-[13px] text-white/70" aria-label="Breadcrumb">
                {crumbs.map(([name, href], i) => (
                  <span key={href} className="flex items-center gap-1.5">
                    {i > 0 && <Icon name="chevron-right" size={12} />}
                    {i < crumbs.length - 1 ? <Link href={href} className="hover:text-white">{name}</Link> : <span className="text-white">{name}</span>}
                  </span>
                ))}
              </nav>
              <div className="mt-6 flex flex-wrap items-center gap-2">
                <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[12.5px] font-bold ${access.member ? "bg-lime text-brand-deep" : "bg-white/12 text-white"}`}>
                  <Icon name={access.member ? "check" : "lock"} size={13} /> {access.member ? "You’re a member" : "Members-only community"}
                </span>
                {a.nearMetro && (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-white/12 px-3 py-1 text-[12.5px] font-semibold text-white">
                    <Icon name="train" size={13} /> {a.nearMetro}
                  </span>
                )}
              </div>
              <h1 className="font-display mt-4 text-[40px] leading-[1.0] text-white md:text-[68px]">{a.name} community</h1>
              <p className="mt-4 max-w-[620px] text-[16px] leading-relaxed text-white/85">
                The people looking for roommates in {a.name}, residents who know the buildings, and one group chat for everything about living here.
              </p>
              <div className="mt-6 flex flex-wrap gap-6 text-white">
                {[
                  [here.length, "places live"],
                  [people.length, "looking for roommates"],
                  [st.members, "members"],
                  [st.questions, "questions asked"],
                ]
                  .filter(([n]) => Number(n) > 0)
                  .map(([n, l]) => (
                  <div key={String(l)}>
                    <p className="font-display text-[34px] leading-none">{n}</p>
                    <p className="mt-1 text-[13px] text-white/70">{l}</p>
                  </div>
                ))}
                {from && (
                  <div>
                    <p className="font-display text-[34px] leading-none">{aed(from)}</p>
                    <p className="mt-1 text-[13px] text-white/70">cheapest right now</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        <CommunityRoom
          area={{ slug, name: a.name, metro: a.nearMetro }}
          access={{ signedIn: access.signedIn, member: access.member, admin: access.admin }}
          me={user ? { name: user.name } : null}
          open={open}
          locked={locked}
          feed={feed}
          members={members.map((m) => ({ id: m.id, name: m.name, since: m.since }))}
          counts={st}
          perks={PASS_PERKS}
          places={here.slice(0, 6)}
          flags={{ welcome: sp.welcome === "1", join: sp.join === "1", canceled: sp.canceled === "1", payments: stripeEnabled(), billing: hasBilling }}
        />
      </main>
      <Footer />
    </MarketplaceProvider>
  );
}
