import { NextResponse } from "next/server";
import { validateLead, type RoommateLead } from "@stayshay/core";
import { addLead } from "@/lib/store";
import { addRoommate, publicRoommates } from "@/lib/roommates";
import { currentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

/** Approved public profiles (no phone numbers). */
export async function GET() {
  return NextResponse.json({ profiles: await publicRoommates() }, { headers: { "cache-control": "public, max-age=60", "access-control-allow-origin": "*" } });
}

/**
 * New roommate profile from the website or app. multipart/form-data: `profile` (JSON, a roommate lead plus
 * `public: true|false`) and optional `photo`. Always lands in the admin inbox; the public card waits for approval.
 */
export async function POST(req: Request) {
  const form = await req.formData().catch(() => null);
  if (!form) return NextResponse.json({ ok: false, error: "bad form" }, { status: 400 });
  let body: Record<string, unknown>;
  try {
    body = JSON.parse(String(form.get("profile") ?? "{}"));
  } catch {
    return NextResponse.json({ ok: false, error: "bad profile json" }, { status: 400 });
  }
  const check = validateLead({ ...body, kind: "roommate" });
  if (!check.ok || !check.value) return NextResponse.json({ ok: false, errors: check.errors }, { status: 422 });
  const lead = check.value as RoommateLead;
  const user = await currentUser();
  const rec = await addLead("roommate", lead as unknown as Record<string, unknown> & { name: string; phone: string }, {
    source: body.source === "app" ? "app" : "web",
    ...(user && { userId: user.id, email: user.email }),
  });
  const photo = form.get("photo");
  let profileId: string | null = null;
  if (body.public === true) {
    const p = await addRoommate(lead, rec.id, user?.id ?? null, photo instanceof File && photo.size ? photo : null);
    profileId = p.id;
  }
  return NextResponse.json({ ok: true, leadId: rec.id, profileId });
}
