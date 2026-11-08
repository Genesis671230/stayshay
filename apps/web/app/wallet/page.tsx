import type { Metadata } from "next";
import { Suspense } from "react";
import { notFound, redirect } from "next/navigation";
import { Header } from "@/components/header";
import { MarketplaceProvider } from "@/components/marketplace";
import { WalletPage } from "@/components/wallet-page";
import { currentUser } from "@/lib/auth";
import { walletEnabled } from "@/lib/wallet";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Wallet", robots: { index: false, follow: false } };

export default async function Page() {
  if (!walletEnabled()) notFound();
  if (!(await currentUser())) redirect("/login?next=/wallet");
  return (
    <MarketplaceProvider>
      <Header />
      <Suspense>
        <WalletPage />
      </Suspense>
    </MarketplaceProvider>
  );
}
