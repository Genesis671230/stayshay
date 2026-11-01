import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Header } from "@/components/header";
import { Footer } from "@/components/sections";
import { MarketplaceProvider } from "@/components/marketplace";
import { ReferralDashboard } from "@/components/referrals";
import { currentUser, ensureRefCode } from "@/lib/auth";
import { readPartners, summaryFor } from "@/lib/referrals";
import { SITE } from "@/lib/seo";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Refer & earn — your dashboard", robots: { index: false, follow: false } };

export default async function Page() {
  const user = await currentUser();
  if (!user) redirect("/login?next=/account/referrals");
  const code = (await ensureRefCode(user.id))!;
  const [s, partners] = await Promise.all([summaryFor(code), readPartners()]);
  const p = partners.find((x) => x.userId === user.id);
  return (
    <MarketplaceProvider>
      <Header />
      <main className="pt-6 md:pt-10">
        <ReferralDashboard
          code={code}
          site={SITE}
          people={s.people.map(({ label, stage, joinedAt, lastActivity }, i) => ({ key: String(i), label, stage, joinedAt, lastActivity }))}
          rewards={s.rewards.map(({ id, kind, amount, personLabel, status, createdAt }) => ({ id, kind, amount, personLabel, status, createdAt }))}
          earned={s.earned}
          paid={s.paid}
          pending={s.pending}
          partner={{
            name: p?.name ?? user.name,
            company: p?.company ?? "",
            brn: p?.brn ?? "",
            bio: p?.bio ?? "",
            areas: p?.areas.join(", ") ?? "",
            languages: p?.languages.join(", ") ?? "",
            phone: p?.phone ?? user.phone ?? "",
            status: p?.status ?? null,
            photo: p?.photo ?? null,
          }}
        />
      </main>
      <Footer />
    </MarketplaceProvider>
  );
}
