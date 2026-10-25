"use client";

import { useMemo, useRef, useState } from "react";
import { AREA_BY_SLUG, BRAND, LIFESTYLE_LABEL, leadMessage, validateLead, type Area, type RoommateLead } from "@stayshay/core";
import type { PublicRoommate } from "@/lib/roommates";
import { AreaCombobox } from "./search-bar";
import { Shay } from "./shay";
import { Icon, aed } from "./ui";
import { stayshayWhatsapp } from "@/lib/contact";
import { QuickSignIn, useMe } from "./quick-signin";
import { useEffect } from "react";

const LIFESTYLE = [...Object.values(LIFESTYLE_LABEL), "Works from home", "Night shift", "Cooks daily", "Gym regular", "Vegetarian", "Prays regularly", "Student"];
const field = "w-full rounded-[14px] border border-line bg-white px-4 py-3 text-[15px] focus:border-brand focus:outline-none";
const areaName = (s: string) => AREA_BY_SLUG.get(s)?.name ?? s;
const addDays = (n: number) => new Date(Date.now() + n * 86400000).toISOString().slice(0, 10);
const when = (iso: string) => {
  const d = Math.round((Date.parse(`${iso}T00:00:00`) - Date.now()) / 86400000);
  return d <= 0 ? "Now" : d <= 7 ? "This week" : d <= 31 ? "This month" : new Date(`${iso}T00:00:00`).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
};

/* ---------------- card (shared by the board and the live preview) ---------------- */

type CardData = Pick<PublicRoommate, "firstName" | "age" | "gender" | "nationality" | "profession" | "budget" | "areaSlugs" | "moveIn" | "lifestyle" | "about" | "mode"> & { photo: string | null };

function RoommateCard({ p, action, preview = false }: { p: CardData; action?: React.ReactNode; preview?: boolean }) {
  return (
    <article className={`flex h-full flex-col overflow-hidden rounded-[24px] border border-line bg-white ${preview ? "shadow-[0_20px_50px_rgb(20_92_70/0.14)]" : "transition-shadow hover:shadow-[0_14px_40px_rgb(20_92_70/0.10)]"}`}>
      <div className="relative aspect-[4/3] bg-mint">
        {p.photo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={p.photo} alt={p.firstName} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center">
            <span className="flex h-24 w-24 items-center justify-center rounded-full bg-white text-[40px] font-extrabold text-brand">{(p.firstName || "?")[0]?.toUpperCase()}</span>
          </div>
        )}
        <span className={`absolute left-3 top-3 rounded-full px-3 py-1 text-[12px] font-bold ${p.mode === "has_place" ? "bg-brand text-white" : "bg-white text-brand"}`}>{p.mode === "has_place" ? "Has a place" : "Looking to share"}</span>
        <span className="absolute bottom-3 left-3 rounded-full bg-white px-3 py-1.5 text-[14px] shadow-md">
          <span className="font-extrabold">{aed(p.budget)}</span>
          <span className="text-muted">/mo</span>
        </span>
      </div>
      <div className="flex flex-1 flex-col p-4">
        <p className="text-[17px] font-bold tracking-[-0.01em]">
          {p.firstName || "Your name"}
          {p.age ? `, ${p.age}` : ""}
        </p>
        <p className="text-[13px] text-muted">{[p.gender === "female" ? "Female" : p.gender === "male" ? "Male" : "", p.nationality, p.profession].filter(Boolean).join(" · ") || "Tell us a little about you"}</p>
        <p className="mt-2 flex items-center gap-1.5 text-[13px] text-ink-2">
          <Icon name="pin" size={14} className="shrink-0 text-brand" />
          <span className="truncate">{p.areaSlugs.length ? p.areaSlugs.map(areaName).join(", ") : "Any area"}</span>
          <span className="shrink-0 text-muted">· {when(p.moveIn)}</span>
        </p>
        {p.lifestyle.length > 0 && (
          <div className="mt-2.5 flex flex-wrap gap-1.5">
            {p.lifestyle.slice(0, 4).map((t) => (
              <span key={t} className="rounded-full bg-mint px-2.5 py-1 text-[11.5px] font-semibold text-brand">
                {t}
              </span>
            ))}
          </div>
        )}
        {p.about && <p className="mt-2.5 line-clamp-2 text-[13px] italic leading-relaxed text-ink-2">“{p.about}”</p>}
        {action && <div className="mt-auto pt-4">{action}</div>}
      </div>
    </article>
  );
}

/* ---------------- board ---------------- */

function Board({ profiles }: { profiles: PublicRoommate[] }) {
  const [mode, setMode] = useState<"all" | "looking" | "has_place">("all");
  const [gender, setGender] = useState<"all" | "female" | "male">("all");
  const [max, setMax] = useState<number | null>(null);
  const [area, setArea] = useState<Area | null>(null);
  const shown = profiles.filter(
    (p) => (mode === "all" || p.mode === mode) && (gender === "all" || p.gender === gender) && (!max || p.budget <= max) && (!area || p.areaSlugs.includes(area.slug) || !p.areaSlugs.length),
  );
  const chip = (on: boolean) => `h-9 rounded-full border px-4 text-[13.5px] font-medium ${on ? "border-brand bg-brand text-white" : "border-line bg-white text-ink-2 hover:border-brand"}`;

  return (
    <section id="board" className="mx-auto max-w-[1240px] px-4 py-14 md:px-8">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="eyebrow">People looking right now</p>
          <h2 className="font-display mt-2 text-[30px] leading-tight md:text-[40px]">Find someone to share with</h2>
        </div>
        <p className="text-[14px] text-muted">
          {profiles.length} profile{profiles.length === 1 ? "" : "s"} · checked by our team · numbers stay private
        </p>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-2">
        {(
          [
            ["all", "Everyone"],
            ["looking", "Looking to share"],
            ["has_place", "Has a place"],
          ] as const
        ).map(([k, l]) => (
          <button key={k} onClick={() => setMode(k)} className={chip(mode === k)}>
            {l}
          </button>
        ))}
        <span className="mx-1 h-6 w-px bg-line-strong" />
        {(
          [
            ["all", "Any"],
            ["female", "Female"],
            ["male", "Male"],
          ] as const
        ).map(([k, l]) => (
          <button key={k} onClick={() => setGender(k)} className={chip(gender === k)}>
            {l}
          </button>
        ))}
        <span className="mx-1 h-6 w-px bg-line-strong" />
        {[1000, 1500, 2500].map((b) => (
          <button key={b} onClick={() => setMax(max === b ? null : b)} className={chip(max === b)}>
            Up to {b.toLocaleString("en-US")}
          </button>
        ))}
        <div className="w-full rounded-full border border-line bg-white px-4 py-1.5 sm:ml-auto sm:w-[260px]">
          <AreaCombobox value={area} onChange={setArea} />
        </div>
      </div>

      {shown.length ? (
        <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {shown.map((p) => (
            <RoommateCard
              key={p.id}
              p={p}
              action={
                <a
                  href={stayshayWhatsapp(`Hi Stayshay, I'd like to connect with ${p.firstName} (roommate profile ${p.id}). Here's a bit about me: `)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-11 w-full items-center justify-center gap-2 rounded-full bg-whatsapp text-[14px] font-semibold text-white hover:brightness-95"
                >
                  <Icon name="whatsapp" size={16} /> Connect with {p.firstName}
                </a>
              }
            />
          ))}
        </div>
      ) : (
        <div className="mt-6 flex flex-col items-center rounded-[28px] border border-dashed border-line-strong bg-white px-6 py-14 text-center">
          <Shay size={96} mood="happy" />
          <p className="mt-4 text-[18px] font-bold">{profiles.length ? "Nobody matches those filters yet" : "Be one of the first profiles"}</p>
          <p className="mt-1 max-w-[440px] text-[14.5px] text-muted">Create your profile below. Once our team checks it, it appears here for others looking in your area.</p>
          <a href="#profile" className="mt-5 inline-flex h-11 items-center gap-2 rounded-full bg-brand px-5 text-[14px] font-semibold text-white">
            Create my profile <Icon name="arrow-right" size={15} />
          </a>
        </div>
      )}
    </section>
  );
}

/* ---------------- profile wizard ---------------- */

const STEPS = ["You", "Budget & area", "How you live", "Contact"];

function ProfileWizard({ signedIn }: { signedIn: { name: string; phone: string | null; email: string } | null }) {
  const [step, setStep] = useState(0);
  const [mode, setMode] = useState<RoommateLead["mode"]>("looking");
  const [f, setF] = useState({
    name: signedIn?.name ?? "",
    phone: signedIn?.phone ? `+${signedIn.phone}` : "",
    email: signedIn?.email ?? "",
    age: "",
    gender: "" as "" | "male" | "female",
    nationality: "",
    profession: "",
    about: "",
  });
  const [budget, setBudget] = useState(1500);
  const [moveIn, setMoveIn] = useState(addDays(14));
  const [areas, setAreas] = useState<Area[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [photo, setPhoto] = useState<File | null>(null);
  const [isPublic, setIsPublic] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<{ lead: RoommateLead; listed: boolean } | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const preview = useMemo(() => (photo ? URL.createObjectURL(photo) : null), [photo]);
  const { google } = useMe();
  const DRAFT = "stayshay:roommate-draft";

  // Back from Google sign-in: restore what they'd typed (the photo has to be picked again).
  useEffect(() => {
    try {
      const d = JSON.parse(sessionStorage.getItem(DRAFT) ?? "null");
      if (!d) return;
      sessionStorage.removeItem(DRAFT);
      setMode(d.mode);
      setF((x) => ({ ...d.f, name: x.name || d.f.name, phone: x.phone || d.f.phone, email: x.email || d.f.email }));
      setBudget(d.budget);
      setMoveIn(d.moveIn);
      setTags(d.tags);
      setAreas(d.areas);
      setStep(3);
      document.getElementById("profile")?.scrollIntoView();
    } catch {}
  }, []);
  const saveDraft = () => {
    try {
      sessionStorage.setItem(DRAFT, JSON.stringify({ mode, f, budget, moveIn, tags, areas }));
    } catch {}
  };

  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setF({ ...f, [k]: e.target.value });
  const card: CardData = {
    firstName: f.name.trim().split(/\s+/)[0] ?? "",
    age: Number(f.age) || null,
    gender: (f.gender || "female") as "male" | "female",
    nationality: f.nationality,
    profession: f.profession,
    budget,
    areaSlugs: areas.map((a) => a.slug),
    moveIn,
    lifestyle: tags,
    about: f.about,
    mode,
    photo: preview,
  };

  const stepValid = (s: number): Record<string, string> => {
    const e: Record<string, string> = {};
    if (s === 0) {
      if (f.name.trim().length < 2) e.name = "Add your name";
      if (!f.gender) e.gender = "Pick one";
      if (f.age && (Number(f.age) < 18 || Number(f.age) > 99)) e.age = "18 or over";
    }
    return e;
  };

  const next = () => {
    const e = stepValid(step);
    setErrors(e);
    if (!Object.keys(e).length) setStep((s) => Math.min(STEPS.length - 1, s + 1));
  };

  const submit = async () => {
    const payload = { kind: "roommate", mode, ...f, budget, moveIn, areaSlugs: areas.map((a) => a.slug), lifestyle: tags };
    const check = validateLead(payload);
    setErrors(check.errors);
    if (!check.ok || !check.value) {
      if (check.errors.name || check.errors.gender || check.errors.age) setStep(0);
      return;
    }
    setBusy(true);
    const body = new FormData();
    body.set("profile", JSON.stringify({ ...payload, public: isPublic }));
    if (photo && isPublic) body.set("photo", photo);
    const res = await fetch("/api/roommates", { method: "POST", body }).catch(() => null);
    setBusy(false);
    if (!res?.ok) {
      setErrors({ form: "We couldn't save that. Check your connection and try again." });
      return;
    }
    setDone({ lead: check.value as RoommateLead, listed: isPublic });
  };

  if (done) {
    return (
      <div className="shay-pop grid grid-cols-1 items-center gap-8 rounded-[32px] bg-white p-6 ring-1 ring-line md:grid-cols-[1fr_320px] md:p-10">
        <div>
          <Shay size={84} mood="happy" />
          <h2 className="font-display mt-4 text-[30px] leading-tight">You’re in, {card.firstName}!</h2>
          <p className="mt-2 max-w-[460px] text-[15px] leading-relaxed text-ink-2">
            {done.listed ? "Our team will check your profile and put it on the board, usually within a few hours. " : ""}
            We’ll WhatsApp you when we find someone who fits your budget, area and routine. Meet in person before you agree anything, and never pay before seeing the place.
          </p>
          <a
            href={stayshayWhatsapp(leadMessage(done.lead, areaName))}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-6 inline-flex h-12 items-center gap-2 rounded-full bg-whatsapp px-6 text-[15px] font-semibold text-white"
          >
            <Icon name="whatsapp" size={18} /> Say hi on WhatsApp too
          </a>
        </div>
        {done.listed && <RoommateCard p={card} preview />}
      </div>
    );
  }

  const chip = (on: boolean) => `rounded-full border px-4 py-2 text-[14px] font-medium transition-colors ${on ? "border-brand bg-mint text-brand" : "border-line bg-white text-ink-2 hover:border-brand"}`;
  const err = (k: string) => (errors[k] ? <span className="mt-1 block text-[12.5px] font-medium text-warn">{errors[k]}</span> : null);

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1.25fr)_340px]">
      <div className="rounded-[32px] bg-white p-5 ring-1 ring-line md:p-8">
        <ol className="flex items-center gap-2" aria-label="Steps">
          {STEPS.map((s, i) => (
            <li key={s} className="flex flex-1 flex-col gap-1.5">
              <span className={`h-1.5 rounded-full transition-colors ${i <= step ? "bg-brand" : "bg-line"}`} />
              <span className={`hidden text-[12px] sm:block ${i === step ? "font-bold text-brand" : "text-muted"}`}>{s}</span>
            </li>
          ))}
        </ol>

        <div key={step} className="shay-pop mt-7 min-h-[360px]">
          {step === 0 && (
            <div className="space-y-5">
              <h3 className="text-[24px] font-extrabold tracking-[-0.03em]">Let’s start with you</h3>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {(
                  [
                    ["looking", "I’m looking to share", "Find someone to rent with", "search"],
                    ["has_place", "I have a place", "Find a flatmate for my room", "key"],
                  ] as const
                ).map(([m, t, d, icon]) => (
                  <button key={m} type="button" onClick={() => setMode(m)} className={`flex items-center gap-3 rounded-[20px] border-2 p-4 text-left transition-colors ${mode === m ? "border-brand bg-mint/50" : "border-line hover:border-line-strong"}`}>
                    <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${mode === m ? "bg-brand text-white" : "bg-surface text-brand"}`}>
                      <Icon name={icon} size={19} />
                    </span>
                    <span>
                      <span className="block text-[15.5px] font-bold">{t}</span>
                      <span className="block text-[13px] text-muted">{d}</span>
                    </span>
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-5">
                <button
                  type="button"
                  onClick={() => fileInput.current?.click()}
                  className="group relative flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-dashed border-line-strong bg-surface hover:border-brand"
                  aria-label="Add a profile photo"
                >
                  {preview ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={preview} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <span className="flex flex-col items-center text-[11.5px] font-semibold text-muted group-hover:text-brand">
                      <Icon name="users" size={22} />
                      Add photo
                    </span>
                  )}
                </button>
                <input
                  ref={fileInput}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/heic"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file && file.size > 10 * 1024 * 1024) setErrors({ photo: "Photo is over 10 MB" });
                    else {
                      setErrors({});
                      setPhoto(file ?? null);
                    }
                  }}
                />
                <div className="text-[13.5px] text-muted">
                  <p className="font-semibold text-ink">A friendly photo gets 3× more replies</p>
                  <p>Your face, good light. We crop it square.</p>
                  {photo && (
                    <button type="button" onClick={() => setPhoto(null)} className="mt-1 text-[12.5px] font-semibold text-warn">
                      Remove
                    </button>
                  )}
                  {err("photo")}
                </div>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-[1fr_120px]">
                <label className="block">
                  <span className="mb-1.5 block text-[13px] font-semibold">Your name</span>
                  <input className={field} value={f.name} onChange={set("name")} autoComplete="name" placeholder="e.g. Aisha Khan" />
                  {err("name")}
                </label>
                <label className="block">
                  <span className="mb-1.5 block text-[13px] font-semibold">Age</span>
                  <input className={field} value={f.age} onChange={(e) => setF({ ...f, age: e.target.value.replace(/\D/g, "").slice(0, 2) })} inputMode="numeric" placeholder="27" />
                  {err("age")}
                </label>
              </div>
              <div>
                <span className="mb-1.5 block text-[13px] font-semibold">I am</span>
                <div className="flex gap-2">
                  {(["female", "male"] as const).map((g) => (
                    <button key={g} type="button" onClick={() => setF({ ...f, gender: g })} className={chip(f.gender === g)}>
                      {g === "female" ? "Female" : "Male"}
                    </button>
                  ))}
                </div>
                {err("gender")}
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-6">
              <h3 className="text-[24px] font-extrabold tracking-[-0.03em]">{mode === "has_place" ? "Your place and the rent" : "Your budget and where"}</h3>
              <div>
                <div className="flex items-baseline justify-between">
                  <span className="text-[13px] font-semibold">{mode === "has_place" ? "Rent for your roommate" : "Monthly budget"}</span>
                  <span className="text-[26px] font-extrabold tracking-[-0.03em] text-brand">{aed(budget)}</span>
                </div>
                <input type="range" min={500} max={8000} step={50} value={budget} onChange={(e) => setBudget(Number(e.target.value))} className="mt-2 w-full accent-[var(--brand)]" aria-label="Budget" />
                <div className="mt-2 flex flex-wrap gap-2">
                  {[800, 1200, 1500, 2000, 3000].map((b) => (
                    <button key={b} type="button" onClick={() => setBudget(b)} className={chip(budget === b)}>
                      {b.toLocaleString("en-US")}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <span className="mb-1.5 block text-[13px] font-semibold">{mode === "has_place" ? "Where is it?" : "Areas you’d live in (up to 5)"}</span>
                <div className="rounded-[14px] border border-line px-4 py-2.5">
                  <AreaCombobox value={null} onChange={(a) => a && !areas.some((x) => x.slug === a.slug) && areas.length < 5 && setAreas([...areas, a])} />
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {areas.map((a) => (
                    <button key={a.slug} type="button" onClick={() => setAreas(areas.filter((x) => x.slug !== a.slug))} className="flex items-center gap-1.5 rounded-full bg-brand px-3 py-1.5 text-[13px] font-medium text-white">
                      {a.name} <Icon name="close" size={12} />
                    </button>
                  ))}
                  {!areas.length && <span className="text-[13px] text-muted">No area = flexible</span>}
                </div>
              </div>
              <div>
                <span className="mb-1.5 block text-[13px] font-semibold">Move-in</span>
                <div className="flex flex-wrap gap-2">
                  {(
                    [
                      ["As soon as possible", 0],
                      ["In 2 weeks", 14],
                      ["Next month", 30],
                    ] as const
                  ).map(([l, d]) => (
                    <button key={l} type="button" onClick={() => setMoveIn(addDays(d))} className={chip(moveIn === addDays(d))}>
                      {l}
                    </button>
                  ))}
                  <input type="date" min={addDays(0)} value={moveIn} onChange={(e) => setMoveIn(e.target.value)} className="rounded-full border border-line px-4 py-2 text-[14px]" />
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-5">
              <h3 className="text-[24px] font-extrabold tracking-[-0.03em]">How do you live?</h3>
              <div className="flex flex-wrap gap-2">
                {LIFESTYLE.map((t) => (
                  <button key={t} type="button" onClick={() => setTags(tags.includes(t) ? tags.filter((x) => x !== t) : [...tags, t])} className={chip(tags.includes(t))}>
                    {tags.includes(t) && <Icon name="check" size={13} className="-ml-1 mr-1 inline" />}
                    {t}
                  </button>
                ))}
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-1.5 block text-[13px] font-semibold">Nationality <span className="font-normal text-muted">(optional)</span></span>
                  <input className={field} value={f.nationality} onChange={set("nationality")} />
                </label>
                <label className="block">
                  <span className="mb-1.5 block text-[13px] font-semibold">Work <span className="font-normal text-muted">(optional)</span></span>
                  <input className={field} value={f.profession} onChange={set("profession")} placeholder="Nurse, retail, student…" />
                </label>
              </div>
              <label className="block">
                <span className="mb-1.5 flex justify-between text-[13px] font-semibold">
                  A few words about you <span className="font-normal text-muted">{f.about.length}/400</span>
                </span>
                <textarea className={`${field} min-h-[100px]`} maxLength={400} value={f.about} onChange={set("about")} placeholder={mode === "has_place" ? "The room, the flat, who lives there now…" : "Your routine, what kind of flatmate you’d like…"} />
              </label>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-5">
              <h3 className="text-[24px] font-extrabold tracking-[-0.03em]">Where can we reach you?</h3>
              {!signedIn && <QuickSignIn next="/roommates#profile" google={google} onBeforeLeave={saveDraft} note="Fills in your name and email. You can still choose what’s public." />}
              <label className="block">
                <span className="mb-1.5 block text-[13px] font-semibold">WhatsApp number</span>
                <input className={field} type="tel" inputMode="tel" value={f.phone} onChange={set("phone")} placeholder="050 123 4567" autoComplete="tel" />
                {err("phone")}
              </label>
              <label className="block">
                <span className="mb-1.5 block text-[13px] font-semibold">Email <span className="font-normal text-muted">(optional)</span></span>
                <input className={field} type="email" value={f.email} onChange={set("email")} autoComplete="email" />
              </label>
              <label className="flex cursor-pointer items-start gap-3 rounded-[18px] bg-surface p-4">
                <input type="checkbox" checked={isPublic} onChange={(e) => setIsPublic(e.target.checked)} className="mt-0.5 h-5 w-5 accent-[var(--brand)]" />
                <span className="text-[14px] leading-relaxed">
                  <span className="font-semibold">Show my profile on the public board.</span> Your first name, photo, age, budget, areas and habits. <span className="font-semibold">Never your number.</span> Our team checks every profile first, and you can ask us to remove it any time.
                </span>
              </label>
              {errors.form && <p className="rounded-[12px] bg-warn-bg px-3.5 py-2.5 text-[13.5px] font-medium text-warn">{errors.form}</p>}
            </div>
          )}
        </div>

        <div className="mt-6 flex items-center justify-between border-t border-line pt-5">
          {step > 0 ? (
            <button type="button" onClick={() => setStep(step - 1)} className="flex h-12 items-center gap-1 px-2 text-[14.5px] font-semibold text-ink-2">
              <Icon name="chevron-left" size={16} /> Back
            </button>
          ) : (
            <span />
          )}
          {step < STEPS.length - 1 ? (
            <button type="button" onClick={next} className="flex h-12 items-center gap-2 rounded-full bg-brand px-7 text-[15px] font-semibold text-white">
              Continue <Icon name="arrow-right" size={16} />
            </button>
          ) : (
            <button type="button" onClick={submit} disabled={busy} className="flex h-12 items-center gap-2 rounded-full bg-brand px-7 text-[15px] font-semibold text-white disabled:opacity-50">
              {busy ? "Saving…" : isPublic ? "Publish my profile" : "Send my profile"}
            </button>
          )}
        </div>
      </div>

      <aside className="hidden lg:block">
        <div className="sticky top-[96px]">
          <p className="mb-3 text-[13px] font-semibold text-muted">Live preview of your card</p>
          <RoommateCard p={card} preview />
          <p className="mt-3 flex items-center gap-2 text-[12.5px] text-muted">
            <Icon name="shield" size={14} className="text-brand" /> Your number is never shown on the board.
          </p>
        </div>
      </aside>
    </div>
  );
}

/* ---------------- page ---------------- */

export function RoommatesPage({ profiles, me }: { profiles: PublicRoommate[]; me: { name: string; phone: string | null; email: string } | null }) {
  return (
    <main>
      <section className="px-2 pt-2 md:px-4 md:pt-3">
        <div className="relative overflow-hidden rounded-[28px] bg-brand">
          <div className="absolute -right-16 -top-16 h-72 w-72 rounded-full bg-white/5" />
          <div className="absolute -bottom-24 right-40 h-56 w-56 rounded-full bg-white/5" />
          <div className="relative mx-auto grid max-w-[1240px] grid-cols-1 items-center gap-6 px-5 py-12 md:grid-cols-[1fr_auto] md:px-10 md:py-16">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full bg-mint px-3.5 py-1.5 text-[12.5px] font-semibold text-brand">
                <Icon name="users" size={14} /> Roommate matching · free
              </span>
              <h1 className="font-display mt-5 max-w-[720px] text-[38px] leading-[1.04] text-white md:text-[58px]">Find a roommate you’d actually live with.</h1>
              <p className="mt-4 max-w-[560px] text-[16.5px] leading-relaxed text-white/85">Browse people already looking, or add your own profile with a photo. We match budgets, areas and routines, and introduce you on WhatsApp.</p>
              <div className="mt-7 flex flex-wrap gap-3">
                <a href="#board" className="flex h-12 items-center gap-2 rounded-full bg-white px-6 text-[15px] font-semibold text-brand">
                  Browse {profiles.length ? `${profiles.length} ${profiles.length === 1 ? "person" : "people"}` : "people"}
                </a>
                <a href="#profile" className="flex h-12 items-center gap-2 rounded-full border border-white/40 px-6 text-[15px] font-semibold text-white hover:bg-white/10">
                  Create my profile <Icon name="arrow-right" size={16} />
                </a>
              </div>
            </div>
            <div className="hidden h-56 w-56 items-center justify-center rounded-full bg-white md:flex">
              <Shay size={170} mood="happy" />
            </div>
          </div>
        </div>
      </section>

      <Board profiles={profiles} />

      <section id="profile" className="bg-surface">
        <div className="mx-auto max-w-[1240px] px-4 py-14 md:px-8">
          <p className="eyebrow">Your profile</p>
          <h2 className="font-display mt-2 text-[30px] leading-tight md:text-[40px]">Tell people who you are</h2>
          <p className="mb-8 mt-2 max-w-[560px] text-[15px] text-muted">Four quick steps. You’ll see your card come together on the right.</p>
          <ProfileWizard signedIn={me} />
          <p className="mt-6 text-center text-[13px] text-muted">
            Questions? WhatsApp {BRAND.whatsappDisplay}. Stay safe: meet in a public place first and never send money before you’ve seen the room.
          </p>
        </div>
      </section>
    </main>
  );
}
