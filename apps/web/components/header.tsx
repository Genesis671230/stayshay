"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import Image from "next/image";
import { Icon, Logo } from "./ui";
import { GROUP_LABEL, SERVICES } from "@/lib/services";

const RENT = [
  { label: "Bed spaces", href: "/rent/bed-space", hint: "A bed in a shared room" },
  { label: "Partitions", href: "/rent/partitions", hint: "Your own closed-off space" },
  { label: "Private rooms", href: "/rent/rooms", hint: "A whole room in a shared flat" },
  { label: "Studios", href: "/rent/studios", hint: "Your own place, monthly" },
  { label: "Family 1–3BHK", href: "/family", hint: "Apartments for families, found for you" },
  { label: "Moving to Dubai", href: "/move", hint: "Relocation help, first home before you land" },
  { label: "Near the metro", href: "/metro", hint: "Pick your station" },
  { label: "Ladies only", href: "/rent/bed-space/ladies", hint: "Female-only flats" },
  { label: "Best deals", href: "/deals", hint: "Below the going rate today" },
];

const NAV = [
  { label: "Families", href: "/family" },
  { label: "Roommates", href: "/roommates" },
  { label: "Tools", href: "/tools" },
  { label: "Guides", href: "/blog" },
  { label: "Owners", href: "/manager" },
];

function useMe() {
  const [me, setMe] = useState<{ name: string; picture: string | null } | null>(null);
  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((j) => setMe(j.user ?? null))
      .catch(() => {});
  }, []);
  return me;
}

export function Header() {
  const me = useMe();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [rentOpen, setRentOpen] = useState(false);
  const [svcOpen, setSvcOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className={`sticky top-0 z-40 bg-white/95 backdrop-blur ${scrolled ? "border-b border-line" : "border-b border-transparent"}`}>
      <div className="mx-auto flex h-[68px] max-w-[1240px] items-center justify-between px-4 md:px-8">
        <Link href="/" aria-label="Stayshay home" className="text-ink">
          <Logo />
        </Link>

        <nav className="hidden items-center gap-0.5 xl:flex" aria-label="Primary">
          <div className="relative" onMouseEnter={() => setRentOpen(true)} onMouseLeave={() => setRentOpen(false)}>
            <button
              className="flex h-10 items-center gap-1.5 whitespace-nowrap rounded-[12px] px-3 text-[14.5px] font-medium text-ink-2 hover:text-ink"
              aria-expanded={rentOpen}
              aria-haspopup="true"
              onClick={() => setRentOpen((v) => !v)}
              onKeyDown={(e) => e.key === "Escape" && setRentOpen(false)}
            >
              Rent
              <span aria-hidden className={`mt-[-3px] h-1.5 w-1.5 rotate-45 border-b-[1.5px] border-r-[1.5px] border-current transition-transform ${rentOpen ? "translate-y-[3px] rotate-[225deg]" : ""}`} />
            </button>
            {rentOpen && (
              <div className="absolute left-0 top-full pt-2">
                <div className="w-[300px] rounded-[20px] border border-line bg-white p-2 shadow-[0_24px_60px_rgb(20_92_70/0.16)]">
                  {RENT.map((r) => (
                    <Link key={r.href} href={r.href} onClick={() => setRentOpen(false)} className="block rounded-[14px] px-4 py-3 hover:bg-surface">
                      <span className="block text-[14.5px] font-semibold text-ink">{r.label}</span>
                      <span className="block text-[12.5px] text-muted">{r.hint}</span>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
          <div className="relative" onMouseEnter={() => setSvcOpen(true)} onMouseLeave={() => setSvcOpen(false)}>
            <button
              className="flex h-10 items-center gap-1.5 whitespace-nowrap rounded-[12px] px-3 text-[14.5px] font-medium text-ink-2 hover:text-ink"
              aria-expanded={svcOpen}
              aria-haspopup="true"
              onClick={() => setSvcOpen((v) => !v)}
              onKeyDown={(e) => e.key === "Escape" && setSvcOpen(false)}
            >
              Services
              <span aria-hidden className={`mt-[-3px] h-1.5 w-1.5 rotate-45 border-b-[1.5px] border-r-[1.5px] border-current transition-transform ${svcOpen ? "translate-y-[3px] rotate-[225deg]" : ""}`} />
            </button>
            {svcOpen && (
              <div className="absolute left-1/2 top-full -translate-x-1/2 pt-2">
                <div className="grid w-[760px] grid-cols-[1fr_1fr_220px] gap-2 rounded-[22px] border border-line bg-white p-3 shadow-[0_24px_60px_rgb(20_92_70/0.16)]">
                  {(["maintenance", "interiors"] as const).map((g) => (
                    <div key={g}>
                      <p className="px-3 pb-1 pt-2 text-[11.5px] font-bold uppercase tracking-[0.12em] text-muted">{GROUP_LABEL[g]}</p>
                      {SERVICES.filter((x) => x.group === g).map((x) => (
                        <Link key={x.slug} href={`/services/${x.slug}`} onClick={() => setSvcOpen(false)} className="flex items-center gap-3 rounded-[14px] px-3 py-2 hover:bg-surface">
                          <span className="relative h-9 w-9 shrink-0 overflow-hidden rounded-[10px] bg-surface">
                            <Image src={x.photo} alt="" fill sizes="36px" className="object-cover" />
                          </span>
                          <span className="min-w-0">
                            <span className="block text-[14px] font-semibold text-ink">{x.name}</span>
                            <span className="block truncate text-[12px] text-muted">{x.hint}</span>
                          </span>
                        </Link>
                      ))}
                    </div>
                  ))}
                  <Link href="/services" onClick={() => setSvcOpen(false)} className="relative flex flex-col justify-end overflow-hidden rounded-[16px] bg-brand-deep p-4 text-white">
                    <Image src="/photos/svc-interior-design.jpg" alt="" fill sizes="220px" className="object-cover opacity-60" />
                    <span className="relative text-[11.5px] font-bold uppercase tracking-[0.12em] text-[#8fe3bd]">One tap to WhatsApp</span>
                    <span className="font-display relative mt-1 text-[22px] leading-tight">All home services</span>
                    <span className="relative mt-2 inline-flex w-fit items-center rounded-full bg-lime px-3 py-1 text-[12.5px] font-bold text-brand-deep">See all →</span>
                  </Link>
                </div>
              </div>
            )}
          </div>
          {NAV.map((item) => (
            <Link key={item.label} href={item.href} className="flex h-10 items-center whitespace-nowrap rounded-[12px] px-3 text-[14.5px] font-medium text-ink-2 hover:text-ink">
              {item.label}
            </Link>
          ))}
          <Link href="/win" className="ml-1 flex h-9 items-center gap-1.5 whitespace-nowrap rounded-full bg-lime px-3.5 text-[13.5px] font-bold text-brand-deep hover:brightness-95">
            🏆 Win AED 5,000
          </Link>
        </nav>

        <div className="flex items-center gap-2">
          <Link href="/find" className="hidden h-10 items-center whitespace-nowrap px-3 text-[14px] font-medium text-ink-2 hover:text-ink 2xl:inline-flex">
            Find me a room
          </Link>
          <Link href="/list" className="hidden h-10 items-center whitespace-nowrap rounded-[12px] bg-brand px-4 text-[14px] font-medium text-white hover:bg-brand-deep sm:inline-flex">
            List your place
          </Link>
          {me ? (
            <Link href="/account" aria-label="Your account" className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-mint text-[15px] font-bold text-brand ring-1 ring-line">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              {me.picture ? <img src={me.picture} alt="" className="h-full w-full object-cover" referrerPolicy="no-referrer" /> : me.name[0]}
            </Link>
          ) : (
            <Link href="/login" className="hidden h-10 items-center whitespace-nowrap rounded-[12px] border border-line px-4 text-[14px] font-medium hover:border-brand md:inline-flex">
              Sign in
            </Link>
          )}
          <button
            className="inline-flex h-10 w-10 items-center justify-center rounded-[12px] border border-line xl:hidden"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-label="Menu"
          >
            <Icon name={open ? "close" : "menu"} />
          </button>
        </div>
      </div>

      {open && (
        <div className="border-t border-line bg-white px-4 pb-5 xl:hidden">
          <p className="pt-4 text-[11.5px] font-bold uppercase tracking-[0.12em] text-muted">Rent</p>
          {RENT.map((item) => (
            <Link key={item.label} href={item.href} onClick={() => setOpen(false)} className="block border-b border-line py-3 text-[15px]">
              {item.label}
            </Link>
          ))}
          <Link href="/win" onClick={() => setOpen(false)} className="mt-4 flex items-center justify-between rounded-[14px] bg-lime px-4 py-3 text-[15px] font-bold text-brand-deep">
            🏆 Win AED 500 to 5,000 <span aria-hidden>→</span>
          </Link>
          <p className="pt-4 text-[11.5px] font-bold uppercase tracking-[0.12em] text-muted">Services</p>
          <div className="grid grid-cols-2 gap-x-3">
            {SERVICES.map((x) => (
              <Link key={x.slug} href={`/services/${x.slug}`} onClick={() => setOpen(false)} className="block border-b border-line py-3 text-[14.5px]">
                {x.name}
              </Link>
            ))}
          </div>
          <p className="pt-4 text-[11.5px] font-bold uppercase tracking-[0.12em] text-muted">More</p>
          {NAV.map((item) => (
            <Link key={item.label} href={item.href} onClick={() => setOpen(false)} className="block border-b border-line py-3 text-[15px]">
              {item.label}
            </Link>
          ))}
          <div className="mt-4 grid grid-cols-2 gap-2">
            <Link href="/find" onClick={() => setOpen(false)} className="flex h-11 items-center justify-center rounded-[12px] border border-brand text-[14.5px] font-medium">
              Find me a room
            </Link>
            <Link href="/list" onClick={() => setOpen(false)} className="flex h-11 items-center justify-center rounded-[12px] bg-brand text-[14.5px] font-medium text-white">
              List your place
            </Link>
            <Link href={me ? "/account" : "/login"} onClick={() => setOpen(false)} className="col-span-2 flex h-11 items-center justify-center rounded-[12px] border border-line text-[14.5px] font-medium">
              {me ? "Your account" : "Sign in / Create account"}
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
