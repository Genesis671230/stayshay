"use client";

import { WaButton } from "./wa-button";
import { Icon } from "./ui";

export const ASKS: { label: string; text: string; kind?: string }[] = [
  { label: "Bed space", text: "Hi Stayshay, I'm looking for a bed space. Area: … Budget: … Move-in: …" },
  { label: "Partition", text: "Hi Stayshay, I'm looking for a partition. Area: … Budget: … Move-in: …" },
  { label: "Private room", text: "Hi Stayshay, I'm looking for a private room. Area: … Budget: … Move-in: …" },
  { label: "Studio", text: "Hi Stayshay, I'm looking for a studio. Area: … Budget: … Move-in: …" },
  { label: "1BHK", text: "Hi Stayshay, I'm looking for a 1BHK apartment. Area: … Budget: … Move-in: …", kind: "family" },
  { label: "2BHK", text: "Hi Stayshay, I'm looking for a 2BHK apartment for my family. Area: … Budget: … Move-in: …", kind: "family" },
  { label: "3BHK", text: "Hi Stayshay, I'm looking for a 3BHK apartment for my family. Area: … Budget: … Move-in: …", kind: "family" },
  { label: "Family sharing", text: "Hi Stayshay, I'm looking for a family sharing room. Area: … Budget: … Move-in: …", kind: "family" },
];

/** Tap what you need, WhatsApp opens with it typed out. The fastest way in, on every landing page. */
export function QuickAsk({ tone = "dark", title = "Or just tap and WhatsApp us", only }: { tone?: "dark" | "light"; title?: string; only?: string[] }) {
  const items = only ? ASKS.filter((a) => only.includes(a.label)) : ASKS;
  const chip =
    tone === "dark"
      ? "border-white/25 bg-white/10 text-white hover:border-[#25d366] hover:bg-[#25d366]"
      : "border-line bg-white text-ink hover:border-[#25d366] hover:bg-[#25d366] hover:text-white";
  return (
    <div>
      <p className={`flex items-center gap-1.5 text-[13px] font-semibold ${tone === "dark" ? "text-white/85" : "text-ink-2"}`}>
        <Icon name="whatsapp" size={15} /> {title}
      </p>
      <div className="mt-2 flex flex-wrap gap-2">
        {items.map((a) => (
          <WaButton key={a.label} text={a.text} kind={a.kind ?? "ask"} label={a.label} className={`inline-flex h-9 items-center rounded-full border px-3.5 text-[13.5px] font-semibold transition-colors ${chip}`}>
            {a.label}
          </WaButton>
        ))}
      </div>
    </div>
  );
}
