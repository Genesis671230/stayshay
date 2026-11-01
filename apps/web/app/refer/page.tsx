import type { Metadata } from "next";
import Link from "next/link";
import { REFERRAL_REWARDS } from "@stayshay/core";
import { Header } from "@/components/header";
import { Footer } from "@/components/sections";
import { MarketplaceProvider } from "@/components/marketplace";
import { PartnerCard } from "@/components/partner-card";
import { JsonLd } from "@/components/json-ld";
import { publicPartners } from "@/lib/referrals";
import { currentUser } from "@/lib/auth";
import { faqLd } from "@/lib/seo";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Refer & earn — rewards for brokers, agents and friends",
  description: `Earn AED ${REFERRAL_REWARDS.tenant_move_in} for every renter and AED ${REFERRAL_REWARDS.owner_first_fill} for every owner you bring to Stayshay who moves in or fills a bed. Free partner profile for brokers and agents in Dubai and the UAE.`,
  alternates: { canonical: "/refer" },
};

const FAQ: [string, string][] = [
  ["Who can join?", "Anyone: brokers, agents, building watchmen, metro guides, HR teams, friends. Brokers and agents also get a public partner profile."],
  ["When do I get paid?", "After the person you referred moves in through Stayshay (or the owner you referred gets their first tenant). We confirm with the owner, then pay to your WhatsApp-linked account."],
  ["Do renters pay anything?", "No. Renters never pay Stayshay, and your reward never comes out of their rent or deposit."],
  ["Is this a brokerage commission?", "No. It's a referral reward paid by Stayshay for introductions. If you broker rentals yourself in Dubai, keep your RERA registration up to date."],
  ["Can I see who joined through me?", "Yes. Your dashboard lists everyone who signed up, searched, posted a roommate profile or listed a place through your link, and where they are now."],
];

export default async function Page() {
  const [partners, me] = await Promise.all([publicPartners(), currentUser()]);
  const cta = me ? "/account/referrals" : "/login?next=/account/referrals";
  const steps = [
    ["Get your link", "Sign in and copy your personal link. It takes ten seconds."],
    ["Share it", "Send it on WhatsApp, in groups, at the metro, on your status. Owners with empty beds count too."],
    ["Track everyone", "See each person who joins through you and where they are: searching, listed, moved in."],
    ["Get rewarded", `AED ${REFERRAL_REWARDS.tenant_move_in} per renter who moves in, AED ${REFERRAL_REWARDS.owner_first_fill} per owner who gets a tenant.`],
  ];
  return (
    <MarketplaceProvider>
      <JsonLd data={[faqLd(FAQ)]} />
      <Header />
      <main>
        <section className="px-2 pt-2 md:px-4 md:pt-3">
          <div className="glow-panel relative overflow-hidden rounded-[32px] px-5 pb-12 pt-14 text-white md:px-10 md:pb-16 md:pt-20">
            <div className="mx-auto max-w-[1080px]">
              <p className="text-[12px] font-bold uppercase tracking-[0.14em] text-[#8fe3bd]">Refer & earn</p>
              <h1 className="font-display mt-4 max-w-[760px] text-[40px] leading-[1.0] md:text-[68px]">
                Know someone looking for a room? <span className="glow-text">Get paid when they move in.</span>
              </h1>
              <p className="mt-5 max-w-[560px] text-[16px] leading-relaxed text-white/80 md:text-[18px]">
                Built for brokers, agents and anyone who knows people moving in the UAE. Every person you bring stays linked to you.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link href={cta} className="flex h-13 items-center justify-center rounded-[16px] bg-[#6ee7b7] px-7 py-3.5 text-[16px] font-bold text-brand-deep shadow-[0_0_40px_rgb(110_231_183/0.5)]">
                  Get my referral link
                </Link>
                <Link href="/partners" className="flex h-13 items-center justify-center rounded-[16px] border border-white/25 px-7 py-3.5 text-[16px] font-semibold hover:bg-white/10">
                  See partner brokers
                </Link>
              </div>
              <div className="mt-12 grid grid-cols-2 gap-3 md:max-w-[620px]">
                <div className="rounded-[20px] border border-white/12 bg-white/[0.06] p-5">
                  <p className="font-figure text-[32px] font-bold md:text-[40px]">AED {REFERRAL_REWARDS.tenant_move_in}</p>
                  <p className="text-[13.5px] text-white/70">per renter who moves in</p>
                </div>
                <div className="rounded-[20px] border border-white/12 bg-white/[0.06] p-5">
                  <p className="font-figure text-[32px] font-bold md:text-[40px]">AED {REFERRAL_REWARDS.owner_first_fill}</p>
                  <p className="text-[13.5px] text-white/70">per owner who fills a bed</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-[1080px] px-4 py-16 md:px-8 md:py-20">
          <p className="eyebrow">How it works</p>
          <h2 className="font-display mt-2 text-[32px] leading-[1.08] md:text-[44px]">Four steps, no paperwork</h2>
          <ol className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map(([t, d], i) => (
              <li key={t} className="rounded-[22px] border border-line p-5">
                <span className="font-figure text-[13px] font-bold text-fresh">0{i + 1}</span>
                <span className="mt-2 block text-[17px] font-bold">{t}</span>
                <span className="mt-1 block text-[14px] leading-relaxed text-muted">{d}</span>
              </li>
            ))}
          </ol>
        </section>

        <section className="bg-surface px-4 py-16 md:px-8 md:py-20">
          <div className="mx-auto max-w-[1080px]">
            <p className="eyebrow">For brokers and agents</p>
            <h2 className="font-display mt-2 max-w-[720px] text-[32px] leading-[1.08] md:text-[44px]">A partner profile that keeps working for you</h2>
            <p className="mt-4 max-w-[640px] text-[15.5px] leading-relaxed text-ink-2">
              Your profile lives on Stayshay with your areas and languages. Everyone who finds you there joins under your code, and your dashboard shows each of them.
              Renters message Stayshay, we coordinate the viewing, and the reward comes to you.
            </p>
            {partners.length > 0 ? (
              <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {partners.slice(0, 6).map((p) => (
                  <PartnerCard key={p.id} p={p} />
                ))}
              </div>
            ) : (
              <p className="mt-6 text-[14.5px] text-muted">The first partner profiles are in review. Yours could be one of them.</p>
            )}
            <Link href={cta} className="mt-8 inline-flex h-12 items-center rounded-[14px] bg-brand px-6 text-[15px] font-semibold text-white">
              Create my partner profile
            </Link>
          </div>
        </section>

        <section className="mx-auto max-w-[820px] px-4 py-16 md:px-8">
          <h2 className="font-display text-[30px] md:text-[38px]">Questions</h2>
          <div className="mt-6 divide-y divide-line rounded-[22px] border border-line">
            {FAQ.map(([q, a]) => (
              <details key={q} className="group px-5 py-4">
                <summary className="cursor-pointer list-none text-[16px] font-semibold">{q}</summary>
                <p className="mt-2 text-[14.5px] leading-relaxed text-ink-2">{a}</p>
              </details>
            ))}
          </div>
        </section>
      </main>
      <Footer />
    </MarketplaceProvider>
  );
}
