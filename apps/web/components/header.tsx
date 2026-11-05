"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Icon, Logo } from "./ui";

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
  { label: "For owners", href: "/manager" },
  { label: "Refer & earn", href: "/refer" },
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

        <nav className="hidden items-center gap-1 lg:flex" aria-label="Primary">
          <div className="relative" onMouseEnter={() => setRentOpen(true)} onMouseLeave={() => setRentOpen(false)}>
            <button
              className="flex h-10 items-center gap-1.5 rounded-[12px] px-4 text-[14.5px] font-medium text-ink-2 hover:text-ink"
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
          {NAV.map((item) => (
            <Link key={item.label} href={item.href} className="flex h-10 items-center rounded-[12px] px-4 text-[14.5px] font-medium text-ink-2 hover:text-ink">
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Link href="/find" className="hidden h-10 items-center px-3 text-[14px] font-medium text-ink-2 hover:text-ink xl:inline-flex">
            Find me a room
          </Link>
          <Link href="/list" className="hidden h-10 items-center rounded-[12px] bg-brand px-4 text-[14px] font-medium text-white hover:bg-brand-deep sm:inline-flex">
            List your place
          </Link>
          {me ? (
            <Link href="/account" aria-label="Your account" className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-mint text-[15px] font-bold text-brand ring-1 ring-line">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              {me.picture ? <img src={me.picture} alt="" className="h-full w-full object-cover" referrerPolicy="no-referrer" /> : me.name[0]}
            </Link>
          ) : (
            <Link href="/login" className="hidden h-10 items-center rounded-[12px] border border-line px-4 text-[14px] font-medium hover:border-brand md:inline-flex">
              Sign in
            </Link>
          )}
          <button
            className="inline-flex h-10 w-10 items-center justify-center rounded-[12px] border border-line lg:hidden"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-label="Menu"
          >
            <Icon name={open ? "close" : "menu"} />
          </button>
        </div>
      </div>

      {open && (
        <div className="border-t border-line bg-white px-4 pb-5 lg:hidden">
          <p className="pt-4 text-[11.5px] font-bold uppercase tracking-[0.12em] text-muted">Rent</p>
          {RENT.map((item) => (
            <Link key={item.label} href={item.href} onClick={() => setOpen(false)} className="block border-b border-line py-3 text-[15px]">
              {item.label}
            </Link>
          ))}
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
