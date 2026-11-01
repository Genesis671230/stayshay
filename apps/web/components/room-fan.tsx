"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { AREA_BY_SLUG, TYPE_LABEL, rankDeals } from "@stayshay/core/src/client.ts";
import { useMarketplace } from "./marketplace";

const N = 11;

/**
 * "Choose a room": real listings fanned out like a hand of cards. The centre card glows with its price;
 * it turns on its own, and people can tap, swipe or use the arrow keys.
 */
export function RoomFan() {
  const { all } = useMarketplace();
  const rooms = useMemo(() => {
    const ranked = rankDeals(all.filter((l) => l.photos.length > 0 && l.type !== "roommate"), 60);
    const seen = new Set<string>();
    // One per area first so the fan shows the spread of the city, then fill up.
    const pick = ranked.filter((d) => !seen.has(d.listing.areaSlug) && seen.add(d.listing.areaSlug)).slice(0, N);
    for (const d of ranked) if (pick.length < N && !pick.includes(d)) pick.push(d);
    return pick.map((d) => d.listing);
  }, [all]);

  const [active, setActive] = useState(Math.floor(Math.min(N, rooms.length) / 2));
  const [paused, setPaused] = useState(false);
  const touch = useRef<number | null>(null);
  const n = rooms.length;

  useEffect(() => {
    if (paused || n < 2 || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const t = setInterval(() => setActive((a) => (a + 1) % n), 3200);
    return () => clearInterval(t);
  }, [paused, n]);

  if (n < 3) return null;
  const cur = rooms[active];
  const area = AREA_BY_SLUG.get(cur.areaSlug)?.name ?? cur.areaName ?? "";
  const go = (d: number) => setActive((a) => (a + d + n) % n);

  return (
    <section className="px-2 py-2 md:px-4" aria-roledescription="carousel" aria-label="Choose a room">
      <div
        className="fan-stage relative overflow-hidden rounded-[32px] px-4 pb-8 pt-12 md:pb-12 md:pt-16"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        onTouchStart={(e) => {
          touch.current = e.touches[0].clientX;
          setPaused(true);
        }}
        onTouchEnd={(e) => {
          const dx = e.changedTouches[0].clientX - (touch.current ?? e.changedTouches[0].clientX);
          if (Math.abs(dx) > 30) go(dx < 0 ? 1 : -1);
          touch.current = null;
        }}
        onKeyDown={(e) => {
          if (e.key === "ArrowRight") go(1);
          if (e.key === "ArrowLeft") go(-1);
        }}
        tabIndex={0}
      >
        <div className="relative z-10 mx-auto max-w-[680px] text-center">
          <p className="text-[12px] font-bold uppercase tracking-[0.16em] text-[#8fe3bd]">Best value right now</p>
          <h2 className="font-display mt-3 text-[32px] leading-[1.02] text-white md:text-[52px]">Choose a room</h2>
          <p className="mx-auto mt-3 max-w-[460px] text-[14.5px] leading-relaxed text-white/65 md:text-[16px]">Real places, real prices. Swipe through and pick one.</p>
        </div>

        <div className="fan relative mx-auto mt-6 md:mt-2" aria-live="polite">
          {rooms.map((l, i) => {
            let d = i - active;
            if (d > n / 2) d -= n;
            if (d < -n / 2) d += n;
            const ad = Math.abs(d);
            const on = d === 0;
            return (
              <button
                key={l.id}
                type="button"
                onClick={() => (on ? undefined : setActive(i))}
                aria-label={`${TYPE_LABEL[l.type]} in ${AREA_BY_SLUG.get(l.areaSlug)?.name ?? l.areaName ?? ""}, AED ${l.priceAed} a month`}
                aria-current={on}
                tabIndex={ad > 3 ? -1 : 0}
                className={`fan-card ${on ? "is-on" : ""}`}
                style={{
                  transform: `translateX(-50%) rotate(${d * 6.5}deg) translateY(${ad * 4}px) scale(${1 - Math.min(ad, 5) * 0.04})`,
                  zIndex: 20 - ad,
                  opacity: ad > 3 ? 0 : 1 - ad * 0.1,
                }}
              >
                <Image src={l.photos[0]} alt="" fill sizes="(min-width:768px) 240px, 160px" className="object-cover" loading={ad < 3 ? "eager" : "lazy"} />
                <span className="fan-shade" />
                {on && <span className="fan-glow" />}
                <span className="fan-price">
                  <span className="font-figure block text-[34px] font-semibold leading-none tracking-[-0.03em] md:text-[54px]">{l.priceAed.toLocaleString("en-US")}</span>
                  <span className="mt-1 block text-[11px] font-semibold uppercase tracking-[0.12em] opacity-80">AED / month</span>
                </span>
              </button>
            );
          })}
        </div>

        <div className="relative z-10 mx-auto mt-10 max-w-[620px] text-center md:mt-14">
          <p className="truncate text-[15px] font-semibold text-white">
            {TYPE_LABEL[cur.type]} · {area}
          </p>
          <p className="mt-1 truncate text-[13px] text-white/55">{cur.title}</p>
          <Link href={`/listing/${cur.id.toLowerCase()}`} className="fan-cta mt-5 flex h-14 w-full items-center justify-center rounded-[16px] text-[16px] font-semibold text-[#0d241a]">
            Choose a room
          </Link>
          <div className="mt-4 flex items-center justify-center gap-1.5" aria-hidden>
            {rooms.map((l, i) => (
              <span key={l.id} className={`h-1.5 rounded-full transition-all ${i === active ? "w-6 bg-[#c8f7a0]" : "w-1.5 bg-white/25"}`} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
