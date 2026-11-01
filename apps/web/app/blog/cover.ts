import { PHOTOS, type Listing } from "@stayshay/core";
import type { Post } from "@/lib/blog";

/** A real photo from a live listing of the post's kind (area first), so covers are always our own pictures. */
export function coverFor(post: Post, listings: Listing[], offset = 0): string | null {
  // Topic photo first (guide-specific, then the area), then the photo for the kind of place.
  // On the blog index (offset > 0) odd cards use a real listing photo so the grid doesn't repeat.
  const topic = post.cover.photo || (post.cover.area && PHOTOS.areas[post.cover.area]);
  if (topic) return topic;
  if (post.cover.stock || offset % 2 === 0) {
    const kind = PHOTOS.categories[post.cover.type];
    if (kind) return kind;
  }
  const pool = listings.filter((l) => l.photos.length && l.type === post.cover.type);
  const local = post.cover.area ? pool.filter((l) => l.areaSlug === post.cover.area) : [];
  const pick = (local.length ? local : pool)[offset % Math.max(1, (local.length ? local : pool).length)];
  return pick?.photos[0] ?? null;
}
