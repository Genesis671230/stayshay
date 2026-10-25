"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { askLocation, getSavedLocation, km } from "./shay-chat";
import { Icon } from "./ui";

type Event = { id: string; kind: "listing" | "roommate" | "viewing"; text: string; href: string; at: string; lat: number | null; lng: number | null; photo: string | null };
type Toast = { type: "event"; e: Event; distance: number | null } | { type: "location" };

function ago(iso: string) {
  const m = Math.max(1, Math.round((Date.now() - Date.parse(iso)) / 60000));
  if (m < 60) return `${m} min ago`;
  if (m < 1440) return `${Math.round(m / 60)} h ago`;
  const d = Math.round(m / 1440);
  return d === 1 ? "yesterday" : `${d} days ago`;
}

const LABEL = { listing: "New place", roommate: "Roommate", viewing: "Popular" } as const;
const MAX_PER_VISIT = 5;

/**
 * Small, dismissible notifications built from real activity (/api/activity). Nearby events come first
 * once the visitor shares their location (asked with a card, never on page load).
 */
export function ActivityToasts() {
  const path = usePathname();
  const [toast, setToast] = useState<Toast | null>(null);
  const events = useRef<Event[]>([]);
  const shown = useRef<Set<string>>(new Set());
  const count = useRef(0);
  const stopped = useRef(false);
  const [loc, setLoc] = useState<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    try {
      stopped.current = sessionStorage.getItem("stayshay:toasts") === "off";
      JSON.parse(sessionStorage.getItem("stayshay:toasts-seen") ?? "[]").forEach((id: string) => shown.current.add(id));
    } catch {}
    setLoc(getSavedLocation());
    const onLoc = (e: Event | globalThis.Event) => setLoc((e as CustomEvent).detail);
    window.addEventListener("stayshay:location", onLoc);
    fetch("/api/activity")
      .then((r) => r.json())
      .then((j) => (events.current = j.events ?? []))
      .catch(() => {});
    return () => window.removeEventListener("stayshay:location", onLoc);
  }, []);

  useEffect(() => {
    if (path?.startsWith("/admin") || path?.startsWith("/login")) return;
    const next = () => {
      if (stopped.current || count.current >= MAX_PER_VISIT || document.hidden) return;
      // Never over the home page's search: wait until the visitor scrolls past the hero.
      if (path === "/" && window.scrollY < 520) return;
      // Third notification: offer location once, if we don't have it.
      if (count.current === 2 && !getSavedLocation() && navigator.geolocation && !shown.current.has("loc")) {
        shown.current.add("loc");
        count.current++;
        setToast({ type: "location" });
        return;
      }
      const here = getSavedLocation();
      const pool = events.current
        .filter((e) => !shown.current.has(e.id))
        .map((e) => ({ e, distance: here && e.lat != null && e.lng != null ? km(here, { lat: e.lat, lng: e.lng }) : null }))
        .sort((a, b) => (a.distance ?? 999) - (b.distance ?? 999) || Date.parse(b.e.at) - Date.parse(a.e.at));
      // Mix kinds: prefer one we haven't shown in a while.
      const pick = pool.find((p) => p.e.kind === (["listing", "roommate", "viewing"] as const)[count.current % 3]) ?? pool[0];
      if (!pick) return;
      shown.current.add(pick.e.id);
      count.current++;
      try {
        sessionStorage.setItem("stayshay:toasts-seen", JSON.stringify([...shown.current]));
      } catch {}
      setToast({ type: "event", ...pick });
    };
    const first = setTimeout(next, 7000);
    const every = setInterval(next, 26000);
    return () => {
      clearTimeout(first);
      clearInterval(every);
    };
  }, [path, loc]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 8000);
    return () => clearTimeout(t);
  }, [toast]);

  if (!toast) return null;
  const close = () => setToast(null);
  const stop = () => {
    stopped.current = true;
    try {
      sessionStorage.setItem("stayshay:toasts", "off");
    } catch {}
    close();
  };

  return (
    <div className="shay-pop fixed bottom-4 left-4 z-[55] w-[calc(100vw-120px)] max-w-[360px] md:bottom-6 md:left-6" role="status" aria-live="polite">
      {toast.type === "location" ? (
        <div className="flex items-start gap-3 rounded-[20px] bg-white p-3.5 shadow-[0_14px_40px_rgb(0_0_0/0.16)] ring-1 ring-line">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] bg-mint text-[20px]">📍</span>
          <div className="min-w-0 flex-1">
            <p className="text-[13.5px] font-bold text-ink">See what’s near you?</p>
            <p className="text-[12.5px] text-muted">Show places and roommates close to where you are. Stays on your device.</p>
            <div className="mt-2 flex gap-2">
              <button
                onClick={async () => {
                  close();
                  await askLocation();
                }}
                className="h-8 rounded-full bg-brand px-3.5 text-[12.5px] font-semibold text-white"
              >
                Use my location
              </button>
              <button onClick={close} className="h-8 px-2 text-[12.5px] text-muted">
                Not now
              </button>
            </div>
          </div>
        </div>
      ) : (
        <a href={toast.e.href} onClick={close} className="group flex items-center gap-3 rounded-[20px] bg-white p-2.5 pr-3 shadow-[0_14px_40px_rgb(0_0_0/0.16)] ring-1 ring-line">
          <span className="relative h-14 w-14 shrink-0 overflow-hidden rounded-[14px] bg-mint">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            {toast.e.photo && <img src={toast.e.photo} alt="" className="h-full w-full object-cover" />}
            <span className="absolute right-1 top-1 h-2.5 w-2.5 rounded-full bg-fresh ring-2 ring-white" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.08em] text-fresh">
              {LABEL[toast.e.kind]}
              <span className="font-medium normal-case tracking-normal text-muted">
                · {toast.distance != null && toast.distance < 25 ? `${toast.distance < 1 ? "<1" : Math.round(toast.distance)} km away` : ago(toast.e.at)}
              </span>
            </span>
            <span className="mt-0.5 line-clamp-2 block text-[13.5px] font-semibold leading-snug text-ink group-hover:text-brand">{toast.e.text}</span>
          </span>
          <span
            role="button"
            tabIndex={0}
            aria-label="Hide notifications"
            title="Hide notifications"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              stop();
            }}
            className="self-start rounded-full p-1 text-muted hover:text-ink"
          >
            <Icon name="close" size={13} />
          </span>
        </a>
      )}
    </div>
  );
}
