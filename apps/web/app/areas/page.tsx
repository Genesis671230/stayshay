import type { Metadata } from "next";
import Link from "next/link";
import { AREAS, TYPE_LABEL_PLURAL } from "@stayshay/core";
import { DocPage } from "@/components/doc-page";
import { getAllListings } from "@/lib/store";
import { RENT_TYPES, liveAreas, priceStats, rentPath } from "@/lib/seo";
import { aed } from "@/components/ui";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Areas: monthly rent in every Dubai and Sharjah neighbourhood",
  description: "Browse monthly bed spaces, partitions, rooms and studios by area across Dubai, Sharjah and the UAE, with live starting prices.",
  alternates: { canonical: "/areas" },
};

export default async function AreasIndex() {
  const all = await getAllListings();
  const live = liveAreas(all);
  const emirates = [...new Set(AREAS.map((a) => a.emirate))];
  return (
    <DocPage eyebrow="Areas" title="Find your neighbourhood." intro="Every area with live monthly listings, with today’s starting price for each kind of place.">
      {emirates.map((em) => {
        const rows = live.filter((r) => r.area.emirate === em);
        if (!rows.length) return null;
        return (
          <section key={em} className="not-prose mb-10">
            <h2 className="font-display text-[26px]">{em}</h2>
            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
              {rows.map(({ area, count }) => {
                const s = priceStats(all.filter((l) => l.areaSlug === area.slug))!;
                return (
                  <div key={area.slug} className="rounded-[16px] border border-line p-4">
                    <Link href={`/areas/${area.slug}`} className="text-[16px] font-semibold text-ink hover:text-brand">
                      {area.name}
                    </Link>
                    <p className="text-[13px] text-muted">{count} live · from {aed(s.min)}{area.nearMetro ? ` · ${area.nearMetro} metro` : ""}</p>
                    <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[13px]">
                      {RENT_TYPES.filter((t) => all.some((l) => l.type === t && l.areaSlug === area.slug)).map((t) => (
                        <Link key={t} href={rentPath(t, area.slug)} className="text-brand underline-offset-4 hover:underline">
                          {TYPE_LABEL_PLURAL[t]}
                        </Link>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        );
      })}
    </DocPage>
  );
}
