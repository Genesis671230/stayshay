"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AMENITY_LABEL, AREAS, AREA_BY_SLUG, TYPE_LABEL, parseListingMessage, type Amenity, type Listing, type ListingType } from "@stayshay/core";
import { AreaCombobox } from "./search-bar";
import { Icon, Logo, aed } from "./ui";

const field = "w-full rounded-[12px] border border-line bg-white px-3.5 py-2.5 text-[14.5px] focus:border-brand focus:outline-none";
const TYPES: ListingType[] = ["bed_space", "partition", "room", "studio", "roommate"];

export function AdminLogin() {
  const router = useRouter();
  const [pw, setPw] = useState("");
  const [error, setError] = useState("");
  return (
    <main className="flex min-h-screen items-center justify-center bg-surface px-4">
      <form
        className="w-full max-w-[380px] rounded-[24px] bg-white p-7 shadow-[0_20px_60px_rgb(0_0_0/0.08)]"
        onSubmit={async (e) => {
          e.preventDefault();
          const res = await fetch("/api/admin/login", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ password: pw }) });
          const j = await res.json().catch(() => ({}));
          if (res.ok) router.refresh();
          else setError(j.error ?? "Could not sign in");
        }}
      >
        <Logo />
        <h1 className="mt-6 text-[22px] font-bold">Admin</h1>
        <p className="mt-1 text-[14px] text-muted">Create listings from details listers send on WhatsApp.</p>
        <input type="password" autoFocus className={`${field} mt-5`} placeholder="Admin password" value={pw} onChange={(e) => setPw(e.target.value)} />
        {error && <p className="mt-2 text-[13px] text-warn">{error}</p>}
        <button className="mt-4 h-11 w-full rounded-full bg-brand text-[15px] font-semibold text-white">Sign in</button>
      </form>
    </main>
  );
}

export type Draft = Partial<Listing> & { amenities: Amenity[] };

export const EMPTY: Draft = {
  type: "bed_space",
  title: "",
  areaSlug: "",
  priceAed: undefined,
  deposit: 0,
  upfrontCost: 0,
  billsIncluded: true,
  gender: "any",
  occupancy: "single",
  bedsInRoom: 2,
  bedsAvailable: 1,
  amenities: ["wifi", "ac", "kitchen", "washer"],
  availability: "Ready to move",
  minimumStay: "1 month",
  noticePeriod: "1 month",
  bathroom: "Shared Bathroom",
  sleepingSet: "Full Sleeping Set",
  listerName: "",
  listerPhone: "",
  verifiedLister: false,
  compliance: { landlordConsent: false, dmPermit: false },
  description: "",
  photos: [],
  status: "live",
};

export function ListingForm({ initial, onSaved, onCancel }: { initial: Draft; onSaved: (l: Listing) => void; onCancel: () => void }) {
  const [d, setD] = useState<Draft>(initial);
  const [files, setFiles] = useState<File[]>([]);
  const [paste, setPaste] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const area = d.areaSlug ? AREA_BY_SLUG.get(d.areaSlug) ?? null : null;
  const previews = useMemo(() => files.map((f) => URL.createObjectURL(f)), [files]);
  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => setD((x) => ({ ...x, [k]: v }));

  const fill = () => {
    const p = parseListingMessage(paste, AREAS);
    setD((x) => ({
      ...x,
      ...(p.type && { type: p.type }),
      ...(p.title && { title: p.title }),
      ...(p.areaSlug && { areaSlug: p.areaSlug }),
      ...(p.priceAed && { priceAed: p.priceAed }),
      ...(p.deposit != null && { deposit: p.deposit }),
      ...(p.billsIncluded != null && { billsIncluded: p.billsIncluded, utilities: p.billsIncluded ? "All Utilities Included" : x.utilities }),
      ...(p.gender && { gender: p.gender }),
      ...(p.metro && { metro: p.metro }),
      ...(p.listerPhone && { listerPhone: p.listerPhone }),
      ...(p.description && { description: p.description }),
    }));
  };

  const save = async () => {
    setError("");
    if (!d.title || !d.areaSlug || !(Number(d.priceAed) > 0)) return setError("Title, area and price are required.");
    setBusy(true);
    const body = new FormData();
    const a = AREA_BY_SLUG.get(d.areaSlug);
    body.set(
      "listing",
      JSON.stringify({
        ...d,
        priceAed: Number(d.priceAed),
        deposit: Number(d.deposit) || 0,
        upfrontCost: Number(d.upfrontCost) || 0,
        building: d.metro ? `Near ${d.metro} Metro` : a?.name ?? "",
        areaName: a?.name,
        city: a?.emirate,
        utilities: d.billsIncluded ? d.utilities || "All Utilities Included" : d.utilities || "Not included",
        preferredTenant: d.gender === "female" ? ["Female"] : d.gender === "male" ? ["Male"] : d.occupancy === "couple" ? ["Male", "Female", "Couple"] : ["Male", "Female"],
      }),
    );
    files.forEach((f) => body.append("photos", f));
    const res = await fetch("/api/admin/listings", { method: "POST", body });
    const j = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) return setError(j.error ?? "Could not save");
    onSaved(j.listing);
  };

  const label = (t: string, el: React.ReactNode, hint?: string) => (
    <label className="block">
      <span className="mb-1 block text-[12.5px] font-semibold">
        {t} {hint && <span className="font-normal text-muted">{hint}</span>}
      </span>
      {el}
    </label>
  );

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
      <div className="space-y-3">
        <div className="rounded-[20px] bg-mint p-5">
          <p className="flex items-center gap-2 text-[14px] font-bold text-brand">
            <Icon name="whatsapp" size={16} /> Paste the lister’s WhatsApp message
          </p>
          <textarea className={`${field} mt-3 min-h-[200px]`} value={paste} onChange={(e) => setPaste(e.target.value)} placeholder={"Partition available in Al Barsha 1\nAED 1,400 all bills included\nLadies only, near Mall of the Emirates metro\nCall 050 123 4567"} />
          <button type="button" onClick={fill} disabled={!paste.trim()} className="mt-3 h-10 w-full rounded-full bg-brand text-[14px] font-semibold text-white disabled:opacity-40">
            Fill the form from this message
          </button>
          <p className="mt-2 text-[12px] text-brand/80">Price, area, type, gender, bills, deposit, metro and phone are picked up. Check every field before publishing.</p>
        </div>
        <div className="rounded-[20px] border border-line p-5">
          <p className="text-[13px] font-bold">Photos</p>
          <div className="mt-3 grid grid-cols-4 gap-2">
            {(d.photos ?? []).map((p) => (
              <button key={p} type="button" onClick={() => set("photos", (d.photos ?? []).filter((x) => x !== p))} className="group relative aspect-square overflow-hidden rounded-[10px] bg-surface" title="Remove">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p} alt="" className="h-full w-full object-cover" />
                <span className="absolute inset-0 hidden items-center justify-center bg-black/50 text-white group-hover:flex">
                  <Icon name="close" />
                </span>
              </button>
            ))}
            {previews.map((src, i) => (
              <button key={src} type="button" onClick={() => setFiles(files.filter((_, j) => j !== i))} className="group relative aspect-square overflow-hidden rounded-[10px] bg-surface" title="Remove">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={src} alt="" className="h-full w-full object-cover" />
                <span className="absolute inset-0 hidden items-center justify-center bg-black/50 text-white group-hover:flex">
                  <Icon name="close" />
                </span>
              </button>
            ))}
            <label className="flex aspect-square cursor-pointer flex-col items-center justify-center rounded-[10px] border border-dashed border-line-strong text-[11.5px] text-muted hover:border-brand hover:text-brand">
              <Icon name="grid" />
              Add
              <input type="file" accept="image/jpeg,image/png,image/webp,image/avif" multiple className="hidden" onChange={(e) => setFiles([...files, ...Array.from(e.target.files ?? [])].slice(0, 12))} />
            </label>
          </div>
          <p className="mt-2 text-[12px] text-muted">Save the photos from WhatsApp, then add them here. JPG/PNG/WebP, up to 8 MB each.</p>
        </div>
      </div>

      <div className="space-y-5 rounded-[20px] border border-line p-5">
        <div className="flex flex-wrap gap-2">
          {TYPES.map((t) => (
            <button type="button" key={t} onClick={() => set("type", t)} className={`h-9 rounded-full border px-4 text-[13.5px] font-medium ${d.type === t ? "border-brand bg-brand text-white" : "border-line"}`}>
              {TYPE_LABEL[t]}
            </button>
          ))}
        </div>
        {label("Title", <input className={field} value={d.title ?? ""} onChange={(e) => set("title", e.target.value)} placeholder="Partition near Mall of the Emirates metro (ladies)" />)}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {label("Area", <div className="rounded-[12px] border border-line px-3.5 py-2"><AreaCombobox value={area} onChange={(a) => set("areaSlug", a?.slug ?? "")} /></div>)}
          {label("Nearest metro", <input className={field} value={d.metro ?? ""} onChange={(e) => set("metro", e.target.value)} placeholder="Mall of the Emirates" />)}
        </div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {label("Rent (AED/mo)", <input className={field} inputMode="numeric" value={d.priceAed ?? ""} onChange={(e) => set("priceAed", Number(e.target.value.replace(/\D/g, "")) || undefined)} />)}
          {label("Up to", <input className={field} inputMode="numeric" value={d.priceMaxAed ?? ""} onChange={(e) => set("priceMaxAed", Number(e.target.value.replace(/\D/g, "")) || null)} />, "(range)")}
          {label("Deposit", <input className={field} inputMode="numeric" value={d.deposit ?? 0} onChange={(e) => set("deposit", Number(e.target.value.replace(/\D/g, "")) || 0)} />)}
          {label("Upfront cost", <input className={field} inputMode="numeric" value={d.upfrontCost ?? 0} onChange={(e) => set("upfrontCost", Number(e.target.value.replace(/\D/g, "")) || 0)} />)}
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {label(
            "Who can live",
            <select className={field} value={d.occupancy === "couple" ? "couple" : d.gender} onChange={(e) => (e.target.value === "couple" ? setD({ ...d, gender: "any", occupancy: "couple" }) : setD({ ...d, gender: e.target.value as Draft["gender"], occupancy: d.type === "bed_space" ? "shared" : "single" }))}>
              <option value="any">Anyone</option>
              <option value="female">Female only</option>
              <option value="male">Male only</option>
              <option value="couple">Couples welcome</option>
            </select>,
          )}
          {label("Beds in room", <input className={field} inputMode="numeric" value={d.bedsInRoom ?? 1} onChange={(e) => set("bedsInRoom", Number(e.target.value) || 1)} />)}
          {label("Beds free", <input className={field} inputMode="numeric" value={d.bedsAvailable ?? 1} onChange={(e) => set("bedsAvailable", Number(e.target.value) || 1)} />)}
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {label("Bathroom", <select className={field} value={d.bathroom ?? ""} onChange={(e) => set("bathroom", e.target.value)}><option>Shared Bathroom</option><option>Private Bathroom</option><option>Attached Bathroom</option></select>)}
          {label("Availability", <input className={field} value={d.availability ?? ""} onChange={(e) => set("availability", e.target.value)} />)}
          {label("Minimum stay", <input className={field} value={d.minimumStay ?? ""} onChange={(e) => set("minimumStay", e.target.value)} />)}
        </div>
        <div>
          <span className="mb-1.5 block text-[12.5px] font-semibold">Included</span>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => set("billsIncluded", !d.billsIncluded)} className={`h-9 rounded-full border px-3.5 text-[13px] font-medium ${d.billsIncluded ? "border-brand bg-mint text-brand" : "border-line"}`}>
              Bills included
            </button>
            {(Object.keys(AMENITY_LABEL) as Amenity[]).map((a) => (
              <button type="button" key={a} onClick={() => set("amenities", d.amenities.includes(a) ? d.amenities.filter((x) => x !== a) : [...d.amenities, a])} className={`h-9 rounded-full border px-3.5 text-[13px] font-medium ${d.amenities.includes(a) ? "border-brand bg-mint text-brand" : "border-line"}`}>
                {AMENITY_LABEL[a]}
              </button>
            ))}
          </div>
        </div>
        {label("Description", <textarea className={`${field} min-h-[120px]`} value={d.description ?? ""} onChange={(e) => set("description", e.target.value)} />, "(one point per line)")}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {label("Lister name", <input className={field} value={d.listerName ?? ""} onChange={(e) => set("listerName", e.target.value)} />)}
          {label("Lister WhatsApp", <input className={field} value={d.listerPhone ?? ""} onChange={(e) => set("listerPhone", e.target.value)} />, "(private, never shown)")}
        </div>
        <div className="flex flex-wrap gap-2">
          {(
            [
              ["Lister phone + ID checked", d.verifiedLister, () => set("verifiedLister", !d.verifiedLister)],
              ["Landlord consent seen", d.compliance?.landlordConsent, () => set("compliance", { landlordConsent: !d.compliance?.landlordConsent, dmPermit: !!d.compliance?.dmPermit })],
              ["Partition permit seen", d.compliance?.dmPermit, () => set("compliance", { landlordConsent: !!d.compliance?.landlordConsent, dmPermit: !d.compliance?.dmPermit })],
            ] as [string, boolean | undefined, () => void][]
          ).map(([t, on, toggle]) => (
            <button type="button" key={t} onClick={toggle} className={`flex h-9 items-center gap-1.5 rounded-full border px-3.5 text-[13px] font-medium ${on ? "border-brand bg-brand text-white" : "border-line"}`}>
              {on && <Icon name="check" size={13} />} {t}
            </button>
          ))}
        </div>
        {error && <p className="text-[13px] font-medium text-warn">{error}</p>}
        <div className="flex flex-wrap items-center justify-end gap-3 border-t border-line pt-4">
          <button type="button" onClick={onCancel} className="h-11 px-4 text-[14px] font-medium text-muted">
            Cancel
          </button>
          <select className="h-11 rounded-full border border-line px-4 text-[14px]" value={d.status ?? "live"} onChange={(e) => set("status", e.target.value as Draft["status"])}>
            <option value="live">Live</option>
            <option value="draft">Draft (hidden)</option>
            <option value="rented">Rented (hidden)</option>
          </select>
          <button type="button" onClick={save} disabled={busy} className="h-11 rounded-full bg-brand px-6 text-[14.5px] font-semibold text-white disabled:opacity-50">
            {busy ? "Saving…" : d.id ? "Save changes" : "Publish listing"}
          </button>
        </div>
      </div>
    </div>
  );
}

