"use client";

import Image from "next/image";
import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { validateInquiry, whatsappMessage, type InquiryErrors, type Listing } from "@stayshay/core";
import { Icon, aed } from "./ui";
import { stayshayWhatsapp } from "@/lib/contact";
import { track } from "./analytics";
import { QuickSignIn, useMe } from "./quick-signin";

const ListingMap = dynamic(() => import("./map-view").then((m) => m.ListingMap), {
  ssr: false,
  loading: () => <div className="h-full w-full animate-pulse bg-surface" />,
});

export function LocationMap({ listing }: { listing: Listing }) {
  return (
    <div className="h-[340px] overflow-hidden rounded-[18px] border border-line">
      <ListingMap listing={listing} />
    </div>
  );
}

/* ---------- Gallery: 1 + 4 grid, full-screen viewer ---------- */

export function PhotoGrid({ listing }: { listing: Listing }) {
  const [open, setOpen] = useState<number | null>(null);
  const photos = listing.photos;
  const tiles = photos.slice(0, 5);

  return (
    <>
      <div
        className={`relative grid h-[300px] grid-cols-1 gap-2 overflow-hidden rounded-[22px] sm:h-[440px] ${
          tiles.length >= 5 ? "md:grid-cols-4 md:grid-rows-2" : tiles.length >= 2 ? `md:grid-cols-[2fr_1fr] ${tiles.length === 2 ? "md:grid-rows-1" : tiles.length === 3 ? "md:grid-rows-2" : "md:grid-rows-3"}` : ""
        }`}
      >
        {tiles.map((src, i) => (
          <button
            key={src}
            onClick={() => setOpen(i)}
            className={`relative overflow-hidden bg-surface ${
              i === 0 ? (tiles.length >= 5 ? "md:col-span-2 md:row-span-2" : tiles.length >= 2 ? "md:row-span-full" : "") : "hidden md:block"
            }`}
            aria-label={`Open photo ${i + 1}`}
          >
            <Image src={src} alt={`${listing.title}, photo ${i + 1}`} fill priority={i === 0} sizes={i === 0 ? "(min-width:768px) 60vw, 100vw" : "30vw"} className="object-cover transition-transform duration-500 hover:scale-[1.02]" />
          </button>
        ))}
        {photos.length > 1 && (
          <button onClick={() => setOpen(0)} className="absolute bottom-3 right-3 flex h-9 items-center gap-2 rounded-[12px] border border-brand/10 bg-white px-3.5 text-[13px] font-medium shadow-sm">
            <Icon name="grid" size={15} /> All {photos.length} photos
          </button>
        )}
      </div>
      {open != null && <Lightbox photos={photos} start={open} title={listing.title} onClose={() => setOpen(null)} />}
    </>
  );
}

function Lightbox({ photos, start, title, onClose }: { photos: string[]; start: number; title: string; onClose: () => void }) {
  const [i, setI] = useState(start);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") setI((x) => Math.min(photos.length - 1, x + 1));
      if (e.key === "ArrowLeft") setI((x) => Math.max(0, x - 1));
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [photos.length, onClose]);

  return createPortal(
    <div className="fixed inset-0 z-[60] flex flex-col bg-black" role="dialog" aria-modal="true" aria-label="Photos">
      <div className="flex items-center justify-between px-4 py-3 text-white">
        <span className="font-figure text-[14px]">
          {i + 1} / {photos.length}
        </span>
        <button onClick={onClose} aria-label="Close" className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-white/10">
          <Icon name="close" />
        </button>
      </div>
      <div className="relative flex-1">
        <Image src={photos[i]} alt={`${title}, photo ${i + 1}`} fill sizes="100vw" className="object-contain" />
        {i > 0 && (
          <button onClick={() => setI(i - 1)} aria-label="Previous" className="absolute left-3 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white text-ink">
            <Icon name="chevron-left" />
          </button>
        )}
        {i < photos.length - 1 && (
          <button onClick={() => setI(i + 1)} aria-label="Next" className="absolute right-3 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white text-ink">
            <Icon name="chevron-right" />
          </button>
        )}
      </div>
      <div className="snap-x-strip flex gap-2 overflow-x-auto px-4 py-3">
        {photos.map((p, j) => (
          <button key={p} onClick={() => setI(j)} className={`relative h-14 w-20 shrink-0 overflow-hidden rounded-[6px] ${j === i ? "ring-2 ring-white" : "opacity-60"}`}>
            <Image src={p} alt="" fill sizes="80px" className="object-cover" />
          </button>
        ))}
      </div>
    </div>,
    document.body,
  );
}

/* ---------- Viewing funnel: when → who → hand-off ---------- */

const input = "w-full rounded-[12px] border border-line bg-white px-3 py-2.5 text-[15px] focus:border-brand focus:outline-none";

/** Back from Google sign-in mid-booking: ?book=1&movein=…&people=… resumes at step 2. */
function resumeParams() {
  if (typeof window === "undefined") return null;
  const p = new URLSearchParams(window.location.search);
  return p.get("book") === "1" ? { moveIn: p.get("movein") ?? "", people: p.get("people") ?? "1" } : null;
}

export function ViewingFunnel({ listing }: { listing: Listing }) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [f, setF] = useState({ moveIn: "", people: "1", name: "", phone: "", message: "" });
  const [errors, setErrors] = useState<InquiryErrors>({});
  const [busy, setBusy] = useState(false);
  const [editContact, setEditContact] = useState(false);
  const { me, google } = useMe();
  const today = new Date().toISOString().slice(0, 10);

  useEffect(() => {
    const r = resumeParams();
    if (r && /^\d{4}-\d{2}-\d{2}$/.test(r.moveIn)) {
      setF((x) => ({ ...x, moveIn: r.moveIn, people: r.people }));
      setStep(2);
    }
  }, []);

  // Signed in: their name and number fill in by themselves.
  useEffect(() => {
    if (me) setF((x) => ({ ...x, name: x.name || me.name, phone: x.phone || (me.phone ? `+${me.phone}` : "") }));
  }, [me]);
  const known = !!(me && me.phone && !editContact);
  const resumeUrl = `/listing/${listing.id.toLowerCase()}?book=1&movein=${f.moveIn}&people=${f.people}`;

  const next = () => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(f.moveIn)) return setErrors({ moveIn: "Pick a move-in date" });
    setErrors({});
    setStep(2);
  };

  const send = async () => {
    const msg = [f.people !== "1" ? `${f.people} people` : "", f.message].filter(Boolean).join(". ");
    const check = validateInquiry({ listingId: listing.id, name: f.name, phone: f.phone, moveIn: f.moveIn, budget: listing.priceAed, message: msg });
    setErrors(check.errors);
    if (!check.ok || !check.value) return;
    const tab = window.open("about:blank", "_blank");
    setBusy(true);
    track("generate_lead", { method: "viewing_request", listing_id: listing.id, value: listing.priceAed, currency: "AED" });
    await fetch("/api/inquiry", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ ...check.value, via: "whatsapp" }) }).catch(() => null);
    setBusy(false);
    setStep(3);
    const url = stayshayWhatsapp(whatsappMessage(listing, check.value));
    if (tab) tab.location.href = url;
    else window.location.href = url;
  };

  const err = (k: keyof InquiryErrors) => (errors[k] ? <span className="mt-1 block text-[12px] text-warn">{errors[k]}</span> : null);

  return (
    <div>
      <div className="flex items-baseline justify-between">
        <p>
          {listing.priceMaxAed ? <span className="text-[14px] text-muted">From </span> : null}
          <span className="font-figure text-[26px] font-semibold">{aed(listing.priceAed)}</span>
          <span className="text-[14px] text-muted"> / month</span>
        </p>
        {listing.billsIncluded && <span className="text-[12.5px] text-verified">Bills included</span>}
      </div>
      <div className="mt-3 grid grid-cols-2 gap-px overflow-hidden rounded-[12px] border border-line bg-line text-[13px]">
        <div className="bg-white px-3 py-2">
          <span className="block text-muted">Deposit</span>
          <span className="font-figure font-semibold">{listing.deposit ? aed(listing.deposit) : "None"}</span>
        </div>
        <div className="bg-white px-3 py-2">
          <span className="block text-muted">Upfront cost</span>
          <span className="font-figure font-semibold">{listing.upfrontCost ? aed(listing.upfrontCost) : "None"}</span>
        </div>
      </div>

      <ol className="mt-5 flex items-center gap-2 text-[12px]" aria-label="Steps">
        {["When", "You", "Viewing"].map((label, i) => (
          <li key={label} className="flex flex-1 items-center gap-2">
            <span className={`h-1 flex-1 rounded-full ${i + 1 <= step ? "bg-brand" : "bg-line"}`} />
            <span className={i + 1 === step ? "font-medium text-ink" : "text-muted"}>{label}</span>
          </li>
        ))}
      </ol>

      {step === 1 && (
        <div className="mt-4 space-y-3">
          <label className="block">
            <span className="mb-1 block text-[12.5px] font-medium">When do you want to move in?</span>
            <input type="date" min={today} className={input} value={f.moveIn} onChange={(e) => setF({ ...f, moveIn: e.target.value })} />
            {err("moveIn")}
          </label>
          <div className="flex gap-2">
            {["Today", "This week", "Next month"].map((q, i) => {
              const d = new Date();
              d.setDate(d.getDate() + [0, 7, 30][i]);
              const iso = d.toISOString().slice(0, 10);
              return (
                <button key={q} type="button" onClick={() => setF({ ...f, moveIn: iso })} className={`h-8 flex-1 rounded-[6px] border text-[12.5px] ${f.moveIn === iso ? "border-brand bg-brand text-white" : "border-line text-ink-2"}`}>
                  {q}
                </button>
              );
            })}
          </div>
          <label className="block">
            <span className="mb-1 block text-[12.5px] font-medium">How many people?</span>
            <select className={input} value={f.people} onChange={(e) => setF({ ...f, people: e.target.value })}>
              <option value="1">Just me</option>
              <option value="2">2 people / couple</option>
              <option value="3">3+</option>
            </select>
          </label>
          <button onClick={next} className="flex h-12 w-full items-center justify-center gap-2 rounded-[12px] bg-brand text-[15px] font-medium text-white">
            Continue <Icon name="arrow-right" size={16} />
          </button>
        </div>
      )}

      {step === 2 && (
        <div className="mt-4 space-y-3">
          {known ? (
            <div className="flex items-center gap-3 rounded-[14px] bg-mint px-3.5 py-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-white text-[14px] font-bold text-brand">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                {me?.picture ? <img src={me.picture} alt="" className="h-full w-full object-cover" referrerPolicy="no-referrer" /> : me?.name[0]}
              </span>
              <span className="min-w-0 flex-1 text-[13.5px]">
                <span className="block font-semibold text-ink">Booking as {me?.name}</span>
                <span className="block text-muted">+{me?.phone}</span>
              </span>
              <button onClick={() => setEditContact(true)} className="text-[12.5px] font-semibold text-brand underline">
                Change
              </button>
            </div>
          ) : (
            <>
              {!me && <QuickSignIn next={resumeUrl} google={google} />}
              <label className="block">
                <span className="mb-1 block text-[12.5px] font-medium">Your name</span>
                <input className={input} autoComplete="name" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />
                {err("name")}
              </label>
              <label className="block">
                <span className="mb-1 block text-[12.5px] font-medium">WhatsApp number</span>
                <input className={input} type="tel" inputMode="tel" autoComplete="tel" placeholder="050 123 4567" value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} />
                {err("phone")}
              </label>
            </>
          )}
          <label className="block">
            <span className="mb-1 block text-[12.5px] font-medium">
              Anything to add? <span className="font-normal text-muted">(optional)</span>
            </span>
            <textarea className={`${input} min-h-[64px]`} maxLength={300} value={f.message} onChange={(e) => setF({ ...f, message: e.target.value })} placeholder="Job, hours, cooking…" />
          </label>
          <button onClick={send} disabled={busy} className="flex h-12 w-full items-center justify-center gap-2 rounded-[12px] bg-whatsapp text-[15px] font-medium text-white disabled:opacity-60">
            <Icon name="whatsapp" size={18} /> Request viewing on WhatsApp
          </button>
          <button onClick={() => setStep(1)} className="w-full text-[13px] text-muted underline underline-offset-4">
            Back
          </button>
        </div>
      )}

      {step === 3 && (
        <div className="mt-4 rounded-[16px] bg-verified-bg p-4">
          <p className="flex items-center gap-2 font-medium text-verified">
            <Icon name="check" /> Viewing requested
          </p>
          <p className="mt-1.5 text-[13.5px] leading-relaxed text-ink-2">
            Ref {listing.id}. WhatsApp opened with your details. If it didn’t, tap below. Never pay before viewing.
          </p>
          <a href={stayshayWhatsapp(whatsappMessage(listing, { name: f.name, moveIn: f.moveIn }))} target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex text-[13.5px] font-medium text-whatsapp underline underline-offset-4">
            Open WhatsApp again
          </a>
        </div>
      )}

      <p className="mt-4 flex items-start gap-2 text-[12px] leading-relaxed text-muted">
        <Icon name="shield" size={14} className="mt-0.5 shrink-0" /> Free to ask. No booking fee. Your number goes only to this lister.
      </p>
    </div>
  );
}

/** Phone: price + button pinned to the bottom, funnel in a sheet. */
export function MobileBookingBar({ listing }: { listing: Listing }) {
  const [open, setOpen] = useState(false);
  // Returning from Google sign-in mid-booking on a phone: reopen the sheet.
  useEffect(() => {
    if (resumeParams() && window.matchMedia("(max-width: 1023px)").matches) setOpen(true);
  }, []);
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);
  return (
    <>
      <div className="fixed inset-x-0 bottom-0 z-40 flex items-center justify-between gap-3 border-t border-line bg-white px-4 py-3 lg:hidden">
        <p className="leading-tight">
          <span className="font-figure text-[18px] font-semibold">{aed(listing.priceAed)}</span>
          <span className="text-[13px] text-muted"> / month</span>
          <span className="block text-[12px] text-muted">{listing.availability ?? "Monthly"}</span>
        </p>
        <button onClick={() => setOpen(true)} className="h-11 rounded-[12px] bg-brand px-5 text-[14.5px] font-medium text-white">
          Request viewing
        </button>
      </div>
      {open &&
        createPortal(
          <div className="fixed inset-0 z-50 flex items-end bg-black/45 lg:hidden" onClick={() => setOpen(false)}>
            <div className="max-h-[92vh] w-full overflow-y-auto rounded-t-[16px] bg-white p-5 pb-8" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-label="Request viewing">
              <div className="mb-3 flex justify-between">
                <span className="mx-auto h-1 w-10 rounded-full bg-line-strong" />
              </div>
              <ViewingFunnel listing={listing} />
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}

export function ShareSave({ listing }: { listing: Listing }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="flex items-center gap-2">
      <button
        onClick={async () => {
          const url = window.location.href;
          if (navigator.share) await navigator.share({ title: listing.title, url }).catch(() => {});
          else {
            await navigator.clipboard?.writeText(url);
            setCopied(true);
            setTimeout(() => setCopied(false), 1800);
          }
        }}
        className="flex h-9 items-center gap-1.5 rounded-[12px] px-3 text-[13.5px] underline-offset-4 hover:bg-surface"
      >
        <Icon name="arrow-right" size={14} className="-rotate-45" /> {copied ? "Link copied" : "Share"}
      </button>
      <a href={`mailto:hello@stayshay.com?subject=${encodeURIComponent(`Report listing ${listing.id}`)}`} className="flex h-9 items-center gap-1.5 rounded-[12px] px-3 text-[13.5px] hover:bg-surface">
        <Icon name="flag" size={14} /> Report
      </a>
    </div>
  );
}
