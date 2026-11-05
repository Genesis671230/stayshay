import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { GuideLanding } from "@/components/guide-landing";
import { getAllListings } from "@/lib/store";
import { GUIDE_BY_PATH } from "@/lib/guides";
import { guideMetadata } from "@/lib/guide-meta";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const g = GUIDE_BY_PATH.get(`/family/${(await params).slug}`);
  return g ? guideMetadata(g) : {};
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const g = GUIDE_BY_PATH.get(`/family/${(await params).slug}`);
  if (!g) notFound();
  return <GuideLanding g={g} all={await getAllListings()} crumbs={[["Home", "/"], ["Family homes", "/family"], [g.h1, g.path]]} />;
}
