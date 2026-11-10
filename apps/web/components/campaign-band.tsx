import Image from "next/image";
import Link from "next/link";
import { CAMPAIGN } from "@/lib/campaign";

const PHOTO: Record<string, string> = { referrals: "/photos/roommates.jpg", agents: "/photos/partners.jpg", listings: "/photos/room.jpg", leads: "/photos/couples.jpg" };

/** Homepage band for the challenge: dark green, photo tiles with the reward on each. */
export function CampaignBand() {
  return (
    <section className="mx-auto max-w-[1240px] px-4 py-6 md:px-8">
      <div className="grid grid-cols-1 items-center gap-8 rounded-[32px] bg-[#0a1f16] p-7 text-white md:p-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-lime px-3 py-1 text-[12px] font-bold text-brand-deep">{CAMPAIGN.name}</span>
          <h2 className="font-display mt-4 text-[34px] leading-[1.02] md:text-[54px]">
            Win <span className="text-lime">AED 500</span> to <span className="text-lime">{CAMPAIGN.grandPrize.toLocaleString("en-US")}</span>
          </h2>
          <p className="mt-4 max-w-[420px] text-[15.5px] text-white/75">Bring renters, listings or families. Get paid when they move in.</p>
          <Link href="/win" className="mt-7 inline-flex h-12 items-center gap-2 rounded-[14px] bg-lime px-6 text-[15px] font-bold text-brand-deep hover:brightness-95">
            See the challenge
          </Link>
        </div>
        <ul className="grid grid-cols-2 gap-3">
          {CAMPAIGN.tracks.map((t) => (
            <li key={t.key} className="relative aspect-[4/5] overflow-hidden rounded-[22px] md:aspect-[4/4.2]">
              <Image src={PHOTO[t.key]} alt="" fill sizes="(min-width: 1024px) 260px, 45vw" className="object-cover" />
              <span className="absolute inset-0 bg-[linear-gradient(180deg,rgb(0_0_0/0.05)_30%,rgb(10_31_22/0.9)_100%)]" />
              <span className="absolute inset-x-4 bottom-4">
                <span className="font-figure block text-[24px] font-bold text-lime">AED {t.reward.toLocaleString("en-US")}</span>
                <span className="mt-0.5 block text-[14px] font-semibold leading-tight">{t.title}</span>
              </span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
