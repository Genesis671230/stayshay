"use client";

import Link from "next/link";
import { useState } from "react";
import { CAMPAIGN, type CampaignTrack } from "@/lib/campaign";
import { stayshayWhatsapp } from "@/lib/contact";
import { track as ga } from "./analytics";
import { pingWa } from "./wa-button";
import { Icon } from "./ui";

const field = "w-full rounded-[12px] border border-line bg-white px-3.5 py-3 text-[15px] focus:border-brand focus:outline-none";

export function CampaignApply({ initial = "referrals" }: { initial?: CampaignTrack }) {
  const [track, setTrack] = useState<CampaignTrack>(initial);
  const [f, setF] = useState({ name: "", phone: "", role: "", reach: "", note: "", website: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const t = CAMPAIGN.tracks.find((x) => x.key === track)!;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const res = await fetch("/api/campaign", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ ...f, track }) }).catch(() => null);
    const j = res ? await res.json().catch(() => ({})) : {};
    setBusy(false);
    if (res?.ok) {
      ga("generate_lead", { method: "campaign", track });
      setDone(true);
    } else setErrors(j.errors ?? { form: "Something went wrong. Try WhatsApp instead." });
  };

  if (done)
    return (
      <div className="rounded-[24px] bg-lime p-6 md:p-8">
        <p className="font-display text-[26px] text-brand-deep">You’re in, {f.name.split(" ")[0]}.</p>
        <p className="mt-2 text-[15px] text-brand-deep/80">We’ll WhatsApp you to confirm. Next: get your personal link so every person you bring is tracked to you.</p>
        <Link href="/login?next=/account/referrals" className="mt-5 inline-flex h-12 items-center rounded-[12px] bg-brand-deep px-6 text-[15px] font-semibold text-white">
          Get my tracking link
        </Link>
      </div>
    );

  const err = (k: string) => errors[k] && <p className="mt-1 text-[13px] text-[#b42318]">{errors[k]}</p>;
  return (
    <form onSubmit={submit} className="rounded-[24px] border border-line bg-white p-5 shadow-[0_8px_30px_rgb(0_0_0/0.05)] md:p-7">
      <p className="font-display text-[26px] leading-tight">Join the challenge</p>
      <p className="mt-1 text-[14px] text-ink-2">Free to join. Your number stays private.</p>

      <div className="mt-5 grid grid-cols-2 gap-2">
        {CAMPAIGN.tracks.map((x) => (
          <button type="button" key={x.key} onClick={() => setTrack(x.key)} className={`rounded-[14px] border p-3 text-left transition ${track === x.key ? "border-brand bg-mint" : "border-line hover:border-brand"}`}>
            <span className="block text-[14px] font-semibold">
              {x.icon} {x.title}
            </span>
            <span className="font-figure text-[13px] text-brand">AED {x.reward.toLocaleString("en-US")}</span>
          </button>
        ))}
      </div>
      {err("track")}
      <p className="mt-3 rounded-[12px] bg-surface px-3.5 py-2.5 text-[13.5px] text-ink-2">
        <b className="text-ink">AED {t.reward.toLocaleString("en-US")}</b> when {t.target.charAt(0).toLowerCase() + t.target.slice(1)}.
      </p>

      <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="text-[13px] font-semibold text-ink-2">Your name</span>
          <input className={`${field} mt-1.5`} value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} autoComplete="name" />
          {err("name")}
        </label>
        <label className="block">
          <span className="text-[13px] font-semibold text-ink-2">WhatsApp number</span>
          <input className={`${field} mt-1.5`} value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} inputMode="tel" autoComplete="tel" placeholder="050 123 4567" />
          {err("phone")}
        </label>
        <label className="block">
          <span className="text-[13px] font-semibold text-ink-2">You are (optional)</span>
          <input className={`${field} mt-1.5`} value={f.role} onChange={(e) => setF({ ...f, role: e.target.value })} placeholder="Agent, owner, HR, student…" maxLength={60} />
        </label>
        <label className="block">
          <span className="text-[13px] font-semibold text-ink-2">How many could you bring? (optional)</span>
          <input className={`${field} mt-1.5`} value={f.reach} onChange={(e) => setF({ ...f, reach: e.target.value })} placeholder="e.g. 10 people, 20 beds" maxLength={60} />
        </label>
      </div>
      <input tabIndex={-1} autoComplete="off" aria-hidden className="hidden" value={f.website} onChange={(e) => setF({ ...f, website: e.target.value })} />
      {err("form")}
      <button disabled={busy} className="mt-6 flex h-12 w-full items-center justify-center rounded-[12px] bg-brand-deep text-[15.5px] font-semibold text-white disabled:opacity-60">
        {busy ? "Sending…" : "Apply now"}
      </button>
      <a
        href={stayshayWhatsapp(`Hi Stayshay, I want to join the challenge: ${t.title}.`)}
        target="_blank"
        rel="noopener noreferrer"
        onClick={() => pingWa("campaign", t.title)}
        className="mt-3 flex h-11 w-full items-center justify-center gap-2 rounded-[12px] border border-line text-[14.5px] font-semibold text-ink hover:border-[#25d366]"
      >
        <Icon name="whatsapp" size={17} /> Or apply on WhatsApp
      </a>
    </form>
  );
}
