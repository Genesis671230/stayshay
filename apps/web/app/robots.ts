import type { MetadataRoute } from "next";
import { SITE } from "@/lib/seo";

// Search engines and AI assistants (ChatGPT, Claude, Perplexity, Gemini…) are all welcome on public pages.
export default function robots(): MetadataRoute.Robots {
  const disallow = ["/admin", "/api/", "/account", "/login"];
  return {
    rules: [
      { userAgent: "*", allow: ["/", "/api/listings", "/api/public/"], disallow },
      ...["GPTBot", "OAI-SearchBot", "ChatGPT-User", "ClaudeBot", "Claude-User", "Claude-SearchBot", "PerplexityBot", "Perplexity-User", "Google-Extended", "Applebot-Extended", "Bingbot"].map((userAgent) => ({
        userAgent,
        allow: ["/", "/api/listings", "/api/public/", "/llms.txt", "/llms-full.txt", "/openapi.json"],
        disallow,
      })),
    ],
    sitemap: `${SITE}/sitemap.xml`,
    host: SITE,
  };
}
