import { callTool } from "@/lib/mcp";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const u = new URL(req.url).searchParams;
  const r = await callTool("best_deals", { type: u.get("type") ?? undefined, area: u.get("area") ?? undefined, max_price: u.get("max_price") ? Number(u.get("max_price")) : undefined, limit: u.get("limit") ? Number(u.get("limit")) : 6 }, "public");
  return Response.json(r.structuredContent ?? {}, { headers: { "access-control-allow-origin": "*", "cache-control": "public, max-age=300" } });
}
