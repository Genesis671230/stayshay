"use client";

import { useEffect, useRef } from "react";
import "leaflet/dist/leaflet.css";
import type { Map as LeafletMap, Marker } from "leaflet";
import { AREA_BY_SLUG, listingPoint, type Listing } from "@stayshay/core";

const DETAIL_ZOOM = 13;
// OSM's public tiles suit private testing; set NEXT_PUBLIC_MAP_TILES to a keyed provider (MapTiler, Stadia) before real traffic.
const TILE_URL = process.env.NEXT_PUBLIC_MAP_TILES || "https://tile.openstreetmap.org/{z}/{x}/{y}.png";
const ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

/** Listings that share one point (same building, or area-centre fallback) fan out ~40–120m so each pin is clickable. */
function spread(id: string): [number, number] {
  let h = 0;
  for (const c of id) h = (h * 31 + c.charCodeAt(0)) | 0;
  const angle = (Math.abs(h) % 360) * (Math.PI / 180);
  const r = 0.0004 + (Math.abs(h >> 8) % 100) / 120000;
  return [Math.sin(angle) * r, Math.cos(angle) * r];
}

const fmt = (n: number) => n.toLocaleString("en-US");

type Leaflet = typeof import("leaflet");

// Satellite: Esri World Imagery (free with attribution) with Esri's place/road labels on top.
const SAT_URL = "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}";
const SAT_LABELS = "https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}";
const SAT_ATTRIBUTION = "Imagery &copy; Esri, Maxar, Earthstar Geographics";

function createMap(mod: Leaflet, el: HTMLElement, interactive: boolean): LeafletMap {
  const m = mod.map(el, { zoomControl: interactive, scrollWheelZoom: false, dragging: true, attributionControl: true }).setView([25.15, 55.25], 11);
  const street = mod.tileLayer(TILE_URL, { attribution: ATTRIBUTION, maxZoom: 19 });
  const satellite = mod.layerGroup([
    mod.tileLayer(SAT_URL, { attribution: SAT_ATTRIBUTION, maxZoom: 19 }),
    mod.tileLayer(SAT_LABELS, { maxZoom: 19, opacity: 0.9 }),
  ]);
  street.addTo(m);
  mod.control.layers({ Map: street, Satellite: satellite }, undefined, { position: "topright", collapsed: false }).addTo(m);
  return m;
}

export default function MapView({
  listings,
  activeId,
  onSelect,
  className = "",
}: {
  listings: Listing[];
  activeId: string | null;
  onSelect: (l: Listing) => void;
  className?: string;
}) {
  const el = useRef<HTMLDivElement>(null);
  const map = useRef<LeafletMap | null>(null);
  const L = useRef<Leaflet | null>(null);
  const markers = useRef<Map<string, Marker>>(new Map());
  const listingsRef = useRef(listings);
  listingsRef.current = listings;
  const onSelectRef = useRef(onSelect);
  onSelectRef.current = onSelect;
  const activeRef = useRef(activeId);
  activeRef.current = activeId;

  /** Zoomed out: one pin per area ("Al Barsha 1 · 23 / from AED 700"). Zoomed in: a price pin per listing. */
  const draw = (fit: boolean) => {
    const mod = L.current;
    const m = map.current;
    if (!mod || !m) return;
    markers.current.forEach((mk) => mk.remove());
    markers.current.clear();

    const detailed = m.getZoom() >= DETAIL_ZOOM;
    const groups = new Map<string, Listing[]>();
    for (const l of listingsRef.current) groups.set(l.areaSlug, [...(groups.get(l.areaSlug) ?? []), l]);
    const bounds: [number, number][] = [];
    const seen = new Map<string, number>();

    for (const [slug, items] of groups) {
      const area = AREA_BY_SLUG.get(slug);
      if (!detailed && items.length > 1 && area) {
        bounds.push([area.lat, area.lng]);
        const min = Math.min(...items.map((i) => i.priceAed));
        // Far out: a small count circle (name + price on hover). Closer: the full labelled pin.
        const compact = m.getZoom() < DETAIL_ZOOM - 1;
        const icon = mod.divIcon({
          className: "",
          html: compact
            ? `<span class="stayshay-count" style="--s:${Math.min(44, 26 + items.length * 2)}px">${items.length}</span>`
            : `<span class="stayshay-pin stayshay-pin-area"><b>${area.name}</b> · ${items.length}<span class="stayshay-pin-sub">from AED ${fmt(min)}</span></span>`,
          iconSize: [0, 0],
        });
        const mk = mod.marker([area.lat, area.lng], { icon, title: `${area.name}: ${items.length} places from AED ${fmt(min)}`, keyboard: true }).addTo(m);
        mk.on("click", () => {
          const pts = items.map(listingPoint).filter(Boolean) as [number, number][];
          if (pts.length) m.fitBounds(mod.latLngBounds(pts), { padding: [60, 60], maxZoom: 16, minZoom: DETAIL_ZOOM } as never);
          else m.setView([area.lat, area.lng], DETAIL_ZOOM + 1);
        });
        markers.current.set(`area:${slug}`, mk);
        continue;
      }
      for (const l of items) {
        const p = listingPoint(l);
        if (!p) continue;
        const key = `${p[0].toFixed(4)},${p[1].toFixed(4)}`;
        const dup = seen.get(key) ?? 0;
        seen.set(key, dup + 1);
        const [dy, dx] = dup ? spread(l.id) : [0, 0];
        const pos: [number, number] = [p[0] + dy, p[1] + dx];
        bounds.push(pos);
        const icon = mod.divIcon({
          className: "",
          html: `<span class="stayshay-pin${l.id === activeRef.current ? " is-active" : ""}">AED ${fmt(l.priceAed)}</span>`,
          iconSize: [0, 0],
        });
        const mk = mod.marker(pos, { icon, title: l.title, keyboard: true }).addTo(m);
        mk.on("click", () => onSelectRef.current(l));
        markers.current.set(l.id, mk);
      }
    }
    if (fit && bounds.length) m.fitBounds(mod.latLngBounds(bounds), { padding: [48, 48], maxZoom: 14 });
  };

  useEffect(() => {
    let cancelled = false;
    let resize: ResizeObserver | null = null;
    import("leaflet").then((mod) => {
      if (cancelled || !el.current || map.current) return;
      L.current = mod;
      map.current = createMap(mod, el.current, true);
      map.current.on("zoomend", () => draw(false));
      let settled = false;
      resize = new ResizeObserver(() => {
        map.current?.invalidateSize();
        if (!settled) {
          settled = true;
          draw(true);
        }
      });
      resize.observe(el.current);
      draw(true);
    });
    return () => {
      cancelled = true;
      resize?.disconnect();
      map.current?.remove();
      map.current = null;
      markers.current.clear();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    draw(true);
  }, [listings]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    markers.current.forEach((mk, id) => {
      const on = id === activeId;
      mk.getElement()?.querySelector(".stayshay-pin")?.classList.toggle("is-active", on);
      mk.setZIndexOffset(on ? 1000 : 0);
    });
  }, [activeId]);

  return (
    <div className={`relative h-full w-full overflow-hidden rounded-[18px] border border-line ${className}`}>
      <div ref={el} className="h-full w-full" aria-label="Map of listings" />
    </div>
  );
}

/** One listing: pin plus a soft radius, since some pins are the area centre rather than the building. */
export function ListingMap({ listing }: { listing: Listing }) {
  const el = useRef<HTMLDivElement>(null);
  useEffect(() => {
    let m: LeafletMap | null = null;
    let cancelled = false;
    import("leaflet").then((mod) => {
      const p = listingPoint(listing);
      if (cancelled || !el.current || !p) return;
      m = createMap(mod, el.current, true);
      const exact = !!(listing.lat && listing.lng);
      m.setView(p, exact ? 15 : 14);
      mod.circle(p, { radius: exact ? 220 : 650, color: "#94743c", weight: 1, fillColor: "#94743c", fillOpacity: 0.08 }).addTo(m);
      mod
        .marker(p, {
          icon: mod.divIcon({ className: "", html: `<span class="stayshay-pin is-active">AED ${fmt(listing.priceAed)}</span>`, iconSize: [0, 0] }),
          title: listing.title,
        })
        .addTo(m);
      new ResizeObserver(() => m?.invalidateSize()).observe(el.current);
    });
    return () => {
      cancelled = true;
      m?.remove();
    };
  }, [listing]);
  return <div ref={el} className="h-full w-full" aria-label="Location map" />;
}
