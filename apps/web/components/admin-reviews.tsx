"use client";

import { useState } from "react";
import type { Review } from "@/lib/reviews";

export function AdminReviews({ initial }: { initial: Review[] }) {
  const [rows, setRows] = useState(initial);
  const set = async (id: string, status: Review["status"]) => {
    const r = await fetch("/api/admin/reviews", { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ id, status }) });
    if (r.ok) setRows((all) => all.map((x) => (x.id === id ? { ...x, status } : x)));
  };
  return (
    <main className="mx-auto max-w-[900px] px-5 py-10">
      <h1 className="font-display text-[32px]">Reviews</h1>
      <p className="mt-1 text-[14px] text-muted">Only approved reviews show on the site. You can also approve from the Telegram alert.</p>
      <ul className="mt-6 space-y-3">
        {rows.map((r) => (
          <li key={r.id} className="rounded-[16px] border border-line bg-white p-4">
            <div className="flex flex-wrap items-center justify-between gap-2 text-[13px]">
              <span>
                <b>{r.name}</b> {r.role && `· ${r.role}`} · {"★".repeat(r.rating)} · {r.tool} · {r.createdAt.slice(0, 10)} {r.phone && `· ${r.phone}`}
              </span>
              <span className={`rounded-full px-2.5 py-0.5 font-semibold ${r.status === "approved" ? "bg-mint text-brand" : r.status === "pending" ? "bg-[#fbefdc] text-[#8a5a14]" : "bg-surface text-muted"}`}>{r.status}</span>
            </div>
            <p className="mt-2 text-[15px]">“{r.text}”</p>
            <div className="mt-3 flex gap-2">
              {r.status !== "approved" && <button onClick={() => set(r.id, "approved")} className="h-9 rounded-[10px] bg-brand px-3.5 text-[13px] font-semibold text-white">Approve</button>}
              {r.status !== "rejected" && <button onClick={() => set(r.id, "rejected")} className="h-9 rounded-[10px] border border-line px-3.5 text-[13px] font-semibold">Reject</button>}
            </div>
          </li>
        ))}
        {!rows.length && <li className="text-[14px] text-muted">No reviews yet.</li>}
      </ul>
    </main>
  );
}
