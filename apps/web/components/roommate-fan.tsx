"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { AREA_BY_SLUG } from "@stayshay/core/src/client.ts";
import type { PublicRoommate } from "@/lib/roommates";

/**
 * "Meet your roommates": real approved roommate profiles fanned out like a hand of cards (first name, age,
 * budget; never contact details). It turns on its own; tap, swipe or use the arrow keys. The button opens the swipe app.
 */
export function RoommateFan({ people }: { people: PublicRoommate[] }) {
  const n = people.length;
  const [active, setActive] = useState(Math.floor(n / 2));
  const [paused, setPaused] = useState(false);
  const touch = useRef<number | null>(null);

  useEffect(() => {
    if (paused || n < 2 || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const t = setInterval(() => setActive((a) => (a + 1) % n), 3200);
    return () => clearInterval(t);
  }, [paused, n]);

  const go = (d: number) => setActive((a) => (a + d + n) % n);
  const cur = people[active];

  return (
    <section className="px-2 py-2 md:px-4" aria-roledescription="carousel" aria-label="Meet your roommates">
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
          <h2 className="font-display text-[34px] text-white md:text-[52px]">Meet your roommates</h2>
          <p className="mx-auto mt-3 max-w-[420px] text-[15px] text-white/65 md:text-[16px]">Real people, checked by our team. Swipe right to like.</p>
        </div>

        {n === 0 ? (
          <div className="relative z-10 mx-auto mt-8 aspect-[4/3] max-w-[520px] overflow-hidden rounded-[28px]">
            <Image src="/photos/roommates.jpg" alt="" fill sizes="520px" className="object-cover" />
          </div>
        ) : (
          <div className="fan relative mx-auto mt-6 md:mt-2" aria-live="polite">
            {people.map((p, i) => {
              let d = i - active;
              if (d > n / 2) d -= n;
              if (d < -n / 2) d += n;
              const ad = Math.abs(d);
              const on = d === 0;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => (on ? undefined : setActive(i))}
                  aria-label={`${p.firstName}${p.age ? `, ${p.age}` : ""}, budget AED ${p.budget} a month`}
                  aria-current={on}
                  tabIndex={ad > 3 ? -1 : 0}
                  className={`fan-card ${on ? "is-on" : ""}`}
                  style={{
                    transform: `translateX(-50%) rotate(${d * 6.5}deg) translateY(${ad * 4}px) scale(${1 - Math.min(ad, 5) * 0.04})`,
                    zIndex: 20 - ad,
                    opacity: ad > 3 ? 0 : 1 - ad * 0.1,
                  }}
                >
                  {p.photo ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={p.photo} alt="" className="absolute inset-0 h-full w-full object-cover" loading={ad < 3 ? "eager" : "lazy"} />
                  ) : (
                    <span className={`absolute inset-0 flex items-center justify-center text-[90px] font-bold text-white/25 ${p.gender === "female" ? "bg-[radial-gradient(120%_90%_at_30%_20%,#7a4a63,#2a1a26)]" : "bg-[radial-gradient(120%_90%_at_30%_20%,#2f6b57,#0f2a20)]"}`}>{p.firstName[0]}</span>
                  )}
                  <span className="fan-shade" />
                  {on && <span className="fan-glow" />}
                  <span className="fan-price text-left">
                    <span className="block text-[24px] font-semibold leading-none tracking-[-0.02em] md:text-[34px]">
                      {p.firstName}
                      {p.age ? `, ${p.age}` : ""}
                    </span>
                    <span className="mt-1.5 block text-[11px] font-semibold uppercase tracking-[0.12em] opacity-80">AED {p.budget.toLocaleString("en-US")} / month</span>
                  </span>
                </button>
              );
            })}
          </div>
        )}

        <div className="relative z-10 mx-auto mt-10 max-w-[620px] text-center md:mt-14">
          {cur && (
            <p className="truncate text-[15px] font-semibold text-white">
              {cur.mode === "has_place" ? "Has a place" : "Looking to share"} · {cur.areaSlugs.length ? cur.areaSlugs.slice(0, 2).map((s) => AREA_BY_SLUG.get(s)?.name ?? s).join(", ") : "Any area"}
            </p>
          )}
          <Link href="/roommates" className="fan-cta mt-5 flex h-14 w-full items-center justify-center rounded-[16px] text-[16px] font-semibold text-[#0d241a]">
            Swipe roommates
          </Link>
          {n > 1 && (
            <div className="mt-4 flex items-center justify-center gap-1.5" aria-hidden>
              {people.map((p, i) => (
                <span key={p.id} className={`h-1.5 rounded-full transition-all ${i === active ? "w-6 bg-[#c8f7a0]" : "w-1.5 bg-white/25"}`} />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
