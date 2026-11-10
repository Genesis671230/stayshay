"use client";

import Image from "next/image";
import Link from "next/link";
import { useRef, useState } from "react";

export type WorkCard = { slug: string; name: string; category: string; location: string; year: string; tagline: string; cover: string; photos: number };
export type WorkVideo = { id: string; title: string; place: string; src: string; seconds: number; poster: string };

/** Card sizes repeat in a 6-step rhythm so the grid never looks like a spreadsheet. */
const RHYTHM = ["md:col-span-4 md:row-span-2", "md:col-span-2", "md:col-span-2", "md:col-span-3", "md:col-span-3", "md:col-span-2 md:row-span-2", "md:col-span-4", "md:col-span-2", "md:col-span-2", "md:col-span-2"];

export function WorkBrowser({ cards, filters }: { cards: WorkCard[]; filters: { key: string; label: string; match: string[] }[] }) {
  const [f, setF] = useState("all");
  const active = filters.find((x) => x.key === f)!;
  const shown = cards.filter((c) => !active.match.length || active.match.includes(c.category));
  return (
    <div>
      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 md:mx-0 md:flex-wrap md:px-0">
        {filters.map((x) => {
          const n = cards.filter((c) => !x.match.length || x.match.includes(c.category)).length;
          return (
            <button key={x.key} onClick={() => setF(x.key)} className={`flex h-11 shrink-0 items-center gap-2 rounded-full px-5 text-[14.5px] font-semibold transition ${f === x.key ? "bg-ink text-white shadow-[0_10px_24px_rgb(0_0_0/0.18)]" : "border border-line bg-white text-ink-2 hover:border-ink hover:text-ink"}`}>
              {x.label}
              <span className={`rounded-full px-2 py-0.5 text-[11.5px] ${f === x.key ? "bg-white/20" : "bg-surface"}`}>{n}</span>
            </button>
          );
        })}
      </div>
      <div className="mt-8 grid auto-rows-[300px] grid-cols-1 gap-4 md:auto-rows-[260px] md:grid-cols-6">
        {shown.map((c, i) => (
          <Link key={c.slug} href={`/work/${c.slug}`} className={`group relative overflow-hidden rounded-[26px] bg-ink ${RHYTHM[i % RHYTHM.length]}`}>
            <Image src={c.cover} alt={`${c.name}, ${c.location}`} fill sizes="(max-width: 768px) 100vw, 66vw" className="object-cover transition-transform duration-[900ms] group-hover:scale-[1.05]" />
            <div className="absolute inset-0 bg-[linear-gradient(180deg,rgb(0_0_0/0)_40%,rgb(0_0_0/0.75)_100%)]" />
            <span className="absolute left-4 top-4 rounded-full bg-white/90 px-3 py-1 text-[11.5px] font-bold uppercase tracking-[0.1em] text-ink backdrop-blur">{c.category}</span>
            <span className="absolute right-4 top-4 rounded-full bg-black/35 px-2.5 py-1 text-[11.5px] font-semibold text-white backdrop-blur">{c.photos} photos</span>
            <div className="absolute inset-x-0 bottom-0 p-5">
              <p className="text-[12px] font-semibold uppercase tracking-[0.12em] text-white/70">
                {c.location} · {c.year}
              </p>
              <p className="font-display mt-1 text-[26px] leading-[1.02] text-white md:text-[30px]">{c.name}</p>
              <p className="mt-1 line-clamp-1 max-h-0 text-[14px] text-white/85 opacity-0 transition-all duration-500 group-hover:max-h-10 group-hover:opacity-100">{c.tagline}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

/** Our own player: trimmed MP4s hosted on stayshay.com, nothing loads until someone presses play. */
export function WorkVideos({ videos }: { videos: WorkVideo[] }) {
  const [playing, setPlaying] = useState<string | null>(null);
  const refs = useRef<Record<string, HTMLVideoElement | null>>({});
  const play = (id: string) => {
    for (const [k, el] of Object.entries(refs.current)) if (k !== id) el?.pause();
    setPlaying(id);
    requestAnimationFrame(() => refs.current[id]?.play().catch(() => {}));
  };
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.4fr_1fr]">
      {videos.map((v, i) => (
        <div key={v.id} className={`relative overflow-hidden rounded-[26px] bg-ink ${i === 0 ? "aspect-video lg:row-span-2 lg:aspect-auto" : "aspect-video"}`}>
          <video
            ref={(el) => {
              refs.current[v.id] = el;
            }}
            src={playing === v.id ? v.src : undefined}
            poster={v.poster}
            controls={playing === v.id}
            playsInline
            preload="none"
            controlsList="nodownload noremoteplayback"
            disablePictureInPicture={false}
            onEnded={() => setPlaying(null)}
            className="absolute inset-0 h-full w-full bg-black object-cover"
          />
          {playing !== v.id && (
            <button onClick={() => play(v.id)} className="group absolute inset-0 text-left" aria-label={`Play: ${v.title}`}>
              <Image src={v.poster} alt="" fill sizes="(max-width: 1024px) 100vw, 60vw" className="object-cover opacity-85 transition duration-700 group-hover:scale-[1.03] group-hover:opacity-95" />
              <span className="absolute inset-0 bg-[linear-gradient(180deg,rgb(0_0_0/0.1),rgb(0_0_0/0.7))]" />
              <span className="absolute left-1/2 top-1/2 flex h-20 w-20 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 shadow-2xl transition group-hover:scale-110 group-hover:bg-lime">
                <svg width="26" height="26" viewBox="0 0 24 24" fill="#0b2a1f" aria-hidden>
                  <path d="M8 5v14l11-7z" />
                </svg>
              </span>
              <span className="absolute inset-x-0 bottom-0 p-5 text-white">
                <span className="block text-[12px] font-semibold uppercase tracking-[0.12em] text-lime">
                  Video tour · {Math.floor(v.seconds / 60)}:{String(v.seconds % 60).padStart(2, "0")}
                </span>
                <span className="font-display mt-1 block text-[24px] leading-tight md:text-[30px]">{v.title}</span>
                <span className="block text-[13.5px] text-white/75">{v.place}</span>
              </span>
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
