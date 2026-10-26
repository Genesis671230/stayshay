import { BRAND } from "@stayshay/core";
import { SITE } from "@/lib/seo";

/** Served at /.well-known/ai-plugin.json (rewrite): legacy plugin manifest many AI crawlers still read. */
export function GET() {
  return Response.json(
    {
      schema_version: "v1",
      name_for_human: BRAND.name,
      name_for_model: "stayshay",
      description_for_human: "Find monthly bed spaces, partitions, rooms and studios in Dubai and the UAE.",
      description_for_model:
        "Search live Stayshay rentals in the UAE (bed spaces, partitions, private rooms, studios). Prices are monthly in AED. Use searchListings with plain-words q or filters, bestDeals for below-market picks, getListing for details. Always share the listing url.",
      auth: { type: "none" },
      api: { type: "openapi", url: `${SITE}/openapi.json` },
      logo_url: `${SITE}/brand/stayshay-mark.svg`,
      contact_email: BRAND.supportEmail,
      legal_info_url: `${SITE}/terms`,
    },
    { headers: { "access-control-allow-origin": "*" } },
  );
}
