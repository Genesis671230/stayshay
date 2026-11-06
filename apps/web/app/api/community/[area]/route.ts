import { NextResponse } from "next/server";
import { AREA_BY_SLUG } from "@stayshay/core";
import { currentUser } from "@/lib/auth";
import { accessFor, addPost, chatSince, communityFeed } from "@/lib/community";
import { notify, esc } from "@/lib/telegram";

export const dynamic = "force-dynamic";

const recent = new Map<string, number[]>();

async function gate(area: string) {
  if (!AREA_BY_SLUG.has(area)) return { error: NextResponse.json({ ok: false }, { status: 404 }) };
  const user = await currentUser();
  const access = await accessFor(user, area);
  if (!user || !access.member) return { error: NextResponse.json({ ok: false, error: "locked" }, { status: 403 }) };
  return { user };
}

/** Members only: the Q&A and chat. ?since=<iso> returns just the new chat messages (polled every few seconds). */
export async function GET(req: Request, { params }: { params: Promise<{ area: string }> }) {
  const { area } = await params;
  const g = await gate(area);
  if (g.error) return g.error;
  const since = new URL(req.url).searchParams.get("since");
  if (since) return NextResponse.json({ ok: true, chat: await chatSince(area, g.user.id, since) });
  return NextResponse.json({ ok: true, ...(await communityFeed(area, g.user.id)) });
}

export async function POST(req: Request, { params }: { params: Promise<{ area: string }> }) {
  const { area } = await params;
  const g = await gate(area);
  if (g.error) return g.error;
  const now = Date.now();
  const hits = (recent.get(g.user.id) ?? []).filter((t) => now - t < 60_000);
  if (hits.length >= 12) return NextResponse.json({ ok: false, error: "slow_down" }, { status: 429 });
  hits.push(now);
  recent.set(g.user.id, hits);

  const b = (await req.json().catch(() => ({}))) as { kind?: string; text?: string; parentId?: string };
  const kind = (["question", "answer", "chat"] as const).find((k) => k === b.kind);
  const text = String(b.text ?? "").trim();
  if (!kind || text.length < 2) return NextResponse.json({ ok: false, error: "empty" }, { status: 422 });
  if (kind === "answer" && !b.parentId) return NextResponse.json({ ok: false }, { status: 422 });
  const post = await addPost(g.user, area, kind, text, b.parentId ?? null);
  if (kind === "question") {
    notify(`❓ <b>Community question</b> · ${esc(AREA_BY_SLUG.get(area)!.name)}\n${esc(post.name)}: ${esc(post.text.slice(0, 300))}\n\nHide it at /admin/community if needed.`);
  }
  return NextResponse.json({ ok: true, post: { ...post, userId: undefined, mine: true } });
}
