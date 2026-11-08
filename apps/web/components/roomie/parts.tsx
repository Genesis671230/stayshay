"use client";

import { useEffect, type ReactNode } from "react";
import { AREA_BY_SLUG } from "@stayshay/core/src/client.ts";
import type { PublicRoommate } from "@/lib/roommates";
import type { SwipeCard } from "@/lib/swipe";
import { Icon, aed } from "../ui";
import { PASS_PRICE, useJoin } from "../community-lock";

export const areaName = (s: string) => AREA_BY_SLUG.get(s)?.name ?? s;
export const moveInText = (iso: string) => {
  const d = Date.parse(`${iso}T00:00:00`);
  if (!d || d < Date.now() + 3 * 86400_000) return "Moving now";
  return `From ${new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}`;
};
export const areasText = (p: Pick<PublicRoommate, "areaSlugs">, n = 2) => (p.areaSlugs.length ? p.areaSlugs.slice(0, n).map(areaName).join(", ") : "Any area");

/** Placeholder art when someone has no photo: a soft gradient with their initial, never a stock face. */
export function Portrait({ p, className = "" }: { p: Pick<PublicRoommate, "photo" | "firstName" | "gender">; className?: string }) {
  if (p.photo)
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={p.photo} alt={p.firstName} draggable={false} className={`pointer-events-none h-full w-full object-cover ${className}`} />;
  return (
    <div className={`flex h-full w-full items-center justify-center ${p.gender === "female" ? "bg-[radial-gradient(120%_90%_at_30%_20%,#7a4a63,#2a1a26)]" : "bg-[radial-gradient(120%_90%_at_30%_20%,#2f6b57,#0f2a20)]"} ${className}`}>
      <span className="font-display text-[110px] leading-none text-white/25">{(p.firstName || "?")[0]?.toUpperCase()}</span>
    </div>
  );
}

/** Bottom sheet on phones, centred dialog on desktop. Escape closes; the page behind doesn't scroll. */
export function Sheet({ onClose, children, dark = true, wide = false }: { onClose: () => void; children: ReactNode; dark?: boolean; wide?: boolean }) {
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);
  return (
    <div className="fixed inset-0 z-[90] flex items-end justify-center bg-black/60 backdrop-blur-sm md:items-center" onClick={onClose} role="dialog" aria-modal="true">
      <div
        onClick={(e) => e.stopPropagation()}
        className={`roomie-rise max-h-[92dvh] w-full overflow-y-auto rounded-t-[30px] md:rounded-[30px] ${wide ? "max-w-[560px]" : "max-w-[460px]"} ${dark ? "bg-[#101614] text-white" : "bg-white text-ink"}`}
      >
        {children}
      </div>
    </div>
  );
}

export function Upgrade({ area, returnTo = "/roommates", title, line }: { area: string | null; returnTo?: "/roommates" | "/swipe" | "/messages"; title: string; line: string }) {
  const { join, busy, error } = useJoin(area ?? undefined, returnTo);
  return (
    <div className="p-6">
      <span className="flex h-12 w-12 items-center justify-center rounded-[16px] bg-lime text-brand-deep">
        <Icon name="lock" size={20} />
      </span>
      <p className="mt-4 text-[22px] font-bold leading-tight">{title}</p>
      <p className="mt-1.5 text-[14.5px] leading-relaxed text-white/70">{line}</p>
      <ul className="mt-5 space-y-2.5 text-[14px]">
        {["Unlimited messages", "See every profile, best fits first", "Filter by gender, age, budget, area and habits", "Your area's group chat and Q&A", "Cancel any time"].map((t) => (
          <li key={t} className="flex items-center gap-2.5">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-lime/15 text-lime">
              <Icon name="check" size={12} />
            </span>
            {t}
          </li>
        ))}
      </ul>
      <button onClick={join} disabled={busy} className="mt-6 flex h-13 w-full items-center justify-center gap-2 rounded-full bg-lime py-3.5 text-[16px] font-bold text-brand-deep transition hover:brightness-95 disabled:opacity-60">
        {busy ? "Opening secure payment…" : `Get the Stayshay Pass · AED ${PASS_PRICE}/month`}
      </button>
      {error && <p className="mt-2 text-center text-[13px] font-semibold text-[#ffb4b4]">{error}</p>}
      <p className="mt-3 text-center text-[12px] text-white/45">Secure payment by Stripe. Cancel from your account whenever you like.</p>
    </div>
  );
}

export function CheckedBadge({ size = 20 }: { size?: number }) {
  return (
    <span title="Checked by the Stayshay team" className="inline-flex shrink-0 items-center justify-center rounded-full bg-[#5ec8f2] text-[#06202b]" style={{ width: size, height: size }}>
      <Icon name="check" size={Math.round(size * 0.6)} />
    </span>
  );
}

/** Full profile: photo, the facts, why it fits, and the actions. */
export function ProfileDetails({ c, onClose, actions }: { c: SwipeCard | (PublicRoommate & { score?: number; reasons?: string[] }); onClose: () => void; actions?: ReactNode }) {
  const reasons = "reasons" in c && c.reasons ? c.reasons : [];
  const score = "score" in c ? c.score : undefined;
  return (
    <Sheet onClose={onClose}>
      <div className="relative aspect-[4/4.4] overflow-hidden">
        <Portrait p={c} />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgb(0_0_0/0)_55%,#101614_100%)]" />
        <button onClick={onClose} aria-label="Close" className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-black/40 backdrop-blur">
          <Icon name="close" size={18} />
        </button>
        <div className="absolute inset-x-0 bottom-0 px-6 pb-2">
          <p className="flex items-center gap-2 text-[32px] font-bold leading-none tracking-[-0.02em]">
            {c.firstName}
            {c.age ? `, ${c.age}` : ""} <CheckedBadge size={24} />
          </p>
          <p className="mt-2 text-[14.5px] text-white/70">{[c.nationality, c.profession].filter(Boolean).join(" · ") || (c.mode === "has_place" ? "Has a place to share" : "Looking to share")}</p>
        </div>
      </div>
      <div className="px-6 pb-6 pt-4">
        <div className="grid grid-cols-2 gap-2 text-[13.5px]">
          <Fact label="Budget" value={`${aed(c.budget)}/mo`} />
          <Fact label="Move-in" value={moveInText(c.moveIn)} />
          <Fact wide label={c.mode === "has_place" ? "Has a place in" : "Looking in"} value={areasText(c, 5)} />
        </div>
        {c.about && <p className="mt-5 whitespace-pre-line text-[15px] leading-relaxed text-white/85">{c.about}</p>}
        {c.lifestyle.length > 0 && (
          <div className="mt-5 flex flex-wrap gap-2">
            {c.lifestyle.map((t) => (
              <span key={t} className="rounded-full border border-white/12 bg-white/[0.06] px-3 py-1.5 text-[13px]">
                {t}
              </span>
            ))}
          </div>
        )}
        {score !== undefined && reasons.length > 0 && (
          <div className="mt-5 rounded-[18px] bg-lime/10 p-4">
            <p className="text-[14px] font-bold text-lime">{score}% fit with you</p>
            <p className="mt-1 text-[13.5px] text-white/70">{reasons.join(" · ")}</p>
          </div>
        )}
        {actions && <div className="mt-6">{actions}</div>}
        <p className="mt-4 text-center text-[12px] text-white/40">Meet in a public place first. Never pay a deposit before you’ve seen the room.</p>
      </div>
    </Sheet>
  );
}

function Fact({ label, value, wide = false }: { label: string; value: string; wide?: boolean }) {
  return (
    <div className={`rounded-[16px] bg-white/[0.06] p-3.5 ${wide ? "col-span-2" : ""}`}>
      <span className="block text-[12px] text-white/50">{label}</span>
      <b className="text-[14.5px]">{value}</b>
    </div>
  );
}

/** Round action buttons under the card, like the reference: pass (dark) and connect (glowing). */
export function RoundButton({ kind, onClick, disabled, label }: { kind: "pass" | "connect" | "message"; onClick: () => void; disabled?: boolean; label: string }) {
  const style =
    kind === "connect"
      ? "h-[72px] w-[72px] bg-[linear-gradient(135deg,#ff6fa5,#e94b8a)] text-white shadow-[0_12px_34px_rgb(233_75_138/0.45)]"
      : kind === "pass"
        ? "h-[60px] w-[60px] bg-white/[0.08] text-white ring-1 ring-white/10"
        : "h-[60px] w-[60px] bg-white/[0.08] text-lime ring-1 ring-white/10";
  return (
    <button onClick={onClick} disabled={disabled} aria-label={label} title={label} className={`flex items-center justify-center rounded-full transition active:scale-90 disabled:opacity-40 ${style}`}>
      {kind === "connect" ? <HeartFill size={30} /> : kind === "pass" ? <Icon name="close" size={24} /> : <Icon name="chat" size={22} />}
    </button>
  );
}

export function HeartFill({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden fill="currentColor">
      <path d="M12 21.3 10.6 20C5.4 15.4 2 12.3 2 8.5 2 5.4 4.4 3 7.5 3c1.7 0 3.4.8 4.5 2.1C13.1 3.8 14.8 3 16.5 3 19.6 3 22 5.4 22 8.5c0 3.8-3.4 6.9-8.6 11.5L12 21.3Z" />
    </svg>
  );
}
