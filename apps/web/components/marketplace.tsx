"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { AREAS, LISTINGS, filterListings, type Listing, type ListingFilters, type ListingType, type SortKey } from "@stayshay/core";

const TYPES: ListingType[] = ["room", "bed_space", "partition", "studio", "roommate"];
const SORTS: SortKey[] = ["recommended", "price_asc", "price_desc", "newest"];

interface MarketplaceState {
  filters: ListingFilters;
  setFilters: (patch: Partial<ListingFilters>) => void;
  resetFilters: () => void;
  results: Listing[];
  hoverId: string | null;
  setHoverId: (id: string | null) => void;
  saved: Set<string>;
  toggleSaved: (id: string) => void;
}

const Ctx = createContext<MarketplaceState | null>(null);

export function useMarketplace(): MarketplaceState {
  const v = useContext(Ctx);
  if (!v) throw new Error("useMarketplace outside <MarketplaceProvider>");
  return v;
}

/** URL ⇄ filters, so every search is a shareable link (and the future app can deep-link the same params). */
function readUrl(): ListingFilters {
  if (typeof window === "undefined") return {};
  const p = new URLSearchParams(window.location.search);
  const num = (k: string) => (p.get(k) && Number.isFinite(Number(p.get(k))) ? Number(p.get(k)) : undefined);
  const known = new Set(AREAS.map((a) => a.slug));
  const f: ListingFilters = {
    areaSlugs: p.get("area")?.split(",").filter((s) => known.has(s)),
    types: p.get("type")?.split(",").filter((t): t is ListingType => TYPES.includes(t as ListingType)),
    maxPrice: num("max"),
    minPrice: num("min"),
    gender: (["male", "female"] as const).find((g) => g === p.get("gender")),
    billsIncluded: p.get("bills") === "1" || undefined,
    noDeposit: p.get("nodeposit") === "1" || undefined,
    noCommission: p.get("nocommission") === "1" || undefined,
    nearMetro: p.get("metro") === "1" || undefined,
    verifiedOnly: p.get("verified") === "1" || undefined,
    moveInBy: /^\d{4}-\d{2}-\d{2}$/.test(p.get("movein") ?? "") ? p.get("movein")! : undefined,
    sort: SORTS.find((s) => s === p.get("sort")),
  };
  return Object.fromEntries(Object.entries(f).filter(([, v]) => v !== undefined && !(Array.isArray(v) && !v.length)));
}

function writeUrl(f: ListingFilters) {
  const p = new URLSearchParams();
  if (f.areaSlugs?.length) p.set("area", f.areaSlugs.join(","));
  if (f.types?.length) p.set("type", f.types.join(","));
  if (f.maxPrice != null) p.set("max", String(f.maxPrice));
  if (f.minPrice != null) p.set("min", String(f.minPrice));
  if (f.gender && f.gender !== "any") p.set("gender", f.gender);
  if (f.billsIncluded) p.set("bills", "1");
  if (f.noDeposit) p.set("nodeposit", "1");
  if (f.noCommission) p.set("nocommission", "1");
  if (f.nearMetro) p.set("metro", "1");
  if (f.verifiedOnly) p.set("verified", "1");
  if (f.moveInBy) p.set("movein", f.moveInBy);
  if (f.sort && f.sort !== "recommended") p.set("sort", f.sort);
  const qs = p.toString();
  window.history.replaceState(null, "", `${window.location.pathname}${qs ? `?${qs}` : ""}${window.location.hash}`);
}

const SAVED_KEY = "stayshay:saved";

export function MarketplaceProvider({ children }: { children: React.ReactNode }) {
  const [filters, setFiltersState] = useState<ListingFilters>({});
  const [hoverId, setHoverId] = useState<string | null>(null);
  const [saved, setSaved] = useState<Set<string>>(new Set());
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setFiltersState(readUrl());
    try {
      setSaved(new Set(JSON.parse(localStorage.getItem(SAVED_KEY) ?? "[]")));
    } catch {
      /* storage blocked: saves just won't persist */
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) writeUrl(filters);
  }, [filters, hydrated]);

  const setFilters = useCallback((patch: Partial<ListingFilters>) => {
    setFiltersState((cur) => {
      const next = { ...cur, ...patch };
      for (const k of Object.keys(next) as (keyof ListingFilters)[]) {
        const v = next[k];
        if (v === undefined || v === false || (Array.isArray(v) && v.length === 0)) delete next[k];
      }
      return next;
    });
  }, []);

  const resetFilters = useCallback(() => setFiltersState({}), []);

  const toggleSaved = useCallback((id: string) => {
    setSaved((cur) => {
      const next = new Set(cur);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      try {
        localStorage.setItem(SAVED_KEY, JSON.stringify([...next]));
      } catch {
        /* ignore */
      }
      return next;
    });
  }, []);

  const results = useMemo(() => filterListings(LISTINGS, AREAS, filters), [filters]);

  const value = useMemo(
    () => ({ filters, setFilters, resetFilters, results, hoverId, setHoverId, saved, toggleSaved }),
    [filters, setFilters, resetFilters, results, hoverId, saved, toggleSaved],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

/** On the home page the explorer is inline; elsewhere a search goes to /search with the same params. */
export function scrollToListings() {
  const el = document.getElementById("listings");
  if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
}

export function searchHref(f: ListingFilters): string {
  const p = new URLSearchParams();
  if (f.areaSlugs?.length) p.set("area", f.areaSlugs.join(","));
  if (f.types?.length) p.set("type", f.types.join(","));
  if (f.maxPrice != null) p.set("max", String(f.maxPrice));
  if (f.moveInBy) p.set("movein", f.moveInBy);
  if (f.gender && f.gender !== "any") p.set("gender", f.gender);
  const qs = p.toString();
  return `/search${qs ? `?${qs}` : ""}`;
}
