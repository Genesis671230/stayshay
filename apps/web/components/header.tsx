"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { usePathname } from "next/navigation";
import { Icon, Logo } from "./ui";
import { GROUP_LABEL, SERVICES } from "@/lib/services";

type Tile = { label: string; href: string; hint: string; photo: string };

const RENT: Tile[] = [
  {
    label: "Bed spaces",
    href: "/rent/bed-space",
    hint: "A bed in a shared room",
    photo: "/photos/bed-space.jpg",
  },
  {
    label: "Partitions",
    href: "/rent/partitions",
    hint: "Your own closed-off space",
    photo: "/photos/partition.jpg",
  },
  {
    label: "Private rooms",
    href: "/rent/rooms",
    hint: "A whole room in a shared flat",
    photo: "/photos/room.jpg",
  },
  {
    label: "Studios",
    href: "/rent/studios",
    hint: "Your own place, monthly",
    photo: "/photos/studio.jpg",
  },
  {
    label: "Family 1–3BHK",
    href: "/family",
    hint: "Apartments found for you",
    photo: "/photos/living.jpg",
  },
  {
    label: "Near the metro",
    href: "/metro",
    hint: "Pick your station",
    photo: "/photos/metro-station.jpg",
  },
  {
    label: "Ladies only",
    href: "/rent/bed-space/ladies",
    hint: "Female-only flats",
    photo: "/photos/ladies.jpg",
  },
  {
    label: "Moving to Dubai",
    href: "/move",
    hint: "Your first home, before you land",
    photo: "/photos/executive.jpg",
  },
];

const COMMUNITY: Tile[] = [
  {
    label: "Communities",
    href: "/community",
    hint: "Your neighbourhood’s group",
    photo: "/photos/roommates.jpg",
  },
  {
    label: "Roommates",
    href: "/roommates",
    hint: "People looking to share",
    photo: "/photos/couples.jpg",
  },
  {
    label: "Families",
    href: "/family",
    hint: "1–3BHK and family sharing",
    photo: "/photos/living.jpg",
  },
  {
    label: "Free tools",
    href: "/tools",
    hint: "Fair rent, budget, move-in cost",
    photo: "/photos/manager.jpg",
  },
  {
    label: "Guides",
    href: "/blog",
    hint: "Areas, costs, moving",
    photo: "/photos/area-deira.jpg",
  },
  {
    label: "For owners",
    href: "/manager",
    hint: "List and manage your place",
    photo: "/photos/partners.jpg",
  },
];

// Kept inline so the full portfolio data never ships in the header bundle.
const FEATURED = [
  {
    slug: "villa-velora",
    name: "Villa Velora",
    category: "Villa",
    location: "Jumeirah Islands",
    cover: "/work/villa-velora/facade.jpg",
  },
  {
    slug: "balqis-penthouse",
    name: "Balqis Penthouse",
    category: "Penthouse",
    location: "Palm Jumeirah",
    cover: "/work/balqis-penthouse/01.webp",
  },
  {
    slug: "villa-arterra",
    name: "Villa Arterra",
    category: "Villa",
    location: "Palm Jumeirah",
    cover: "/work/villa-arterra/01.webp",
  },
  {
    slug: "the-steakhouse",
    name: "The Steakhouse",
    category: "Restaurant",
    location: "Erbil, Iraq",
    cover: "/work/the-steakhouse/01.webp",
  },
];
const POPULAR_SERVICES = [
  "ac-maintenance",
  "deep-cleaning",
  "plumbing",
  "movers",
  "interior-design",
  "villa-renovation",
  "commercial-fit-out",
  "painting",
];

type Menu = "rent" | "services" | "work" | "community" | null;

const Trophy = ({ size = 15 }: { size?: number }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden
  >
    <path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0V4ZM7 6H4a3 3 0 0 0 3 4M17 6h3a3 3 0 0 1-3 4" />
  </svg>
);

function useMe() {
  const [me, setMe] = useState<{ name: string; picture: string | null } | null>(
    null,
  );
  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((j) => setMe(j.user ?? null))
      .catch(() => {});
  }, []);
  return me;
}

/** A photo tile with a slow zoom and a lime corner arrow on hover. */
function PhotoTile({
  t,
  onClick,
  size = "md",
}: {
  t: Tile;
  onClick?: () => void;
  size?: "sm" | "md";
}) {
  return (
    <Link
      href={t.href}
      onClick={onClick}
      className={`group relative block overflow-hidden rounded-[16px] bg-ink ${size === "sm" ? "h-[88px]" : "h-[118px]"}`}
    >
      <Image
        src={t.photo}
        alt=""
        fill
        sizes="200px"
        className="object-cover opacity-90 transition duration-700 group-hover:scale-110 group-hover:opacity-100"
      />
      <span className="absolute inset-0 bg-[linear-gradient(180deg,rgb(0_0_0/0.05)_20%,rgb(6_30_22/0.85)_100%)]" />
      <span className="absolute right-2 top-2 flex h-7 w-7 translate-y-1 items-center justify-center rounded-full bg-lime text-[13px] text-brand-deep opacity-0 transition duration-300 group-hover:translate-y-0 group-hover:opacity-100">
        ↗
      </span>
      <span className="absolute inset-x-0 bottom-0 p-2.5 text-white">
        <span className="block text-[13.5px] font-bold leading-tight">
          {t.label}
        </span>
        {size === "md" && (
          <span className="block truncate text-[11.5px] text-white/75">
            {t.hint}
          </span>
        )}
      </span>
    </Link>
  );
}

function Panel({
  children,
  wide = false,
  align = "left",
}: {
  children: React.ReactNode;
  wide?: boolean;
  align?: "left" | "center";
}) {
  return (
    <div
      className={`absolute top-full pt-3 ${align === "center" ? "left-1/2 -translate-x-1/2" : "-left-4"}`}
    >
      <div
        className={`animate-[menuIn_.22s_ease] overflow-hidden rounded-[26px] border border-white/60 bg-white/95 p-3 shadow-[0_30px_80px_rgb(9_44_34/0.22)] ring-1 ring-black/5 backdrop-blur-xl ${wide ? "w-[880px]" : "w-[640px]"}`}
      >
        {children}
      </div>
    </div>
  );
}

export function Header() {
  const me = useMe();
  const path = usePathname() ?? "/";
  const [scrolled, setScrolled] = useState(false);
  const [menu, setMenu] = useState<Menu>(null);
  const [sheet, setSheet] = useState(false);
  const [tab, setTab] = useState<"rent" | "services" | "work" | "more">("rent");
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setMenu(null);
    setSheet(false);
  }, [path]);

  useEffect(() => {
    if (!sheet) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setSheet(false);
    window.addEventListener("keydown", esc);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", esc);
    };
  }, [sheet]);

  const enter = (m: Menu) => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setMenu(m);
  };
  const leave = () => {
    closeTimer.current = setTimeout(() => setMenu(null), 140);
  };
  const close = () => setMenu(null);

  const active = (prefixes: string[]) =>
    prefixes.some((p) => path === p || path.startsWith(`${p}/`));
  const trigger = (m: Exclude<Menu, null>, label: string, on: boolean) => (
    <button
      className={`group relative flex h-10 items-center gap-1.5 whitespace-nowrap rounded-full px-4 text-[14.5px] font-semibold transition-colors ${menu === m || on ? "bg-brand-deep text-white" : "text-ink-2 hover:bg-[#ecf8ee] hover:text-brand-deep"}`}
      aria-expanded={menu === m}
      aria-haspopup="true"
      onClick={() => setMenu(menu === m ? null : m)}
      onKeyDown={(e) => e.key === "Escape" && close()}
    >
      {label}
      <span
        aria-hidden
        className={`mt-[-3px] h-1.5 w-1.5 rotate-45 border-b-[1.5px] border-r-[1.5px] border-current transition-transform duration-300 ${menu === m ? "translate-y-[3px] rotate-[225deg]" : ""}`}
      />
    </button>
  );

  return (
    <header
      className={`sticky top-0 z-40 transition-all duration-300 ${scrolled ? "bg-white/80 shadow-[0_10px_40px_rgb(9_44_34/0.08)] backdrop-blur-xl" : "bg-white"}`}
    >
      {/* thin brand gradient line */}
      <div
        aria-hidden
        className="h-[3px] bg-[linear-gradient(90deg,#123d2e,#2f8f6b_40%,#d3f0b9_70%,#123d2e)]"
      />
      <div className="mx-auto flex h-[68px] max-w-[1240px] items-center justify-between gap-3 px-4 md:px-8">
        <Link
          href="/"
          aria-label="Stayshay home"
          className="shrink-0 text-ink transition-opacity hover:opacity-80"
        >
          <Logo />
        </Link>

        <nav
          className="hidden items-center gap-1 rounded-full border border-line/70 bg-white/70 p-1 shadow-[0_6px_20px_rgb(9_44_34/0.05)] lg:flex"
          aria-label="Primary"
        >
          <div
            className="relative"
            onMouseEnter={() => enter("rent")}
            onMouseLeave={leave}
          >
            {trigger(
              "rent",
              "Rent",
              active(["/rent", "/family", "/metro", "/move", "/search"]),
            )}
            {menu === "rent" && (
              <Panel align="center">
                <div className="grid grid-cols-4 gap-2">
                  {RENT.map((t) => (
                    <PhotoTile key={t.href} t={t} onClick={close} />
                  ))}
                </div>
                <div className="mt-3 flex items-center justify-between rounded-[16px] bg-[#ecf8ee] px-4 py-3">
                  <span className="text-[13.5px] text-ink-2">
                    Not sure what fits? Tell us once, we send matches.
                  </span>
                  <Link
                    href="/find"
                    onClick={close}
                    className="rounded-full bg-brand-deep px-4 py-2 text-[13px] font-bold text-white transition hover:bg-brand"
                  >
                    Find me a room
                  </Link>
                </div>
              </Panel>
            )}
          </div>

          <div
            className="relative"
            onMouseEnter={() => enter("services")}
            onMouseLeave={leave}
          >
            {trigger("services", "Services", active(["/services"]))}
            {menu === "services" && (
              <Panel wide align="center">
                <div className="grid grid-cols-[1fr_1fr_230px] gap-2">
                  {(["maintenance", "interiors"] as const).map((g) => (
                    <div key={g}>
                      <p className="px-3 pb-1 pt-2 text-[11px] font-bold uppercase tracking-[0.14em] text-muted">
                        {GROUP_LABEL[g]}
                      </p>
                      {SERVICES.filter((x) => x.group === g).map((x) => (
                        <Link
                          key={x.slug}
                          href={`/services/${x.slug}`}
                          onClick={close}
                          className="group flex items-center gap-3 rounded-[14px] px-3 py-1.5 transition hover:bg-[#ecf8ee]"
                        >
                          <span className="relative h-9 w-9 shrink-0 overflow-hidden rounded-[10px] bg-surface ring-1 ring-black/5">
                            <Image
                              src={x.photo}
                              alt=""
                              fill
                              sizes="36px"
                              className="object-cover transition duration-500 group-hover:scale-125"
                            />
                          </span>
                          <span className="min-w-0">
                            <span className="block text-[13.5px] font-semibold text-ink group-hover:text-brand-deep">
                              {x.name}
                            </span>
                            <span className="block truncate text-[11.5px] text-muted">
                              {x.hint}
                            </span>
                          </span>
                        </Link>
                      ))}
                    </div>
                  ))}
                  <Link
                    href="/services"
                    onClick={close}
                    className="group relative flex flex-col justify-end overflow-hidden rounded-[18px] bg-brand-deep p-4 text-white"
                  >
                    <Image
                      src="/work/villa-pinea/reception.jpg"
                      alt=""
                      fill
                      sizes="230px"
                      className="object-cover opacity-60 transition duration-700 group-hover:scale-110"
                    />
                    <span className="absolute inset-0 bg-[linear-gradient(180deg,transparent,rgb(6_30_22/0.9))]" />
                    <span className="relative text-[11px] font-bold uppercase tracking-[0.14em] text-lime">
                      One tap to WhatsApp
                    </span>
                    <span className="font-display relative mt-1 text-[22px] leading-tight">
                      All home services
                    </span>
                    <span className="relative mt-2 inline-flex w-fit items-center rounded-full bg-lime px-3 py-1 text-[12.5px] font-bold text-brand-deep">
                      See all ↗
                    </span>
                  </Link>
                </div>
              </Panel>
            )}
          </div>

          <div
            className="relative"
            onMouseEnter={() => enter("work")}
            onMouseLeave={leave}
          >
            {trigger("work", "Our work", active(["/work"]))}
            {menu === "work" && (
              <Panel align="center">
                <div className="grid grid-cols-2 gap-2">
                  {FEATURED.map((p) => (
                    <PhotoTile
                      key={p.slug}
                      t={{
                        label: p.name,
                        href: `/work/${p.slug}`,
                        hint: `${p.category} · ${p.location}`,
                        photo: p.cover,
                      }}
                      onClick={close}
                    />
                  ))}
                </div>
                <div className="mt-2 grid grid-cols-4 gap-2">
                  {[
                    ["Villas", "/work#projects"],
                    ["Penthouses", "/work#projects"],
                    ["Apartments", "/work#projects"],
                    ["Commercial", "/work#projects"],
                  ].map(([l, h]) => (
                    <Link
                      key={l}
                      href={h}
                      onClick={close}
                      className="rounded-[12px] border border-line px-3 py-2 text-center text-[13px] font-semibold text-ink-2 transition hover:border-brand-deep hover:bg-brand-deep hover:text-white"
                    >
                      {l}
                    </Link>
                  ))}
                </div>
                <Link
                  href="/work"
                  onClick={close}
                  className="mt-2 flex items-center justify-between rounded-[16px] bg-ink px-4 py-3 text-white transition hover:bg-brand-deep"
                >
                  <span className="text-[13.5px]">
                    <b>15+ years</b> of villas, penthouses, offices and
                    restaurants
                  </span>
                  <span className="text-[13px] font-bold text-lime">
                    View all projects ↗
                  </span>
                </Link>
              </Panel>
            )}
          </div>

          <div
            className="relative"
            onMouseEnter={() => enter("community")}
            onMouseLeave={leave}
          >
            {trigger(
              "community",
              "Community",
              active([
                "/community",
                "/roommates",
                "/tools",
                "/blog",
                "/manager",
              ]),
            )}
            {menu === "community" && (
              <Panel align="center">
                <div className="grid grid-cols-3 gap-2">
                  {COMMUNITY.map((t) => (
                    <PhotoTile key={t.href} t={t} onClick={close} />
                  ))}
                </div>
              </Panel>
            )}
          </div>
        </nav>

        <div className="flex items-center gap-2">
          <Link
            href="/win"
            className="group relative hidden h-10 items-center gap-1.5 overflow-hidden whitespace-nowrap rounded-full bg-lime px-4 text-[13.5px] font-bold text-brand-deep shadow-[0_8px_24px_rgb(211_240_185/0.7)] transition hover:-translate-y-0.5 md:flex"
          >
            <span
              aria-hidden
              className="absolute inset-0 -translate-x-full bg-[linear-gradient(100deg,transparent,rgb(255_255_255/0.7),transparent)] transition-transform duration-700 group-hover:translate-x-full"
            />
            <Trophy /> <span className="relative">Win AED 5,000</span>
          </Link>
          <Link
            href="/list"
            className="hidden h-10 items-center whitespace-nowrap rounded-full bg-brand-deep px-4 text-[14px] font-semibold text-white transition hover:-translate-y-0.5 hover:bg-brand hover:shadow-[0_10px_24px_rgb(18_61_46/0.3)] sm:inline-flex"
          >
            List your place
          </Link>
          {me ? (
            <Link
              href="/account"
              aria-label="Your account"
              className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-mint text-[15px] font-bold text-brand ring-2 ring-white shadow-[0_0_0_1px_rgb(0_0_0/0.08)] transition hover:ring-lime"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              {me.picture ? (
                <img
                  src={me.picture}
                  alt=""
                  className="h-full w-full object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : (
                me.name[0]
              )}
            </Link>
          ) : (
            <Link
              href="/login"
              className="hidden h-10 items-center whitespace-nowrap rounded-full border border-line px-4 text-[14px] font-semibold transition hover:border-brand-deep hover:text-brand-deep lg:inline-flex"
            >
              Sign in
            </Link>
          )}
          <button
            className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-brand-deep text-white lg:hidden"
            onClick={() => setSheet(true)}
            aria-expanded={sheet}
            aria-label="Open menu"
          >
            <Icon name="menu" />
          </button>
        </div>
      </div>

      {/* Phone: an app-style sheet. Four tabs of tiles, never a long list. */}
      {sheet &&
        createPortal(
          <div
            className="fixed inset-0 z-[200] lg:hidden"
            role="dialog"
            aria-modal="true"
            aria-label="Menu"
          >
            <button
              className="absolute inset-0 animate-[fadeIn_.2s_ease] bg-black/45 backdrop-blur-[2px]"
              aria-label="Close menu"
              onClick={() => setSheet(false)}
            />
            <div className="absolute inset-x-0 bottom-0 flex max-h-[88vh] animate-[sheetUp_.28s_cubic-bezier(.2,.8,.2,1)] flex-col rounded-t-[30px] bg-white shadow-[0_-30px_80px_rgb(0_0_0/0.3)]">
              <div className="flex items-center justify-between px-5 pb-2 pt-3">
                <span
                  aria-hidden
                  className="absolute left-1/2 top-2 h-1.5 w-10 -translate-x-1/2 rounded-full bg-line-strong"
                />
                <Link
                  href="/"
                  onClick={() => setSheet(false)}
                  className="mt-2 text-ink"
                >
                  <Logo />
                </Link>
                <button
                  onClick={() => setSheet(false)}
                  aria-label="Close menu"
                  className="mt-2 flex h-10 w-10 items-center justify-center rounded-full bg-surface"
                >
                  <Icon name="close" size={18} />
                </button>
              </div>

              <div className="mx-5 mt-1 grid grid-cols-4 gap-1 rounded-full bg-surface p-1">
                {(
                  [
                    ["rent", "Rent"],
                    ["services", "Services"],
                    ["work", "Our work"],
                    ["more", "More"],
                  ] as const
                ).map(([k, l]) => (
                  <button
                    key={k}
                    onClick={() => setTab(k)}
                    className={`h-9 rounded-full text-[13px] font-semibold transition ${tab === k ? "bg-brand-deep text-white shadow" : "text-ink-2"}`}
                  >
                    {l}
                  </button>
                ))}
              </div>

              <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
                {tab === "rent" && (
                  <div className="grid grid-cols-2 gap-2">
                    {RENT.map((t) => (
                      <PhotoTile
                        key={t.href}
                        t={t}
                        size="sm"
                        onClick={() => setSheet(false)}
                      />
                    ))}
                  </div>
                )}
                {tab === "services" && (
                  <>
                    <div className="grid grid-cols-4 gap-2">
                      {POPULAR_SERVICES.map((s) =>
                        SERVICES.find((x) => x.slug === s),
                      )
                        .filter((x) => !!x)
                        .map((x) => (
                          <Link
                            key={x!.slug}
                            href={`/services/${x!.slug}`}
                            onClick={() => setSheet(false)}
                            className="flex flex-col items-center gap-1.5 text-center"
                          >
                            <span className="relative h-16 w-full overflow-hidden rounded-[16px] bg-surface ring-1 ring-black/5">
                              <Image
                                src={x!.photo}
                                alt=""
                                fill
                                sizes="90px"
                                className="object-cover"
                              />
                            </span>
                            <span className="line-clamp-2 text-[11.5px] font-semibold leading-tight text-ink">
                              {x!.name}
                            </span>
                          </Link>
                        ))}
                    </div>
                    <Link
                      href="/services"
                      onClick={() => setSheet(false)}
                      className="mt-4 flex items-center justify-between rounded-[16px] bg-[#ecf8ee] px-4 py-3 text-[14px] font-semibold text-brand-deep"
                    >
                      All {SERVICES.length} home services{" "}
                      <span aria-hidden>↗</span>
                    </Link>
                  </>
                )}
                {tab === "work" && (
                  <>
                    <div className="grid grid-cols-2 gap-2">
                      {FEATURED.map((p) => (
                        <PhotoTile
                          key={p.slug}
                          t={{
                            label: p.name,
                            href: `/work/${p.slug}`,
                            hint: p.location,
                            photo: p.cover,
                          }}
                          size="sm"
                          onClick={() => setSheet(false)}
                        />
                      ))}
                    </div>
                    <Link
                      href="/work"
                      onClick={() => setSheet(false)}
                      className="mt-3 flex items-center justify-between rounded-[16px] bg-ink px-4 py-3 text-[14px] font-semibold text-white"
                    >
                      All projects, 15+ years{" "}
                      <span className="text-lime">↗</span>
                    </Link>
                  </>
                )}
                {tab === "more" && (
                  <div className="grid grid-cols-3 gap-2">
                    {COMMUNITY.map((t) => (
                      <PhotoTile
                        key={t.href}
                        t={t}
                        size="sm"
                        onClick={() => setSheet(false)}
                      />
                    ))}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2 border-t border-line px-5 pb-[max(16px,env(safe-area-inset-bottom))] pt-3">
                <Link
                  href="/win"
                  onClick={() => setSheet(false)}
                  className="col-span-2 flex h-11 items-center justify-center gap-2 rounded-[14px] bg-lime text-[14px] font-bold text-brand-deep"
                >
                  <Trophy /> Win AED 500 to 5,000
                </Link>
                <Link
                  href="/list"
                  onClick={() => setSheet(false)}
                  className="flex h-11 items-center justify-center rounded-[14px] bg-brand-deep text-[14px] font-semibold text-white"
                >
                  List your place
                </Link>
                <Link
                  href={me ? "/account" : "/login"}
                  onClick={() => setSheet(false)}
                  className="flex h-11 items-center justify-center rounded-[14px] border border-line text-[14px] font-semibold"
                >
                  {me ? "Your account" : "Sign in"}
                </Link>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </header>
  );
}
