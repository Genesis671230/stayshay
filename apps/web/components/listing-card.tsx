"use client";

import Image from "next/image";
import Link from "next/link";
import { useRef, useState } from "react";
import { AREA_BY_SLUG, TYPE_LABEL, isVerifiedCompliant, whatsappMessage, type Listing } from "@stayshay/core";
import { Badge, Icon, aed, availability } from "./ui";
import { useMarketplace } from "./marketplace";
import { stayshayWhatsapp } from "@/lib/contact";

const GENDER_LABEL = { male: "Male only", female: "Female only", any: "Mixed" } as const;

export function tagsFor(l: Listing): string[] {
  const tags: string[] = [];
  if (l.billsIncluded) tags.push("Bills included");
  if (l.deposit === 0) tags.push("No deposit");
  if (l.commission === 0) tags.push("No commission");
  if (l.furnished) tags.push("Furnished");
  return tags;
}

export function Gallery({ listing, sizes, rounded = true }: { listing: Listing; sizes: string; rounded?: boolean }) {
  const strip = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);
  const photos = listing.photos.length ? listing.photos : [];

  const go = (dir: 1 | -1, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const el = strip.current;
    if (!el) return;
    const next = Math.max(0, Math.min(photos.length - 1, index + dir));
    el.scrollTo({ left: next * el.clientWidth, behavior: "smooth" });
  };

  return (
    <div className={`group relative aspect-[4/3] overflow-hidden bg-surface ${rounded ? "rounded-[18px]" : ""}`}>
      <div
        ref={strip}
        className="snap-x-strip flex h-full overflow-x-auto"
        onScroll={(e) => setIndex(Math.round(e.currentTarget.scrollLeft / e.currentTarget.clientWidth))}
      >
        {photos.map((src, i) => (
          <div key={src + i} className="relative h-full w-full shrink-0">
            <Image
              src={src}
              alt={`${listing.title}, photo ${i + 1}`}
              fill
              sizes={sizes}
              className="object-cover"
              loading={i === 0 ? undefined : "lazy"}
            />
          </div>
        ))}
      </div>
      {photos.length > 1 && (
        <>
          <button
            aria-label="Previous photo"
            onClick={(e) => go(-1, e)}
            className={`absolute left-2 top-1/2 hidden h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-white/95 text-ink shadow md:group-hover:flex ${index === 0 ? "md:!hidden" : ""}`}
          >
            <Icon name="chevron-left" size={16} />
          </button>
          <button
            aria-label="Next photo"
            onClick={(e) => go(1, e)}
            className={`absolute right-2 top-1/2 hidden h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-white/95 text-ink shadow md:group-hover:flex ${index === photos.length - 1 ? "md:!hidden" : ""}`}
          >
            <Icon name="chevron-right" size={16} />
          </button>
          <div className="pointer-events-none absolute bottom-2.5 left-1/2 flex -translate-x-1/2 gap-1">
            {photos.map((_, i) => (
              <span key={i} className={`h-1.5 w-1.5 rounded-full ${i === index ? "bg-white" : "bg-white/55"}`} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export function listingHref(l: Listing) {
  return `/listing/${l.id.toLowerCase()}`;
}

const VERIFIED_BADGE = (l: Listing) =>
  isVerifiedCompliant(l) ? (
    <Badge tone="verified">
      <Icon name="shield" size={12} /> Verified compliant
    </Badge>
  ) : l.verifiedLister ? (
    <Badge tone="verified">
      <Icon name="check" size={12} /> Verified listing
    </Badge>
  ) : null;

export function ListingCard({ listing, onHover }: { listing: Listing; onHover?: (id: string | null) => void }) {
  const { saved, toggleSaved } = useMarketplace();
  const area = AREA_BY_SLUG.get(listing.areaSlug);
  const isSaved = saved.has(listing.id);
  const shared = listing.type === "bed_space" || listing.type === "partition";

  const price = (
    <>
      {listing.priceMaxAed ? <span className="font-medium text-muted">From </span> : null}
      <span className="font-extrabold tracking-[-0.02em] text-ink">{aed(listing.priceAed)}</span>
      <span className="font-medium text-muted">/mo</span>
    </>
  );

  return (
    <Link
      href={listingHref(listing)}
      className="group/card flex h-full flex-col rounded-[24px] border border-line bg-white p-2 transition-[box-shadow,border-color] hover:border-line-strong hover:shadow-[0_14px_40px_rgb(20_92_70/0.10)]"
      onMouseEnter={() => onHover?.(listing.id)}
      onMouseLeave={() => onHover?.(null)}
      aria-label={`${listing.title}, ${aed(listing.priceAed)} per month`}
    >
      <div className="relative">
        <Gallery listing={listing} sizes="(min-width:1280px) 24vw, (min-width:1024px) 30vw, (min-width:640px) 45vw, 92vw" />
        <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
          <span className="rounded-full bg-white/95 px-2.5 py-1 text-[11.5px] font-semibold text-ink shadow-sm">{listing.typeName ?? TYPE_LABEL[listing.type]}</span>
          {VERIFIED_BADGE(listing)}
        </div>
        <button
          aria-label={isSaved ? "Remove from saved" : "Save"}
          aria-pressed={isSaved}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            toggleSaved(listing.id);
          }}
          className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-white/95 shadow-sm"
        >
          <Icon name="heart" size={17} className={isSaved ? "fill-brand text-brand" : "text-ink"} />
        </button>
        <span className="absolute bottom-3 left-3 rounded-full bg-white px-3 py-1.5 text-[14px] shadow-md">{price}</span>
      </div>

      <div className="flex flex-1 flex-col px-2.5 pb-2 pt-3.5">
        <h3 className="line-clamp-1 text-[15.5px] font-bold tracking-[-0.01em] text-ink">{listing.title}</h3>
        <p className="mt-1 flex items-center gap-1.5 text-[13px] text-muted">
          <Icon name="pin" size={14} className="shrink-0 text-brand" />
          <span className="truncate">
            {area?.name ?? listing.areaName ?? listing.areaSlug}
            {listing.nearMetroMinutes != null ? ` · ${listing.nearMetroMinutes} min to ${listing.metro ?? area?.nearMetro ?? "metro"}` : ""}
          </span>
        </p>
        <div className="mb-3.5 mt-3 flex flex-wrap gap-1.5">
          {tagsFor(listing)
            .slice(0, 2)
            .map((t) => (
              <span key={t} className="rounded-full bg-mint px-2.5 py-1 text-[11.5px] font-semibold text-brand">
                {t}
              </span>
            ))}
          <span className="rounded-full bg-surface px-2.5 py-1 text-[11.5px] font-semibold text-ink-2">
            {GENDER_LABEL[listing.gender]}
            {shared && listing.bedsInRoom > 1 ? ` · ${listing.bedsAvailable}/${listing.bedsInRoom} beds` : ""}
          </span>
        </div>
        <div className="mt-auto flex items-center justify-between gap-3 border-t border-line pt-3">
          <span className="text-[12.5px] text-muted">{availability(listing.availableFrom)}</span>
          <span
            role="link"
            tabIndex={0}
            aria-label="Ask on WhatsApp"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              window.open(stayshayWhatsapp(whatsappMessage(listing, {})), "_blank", "noopener,noreferrer");
            }}
            className="inline-flex h-9 items-center gap-1.5 rounded-full bg-whatsapp/10 px-3.5 text-[13px] font-semibold text-whatsapp hover:bg-whatsapp hover:text-white"
          >
            <Icon name="whatsapp" size={15} /> Ask
          </span>
        </div>
      </div>
    </Link>
  );
}
