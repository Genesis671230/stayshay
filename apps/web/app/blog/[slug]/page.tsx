import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BRAND } from "@stayshay/core";
import { DocPage } from "@/components/doc-page";
import { JsonLd } from "@/components/json-ld";
import { Blocks, Faq } from "@/components/seo-blocks";
import { POSTS, POST_BY_SLUG } from "@/lib/blog";
import { getAllListings } from "@/lib/store";
import { SITE, absolute, breadcrumbLd, faqLd } from "@/lib/seo";
import { coverFor } from "../cover";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const p = POST_BY_SLUG.get((await params).slug);
  if (!p) return {};
  const cover = coverFor(p, await getAllListings());
  return {
    title: p.title,
    description: p.description,
    keywords: p.keywords,
    alternates: { canonical: `/blog/${p.slug}` },
    openGraph: { type: "article", title: p.title, description: p.description, url: `/blog/${p.slug}`, publishedTime: p.published, modifiedTime: p.updated, images: cover ? [cover] : undefined },
  };
}

export default async function PostPage({ params }: { params: Promise<{ slug: string }> }) {
  const p = POST_BY_SLUG.get((await params).slug);
  if (!p) notFound();
  const listings = await getAllListings();
  const cover = coverFor(p, listings);
  const related = POSTS.filter((x) => x.slug !== p.slug && x.category === p.category).concat(POSTS.filter((x) => x.slug !== p.slug && x.category !== p.category)).slice(0, 4);
  // Live-data posts are effectively updated whenever they're rendered; tell crawlers the content date honestly.
  const article = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: p.title,
    description: p.description,
    datePublished: p.published,
    dateModified: p.updated,
    image: cover ? [absolute(cover)] : undefined,
    mainEntityOfPage: `${SITE}/blog/${p.slug}`,
    author: { "@type": "Organization", name: BRAND.name, url: SITE },
    publisher: { "@id": `${SITE}/#org` },
    keywords: p.keywords.join(", "),
  };
  return (
    <DocPage eyebrow={p.category} title={p.title} intro={p.description} updated={new Date(p.updated).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}>
      <JsonLd data={[article, breadcrumbLd([["Home", "/"], ["Guides", "/blog"], [p.title, `/blog/${p.slug}`]]), ...(p.faq.length ? [faqLd(p.faq)] : [])]} />
      {cover && (
        <div className="not-prose relative mb-10 aspect-[16/9] overflow-hidden rounded-[22px] bg-surface">
          <Image src={cover} alt={p.title} fill priority sizes="(min-width: 860px) 820px, 100vw" className="object-cover" />
        </div>
      )}
      <Blocks blocks={p.blocks} listings={listings} />
      <Faq faq={p.faq} />
      <section className="not-prose mt-14 border-t border-line pt-10">
        <h2 className="font-display text-[24px]">Keep reading</h2>
        <ul className="mt-4 space-y-3">
          {related.map((r) => (
            <li key={r.slug}>
              <Link href={`/blog/${r.slug}`} className="text-[16px] font-semibold text-brand underline-offset-4 hover:underline">
                {r.title}
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </DocPage>
  );
}
