"use client";

import Link from "next/link";
import { useState } from "react";
import { REFERRAL_REWARDS, REWARD_LABEL, STAGE_LABEL, whatsappLink, type RewardKind } from "@stayshay/core/src/client.ts";
import type { Partner, Referred, Reward } from "@/lib/referrals";
import { aed } from "./ui";

type Code = { code: string; owner: { name: string; phone: string | null } | null; people: Referred[] };

const btn = "h-8 rounded-full border border-line px-3 text-[12.5px] font-medium hover:border-brand";

export function AdminReferrals(props: { codes: Code[]; partners: Partner[]; rewards: Reward[] }) {
  const [partners, setPartners] = useState(props.partners);
  const [rewards, setRewards] = useState(props.rewards);
  const [msg, setMsg] = useState<string | null>(null);
  const flash = (m: string) => {
    setMsg(m);
    setTimeout(() => setMsg(null), 2500);
  };

  const patch = async (body: Record<string, string>) => fetch("/api/admin/referrals", { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify(body) }).then((r) => r.ok);

  const reward = async (code: string, p: Referred, kind: RewardKind) => {
    const res = await fetch("/api/admin/referrals", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ code, kind, personLabel: p.label, personKey: p.key, leadId: p.leadIds[0] ?? null }) });
    const j = await res.json().catch(() => ({}));
    if (res.ok) {
      setRewards((r) => [j.reward, ...r]);
      flash(`Reward of ${aed(j.reward.amount)} recorded for ${code}`);
    } else flash(j.error ?? "Couldn't record");
  };

  const due = rewards.filter((r) => r.status === "approved");

  return (
    <div className="min-h-screen bg-surface">
      <header className="border-b border-line bg-white">
        <div className="mx-auto flex h-16 max-w-[1280px] items-center justify-between px-4 md:px-8">
          <p className="text-[17px] font-bold">Referrals & partners</p>
          <Link href="/admin" className="text-[14px] font-medium text-brand">
            Back to admin
          </Link>
        </div>
      </header>
      {msg && <p className="fixed bottom-5 left-1/2 z-50 -translate-x-1/2 rounded-full bg-ink px-4 py-2 text-[13.5px] text-white">{msg}</p>}
      <main className="mx-auto max-w-[1280px] space-y-10 px-4 py-8 md:px-8">
        <section>
          <h2 className="text-[19px] font-bold">Rewards to pay ({due.length}, {aed(due.reduce((s, r) => s + r.amount, 0))})</h2>
          <ul className="mt-3 divide-y divide-line rounded-[18px] border border-line bg-white">
            {rewards.length === 0 && <li className="px-4 py-4 text-[14px] text-muted">No rewards yet. Record one from a referred person below once they move in.</li>}
            {rewards.map((r) => (
              <li key={r.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 text-[14px]">
                <span>
                  <b>{r.code}</b> · {REWARD_LABEL[r.kind]} · {r.personLabel} · {aed(r.amount)}
                  <span className="ml-2 rounded-full bg-surface px-2 py-0.5 text-[12px]">{r.status}</span>
                </span>
                <span className="flex gap-2">
                  {r.status === "approved" && (
                    <button className={btn} onClick={async () => (await patch({ rewardId: r.id, status: "paid" })) && setRewards((all) => all.map((x) => (x.id === r.id ? { ...x, status: "paid" } : x)))}>
                      Mark paid
                    </button>
                  )}
                  {r.status !== "cancelled" && (
                    <button className={btn} onClick={async () => (await patch({ rewardId: r.id, status: "cancelled" })) && setRewards((all) => all.map((x) => (x.id === r.id ? { ...x, status: "cancelled" } : x)))}>
                      Cancel
                    </button>
                  )}
                </span>
              </li>
            ))}
          </ul>
        </section>

        <section>
          <h2 className="text-[19px] font-bold">Partner profiles</h2>
          <ul className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
            {partners.length === 0 && <li className="rounded-[18px] bg-white p-4 text-[14px] text-muted">No partner profiles yet.</li>}
            {partners.map((p) => (
              <li key={p.id} className="rounded-[18px] border border-line bg-white p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[15px] font-bold">
                      {p.name} <span className="font-normal text-muted">· {p.code}</span>
                    </p>
                    <p className="text-[13px] text-muted">{[p.company, p.brn && `BRN ${p.brn}`, `+${p.phone}`].filter(Boolean).join(" · ")}</p>
                  </div>
                  <span className="rounded-full bg-surface px-2.5 py-1 text-[12px] font-semibold">{p.status}</span>
                </div>
                <p className="mt-2 text-[13.5px] text-ink-2">{p.bio}</p>
                <p className="mt-1 text-[12.5px] text-muted">{p.areas.join(", ")}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {(["approved", "hidden"] as const).map((s) => (
                    <button key={s} className={btn} disabled={p.status === s} onClick={async () => (await patch({ partnerId: p.id, status: s })) && setPartners((all) => all.map((x) => (x.id === p.id ? { ...x, status: s } : x)))}>
                      {s === "approved" ? "Approve" : "Hide"}
                    </button>
                  ))}
                  <a className={btn + " inline-flex items-center"} href={whatsappLink(p.phone, `Hi ${p.name.split(" ")[0]}, this is Stayshay about your partner profile.`)} target="_blank" rel="noopener noreferrer">
                    WhatsApp
                  </a>
                </div>
              </li>
            ))}
          </ul>
        </section>

        <section>
          <h2 className="text-[19px] font-bold">Who each code brought in</h2>
          <p className="mt-1 text-[13.5px] text-muted">When someone moves in, record the reward here. Renter: {aed(REFERRAL_REWARDS.tenant_move_in)}. Owner's first tenant: {aed(REFERRAL_REWARDS.owner_first_fill)}.</p>
          <div className="mt-4 space-y-4">
            {props.codes.length === 0 && <p className="rounded-[18px] bg-white p-4 text-[14px] text-muted">Nobody has joined through a referral link yet.</p>}
            {props.codes.map((c) => (
              <div key={c.code} className="rounded-[18px] border border-line bg-white">
                <p className="border-b border-line px-4 py-3 text-[15px] font-bold">
                  {c.code} <span className="font-normal text-muted">{c.owner ? `· ${c.owner.name}` : ""} · {c.people.length} people</span>
                </p>
                <ul className="divide-y divide-line">
                  {c.people.map((p) => (
                    <li key={p.key} className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 text-[14px]">
                      <span>
                        {p.label} {p.phone && <span className="text-muted">+{p.phone}</span>} <span className="ml-1 rounded-full bg-surface px-2 py-0.5 text-[12px]">{STAGE_LABEL[p.stage]}</span>
                      </span>
                      <span className="flex gap-2">
                        <button className={btn} onClick={() => reward(c.code, p, "tenant_move_in")}>
                          Renter moved in
                        </button>
                        <button className={btn} onClick={() => reward(c.code, p, "owner_first_fill")}>
                          Owner got tenant
                        </button>
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
