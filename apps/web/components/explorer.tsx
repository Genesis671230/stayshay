"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import Link from "next/link";
import { AREA_BY_SLUG, TYPE_LABEL, TYPE_LABEL_PLURAL, type Listing, type ListingFilters, type ListingType, type SortKey } from "@stayshay/core";
import { Icon, aed } from "./ui";
import { ListingCard, listingHref } from "./listing-card";
import { useMarketplace } from "./marketplace";

const MapView = dynamic(() => import("./map-view"), {
  ssr: false,
  loading: () => <div className="h-full w-full animate-pulse rounded-[16px] bg-surface" />,
});

const PAGE = 12;
const TYPES: ListingType[] = ["bed_space", "partition", "room", "studio"];

type Toggle = { label: string; key: keyof ListingFilters; on: (f: ListingFilters) => boolean; patch: (on: boolean) => Partial<ListingFilters> };

const TOGGLES: Toggle[] = [
  { label: "Verified only", key: "verifiedOnly", on: (f) => !!f.verifiedOnly, patch: (on) => ({ verifiedOnly: !on }) },
  { label: "Bills included", key: "billsIncluded", on: (f) => !!f.billsIncluded, patch: (on) => ({ billsIncluded: !on }) },
  { label: "No deposit", key: "noDeposit", on: (f) => !!f.noDeposit, patch: (on) => ({ noDeposit: !on }) },
  { label: "No commission", key: "noCommission", on: (f) => !!f.noCommission, patch: (on) => ({ noCommission: !on }) },
  { label: "≤10 min to metro", key: "nearMetro", on: (f) => !!f.nearMetro, patch: (on) => ({ nearMetro: !on }) },
  { label: "Female", key: "gender", on: (f) => f.gender === "female", patch: (on) => ({ gender: on ? undefined : "female" }) },
  { label: "Male", key: "gender", on: (f) => f.gender === "male", patch: (on) => ({ gender: on ? undefined : "male" }) },
];

const BUDGET_CHIPS = [1000, 1500, 3000, 4500, 6000];

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      aria-pressed={active}
      className={`h-9 shrink-0 rounded-full border px-4 text-[13.5px] font-medium transition-colors ${active ? "border-brand bg-brand text-white" : "border-line bg-white text-ink-2 hover:border-brand"}`}
    >
      {children}
    </button>
  );
}

function FilterSheet({ onClose }: { onClose: () => void }) {
  const { filters, setFilters, resetFilters, results } = useMarketplace();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  const toggleType = (t: ListingType) => {
    const cur = new Set(filters.types ?? []);
    if (cur.has(t)) cur.delete(t);
    else cur.add(t);
    setFilters({ types: [...cur] });
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 md:items-center" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Filters"
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-[90vh] w-full max-w-[560px] flex-col rounded-t-[14px] bg-white md:rounded-[22px]"
      >
        <div className="flex items-center justify-between border-b border-line px-5 py-4">
          <h2 className="text-[16px] font-semibold">Filters</h2>
          <button onClick={onClose} aria-label="Close" className="text-muted hover:text-ink">
            <Icon name="close" />
          </button>
        </div>
        <div className="space-y-7 overflow-y-auto px-5 py-6">
          <section>
            <h3 className="mb-3 text-[14px] font-semibold">Type of place</h3>
            <div className="flex flex-wrap gap-2">
              {TYPES.map((t) => (
                <Chip key={t} active={!!filters.types?.includes(t)} onClick={() => toggleType(t)}>
                  {TYPE_LABEL[t]}
                </Chip>
              ))}
            </div>
          </section>
          <section>
            <h3 className="mb-3 text-[14px] font-semibold">Monthly budget (AED)</h3>
            <div className="grid grid-cols-2 gap-3">
              <label className="rounded-[12px] border border-line px-3 py-2">
                <span className="block text-[11px] text-muted">Minimum</span>
                <input
                  type="number"
                  inputMode="numeric"
                  min={0}
                  step={50}
                  placeholder="300"
                  value={filters.minPrice ?? ""}
                  onChange={(e) => setFilters({ minPrice: e.target.value ? Number(e.target.value) : undefined })}
                  className="w-full text-[15px] focus:outline-none"
                />
              </label>
              <label className="rounded-[12px] border border-line px-3 py-2">
                <span className="block text-[11px] text-muted">Maximum</span>
                <input
                  type="number"
                  inputMode="numeric"
                  min={0}
                  step={50}
                  placeholder="10,000"
                  value={filters.maxPrice ?? ""}
                  onChange={(e) => setFilters({ maxPrice: e.target.value ? Number(e.target.value) : undefined })}
                  className="w-full text-[15px] focus:outline-none"
                />
              </label>
            </div>
          </section>
          <section>
            <h3 className="mb-3 text-[14px] font-semibold">Move in by</h3>
            <input
              type="date"
              value={filters.moveInBy ?? ""}
              onChange={(e) => setFilters({ moveInBy: e.target.value || undefined })}
              className="w-full rounded-[12px] border border-line px-3 py-2.5 text-[15px]"
            />
          </section>
          <section>
            <h3 className="mb-3 text-[14px] font-semibold">Terms, trust and household</h3>
            <div className="flex flex-wrap gap-2">
              {TOGGLES.map((t) => (
                <Chip key={t.label} active={t.on(filters)} onClick={() => setFilters(t.patch(t.on(filters)))}>
                  {t.label}
                </Chip>
              ))}
            </div>
          </section>
        </div>
        <div className="flex items-center justify-between border-t border-line px-5 py-4">
          <button onClick={resetFilters} className="text-[14px] font-medium underline underline-offset-4">
            Clear all
          </button>
          <button onClick={onClose} className="h-11 rounded-[12px] bg-brand px-5 text-[14.5px] font-medium text-white">
            Show {results.length} {results.length === 1 ? "place" : "places"}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

function MapPreview({ listing, onClose }: { listing: Listing; onClose: () => void }) {
  const area = AREA_BY_SLUG.get(listing.areaSlug);
  return (
    <div className="absolute inset-x-3 bottom-3 z-[500] flex gap-3 rounded-[18px] border border-line bg-white p-2.5 shadow-[0_12px_32px_rgb(0_0_0/0.16)] sm:left-auto sm:w-[360px]">
      <Link href={listingHref(listing)} className="relative h-[84px] w-[110px] shrink-0 overflow-hidden rounded-[12px] bg-surface">
        {listing.photos[0] && <Image src={listing.photos[0]} alt="" fill sizes="110px" className="object-cover" />}
      </Link>
      <Link href={listingHref(listing)} className="min-w-0 flex-1 py-0.5">
        <span className="block text-[11.5px] uppercase tracking-[0.08em] text-muted">
          {listing.typeName ?? TYPE_LABEL[listing.type]} · {area?.name ?? listing.areaName}
        </span>
        <span className="mt-0.5 line-clamp-2 block text-[14px] font-medium leading-snug">{listing.title}</span>
        <span className="mt-1 block text-[14px]">
          <span className="font-figure font-semibold">{aed(listing.priceAed)}</span> <span className="text-muted">/ month</span>
        </span>
      </Link>
      <button onClick={onClose} aria-label="Close preview" className="self-start p-1 text-muted hover:text-ink">
        <Icon name="close" size={15} />
      </button>
    </div>
  );
}

export function Explorer({ variant = "home" }: { variant?: "home" | "search" }) {
  const { filters, setFilters, resetFilters, results, hoverId, setHoverId } = useMarketplace();
  const isSearch = variant === "search";
  const [shown, setShown] = useState(isSearch ? 18 : PAGE);
  const [view, setView] = useState<"grid" | "map">("grid");
  const [sheet, setSheet] = useState(false);
  const [preview, setPreview] = useState<Listing | null>(null);
  // Desktop: listings + map side by side, or listings only. Remembered per browser.
  const [showMap, setShowMapState] = useState(true);
  useEffect(() => {
    try {
      if (localStorage.getItem("stayshay:map") === "off") setShowMapState(false);
    } catch {}
  }, []);
  const setShowMap = (fn: (v: boolean) => boolean) =>
    setShowMapState((v) => {
      const next = fn(v);
      try {
        localStorage.setItem("stayshay:map", next ? "on" : "off");
      } catch {}
      return next;
    });

  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("view") === "map") setView("map");
  }, []);
  useEffect(() => {
    setShown(isSearch ? 18 : PAGE);
    setPreview(null);
  }, [filters, isSearch]);

  const activeCount =
    (filters.types?.length ?? 0) +
    (filters.minPrice != null ? 1 : 0) +
    (filters.maxPrice != null ? 1 : 0) +
    (filters.moveInBy ? 1 : 0) +
    TOGGLES.filter((t) => t.on(filters)).length;

  const areaNames = (filters.areaSlugs ?? []).map((s) => AREA_BY_SLUG.get(s)?.name ?? s);
  const heading =
    (filters.types?.length === 1 ? TYPE_LABEL_PLURAL[filters.types[0]] : "Places") + (areaNames.length ? ` in ${areaNames.join(", ")}` : " across the UAE");

  const typeTabs = (
    <div className="snap-x-strip -mx-4 flex gap-1 overflow-x-auto border-b border-line px-4 md:mx-0 md:px-0" role="tablist" aria-label="Type">
      {([undefined, ...TYPES] as (ListingType | undefined)[]).map((t) => {
        const on = t ? filters.types?.length === 1 && filters.types[0] === t : !filters.types?.length;
        return (
          <button
            key={t ?? "all"}
            role="tab"
            aria-selected={on}
            onClick={() => setFilters({ types: t ? [t] : undefined })}
            className={`-mb-px h-11 shrink-0 border-b-2 px-3 text-[14px] ${on ? "border-brand font-medium text-ink" : "border-transparent text-muted hover:text-ink"}`}
          >
            {t ? TYPE_LABEL_PLURAL[t] : "All"}
          </button>
        );
      })}
    </div>
  );

  const chips = (
    <div className="snap-x-strip -mx-4 flex gap-2 overflow-x-auto px-4 pb-1 md:mx-0 md:px-0">
      <button onClick={() => setSheet(true)} className="flex h-9 shrink-0 items-center gap-2 rounded-[12px] border border-brand px-3.5 text-[13.5px] font-medium">
        <Icon name="sliders" size={15} /> Filters{activeCount ? ` (${activeCount})` : ""}
      </button>
      {BUDGET_CHIPS.map((b) => (
        <Chip key={b} active={filters.maxPrice === b} onClick={() => setFilters({ maxPrice: filters.maxPrice === b ? undefined : b })}>
          Under AED {b.toLocaleString("en-US")}
        </Chip>
      ))}
      {TOGGLES.map((t) => (
        <Chip key={t.label} active={t.on(filters)} onClick={() => setFilters(t.patch(t.on(filters)))}>
          {t.label}
        </Chip>
      ))}
    </div>
  );

  const toolbar = (
    <div className="flex items-center gap-2">
      <label className="sr-only" htmlFor="sort">
        Sort
      </label>
      <select id="sort" value={filters.sort ?? "recommended"} onChange={(e) => setFilters({ sort: e.target.value as SortKey })} className="h-10 rounded-[12px] border border-line bg-white px-3 text-[14px]">
        <option value="recommended">Recommended</option>
        <option value="price_asc">Price: low to high</option>
        <option value="price_desc">Price: high to low</option>
        <option value="newest">Newest</option>
      </select>
      <div className={`flex rounded-[12px] border border-line p-0.5 ${isSearch ? "lg:hidden" : ""}`} role="group" aria-label="View">
        {(["grid", "map"] as const).map((v) => (
          <button key={v} onClick={() => setView(v)} aria-pressed={view === v} className={`flex h-9 items-center gap-1.5 rounded-[6px] px-3 text-[13.5px] ${view === v ? "bg-brand text-white" : "text-ink-2"}`}>
            <Icon name={v} size={15} /> {v === "grid" ? "List" : "Map"}
          </button>
        ))}
      </div>
    </div>
  );

  const empty = (
    <div className="mt-10 rounded-[18px] border border-dashed border-line-strong px-6 py-14 text-center">
      <p className="font-display text-[26px]">Nothing matches yet</p>
      <p className="mx-auto mt-2 max-w-[420px] text-[14.5px] text-muted">Loosen a filter, or tell us what you need and we’ll WhatsApp you when a place fits.</p>
      <div className="mt-6 flex justify-center gap-3">
        <button onClick={resetFilters} className="h-11 rounded-[12px] border border-brand px-5 text-[14px] font-medium">Clear filters</button>
        <Link href="/find" className="flex h-11 items-center rounded-[12px] bg-brand px-5 text-[14px] font-medium text-white">Find me a room</Link>
      </div>
    </div>
  );

  const more = shown < results.length && (
    <div className="mt-12 flex justify-center">
      <button onClick={() => setShown((n) => n + (isSearch ? 18 : PAGE))} className="h-11 rounded-[12px] border border-brand px-6 text-[14px] font-medium hover:bg-brand hover:text-white">
        Show more ({results.length - shown} left)
      </button>
    </div>
  );

  const map = (
    <div className="relative h-full">
      <MapView listings={results} activeId={hoverId ?? preview?.id ?? null} onSelect={setPreview} />
      {preview && <MapPreview listing={preview} onClose={() => setPreview(null)} />}
    </div>
  );

  if (isSearch) {
    const mapToggle = (
      <button
        onClick={() => setShowMap((v) => !v)}
        aria-pressed={showMap}
        className="hidden h-10 items-center gap-2.5 rounded-full border border-line bg-white pl-3 pr-1.5 text-[13.5px] font-semibold text-ink lg:inline-flex"
      >
        <Icon name="map" size={15} /> Show map
        <span className={`relative h-6 w-10 rounded-full transition-colors ${showMap ? "bg-brand" : "bg-line-strong"}`}>
          <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-[left] ${showMap ? "left-[18px]" : "left-0.5"}`} />
        </span>
      </button>
    );
    const split = showMap;
    return (
      <section id="listings" className="mx-auto max-w-[1440px] px-4 pb-16 md:px-8">
        <div className="sticky top-[68px] z-30 -mx-4 space-y-3 bg-white px-4 pb-3 pt-2 md:-mx-8 md:px-8">
          {typeTabs}
          {chips}
        </div>
        <div className={`mt-2 grid grid-cols-1 gap-8 ${split ? "lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]" : ""}`}>
          <div className={view === "map" ? "hidden lg:block" : ""}>
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <h1 className="font-display text-[26px] leading-tight md:text-[34px]">{heading}</h1>
                <p className="mt-1 text-[14px] text-muted" aria-live="polite">
                  <span className="font-semibold text-ink">{results.length}</span> {results.length === 1 ? "place" : "places"}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {mapToggle}
                {toolbar}
              </div>
            </div>
            {results.length === 0 ? (
              empty
            ) : (
              <>
                <div className={`mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 ${split ? "" : "lg:grid-cols-3 xl:grid-cols-4"}`}>
                  {results.slice(0, shown).map((l) => (
                    <ListingCard key={l.id} listing={l} onHover={setHoverId} />
                  ))}
                </div>
                {more}
              </>
            )}
          </div>
          <div className={`${view === "map" ? "" : "hidden"} ${split ? "lg:block" : ""}`}>
            {view === "map" && <div className="mb-3 flex justify-end lg:hidden">{toolbar}</div>}
            <div className="h-[calc(100vh-220px)] min-h-[420px] lg:sticky lg:top-[180px] lg:h-[calc(100vh-200px)]">{map}</div>
          </div>
        </div>
        {sheet && <FilterSheet onClose={() => setSheet(false)} />}
      </section>
    );
  }

  return (
    <section id="listings" className="mx-auto max-w-[1240px] px-4 py-16 md:px-8 md:py-24">
      <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="eyebrow">Explore</p>
          <h2 className="font-display mt-2 text-[34px] leading-[1.08] md:text-[44px]">{heading}</h2>
          <p className="mt-2 text-[14.5px] text-muted" aria-live="polite">
            <span className="font-figure">{results.length}</span> {results.length === 1 ? "place" : "places"} ·{" "}
            <Link href="/search" className="underline underline-offset-4 hover:text-ink">open full search</Link>
          </p>
        </div>
        {toolbar}
      </div>
      <div className="mt-6 space-y-3">
        {typeTabs}
        {chips}
      </div>
      {results.length === 0 ? (
        empty
      ) : view === "grid" ? (
        <>
          <div className="mt-8 grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
            {results.slice(0, shown).map((l) => (
              <ListingCard key={l.id} listing={l} />
            ))}
          </div>
          {more}
        </>
      ) : (
        <div className="mt-8 h-[620px]">{map}</div>
      )}
      {sheet && <FilterSheet onClose={() => setSheet(false)} />}
    </section>
  );
}
