"use client";

import { useState } from "react";

type R = { id: string; name: string; email: string; listingId: string; listingTitle: string; rentAed: number; amount: number; status: string; createdAt: string };

/** Credits people have put on listings: apply them when the booking is confirmed, or return them. */
export function AdminWallet({ items: initial, held }: { items: R[]; held: number }) {
  const [items, setItems] = useState(initial);
  const decide = async (id: string, status: "applied" | "cancelled") => {
    const res = await fetch("/api/admin/wallet", { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ id, status }) });
    if (res.ok) setItems((all) => all.map((x) => (x.id === id ? { ...x, status } : x)));
  };
  return (
    <main className="mx-auto max-w-[1000px] px-4 py-10">
      <a href="/admin" className="text-[14px] text-muted hover:text-ink">← Admin</a>
      <h1 className="font-display mt-2 text-[34px]">Wallet</h1>
      <p className="mt-1 text-[14px] text-ink-2">AED {held.toLocaleString("en-US")} of unspent credits in wallets.</p>
      <ul className="mt-6 space-y-3">
        {items.map((r) => (
          <li key={r.id} className="card flex flex-wrap items-center justify-between gap-3 p-4 text-[14px]">
            <span className="min-w-0">
              <b className="block">{r.listingTitle} · AED {r.amount.toLocaleString("en-US")} of {r.rentAed.toLocaleString("en-US")}</b>
              <span className="text-muted">{r.name} · {r.email} · {r.status}</span>
            </span>
            {r.status === "requested" && (
              <span className="flex gap-2">
                <button onClick={() => decide(r.id, "applied")} className="h-10 rounded-[12px] bg-brand px-4 font-semibold text-white">Apply to rent</button>
                <button onClick={() => decide(r.id, "cancelled")} className="h-10 rounded-[12px] border border-line px-4 font-semibold">Return</button>
              </span>
            )}
          </li>
        ))}
        {!items.length && <li className="text-[14px] text-muted">No requests yet.</li>}
      </ul>
    </main>
  );
}
