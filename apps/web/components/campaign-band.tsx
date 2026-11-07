import Link from "next/link";
import { Icon } from "./ui";
import { CAMPAIGN } from "@/lib/campaign";

/** Homepage band for the challenge: dark green, lime figures. */
export function CampaignBand() {
  return (
    <section className="mx-auto max-w-[1240px] px-4 py-6 md:px-8">
      <div className="grid grid-cols-1 items-center gap-8 rounded-[32px] bg-[#0a1f16] p-7 text-white md:p-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-lime px-3 py-1 text-[12px] font-bold text-brand-deep"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0V4ZM7 6H4a3 3 0 0 0 3 4M17 6h3a3 3 0 0 1-3 4" /></svg> {CAMPAIGN.name}</span>
          <h2 className="font-display mt-4 text-[34px] leading-[1.02] md:text-[54px]">
            Win <span className="text-lime">AED 500</span> to <span className="text-lime">{CAMPAIGN.grandPrize.toLocaleString("en-US")}</span>
          </h2>
          <p className="mt-4 max-w-[480px] text-[15.5px] text-white/80">Refer renters, list rooms, bring family apartment leads or partner as an agent. Real results, real rewards.</p>
          <Link href="/win" className="mt-7 inline-flex h-12 items-center gap-2 rounded-[14px] bg-lime px-6 text-[15px] font-bold text-brand-deep hover:brightness-95">
            See the challenge <span aria-hidden>→</span>
          </Link>
        </div>
        <ul className="grid grid-cols-2 gap-3">
          {CAMPAIGN.tracks.map((t) => (
            <li key={t.key} className="rounded-[20px] border border-white/12 bg-white/[0.05] p-4 md:p-5">
              <span className="flex h-10 w-10 items-center justify-center rounded-[12px] bg-lime text-brand-deep" aria-hidden><Icon name={t.icon} size={18} /></span>
              <p className="mt-2 text-[14.5px] font-semibold leading-tight">{t.title}</p>
              <p className="font-figure mt-2 text-[24px] font-bold text-lime">AED {t.reward.toLocaleString("en-US")}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
