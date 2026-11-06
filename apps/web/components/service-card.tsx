import Image from "next/image";
import Link from "next/link";
import type { Service } from "@/lib/services";

/** Photo card with a floating white label and a lime arrow: the look for every service tile. */
export function ServiceCard({ s, tall = false }: { s: Service; tall?: boolean }) {
  return (
    <Link href={`/services/${s.slug}`} className={`group relative block overflow-hidden rounded-[26px] bg-brand-deep ${tall ? "aspect-[4/5]" : "aspect-[4/3.6]"}`}>
      <Image src={s.photo} alt={s.name} fill sizes="(max-width: 768px) 100vw, 33vw" className="object-cover transition-transform duration-500 group-hover:scale-[1.04]" />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,transparent_45%,rgb(9_29_21/0.55)_100%)]" aria-hidden />
      <div className="absolute inset-x-3 bottom-3 flex items-start justify-between gap-3 rounded-[18px] bg-white/95 p-4 backdrop-blur md:inset-x-4 md:bottom-4 md:p-5">
        <span className="min-w-0">
          <span className="font-display block text-[19px] leading-tight text-ink md:text-[22px]">{s.name}</span>
          <span className="mt-1 block text-[13px] text-ink-2">{s.hint}</span>
        </span>
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-lime text-[18px] text-brand-deep transition-transform group-hover:-rotate-12" aria-hidden>
          ↗
        </span>
      </div>
    </Link>
  );
}
