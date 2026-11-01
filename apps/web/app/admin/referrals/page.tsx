import type { Metadata } from "next";
import { AdminLogin } from "@/components/admin";
import { AdminReferrals } from "@/components/admin-referrals";
import { adminAllowed } from "@/lib/admin-guard";
import { readPartners, readRewards, referralsByCode } from "@/lib/referrals";
import { readUsers } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Admin · Referrals", robots: { index: false, follow: false } };

export default async function Page() {
  if (!(await adminAllowed())) return <AdminLogin />;
  const [byCode, partners, rewards, users] = await Promise.all([referralsByCode(), readPartners(), readRewards(), readUsers()]);
  const owners = new Map(users.filter((u) => u.refCode).map((u) => [u.refCode!, { name: u.name, phone: u.phone }]));
  return (
    <AdminReferrals
      codes={[...byCode].map(([code, people]) => ({ code, owner: owners.get(code) ?? null, people }))}
      partners={partners}
      rewards={rewards}
    />
  );
}
