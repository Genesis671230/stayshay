"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { AREA_BY_SLUG, LIFESTYLE_LABEL, PHOTOS, leadMessage, validateLead, type Area, type RoommateLead } from "@stayshay/core";
import { AreaCombobox } from "./search-bar";
import { ListingCard } from "./listing-card";
import { useMarketplace } from "./marketplace";
import { Icon, aed } from "./ui";
import { stayshayWhatsapp } from "@/lib/contact";

const LIFESTYLE = [...Object.values(LIFESTYLE_LABEL), "Works from home", "Night shift", "Cooks daily", "Gym regular", "Vegetarian"];
const field = "w-full rounded-[14px] border border-line bg-white px-4 py-3 text-[15px] focus:border-brand focus:outline-none";

function addDays(n: number) {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}

export function RoommatesPage() {
  const { all } = useMarketplace();
  const profiles = all.filter((l) => l.type === "roommate");
  const [mode, setMode] = useState<"has_place" | "looking">("looking");
  const [f, setF] = useState({ name: "", phone: "", age: "", gender: "", nationality: "", profession: "", budget: 1500, moveIn: addDays(14), about: "" });
  const [areas, setAreas] = useState<Area[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<RoommateLead | null>(null);

  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => setF({ ...f, [k]: e.target.value });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const check = validateLead({ kind: "roommate", mode, ...f, areaSlugs: areas.map((a) => a.slug), lifestyle: tags });
    setErrors(check.errors);
    if (!check.ok || !check.value) {
      document.querySelector("[data-error]")?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    const tab = window.open("about:blank", "_blank");
    setBusy(true);
    await fetch("/api/lead", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(check.value) }).catch(() => null);
    setBusy(false);
    const lead = check.value as RoommateLead;
    setDone(lead);
    const url = stayshayWhatsapp(leadMessage(lead, (s) => AREA_BY_SLUG.get(s)?.name ?? s));
    if (tab) tab.location.href = url;
    else window.location.href = url;
  };

  const err = (k: string) =>
    errors[k] ? (
      <span data-error className="mt-1 block text-[12.5px] font-medium text-warn">
        {errors[k]}
      </span>
    ) : null;

  return (
    <main>
      <section className="px-2 pt-2 md:px-4 md:pt-3">
        <div className="relative overflow-hidden rounded-[28px] bg-brand">
          <Image src={PHOTOS.categories.roommate ?? PHOTOS.hero[0]} alt="" fill priority sizes="100vw" className="object-cover opacity-25" />
          <div className="relative mx-auto max-w-[1240px] px-5 py-14 md:px-10 md:py-20">
            <span className="inline-flex items-center gap-2 rounded-full bg-mint px-3.5 py-1.5 text-[12.5px] font-semibold text-brand">
              <Icon name="users" size={14} /> Roommate matching
            </span>
            <h1 className="font-display mt-5 max-w-[760px] text-[38px] leading-[1.04] text-white md:text-[60px]">Find a roommate you’d actually live with.</h1>
            <p className="mt-4 max-w-[560px] text-[16.5px] leading-relaxed text-white/85">
              Tell us about you, your budget and how you live. We introduce you to people who fit, on WhatsApp. Free.
            </p>
            <div className="mt-8 grid max-w-[720px] grid-cols-1 gap-3 sm:grid-cols-2">
              {(
                [
                  ["looking", "I’m looking to share", "Find someone to rent a flat or room with", "search"],
                  ["has_place", "I have a place", "Find a flatmate for your spare room or bed", "key"],
                ] as const
              ).map(([m, t, d, icon]) => (
                <button
                  key={m}
                  onClick={() => {
                    setMode(m);
                    document.getElementById("profile")?.scrollIntoView({ behavior: "smooth" });
                  }}
                  className={`flex items-start gap-3 rounded-[20px] p-4 text-left transition-colors ${mode === m ? "bg-white text-ink" : "bg-white/10 text-white hover:bg-white/15"}`}
                >
                  <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${mode === m ? "bg-mint text-brand" : "bg-white/15"}`}>
                    <Icon name={icon} size={18} />
                  </span>
                  <span>
                    <span className="block text-[16px] font-bold">{t}</span>
                    <span className={`mt-0.5 block text-[13.5px] ${mode === m ? "text-muted" : "text-white/75"}`}>{d}</span>
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-[1240px] grid-cols-1 gap-10 px-4 py-14 md:px-8 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
        <div id="profile" className="rounded-[28px] border border-line bg-white p-5 md:p-8">
          {done ? (
            <div className="py-6 text-center">
              <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-mint text-brand">
                <Icon name="check" size={26} />
              </span>
              <h2 className="font-display mt-4 text-[28px]">Profile sent, {done.name.split(" ")[0]}</h2>
              <p className="mx-auto mt-2 max-w-[420px] text-[15px] text-muted">WhatsApp opened with your profile. Send the message and we’ll introduce you to matches. Never pay anyone before you’ve met them.</p>
              <a
                href={stayshayWhatsapp(leadMessage(done, (s) => AREA_BY_SLUG.get(s)?.name ?? s))}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-6 inline-flex h-12 items-center gap-2 rounded-full bg-whatsapp px-6 text-[15px] font-semibold text-white"
              >
                <Icon name="whatsapp" size={18} /> Open WhatsApp again
              </a>
            </div>
          ) : (
            <form onSubmit={submit} noValidate className="space-y-6">
              <div>
                <h2 className="font-display text-[26px]">{mode === "has_place" ? "Describe yourself and your place" : "Create your roommate profile"}</h2>
                <p className="mt-1 text-[14px] text-muted">Takes a minute. We only share it with people who match.</p>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-1.5 block text-[13px] font-semibold">Name</span>
                  <input className={field} value={f.name} onChange={set("name")} autoComplete="name" />
                  {err("name")}
                </label>
                <label className="block">
                  <span className="mb-1.5 block text-[13px] font-semibold">WhatsApp number</span>
                  <input className={field} value={f.phone} onChange={set("phone")} type="tel" inputMode="tel" placeholder="050 123 4567" autoComplete="tel" />
                  {err("phone")}
                </label>
                <div>
                  <span className="mb-1.5 block text-[13px] font-semibold">I am</span>
                  <div className="grid grid-cols-2 gap-2">
                    {(["female", "male"] as const).map((g) => (
                      <button type="button" key={g} onClick={() => setF({ ...f, gender: g })} className={`h-12 rounded-[14px] border text-[14.5px] font-medium ${f.gender === g ? "border-brand bg-brand text-white" : "border-line"}`}>
                        {g === "female" ? "Female" : "Male"}
                      </button>
                    ))}
                  </div>
                  {err("gender")}
                </div>
                <label className="block">
                  <span className="mb-1.5 block text-[13px] font-semibold">
                    Age <span className="font-normal text-muted">(optional)</span>
                  </span>
                  <input className={field} value={f.age} onChange={set("age")} inputMode="numeric" />
                  {err("age")}
                </label>
                <label className="block">
                  <span className="mb-1.5 block text-[13px] font-semibold">
                    Nationality <span className="font-normal text-muted">(optional)</span>
                  </span>
                  <input className={field} value={f.nationality} onChange={set("nationality")} />
                </label>
                <label className="block">
                  <span className="mb-1.5 block text-[13px] font-semibold">
                    Work <span className="font-normal text-muted">(optional)</span>
                  </span>
                  <input className={field} value={f.profession} onChange={set("profession")} placeholder="e.g. Nurse, retail, student" />
                </label>
              </div>

              <div>
                <span className="mb-1.5 flex justify-between text-[13px] font-semibold">
                  {mode === "has_place" ? "Rent for the roommate" : "My budget"} <span className="font-bold text-brand">{aed(f.budget)} / month</span>
                </span>
                <input type="range" min={500} max={8000} step={50} value={f.budget} onChange={(e) => setF({ ...f, budget: Number(e.target.value) })} className="w-full accent-[var(--brand)]" aria-label="Budget" />
                {err("budget")}
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <span className="mb-1.5 block text-[13px] font-semibold">{mode === "has_place" ? "Where is the place?" : "Areas I’d live in"}</span>
                  <div className="rounded-[14px] border border-line px-4 py-2.5">
                    <AreaCombobox value={null} onChange={(a) => a && !areas.some((x) => x.slug === a.slug) && areas.length < 5 && setAreas([...areas, a])} />
                  </div>
                  {areas.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {areas.map((a) => (
                        <button type="button" key={a.slug} onClick={() => setAreas(areas.filter((x) => x.slug !== a.slug))} className="flex h-8 items-center gap-1.5 rounded-full bg-brand px-3 text-[12.5px] font-medium text-white">
                          {a.name} <Icon name="close" size={12} />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <label className="block">
                  <span className="mb-1.5 block text-[13px] font-semibold">Move-in date</span>
                  <input className={field} type="date" min={addDays(0)} value={f.moveIn} onChange={set("moveIn")} />
                  {err("moveIn")}
                </label>
              </div>

              <div>
                <span className="mb-2 block text-[13px] font-semibold">How I live</span>
                <div className="flex flex-wrap gap-2">
                  {LIFESTYLE.map((t) => (
                    <button
                      type="button"
                      key={t}
                      onClick={() => setTags(tags.includes(t) ? tags.filter((x) => x !== t) : [...tags, t])}
                      aria-pressed={tags.includes(t)}
                      className={`h-9 rounded-full border px-4 text-[13.5px] font-medium ${tags.includes(t) ? "border-brand bg-mint text-brand" : "border-line text-ink-2"}`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              <label className="block">
                <span className="mb-1.5 block text-[13px] font-semibold">
                  A bit about you <span className="font-normal text-muted">(optional)</span>
                </span>
                <textarea className={`${field} min-h-[96px]`} maxLength={400} value={f.about} onChange={set("about")} placeholder={mode === "has_place" ? "The room, the flat, who lives there now…" : "Your routine, what you’re looking for…"} />
              </label>

              <button type="submit" disabled={busy} className="flex h-13 w-full items-center justify-center gap-2 rounded-full bg-whatsapp py-3.5 text-[16px] font-semibold text-white hover:brightness-95 disabled:opacity-60">
                <Icon name="whatsapp" size={19} /> {busy ? "Sending…" : "Send my profile on WhatsApp"}
              </button>
            </form>
          )}
        </div>

        <aside className="space-y-4">
          {[
            ["1", "Send your profile", "One message on WhatsApp with your budget, areas and habits."],
            ["2", "We find matches", "We check profiles and look for people with the same budget, area and routine."],
            ["3", "Meet before you move", "We introduce you on WhatsApp. Meet, view the place, then decide."],
          ].map(([n, t, d]) => (
            <div key={n} className="flex gap-4 rounded-[22px] bg-surface p-5">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand text-[14px] font-bold text-white">{n}</span>
              <span>
                <span className="block text-[16px] font-bold">{t}</span>
                <span className="mt-0.5 block text-[14px] text-muted">{d}</span>
              </span>
            </div>
          ))}
          <div className="rounded-[22px] border border-line p-5 text-[13.5px] leading-relaxed text-muted">
            <p className="flex items-center gap-2 font-semibold text-ink">
              <Icon name="shield" size={16} className="text-brand" /> Stay safe
            </p>
            <p className="mt-1.5">Meet in a public place first, view the flat together, and never send money before you’ve signed and seen the room.</p>
          </div>
        </aside>
      </section>

      <section className="mx-auto max-w-[1240px] px-4 pb-20 md:px-8">
        <h2 className="font-display text-[28px] md:text-[34px]">People looking right now</h2>
        {profiles.length ? (
          <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {profiles.map((l) => (
              <ListingCard key={l.id} listing={l} />
            ))}
          </div>
        ) : (
          <div className="mt-6 rounded-[24px] border border-dashed border-line-strong px-6 py-12 text-center">
            <p className="text-[18px] font-bold">Be one of the first profiles</p>
            <p className="mx-auto mt-1.5 max-w-[440px] text-[14.5px] text-muted">Roommate profiles appear here once they’re checked. Send yours above, or browse rooms while you wait.</p>
            <Link href="/search?type=room" className="mt-5 inline-flex h-11 items-center gap-2 rounded-full border border-brand px-5 text-[14px] font-semibold text-brand">
              Browse rooms <Icon name="arrow-right" size={15} />
            </Link>
          </div>
        )}
      </section>
    </main>
  );
}
