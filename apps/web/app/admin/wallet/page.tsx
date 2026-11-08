import type { Metadata } from "next";
import { AdminLogin } from "@/components/admin";
import { AdminWallet } from "@/components/admin-wallet";
import { adminAllowed } from "@/lib/admin-guard";
import { readWallet } from "@/lib/wallet";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Admin · Wallet", robots: { index: false, follow: false } };

export default async function Page() {
  if (!(await adminAllowed())) return <AdminLogin />;
  const { redemptions, entries } = await readWallet();
  const held = entries.reduce((n, e) => n + e.amount, 0);
  return <AdminWallet items={[...redemptions].reverse()} held={held} />;
}
