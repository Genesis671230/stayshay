import { NextResponse } from "next/server";
import { denyUnlessAdmin } from "@/lib/admin-guard";
import { readPasses, readPosts, setPostHidden } from "@/lib/community";

export const dynamic = "force-dynamic";

export async function GET() {
  const deny = await denyUnlessAdmin();
  if (deny) return deny;
  const [posts, passes] = await Promise.all([readPosts(), readPasses()]);
  return NextResponse.json({ ok: true, posts: posts.slice(0, 300), passes });
}

export async function POST(req: Request) {
  const deny = await denyUnlessAdmin();
  if (deny) return deny;
  const b = (await req.json().catch(() => ({}))) as { id?: string; hidden?: boolean };
  if (!b.id) return NextResponse.json({ ok: false }, { status: 400 });
  await setPostHidden(b.id, !!b.hidden);
  return NextResponse.json({ ok: true });
}
