import type { Metadata } from "next";
import Link from "next/link";
import { AREA_BY_SLUG, SPACE_LABEL, type SpaceKind } from "@stayshay/core";
import { AdminLogin } from "@/components/admin";
import { adminAllowed } from "@/lib/admin-guard";
import { managerOverview } from "@/lib/manager";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Admin · Owners", robots: { index: false, follow: false } };

const aed = (n: number) => `AED ${Math.round(n).toLocaleString("en-US")}`;

export default async function Page() {
  if (!(await adminAllowed())) return <AdminLogin />;
  const o = await managerOverview(new Date().toISOString().slice(0, 10));
  const pct = o.spaces ? Math.round((o.occupied / o.spaces) * 100) : 0;
  return (
    <div className="min-h-screen bg-surface">
      <header className="border-b border-line bg-white">
        <div className="mx-auto flex h-16 max-w-[1200px] items-center justify-between px-4 md:px-8">
          <p className="text-[17px] font-bold">Owners using Stayshay Manager</p>
          <Link href="/admin" className="text-[14px] font-medium text-brand">
            Back to admin
          </Link>
        </div>
      </header>
      <main className="mx-auto max-w-[1200px] space-y-6 px-4 py-8 md:px-8">
        <section className="glow-panel rounded-[28px] p-6 text-white md:p-8">
          <p className="text-[12px] font-bold uppercase tracking-[0.14em] text-[#8fe3bd]">Snapshot</p>
          <h1 className="font-display mt-2 text-[30px] md:text-[40px]">{o.toFill} tenants needed to fill every managed space</h1>
          <p className="mt-2 text-[14.5px] text-white/70">Each one is a renter we can bring through the marketplace. Missing rent across owners: {aed(o.missing)} a month.</p>
          <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-5">
            {[
              ["Owners", o.owners],
              ["Apartments", o.apartments],
              ["Tenants", o.tenants],
              ["Occupancy", `${pct}%`],
              ["Rent managed", aed(o.expected)],
            ].map(([k, v]) => (
              <div key={k as string} className="rounded-[18px] border border-white/12 bg-white/[0.06] p-4">
                <p className="text-[12px] text-white/60">{k}</p>
                <p className="font-figure mt-1 text-[22px] font-bold">{v}</p>
              </div>
            ))}
          </div>
        </section>
        <section className="card p-5">
          <h2 className="text-[17px] font-bold">Where tenants are needed</h2>
          {!o.needs.length ? (
            <p className="mt-3 text-[14px] text-muted">No empty spaces right now, or no owners yet.</p>
          ) : (
            <table className="mt-3 w-full text-left text-[14px]">
              <thead className="text-[12.5px] text-muted">
                <tr>
                  <th className="py-2 font-semibold">Area</th>
                  <th className="py-2 font-semibold">Type</th>
                  <th className="py-2 font-semibold">Free</th>
                  <th className="py-2 font-semibold">Avg rent / person</th>
                  <th className="py-2" />
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {o.needs.map((n) => (
                  <tr key={`${n.area}-${n.kind}`}>
                    <td className="py-2.5 font-semibold">{AREA_BY_SLUG.get(n.area)?.name ?? (n.area || "Area not set")}</td>
                    <td className="py-2.5">{SPACE_LABEL[n.kind as SpaceKind]}</td>
                    <td className="py-2.5 font-figure font-bold">{n.slots}</td>
                    <td className="py-2.5 font-figure">{aed(n.avgRent)}</td>
                    <td className="py-2.5 text-right">
                      <Link className="text-[13px] font-semibold text-brand" href="/admin">
                        Open inbox
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      </main>
    </div>
  );
}
