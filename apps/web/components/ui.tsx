import type { SVGProps } from "react";
import { Shay } from "./shay";

export const aed = (n: number) => `AED ${n.toLocaleString("en-US")}`;

export function shortDate(iso: string): string {
  const d = new Date(`${iso}T00:00:00`);
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

/** "Available now" if the date has passed, otherwise "From 1 Nov". */
export function availability(iso: string, today = new Date().toISOString().slice(0, 10)): string {
  return iso <= today ? "Available now" : `From ${shortDate(iso)}`;
}

type IconName =
  | "search"
  | "pin"
  | "calendar"
  | "wallet"
  | "check"
  | "shield"
  | "heart"
  | "close"
  | "chevron-left"
  | "chevron-right"
  | "chevron-down"
  | "map"
  | "grid"
  | "sliders"
  | "train"
  | "star"
  | "flag"
  | "menu"
  | "users"
  | "key"
  | "whatsapp"
  | "bed"
  | "arrow-right";

const PATHS: Record<Exclude<IconName, "whatsapp">, string> = {
  search: "M11 19a8 8 0 1 1 0-16 8 8 0 0 1 0 16Zm10 2-4.35-4.35",
  pin: "M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21Zm0-9a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z",
  calendar: "M7 3v3m10-3v3M4 9h16M5 5h14a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1Z",
  wallet: "M3 7a2 2 0 0 1 2-2h13v4M3 7v11a2 2 0 0 0 2 2h15V9H5a2 2 0 0 1-2-2Zm14 7h.01",
  check: "m5 12.5 4.5 4.5L19 7.5",
  shield: "M12 3 4.5 6v5.5c0 4.6 3.2 8.4 7.5 9.5 4.3-1.1 7.5-4.9 7.5-9.5V6L12 3Zm-3.2 9.2 2.3 2.3 4.3-4.6",
  heart: "M12 20s-7.5-4.6-7.5-10A4.3 4.3 0 0 1 12 7.3 4.3 4.3 0 0 1 19.5 10c0 5.4-7.5 10-7.5 10Z",
  close: "M6 6l12 12M18 6 6 18",
  "chevron-left": "m15 5-7 7 7 7",
  "chevron-right": "m9 5 7 7-7 7",
  "chevron-down": "m5 9 7 7 7-7",
  map: "m9 4-5 2v14l5-2 6 2 5-2V4l-5 2-6-2Zm0 0v14m6-12v14",
  grid: "M4 4h7v7H4V4Zm9 0h7v7h-7V4ZM4 13h7v7H4v-7Zm9 0h7v7h-7v-7Z",
  sliders: "M4 7h10m4 0h2M4 17h4m4 0h8M14 5v4m-6 6v4",
  train: "M7 3h10a2 2 0 0 1 2 2v9a3 3 0 0 1-3 3H8a3 3 0 0 1-3-3V5a2 2 0 0 1 2-2Zm-2 8h14M8 21l2-4m6 4-2-4M8.5 14h.01m7 0h.01",
  star: "m12 3.5 2.6 5.3 5.9.9-4.3 4.1 1 5.8-5.2-2.7-5.2 2.7 1-5.8L3.5 9.7l5.9-.9L12 3.5Z",
  flag: "M5 21V4m0 0h11l-2 4 2 4H5",
  menu: "M4 7h16M4 12h16M4 17h16",
  users: "M16 19v-1a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v1m6.5-9a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7ZM21 19v-1a4 4 0 0 0-3-3.9M16 3.1a3.5 3.5 0 0 1 0 6.8",
  key: "M15.5 8.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm-3 3L4 20m3-3 2 2m-4-4 2 2",
  bed: "M3 18V7m0 7h18v4m0-4v-2a3 3 0 0 0-3-3h-7v5M7 11.5a1.5 1.5 0 1 0 0-.01",
  "arrow-right": "M5 12h14m-6-6 6 6-6 6",
};

export function Icon({ name, size = 18, ...rest }: { name: IconName; size?: number } & SVGProps<SVGSVGElement>) {
  if (name === "whatsapp") {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden {...rest}>
        <path d="M12 2.2A9.8 9.8 0 0 0 3.6 17l-1.4 4.9 5-1.3A9.8 9.8 0 1 0 12 2.2Zm0 17.9c-1.5 0-3-.4-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.1 8.1 0 1 1 12 20.1Zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1a6.6 6.6 0 0 1-3.3-2.9c-.2-.4.2-.4.7-1.3.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2c0 1.3.9 2.5 1 2.7.1.2 1.8 2.8 4.4 3.9 1.6.7 2.3.8 3.1.6.5-.1 1.5-.6 1.7-1.2.2-.6.2-1.1.2-1.2-.1-.1-.3-.2-.5-.3Z" />
      </svg>
    );
  }
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      {...rest}
    >
      <path d={PATHS[name]} />
    </svg>
  );
}

/** Stayshay logo: Shay (the living blob mark) + wordmark. `light` is for dark backgrounds. */
export function Logo({ className = "", light = false, size = 30 }: { className?: string; light?: boolean; animated?: boolean; size?: number }) {
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <Shay size={size} glow={false} />
      <span className={`text-[22px] font-extrabold leading-none tracking-[-0.04em] ${light ? "text-white" : "text-brand"}`}>stayshay</span>
    </span>
  );
}

export function Badge({ tone = "neutral", children }: { tone?: "neutral" | "verified" | "warn" | "ink"; children: React.ReactNode }) {
  const tones = {
    neutral: "bg-surface text-ink-2 border-line",
    verified: "bg-mint text-brand border-transparent",
    warn: "bg-warn-bg text-warn border-transparent",
    ink: "bg-brand text-white border-brand",
  };
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11.5px] font-semibold leading-none ${tones[tone]}`}>
      {children}
    </span>
  );
}
