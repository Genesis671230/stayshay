"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

export type GalleryImage = { src: string; caption: string; w: number; h: number };
export type Pattern = "justified" | "cascade" | "filmstrip" | "editorial";

const OPEN = "work:open";

/** Any element on the page can open the viewer at a given photo. */
export function ViewerTrigger({ index, children, className = "" }: { index: number; children: React.ReactNode; className?: string }) {
  return (
    <button type="button" onClick={() => window.dispatchEvent(new CustomEvent(OPEN, { detail: index }))} className={`group block w-full cursor-zoom-in text-left ${className}`} aria-label="Open photo full screen">
      {children}
    </button>
  );
}

/** Groups photos into rows of 2–3 that keep every photo's full frame (no cropping). */
function rows(images: GalleryImage[]): GalleryImage[][] {
  const out: GalleryImage[][] = [];
  let i = 0;
  const sizes = [1, 2, 3, 2];
  let k = 0;
  while (i < images.length) {
    const n = Math.min(sizes[k++ % sizes.length], images.length - i);
    out.push(images.slice(i, i + n));
    i += n;
  }
  return out;
}

function Tile({ im, index, sizes, rounded = "rounded-[22px]" }: { im: GalleryImage; index: number; sizes: string; rounded?: string }) {
  return (
    <ViewerTrigger index={index}>
      <figure className={`relative overflow-hidden bg-surface ${rounded}`}>
        <Image src={im.src} alt={im.caption} width={im.w} height={im.h} sizes={sizes} className="h-auto w-full transition-transform duration-700 group-hover:scale-[1.025]" />
        <span className="pointer-events-none absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-white/85 text-ink opacity-0 backdrop-blur transition-opacity group-hover:opacity-100">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
            <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" />
          </svg>
        </span>
      </figure>
    </ViewerTrigger>
  );
}

export function ProjectGallery({ images, pattern, name }: { images: GalleryImage[]; pattern: Pattern; name: string }) {
  const [open, setOpen] = useState<number | null>(null);
  const strip = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const on = (e: Event) => setOpen((e as CustomEvent<number>).detail);
    window.addEventListener(OPEN, on);
    return () => window.removeEventListener(OPEN, on);
  }, []);

  return (
    <>
      {pattern === "justified" && (
        <div className="space-y-3 md:space-y-4">
          {rows(images).map((row, r) => {
            const start = images.indexOf(row[0]);
            return (
              <div key={r} className="flex flex-col gap-3 sm:flex-row md:gap-4">
                {row.map((im, j) => (
                  <div key={im.src} className="min-w-0" style={{ flex: `${im.w / im.h} 1 0%` }}>
                    <Tile im={im} index={start + j} sizes={row.length === 1 ? "100vw" : `(max-width: 640px) 100vw, ${Math.round(100 / row.length)}vw`} />
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      )}

      {pattern === "cascade" && (
        <div className="columns-1 gap-4 sm:columns-2 lg:columns-3 [&>*]:mb-4">
          {images.map((im, i) => (
            <div key={im.src} className="break-inside-avoid">
              <Tile im={im} index={i} sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw" />
              <p className="mt-2 px-1 text-[12.5px] font-semibold uppercase tracking-[0.1em] text-muted">
                {String(i + 1).padStart(2, "0")} · {im.caption}
              </p>
            </div>
          ))}
        </div>
      )}

      {pattern === "filmstrip" && (
        <div className="relative">
          <div ref={strip} className="-mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-4 md:-mx-8 md:px-8 [scrollbar-width:thin]">
            {images.map((im, i) => (
              <div key={im.src} className="shrink-0 snap-center" style={{ width: `min(88vw, calc(70vh * ${(im.w / im.h).toFixed(3)}))` }}>
                <Tile im={im} index={i} sizes="88vw" rounded="rounded-[26px]" />
                <p className="mt-2 text-[13px] text-ink-2">
                  <b className="text-ink">{String(i + 1).padStart(2, "0")}</b> {im.caption}
                </p>
              </div>
            ))}
          </div>
          <div className="mt-2 flex justify-end gap-2">
            {[-1, 1].map((d) => (
              <button key={d} onClick={() => strip.current?.scrollBy({ left: d * strip.current.clientWidth * 0.8, behavior: "smooth" })} aria-label={d < 0 ? "Previous photos" : "Next photos"} className="flex h-11 w-11 items-center justify-center rounded-full border border-line-strong bg-white hover:border-ink">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
                  <path d={d < 0 ? "m15 5-7 7 7 7" : "m9 5 7 7-7 7"} />
                </svg>
              </button>
            ))}
          </div>
        </div>
      )}

      {pattern === "editorial" && (
        <div className="space-y-10 md:space-y-16">
          {images.map((im, i) => (
            <figure key={im.src} className={`grid grid-cols-1 items-end gap-4 md:grid-cols-12 ${i % 3 === 0 ? "" : i % 3 === 1 ? "md:[&>*:first-child]:col-start-2" : ""}`}>
              <div className={i % 3 === 0 ? "md:col-span-12" : i % 3 === 1 ? "md:col-span-8" : "md:col-span-7 md:col-start-6"}>
                <Tile im={im} index={i} sizes={i % 3 === 0 ? "100vw" : "70vw"} rounded="rounded-[28px]" />
              </div>
              <figcaption className={`text-[13px] text-ink-2 ${i % 3 === 0 ? "md:col-span-12" : i % 3 === 1 ? "md:col-span-3" : "md:col-span-4 md:col-start-2 md:row-start-1 md:text-right"}`}>
                <span className="font-display block text-[34px] leading-none text-brand">{String(i + 1).padStart(2, "0")}</span>
                {im.caption}
              </figcaption>
            </figure>
          ))}
        </div>
      )}

      {open !== null && createPortal(<Lightbox images={images} index={open} name={name} onClose={() => setOpen(null)} onIndex={setOpen} />, document.body)}
    </>
  );
}

function Lightbox({ images, index, name, onClose, onIndex }: { images: GalleryImage[]; index: number; name: string; onClose: () => void; onIndex: (i: number) => void }) {
  const go = useCallback((d: number) => onIndex((index + d + images.length) % images.length), [index, images.length, onIndex]);
  const touch = useRef<number | null>(null);
  const thumbs = useRef<HTMLDivElement>(null);
  const im = images[index];

  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") go(1);
      if (e.key === "ArrowLeft") go(-1);
    };
    window.addEventListener("keydown", key);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", key);
      document.body.style.overflow = prev;
    };
  }, [go, onClose]);

  useEffect(() => {
    thumbs.current?.querySelector<HTMLElement>(`[data-i="${index}"]`)?.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
  }, [index]);

  return (
    <div
      className="fixed inset-0 z-[200] flex flex-col bg-[#0b0d0c] text-white"
      role="dialog"
      aria-modal="true"
      aria-label={`${name} photos`}
      onTouchStart={(e) => (touch.current = e.touches[0].clientX)}
      onTouchEnd={(e) => {
        if (touch.current === null) return;
        const dx = e.changedTouches[0].clientX - touch.current;
        if (Math.abs(dx) > 50) go(dx < 0 ? 1 : -1);
        touch.current = null;
      }}
    >
      <div className="flex items-center justify-between gap-4 px-4 py-3 md:px-6">
        <p className="min-w-0 truncate text-[14px]">
          <b>{name}</b> <span className="text-white/60">· {im.caption}</span>
        </p>
        <div className="flex shrink-0 items-center gap-3">
          <span className="font-figure text-[13px] text-white/70">
            {index + 1} / {images.length}
          </span>
          <button onClick={onClose} aria-label="Close" className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 hover:bg-white/20">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
              <path d="M6 6l12 12M18 6 6 18" />
            </svg>
          </button>
        </div>
      </div>

      <div className="relative min-h-0 flex-1">
        <Image key={im.src} src={im.src} alt={im.caption} fill sizes="100vw" priority className="animate-[fadeIn_.25s_ease] object-contain" />
        {[-1, 1].map((d) => (
          <button
            key={d}
            onClick={() => go(d)}
            aria-label={d < 0 ? "Previous photo" : "Next photo"}
            className={`absolute top-1/2 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/12 backdrop-blur transition hover:bg-white/25 md:h-14 md:w-14 ${d < 0 ? "left-3 md:left-6" : "right-3 md:right-6"}`}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
              <path d={d < 0 ? "m15 5-7 7 7 7" : "m9 5 7 7-7 7"} />
            </svg>
          </button>
        ))}
      </div>

      <div ref={thumbs} className="flex gap-2 overflow-x-auto px-4 py-3 md:justify-center md:px-6">
        {images.map((t, i) => (
          <button key={t.src} data-i={i} onClick={() => onIndex(i)} aria-label={`Photo ${i + 1}`} className={`relative h-14 w-20 shrink-0 overflow-hidden rounded-[10px] transition ${i === index ? "ring-2 ring-lime" : "opacity-50 hover:opacity-90"}`}>
            <Image src={t.src} alt="" fill sizes="80px" className="object-cover" />
          </button>
        ))}
      </div>
    </div>
  );
}
