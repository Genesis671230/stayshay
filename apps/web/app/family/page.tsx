import type { Metadata } from "next";
import Link from "next/link";
import { GuideLanding } from "@/components/guide-landing";
import { getAllListings } from "@/lib/store";
import { FAMILY_AREAS, GUIDE_BY_PATH } from "@/lib/guides";
import { guideMetadata } from "@/lib/guide-meta";

export const dynamic = "force-dynamic";
const g = GUIDE_BY_PATH.get("/family")!;
export const metadata: Metadata = guideMetadata(g);

export default async function Page() {
  return (
    <GuideLanding g={g} all={await getAllListings()} crumbs={[["Home", "/"], ["Family homes", "/family"]]}>
      <h2>Family area guides</h2>
      <div className="not-prose mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
        {FAMILY_AREAS.map((a) => (
          <Link key={a.slug} href={`/family/family-apartments-${a.slug}`} className="rounded-[16px] border border-line p-4 hover:border-brand">
            <span className="block text-[15.5px] font-semibold text-ink">{a.name}</span>
            <span className="mt-1 block text-[13.5px] text-ink-2">{a.hasMetro ? "Metro: " + a.metro.split(":")[0] : "Car / bus area"}</span>
          </Link>
        ))}
      </div>
    </GuideLanding>
  );
}
