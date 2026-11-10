import Image from "next/image";
import Link from "next/link";

const CARDS: [string, string, string][] = [
  ["2BHK for families", "/family/2bhk-apartment-dubai", "/photos/living.jpg"],
  ["3BHK & villas", "/family/3bhk-apartment-dubai", "/work/villa-velora/facade.jpg"],
  ["1BHK for couples", "/family/1bhk-apartment-dubai", "/photos/couples.jpg"],
  ["Family sharing", "/family/family-sharing-apartment-dubai", "/photos/room.jpg"],
  ["Near the metro", "/family/family-apartment-near-metro-dubai", "/photos/metro.jpg"],
  ["Moving to Dubai", "/move", "/photos/areas/downtown-dubai.jpg"],
];

/** Families and people relocating: big photos, one line each, straight to the concierge pages. */
export function FamilyStrip() {
  return (
    <section className="mx-auto max-w-[1240px] px-4 py-14 md:px-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Families & relocation</p>
          <h2 className="font-display mt-2 text-[32px] text-ink md:text-[44px]">Homes for families</h2>
        </div>
        <Link href="/family#request" className="inline-flex h-12 items-center rounded-full bg-brand px-6 text-[15px] font-semibold text-white hover:bg-brand-deep">
          We find it for you
        </Link>
      </div>
      <div className="roomie-scroll -mx-4 mt-7 flex gap-3 overflow-x-auto px-4 md:mx-0 md:grid md:grid-cols-3 md:gap-4 md:overflow-visible md:px-0">
        {CARDS.map(([t, href, photo]) => (
          <Link
            key={href}
            href={href}
            className={`group relative w-[72%] shrink-0 overflow-hidden rounded-[26px] bg-surface sm:w-[45%] md:w-auto aspect-[4/5] md:aspect-[4/3]`}
          >
            <Image src={photo} alt="" fill sizes="(min-width: 768px) 33vw, 72vw" className="object-cover transition duration-500 group-hover:scale-[1.04]" />
            <span className="absolute inset-0 bg-[linear-gradient(180deg,rgb(0_0_0/0)_50%,rgb(0_0_0/0.65)_100%)]" />
            <span className="absolute inset-x-5 bottom-5 text-[20px] font-semibold leading-tight text-white md:text-[22px]">{t}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}
