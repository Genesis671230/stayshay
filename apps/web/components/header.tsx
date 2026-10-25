"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Icon, Logo } from "./ui";

const NAV = [
  { label: "Bed spaces", href: "/search?type=bed_space" },
  { label: "Partitions", href: "/search?type=partition" },
  { label: "Rooms", href: "/search?type=room" },
  { label: "Studios", href: "/search?type=studio" },
  { label: "Map", href: "/search?view=map" },
];

export function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

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

        <nav className="hidden items-center gap-7 lg:flex" aria-label="Primary">
          {NAV.map((item) => (
            <Link key={item.label} href={item.href} className="text-[14px] text-ink-2 hover:text-ink">
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Link href="/find" className="hidden h-10 items-center px-3 text-[14px] font-medium text-ink-2 hover:text-ink md:inline-flex">
            Find me a room
          </Link>
          <Link href="/list" className="hidden h-10 items-center rounded-[12px] bg-brand px-4 text-[14px] font-medium text-white hover:bg-brand-deep sm:inline-flex">
            List your place
          </Link>
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
          {NAV.map((item) => (
            <Link key={item.label} href={item.href} onClick={() => setOpen(false)} className="block border-b border-line py-3.5 text-[15px]">
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
          </div>
        </div>
      )}
    </header>
  );
}
