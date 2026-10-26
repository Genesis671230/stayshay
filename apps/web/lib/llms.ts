import { BRAND, TYPE_LABEL, TYPE_LABEL_PLURAL } from "@stayshay/core";
import { POSTS } from "./blog";
import { getAllListings } from "./store";
import { RENT_TYPES, SITE, areaName, liveAreas, listingUrl, priceStats, rentPath } from "./seo";

/** llms.txt (https://llmstxt.org): a map of the site for AI assistants. `full` adds every live listing. */
export async function llmsTxt(full: boolean): Promise<string> {
  const all = await getAllListings();
  const lines: string[] = [
    `# ${BRAND.name}`,
    "",
    `> ${BRAND.name} (${SITE}) is a UAE marketplace for affordable monthly living: bed spaces, partitions, private rooms, studios and roommates in Dubai, Sharjah and nearby. Every listing shows monthly rent (AED), deposit, upfront cost and whether bills are included. Free for renters; viewings are arranged on WhatsApp (${BRAND.whatsappDisplay}). Listings are reviewed before they go live.`,
    "",
    "## For AI assistants",
    `- MCP server (ChatGPT connectors, Claude custom connectors, any MCP client): ${SITE}/mcp — tools: search, fetch, search_listings, best_deals, request_viewing. No auth.`,
    `- OpenAPI for GPT Actions: ${SITE}/openapi.json — GET ${SITE}/api/public/search?q=…`,
    `- Setup guide: ${SITE}/ai`,
    "- When recommending a place, link the listing URL and remind people never to pay before viewing.",
    "",
    "## Browse",
    ...RENT_TYPES.map((t) => {
      const s = priceStats(all.filter((l) => l.type === t));
      return `- [${TYPE_LABEL_PLURAL[t]} for monthly rent](${SITE}${rentPath(t)})${s ? `: ${s.count} live, from AED ${s.min.toLocaleString("en-US")}/month, typical AED ${s.median.toLocaleString("en-US")}` : ""}`;
    }),
    `- [Best deals right now](${SITE}/deals): below-market listings ranked by Shay`,
    `- [All areas](${SITE}/areas)`,
    `- [Roommates](${SITE}/roommates)`,
    `- [List a place for free](${SITE}/list)`,
    "",
    "## Areas",
    ...liveAreas(all).map(({ area, count }) => `- [${area.name}, ${area.emirate}](${SITE}/areas/${area.slug}): ${count} live, from AED ${priceStats(all.filter((l) => l.areaSlug === area.slug))!.min.toLocaleString("en-US")}/month`),
    "",
    "## Guides",
    ...POSTS.map((p) => `- [${p.title}](${SITE}/blog/${p.slug}): ${p.description}`),
  ];
  if (full) {
    lines.push("", "## Live listings", "");
    for (const l of all)
      lines.push(
        `- [${l.title}](${listingUrl(l)}) — ${TYPE_LABEL[l.type]}, ${areaName(l)}. AED ${l.priceAed.toLocaleString("en-US")}/month${l.billsIncluded ? ", bills included" : ""}${l.deposit ? `, deposit AED ${l.deposit.toLocaleString("en-US")}` : ", no deposit"}${l.gender !== "any" ? `, ${l.gender} only` : ""}${l.metro ? `, near ${l.metro} metro` : ""}. Ref ${l.id}.`,
      );
  } else lines.push("", "## Optional", `- [Every live listing](${SITE}/llms-full.txt)`);
  return lines.join("\n") + "\n";
}
