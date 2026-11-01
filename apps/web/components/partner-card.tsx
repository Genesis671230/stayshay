import Link from "next/link";
import type { PublicPartner } from "@/lib/referrals";

/** Partner (broker/agent) card: photo or monogram, name, areas. No contact details, ever. */
export function PartnerCard({ p }: { p: PublicPartner }) {
  return (
    <Link href={`/partners/${p.code.toLowerCase()}`} className="group block rounded-[22px] border border-line bg-white p-5 transition-shadow hover:shadow-[0_18px_40px_rgb(20_92_70/0.12)]">
      <div className="flex items-center gap-4">
        {p.photo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={p.photo} alt="" className="h-14 w-14 rounded-full object-cover" loading="lazy" />
        ) : (
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-brand text-[20px] font-bold text-[#8fe3bd]">{p.name[0]}</span>
        )}
        <span className="min-w-0">
          <span className="block truncate text-[16px] font-bold group-hover:text-brand">{p.name}</span>
          <span className="block truncate text-[13px] text-muted">{[p.company, p.brn && `BRN ${p.brn}`].filter(Boolean).join(" · ") || "Stayshay partner"}</span>
        </span>
      </div>
      <p className="mt-3 line-clamp-2 text-[14px] leading-relaxed text-ink-2">{p.bio}</p>
      {p.areas.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {p.areas.slice(0, 4).map((a) => (
            <span key={a} className="rounded-full bg-mint px-2.5 py-1 text-[12px] font-medium text-brand">
              {a}
            </span>
          ))}
        </div>
      )}
    </Link>
  );
}
