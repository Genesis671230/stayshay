"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AREAS, AREA_BY_SLUG, LISTINGS, TYPE_LABEL, searchAreas, type Area, type ListingType } from "@stayshay/core";
import { Icon } from "./ui";
import { searchHref, useMarketplace } from "./marketplace";

const TYPE_OPTIONS: ListingType[] = ["bed_space", "partition", "room", "studio"];
const BUDGETS = [1000, 1500, 2500, 3500, 5000, 7500];

const countByArea = LISTINGS.reduce<Record<string, number>>((acc, l) => {
  acc[l.areaSlug] = (acc[l.areaSlug] ?? 0) + 1;
  return acc;
}, {});

const POPULAR = [...AREAS].sort((a, b) => (countByArea[b.slug] ?? 0) - (countByArea[a.slug] ?? 0)).slice(0, 6);

function distanceKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos((a.lat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

export function AreaCombobox({ value, onChange }: { value: Area | null; onChange: (a: Area | null) => void }) {
  const id = useId();
  const [query, setQuery] = useState(value?.name ?? "");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const [locating, setLocating] = useState(false);
  const wrap = useRef<HTMLDivElement>(null);

  useEffect(() => setQuery(value?.name ?? ""), [value]);

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (!wrap.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  const typed = query.trim() !== "" && query !== value?.name;
  const options = useMemo(() => (typed ? searchAreas(AREAS, query).map((m) => m.area) : POPULAR), [query, typed]);

  const pick = (a: Area) => {
    onChange(a);
    setQuery(a.name);
    setOpen(false);
  };

  const nearMe = () => {
    if (!navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const me = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        const nearest = [...AREAS].sort((a, b) => distanceKm(me, a) - distanceKm(me, b))[0];
        if (nearest) pick(nearest);
        setLocating(false);
      },
      () => setLocating(false),
      { timeout: 8000 },
    );
  };

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setOpen(true);
      setActive((i) => Math.min(i + 1, options.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && open && options[active]) {
      e.preventDefault();
      pick(options[active]);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  return (
    <div ref={wrap} className="relative">
      <label htmlFor={id} className="block text-[12px] font-medium text-ink">
        Where
      </label>
      <div className="flex items-center gap-2">
        <input
          id={id}
          role="combobox"
          aria-expanded={open}
          aria-controls={`${id}-list`}
          aria-autocomplete="list"
          aria-activedescendant={open && options[active] ? `${id}-${options[active].slug}` : undefined}
          autoComplete="off"
          placeholder="Area, community or metro"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setActive(0);
            setOpen(true);
            if (!e.target.value) onChange(null);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKey}
          className="w-full bg-transparent py-0.5 text-[15px] text-ink placeholder:text-muted focus:outline-none"
        />
        {value && (
          <button type="button" aria-label="Clear area" onClick={() => { onChange(null); setQuery(""); }} className="text-muted hover:text-ink">
            <Icon name="close" size={15} />
          </button>
        )}
      </div>

      {open && (
        <div className="absolute left-0 top-[calc(100%+14px)] z-30 w-[min(92vw,380px)] overflow-hidden rounded-[16px] border border-line bg-white shadow-[0_12px_32px_rgb(0_0_0/0.10)]">
          <button type="button" onClick={nearMe} className="flex w-full items-center gap-3 border-b border-line px-4 py-3 text-left text-[14px] hover:bg-surface">
            <Icon name="pin" size={16} className="text-brass" />
            {locating ? "Finding the nearest area…" : "Near me"}
          </button>
          {!typed && <p className="px-4 pb-1 pt-3 text-[11px] font-medium uppercase tracking-[0.12em] text-muted">Popular</p>}
          <ul id={`${id}-list`} role="listbox" className="max-h-[300px] overflow-y-auto py-1">
            {options.length === 0 && <li className="px-4 py-3 text-[14px] text-muted">No area matches “{query}”. Try a metro station or community.</li>}
            {options.map((a, i) => (
              <li
                key={a.slug}
                id={`${id}-${a.slug}`}
                role="option"
                aria-selected={i === active}
                onMouseEnter={() => setActive(i)}
                onMouseDown={(e) => {
                  e.preventDefault();
                  pick(a);
                }}
                className={`flex cursor-pointer items-center justify-between gap-3 px-4 py-2.5 ${i === active ? "bg-surface" : ""}`}
              >
                <span className="min-w-0">
                  <span className="block truncate text-[14px] text-ink">{a.name}</span>
                  <span className="block truncate text-[12px] text-muted">
                    {a.emirate}
                    {a.nearMetro ? ` · ${a.nearMetro} metro` : ""}
                  </span>
                </span>
                <span className="shrink-0 text-[12px] text-muted">
                  {countByArea[a.slug] ? `${countByArea[a.slug]} places` : ""}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export function SearchBar() {
  const router = useRouter();
  const { filters } = useMarketplace();
  const area = filters.areaSlugs?.length === 1 ? AREA_BY_SLUG.get(filters.areaSlugs[0]) ?? null : null;
  const [draftArea, setDraftArea] = useState<Area | null>(area);
  const [type, setType] = useState<ListingType | "">(filters.types?.length === 1 ? filters.types[0] : "");
  const [budget, setBudget] = useState<string>(filters.maxPrice ? String(filters.maxPrice) : "");
  const [moveIn, setMoveIn] = useState(filters.moveInBy ?? "");

  // URL-loaded filters arrive after mount; mirror them into the bar once.
  useEffect(() => {
    setDraftArea(area);
    setType(filters.types?.length === 1 ? filters.types[0] : "");
    setBudget(filters.maxPrice ? String(filters.maxPrice) : "");
    setMoveIn(filters.moveInBy ?? "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.areaSlugs?.join(), filters.types?.join(), filters.maxPrice, filters.moveInBy]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    router.push(
      searchHref({
        areaSlugs: draftArea ? [draftArea.slug] : undefined,
        types: type ? [type] : undefined,
        maxPrice: budget ? Number(budget) : undefined,
        moveInBy: moveIn || undefined,
      }),
    );
  };

  const field = "px-5 py-3 md:py-2.5";

  return (
    <form
      onSubmit={submit}
      role="search"
      className="grid grid-cols-1 rounded-[18px] border border-line-strong bg-white shadow-[0_8px_28px_rgb(0_0_0/0.07)] md:grid-cols-[1.5fr_1fr_1fr_1fr_auto] md:items-center"
    >
      <div className={`${field} border-b border-line md:border-b-0 md:border-r`}>
        <AreaCombobox value={draftArea} onChange={setDraftArea} />
      </div>
      <label className={`${field} block border-b border-line md:border-b-0 md:border-r`}>
        <span className="block text-[12px] font-medium">Type</span>
        <select value={type} onChange={(e) => setType(e.target.value as ListingType | "")} className="w-full appearance-none bg-transparent py-0.5 text-[15px] focus:outline-none">
          <option value="">Any type</option>
          {TYPE_OPTIONS.map((t) => (
            <option key={t} value={t}>
              {TYPE_LABEL[t]}
            </option>
          ))}
        </select>
      </label>
      <label className={`${field} block border-b border-line md:border-b-0 md:border-r`}>
        <span className="block text-[12px] font-medium">Budget / month</span>
        <select value={budget} onChange={(e) => setBudget(e.target.value)} className="w-full appearance-none bg-transparent py-0.5 text-[15px] focus:outline-none">
          <option value="">Any budget</option>
          {BUDGETS.map((b) => (
            <option key={b} value={b}>
              Up to AED {b.toLocaleString("en-US")}
            </option>
          ))}
        </select>
      </label>
      <label className={`${field} block border-b border-line md:border-b-0`}>
        <span className="block text-[12px] font-medium">Move in by</span>
        <input
          type="date"
          value={moveIn}
          min={new Date().toISOString().slice(0, 10)}
          onChange={(e) => setMoveIn(e.target.value)}
          className="w-full bg-transparent py-0.5 text-[15px] focus:outline-none"
        />
      </label>
      <div className="p-2.5">
        <button type="submit" className="flex h-12 w-full items-center justify-center gap-2 rounded-[12px] bg-brand px-6 text-[15px] font-medium text-white hover:bg-brand-deep md:w-auto">
          <Icon name="search" size={17} />
          Search
        </button>
      </div>
    </form>
  );
}
