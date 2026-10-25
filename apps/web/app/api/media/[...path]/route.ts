import { readFile } from "node:fs/promises";
import { join, normalize } from "node:path";
import { UPLOAD_DIR } from "@/lib/store";

const TYPES: Record<string, string> = { jpg: "image/jpeg", png: "image/png", webp: "image/webp", avif: "image/avif", heic: "image/heic" };

// Admin-uploaded photos live outside /public (files added after build aren't served from there).
export async function GET(_req: Request, { params }: { params: Promise<{ path: string[] }> }) {
  const rel = normalize((await params).path.join("/"));
  if (rel.startsWith("..") || rel.includes("\0")) return new Response("Not found", { status: 404 });
  try {
    const body = await readFile(join(UPLOAD_DIR, rel));
    return new Response(new Uint8Array(body), {
      headers: { "content-type": TYPES[rel.split(".").pop() ?? ""] ?? "application/octet-stream", "cache-control": "public, max-age=31536000, immutable" },
    });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}
