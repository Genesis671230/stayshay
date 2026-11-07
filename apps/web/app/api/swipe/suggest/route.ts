import { NextResponse } from "next/server";
import { AREA_BY_SLUG } from "@stayshay/core";
import { currentUser } from "@/lib/auth";
import { suggest } from "@/lib/swipe";

export const dynamic = "force-dynamic";

/** Live onboarding hints (counts and typical numbers only). Signed-in people only. */
export async function GET(req: Request) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ ok: false }, { status: 401 });
  const sp = new URL(req.url).searchParams;
  const gender = sp.get("gender") === "male" ? "male" : "female";
  const age = (k: string) => {
    const n = Number(sp.get(k));
    return n >= 18 && n <= 99 ? n : null;
  };
  const seeking = sp.get("seeking");
  const r = await suggest(
    {
      gender,
      budget: Math.max(0, Math.min(100000, Number(sp.get("budget")) || 0)),
      areas: (sp.get("areas") ?? "").split(",").filter((a) => AREA_BY_SLUG.has(a)).slice(0, 5),
      seeking: seeking === "has_place" || seeking === "looking" ? seeking : "any",
      ageMin: age("ageMin"),
      ageMax: age("ageMax"),
    },
    user.id,
  );
  return NextResponse.json({ ok: true, ...r }, { headers: { "cache-control": "no-store" } });
}
