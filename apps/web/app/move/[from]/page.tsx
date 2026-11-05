import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { GuideLanding } from "@/components/guide-landing";
import { getAllListings } from "@/lib/store";
import { GUIDE_BY_PATH } from "@/lib/guides";
import { guideMetadata } from "@/lib/guide-meta";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ from: string }> }): Promise<Metadata> {
  const g = GUIDE_BY_PATH.get(`/move/${(await params).from}`);
  return g ? guideMetadata(g) : {};
}

export default async function Page({ params }: { params: Promise<{ from: string }> }) {
  const g = GUIDE_BY_PATH.get(`/move/${(await params).from}`);
  if (!g) notFound();
  return <GuideLanding g={g} all={await getAllListings()} crumbs={[["Home", "/"], ["Moving to Dubai", "/move"], [g.h1.replace("Moving to Dubai from ", "From "), g.path]]} />;
}
