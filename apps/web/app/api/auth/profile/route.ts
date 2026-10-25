import { NextResponse } from "next/server";
import { currentUser, toPublic, updateProfile } from "@/lib/auth";

export async function PATCH(req: Request) {
  const me = await currentUser();
  if (!me) return NextResponse.json({ ok: false }, { status: 401 });
  const { user, errors } = await updateProfile(me.id, await req.json().catch(() => ({})));
  return user ? NextResponse.json({ ok: true, user: toPublic(user) }) : NextResponse.json({ ok: false, errors }, { status: 422 });
}
