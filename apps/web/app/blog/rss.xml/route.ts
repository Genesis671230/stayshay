import { BRAND } from "@stayshay/core";
import { POSTS } from "@/lib/blog";
import { SITE } from "@/lib/seo";

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

export function GET() {
  const items = POSTS.map(
    (p) => `<item><title>${esc(p.title)}</title><link>${SITE}/blog/${p.slug}</link><guid>${SITE}/blog/${p.slug}</guid><pubDate>${new Date(p.published).toUTCString()}</pubDate><description>${esc(p.description)}</description><category>${p.category}</category></item>`,
  ).join("");
  const xml = `<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel><title>${BRAND.name} guides</title><link>${SITE}/blog</link><description>Renting rooms, bed spaces and studios in the UAE</description><language>en-ae</language>${items}</channel></rss>`;
  return new Response(xml, { headers: { "content-type": "application/rss+xml; charset=utf-8", "cache-control": "public, max-age=3600" } });
}
