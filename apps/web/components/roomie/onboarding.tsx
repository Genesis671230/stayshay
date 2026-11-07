"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { LIFESTYLE_LABEL, validateLead, type Area } from "@stayshay/core/src/client.ts";
import { AREA_BY_SLUG } from "@stayshay/core/src/client.ts";
import type { PublicRoommate, RoommatePrefs } from "@/lib/roommates";
import { AreaCombobox } from "../search-bar";
import { Icon, aed } from "../ui";
import { track } from "../analytics";
import { CheckedBadge, Portrait, areasText, moveInText } from "./parts";

/**
 * Roommate profile onboarding, one question per screen like a story. Everything typed is kept on this
 * device as a draft (so a refresh or a dropped connection loses nothing) and checked step by step;
 * the last screen shows the exact card other people will swipe on.
 */

type Mode = "looking" | "has_place";
type Gender = "" | "female" | "male";
interface Draft {
  mode: Mode | "";
  name: string;
  gender: Gender;
  age: string;
  nationality: string;
  profession: string;
  budget: number;
  moveIn: string;
  areas: string[];
  anywhere: boolean;
  lifestyle: string[];
  about: string;
  phone: string;
  seeking: RoommatePrefs["seeking"];
  ages: string[];
  mustHave: string[];
}

interface Hints {
  fit: number;
  total: number;
  typicalBudget: number | null;
  popularAreas: string[];
  popularHabits: string[];
}

const DRAFT_KEY = "stayshay:roomie-draft:v2";
const addDays = (n: number) => new Date(Date.now() + n * 86400000).toISOString().slice(0, 10);
const LIFESTYLE_GROUPS: { title: string; options: string[] }[] = [
  { title: "Your rhythm", options: [LIFESTYLE_LABEL.early_riser, "Night owl", "Night shift", "Works from home"] },
  { title: "At home", options: [LIFESTYLE_LABEL.quiet, LIFESTYLE_LABEL.social, "Cooks daily", "Very tidy"] },
  { title: "Habits", options: [LIFESTYLE_LABEL.non_smoker, LIFESTYLE_LABEL.pet_friendly, "Gym regular", "Vegetarian", "Prays regularly", "Student"] },
];
const ABOUT_PROMPTS = ["On a weekday I usually…", "I’m looking for someone who…", "At home I’m the one who…", "Weekends are for…"];
const MAX_LIFESTYLE = 8;

const AGE_BANDS: [string, number, number][] = [
  ["18–24", 18, 24],
  ["25–34", 25, 34],
  ["35–44", 35, 44],
  ["45+", 45, 99],
];
const MUST_HAVES = [LIFESTYLE_LABEL.non_smoker, LIFESTYLE_LABEL.quiet, "Very tidy", LIFESTYLE_LABEL.early_riser, LIFESTYLE_LABEL.pet_friendly, "Works from home", "Cooks daily", LIFESTYLE_LABEL.social];
const agesToRange = (bands: string[]) => {
  const sel = AGE_BANDS.filter(([l]) => bands.includes(l));
  return sel.length ? { ageMin: Math.min(...sel.map((b) => b[1])), ageMax: Math.max(...sel.map((b) => b[2])) } : { ageMin: null, ageMax: null };
};
const rangeToAges = (min: number | null, max: number | null) => (min || max ? AGE_BANDS.filter(([, a, b]) => b >= (min ?? 18) && a <= (max ?? 99)).map(([l]) => l) : []);

const STEPS = ["intent", "you", "photo", "budget", "areas", "lifestyle", "prefs", "about", "contact", "preview"] as const;
type Step = (typeof STEPS)[number];

type Existing = PublicRoommate & { status?: string; prefs?: RoommatePrefs | null };

function blank(me: { name: string; phone: string | null } | null, existing: Existing | null): Draft {
  if (existing)
    return {
      mode: existing.mode,
      name: existing.firstName,
      gender: existing.gender,
      age: existing.age ? String(existing.age) : "",
      nationality: existing.nationality,
      profession: existing.profession,
      budget: existing.budget,
      moveIn: existing.moveIn < addDays(0) ? addDays(7) : existing.moveIn,
      areas: existing.areaSlugs,
      anywhere: !existing.areaSlugs.length,
      lifestyle: existing.lifestyle,
      about: existing.about,
      phone: me?.phone ? `+${me.phone}` : "",
      seeking: existing.prefs?.seeking ?? "any",
      ages: rangeToAges(existing.prefs?.ageMin ?? null, existing.prefs?.ageMax ?? null),
      mustHave: existing.prefs?.mustHave ?? [],
    };
  return { mode: "", name: me?.name.split(/\s+/)[0] ?? "", gender: "", age: "", nationality: "", profession: "", budget: 1500, moveIn: addDays(14), areas: [], anywhere: false, lifestyle: [], about: "", phone: me?.phone ? `+${me.phone}` : "", seeking: "any", ages: [], mustHave: [] };
}

export function RoomieOnboarding({
  me,
  existing = null,
  onDone,
  onCancel,
}: {
  me: { name: string; phone: string | null; email: string } | null;
  existing?: Existing | null;
  onDone: (r: { updated: boolean }) => void;
  onCancel?: () => void;
}) {
  const editing = !!existing;
  const [d, setD] = useState<Draft>(() => blank(me, existing));
  const [i, setI] = useState(editing ? 1 : 0);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [photo, setPhoto] = useState<File | null>(null);
  const [removePhoto, setRemovePhoto] = useState(false);
  const [busy, setBusy] = useState(false);
  const [restored, setRestored] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);
  const preview = useMemo(() => (photo ? URL.createObjectURL(photo) : null), [photo]);
  useEffect(() => () => void (preview && URL.revokeObjectURL(preview)), [preview]);
  const step: Step = STEPS[i];

  // Live hints from people already on Stayshay (counts and typical numbers only), refreshed as answers change.
  const [hints, setHints] = useState<Hints | null>(null);
  const hintKey = `${d.gender}|${d.budget}|${d.anywhere ? "" : d.areas.join(",")}|${d.seeking}|${d.ages.join(",")}`;
  useEffect(() => {
    if (!d.gender) return;
    const t = setTimeout(() => {
      const r = agesToRange(d.ages);
      const q = new URLSearchParams({ gender: d.gender, budget: String(d.budget), areas: d.anywhere ? "" : d.areas.join(","), seeking: d.seeking, ...(r.ageMin && { ageMin: String(r.ageMin) }), ...(r.ageMax && { ageMax: String(r.ageMax) }) });
      fetch(`/api/swipe/suggest?${q}`, { cache: "no-store" })
        .then((x) => x.json())
        .then((j) => j.ok && setHints(j))
        .catch(() => {});
    }, 350);
    return () => clearTimeout(t);
  }, [hintKey]); // eslint-disable-line react-hooks/exhaustive-deps

  // The account can load after this screen opens: fill in the name and number once it does, never over what was typed.
  useEffect(() => {
    if (!me) return;
    setD((x) => ({ ...x, name: x.name || me.name.split(/\s+/)[0] || "", phone: x.phone || (me.phone ? `+${me.phone}` : "") }));
  }, [me?.name, me?.phone]); // eslint-disable-line react-hooks/exhaustive-deps

  // Restore a draft for a new profile (not when editing: then the saved profile is the source of truth).
  useEffect(() => {
    if (editing) return;
    try {
      const saved = JSON.parse(localStorage.getItem(DRAFT_KEY) ?? "null") as { d: Draft; i: number } | null;
      if (saved?.d && saved.d.mode && saved.i > 0) {
        setD((cur) => ({ ...cur, ...saved.d, phone: saved.d.phone || cur.phone, name: saved.d.name || cur.name }));
        setI(Math.min(Math.max(0, saved.i), STEPS.length - 2));
        setRestored(true);
      }
    } catch {
      /* storage blocked */
    }
  }, [editing]);
  useEffect(() => {
    if (editing) return;
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify({ d, i }));
    } catch {
      /* storage blocked */
    }
  }, [d, i, editing]);

  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => {
    setD((x) => ({ ...x, [k]: v }));
    setErrors((e) => {
      const n = { ...e };
      delete n[k as string];
      delete n.form;
      return n;
    });
  };

  const check = (s: Step): Record<string, string> => {
    const e: Record<string, string> = {};
    if (s === "intent" && !d.mode) e.mode = "Choose one to continue";
    if (s === "you") {
      if (d.name.trim().length < 2) e.name = "Add your first name";
      if (!d.gender) e.gender = "Choose one. Shared flats here are ladies-only or men-only.";
      const age = Number(d.age);
      if (!d.age) e.age = "Add your age";
      else if (!Number.isInteger(age) || age < 18 || age > 99) e.age = "You need to be 18 or over";
    }
    if (s === "budget") {
      if (d.budget < 300 || d.budget > 30000) e.budget = "Pick a monthly budget";
      if (!d.moveIn || d.moveIn < addDays(-1)) e.moveIn = "Pick a date from today on";
    }
    if (s === "areas" && !d.anywhere && !d.areas.length) e.areas = "Add at least one area, or choose Anywhere in Dubai";
    if (s === "contact") {
      const digits = d.phone.replace(/\D/g, "");
      if (digits.length < 9 || digits.length > 15) e.phone = "Add a WhatsApp number we can reach you on";
    }
    return e;
  };

  const go = (dir: 1 | -1) => {
    if (dir === 1) {
      const e = check(step);
      setErrors(e);
      if (Object.keys(e).length) return;
      track("roomie_onboarding_step", { step, editing });
    }
    setRestored(false);
    setI((x) => Math.min(STEPS.length - 1, Math.max(0, x + dir)));
    if (typeof window !== "undefined") document.getElementById("roomie-top")?.scrollIntoView({ block: "nearest" });
  };

  const pickPhoto = (f: File | undefined) => {
    if (!f) return;
    if (!/^image\/(jpeg|png|webp|heic|heif|avif)$/.test(f.type) && !/\.(heic|heif)$/i.test(f.name)) return setErrors({ photo: "Use a JPG, PNG, WebP or HEIC photo" });
    if (f.size > 10 * 1024 * 1024) return setErrors({ photo: "That photo is over 10 MB. Try a smaller one." });
    setErrors({});
    setPhoto(f);
    setRemovePhoto(false);
  };

  const submit = async () => {
    for (const s of STEPS) {
      const e = check(s);
      if (Object.keys(e).length) {
        setErrors(e);
        setI(STEPS.indexOf(s));
        return;
      }
    }
    const payload = {
      kind: "roommate",
      mode: d.mode,
      name: d.name.trim(),
      phone: d.phone,
      email: me?.email ?? "",
      age: d.age,
      gender: d.gender,
      nationality: d.nationality,
      profession: d.profession,
      budget: d.budget,
      moveIn: d.moveIn,
      areaSlugs: d.anywhere ? [] : d.areas,
      lifestyle: d.lifestyle,
      about: d.about,
    };
    const v = validateLead(payload);
    if (!v.ok) {
      setErrors({ form: Object.values(v.errors)[0] ?? "Please check your details." });
      if (v.errors.phone) setI(STEPS.indexOf("contact"));
      return;
    }
    setBusy(true);
    const body = new FormData();
    body.set("profile", JSON.stringify({ ...payload, public: true, removePhoto, prefs: { seeking: d.mode === "has_place" ? "looking" : d.seeking, ...agesToRange(d.ages), mustHave: d.mustHave } }));
    if (photo) body.set("photo", photo);
    const res = await fetch("/api/roommates", { method: "POST", body }).catch(() => null);
    const j = await res?.json().catch(() => null);
    setBusy(false);
    if (!res?.ok || !j?.ok) {
      const errs = (j?.errors ?? {}) as Record<string, string>;
      setErrors({ form: Object.values(errs)[0] ?? "We couldn’t save that. Check your connection and try again. Your answers are saved." });
      return;
    }
    try {
      localStorage.removeItem(DRAFT_KEY);
    } catch {}
    track(editing ? "roomie_profile_updated" : "roomie_profile_created", { mode: d.mode });
    onDone({ updated: !!j.updated });
  };

  const photoSrc = preview ?? (removePhoto ? null : (existing?.photo ?? null));
  const card = {
    firstName: d.name.trim().split(/\s+/)[0] || "You",
    gender: (d.gender || "female") as "female" | "male",
    photo: photoSrc,
  };
  const err = (k: string) => errors[k] && <p className="roomie-in mt-2 text-[13.5px] font-medium text-[#ff9db8]">{errors[k]}</p>;
  const input = "h-14 w-full rounded-[18px] border border-white/12 bg-white/[0.06] px-4 text-[16px] text-white placeholder:text-white/35 outline-none transition focus:border-lime focus:bg-white/[0.09]";
  const chip = (on: boolean) => `h-11 rounded-full border px-4 text-[14.5px] font-medium transition active:scale-95 ${on ? "border-lime bg-lime text-brand-deep" : "border-white/14 bg-white/[0.05] text-white/85 hover:border-white/30"}`;

  return (
    <div className="flex min-h-[640px] flex-col" id="roomie-top">
      {/* story progress */}
      <div className="flex gap-1.5 px-5 pt-5">
        {STEPS.map((s, n) => (
          <span key={s} className="h-[3px] flex-1 overflow-hidden rounded-full bg-white/15">
            {n <= i && <span className="block h-full origin-left rounded-full bg-lime" style={{ animation: n === i ? "roomie-bar .45s ease-out both" : undefined }} />}
          </span>
        ))}
      </div>
      <div className="flex items-center justify-between px-5 pt-3 text-[13px] text-white/50">
        {i > 0 ? (
          <button onClick={() => go(-1)} className="-ml-2 flex h-9 items-center gap-1 rounded-full px-2 font-semibold text-white/80 hover:bg-white/10">
            <Icon name="chevron-left" size={16} /> Back
          </button>
        ) : (
          <span />
        )}
        <span>
          {i + 1} of {STEPS.length}
        </span>
        {onCancel ? (
          <button onClick={onCancel} className="-mr-2 h-9 rounded-full px-3 font-semibold text-white/80 hover:bg-white/10">
            Close
          </button>
        ) : (
          <span />
        )}
      </div>

      <div key={step} className="roomie-in flex-1 px-5 pb-6 pt-4">
        {restored && i > 0 && step !== "preview" && (
          <p className="mb-4 rounded-[14px] bg-white/[0.06] px-3.5 py-2.5 text-[13px] text-white/70">We kept your answers from last time. Carry on where you left off.</p>
        )}

        {step === "intent" && (
          <>
            <H>{editing ? "Edit your profile" : "Let’s find your people."}</H>
            <P>What are you after? This decides who sees you first.</P>
            <div className="mt-7 grid gap-3">
              {(
                [
                  ["looking", "I’m looking for a place", "Find someone with a room, or a flatmate to rent with", "search"],
                  ["has_place", "I have a place", "Fill a room or a bed in your flat", "key"],
                ] as const
              ).map(([m, t, sub, icon]) => (
                <button
                  key={m}
                  onClick={() => {
                    set("mode", m);
                    setTimeout(() => setI(1), 160);
                  }}
                  className={`flex items-center gap-4 rounded-[24px] border p-5 text-left transition active:scale-[0.98] ${d.mode === m ? "border-lime bg-lime/10" : "border-white/12 bg-white/[0.04] hover:border-white/30"}`}
                >
                  <span className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-[18px] ${d.mode === m ? "bg-lime text-brand-deep" : "bg-white/10 text-white"}`}>
                    <Icon name={icon} size={22} />
                  </span>
                  <span>
                    <span className="block text-[18px] font-bold">{t}</span>
                    <span className="mt-0.5 block text-[14px] text-white/60">{sub}</span>
                  </span>
                </button>
              ))}
            </div>
            {err("mode")}
          </>
        )}

        {step === "you" && (
          <>
            <H>About you</H>
            <P>Only your first name is shown. Never your surname or number.</P>
            <div className="mt-6 space-y-4">
              <label className="block">
                <L>First name</L>
                <input className={input} value={d.name} onChange={(e) => set("name", e.target.value)} autoComplete="given-name" maxLength={40} placeholder="Your first name" />
                {err("name")}
              </label>
              <div>
                <L>I am</L>
                <div className="grid grid-cols-2 gap-2">
                  {(
                    [
                      ["female", "Female"],
                      ["male", "Male"],
                    ] as const
                  ).map(([g, t]) => (
                    <button key={g} onClick={() => set("gender", g)} className={`h-14 rounded-[18px] border text-[16px] font-semibold transition ${d.gender === g ? "border-lime bg-lime text-brand-deep" : "border-white/12 bg-white/[0.06]"}`}>
                      {t}
                    </button>
                  ))}
                </div>
                {err("gender")}
              </div>
              <label className="block">
                <L>Age</L>
                <input className={input} value={d.age} onChange={(e) => set("age", e.target.value.replace(/\D/g, "").slice(0, 2))} inputMode="numeric" placeholder="e.g. 27" />
                {err("age")}
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label className="block">
                  <L optional>Nationality</L>
                  <input className={input} value={d.nationality} onChange={(e) => set("nationality", e.target.value)} maxLength={40} placeholder="Indian, Filipino…" />
                </label>
                <label className="block">
                  <L optional>Work</L>
                  <input className={input} value={d.profession} onChange={(e) => set("profession", e.target.value)} maxLength={60} placeholder="Nurse, student…" />
                </label>
              </div>
            </div>
          </>
        )}

        {step === "photo" && (
          <>
            <H>Add your photo</H>
            <P>A clear, recent photo of your face. People connect with faces, and our team checks every photo.</P>
            <div className="mt-7 flex flex-col items-center">
              <button onClick={() => fileInput.current?.click()} className="group relative h-[300px] w-[240px] overflow-hidden rounded-[32px] border-2 border-dashed border-white/20 bg-white/[0.04] transition hover:border-lime">
                {photoSrc ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={photoSrc} alt="Your photo" className="h-full w-full object-cover" />
                ) : (
                  <span className="flex h-full flex-col items-center justify-center gap-3 text-white/70">
                    <span className="flex h-16 w-16 items-center justify-center rounded-full bg-lime text-[32px] font-light leading-none text-brand-deep">+</span>
                    <span className="text-[15px] font-semibold">Choose a photo</span>
                    <span className="text-[12.5px] text-white/45">JPG, PNG or HEIC · up to 10 MB</span>
                  </span>
                )}
              </button>
              <input ref={fileInput} type="file" accept="image/jpeg,image/png,image/webp,image/heic,image/heif,.heic" className="hidden" onChange={(e) => pickPhoto(e.target.files?.[0])} />
              {photoSrc && (
                <div className="mt-4 flex gap-2">
                  <button onClick={() => fileInput.current?.click()} className="h-10 rounded-full bg-white/10 px-4 text-[14px] font-semibold">
                    Change
                  </button>
                  <button
                    onClick={() => {
                      setPhoto(null);
                      setRemovePhoto(true);
                    }}
                    className="h-10 rounded-full px-4 text-[14px] font-semibold text-white/60"
                  >
                    Remove
                  </button>
                </div>
              )}
              {err("photo")}
              <ul className="mt-6 space-y-1.5 text-[13px] text-white/55">
                <li>Just you, face visible, no sunglasses</li>
                <li>We crop it square and remove location data</li>
              </ul>
            </div>
          </>
        )}

        {step === "budget" && (
          <>
            <H>{d.mode === "has_place" ? "What’s the rent for the space?" : "What’s your monthly budget?"}</H>
            <P>Per person, per month. We use it to show you people who fit.</P>
            <div className="mt-8 text-center">
              <p className="font-figure text-[54px] font-bold leading-none tracking-[-0.03em]">
                {aed(d.budget)}
                <span className="text-[16px] font-medium text-white/50"> /mo</span>
              </p>
              <input
                type="range"
                min={500}
                max={8000}
                step={50}
                value={Math.min(8000, d.budget)}
                onChange={(e) => set("budget", Number(e.target.value))}
                className="mt-6 w-full accent-[#d3f0b9]"
                aria-label="Monthly budget"
              />
              <div className="mt-3 flex flex-wrap justify-center gap-2">
                {[800, 1200, 1800, 2500, 3500].map((b) => (
                  <button key={b} onClick={() => set("budget", b)} className={chip(d.budget === b)}>
                    {b.toLocaleString("en-US")}
                  </button>
                ))}
              </div>
              {err("budget")}
              {hints?.typicalBudget && (
                <button onClick={() => set("budget", hints.typicalBudget!)} className="mt-4 text-[13.5px] text-white/60">
                  People like you budget about <b className="text-lime">{aed(hints.typicalBudget)}</b>. Tap to use it
                </button>
              )}
            </div>
            <div className="mt-9">
              <L>{d.mode === "has_place" ? "Available from" : "Move-in"}</L>
              <div className="flex flex-wrap gap-2">
                {(
                  [
                    ["As soon as possible", 0],
                    ["In 2 weeks", 14],
                    ["Next month", 30],
                    ["In 2 months", 60],
                  ] as const
                ).map(([t, n]) => (
                  <button key={t} onClick={() => set("moveIn", addDays(n))} className={chip(d.moveIn === addDays(n))}>
                    {t}
                  </button>
                ))}
              </div>
              <input type="date" className={`${input} mt-3 [color-scheme:dark]`} min={addDays(0)} value={d.moveIn} onChange={(e) => set("moveIn", e.target.value)} aria-label="Move-in date" />
              {err("moveIn")}
            </div>
          </>
        )}

        {step === "areas" && (
          <>
            <H>{d.mode === "has_place" ? "Where’s your place?" : "Where would you like to live?"}</H>
            <P>Up to 5 areas. Near your work or a metro line works well.</P>
            <div className="mt-6 rounded-[18px] bg-white px-4 py-3 text-ink">
              <AreaCombobox
                value={null}
                onChange={(a: Area | null) => {
                  if (!a) return;
                  set("anywhere", false);
                  set("areas", d.areas.includes(a.slug) ? d.areas : [...d.areas, a.slug].slice(0, 5));
                }}
              />
            </div>
            {!!hints?.popularAreas.filter((a) => !d.areas.includes(a)).length && d.areas.length < 5 && (
              <div className="mt-4">
                <p className="mb-2 text-[12.5px] font-semibold uppercase tracking-[0.08em] text-white/45">Popular with roommates</p>
                <div className="flex flex-wrap gap-2">
                  {hints.popularAreas
                    .filter((a) => !d.areas.includes(a))
                    .map((a) => (
                      <button
                        key={a}
                        onClick={() => {
                          set("anywhere", false);
                          set("areas", [...d.areas, a].slice(0, 5));
                        }}
                        className="h-10 rounded-full border border-dashed border-white/25 px-3.5 text-[13.5px] text-white/80"
                      >
                        + {AREA_BY_SLUG.get(a)?.name ?? a}
                      </button>
                    ))}
                </div>
              </div>
            )}
            {d.areas.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {d.areas.map((s) => (
                  <button key={s} onClick={() => set("areas", d.areas.filter((x) => x !== s))} className="flex h-10 items-center gap-2 rounded-full bg-lime pl-4 pr-3 text-[14px] font-semibold text-brand-deep">
                    {AREA_BY_SLUG.get(s)?.name ?? s} <Icon name="close" size={14} />
                  </button>
                ))}
              </div>
            )}
            <button
              onClick={() => {
                set("anywhere", !d.anywhere);
                if (!d.anywhere) set("areas", []);
              }}
              className={`mt-5 flex w-full items-center justify-between rounded-[18px] border p-4 text-left transition ${d.anywhere ? "border-lime bg-lime/10" : "border-white/12 bg-white/[0.04]"}`}
            >
              <span>
                <span className="block text-[15.5px] font-semibold">Anywhere in Dubai</span>
                <span className="text-[13px] text-white/55">I’m flexible on the area</span>
              </span>
              <span className={`flex h-6 w-6 items-center justify-center rounded-full ${d.anywhere ? "bg-lime text-brand-deep" : "border border-white/30"}`}>{d.anywhere && <Icon name="check" size={14} />}</span>
            </button>
            {err("areas")}
          </>
        )}

        {step === "lifestyle" && (
          <>
            <H>How do you live?</H>
            <P>
              Pick what’s true for you, up to {MAX_LIFESTYLE}. This is how we find people you’ll actually get on with.
            </P>
            <div className="mt-6 space-y-6">
              {LIFESTYLE_GROUPS.map((g) => (
                <div key={g.title}>
                  <L>{g.title}</L>
                  <div className="flex flex-wrap gap-2">
                    {g.options.map((t) => {
                      const on = d.lifestyle.includes(t);
                      return (
                        <button
                          key={t}
                          onClick={() => set("lifestyle", on ? d.lifestyle.filter((x) => x !== t) : d.lifestyle.length >= MAX_LIFESTYLE ? d.lifestyle : [...d.lifestyle, t])}
                          className={chip(on)}
                          aria-pressed={on}
                        >
                          {t}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {step === "prefs" && (
          <>
            <H>Who would you like to live with?</H>
            <P>We show you these people first. Only you see this.</P>
            {d.mode !== "has_place" && (
              <div className="mt-6">
                <L>Looking for</L>
                <div className="grid gap-2">
                  {(
                    [
                      ["has_place", "Someone with a room", "They have the flat, you move in"],
                      ["looking", "Someone to search with", "Find a place together"],
                      ["any", "Either is fine", ""],
                    ] as const
                  ).map(([v, t, sub]) => (
                    <button key={v} onClick={() => set("seeking", v)} className={`flex items-center justify-between rounded-[18px] border px-4 py-3.5 text-left transition ${d.seeking === v ? "border-lime bg-lime/10" : "border-white/12 bg-white/[0.04]"}`}>
                      <span>
                        <span className="block text-[15.5px] font-semibold">{t}</span>
                        {sub && <span className="text-[13px] text-white/55">{sub}</span>}
                      </span>
                      <span className={`flex h-6 w-6 items-center justify-center rounded-full ${d.seeking === v ? "bg-lime text-brand-deep" : "border border-white/30"}`}>{d.seeking === v && <Icon name="check" size={14} />}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
            <div className="mt-6">
              <L>Age</L>
              <div className="flex flex-wrap gap-2">
                {AGE_BANDS.map(([l]) => {
                  const on = d.ages.includes(l);
                  return (
                    <button key={l} onClick={() => set("ages", on ? d.ages.filter((x) => x !== l) : [...d.ages, l])} className={chip(on)} aria-pressed={on}>
                      {l}
                    </button>
                  );
                })}
                <button onClick={() => set("ages", [])} className={chip(!d.ages.length)}>
                  Any age
                </button>
              </div>
            </div>
            <div className="mt-6">
              <L>Must-haves</L>
              <div className="flex flex-wrap gap-2">
                {MUST_HAVES.map((t) => {
                  const on = d.mustHave.includes(t);
                  return (
                    <button key={t} onClick={() => set("mustHave", on ? d.mustHave.filter((x) => x !== t) : [...d.mustHave, t].slice(0, 6))} className={chip(on)} aria-pressed={on}>
                      {t}
                    </button>
                  );
                })}
              </div>
            </div>
          </>
        )}

        {step === "about" && (
          <>
            <H>Say hi in your own words</H>
            <P>{d.mode === "has_place" ? "The room, the flat, who lives there now, and who’d fit in." : "Your routine and the kind of flatmate you’d like."}</P>
            <div className="mt-5 flex gap-2 overflow-x-auto pb-1 roomie-scroll">
              {ABOUT_PROMPTS.map((p) => (
                <button key={p} onClick={() => set("about", `${d.about}${d.about && !/\s$/.test(d.about) ? " " : ""}${p} `.slice(0, 400))} className="h-10 shrink-0 rounded-full border border-white/14 bg-white/[0.05] px-3.5 text-[13.5px] text-white/80">
                  {p}
                </button>
              ))}
            </div>
            <textarea
              value={d.about}
              onChange={(e) => set("about", e.target.value.slice(0, 400))}
              maxLength={400}
              rows={6}
              placeholder="Tap a prompt above or just write…"
              className="mt-3 w-full resize-none rounded-[20px] border border-white/12 bg-white/[0.06] p-4 text-[16px] leading-relaxed text-white placeholder:text-white/35 outline-none focus:border-lime"
            />
            <p className="mt-1.5 text-right text-[12.5px] text-white/45">{d.about.length}/400 · numbers and links are removed from public profiles</p>
          </>
        )}

        {step === "contact" && (
          <>
            <H>Where can we reach you?</H>
            <P>Your number is never shown on your profile. We only use it to tell you about connections and to help you meet safely.</P>
            <label className="mt-6 block">
              <L>WhatsApp number</L>
              <input className={input} type="tel" inputMode="tel" autoComplete="tel" value={d.phone} onChange={(e) => set("phone", e.target.value)} placeholder="050 123 4567" />
              {err("phone")}
            </label>
            {me?.email && (
              <p className="mt-4 rounded-[16px] bg-white/[0.05] p-4 text-[13.5px] text-white/65">
                Signed in as <b className="text-white">{me.email}</b>
              </p>
            )}
          </>
        )}

        {step === "preview" && (
          <>
            <H>{editing ? "Looking good" : "This is you"}</H>
            <P>This is the card people swipe on. Our team checks it before it goes live, usually within a few hours{editing ? "; changes show once approved" : ""}.</P>
            <div className="mx-auto mt-6 max-w-[330px]">
              <div className="relative aspect-[3/4.1] overflow-hidden rounded-[30px] bg-white/5 shadow-[0_30px_70px_rgb(0_0_0/0.5)]">
                <Portrait p={card} />
                <div className="absolute inset-0 bg-[linear-gradient(180deg,rgb(0_0_0/0)_45%,rgb(8_14_12/0.95)_100%)]" />
                <span className={`absolute left-4 top-4 rounded-full px-3 py-1 text-[12px] font-bold ${d.mode === "has_place" ? "bg-lime text-brand-deep" : "bg-white text-brand-deep"}`}>{d.mode === "has_place" ? "Has a place" : "Looking to share"}</span>
                <div className="absolute inset-x-0 bottom-0 p-5">
                  <p className="flex items-center gap-2 text-[28px] font-bold leading-none">
                    {card.firstName}
                    {d.age ? `, ${d.age}` : ""} <CheckedBadge />
                  </p>
                  <p className="mt-2 text-[13.5px] text-white/75">{[d.nationality, d.profession].filter(Boolean).join(" · ")}</p>
                  <p className="mt-1 text-[13.5px] font-semibold">
                    {aed(d.budget)}/mo · {areasText({ areaSlugs: d.anywhere ? [] : d.areas })} · {moveInText(d.moveIn)}
                  </p>
                  {d.lifestyle.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {d.lifestyle.slice(0, 4).map((t) => (
                        <span key={t} className="rounded-full bg-white/12 px-2.5 py-1 text-[11.5px]">
                          {t}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              {!photoSrc && (
                <button onClick={() => setI(STEPS.indexOf("photo"))} className="mt-4 w-full rounded-[16px] bg-white/[0.06] p-3 text-[13.5px] text-white/75">
                  No photo yet. <b className="text-lime">Add one</b> so people know who they’re talking to.
                </button>
              )}
              <div className="mt-4 grid grid-cols-3 gap-2 text-[12.5px]">
                {(
                  [
                    ["About you", "you"],
                    ["Budget", "budget"],
                    ["Areas", "areas"],
                  ] as const
                ).map(([t, s]) => (
                  <button key={s} onClick={() => setI(STEPS.indexOf(s))} className="h-10 rounded-full border border-white/12 text-white/70">
                    Edit {t.toLowerCase()}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}

        {hints && hints.total > 0 && (step === "budget" || step === "areas" || step === "prefs") && (
          <p className="roomie-in mt-7 flex items-center gap-2 rounded-full bg-white/[0.06] px-4 py-2.5 text-[13.5px] text-white/75">
            <span className="h-2 w-2 shrink-0 rounded-full bg-[#5ee08c]" />
            {hints.fit > 0 ? (
              <span>
                <b className="text-white">{hints.fit}</b> {hints.fit === 1 ? "person fits" : "people fit"} so far
              </span>
            ) : (
              <span>No exact fits yet. Widen the budget or areas to see more people.</span>
            )}
          </p>
        )}

        {errors.form && <p className="roomie-in mt-5 rounded-[16px] bg-[#ff6fa5]/15 p-3.5 text-[14px] font-medium text-[#ffc2d6]">{errors.form}</p>}
      </div>

      {/* sticky action */}
      {step !== "intent" && (
        <div className="sticky bottom-[76px] z-10 bg-[linear-gradient(180deg,rgb(16_22_20/0)_0%,#101614_30%)] px-5 pb-5 pt-6 md:bottom-0">
          {step === "preview" ? (
            <button onClick={submit} disabled={busy} className="h-14 w-full rounded-full bg-lime text-[16.5px] font-bold text-brand-deep transition active:scale-[0.98] disabled:opacity-60">
              {busy ? "Saving…" : editing ? "Save changes" : "Publish my profile"}
            </button>
          ) : (
            <button onClick={() => go(1)} className="flex h-14 w-full items-center justify-center gap-2 rounded-full bg-white text-[16px] font-bold text-brand-deep transition active:scale-[0.98]">
              {step === "photo" && !photoSrc ? "Skip for now" : "Continue"} <Icon name="arrow-right" size={17} />
            </button>
          )}
        </div>
      )}
    </div>
  );
}

const H = ({ children }: { children: React.ReactNode }) => <h2 className="text-[30px] font-bold leading-[1.08] tracking-[-0.03em]">{children}</h2>;
const P = ({ children }: { children: React.ReactNode }) => <p className="mt-2 text-[15px] leading-relaxed text-white/60">{children}</p>;
const L = ({ children, optional = false }: { children: React.ReactNode; optional?: boolean }) => (
  <span className="mb-2 block text-[13px] font-semibold uppercase tracking-[0.08em] text-white/50">
    {children} {optional && <span className="normal-case tracking-normal text-white/35">(optional)</span>}
  </span>
);
