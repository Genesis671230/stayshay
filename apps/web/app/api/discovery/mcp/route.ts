import { INSTRUCTIONS, SERVER_INFO, TOOLS } from "@/lib/mcp";
import { SITE } from "@/lib/seo";

/** Served at /.well-known/mcp.json and /.well-known/mcp/server-card.json (rewrites): MCP server discovery card. */
export function GET() {
  return Response.json(
    {
      ...SERVER_INFO,
      description: INSTRUCTIONS,
      transport: { type: "streamable-http", url: `${SITE}/mcp` },
      remotes: [{ type: "streamable-http", url: `${SITE}/mcp` }],
      authentication: { required: false },
      tools: TOOLS.map((t) => ({ name: t.name, title: t.title, description: t.description })),
    },
    { headers: { "access-control-allow-origin": "*" } },
  );
}
