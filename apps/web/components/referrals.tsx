"use client";

import { useState } from "react";
import { REFERRAL_REWARDS, REWARD_LABEL, STAGE_LABEL, referralLink, type ReferralStage } from "@stayshay/core/src/client.ts";
import { aed } from "./ui";

export interface DashboardPerson {
  key: string;
  label: string;
  stage: ReferralStage;
  joinedAt: string;
  lastActivity: string;
}

export interface DashboardReward {
  id: string;
  kind: keyof typeof REFERRAL_REWARDS;
  amount: number;
  personLabel: string;
  status: "approved" | "paid" | "cancelled";
  createdAt: string;
}

export interface PartnerDraft {
  name: string;
  company: string;
  brn: string;
  bio: string;
  areas: string;
  languages: string;
  phone: string;
  status: "pending" | "approved" | "hidden" | null;
  photo: string | null;
}

const field = "w-full rounded-[14px] border border-line bg-white px-4 py-3 text-[15px] focus:border-brand focus:outline-none";
const date = (iso: string) => new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short" });

const STAGE_TONE: Record<ReferralStage, string> = {
  joined: "bg-surface text-ink-2",
  searching: "bg-mint text-brand",
  listed: "bg-mint text-brand",
  moved_in: "bg-fresh text-white",
  rewarded: "bg-brand text-white",
};

export function ReferralDashboard({ code, site, people, rewards, earned, paid, pending, partner }: { code: string; site: string; people: DashboardPerson[]; rewards: DashboardReward[]; earned: number; paid: number; pending: number; partner: PartnerDraft }) {
  const link = referralLink(code, site);
  const [copied, setCopied] = useState(false);
  const share = `Looking for a room, bed space or studio in the UAE? Stayshay shows verified places with no broker fee for renters. Have a look: ${link}`;
  const searching = people.filter((p) => p.stage === "searching" || p.stage === "listed").length;
  const moved = people.filter((p) => p.stage === "moved_in" || p.stage === "rewarded").length;

  return (
    <div className="mx-auto max-w-[1080px] px-4 pb-20 md:px-8">
      <section className="glow-panel relative overflow-hidden rounded-[28px] p-6 text-white md:p-10">
        <p className="text-[12px] font-bold uppercase tracking-[0.14em] text-[#8fe3bd]">Your referral link</p>
        <h1 className="font-display mt-3 text-[30px] leading-[1.05] md:text-[44px]">Share once. Earn every time someone moves in.</h1>
        <div className="mt-6 flex flex-col gap-2 sm:flex-row">
          <code className="flex min-h-12 flex-1 items-center overflow-hidden text-ellipsis whitespace-nowrap rounded-[14px] border border-white/15 bg-white/10 px-4 text-[14.5px]">{link}</code>
          <button
            onClick={() => {
              navigator.clipboard?.writeText(link).then(() => {
                setCopied(true);
                setTimeout(() => setCopied(false), 1800);
              });
            }}
            className="h-12 rounded-[14px] bg-[#6ee7b7] px-6 text-[15px] font-bold text-brand-deep shadow-[0_0_30px_rgb(110_231_183/0.45)]"
          >
            {copied ? "Copied" : "Copy link"}
          </button>
          <a href={`https://wa.me/?text=${encodeURIComponent(share)}`} target="_blank" rel="noopener noreferrer" className="flex h-12 items-center justify-center rounded-[14px] border border-white/25 px-6 text-[15px] font-semibold hover:bg-white/10">
            Share on WhatsApp
          </a>
        </div>
        <p className="mt-3 text-[13px] text-white/65">
          Your code <span className="font-bold tracking-wider text-white">{code}</span>. People who open your link are linked to you for 90 days.
        </p>

        <div className="mt-8 grid grid-cols-2 gap-3 md:grid-cols-4">
          {[
            ["Joined", people.length],
            ["Looking or listing", searching],
            ["Moved in", moved],
            ["Earned", aed(earned)],
          ].map(([k, v]) => (
            <div key={k} className="rounded-[18px] border border-white/12 bg-white/[0.06] p-4">
              <p className="font-figure text-[24px] font-bold md:text-[28px]">{v}</p>
              <p className="text-[12.5px] text-white/65">{k}</p>
            </div>
          ))}
        </div>
      </section>

      <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
        <section>
          <h2 className="text-[20px] font-bold">People you brought in</h2>
          <p className="mt-1 text-[14px] text-muted">Everyone who signed up, searched, posted a roommate profile or listed a place through your link.</p>
          {people.length ? (
            <ul className="mt-4 divide-y divide-line overflow-hidden rounded-[20px] border border-line bg-white">
              {people.map((p) => (
                <li key={p.key} className="flex items-center justify-between gap-3 px-4 py-3.5">
                  <span>
                    <span className="block text-[15px] font-semibold">{p.label}</span>
                    <span className="block text-[12.5px] text-muted">Joined {date(p.joinedAt)}</span>
                  </span>
                  <span className={`rounded-full px-3 py-1 text-[12px] font-semibold ${STAGE_TONE[p.stage]}`}>{STAGE_LABEL[p.stage]}</span>
                </li>
              ))}
            </ul>
          ) : (
            <div className="mt-4 rounded-[20px] border border-dashed border-line-strong p-6 text-[14.5px] text-ink-2">
              Nobody yet. Send your link to people who are looking for a bed space, room or studio, or to owners with empty beds. They show up here the moment they sign up or send a request.
            </div>
          )}

          <h2 className="mt-10 text-[20px] font-bold">Rewards</h2>
          <div className="mt-3 grid grid-cols-3 gap-3">
            {[
              ["Earned", earned],
              ["Paid", paid],
              ["To be paid", pending],
            ].map(([k, v]) => (
              <div key={k as string} className="rounded-[16px] bg-surface p-4">
                <p className="font-figure text-[18px] font-bold md:text-[20px]">{aed(v as number)}</p>
                <p className="text-[12.5px] text-muted">{k}</p>
              </div>
            ))}
          </div>
          {rewards.length > 0 && (
            <ul className="mt-3 divide-y divide-line rounded-[18px] border border-line bg-white">
              {rewards.map((r) => (
                <li key={r.id} className="flex items-center justify-between px-4 py-3 text-[14px]">
                  <span>
                    {REWARD_LABEL[r.kind]} · {r.personLabel}
                    <span className="block text-[12px] text-muted">{date(r.createdAt)}</span>
                  </span>
                  <span className="font-figure font-semibold">
                    {aed(r.amount)} <span className="ml-1 text-[12px] font-medium text-muted">{r.status === "paid" ? "paid" : "due"}</span>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <aside className="space-y-4">
          <div className="rounded-[20px] border border-line bg-white p-5">
            <h3 className="text-[16px] font-bold">How you earn</h3>
            <ul className="mt-3 space-y-3 text-[14px] text-ink-2">
              <li className="flex justify-between gap-3">
                <span>A renter you referred moves in</span> <span className="font-figure shrink-0 font-bold text-ink">{aed(REFERRAL_REWARDS.tenant_move_in)}</span>
              </li>
              <li className="flex justify-between gap-3">
                <span>An owner you referred gets their first tenant</span> <span className="font-figure shrink-0 font-bold text-ink">{aed(REFERRAL_REWARDS.owner_first_fill)}</span>
              </li>
            </ul>
            <p className="mt-4 text-[12.5px] leading-relaxed text-muted">Paid by Stayshay to your WhatsApp-linked account after the move-in is confirmed. It's a referral reward, not a brokerage fee, and renters never pay for it.</p>
          </div>
          <PartnerForm initial={partner} />
        </aside>
      </div>
    </div>
  );
}

function PartnerForm({ initial }: { initial: PartnerDraft }) {
  const [f, setF] = useState(initial);
  const [open, setOpen] = useState(!!initial.status);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [photo, setPhoto] = useState<File | null>(null);
  const set = (k: keyof PartnerDraft) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setF({ ...f, [k]: e.target.value });

  if (!open)
    return (
      <div className="rounded-[20px] bg-brand p-5 text-white">
        <h3 className="text-[16px] font-bold">Broker or agent?</h3>
        <p className="mt-2 text-[14px] leading-relaxed text-white/80">Get a public partner profile on Stayshay. Everyone who finds you there joins under your code, so every move-in counts for you.</p>
        <button onClick={() => setOpen(true)} className="mt-4 h-11 w-full rounded-[12px] bg-[#6ee7b7] text-[14.5px] font-bold text-brand-deep shadow-[0_0_24px_rgb(110_231_183/0.4)]">
          Create partner profile
        </button>
      </div>
    );

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    setErrors({});
    const fd = new FormData();
    for (const k of ["name", "company", "brn", "bio", "areas", "languages", "phone"] as const) fd.set(k, f[k]);
    if (photo) fd.set("photo", photo);
    const res = await fetch("/api/partners", { method: "POST", body: fd }).catch(() => null);
    const j = await res?.json().catch(() => ({}));
    setBusy(false);
    if (res?.ok) {
      setF({ ...f, status: "pending" });
      setMsg("Sent for review. We usually approve within a day.");
    } else setErrors(j?.errors ?? { form: "Couldn't save. Try again." });
  };

  return (
    <form onSubmit={submit} className="space-y-3 rounded-[20px] border border-line bg-white p-5">
      <div className="flex items-center justify-between">
        <h3 className="text-[16px] font-bold">Partner profile</h3>
        {f.status && <span className="rounded-full bg-surface px-2.5 py-1 text-[11.5px] font-semibold text-ink-2">{f.status === "approved" ? "Live" : f.status === "pending" ? "In review" : "Hidden"}</span>}
      </div>
      <input className={field} placeholder="Your name" value={f.name} onChange={set("name")} />
      {errors.name && <p className="text-[12.5px] text-warn">{errors.name}</p>}
      <input className={field} placeholder="Company (optional)" value={f.company} onChange={set("company")} />
      <input className={field} placeholder="RERA / BRN number (optional)" value={f.brn} onChange={set("brn")} />
      <textarea className={`${field} min-h-[96px]`} placeholder="How you help people find a place (areas, budgets, languages)" value={f.bio} onChange={set("bio")} />
      {errors.bio && <p className="text-[12.5px] text-warn">{errors.bio}</p>}
      <input className={field} placeholder="Areas you cover, comma separated" value={f.areas} onChange={set("areas")} />
      <input className={field} placeholder="Languages, comma separated" value={f.languages} onChange={set("languages")} />
      <input className={field} placeholder="WhatsApp (private, for payouts)" value={f.phone} onChange={set("phone")} inputMode="tel" />
      {errors.phone && <p className="text-[12.5px] text-warn">{errors.phone}</p>}
      <label className="block text-[13px] text-muted">
        Photo (optional)
        <input type="file" accept="image/*" className="mt-1 block w-full text-[13px]" onChange={(e) => setPhoto(e.target.files?.[0] ?? null)} />
      </label>
      {errors.form && <p className="text-[12.5px] text-warn">{errors.form}</p>}
      {msg && <p className="rounded-[12px] bg-mint px-3 py-2 text-[13px] text-brand">{msg}</p>}
      <button disabled={busy} className="h-11 w-full rounded-[12px] bg-brand text-[14.5px] font-semibold text-white disabled:opacity-60">
        {busy ? "Saving" : initial.status ? "Update profile" : "Submit for review"}
      </button>
      <p className="text-[12px] leading-relaxed text-muted">Your number stays private. Renters contact you through Stayshay, never directly.</p>
    </form>
  );
}
