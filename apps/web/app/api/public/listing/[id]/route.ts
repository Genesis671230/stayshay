import { callTool } from "@/lib/mcp";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const r = await callTool("fetch", { id: (await params).id }, "public");
  if ("isError" in r && r.isError) return Response.json({ error: "not_found" }, { status: 404, headers: { "access-control-allow-origin": "*" } });
  const doc = r.structuredContent as { text: string };
  return Response.json(JSON.parse(doc.text), { headers: { "access-control-allow-origin": "*", "cache-control": "public, max-age=120" } });
}
