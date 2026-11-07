"use client";

import { useState } from "react";
import { AREA_BY_SLUG } from "@stayshay/core/src/client.ts";

type Post = { id: string; area: string; kind: string; name: string; text: string; createdAt: string; hidden?: boolean };
type Pass = { id: string; name: string; email: string; area: string; status: string; amountAed: number; periodEnd: string; createdAt: string };

const date = (iso: string) => new Date(iso).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
const area = (s: string) => AREA_BY_SLUG.get(s)?.name ?? s;

/** Community moderation: every post (members-only content) with one-tap hide, plus who holds a pass. */
export function AdminCommunity({ posts: initial, passes }: { posts: Post[]; passes: Pass[] }) {
  const [posts, setPosts] = useState(initial);
  const [tab, setTab] = useState<"posts" | "passes">("posts");
  const toggle = async (p: Post) => {
    const hidden = !p.hidden;
    const res = await fetch("/api/admin/community", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ id: p.id, hidden }) });
    if (res.ok) setPosts((all) => all.map((x) => (x.id === p.id ? { ...x, hidden } : x)));
  };
  const active = passes.filter((p) => Date.parse(p.periodEnd) > Date.now());
  return (
    <main className="mx-auto max-w-[1000px] px-4 py-10">
      <a href="/admin" className="text-[14px] text-muted hover:text-ink">← Admin</a>
      <h1 className="font-display mt-2 text-[34px]">Community</h1>
      <p className="mt-1 text-[14px] text-ink-2">
        {active.length} active passes · AED {active.reduce((s, p) => s + p.amountAed, 0).toLocaleString("en-US")}/month · {posts.length} posts
      </p>
      <div className="mt-6 flex gap-2">
        {(["posts", "passes"] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)} className={`h-10 rounded-full px-4 text-[14px] font-semibold capitalize ${tab === t ? "bg-ink text-white" : "border border-line"}`}>
            {t}
          </button>
        ))}
      </div>
      {tab === "posts" ? (
        <ul className="mt-6 space-y-3">
          {!posts.length && <li className="text-[14px] text-muted">No posts yet.</li>}
          {posts.map((p) => (
            <li key={p.id} className={`flex items-start justify-between gap-4 rounded-[16px] border border-line p-4 ${p.hidden ? "opacity-50" : ""}`}>
              <div className="min-w-0">
                <p className="text-[12.5px] text-muted">
                  <b className="text-ink">{p.name}</b> · {p.kind} · {area(p.area)} · {date(p.createdAt)}
                </p>
                <p className="mt-1 whitespace-pre-wrap text-[14.5px]">{p.text}</p>
              </div>
              <button onClick={() => toggle(p)} className={`h-9 shrink-0 rounded-full px-4 text-[13px] font-semibold ${p.hidden ? "bg-mint text-brand" : "bg-red-50 text-red-700"}`}>
                {p.hidden ? "Show" : "Hide"}
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <table className="mt-6 w-full text-left text-[14px]">
          <thead className="text-[12px] uppercase text-muted">
            <tr>
              <th className="py-2">Member</th>
              <th>Community</th>
              <th>Status</th>
              <th>Paid until</th>
            </tr>
          </thead>
          <tbody>
            {passes.map((p) => (
              <tr key={p.id} className="border-t border-line">
                <td className="py-2.5">
                  <b>{p.name}</b>
                  <span className="block text-[12.5px] text-muted">{p.email}</span>
                </td>
                <td>{area(p.area)}</td>
                <td>{p.status}</td>
                <td>{new Date(p.periodEnd).toLocaleDateString("en-GB")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </main>
  );
}
