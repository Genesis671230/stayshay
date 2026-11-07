import type { Metadata } from "next";
import { Header } from "@/components/header";
import { Footer } from "@/components/sections";
import { MarketplaceProvider } from "@/components/marketplace";
import { RoomieStage } from "@/components/roomie/section";
import { JsonLd } from "@/components/json-ld";
import { getAllListings, slim } from "@/lib/store";
import { publicRoommates } from "@/lib/roommates";
import { SITE } from "@/lib/seo";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Find a roommate in Dubai: swipe, connect, move in",
  description: "Find a roommate or flatmate in Dubai and the UAE. Make a profile, swipe through checked people matched on budget, area and routine, match and message.",
  alternates: { canonical: "/roommates" },
};

const FAQ = [
  ["Is it free?", "Making a profile, swiping your first 6 profiles and liking people are free. The Stayshay Pass (AED 25 a month, cancel any time) unlocks every profile and messaging."],
  ["Who can see my profile?", "Signed-in people on Stayshay looking for a roommate, after our team approves it. Only your first name is shown, never your surname, number or email."],
  ["How does matching work?", "Shared flats here are ladies-only or men-only, so you see people of the same gender. They're ranked by budget, areas, move-in date and lifestyle, best fit first."],
  ["How do matches work?", "Swipe right (or tap the heart) on people you like. If they swipe right on you too, it's a match and you can message each other with the Stayshay Pass."],
  ["How do I stay safe?", "Meet in a public place first, view the room in person, and never pay a deposit before you've seen it and signed. Report anyone who asks for money up front."],
];

export default async function Page() {
  const [listings, profiles] = await Promise.all([getAllListings(), publicRoommates()]);
  return (
    <MarketplaceProvider listings={slim(listings)}>
      <JsonLd data={[{ "@context": "https://schema.org", "@type": "FAQPage", url: `${SITE}/roommates`, mainEntity: FAQ.map(([q, a]) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a } })) }]} />
      <Header />
      <main>
        <RoomieStage people={profiles.length} returnTo="/roommates" title="Find a roommate you’d actually live with." intro="Make your profile, swipe right on people who fit your budget, area and routine, and match. Everyone is checked by our team." />
        <section className="mx-auto max-w-[860px] px-4 py-14">
          <h2 className="font-display text-[30px] leading-tight md:text-[38px]">Roommates in Dubai, the simple way</h2>
          <div className="mt-6 divide-y divide-line">
            {FAQ.map(([q, a]) => (
              <details key={q} className="group py-4">
                <summary className="cursor-pointer list-none text-[16.5px] font-semibold">{q}</summary>
                <p className="mt-2 text-[15px] leading-relaxed text-ink-2">{a}</p>
              </details>
            ))}
          </div>
        </section>
      </main>
      <Footer />
    </MarketplaceProvider>
  );
}
