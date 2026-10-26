import { llmsTxt } from "@/lib/llms";

export const dynamic = "force-dynamic";

export async function GET() {
  return new Response(await llmsTxt(false), { headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "public, max-age=600" } });
}
