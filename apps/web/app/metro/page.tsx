import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { Header } from "@/components/header";
import { Footer } from "@/components/sections";
import { MarketplaceProvider } from "@/components/marketplace";
import { getAllListings } from "@/lib/store";
import { STATIONS, nearStation } from "@/lib/collections";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Bed spaces, partitions and rooms near every Dubai Metro station",
  description: "Find a monthly bed space, partition, room or studio near your Dubai Metro station: Union, Al Rigga, ADCB, BurJuman, Stadium, Mall of the Emirates and more. Live prices.",
  alternates: { canonical: "/metro" },
};

export default async function Page() {
  const all = await getAllListings();
  const rows = STATIONS.map((s) => {
    const l = all.filter((x) => nearStation(s, x));
    return { s, count: l.length, from: l.length ? Math.min(...l.map((x) => x.priceAed)) : null };
  });
  return (
    <MarketplaceProvider>
      <Header />
      <main className="px-2 pt-2 md:px-4 md:pt-3">
        <section className="relative overflow-hidden rounded-[28px] bg-brand-deep px-5 py-12 text-white md:px-10 md:py-16">
          <Image src="/photos/metro.jpg" alt="" fill priority sizes="100vw" className="object-cover" />
          <div className="absolute inset-0 bg-[linear-gradient(100deg,rgb(9_29_21/0.94)_0%,rgb(9_29_21/0.78)_50%,rgb(9_29_21/0.35)_100%)]" />
          <div className="relative mx-auto max-w-[1080px]">
            <p className="text-[12px] font-bold uppercase tracking-[0.14em] text-[#8fe3bd]">Dubai Metro</p>
            <h1 className="font-display mt-3 max-w-[760px] text-[34px] leading-[1.05] md:text-[52px]">Live a short walk from your metro station</h1>
            <p className="mt-4 max-w-[600px] text-[15.5px] text-white/80">Pick your station to see bed spaces, partitions, rooms and studios nearby, with real monthly prices.</p>
          </div>
        </section>
        <section className="mx-auto max-w-[1080px] px-3 py-12">
          <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {rows.map(({ s, count, from }) => (
              <li key={s.slug}>
                <Link href={`/metro/${s.slug}`} className="card block p-5 hover:border-brand">
                  <span className="chip">{s.line} Line</span>
                  <span className="mt-3 block text-[17px] font-bold">{s.name}</span>
                  <span className="mt-1 block text-[13.5px] text-muted">{count ? `${count} places · from AED ${from!.toLocaleString("en-US")}` : "Get matched when one comes up"}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </main>
      <Footer />
    </MarketplaceProvider>
  );
}
