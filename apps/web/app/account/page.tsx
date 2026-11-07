import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Header } from "@/components/header";
import { Footer } from "@/components/sections";
import { MarketplaceProvider } from "@/components/marketplace";
import { AccountForm } from "@/components/auth-forms";
import { currentUser, toPublic } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Your account", robots: { index: false, follow: false } };

export default async function AccountPage({ searchParams }: { searchParams: Promise<{ complete?: string }> }) {
  const u = await currentUser();
  if (!u) redirect("/login?next=/account");
  const { complete } = await searchParams;
  return (
    <MarketplaceProvider>
      <Header />
      <AccountForm user={toPublic(u)} complete={complete === "1"} />
      <div className="mx-auto grid max-w-[560px] gap-3 px-4 pb-16">
        <div className="grid grid-cols-2 gap-3">
          <Link href="/swipe" className="card block p-4 text-[15px] font-bold">Roommate Swipe</Link>
          <Link href="/messages" className="card block p-4 text-[15px] font-bold">Messages</Link>
        </div>
        <Link href="/account/referrals" className="glow-panel block rounded-[22px] p-5 text-white">
          <span className="block text-[12px] font-bold uppercase tracking-[0.14em] text-[#8fe3bd]">Refer & earn</span>
          <span className="mt-1 block text-[18px] font-bold">Your link, the people you brought in, and your rewards</span>
        </Link>
      </div>
      <Footer />
    </MarketplaceProvider>
  );
}
