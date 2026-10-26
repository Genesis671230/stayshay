import { handleRpc, INSTRUCTIONS, SERVER_INFO, TOOLS } from "@/lib/mcp";

export const dynamic = "force-dynamic";

const CORS = {
  "access-control-allow-origin": "*",
  "access-control-allow-methods": "GET, POST, DELETE, OPTIONS",
  "access-control-allow-headers": "content-type, accept, authorization, mcp-session-id, mcp-protocol-version, last-event-id",
  "access-control-expose-headers": "mcp-session-id, mcp-protocol-version",
};

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json", ...CORS } });

/** MCP Streamable HTTP endpoint (stateless: every POST is answered with plain JSON, no session). */
export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return json({ jsonrpc: "2.0", id: null, error: { code: -32700, message: "Parse error" } }, 400);
  }
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
  const batch = Array.isArray(body) ? body : [body];
  const out = (await Promise.all(batch.map((m) => handleRpc(m as Parameters<typeof handleRpc>[0], ip)))).filter(Boolean);
  if (!out.length) return new Response(null, { status: 202, headers: CORS });
  return json(Array.isArray(body) ? out : out[0]);
}

/** No server-initiated stream; a browser visit gets a short description instead. */
export async function GET(req: Request) {
  if ((req.headers.get("accept") ?? "").includes("text/event-stream")) return new Response(null, { status: 405, headers: { allow: "POST", ...CORS } });
  return json({ ...SERVER_INFO, transport: "streamable-http", endpoint: "/mcp", instructions: INSTRUCTIONS, tools: TOOLS.map((t) => t.name), docs: `${SERVER_INFO.websiteUrl}/ai` });
}

export async function DELETE() {
  return new Response(null, { status: 405, headers: CORS });
}

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS });
}
