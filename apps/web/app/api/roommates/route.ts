import { NextResponse } from "next/server";
import { checkContact, validateLead, type RoommateLead } from "@stayshay/core";
import { addLead } from "@/lib/store";
import { addRoommate, cleanPrefs, publicRoommates, updateRoommate } from "@/lib/roommates";
import { myProfile } from "@/lib/swipe";
import { esc, notify } from "@/lib/telegram";
import { currentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

/** Listed public profiles (no phone numbers). */
export async function GET() {
  return NextResponse.json({ profiles: await publicRoommates() }, { headers: { "cache-control": "public, max-age=60", "access-control-allow-origin": "*" } });
}

/**
 * New roommate profile from the website or app. multipart/form-data: `profile` (JSON, a roommate lead plus
 * `public: true|false`) and optional `photo`. Always lands in the admin inbox; the card is live at once (admins can hide it).
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
  if (checkContact(lead.about).blocked || checkContact(lead.profession).blocked) return NextResponse.json({ ok: false, errors: { about: "Please take out any phone numbers, links, handles or other apps. People can message you on Stayshay." } }, { status: 422 });
  const user = await currentUser();
  const photo = form.get("photo");
  const photoFile = photo instanceof File && photo.size ? photo : null;
  // Signed in with a profile already: edit it rather than making a second one.
  const existing = user && body.public === true ? await myProfile(user.id) : null;
  if (existing) {
    const p = await updateRoommate(existing.id, lead, photoFile, body.removePhoto === true, cleanPrefs(body.prefs));
    notify(`✏️ <b>Roommate profile edited</b> · live\n${esc(lead.name)} (${esc(user!.email)}) · profile ${existing.id}\nHide it in /admin if needed`);
    return NextResponse.json({ ok: true, leadId: existing.leadId, profileId: p?.id ?? existing.id, updated: true });
  }
  const rec = await addLead("roommate", lead as unknown as Record<string, unknown> & { name: string; phone: string }, {
    source: body.source === "app" ? "app" : "web",
    ...(user && { userId: user.id, email: user.email }),
  });
  let profileId: string | null = null;
  if (body.public === true) {
    const p = await addRoommate(lead, rec.id, user?.id ?? null, photoFile, cleanPrefs(body.prefs));
    profileId = p.id;
  }
  return NextResponse.json({ ok: true, leadId: rec.id, profileId });
}
