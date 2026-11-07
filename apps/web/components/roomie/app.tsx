"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { AREA_BY_SLUG, type Area } from "@stayshay/core/src/client.ts";
import type { PublicRoommate } from "@/lib/roommates";
import type { DeckResult, SwipeCard, Teaser } from "@/lib/swipe";
import { Icon, aed } from "../ui";
import { track } from "../analytics";
import { QuickSignIn, useMe } from "../quick-signin";
import { AreaCombobox } from "../search-bar";
import { PASS_PRICE } from "../community-lock";
import { RoomieOnboarding } from "./onboarding";
import { CheckedBadge, HeartFill, Portrait, ProfileDetails, RoundButton, Sheet, Upgrade, areaName, areasText, moveInText } from "./parts";

type Tab = "foryou" | "explore" | "requests";
type Mode = "all" | "looking" | "has_place";
interface Filters {
  mode: Mode;
  max: number;
  area: string | null;
}
type Me = PublicRoommate & { status: string };
interface Base {
  pass: boolean;
  unread: number;
  incoming: number;
  me: Me;
}
type ExploreItem = (SwipeCard & { liked: boolean }) | Teaser;
interface Connections {
  incoming: SwipeCard[];
  matches: SwipeCard[];
  sent: SwipeCard[];
}

const qs = (f: Filters) => {
  const q = new URLSearchParams({ mode: f.mode });
  if (f.max) q.set("max", String(f.max));
  if (f.area) q.set("area", f.area);
  return q.toString();
};
const post = (body: object) => fetch("/api/swipe", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) }).then((r) => r.json()).catch(() => null);

/**
 * The roommate app: For You (one card at a time), Explore (a grid) and Requests (people who want to
 * connect, your connections, requests you sent). Sign in and a profile come first. Non-members can open
 * FREE_SWIPES profiles in total; requesting to connect is free, messaging needs the Stayshay Pass.
 */
export function RoomieApp({ returnTo = "/roommates", people = 0 }: { returnTo?: "/roommates" | "/swipe"; people?: number }) {
  const { me: account, google, ready } = useMe();
  const [need, setNeed] = useState<"signin" | "profile" | null>(null);
  const [base, setBase] = useState<Base | null>(null);
  const [tab, setTab] = useState<Tab>("foryou");
  const [filters, setFilters] = useState<Filters>({ mode: "all", max: 0, area: null });
  const [deck, setDeck] = useState<DeckResult | null>(null);
  const [grid, setGrid] = useState<{ items: ExploreItem[]; used: number; free: number; unlimited: boolean } | null>(null);
  const [conn, setConn] = useState<Connections | null>(null);
  const [details, setDetails] = useState<SwipeCard | null>(null);
  const [upgrade, setUpgrade] = useState<{ title: string; line: string } | null>(null);
  const [compose, setCompose] = useState<SwipeCard | null>(null);
  const [match, setMatch] = useState<SwipeCard | null>(null);
  const [filterSheet, setFilterSheet] = useState(false);
  const [editing, setEditing] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [banner, setBanner] = useState<string | null>(null);

  const say = (t: string) => {
    setToast(t);
    setTimeout(() => setToast((x) => (x === t ? null : x)), 2600);
  };

  const load = useCallback(
    async (view: Tab = tab) => {
      const v = view === "foryou" ? "deck" : view === "explore" ? "explore" : "connections";
      const r = await fetch(`/api/swipe?view=${v}&${qs(filters)}`, { cache: "no-store" }).catch(() => null);
      if (!r) return;
      if (r.status === 401) return setNeed("signin");
      if (r.status === 409) return setNeed("profile");
      const j = await r.json();
      setNeed(null);
      setBase({ pass: j.pass, unread: j.unread, incoming: j.incoming, me: j.me });
      if (j.deck) setDeck(j.deck);
      if (j.explore) setGrid(j.explore);
      if (j.connections) setConn(j.connections);
    },
    [tab, filters],
  );

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    if (q.get("welcome") === "1") setBanner("Welcome to the Stayshay Pass. See everyone and message your connections.");
    if (q.get("canceled") === "1") setBanner("Payment cancelled. You can upgrade any time.");
    const t = q.get("tab");
    if (t === "explore" || t === "requests") setTab(t);
  }, []);

  const pass = base?.pass ?? false;
  const area = base?.me.areaSlugs[0] ?? null;
  const openUpgrade = (title: string, line: string) => {
    track("roomie_paywall", { title });
    setUpgrade({ title, line });
  };

  /* ---------- actions ---------- */

  const connect = async (c: SwipeCard, from: "card" | "grid" | "request") => {
    const r = await post({ id: c.id, action: "like" });
    if (!r?.ok) return say("Couldn’t send that. Try again.");
    track(from === "request" ? "roomie_accept" : "roomie_connect", { profile_id: c.id });
    if (r.match) setMatch(c);
    else say(`You liked ${c.firstName}`);
  };
  const pass_ = async (c: SwipeCard) => {
    await post({ id: c.id, action: "skip" });
    track("roomie_pass", { profile_id: c.id });
  };
  const message = (c: SwipeCard) => {
    if (!pass) return openUpgrade(`Message ${c.firstName}`, "Messaging is for Stayshay Pass members, so everyone you talk to is serious about finding a flatmate.");
    setCompose(c);
  };
  const reveal = async (t: Teaser) => {
    const r = await post({ id: t.id, action: "reveal" });
    if (r?.state === "card") {
      setDetails(r.card);
      load("explore");
    } else openUpgrade(`You’ve opened your ${grid?.free ?? 6} free profiles`, "Get the Stayshay Pass to see every profile and message your matches.");
  };

  /* ---------- gates ---------- */

  if (need === "signin" || (ready && !account && !base)) return <SignInGate google={google} people={people} next={returnTo} />;
  if (need === "profile" || editing)
    return (
      <Frame>
        <RoomieOnboarding
          me={account && { name: account.name, phone: account.phone, email: account.email }}
          existing={editing ? (base?.me ?? null) : null}
          onCancel={editing ? () => setEditing(false) : undefined}
          onDone={({ updated }) => {
            setEditing(false);
            setBanner(updated ? "Saved. Your changes show to others once our team approves them." : "Your profile is in. Others will see you once our team approves it, usually within a few hours. Start exploring now.");
            load("foryou");
            setTab("foryou");
          }}
        />
      </Frame>
    );
  if (!base) return <Frame><div className="m-5 h-[600px] animate-pulse rounded-[30px] bg-white/[0.05]" /></Frame>;

  const used = deck?.used ?? grid?.used ?? 0;
  const free = deck?.free ?? grid?.free ?? 6;
  const left = Math.max(0, free - used);
  const activeChips = [
    filters.mode !== "all" && { k: "mode", t: filters.mode === "has_place" ? "Has a place" : "Looking to share", clear: () => setFilters({ ...filters, mode: "all" }) },
    filters.max > 0 && { k: "max", t: `Under ${filters.max.toLocaleString("en-US")}`, clear: () => setFilters({ ...filters, max: 0 }) },
    filters.area && { k: "area", t: areaName(filters.area), clear: () => setFilters({ ...filters, area: null }) },
  ].filter(Boolean) as { k: string; t: string; clear: () => void }[];

  return (
    <Frame>
      {/* top bar */}
      <div className="flex items-center justify-between gap-2 px-4 pt-4">
        <button onClick={() => setEditing(true)} aria-label="Your profile" className="relative h-11 w-11 shrink-0 overflow-hidden rounded-full ring-2 ring-white/10">
          <Portrait p={base.me} />
          {base.me.status === "pending" && <span className="absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full border-2 border-[#101614] bg-amber-400" />}
        </button>
        <div className="flex rounded-full bg-white/[0.07] p-1 text-[13.5px] font-semibold sm:text-[14px]">
          {(
            [
              ["foryou", "For You"],
              ["explore", "Explore"],
              ["requests", "Likes"],
            ] as const
          ).map(([t, label]) => (
            <button key={t} onClick={() => setTab(t)} className={`relative h-9 whitespace-nowrap rounded-full px-3 transition sm:h-10 sm:px-4 ${tab === t ? "bg-white/[0.14] text-white" : "text-white/55"}`}>
              {label}
              {t === "requests" && base.incoming > 0 && <span className="absolute -right-0.5 -top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-[#e94b8a] px-1 text-[10.5px] font-bold text-white">{base.incoming}</span>}
            </button>
          ))}
        </div>
        <Link href="/messages" aria-label="Messages" className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white/[0.07]">
          <Icon name="chat" size={19} />
          {base.unread > 0 && <span className="absolute -right-0.5 -top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-[#e94b8a] px-1 text-[10.5px] font-bold text-white">{base.unread}</span>}
        </Link>
      </div>

      {banner && (
        <button onClick={() => setBanner(null)} className="roomie-in mx-4 mt-3 block w-[calc(100%-2rem)] rounded-[16px] bg-lime/12 p-3.5 text-left text-[13.5px] font-medium text-lime">
          {banner}
        </button>
      )}

      {/* filters + allowance */}
      {tab !== "requests" && (
        <div className="mt-4 flex items-center gap-2 overflow-x-auto px-4 pb-1 roomie-scroll">
          <button onClick={() => setFilterSheet(true)} aria-label="Filters" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/[0.07]">
            <Icon name="sliders" size={17} />
          </button>
          {activeChips.map((c) => (
            <button key={c.k} onClick={c.clear} className="flex h-10 shrink-0 items-center gap-1.5 rounded-full bg-white/[0.1] px-3.5 text-[13.5px]">
              <Icon name="close" size={13} /> {c.t}
            </button>
          ))}
          {!activeChips.length &&
            (
              [
                ["Has a place", () => setFilters({ ...filters, mode: "has_place" })],
                ["Under 1,500", () => setFilters({ ...filters, max: 1500 })],
                ["Looking to share", () => setFilters({ ...filters, mode: "looking" })],
              ] as const
            ).map(([t, fn]) => (
              <button key={t} onClick={fn} className="h-10 shrink-0 rounded-full border border-white/10 px-3.5 text-[13.5px] text-white/70">
                {t}
              </button>
            ))}
        </div>
      )}
      {tab !== "requests" && (
        <div className="mt-2 flex items-center justify-between px-4 text-[12.5px] text-white/50">
          {pass ? (
            <b className="text-lime">Stayshay Pass · see everyone</b>
          ) : (
            <>
              <span>
                <b className="text-white">{left}</b> of {free} free profiles left
              </span>
              <button onClick={() => openUpgrade("See everyone", "The Stayshay Pass opens every profile and lets you message your matches.")} className="font-semibold text-lime">
                Upgrade
              </button>
            </>
          )}
        </div>
      )}

      <div className="px-4 pb-6 pt-3">
        {tab === "foryou" && <ForYou deck={deck} pass={pass} area={area} onConnect={(c) => connect(c, "card")} onPass={pass_} onMessage={message} onDetails={setDetails} reload={() => load("foryou")} onUpgrade={openUpgrade} />}
        {tab === "explore" && <Explore grid={grid} onOpen={setDetails} onReveal={reveal} onConnect={async (c) => { await connect(c, "grid"); load("explore"); }} />}
        {tab === "requests" && (
          <Requests
            conn={conn}
            pass={pass}
            onOpen={setDetails}
            onAccept={async (c) => { await connect(c, "request"); load("requests"); }}
            onDecline={async (c) => { await pass_(c); say(`Passed on ${c.firstName}`); load("requests"); }}
            onMessage={message}
            goSwipe={() => setTab("foryou")}
          />
        )}
      </div>

      {/* sheets */}
      {details && (
        <ProfileDetails
          c={details}
          onClose={() => setDetails(null)}
          actions={
            <div className="grid grid-cols-[1fr_auto] gap-2">
              <button
                onClick={() => {
                  const c = details;
                  setDetails(null);
                  connect(c, c.likedYou ? "request" : "grid").then(() => load());
                }}
                className="flex h-13 items-center justify-center gap-2 rounded-full bg-[linear-gradient(135deg,#ff6fa5,#e94b8a)] py-3.5 text-[15.5px] font-bold"
              >
                <HeartFill size={18} /> {details.likedYou ? "Like back" : "Like"}
              </button>
              <button onClick={() => { const c = details; setDetails(null); message(c); }} aria-label="Message" className="flex h-13 w-13 items-center justify-center rounded-full bg-white/10 px-4 text-lime">
                {!pass && <Icon name="lock" size={13} />} <Icon name="chat" size={19} />
              </button>
            </div>
          }
        />
      )}
      {upgrade && (
        <Sheet onClose={() => setUpgrade(null)}>
          <Upgrade area={area} returnTo={returnTo} title={upgrade.title} line={upgrade.line} />
        </Sheet>
      )}
      {compose && <Composer c={compose} onClose={() => setCompose(null)} />}
      {filterSheet && <FilterSheet f={filters} onClose={() => setFilterSheet(false)} onApply={(f) => { setFilters(f); setFilterSheet(false); }} />}
      {match && (
        <div className="fixed inset-0 z-[95] flex items-center justify-center bg-[radial-gradient(circle_at_50%_40%,#3a1428,#0b0f0d_70%)] p-6 text-center text-white" onClick={() => setMatch(null)}>
          <div className="roomie-rise" onClick={(e) => e.stopPropagation()}>
            <div className="mx-auto flex w-fit -space-x-6">
              <span className="h-28 w-28 overflow-hidden rounded-full ring-4 ring-[#0b0f0d]"><Portrait p={base.me} /></span>
              <span className="h-28 w-28 overflow-hidden rounded-full ring-4 ring-[#0b0f0d]"><Portrait p={match} /></span>
            </div>
            <p className="mt-6 text-[40px] font-bold leading-none tracking-[-0.03em]">It’s a match!</p>
            <p className="mt-3 text-[16px] text-white/70">You and {match.firstName} like each other.</p>
            <div className="mt-7 flex flex-col gap-3">
              <button onClick={() => { const c = match; setMatch(null); message(c); }} className="roomie-pulse h-14 rounded-full bg-[linear-gradient(135deg,#ff6fa5,#e94b8a)] px-8 text-[16px] font-bold">
                {pass ? `Message ${match.firstName}` : `Message · AED ${PASS_PRICE}/month`}
              </button>
              <button onClick={() => setMatch(null)} className="h-12 rounded-full text-[15px] font-semibold text-white/70">
                Keep looking
              </button>
            </div>
          </div>
        </div>
      )}
      {toast && <div className="roomie-in fixed bottom-24 left-1/2 z-[99] -translate-x-1/2 rounded-full bg-white px-5 py-3 text-[14px] font-semibold text-brand-deep shadow-xl">{toast}</div>}
    </Frame>
  );
}

/* ---------------- frame ---------------- */

/** Dark app surface: full-bleed on phones, a phone-sized panel on desktop. */
function Frame({ children }: { children: React.ReactNode }) {
  return <div className="relative mx-auto min-h-[calc(100dvh-140px)] w-full max-w-[480px] overflow-clip bg-[#101614] text-white md:min-h-[780px] md:rounded-[40px] md:shadow-[0_40px_100px_rgb(0_0_0/0.35)] md:ring-1 md:ring-white/10">{children}</div>;
}

function SignInGate({ google, people, next }: { google: boolean; people: number; next: string }) {
  return (
    <Frame>
      <div className="relative min-h-[calc(100dvh-140px)] md:min-h-[780px]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/photos/roommates.jpg" alt="" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgb(8_14_12/0.35)_0%,rgb(8_14_12/0.2)_30%,rgb(8_14_12/0.92)_68%,#101614_100%)]" />
        <div className="absolute inset-x-0 top-0 flex gap-1.5 px-5 pt-5">
          {[0, 1, 2, 3].map((n) => (
            <span key={n} className="h-[3px] flex-1 overflow-hidden rounded-full bg-white/25">
              {n === 0 && <span className="block h-full w-full origin-left rounded-full bg-lime" style={{ animation: "roomie-bar 3s linear both" }} />}
            </span>
          ))}
        </div>
        <div className="relative flex min-h-[calc(100dvh-140px)] flex-col justify-end p-6 md:min-h-[780px]">
          <span className="w-fit rounded-full bg-black/35 px-3.5 py-1.5 text-[13px] font-semibold backdrop-blur">
            <span className="mr-1.5 inline-block h-2 w-2 rounded-full bg-[#5ee08c]" />
            {people > 0 ? `${people} ${people === 1 ? "person" : "people"} looking right now` : "Roommates across Dubai"}
          </span>
          <h2 className="mt-5 text-[44px] font-extrabold uppercase leading-[0.92] tracking-[-0.04em]">
            Find the one you’d share a kitchen with.
          </h2>
          <p className="mt-4 text-[15.5px] leading-relaxed text-white/75">Real people, checked by our team, matched on budget, area and routine. Make your profile, swipe right on people you like, and match.</p>
          <div className="mt-6 space-y-3 [&_p]:text-white/55 [&_span.h-px]:bg-white/15">
            <QuickSignIn next={next} google={google} note="Takes a minute. Your number is never shown." />
            <Link href={`/login?next=${encodeURIComponent(next)}`} className="flex h-13 items-center justify-center rounded-full bg-lime py-3.5 text-[16px] font-bold text-brand-deep">
              Continue with email
            </Link>
          </div>
        </div>
      </div>
    </Frame>
  );
}

/* ---------------- For You ---------------- */

function ForYou({
  deck,
  pass,
  area,
  onConnect,
  onPass,
  onMessage,
  onDetails,
  reload,
  onUpgrade,
}: {
  deck: DeckResult | null;
  pass: boolean;
  area: string | null;
  onConnect: (c: SwipeCard) => Promise<void>;
  onPass: (c: SwipeCard) => Promise<void>;
  onMessage: (c: SwipeCard) => void;
  onDetails: (c: SwipeCard) => void;
  reload: () => Promise<void>;
  onUpgrade: (t: string, l: string) => void;
}) {
  const [drag, setDrag] = useState({ x: 0, y: 0 });
  const [leaving, setLeaving] = useState<"left" | "right" | null>(null);
  const start = useRef<{ x: number; y: number } | null>(null);
  const cur = deck?.state === "card" ? deck.card : null;

  const decide = async (dir: "left" | "right") => {
    if (!cur || leaving) return;
    setLeaving(dir);
    await (dir === "right" ? onConnect(cur) : onPass(cur));
    setTimeout(async () => {
      await reload();
      setLeaving(null);
      setDrag({ x: 0, y: 0 });
    }, 230);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (document.querySelector('[role="dialog"]')) return;
      if (e.key === "ArrowRight") decide("right");
      if (e.key === "ArrowLeft") decide("left");
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  if (!deck) return <div className="aspect-[3/4.3] animate-pulse rounded-[32px] bg-white/[0.05]" />;

  if (deck.state === "locked")
    return (
      <div className="roomie-in overflow-hidden rounded-[32px] bg-[linear-gradient(160deg,#1c2a24,#101614)] ring-1 ring-white/10">
        <div className="relative h-[180px] overflow-hidden">
          <div className="absolute inset-0 flex items-center justify-center gap-3 blur-[10px]">
            {[0, 1, 2].map((n) => (
              <span key={n} className={`h-36 w-28 rounded-[22px] ${n === 1 ? "bg-[#7a4a63]" : "bg-[#2f6b57]"}`} />
            ))}
          </div>
          <span className="absolute inset-0 flex items-center justify-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-lime text-brand-deep shadow-xl">
              <Icon name="lock" size={22} />
            </span>
          </span>
        </div>
        <Upgrade area={area} title={`You’ve seen your ${deck.free} free profiles`} line={`${deck.remaining} more ${deck.remaining === 1 ? "person fits" : "people fit"} what you’re looking for. Upgrade to keep going and message your matches.`} />
      </div>
    );

  if (!cur)
    return (
      <div className="roomie-in flex aspect-[3/4] flex-col items-center justify-center rounded-[32px] bg-white/[0.04] p-8 text-center ring-1 ring-white/10">
        <p className="text-[24px] font-bold">You’ve seen everyone for now</p>
        <p className="mt-2 text-[14.5px] text-white/60">New people join every day. Check your requests, try Explore, or loosen the filters.</p>
      </div>
    );

  const x = leaving === "right" ? 600 : leaving === "left" ? -600 : drag.x;
  const rot = x / 20;

  return (
    <div>
      <div className="relative mx-auto aspect-[3/4.3] max-h-[calc(100dvh-440px)] min-h-[360px] w-full select-none md:max-h-[490px]">
        {/* the stack behind */}
        <div className="absolute inset-x-5 -top-2 bottom-4 rounded-[32px] bg-white/[0.05] ring-1 ring-white/10" />
        <div
          className="absolute inset-0 cursor-grab touch-pan-y overflow-hidden rounded-[32px] bg-[#1a221f] shadow-[0_24px_60px_rgb(0_0_0/0.45)] active:cursor-grabbing"
          style={{ transform: `translate(${x}px, ${leaving ? 0 : drag.y * 0.2}px) rotate(${rot}deg)`, transition: start.current ? "none" : "transform .23s ease-out" }}
          onPointerDown={(e) => {
            start.current = { x: e.clientX, y: e.clientY };
            (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
          }}
          onPointerMove={(e) => start.current && setDrag({ x: e.clientX - start.current.x, y: e.clientY - start.current.y })}
          onPointerUp={() => {
            const d = drag;
            start.current = null;
            if (d.x > 100) decide("right");
            else if (d.x < -100) decide("left");
            else {
              setDrag({ x: 0, y: 0 });
              if (Math.abs(d.x) < 6 && Math.abs(d.y) < 6) onDetails(cur);
            }
          }}
        >
          <Portrait p={cur} />
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgb(0_0_0/0.25)_0%,rgb(0_0_0/0)_22%,rgb(0_0_0/0)_48%,rgb(8_14_12/0.94)_100%)]" />
          <div className="absolute inset-x-4 top-4 flex items-start justify-between">
            <span className={`rounded-full px-3 py-1.5 text-[12.5px] font-bold backdrop-blur ${cur.mode === "has_place" ? "bg-lime text-brand-deep" : "bg-black/35 text-white"}`}>{cur.mode === "has_place" ? "Has a place" : "Looking to share"}</span>
            {cur.likedYou && <span className="roomie-pulse rounded-full bg-[#e94b8a] px-3 py-1.5 text-[12.5px] font-bold">Likes you</span>}
          </div>
          {x > 40 && <span className="absolute left-6 top-20 -rotate-12 rounded-[14px] border-[3px] border-[#ff6fa5] px-3 py-1 text-[22px] font-extrabold text-[#ff6fa5]">LIKE</span>}
          {x < -40 && <span className="absolute right-6 top-20 rotate-12 rounded-[14px] border-[3px] border-white/80 px-3 py-1 text-[22px] font-extrabold">NOPE</span>}
          <div className="absolute inset-x-0 bottom-0 p-5">
            <p className="flex items-center gap-2 text-[32px] font-bold leading-none tracking-[-0.02em]">
              {cur.firstName}
              {cur.age ? `, ${cur.age}` : ""} <CheckedBadge size={24} />
            </p>
            <p className="mt-2 truncate text-[14px] text-white/75">{[cur.nationality, cur.profession].filter(Boolean).join(" · ")}</p>
            <div className="mt-3 flex items-center justify-between gap-2">
              <span className="flex min-w-0 items-center gap-2 rounded-full bg-black/35 px-3 py-1.5 text-[13px] backdrop-blur">
                <span className="h-2 w-2 shrink-0 rounded-full bg-[#5ee08c]" />
                <span className="truncate">
                  {aed(cur.budget)} · {areasText(cur, 1)} · {moveInText(cur.moveIn)}
                </span>
              </span>
              <button
                onPointerDown={(e) => e.stopPropagation()}
                onPointerUp={(e) => e.stopPropagation()}
                onClick={() => onDetails(cur)}
                aria-label="See details"
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-black/35 backdrop-blur"
              >
                <Icon name="chevron-down" size={18} />
              </button>
            </div>
            {cur.score > 0 && (
              <p className="mt-2.5 text-[12.5px] font-semibold text-lime">
                {cur.score}% fit{cur.reasons[0] ? ` · ${cur.reasons.slice(0, 2).join(" · ")}` : ""}
              </p>
            )}
          </div>
        </div>
      </div>
      <div className="mt-4 flex items-center justify-center gap-5">
        <RoundButton kind="pass" label="Nope" onClick={() => decide("left")} />
        <RoundButton kind="connect" label={cur.likedYou ? "Like back" : "Like"} onClick={() => decide("right")} />
        <RoundButton kind="message" label="Message" onClick={() => onMessage(cur)} />
      </div>
      <p className="mt-3 text-center text-[12px] text-white/40">
        Swipe right to like, left to pass · tap for details
      </p>
      {!pass && deck.state === "card" && deck.used >= deck.free - 1 && (
        <button onClick={() => onUpgrade("Keep swiping without limits", "This is your last free profile. The Stayshay Pass opens everyone and lets you message your matches.")} className="mx-auto mt-3 block text-[13px] font-semibold text-lime">
          Last free profile · Upgrade
        </button>
      )}
    </div>
  );
}

/* ---------------- Explore ---------------- */

function Explore({ grid, onOpen, onReveal, onConnect }: { grid: { items: ExploreItem[] } | null; onOpen: (c: SwipeCard) => void; onReveal: (t: Teaser) => void; onConnect: (c: SwipeCard) => Promise<void> }) {
  if (!grid) return <div className="grid grid-cols-2 gap-3">{[0, 1, 2, 3].map((n) => <div key={n} className="aspect-[3/4.3] animate-pulse rounded-[26px] bg-white/[0.05]" />)}</div>;
  if (!grid.items.length) return <p className="py-16 text-center text-[15px] text-white/60">No one matches these filters yet. Try removing one.</p>;
  return (
    <>
      <h3 className="mb-3 text-[30px] font-bold tracking-[-0.03em]">Explore</h3>
      <div className="grid grid-cols-2 gap-3">
        {grid.items.map((it, n) =>
          "locked" in it ? (
            <button key={it.id} onClick={() => onReveal(it)} className="roomie-in group relative aspect-[3/4.3] overflow-hidden rounded-[26px] text-left" style={{ animationDelay: `${Math.min(n, 10) * 30}ms` }}>
              <div className={`absolute inset-0 blur-[2px] ${n % 3 === 0 ? "bg-[radial-gradient(120%_90%_at_30%_10%,#7a4a63,#20151d)]" : n % 3 === 1 ? "bg-[radial-gradient(120%_90%_at_30%_10%,#2f6b57,#0f1f19)]" : "bg-[radial-gradient(120%_90%_at_30%_10%,#3d5a86,#121a26)]"}`} />
              <div className="absolute inset-0 bg-[repeating-linear-gradient(135deg,rgb(255_255_255/0.03)_0_8px,transparent_8px_16px)]" />
              <p className="absolute left-3.5 top-3.5 text-[24px] font-extrabold leading-[0.95] tracking-[-0.03em] text-white/85">
                {it.score}%
                <br />
                <span className="text-[14px] font-semibold tracking-normal text-white/60">fit</span>
              </p>
              <span className="absolute inset-x-0 bottom-14 text-center text-[12.5px] text-white/70">
                {aed(it.budget)} · {it.area ? areaName(it.area) : "Any area"}
              </span>
              <span className="absolute bottom-3 left-1/2 flex h-11 w-11 -translate-x-1/2 items-center justify-center rounded-full bg-black/45 backdrop-blur transition group-hover:bg-lime group-hover:text-brand-deep">
                <Icon name="lock" size={17} />
              </span>
            </button>
          ) : (
            <div key={it.id} className="roomie-in relative aspect-[3/4.3] overflow-hidden rounded-[26px]" style={{ animationDelay: `${Math.min(n, 10) * 30}ms` }}>
              <button onClick={() => onOpen(it)} className="absolute inset-0" aria-label={`Open ${it.firstName}’s profile`}>
                <Portrait p={it} />
              </button>
              <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgb(0_0_0/0.45)_0%,rgb(0_0_0/0)_40%,rgb(0_0_0/0)_65%,rgb(0_0_0/0.55)_100%)]" />
              <p className="pointer-events-none absolute left-3.5 right-3 top-3 text-[26px] font-extrabold leading-[0.95] tracking-[-0.035em]">
                {it.firstName}
                {it.age ? <span className="block text-[15px] font-semibold tracking-normal text-white/80">{it.age} · {aed(it.budget)}</span> : <span className="block text-[15px] font-semibold tracking-normal text-white/80">{aed(it.budget)}</span>}
              </p>
              {it.likedYou && !it.liked && <span className="pointer-events-none absolute right-3 top-3 h-3 w-3 rounded-full bg-[#e94b8a] ring-2 ring-black/30" />}
              <button
                onClick={() => !it.liked && onConnect(it)}
                aria-label={it.liked ? "Liked" : "Like"}
                className={`absolute bottom-3 left-1/2 flex h-12 w-12 -translate-x-1/2 items-center justify-center rounded-full backdrop-blur transition active:scale-90 ${it.liked ? "bg-[#e94b8a] text-white" : "bg-black/40 text-white hover:bg-white/25"}`}
              >
                <HeartFill size={21} />
              </button>
            </div>
          ),
        )}
      </div>
    </>
  );
}

/* ---------------- Requests ---------------- */

function Requests({
  conn,
  pass,
  onOpen,
  onAccept,
  onDecline,
  onMessage,
  goSwipe,
}: {
  conn: Connections | null;
  pass: boolean;
  onOpen: (c: SwipeCard) => void;
  onAccept: (c: SwipeCard) => Promise<void>;
  onDecline: (c: SwipeCard) => Promise<void>;
  onMessage: (c: SwipeCard) => void;
  goSwipe: () => void;
}) {
  if (!conn) return <div className="h-[400px] animate-pulse rounded-[26px] bg-white/[0.05]" />;
  const none = !conn.incoming.length && !conn.matches.length && !conn.sent.length;
  if (none)
    return (
      <div className="py-14 text-center">
        <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-white/[0.07] text-[#ff6fa5]">
          <HeartFill size={28} />
        </span>
        <p className="mt-5 text-[22px] font-bold">No likes yet</p>
        <p className="mx-auto mt-2 max-w-[300px] text-[14.5px] text-white/60">Swipe right on people you like. When someone likes you back, it’s a match and shows up here.</p>
        <button onClick={goSwipe} className="mt-6 h-12 rounded-full bg-white px-6 text-[15px] font-bold text-brand-deep">
          Start swiping
        </button>
      </div>
    );
  const Row = ({ c, children }: { c: SwipeCard; children: React.ReactNode }) => (
    <li className="roomie-in flex items-center gap-3 rounded-[22px] bg-white/[0.05] p-3">
      <button onClick={() => onOpen(c)} className="h-16 w-16 shrink-0 overflow-hidden rounded-[18px]">
        <Portrait p={c} />
      </button>
      <button onClick={() => onOpen(c)} className="min-w-0 flex-1 text-left">
        <p className="truncate text-[16px] font-bold">
          {c.firstName}
          {c.age ? `, ${c.age}` : ""}
        </p>
        <p className="truncate text-[13px] text-white/55">
          {aed(c.budget)} · {areasText(c, 1)} · {c.score}% fit
        </p>
      </button>
      {children}
    </li>
  );
  return (
    <div className="space-y-7">
      {conn.incoming.length > 0 && (
        <section>
          <h3 className="mb-3 text-[13px] font-bold uppercase tracking-[0.1em] text-[#ff8fb8]">Liked you · {conn.incoming.length}</h3>
          <ul className="space-y-2.5">
            {conn.incoming.map((c) => (
              <Row key={c.id} c={c}>
                <button onClick={() => onDecline(c)} aria-label={`Pass on ${c.firstName}`} className="flex h-11 w-11 items-center justify-center rounded-full bg-white/[0.08]">
                  <Icon name="close" size={17} />
                </button>
                <button onClick={() => onAccept(c)} className="h-11 rounded-full bg-[linear-gradient(135deg,#ff6fa5,#e94b8a)] px-4 text-[14px] font-bold">
                  Like back
                </button>
              </Row>
            ))}
          </ul>
        </section>
      )}
      {conn.matches.length > 0 && (
        <section>
          <h3 className="mb-3 text-[13px] font-bold uppercase tracking-[0.1em] text-lime">Matches · {conn.matches.length}</h3>
          <ul className="space-y-2.5">
            {conn.matches.map((c) => (
              <Row key={c.id} c={c}>
                <button onClick={() => onMessage(c)} className="flex h-11 items-center gap-1.5 rounded-full bg-lime px-4 text-[14px] font-bold text-brand-deep">
                  {!pass && <Icon name="lock" size={13} />} Message
                </button>
              </Row>
            ))}
          </ul>
        </section>
      )}
      {conn.sent.length > 0 && (
        <section>
          <h3 className="mb-3 text-[13px] font-bold uppercase tracking-[0.1em] text-white/45">You liked · {conn.sent.length}</h3>
          <ul className="space-y-2.5">
            {conn.sent.map((c) => (
              <Row key={c.id} c={c}>
                <span className="shrink-0 rounded-full bg-white/[0.07] px-3 py-1.5 text-[12px] text-white/60">Waiting</span>
              </Row>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

/* ---------------- message + filters ---------------- */

function Composer({ c, onClose }: { c: SwipeCard; onClose: () => void }) {
  const [text, setText] = useState(`Hi ${c.firstName}, I saw your profile on Stayshay. `);
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const send = async () => {
    setBusy(true);
    setError(null);
    const r = await fetch("/api/messages", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ to: c.id, text }) }).catch(() => null);
    const j = await r?.json().catch(() => null);
    setBusy(false);
    if (j?.ok) {
      track("roommate_message", { profile_id: c.id });
      setSent(true);
    } else setError(j?.error === "slow_down" ? "You’re sending a lot. Please wait a few minutes." : "Couldn’t send. Please try again.");
  };
  return (
    <Sheet onClose={onClose}>
      <div className="p-6">
        {sent ? (
          <div className="py-4 text-center">
            <p className="text-[22px] font-bold">Sent to {c.firstName}</p>
            <p className="mt-1 text-[14px] text-white/60">You’ll see the reply in Messages.</p>
            <Link href={`/messages?with=${c.id}`} className="mt-6 inline-flex h-12 items-center rounded-full bg-lime px-6 text-[15px] font-bold text-brand-deep">
              Open conversation
            </Link>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-3">
              <span className="h-12 w-12 overflow-hidden rounded-full"><Portrait p={c} /></span>
              <p className="text-[19px] font-bold">Message {c.firstName}</p>
            </div>
            <textarea value={text} onChange={(e) => setText(e.target.value)} maxLength={1000} rows={5} className="mt-4 w-full resize-none rounded-[20px] border border-white/12 bg-white/[0.06] p-4 text-[16px] text-white outline-none focus:border-lime" />
            {error && <p className="mt-2 text-[13px] font-semibold text-[#ffb4b4]">{error}</p>}
            <button onClick={send} disabled={busy || !text.trim()} className="mt-3 h-13 w-full rounded-full bg-lime py-3.5 text-[16px] font-bold text-brand-deep disabled:opacity-50">
              {busy ? "Sending…" : "Send"}
            </button>
            <p className="mt-3 text-center text-[12px] text-white/40">Meet in a public place first. Never pay before you’ve seen the room.</p>
          </>
        )}
      </div>
    </Sheet>
  );
}

function FilterSheet({ f, onClose, onApply }: { f: Filters; onClose: () => void; onApply: (f: Filters) => void }) {
  const [v, setV] = useState(f);
  const chip = (on: boolean) => `h-11 rounded-full border px-4 text-[14.5px] font-medium ${on ? "border-lime bg-lime text-brand-deep" : "border-white/14 bg-white/[0.05] text-white/85"}`;
  return (
    <Sheet onClose={onClose}>
      <div className="p-6">
        <p className="text-[24px] font-bold">Filters</p>
        <p className="mb-2 mt-5 text-[13px] font-semibold uppercase tracking-[0.08em] text-white/50">Show me</p>
        <div className="flex flex-wrap gap-2">
          {(
            [
              ["all", "Everyone"],
              ["has_place", "Has a place"],
              ["looking", "Looking to share"],
            ] as const
          ).map(([m, t]) => (
            <button key={m} onClick={() => setV({ ...v, mode: m })} className={chip(v.mode === m)}>
              {t}
            </button>
          ))}
        </div>
        <p className="mb-2 mt-6 text-[13px] font-semibold uppercase tracking-[0.08em] text-white/50">Budget up to</p>
        <div className="flex flex-wrap gap-2">
          {[0, 1000, 1500, 2500, 4000].map((m) => (
            <button key={m} onClick={() => setV({ ...v, max: m })} className={chip(v.max === m)}>
              {m ? `AED ${m.toLocaleString("en-US")}` : "Any"}
            </button>
          ))}
        </div>
        <p className="mb-2 mt-6 text-[13px] font-semibold uppercase tracking-[0.08em] text-white/50">Area</p>
        {v.area ? (
          <button onClick={() => setV({ ...v, area: null })} className="flex h-11 items-center gap-2 rounded-full bg-lime px-4 text-[14.5px] font-semibold text-brand-deep">
            {areaName(v.area)} <Icon name="close" size={14} />
          </button>
        ) : (
          <div className="rounded-[18px] bg-white px-4 py-3 text-ink">
            <AreaCombobox value={null} onChange={(a: Area | null) => a && AREA_BY_SLUG.has(a.slug) && setV({ ...v, area: a.slug })} />
          </div>
        )}
        <div className="mt-8 grid grid-cols-[auto_1fr] gap-2">
          <button onClick={() => setV({ mode: "all", max: 0, area: null })} className="h-13 rounded-full px-5 text-[15px] font-semibold text-white/70">
            Clear
          </button>
          <button onClick={() => onApply(v)} className="h-13 rounded-full bg-white py-3.5 text-[16px] font-bold text-brand-deep">
            Show people
          </button>
        </div>
      </div>
    </Sheet>
  );
}
