import Image from "next/image";
import type { Metadata } from "next";
import Link from "next/link";
import { Header } from "@/components/header";
import { Footer } from "@/components/sections";
import { MarketplaceProvider } from "@/components/marketplace";
import { PartnerCard } from "@/components/partner-card";
import { publicPartners } from "@/lib/referrals";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Partner brokers and agents in Dubai and the UAE",
  description: "Rental brokers and agents who work with Stayshay to find bed spaces, partitions, rooms and studios across Dubai, Sharjah and the UAE. No broker fee for renters.",
  alternates: { canonical: "/partners" },
};

export default async function Page() {
  const partners = await publicPartners();
  return (
    <MarketplaceProvider>
      <Header />
      <main className="mx-auto max-w-[1080px] px-4 pb-20 pt-10 md:px-8 md:pt-14">
        <p className="eyebrow">Stayshay partners</p>
        <h1 className="font-display mt-2 text-[36px] leading-[1.05] md:text-[52px]">Brokers and agents who work with us</h1>
        <p className="mt-4 max-w-[620px] text-[15.5px] leading-relaxed text-ink-2">
          Pick someone who knows your area. You message Stayshay, we coordinate with them, and you never pay a broker fee.
        </p>
        <div className="relative mt-8 aspect-[16/7] overflow-hidden rounded-[24px]">
          <Image src="/photos/partners.jpg" alt="A Stayshay partner handing keys to a new tenant" fill sizes="(min-width:1080px) 1080px, 100vw" className="object-cover" />
        </div>
        {partners.length ? (
          <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {partners.map((p) => (
              <PartnerCard key={p.id} p={p} />
            ))}
          </div>
        ) : (
          <p className="mt-8 rounded-[20px] bg-surface p-6 text-[15px] text-ink-2">The first partner profiles are being reviewed.</p>
        )}
        <div className="glow-panel mt-12 rounded-[24px] p-6 text-white md:p-8">
          <h2 className="text-[22px] font-bold">Are you a broker or agent?</h2>
          <p className="mt-2 max-w-[560px] text-[14.5px] text-white/80">Get a free profile and earn a reward for every renter or owner who joins through you.</p>
          <Link href="/refer" className="mt-5 inline-flex h-11 items-center rounded-[12px] bg-[#6ee7b7] px-5 text-[14.5px] font-bold text-brand-deep">
            Become a partner
          </Link>
        </div>
      </main>
      <Footer />
    </MarketplaceProvider>
  );
}
