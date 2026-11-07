import type { Metadata } from "next";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { Header } from "@/components/header";
import { MarketplaceProvider } from "@/components/marketplace";
import { MessagesPage } from "@/components/messages-page";
import { currentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Messages", robots: { index: false, follow: false } };

export default async function Page({ searchParams }: { searchParams: Promise<{ with?: string }> }) {
  if (!(await currentUser())) {
    const { with: w } = await searchParams;
    redirect(`/login?next=${encodeURIComponent(w ? `/messages?with=${w}` : "/messages")}`);
  }
  return (
    <MarketplaceProvider syncUrl={false}>
      <Header />
      <Suspense>
        <MessagesPage />
      </Suspense>
    </MarketplaceProvider>
  );
}
