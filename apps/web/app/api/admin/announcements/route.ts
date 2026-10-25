import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { denyUnlessAdmin } from "@/lib/admin-guard";
import { readAnnouncements, saveAnnouncements, type Announcement } from "@/lib/store";

export async function GET() {
  return (await denyUnlessAdmin()) ?? NextResponse.json({ ok: true, announcements: await readAnnouncements() });
}

/** Create or update. Only one announcement is shown at a time: activating one switches the others off. */
export async function POST(req: Request) {
  const deny = await denyUnlessAdmin();
  if (deny) return deny;
  const b = (await req.json().catch(() => ({}))) as Partial<Announcement>;
  if (!b.title?.trim() || !b.message?.trim()) return NextResponse.json({ ok: false, error: "Title and message are required" }, { status: 422 });
  const a: Announcement = {
    id: b.id || randomUUID().slice(0, 8),
    title: b.title.trim().slice(0, 80),
    message: b.message.trim().slice(0, 600),
    link: b.link?.trim() || undefined,
    active: !!b.active,
    createdAt: b.createdAt ?? new Date().toISOString(),
    expiresAt: b.expiresAt || undefined,
  };
  const all = await saveAnnouncements((list) => {
    const rest = list.filter((x) => x.id !== a.id).map((x) => (a.active ? { ...x, active: false } : x));
    return [a, ...rest];
  });
  return NextResponse.json({ ok: true, announcement: a, announcements: all });
}

export async function DELETE(req: Request) {
  const deny = await denyUnlessAdmin();
  if (deny) return deny;
  const id = new URL(req.url).searchParams.get("id");
  const all = await saveAnnouncements((list) => list.filter((x) => x.id !== id));
  return NextResponse.json({ ok: true, announcements: all });
}
