import Link from "next/link";
import { SERVICES } from "@/lib/services";
import { ServiceCard } from "./service-card";

const FEATURED = ["interior-design", "ac-maintenance", "deep-cleaning", "painting", "renovation", "movers"];

/** Homepage band: maintenance and interiors, photo-led. */
export function ServicesShowcase() {
  const items = FEATURED.map((s) => SERVICES.find((x) => x.slug === s)!).filter(Boolean);
  return (
    <section className="mx-auto max-w-[1240px] px-4 py-14 md:px-8 md:py-20">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Maintenance & interiors</p>
          <h2 className="font-display mt-2 max-w-[640px] text-[34px] leading-[1.05] md:text-[52px]">Home services</h2>
          <p className="mt-3 max-w-[560px] text-[15.5px] text-ink-2">AC, plumbing, deep cleaning, painting, movers, interior design and fit-out. Tap a job, send a photo, get a quote.</p>
        </div>
        <Link href="/services" className="inline-flex h-11 items-center gap-2 rounded-full border border-ink px-5 text-[14.5px] font-semibold hover:bg-ink hover:text-white">
          All services <span aria-hidden>→</span>
        </Link>
      </div>
      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((s) => (
          <ServiceCard key={s.slug} s={s} />
        ))}
      </div>
    </section>
  );
}
