"use client";

import Image from "next/image";
import { WaButton } from "./wa-button";

export const ASKS: { label: string; text: string; kind?: string; photo: string; note: string }[] = [
  { label: "Bed space", note: "Shared room", photo: "/photos/bed-space.jpg", text: "Hi Stayshay, I'm looking for a bed space. Area: … Budget: … Move-in: …" },
  { label: "Partition", note: "Your own space", photo: "/photos/partition.jpg", text: "Hi Stayshay, I'm looking for a partition. Area: … Budget: … Move-in: …" },
  { label: "Private room", note: "Your own door", photo: "/photos/room.jpg", text: "Hi Stayshay, I'm looking for a private room. Area: … Budget: … Move-in: …" },
  { label: "Studio", note: "All yours", photo: "/photos/studio.jpg", text: "Hi Stayshay, I'm looking for a studio. Area: … Budget: … Move-in: …" },
  { label: "1BHK", note: "One bedroom", photo: "/photos/living.jpg", text: "Hi Stayshay, I'm looking for a 1BHK apartment. Area: … Budget: … Move-in: …", kind: "family" },
  { label: "2BHK", note: "For families", photo: "/photos/executive.jpg", text: "Hi Stayshay, I'm looking for a 2BHK apartment for my family. Area: … Budget: … Move-in: …", kind: "family" },
  { label: "3BHK", note: "Room for all", photo: "/photos/couples.jpg", text: "Hi Stayshay, I'm looking for a 3BHK apartment for my family. Area: … Budget: … Move-in: …", kind: "family" },
  { label: "Family sharing", note: "Shared flat", photo: "/photos/ladies.jpg", text: "Hi Stayshay, I'm looking for a family sharing room. Area: … Budget: … Move-in: …", kind: "family" },
];

/**
 * Tap what you need, WhatsApp opens with it typed out. Photo tiles, not chips: each one shows the kind of
 * place it asks for. A plain horizontal row on phones (no snapping), a tidy grid on desktop.
 */
export function QuickAsk({ tone = "dark", title = "Tell us what you need", only }: { tone?: "dark" | "light"; title?: string; only?: string[] }) {
  const items = only ? ASKS.filter((a) => only.includes(a.label)) : ASKS;
  const dark = tone === "dark";
  const tile = dark ? "bg-white/[0.07] ring-white/12 hover:bg-white/[0.13] hover:ring-white/30" : "bg-white ring-line hover:ring-ink/40 hover:shadow-[0_8px_24px_rgb(9_44_34/0.08)]";
  return (
    <div>
      <div className="flex items-baseline justify-between gap-3">
        <p className={`text-[13px] font-semibold ${dark ? "text-white" : "text-ink"}`}>{title}</p>
        <p className={`hidden text-[12px] sm:block ${dark ? "text-white/55" : "text-muted"}`}>Opens WhatsApp, typed for you</p>
      </div>
      <div className={`roomie-scroll -mx-5 mt-3 flex gap-2 overflow-x-auto px-5 pb-1 md:mx-0 md:grid md:overflow-visible md:px-0 md:pb-0 ${items.length > 5 ? "md:grid-cols-4" : "md:grid-cols-5"}`}>
        {items.map((a) => (
          <WaButton key={a.label} text={a.text} kind={a.kind ?? "ask"} label={a.label} className={`group flex w-[168px] shrink-0 items-center gap-3 rounded-[16px] p-1.5 pr-3 ring-1 transition-[background-color,box-shadow] md:w-auto ${tile}`}>
            <span className="relative h-11 w-11 shrink-0 overflow-hidden rounded-[12px]">
              <Image src={a.photo} alt="" fill sizes="44px" className="object-cover" />
            </span>
            <span className="min-w-0">
              <span className={`block truncate text-[14px] font-semibold leading-tight ${dark ? "text-white" : "text-ink"}`}>{a.label}</span>
              <span className={`block truncate text-[12px] leading-tight ${dark ? "text-white/55" : "text-muted"}`}>{a.note}</span>
            </span>
          </WaButton>
        ))}
      </div>
    </div>
  );
}
