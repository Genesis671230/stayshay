import { BRAND } from "@stayshay/core";
import { SITE } from "@/lib/seo";

/** OpenAPI 3.1 for ChatGPT custom GPT Actions and other tool-using assistants. */
export function GET() {
  const listing = { $ref: "#/components/schemas/Listing" };
  const spec = {
    openapi: "3.1.0",
    info: {
      title: `${BRAND.name} listings`,
      version: "1.0.0",
      description: "Search live monthly bed spaces, partitions, rooms and studios in Dubai, Sharjah and the UAE. Prices are monthly, in AED.",
    },
    servers: [{ url: SITE }],
    paths: {
      "/api/public/search": {
        get: {
          operationId: "searchListings",
          summary: "Search live listings by free text and/or filters",
          parameters: [
            { name: "q", in: "query", schema: { type: "string" }, description: "Plain words, e.g. 'female bed space Karama under 900 bills included'" },
            { name: "area", in: "query", schema: { type: "string" }, description: "Area, metro station or emirate, e.g. Barsha, JLT, Sharjah" },
            { name: "type", in: "query", schema: { type: "string", enum: ["bed_space", "partition", "room", "studio"] } },
            { name: "max_price", in: "query", schema: { type: "number" }, description: "Max monthly rent, AED" },
            { name: "min_price", in: "query", schema: { type: "number" } },
            { name: "gender", in: "query", schema: { type: "string", enum: ["male", "female"] } },
            { name: "bills_included", in: "query", schema: { type: "boolean" } },
            { name: "no_deposit", in: "query", schema: { type: "boolean" } },
            { name: "near_metro", in: "query", schema: { type: "boolean" } },
            { name: "sort", in: "query", schema: { type: "string", enum: ["recommended", "price_asc", "price_desc", "newest"] } },
            { name: "limit", in: "query", schema: { type: "integer", minimum: 1, maximum: 20 } },
          ],
          responses: {
            "200": {
              description: "Matching listings",
              content: { "application/json": { schema: { type: "object", properties: { total: { type: "integer" }, note: { type: "string" }, places: { type: "array", items: listing }, more: { type: "string" } } } } },
            },
          },
        },
      },
      "/api/public/deals": {
        get: {
          operationId: "bestDeals",
          summary: "Best-value listings right now (below typical price, bills included, no deposit, near metro)",
          parameters: [
            { name: "type", in: "query", schema: { type: "string", enum: ["bed_space", "partition", "room", "studio"] } },
            { name: "area", in: "query", schema: { type: "string" } },
            { name: "max_price", in: "query", schema: { type: "number" } },
            { name: "limit", in: "query", schema: { type: "integer", minimum: 1, maximum: 20 } },
          ],
          responses: { "200": { description: "Ranked deals", content: { "application/json": { schema: { type: "object", properties: { deals: { type: "array", items: listing } } } } } } },
        },
      },
      "/api/public/listing/{id}": {
        get: {
          operationId: "getListing",
          summary: "Full details of one listing",
          parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
          responses: { "200": { description: "Listing", content: { "application/json": { schema: listing } } }, "404": { description: "Not live" } },
        },
      },
    },
    components: {
      schemas: {
        Listing: {
          type: "object",
          properties: {
            id: { type: "string" },
            title: { type: "string" },
            type: { type: "string" },
            area: { type: "string" },
            price_aed_per_month: { type: "number" },
            bills_included: { type: "boolean" },
            deposit_aed: { type: "number" },
            who_can_live: { type: "string" },
            metro: { type: ["string", "null"] },
            photo: { type: ["string", "null"] },
            url: { type: "string" },
          },
        },
      },
    },
  };
  return Response.json(spec, { headers: { "access-control-allow-origin": "*" } });
}
