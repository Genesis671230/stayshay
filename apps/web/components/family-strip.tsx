import Link from "next/link";

const CARDS: [string, string, string][] = [
  ["2BHK for families", "Two bedrooms near schools and the metro", "/family/2bhk-apartment-dubai"],
  ["3BHK & villas", "Space for bigger families", "/family/3bhk-apartment-dubai"],
  ["1BHK for couples", "A door between bedroom and living room", "/family/1bhk-apartment-dubai"],
  ["Family sharing", "A private family room, shared kitchen", "/family/family-sharing-apartment-dubai"],
  ["Near the metro", "Family flats a short walk from a station", "/family/family-apartment-near-metro-dubai"],
  ["Moving to Dubai", "From the UK, Europe, US, India, Abu Dhabi…", "/move"],
];

/** Homepage band for families and people relocating: routes them to the concierge pages instead of shared-housing search. */
export function FamilyStrip() {
  return (
    <section className="mx-auto max-w-[1240px] px-4 py-10 md:px-8">
      <div className="rounded-[26px] bg-mint p-6 md:p-9">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-[12px] font-bold uppercase tracking-[0.12em] text-fresh">Families & relocation</p>
            <h2 className="font-display mt-2 text-[28px] leading-tight text-ink md:text-[36px]">Need a 1BHK, 2BHK or 3BHK? We find it for you.</h2>
            <p className="mt-2 max-w-[640px] text-[15px] text-ink-2">Send your family&apos;s brief once. Our team WhatsApps you real options with prices and viewing times. Free for families.</p>
          </div>
          <Link href="/family#request" className="inline-flex h-12 items-center rounded-[12px] bg-brand px-6 text-[15px] font-semibold text-white hover:bg-brand-deep">
            Send my brief
          </Link>
        </div>
        <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {CARDS.map(([t, d, href]) => (
            <Link key={href} href={href} className="rounded-[16px] bg-white p-4 transition hover:shadow-[0_6px_24px_rgb(0_0_0/0.07)]">
              <span className="block text-[16px] font-semibold text-ink">{t}</span>
              <span className="mt-1 block text-[13.5px] text-ink-2">{d}</span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
