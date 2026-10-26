import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { DocPage } from "@/components/doc-page";
import { POSTS } from "@/lib/blog";
import { getAllListings } from "@/lib/store";
import { coverFor } from "./cover";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Guides: renting rooms, bed spaces and studios in the UAE",
  description: "Live price guides, area guides and safety tips for renting monthly bed spaces, partitions, rooms and studios in Dubai and Sharjah.",
  alternates: { canonical: "/blog", types: { "application/rss+xml": "/blog/rss.xml" } },
};

export default async function BlogIndex() {
  const listings = await getAllListings();
  return (
    <DocPage eyebrow="Stayshay guides" title="Rent smarter in the UAE." intro="Live prices, honest comparisons and the checks that keep your deposit safe.">
      <div className="not-prose grid grid-cols-1 gap-8 sm:grid-cols-2">
        {POSTS.map((p, i) => {
          const cover = coverFor(p, listings, i);
          return (
            <Link key={p.slug} href={`/blog/${p.slug}`} className="group block">
              <div className="relative aspect-[16/10] overflow-hidden rounded-[18px] bg-surface">
                {cover && <Image src={cover} alt="" fill sizes="(min-width: 640px) 400px, 100vw" className="object-cover transition-transform duration-500 group-hover:scale-[1.03]" />}
              </div>
              <p className="mt-3 text-[12px] font-bold uppercase tracking-[0.1em] text-fresh">{p.category}</p>
              <h2 className="mt-1 text-[18px] font-bold leading-snug text-ink group-hover:text-brand">{p.title}</h2>
              <p className="mt-1.5 text-[14px] leading-relaxed text-muted">{p.description}</p>
            </Link>
          );
        })}
      </div>
    </DocPage>
  );
}
