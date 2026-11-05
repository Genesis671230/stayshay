import type { Metadata } from "next";
import type { Guide } from "./guides";

export const guideMetadata = (g: Guide): Metadata => ({
  title: g.title,
  description: g.description,
  keywords: g.keywords,
  alternates: { canonical: g.path },
  openGraph: { title: g.title, description: g.description, url: g.path, images: [g.photo] },
});
