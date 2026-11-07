"use client";

import Link from "next/link";
import { useState } from "react";
import { CAMPAIGN, type CampaignTrack } from "@/lib/campaign";
import { stayshayWhatsapp } from "@/lib/contact";
import { track as ga } from "./analytics";
import { pingWa } from "./wa-button";
import { Icon } from "./ui";

const field = "h-12 w-full rounded-[14px] border border-line bg-white px-4 text-[15.5px] focus:border-brand focus:outline-none";

/** Three things only: which challenge, your name, your WhatsApp. */
export function CampaignApply({ initial = "referrals" }: { initial?: CampaignTrack }) {
  const [track, setTrack] = useState<CampaignTrack>(initial);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [website, setWebsite] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const t = CAMPAIGN.tracks.find((x) => x.key === track)!;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const res = await fetch("/api/campaign", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ name, phone, track, website }) }).catch(() => null);
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
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-deep text-white">
          <Icon name="check" size={22} />
        </span>
        <p className="font-display mt-4 text-[26px] text-brand-deep">You’re in, {name.split(" ")[0]}.</p>
        <p className="mt-2 text-[15px] text-brand-deep/80">We’ll confirm on WhatsApp. Get your personal link so everyone you bring is counted for you.</p>
        <Link href="/login?next=/account/referrals" className="mt-5 inline-flex h-12 items-center rounded-[14px] bg-brand-deep px-6 text-[15px] font-semibold text-white">
          Get my link
        </Link>
      </div>
    );

  const err = (k: string) => errors[k] && <p className="mt-1 text-[13px] text-[#b42318]">{errors[k]}</p>;
  return (
    <form onSubmit={submit} className="rounded-[24px] border border-line bg-white p-5 shadow-[0_8px_30px_rgb(0_0_0/0.05)] md:p-7">
      <p className="font-display text-[26px] leading-tight">Join in 20 seconds</p>
      <p className="mt-1 text-[14px] text-ink-2">Free. Your number stays private.</p>

      <p className="mt-5 text-[13px] font-semibold text-ink-2">1. Pick a challenge</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {CAMPAIGN.tracks.map((x) => (
          <button type="button" key={x.key} onClick={() => setTrack(x.key)} className={`flex h-10 items-center gap-2 rounded-full border px-4 text-[13.5px] font-semibold transition ${track === x.key ? "border-brand-deep bg-brand-deep text-white" : "border-line text-ink-2 hover:border-brand-deep"}`}>
            <Icon name={x.icon} size={15} /> {x.title}
          </button>
        ))}
      </div>
      <p className="mt-3 text-[13.5px] text-ink-2">
        <b className="text-ink">AED {t.reward.toLocaleString("en-US")}</b> when {t.target.charAt(0).toLowerCase() + t.target.slice(1)}.
      </p>
      {err("track")}

      <p className="mt-5 text-[13px] font-semibold text-ink-2">2. Your details</p>
      <div className="mt-2 space-y-2.5">
        <div>
          <input className={field} value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" placeholder="Your name" aria-label="Your name" />
          {err("name")}
        </div>
        <div>
          <input className={field} value={phone} onChange={(e) => setPhone(e.target.value)} inputMode="tel" autoComplete="tel" placeholder="WhatsApp number, e.g. 050 123 4567" aria-label="WhatsApp number" />
          {err("phone")}
        </div>
      </div>
      <input tabIndex={-1} autoComplete="off" aria-hidden className="hidden" value={website} onChange={(e) => setWebsite(e.target.value)} />
      {err("form")}
      <button disabled={busy} className="mt-5 flex h-12 w-full items-center justify-center rounded-[14px] bg-brand-deep text-[15.5px] font-semibold text-white transition hover:bg-brand disabled:opacity-60">
        {busy ? "Sending…" : "Join the challenge"}
      </button>
      <a
        href={stayshayWhatsapp(`Hi Stayshay, I want to join the challenge: ${t.title}.`)}
        target="_blank"
        rel="noopener noreferrer"
        onClick={() => pingWa("campaign", t.title)}
        className="mt-3 flex items-center justify-center gap-2 text-[14px] font-semibold text-ink-2 hover:text-[#1da851]"
      >
        <Icon name="whatsapp" size={16} /> Or join on WhatsApp
      </a>
    </form>
  );
}
