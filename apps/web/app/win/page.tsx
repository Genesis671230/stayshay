import Image from "next/image";
import type { Metadata } from "next";
import { Header } from "@/components/header";
import { Footer } from "@/components/sections";
import { MarketplaceProvider } from "@/components/marketplace";
import { JsonLd } from "@/components/json-ld";
import { Faq } from "@/components/seo-blocks";
import { CampaignApply } from "@/components/campaign-apply";
import { CAMPAIGN } from "@/lib/campaign";
import { breadcrumbLd, faqLd } from "@/lib/seo";

export const dynamic = "force-dynamic";

const ends = new Date(`${CAMPAIGN.endsOn}T23:59:59+04:00`);
const endsLabel = ends.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "Asia/Dubai" });
const aed = (n: number) => `AED ${n.toLocaleString("en-US")}`;

export const metadata: Metadata = {
  title: `Win AED 500 to ${CAMPAIGN.grandPrize.toLocaleString("en-US")}: the Stayshay Challenge for referrers, agents and owners`,
  description: `Refer renters, list rooms, bring family apartment leads or partner as an agent. Earn from AED 500 per challenge, and the top performer wins AED ${CAMPAIGN.grandPrize.toLocaleString("en-US")}. Ends ${endsLabel}.`,
  alternates: { canonical: "/win" },
};

const FAQ: [string, string][] = [
  ["Is this a lucky draw?", "No. Every reward is for real results: people who move in, listings that get tenants, families who sign a lease. Nothing is random."],
  ["When do I get paid?", "After our team confirms the result with the owner or tenant, usually within 14 days of the move-in or lease. We pay by bank transfer or the method we agree on WhatsApp."],
  ["Can I join more than one challenge?", "Yes. Each challenge pays separately, and results from all of them count towards the grand prize."],
  ["How is the grand prize decided?", `The person with the most confirmed results across all challenges by ${endsLabel} wins ${aed(CAMPAIGN.grandPrize)}, as long as they have at least 10 confirmed results. In a tie, the earlier results win.`],
  ["Do renters pay anything?", "No. Renters never pay Stayshay, and rewards never come out of anyone's rent or deposit."],
  ["Are agents allowed to join?", "Yes. If you broker rentals in Dubai, keep your RERA registration up to date. This is a referral reward paid by Stayshay, not a brokerage commission."],
];

const TRACK_PHOTO: Record<string, string> = { referrals: "/photos/roommates.jpg", agents: "/photos/partners.jpg", listings: "/photos/room.jpg", leads: "/photos/couples.jpg" };

const RULES = [
  "Only real, confirmed results count. Fake leads, self-referrals and duplicate people are removed.",
  "A person or listing counts once, for whoever brought them first.",
  "Listings must be approved by our team and follow Dubai rules (no illegal partitions or overcrowding).",
  `Results count until ${endsLabel} (Dubai time). Stayshay may extend or end the challenge early, and keeps rewards already earned.`,
  "Stayshay's decision on what counts as a confirmed result is final.",
];

export default function Page() {
  const crumbs: [string, string][] = [["Home", "/"], ["Win AED 5,000", "/win"]];
  const daysLeft = Math.max(0, Math.ceil((ends.getTime() - Date.now()) / 86400000));
  return (
    <MarketplaceProvider>
      <JsonLd data={[breadcrumbLd(crumbs), faqLd(FAQ)]} />
      <Header />
      <main>
        <section className="px-2 pt-2 md:px-4 md:pt-3">
          <div className="relative overflow-hidden rounded-[32px] bg-[#0a1f16] px-5 py-14 text-white md:px-10 md:py-20">
            <Image src="/photos/partners.jpg" alt="" fill priority sizes="100vw" className="object-cover opacity-35" />
            <div className="absolute inset-0 bg-[linear-gradient(100deg,rgb(10_31_22/0.96)_0%,rgb(10_31_22/0.8)_55%,rgb(10_31_22/0.4)_100%)]" aria-hidden />
            <div className="relative mx-auto grid max-w-[1180px] grid-cols-1 items-center gap-10 lg:grid-cols-[minmax(0,1fr)_auto]">
              <div>
                <span className="inline-flex items-center gap-2 rounded-full bg-lime px-3.5 py-1.5 text-[12.5px] font-bold text-brand-deep"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0V4ZM7 6H4a3 3 0 0 0 3 4M17 6h3a3 3 0 0 1-3 4" /></svg> {CAMPAIGN.name}{daysLeft ? ` · ${daysLeft} days left` : ""}</span>
                <h1 className="font-display mt-6 text-[42px] leading-[0.98] md:text-[76px]">
                  Win <span className="text-lime">AED 500</span> to <span className="text-lime">AED {CAMPAIGN.grandPrize.toLocaleString("en-US")}</span>
                </h1>
                <p className="mt-5 max-w-[620px] text-[16px] leading-relaxed text-white/85 md:text-[18px]">
                  For referrers, agents, owners and anyone who knows people moving in Dubai. Pick a challenge, bring real results, get paid. The top performer takes the grand prize.
                </p>
                <a href="#apply" className="mt-8 inline-flex h-13 items-center rounded-[16px] bg-lime px-7 py-3.5 text-[16px] font-bold text-brand-deep hover:brightness-95">
                  Join the challenge, free
                </a>
              </div>
              <div className="rounded-[28px] border border-white/15 bg-white/[0.06] p-7 text-center backdrop-blur">
                <p className="text-[12px] font-bold uppercase tracking-[0.14em] text-[#8fe3bd]">Grand prize</p>
                <p className="font-figure mt-2 text-[56px] font-bold leading-none md:text-[72px]">{CAMPAIGN.grandPrize.toLocaleString("en-US")}</p>
                <p className="mt-1 text-[15px] text-white/75">AED for the top performer</p>
                <p className="mt-4 text-[13px] text-white/60">Ends {endsLabel}</p>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-[1240px] px-4 py-14 md:px-8 md:py-20">
          <p className="eyebrow">Four ways to win</p>
          <h2 className="font-display mt-2 text-[34px] leading-[1.05] md:text-[52px]">Pick your challenge</h2>
          <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {CAMPAIGN.tracks.map((t, i) => (
              <div key={t.key} className="flex flex-col overflow-hidden rounded-[26px] bg-[#f3f7f4] ring-1 ring-line">
                <div className="relative aspect-[4/3]">
                  <Image src={TRACK_PHOTO[t.key]} alt="" fill sizes="(min-width:1024px) 300px, (min-width:640px) 50vw, 100vw" className="object-cover" />
                  <span className="font-figure absolute bottom-3 left-3 rounded-full bg-white px-3 py-1 text-[15px] font-bold text-brand-deep">{aed(t.reward)}</span>
                </div>
                <div className="flex flex-1 flex-col p-6">
                  <p className="font-display text-[24px] leading-tight text-ink">{t.title}</p>
                  <p className="mt-1 text-[13.5px] text-ink-2">{t.who}</p>
                  <p className="mt-4 flex-1 text-[14px] leading-snug text-ink-2">{aed(t.reward)} when {t.target.charAt(0).toLowerCase() + t.target.slice(1)}</p>
                  <a href="#apply" className="mt-5 inline-flex h-10 w-fit items-center gap-2 rounded-full border border-ink px-4 text-[14px] font-semibold hover:bg-ink hover:text-white">
                    Join <span aria-hidden>→</span>
                  </a>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section id="apply" className="mx-auto grid max-w-[1240px] scroll-mt-24 grid-cols-1 gap-10 px-4 pb-16 md:px-8 lg:grid-cols-[minmax(0,1fr)_480px]">
          <div>
            <h2 className="font-display text-[30px] md:text-[42px]">How it works</h2>
            <ol className="mt-6 divide-y divide-line border-y border-line">
              {[
                ["Apply in 30 seconds", "Pick a challenge and leave your name and WhatsApp. We confirm you on WhatsApp."],
                ["Get your tracking link", "Every person or listing that comes through your link is tied to you, and you can see where each one is."],
                ["Bring real results", "Share your link, list your rooms, introduce families. We do the matching, viewings and paperwork."],
                ["Get paid", "Once a result is confirmed, the reward is yours. The top performer also wins the grand prize."],
              ].map(([t, d], i) => (
                <li key={t} className="flex gap-5 py-5">
                  <span className="font-figure flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand-deep text-[16px] font-bold text-white">{i + 1}</span>
                  <span>
                    <span className="block text-[17px] font-semibold">{t}</span>
                    <span className="text-[15px] text-ink-2">{d}</span>
                  </span>
                </li>
              ))}
            </ol>
            <h3 className="font-display mt-10 text-[22px]">Rules</h3>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-[14.5px] text-ink-2">
              {RULES.map((r) => (
                <li key={r}>{r}</li>
              ))}
            </ul>
          </div>
          <div className="lg:sticky lg:top-24 lg:self-start">
            <CampaignApply />
          </div>
        </section>

        <div className="mx-auto max-w-[820px] px-4 pb-16 md:px-8">
          <Faq faq={FAQ} />
        </div>
      </main>
      <Footer />
    </MarketplaceProvider>
  );
}
