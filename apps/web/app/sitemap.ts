import type { MetadataRoute } from "next";
import { POSTS } from "@/lib/blog";
import { ALL_GUIDES } from "@/lib/guides";
import { SERVICES } from "@/lib/services";
import { PROJECTS } from "@/lib/portfolio";
import { getAllListings } from "@/lib/store";
import { publicPartners } from "@/lib/referrals";
import { COLLECTIONS, STATIONS, nearStation } from "@/lib/collections";
import { RENT_TYPES, SITE, absolute, liveAreas, listingUrl, rentPath } from "@/lib/seo";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [all, partners] = await Promise.all([getAllListings(), publicPartners()]);
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
    page("/refer", 0.7, "weekly"),
    page("/manager", 0.8, "weekly"),
    page("/metro", 0.8),
    ...ALL_GUIDES.map((g) => page(g.path, g.path === "/family" || g.path === "/move" ? 0.9 : 0.8, "weekly")),
    page("/tools", 0.7, "weekly"),
    page("/swipe", 0.7),
    page("/tools/fair-rent", 0.8, "weekly"),
    page("/tools/budget", 0.8, "weekly"),
    page("/tools/move-in-cost", 0.8, "weekly"),
    page("/stayfit", 0.7),
    page("/services", 0.8, "weekly"),
    ...SERVICES.map((s) => page(`/services/${s.slug}`, 0.7, "monthly")),
    page("/win", 0.7, "weekly"),
    page("/work", 0.8, "monthly"),
    ...PROJECTS.map((x) => page(`/work/${x.slug}`, 0.7, "monthly")),
    page("/community", 0.8, "daily"),
    ...STATIONS.filter((st) => all.some((l) => nearStation(st, l))).map((st) => page(`/metro/${st.slug}`, 0.8)),
    ...COLLECTIONS.flatMap((c) => c.types.filter((t) => all.some((l) => l.type === t && c.match(l))).map((t) => page(`${rentPath(t)}/${c.slug}`, 0.8))),
    page("/partners", 0.6, "weekly"),
    ...partners.map((p) => page(`/partners/${p.code.toLowerCase()}`, 0.5, "weekly")),
    ...RENT_TYPES.map((t) => page(rentPath(t), 0.9)),
    ...areas.map(({ area }) => page(`/areas/${area.slug}`, 0.8)),
    ...areas.flatMap(({ area, types }) => RENT_TYPES.filter((t) => types[t]).map((t) => page(rentPath(t, area.slug), 0.8))),
    ...POSTS.map((p) => ({ url: `${SITE}/blog/${p.slug}`, lastModified: new Date(p.updated), changeFrequency: "weekly" as const, priority: 0.7 })),
    ...all.map((l) => ({ url: listingUrl(l), lastModified: l.postedAt ? new Date(l.postedAt) : now, changeFrequency: "daily" as const, priority: 0.6, images: l.photos.slice(0, 3).map(absolute) })),
  ];
}
