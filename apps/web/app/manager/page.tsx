import type { Metadata } from "next";
import Link from "next/link";
import { Header } from "@/components/header";
import { Footer } from "@/components/sections";
import { MarketplaceProvider } from "@/components/marketplace";
import { ManagerApp } from "@/components/manager";
import { JsonLd } from "@/components/json-ld";
import { currentUser } from "@/lib/auth";
import { ownerData } from "@/lib/manager";
import { faqLd } from "@/lib/seo";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const user = await currentUser();
  return user
    ? { title: "Stayshay Manager", robots: { index: false, follow: false } }
    : {
        title: "Bed space and partition management software for Dubai owners — free",
        description: "Track tenants, rent collection, DEWA, Wi-Fi, cleaner and your rent to the landlord for every apartment. See who's late and what you really make each month. Free with Stayshay.",
        alternates: { canonical: "/manager" },
      };
}

const FAQ: [string, string][] = [
  ["Who is Stayshay Manager for?", "Anyone who rents out bed spaces, partitions or rooms in Dubai and the UAE: owners, and main tenants who rent a 1BHK, 2BHK or 3BHK and sublet spaces inside it."],
  ["What does it cost?", "It's free while we're in early access."],
  ["Can I manage several apartments?", "Yes. Add as many apartments as you run. Each has its own spaces, tenants, bills and rent to the landlord, and the dashboard adds them all up."],
  ["Do my tenants see anything?", "No. Your dashboard is private to your account. You can send rent reminders to tenants on WhatsApp in one tap."],
  ["Can I fill empty beds through Stayshay?", "Yes. Every empty space has a List on Stayshay button that starts a listing with the area and rent filled in."],
];

export default async function Page() {
  const user = await currentUser();
  if (user) return <ManagerApp initial={await ownerData(user.id)} ownerName={user.name} />;

  const points = [
    ["Every apartment, every bed", "Add each 1BHK, 2BHK or villa you run and split it into beds, partitions and rooms with their own rent."],
    ["Rent collection at a glance", "See who has paid this month, who is late and by how much. Mark paid in one tap, remind on WhatsApp in another."],
    ["Your real margin", "Rent to your landlord, DEWA, Wi-Fi, gas, chiller and the cleaner, set once. Stayshay shows what you actually make."],
    ["Warnings before problems", "Permit and lease expiry, tenant visa expiry and empty beds, flagged before they cost you."],
    ["Fill empty beds", "Any empty space goes live on the Stayshay marketplace in a minute, with no broker fee."],
    ["Monthly report", "Every payment in and out per month, downloadable as a spreadsheet for your records."],
  ];
  return (
    <MarketplaceProvider>
      <JsonLd data={[faqLd(FAQ)]} />
      <Header />
      <main>
        <section className="px-2 pt-2 md:px-4 md:pt-3">
          <div className="glow-panel overflow-hidden rounded-[32px] px-5 pb-14 pt-14 text-white md:px-10 md:pb-20 md:pt-20">
            <div className="mx-auto max-w-[1080px]">
              <p className="text-[12px] font-bold uppercase tracking-[0.14em] text-[#8fe3bd]">Stayshay Manager · for owners and operators</p>
              <h1 className="font-display mt-4 max-w-[820px] text-[40px] leading-[1.0] md:text-[66px]">
                Your beds full. Your rent on time. <span className="glow-text">Your margin clear.</span>
              </h1>
              <p className="mt-5 max-w-[600px] text-[16px] leading-relaxed text-white/80 md:text-[18px]">
                For everyone who rents a flat and runs bed spaces and partitions inside it. Tenants, rent, bills and the landlord's cheques, in one simple dashboard.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link href="/login?next=/manager" className="flex items-center justify-center rounded-[16px] bg-[#6ee7b7] px-7 py-3.5 text-[16px] font-bold text-brand-deep shadow-[0_0_40px_rgb(110_231_183/0.5)]">
                  Start free
                </Link>
                <Link href="/list" className="flex items-center justify-center rounded-[16px] border border-white/25 px-7 py-3.5 text-[16px] font-semibold hover:bg-white/10">
                  List an empty bed
                </Link>
              </div>
              <div className="mt-12 grid max-w-[760px] grid-cols-3 gap-3">
                {[
                  ["Collected", "AED 7,450", "of AED 8,300"],
                  ["Late", "1 tenant", "AED 850"],
                  ["Margin", "AED 2,100", "this month"],
                ].map(([k, v, s]) => (
                  <div key={k} className="rounded-[20px] border border-white/12 bg-white/[0.06] p-4">
                    <p className="text-[12px] text-white/60">{k}</p>
                    <p className="font-figure mt-1 text-[18px] font-bold md:text-[24px]">{v}</p>
                    <p className="text-[12px] text-white/50">{s}</p>
                  </div>
                ))}
              </div>
              <p className="mt-2 text-[11.5px] text-white/40">Example figures</p>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-[1080px] px-4 py-14 md:px-8 md:py-20">
          <p className="eyebrow">What you get</p>
          <h2 className="font-display mt-2 text-[32px] leading-[1.08] md:text-[44px]">Built for how Dubai bed spaces really work</h2>
          <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {points.map(([t, d]) => (
              <div key={t} className="rounded-[22px] border border-line p-5">
                <span className="block h-2 w-2 rounded-full bg-fresh shadow-[0_0_12px_#27ae78]" />
                <p className="mt-3 text-[17px] font-bold">{t}</p>
                <p className="m-short mt-1 text-[14px] leading-relaxed text-muted">{d}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="bg-surface px-4 py-14 md:px-8 md:py-20">
          <div className="mx-auto max-w-[820px]">
            <h2 className="font-display text-[30px] md:text-[38px]">Questions</h2>
            <div className="mt-6 divide-y divide-line rounded-[22px] border border-line bg-white">
              {FAQ.map(([q, a]) => (
                <details key={q} className="px-5 py-4">
                  <summary className="cursor-pointer list-none text-[16px] font-semibold">{q}</summary>
                  <p className="mt-2 text-[14.5px] leading-relaxed text-ink-2">{a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </MarketplaceProvider>
  );
}
