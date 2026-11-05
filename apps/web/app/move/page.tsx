import type { Metadata } from "next";
import { GuideLanding } from "@/components/guide-landing";
import { getAllListings } from "@/lib/store";
import { GUIDE_BY_PATH } from "@/lib/guides";
import { guideMetadata } from "@/lib/guide-meta";

export const dynamic = "force-dynamic";
const g = GUIDE_BY_PATH.get("/move")!;
export const metadata: Metadata = guideMetadata(g);

export default async function Page() {
  return <GuideLanding g={g} all={await getAllListings()} crumbs={[["Home", "/"], ["Moving to Dubai", "/move"]]} />;
}
