import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ToolShell } from "@/components/tool-shell";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Free tools for renting in Dubai: rent checker, budget, Roommate Swipe, StayFit",
  description: "Free tools for finding a room in Dubai: check if a rent is fair, work out your budget from your salary, swipe through roommates, and find places with a gym.",
  alternates: { canonical: "/tools" },
};

const TOOLS = [
  { href: "/swipe", name: "Roommate Swipe", line: "Swipe through people looking for a flatmate. Like, match, message.", photo: "/photos/roommates.jpg" },
  { href: "/tools/fair-rent", name: "Fair Rent Check", line: "Paste any ad and see if the rent is a steal or a rip-off.", photo: "/photos/area-deira.jpg" },
  { href: "/tools/move-in-cost", name: "Move-in Cost", line: "Deposit, agency fee, Ejari, DEWA: your day-one total for a yearly lease.", photo: "/photos/living.jpg" },
  { href: "/tools/budget", name: "Salary to Rent", line: "Slide your salary, see what you can rent and where.", photo: "/photos/studio.jpg" },
  { href: "/stayfit", name: "StayFit", line: "Rooms in buildings with a gym or pool. Train where you live.", photo: "/photos/area-jvc.jpg" },
  { href: "/metro", name: "Metro Finder", line: "Pick your station, see places a short walk away.", photo: "/photos/metro-station.jpg" },
  { href: "/roommates", name: "Roommate Match", line: "People already looking to share, matched on budget and habits.", photo: "/photos/ladies.jpg" },
];

export default function Page() {
  return (
    <ToolShell eyebrow="Stayshay tools" title="Little tools that save you real money" intro="Free, no sign-up. Built on live prices from real listings." photo="/photos/living.jpg" path="/tools" tool="stayshay">
      <div className="mx-auto grid max-w-[1080px] grid-cols-1 gap-3 px-4 pb-16 sm:grid-cols-2 lg:grid-cols-3">
        {TOOLS.map((t) => (
          <Link key={t.href} href={t.href} className="card group overflow-hidden hover:border-brand">
            <div className="relative aspect-[16/9]">
              <Image src={t.photo} alt="" fill sizes="(min-width:1024px) 33vw, 100vw" className="object-cover transition-transform duration-700 group-hover:scale-[1.03]" />
            </div>
            <div className="p-5">
              <p className="text-[18px] font-bold">{t.name}</p>
              <p className="mt-1 text-[14px] text-muted">{t.line}</p>
            </div>
          </Link>
        ))}
      </div>
    </ToolShell>
  );
}
