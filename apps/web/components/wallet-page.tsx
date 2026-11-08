"use client";

import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { aed } from "./ui";

interface Entry { id: string; type: string; amount: number; note: string; createdAt: string }
interface Redemption { id: string; listingTitle: string; amount: number; status: string; createdAt: string }
interface Data { balance: number; entries: Entry[]; redemptions: Redemption[]; presets: number[] }

const day = (iso: string) => new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

export function WalletPage() {
  const sp = useSearchParams();
  const [d, setD] = useState<Data | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const load = useCallback(async () => {
    const j = await fetch("/api/wallet", { cache: "no-store" }).then((r) => r.json()).catch(() => null);
    if (j?.ok) setD(j);
  }, []);
  useEffect(() => {
    load();
  }, [load]);
  const topup = async (amount: number) => {
    setBusy(true);
    setError(null);
    const j = await fetch("/api/wallet", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action: "topup", amount }) }).then((r) => r.json()).catch(() => null);
    if (j?.url) return void (window.location.href = j.url);
    setBusy(false);
    setError("Couldn’t open the payment page. Please try again.");
  };
  const cancel = async (id: string) => {
    await fetch("/api/wallet", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action: "cancel", id }) }).catch(() => null);
    load();
  };
  const added = Number(sp.get("added"));
  if (!d) return <div className="mx-auto mt-8 h-[320px] max-w-[560px] animate-pulse rounded-[24px] bg-surface" />;
  return (
    <main className="mx-auto max-w-[560px] px-4 pb-16 pt-8">
      <h1 className="text-[28px] font-bold tracking-[-0.02em]">Stayshay wallet</h1>
      {added > 0 && <p className="mt-4 rounded-[16px] bg-mint p-4 text-[14px] font-semibold text-brand-deep">{aed(added)} added to your wallet.</p>}
      {sp.get("error") && <p className="mt-4 rounded-[16px] bg-red-50 p-4 text-[14px] font-semibold text-red-700">We couldn’t confirm that payment. If you were charged, WhatsApp us.</p>}
      <section className="glow-panel mt-5 rounded-[24px] p-6 text-white">
        <p className="text-[13px] text-white/70">Rent credits</p>
        <p className="mt-1 text-[42px] font-bold leading-none tracking-[-0.03em]">{aed(d.balance)}</p>
        <p className="mt-3 text-[13.5px] text-white/70">1 credit = AED 1 off rent booked through Stayshay. Open a listing to use them. Credits can’t be withdrawn as cash.</p>
      </section>
      <h2 className="mt-8 text-[18px] font-bold">Add credits</h2>
      <div className="mt-3 grid grid-cols-3 gap-2">
        {d.presets.map((p) => (
          <button key={p} onClick={() => topup(p)} disabled={busy} className="h-14 rounded-[14px] border border-line bg-white text-[15px] font-bold hover:border-brand disabled:opacity-50">
            {p.toLocaleString("en-US")}
          </button>
        ))}
      </div>
      {error && <p className="mt-2 text-[13px] font-semibold text-red-600">{error}</p>}
      <p className="mt-3 text-[13px] text-muted">To gift credits, open a chat with one of your matches and tap Gift.</p>
      {d.redemptions.length > 0 && (
        <>
          <h2 className="mt-8 text-[18px] font-bold">Used on listings</h2>
          <ul className="mt-3 divide-y divide-line rounded-[20px] border border-line">
            {d.redemptions.map((r) => (
              <li key={r.id} className="flex items-center justify-between gap-3 p-4 text-[14px]">
                <span className="min-w-0">
                  <b className="block truncate">{r.listingTitle}</b>
                  <span className="text-muted">{aed(r.amount)} · {r.status === "requested" ? "Waiting for booking" : r.status === "applied" ? "Applied to rent" : "Returned to wallet"}</span>
                </span>
                {r.status === "requested" && <button onClick={() => cancel(r.id)} className="shrink-0 text-[13px] font-semibold text-brand">Cancel</button>}
              </li>
            ))}
          </ul>
        </>
      )}
      <h2 className="mt-8 text-[18px] font-bold">History</h2>
      {d.entries.length ? (
        <ul className="mt-3 divide-y divide-line rounded-[20px] border border-line">
          {d.entries.map((e) => (
            <li key={e.id} className="flex justify-between gap-3 p-4 text-[14px]">
              <span className="min-w-0">
                <b className="block truncate">{e.note}</b>
                <span className="text-muted">{day(e.createdAt)}</span>
              </span>
              <b className={e.amount > 0 ? "text-brand" : ""}>{e.amount > 0 ? "+" : "−"}{Math.abs(e.amount).toLocaleString("en-US")}</b>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-2 text-[14px] text-muted">Nothing yet.</p>
      )}
    </main>
  );
}

/** On a listing: put wallet credits towards this rent. Renders nothing unless the wallet is on and has a balance. */
export function WalletApply({ listingId, rent }: { listingId: string; rent: number }) {
  const [balance, setBalance] = useState(0);
  const [amount, setAmount] = useState("");
  const [state, setState] = useState<"idle" | "busy" | "done">("idle");
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    fetch("/api/wallet", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => {
        if (j?.ok && j.balance > 0) {
          setBalance(j.balance);
          setAmount(String(Math.min(j.balance, rent)));
        }
      })
      .catch(() => {});
  }, [rent]);
  if (balance <= 0) return null;
  const n = Number(amount);
  const apply = async () => {
    setState("busy");
    setError(null);
    const j = await fetch("/api/wallet", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action: "redeem", listingId, amount: n }) }).then((r) => r.json()).catch(() => null);
    if (j?.ok) return setState("done");
    setState("idle");
    setError(j?.error === "open" ? "You’ve already put credits on this listing. See your wallet." : "Check the amount and try again.");
  };
  return (
    <section className="rounded-[22px] bg-mint p-6">
      <h2 className="font-display text-[24px]">Use your rent credits</h2>
      {state === "done" ? (
        <p className="mt-2 text-[14.5px] text-ink-2">{aed(n)} is held for this place. Our team takes it off your rent when your booking is confirmed, and returns it if the booking doesn’t go ahead.</p>
      ) : (
        <>
          <p className="mt-2 text-[14.5px] text-ink-2">You have {aed(balance)}. With {n > 0 ? aed(Math.min(n, rent)) : "credits"} off, you’d pay <b>{aed(Math.max(0, rent - n))}</b> of the {aed(rent)} rent.</p>
          <div className="mt-4 flex gap-2">
            <input value={amount} onChange={(e) => setAmount(e.target.value.replace(/\D/g, "").slice(0, 6))} inputMode="numeric" aria-label="Credits to use" className="h-12 min-w-0 flex-1 rounded-[14px] border border-line bg-white px-4 text-[16px] outline-none focus:border-brand" />
            <button onClick={apply} disabled={state === "busy" || n <= 0 || n > balance || n > rent} className="h-12 shrink-0 rounded-[14px] bg-brand px-5 text-[14.5px] font-semibold text-white disabled:opacity-50">
              Use credits
            </button>
          </div>
          {error && <p className="mt-2 text-[13px] font-semibold text-red-600">{error}</p>}
        </>
      )}
    </section>
  );
}
