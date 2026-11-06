"use client";

import Link from "next/link";
import { useState } from "react";
import { AREA_BY_SLUG } from "@stayshay/core/src/client.ts";
import type { LockedRoommate } from "@/lib/roommates";
import { Icon, aed } from "./ui";
import { track } from "./analytics";

export const PASS_PRICE = 25;

/** Starts Stripe Checkout for this community. Not signed in → sign in first, then come straight back to pay. */
export function useJoin(area: string | undefined) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const join = async () => {
    if (!area) {
      window.location.href = "/community";
      return;
    }
    setBusy(true);
    setError(null);
    track("begin_checkout", { item: "stayshay_pass", area, value: PASS_PRICE, currency: "AED" });
    try {
      const res = await fetch("/api/pass/checkout", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ area }) });
      const j = await res.json();
      if (j.url) return void (window.location.href = j.url);
      if (j.error === "signin") return void (window.location.href = `/login?next=${encodeURIComponent(j.next)}`);
      setError(j.error === "payments_off" ? "Payments are being set up. Please try again shortly or WhatsApp us." : "Couldn’t open the payment page. Please try again.");
    } catch {
      setError("No connection. Please try again.");
    }
    setBusy(false);
  };
  return { join, busy, error };
}

export function JoinButton({ area, className = "", label }: { area?: string; className?: string; label?: string }) {
  const { join, busy, error } = useJoin(area);
  const name = area ? AREA_BY_SLUG.get(area)?.name : null;
  return (
    <span className="inline-flex flex-col items-start">
      <button
        onClick={join}
        disabled={busy}
        className={`inline-flex items-center justify-center gap-2 rounded-[14px] bg-lime px-6 text-[15.5px] font-bold text-brand-deep shadow-[0_10px_30px_rgb(211_240_185/0.45)] transition hover:brightness-95 disabled:opacity-60 ${className || "h-12"}`}
      >
        <Icon name="lock" size={16} />
        {busy ? "Opening secure payment…" : (label ?? (name ? `Unlock ${name} · AED ${PASS_PRICE}/month` : `Unlock with the Stayshay Pass · AED ${PASS_PRICE}`))}
      </button>
      {error && <span className="mt-2 text-[13px] font-semibold text-red-600">{error}</span>}
    </span>
  );
}

/** A real profile behind the pass, shown blurred: budget and area only, nothing personal. */
export function LockedCard({ p, area }: { p: LockedRoommate; area?: string }) {
  const { join, busy } = useJoin(area ?? p.areaSlugs[0]);
  const areaName = p.areaSlugs.map((s) => AREA_BY_SLUG.get(s)?.name ?? s)[0] ?? "Any area";
  return (
    <article className="relative flex h-full flex-col overflow-hidden rounded-[24px] border border-line bg-white">
      <div aria-hidden className="pointer-events-none select-none blur-[6px]">
        <div className={`aspect-[4/3] ${p.gender === "female" ? "bg-[linear-gradient(135deg,#f6d9e4,#e9c6f0)]" : "bg-[linear-gradient(135deg,#cfe8dc,#b9d7f0)]"}`}>
          <div className="flex h-full items-center justify-center">
            <span className="h-24 w-24 rounded-full bg-white/80" />
          </div>
        </div>
        <div className="space-y-2.5 p-4">
          <div className="h-4 w-2/3 rounded-full bg-ink/15" />
          <div className="h-3 w-1/2 rounded-full bg-ink/10" />
          <div className="flex gap-1.5">
            <span className="h-6 w-16 rounded-full bg-mint" />
            <span className="h-6 w-20 rounded-full bg-mint" />
          </div>
          <div className="h-3 w-5/6 rounded-full bg-ink/10" />
        </div>
      </div>
      <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/30 p-5 text-center">
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-deep text-white shadow-lg">
          <Icon name="lock" size={20} />
        </span>
        <p className="mt-3 text-[15px] font-bold text-ink">{p.mode === "has_place" ? "Has a place" : "Looking to share"}</p>
        <p className="text-[13px] text-ink-2">
          {aed(p.budget)}/mo · {areaName}
        </p>
        <button onClick={join} disabled={busy} className="mt-4 h-10 rounded-full bg-brand-deep px-4 text-[13.5px] font-semibold text-white hover:brightness-110 disabled:opacity-60">
          {busy ? "Opening…" : `Unlock · AED ${PASS_PRICE}`}
        </button>
      </div>
    </article>
  );
}

export function UnlockBanner({ count, area, className = "" }: { count: number; area?: string; className?: string }) {
  return (
    <div className={`flex flex-col items-start justify-between gap-4 rounded-[24px] bg-brand-deep p-5 text-white md:flex-row md:items-center md:p-6 ${className}`}>
      <div className="flex items-start gap-4">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[14px] bg-lime text-brand-deep">
          <Icon name="lock" size={20} />
        </span>
        <div>
          <p className="text-[17px] font-bold">
            {count} more {count === 1 ? "person is" : "people are"} looking. You can see the first 7 for free.
          </p>
          <p className="mt-0.5 text-[14px] text-white/75">The Stayshay Pass unlocks every profile, your neighbourhood’s group chat and Q&A with people who live there.</p>
        </div>
      </div>
      {area ? (
        <JoinButton area={area} />
      ) : (
        <Link href="/community" className="inline-flex h-12 shrink-0 items-center gap-2 rounded-[14px] bg-lime px-6 text-[15.5px] font-bold text-brand-deep hover:brightness-95">
          <Icon name="lock" size={16} /> Pick your community · AED {PASS_PRICE}
        </Link>
      )}
    </div>
  );
}
