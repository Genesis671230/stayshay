import { callTool } from "@/lib/mcp";

export const dynamic = "force-dynamic";

/** Public JSON search (custom GPT Actions, partners). Same engine as the MCP `search_listings` tool; `q` adds free text. */
export async function GET(req: Request) {
  const u = new URL(req.url).searchParams;
  const num = (k: string) => (u.get(k) && Number.isFinite(Number(u.get(k))) ? Number(u.get(k)) : undefined);
  const bool = (k: string) => (u.get(k) === "true" || u.get(k) === "1" ? true : undefined);
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
  const q = u.get("q")?.trim();
  const { parseSearchText, AREAS, AREA_BY_SLUG } = await import("@stayshay/core");
  const parsed = q ? parseSearchText(AREAS, q) : {};
  const r = await callTool(
    "search_listings",
    {
      area: u.get("area") ?? (parsed.areaSlugs ? AREA_BY_SLUG.get(parsed.areaSlugs[0])?.name : parsed.emirate),
      type: u.get("type") ?? parsed.types?.[0],
      max_price: num("max_price") ?? parsed.maxPrice,
      min_price: num("min_price"),
      gender: u.get("gender") ?? parsed.gender,
      bills_included: bool("bills_included") ?? parsed.billsIncluded,
      no_deposit: bool("no_deposit") ?? parsed.noDeposit,
      near_metro: bool("near_metro") ?? parsed.nearMetro,
      sort: u.get("sort") ?? parsed.sort,
      limit: num("limit") ?? 8,
    },
    ip,
  );
  return Response.json(r.structuredContent ?? {}, { headers: { "access-control-allow-origin": "*", "cache-control": "public, max-age=120" } });
}
