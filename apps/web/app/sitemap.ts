import type { MetadataRoute } from "next";
import { POSTS } from "@/lib/blog";
import { getAllListings } from "@/lib/store";
import { RENT_TYPES, SITE, absolute, liveAreas, listingUrl, rentPath } from "@/lib/seo";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const all = await getAllListings();
  const now = new Date();
  const page = (path: string, priority: number, changeFrequency: "daily" | "weekly" | "monthly" = "daily") => ({ url: `${SITE}${path}`, lastModified: now, changeFrequency, priority });
  const areas = liveAreas(all);
  return [
    page("", 1),
    page("/search", 0.9),
    page("/deals", 0.9),
    page("/areas", 0.8),
    page("/roommates", 0.8),
    page("/find", 0.7, "monthly"),
    page("/list", 0.7, "monthly"),
    page("/blog", 0.8, "weekly"),
    page("/ai", 0.6, "monthly"),
    page("/about", 0.4, "monthly"),
    ...RENT_TYPES.map((t) => page(rentPath(t), 0.9)),
    ...areas.map(({ area }) => page(`/areas/${area.slug}`, 0.8)),
    ...areas.flatMap(({ area, types }) => RENT_TYPES.filter((t) => types[t]).map((t) => page(rentPath(t, area.slug), 0.8))),
    ...POSTS.map((p) => ({ url: `${SITE}/blog/${p.slug}`, lastModified: new Date(p.updated), changeFrequency: "weekly" as const, priority: 0.7 })),
    ...all.map((l) => ({ url: listingUrl(l), lastModified: l.postedAt ? new Date(l.postedAt) : now, changeFrequency: "daily" as const, priority: 0.6, images: l.photos.slice(0, 3).map(absolute) })),
  ];
}
