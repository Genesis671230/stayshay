import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Header } from "@/components/header";
import { Footer } from "@/components/sections";
import { MarketplaceProvider } from "@/components/marketplace";
import { AccountForm } from "@/components/auth-forms";
import { currentUser, toPublic } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Your account | Stayshay" };

export default async function AccountPage({ searchParams }: { searchParams: Promise<{ complete?: string }> }) {
  const u = await currentUser();
  if (!u) redirect("/login?next=/account");
  const { complete } = await searchParams;
  return (
    <MarketplaceProvider>
      <Header />
      <AccountForm user={toPublic(u)} complete={complete === "1"} />
      <Footer />
    </MarketplaceProvider>
  );
}
