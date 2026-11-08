"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Sheet } from "./roomie/parts";
import { aed } from "./ui";

const ERR: Record<string, string> = {
  amount: "Enter an amount between AED 10 and AED 5,000.",
  balance: "You don’t have enough credits for that.",
  cap: "You’ve reached the AED 10,000 gifting limit for this month.",
  not_match: "You can only gift credits to a match.",
};

/** Gift rent credits to a match. The scam warning has to be ticked every time. */
export function GiftCredits({ to, name, onClose, onSent }: { to: string; name: string; onClose: () => void; onSent: () => void }) {
  const [balance, setBalance] = useState<number | null>(null);
  const [amount, setAmount] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    fetch("/api/wallet", { cache: "no-store" })
      .then((r) => r.json())
      .then((j) => setBalance(j.ok ? j.balance : 0))
      .catch(() => setBalance(0));
  }, []);
  const send = async () => {
    setBusy(true);
    setError(null);
    const r = await fetch("/api/wallet", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action: "gift", to, amount: Number(amount), confirm: true }) }).catch(() => null);
    const j = await r?.json().catch(() => null);
    setBusy(false);
    if (j?.ok) return onSent();
    setError(ERR[j?.error] ?? "Couldn’t send that. Please try again.");
  };
  return (
    <Sheet onClose={onClose}>
      <div className="p-6">
        <p className="text-[22px] font-bold">Gift rent credits to {name}</p>
        <p className="mt-1 text-[14px] text-white/65">{name} can use them towards rent booked through Stayshay. Credits can’t be cashed out.</p>
        {balance === null ? (
          <div className="mt-5 h-24 animate-pulse rounded-[18px] bg-white/[0.06]" />
        ) : balance <= 0 ? (
          <Link href="/wallet" className="mt-5 flex h-13 items-center justify-center rounded-full bg-lime py-3.5 text-[16px] font-bold text-brand-deep">
            Add credits first
          </Link>
        ) : (
          <>
            <p className="mt-5 text-[13.5px] text-white/60">Your balance: <b className="text-white">{aed(balance)}</b></p>
            <input value={amount} onChange={(e) => setAmount(e.target.value.replace(/\D/g, "").slice(0, 5))} inputMode="numeric" placeholder="Amount in AED" aria-label="Amount in AED" className="mt-2 h-14 w-full rounded-[18px] border border-white/12 bg-white/[0.06] px-4 text-[16px] text-white outline-none focus:border-lime" />
            <label className="mt-4 flex gap-3 rounded-[16px] bg-[#ff6fa5]/12 p-4 text-[13.5px] leading-relaxed text-white/85">
              <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} className="mt-0.5 h-5 w-5 shrink-0 accent-[#d3f0b9]" />
              <span>I know {name} in person or have met them at a viewing, and nobody is pressuring me. Gifts can’t be taken back.</span>
            </label>
            {error && <p className="mt-2 text-[13px] font-semibold text-[#ffb4b4]">{error}</p>}
            <button onClick={send} disabled={busy || !agreed || !Number(amount)} className="mt-4 h-13 w-full rounded-full bg-lime py-3.5 text-[16px] font-bold text-brand-deep disabled:opacity-50">
              {busy ? "Sending…" : `Gift ${Number(amount) ? aed(Number(amount)) : "credits"}`}
            </button>
          </>
        )}
      </div>
    </Sheet>
  );
}
