"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const ITEMS = [
  { label: "Home", href: "/", match: (p: string) => p === "/" },
  { label: "Search", href: "/search", match: (p: string) => /^\/(search|rent|areas|deals)/.test(p) },
  { label: "Roommates", href: "/roommates", match: (p: string) => p.startsWith("/roommates") },
  { label: "Owners", href: "/manager", match: (p: string) => p.startsWith("/manager") },
  { label: "Account", href: "/account", match: (p: string) => /^\/(account|login|refer)/.test(p) },
];

/** Pages with their own bottom action bar (or no public chrome) don't show the tab bar. */
export const hidesMobileNav = (p: string) => /^\/(listing|find|list|admin|login|manager)\b/.test(p);

/** App-style floating tab bar on phones: dark forest pill, the current page in pale lime. */
export function MobileNav() {
  const path = usePathname() ?? "/";
  if (hidesMobileNav(path)) return null;
  return (
    <nav aria-label="Quick navigation" className="mobile-nav fixed inset-x-3 bottom-3 z-50 md:hidden">
      <ul className="flex items-center justify-between rounded-[22px] bg-[#0f3426]/95 p-1.5 backdrop-blur-md">
        {ITEMS.map((it) => {
          const on = it.match(path);
          return (
            <li key={it.href} className="flex-1">
              <Link href={it.href} aria-current={on ? "page" : undefined} className={`flex h-11 items-center justify-center rounded-[16px] text-[12.5px] font-semibold transition-colors ${on ? "bg-[#d3f0b9] text-[#0f3426]" : "text-white/75 active:bg-white/10"}`}>
                {it.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
