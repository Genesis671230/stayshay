"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Listing } from "@stayshay/core/src/client.ts";
import type { LockedRoommate, PublicRoommate } from "@/lib/roommates";
import type { PublicPost } from "@/lib/community";
import { RoommateCard } from "./roommates-page";
import { JoinButton, LockedCard, PASS_PRICE, useJoin } from "./community-lock";
import { ListingCard } from "./listing-card";
import { Icon } from "./ui";
import { stayshayWhatsapp } from "@/lib/contact";
import { track } from "./analytics";

type Question = PublicPost & { answers: PublicPost[] };
type Feed = { questions: Question[]; chat: PublicPost[] } | null;
type Tab = "people" | "ask" | "chat" | "members" | "places";

const ago = (iso: string) => {
  const s = (Date.now() - Date.parse(iso)) / 1000;
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m`;
  if (s < 86400) return `${Math.floor(s / 3600)}h`;
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
};

const Avatar = ({ name, mine = false }: { name: string; mine?: boolean }) => (
  <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[14px] font-bold ${mine ? "bg-brand text-white" : "bg-mint text-brand"}`}>{name[0]?.toUpperCase() ?? "?"}</span>
);

async function post(area: string, body: Record<string, string>) {
  const res = await fetch(`/api/community/${area}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
  return (await res.json()) as { ok: boolean; post?: PublicPost; error?: string };
}

/* ---------------- locked preview (no real content, just the shape of it) ---------------- */

function LockedPreview({ area, title, text, count }: { area: { slug: string; name: string }; title: string; text: string; count: string }) {
  return (
    <div className="relative overflow-hidden rounded-[24px] border border-line bg-white">
      <div aria-hidden className="pointer-events-none space-y-4 p-6 blur-[5px]">
        {[70, 45, 85, 55, 65].map((w, i) => (
          <div key={i} className={`flex items-start gap-3 ${i % 3 === 1 ? "flex-row-reverse" : ""}`}>
            <span className="h-9 w-9 shrink-0 rounded-full bg-mint" />
            <div className={`rounded-[16px] p-3 ${i % 3 === 1 ? "bg-brand/80" : "bg-surface"}`} style={{ width: `${w}%` }}>
              <div className="h-3 w-4/5 rounded-full bg-ink/15" />
              <div className="mt-2 h-3 w-3/5 rounded-full bg-ink/10" />
            </div>
          </div>
        ))}
      </div>
      <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/55 p-6 text-center backdrop-blur-[1px]">
        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-deep text-white shadow-xl">
          <Icon name="lock" size={22} />
        </span>
        <p className="mt-4 text-[20px] font-bold text-ink">{title}</p>
        <p className="mt-1 max-w-[420px] text-[14.5px] text-ink-2">{text}</p>
        <p className="mt-2 text-[13px] font-semibold text-brand">{count}</p>
        <div className="mt-5">
          <JoinButton area={area.slug} />
        </div>
      </div>
    </div>
  );
}

/* ---------------- Q&A ---------------- */

function Ask({ area, initial }: { area: { slug: string; name: string }; initial: Question[] }) {
  const [qs, setQs] = useState(initial);
  const [text, setText] = useState("");
  const [reply, setReply] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const IDEAS = [`Is ${area.name} safe at night?`, "How are the landlords in this area?", "Which buildings are quiet and clean?", "How long is the walk to the metro?"];

  const ask = async () => {
    if (text.trim().length < 5) return;
    setBusy(true);
    const j = await post(area.slug, { kind: "question", text });
    setBusy(false);
    if (!j.ok || !j.post) return setErr(j.error === "slow_down" ? "You’re posting fast. Try again in a minute." : "Couldn’t post. Try again.");
    setQs((x) => [{ ...j.post!, answers: [] }, ...x]);
    setText("");
    setErr(null);
    track("community_post", { kind: "question", area: area.slug });
  };

  const answer = async (q: Question) => {
    const t = reply[q.id]?.trim();
    if (!t) return;
    const j = await post(area.slug, { kind: "answer", text: t, parentId: q.id });
    if (!j.ok || !j.post) return;
    setQs((x) => x.map((y) => (y.id === q.id ? { ...y, answers: [...y.answers, j.post!] } : y)));
    setReply((r) => ({ ...r, [q.id]: "" }));
    track("community_post", { kind: "answer", area: area.slug });
  };

  return (
    <div className="space-y-4">
      <div className="rounded-[24px] border border-line bg-white p-5">
        <p className="text-[16px] font-bold">Ask the {area.name} community</p>
        <textarea value={text} onChange={(e) => setText(e.target.value)} rows={3} maxLength={1200} placeholder="Ask about a building, the area, landlords, the commute…" className="mt-3 w-full resize-none rounded-[14px] border border-line px-4 py-3 text-[15px] focus:border-brand focus:outline-none" />
        <div className="mt-2 flex flex-wrap gap-1.5">
          {IDEAS.map((i) => (
            <button key={i} onClick={() => setText(i)} className="rounded-full bg-surface px-3 py-1 text-[12.5px] text-ink-2 hover:bg-mint hover:text-brand">
              {i}
            </button>
          ))}
        </div>
        <div className="mt-3 flex items-center justify-between gap-3">
          <p className="text-[12px] text-muted">Only members see this. Numbers and emails are removed.</p>
          <button onClick={ask} disabled={busy || text.trim().length < 5} className="h-10 rounded-[12px] bg-brand px-5 text-[14px] font-semibold text-white disabled:opacity-40">
            {busy ? "Posting…" : "Ask"}
          </button>
        </div>
        {err && <p className="mt-2 text-[13px] font-semibold text-red-600">{err}</p>}
      </div>

      {!qs.length && <p className="rounded-[20px] bg-surface p-6 text-center text-[14.5px] text-ink-2">No questions yet. Be the first to ask: people who live here can answer.</p>}
      {qs.map((q) => (
        <article key={q.id} className="rounded-[24px] border border-line bg-white p-5">
          <div className="flex items-start gap-3">
            <Avatar name={q.name} mine={q.mine} />
            <div className="min-w-0 flex-1">
              <p className="text-[13px] text-muted">
                <b className="text-ink">{q.name}</b> asked · {ago(q.createdAt)}
              </p>
              <p className="mt-1 whitespace-pre-wrap text-[16px] font-semibold leading-snug">{q.text}</p>
            </div>
          </div>
          {!!q.answers.length && (
            <div className="mt-4 space-y-3 border-l-2 border-mint pl-4 md:ml-12">
              {q.answers.map((a) => (
                <div key={a.id} className="flex items-start gap-2.5">
                  <Avatar name={a.name} mine={a.mine} />
                  <div className="min-w-0">
                    <p className="text-[12.5px] text-muted">
                      <b className="text-ink">{a.name}</b> · {ago(a.createdAt)}
                    </p>
                    <p className="whitespace-pre-wrap text-[14.5px] text-ink-2">{a.text}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
          <div className="mt-4 flex gap-2 md:ml-12">
            <input
              value={reply[q.id] ?? ""}
              onChange={(e) => setReply((r) => ({ ...r, [q.id]: e.target.value }))}
              onKeyDown={(e) => e.key === "Enter" && answer(q)}
              placeholder="Write an answer…"
              maxLength={1200}
              className="h-10 min-w-0 flex-1 rounded-full border border-line px-4 text-[14px] focus:border-brand focus:outline-none"
            />
            <button onClick={() => answer(q)} className="h-10 rounded-full bg-mint px-4 text-[13.5px] font-semibold text-brand">
              Answer
            </button>
          </div>
        </article>
      ))}
    </div>
  );
}

/* ---------------- group chat ---------------- */

function Chat({ area, initial, me }: { area: { slug: string; name: string }; initial: PublicPost[]; me: string }) {
  const [msgs, setMsgs] = useState(initial);
  const [text, setText] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const box = useRef<HTMLDivElement>(null);
  const last = useRef(initial.at(-1)?.createdAt ?? new Date(0).toISOString());

  const poll = useCallback(async () => {
    if (document.hidden) return;
    const j = await fetch(`/api/community/${area.slug}?since=${encodeURIComponent(last.current)}`)
      .then((r) => r.json())
      .catch(() => null);
    if (j?.chat?.length) {
      setMsgs((m) => {
        const ids = new Set(m.map((x) => x.id));
        return [...m, ...(j.chat as PublicPost[]).filter((x) => !ids.has(x.id))];
      });
      last.current = j.chat.at(-1).createdAt;
    }
  }, [area.slug]);

  useEffect(() => {
    const t = setInterval(poll, 5000);
    return () => clearInterval(t);
  }, [poll]);

  useEffect(() => {
    box.current?.scrollTo({ top: box.current.scrollHeight, behavior: "smooth" });
  }, [msgs.length]);

  const send = async () => {
    const t = text.trim();
    if (!t) return;
    setText("");
    const j = await post(area.slug, { kind: "chat", text: t });
    if (!j.ok || !j.post) {
      setText(t);
      return setErr(j.error === "slow_down" ? "Slow down a little and try again." : "Couldn’t send. Try again.");
    }
    setErr(null);
    setMsgs((m) => [...m, j.post!]);
    last.current = j.post.createdAt;
    track("community_post", { kind: "chat", area: area.slug });
  };

  return (
    <div className="flex h-[620px] flex-col overflow-hidden rounded-[24px] border border-line bg-white">
      <div className="flex items-center gap-3 border-b border-line bg-brand-deep px-5 py-3.5 text-white">
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-lime text-brand-deep">
          <Icon name="chat" size={18} />
        </span>
        <div>
          <p className="text-[15.5px] font-bold">{area.name} group chat</p>
          <p className="text-[12px] text-white/70">Members only · be kind · no numbers in chat</p>
        </div>
      </div>
      <div ref={box} className="flex-1 space-y-3 overflow-y-auto bg-surface/60 px-4 py-4">
        {!msgs.length && <p className="pt-16 text-center text-[14px] text-muted">Say hi to the neighbourhood 👋</p>}
        {msgs.map((m) => (
          <div key={m.id} className={`flex items-end gap-2 ${m.mine ? "flex-row-reverse" : ""}`}>
            {!m.mine && <Avatar name={m.name} />}
            <div className={`max-w-[78%] rounded-[18px] px-3.5 py-2 ${m.mine ? "rounded-br-[6px] bg-brand text-white" : "rounded-bl-[6px] bg-white text-ink shadow-sm"}`}>
              {!m.mine && <p className="text-[12px] font-bold text-brand">{m.name}</p>}
              <p className="whitespace-pre-wrap text-[14.5px] leading-relaxed" dir="auto">
                {m.text}
              </p>
              <p className={`mt-0.5 text-right text-[10.5px] ${m.mine ? "text-white/60" : "text-muted"}`}>{ago(m.createdAt)}</p>
            </div>
          </div>
        ))}
      </div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void send();
        }}
        className="flex items-center gap-2 border-t border-line p-3"
      >
        <input value={text} onChange={(e) => setText(e.target.value)} placeholder={`Message as ${me}…`} maxLength={1000} dir="auto" className="h-11 min-w-0 flex-1 rounded-full border border-line px-4 text-[14.5px] focus:border-brand focus:outline-none" />
        <button type="submit" disabled={!text.trim()} aria-label="Send" className="flex h-11 w-11 items-center justify-center rounded-[12px] bg-brand text-white disabled:opacity-40">
          <Icon name="arrow-right" size={18} />
        </button>
      </form>
      {err && <p className="px-4 pb-3 text-[13px] font-semibold text-red-600">{err}</p>}
    </div>
  );
}

/* ---------------- page body ---------------- */

export function CommunityRoom(props: {
  area: { slug: string; name: string; metro: string | null };
  access: { signedIn: boolean; member: boolean; admin: boolean };
  me: { name: string } | null;
  open: PublicRoommate[];
  locked: LockedRoommate[];
  feed: Feed;
  members: { id: string; name: string; since: string }[];
  counts: { members: number; questions: number; messages: number };
  perks: { icon: string; t: string; d: string }[];
  places: Listing[];
  flags: { welcome: boolean; join: boolean; canceled: boolean; payments: boolean; billing: boolean };
}) {
  const { area, access, feed, flags } = props;
  const [tab, setTab] = useState<Tab>(access.member ? "chat" : "people");
  const [welcome, setWelcome] = useState(flags.welcome);
  const { join, busy } = useJoin(area.slug);
  const started = useRef(false);

  // Back from sign-in with ?join=1: go straight on to payment.
  useEffect(() => {
    if (flags.join && access.signedIn && !access.member && !started.current) {
      started.current = true;
      void join();
    }
  }, [flags.join, access.signedIn, access.member, join]);

  const manage = async () => {
    const j = await fetch("/api/pass/portal", { method: "POST" }).then((r) => r.json()).catch(() => null);
    if (j?.url) window.location.href = j.url;
  };

  const TABS: [Tab, string, number | null][] = [
    ["people", "People", props.open.length + props.locked.length],
    ["chat", "Group chat", access.member ? null : props.counts.messages],
    ["ask", "Ask & discuss", props.counts.questions],
    ["members", "Members", props.counts.members],
    ["places", "Places", props.places.length],
  ];

  return (
    <div className="mx-auto max-w-[1240px] px-4 py-10 md:px-8">
      {welcome && (
        <div className="mb-6 flex items-start justify-between gap-4 rounded-[24px] bg-lime p-5 text-brand-deep md:p-6">
          <div>
            <p className="text-[20px] font-bold">🎉 Welcome to the {area.name} community!</p>
            <p className="mt-1 text-[14.5px]">Say hi in the group chat, ask about any building, and see every roommate profile on Stayshay.</p>
          </div>
          <button onClick={() => setWelcome(false)} aria-label="Close" className="shrink-0">
            <Icon name="close" size={18} />
          </button>
        </div>
      )}
      {flags.canceled && !access.member && <p className="mb-6 rounded-[16px] bg-surface p-4 text-[14px] text-ink-2">Payment cancelled, nothing was charged. You can join any time.</p>}

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="min-w-0">
          <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 md:mx-0 md:px-0">
            {TABS.map(([k, label, n]) => (
              <button
                key={k}
                onClick={() => setTab(k)}
                className={`flex h-11 shrink-0 items-center gap-2 rounded-full px-4 text-[14.5px] font-semibold transition-colors ${tab === k ? "bg-ink text-white" : "border border-line bg-white text-ink-2 hover:border-ink"}`}
              >
                {label}
                {n != null && n > 0 && <span className={`rounded-full px-2 py-0.5 text-[11.5px] ${tab === k ? "bg-white/20" : "bg-surface"}`}>{n}</span>}
                {!access.member && k !== "people" && k !== "places" && <Icon name="lock" size={12} />}
              </button>
            ))}
          </div>

          <div className="mt-6">
            {tab === "people" &&
              (props.open.length + props.locked.length ? (
                <>
                  {!!props.locked.length && (
                    <p className="mb-4 text-[14px] text-ink-2">
                      Showing {props.open.length} of {props.open.length + props.locked.length}. Members see everyone.
                    </p>
                  )}
                  <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
                    {props.open.map((p) => (
                      <RoommateCard
                        key={p.id}
                        p={p}
                        action={
                          <a
                            href={stayshayWhatsapp(`Hi Stayshay, ${access.member ? `I'm a ${area.name} Pass member. ` : ""}Please introduce me to ${p.firstName} (roommate profile ${p.id}). About me: `)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex h-11 w-full items-center justify-center gap-2 rounded-[12px] bg-whatsapp text-[14px] font-semibold text-white hover:brightness-95"
                          >
                            <Icon name="whatsapp" size={16} /> Get introduced to {p.firstName}
                          </a>
                        }
                      />
                    ))}
                    {props.locked.map((p) => (
                      <LockedCard key={p.id} p={p} area={area.slug} />
                    ))}
                  </div>
                </>
              ) : (
                <div className="rounded-[24px] border border-dashed border-line-strong p-8 text-center">
                  <p className="text-[17px] font-bold">Nobody has a roommate profile in {area.name} yet</p>
                  <p className="mt-1 text-[14.5px] text-ink-2">Add yours and you’ll be the first person others moving here see.</p>
                  <a href="/roommates#profile" className="mt-4 inline-flex h-11 items-center rounded-[12px] bg-brand px-5 text-[14px] font-semibold text-white">
                    Create my profile
                  </a>
                </div>
              ))}

            {tab === "chat" &&
              (access.member && feed ? (
                <Chat area={area} initial={feed.chat} me={props.me?.name.split(" ")[0] ?? "member"} />
              ) : (
                <LockedPreview area={area} title={`The ${area.name} group chat`} text="Talk to people who live here and others moving in. Ask anything, anyone can reply." count={props.counts.messages ? `${props.counts.messages} messages so far` : "Be one of the first members"} />
              ))}

            {tab === "ask" &&
              (access.member && feed ? (
                <Ask area={area} initial={feed.questions} />
              ) : (
                <LockedPreview area={area} title="Ask before you pay a deposit" text="Noise, cleanliness, the building, the landlord, the walk to the metro: ask the people who live here." count={props.counts.questions ? `${props.counts.questions} questions asked` : "Ask the first question"} />
              ))}

            {tab === "members" &&
              (access.member ? (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {props.members.map((m) => (
                    <div key={m.id} className="flex items-center gap-3 rounded-[18px] border border-line bg-white p-4">
                      <Avatar name={m.name} />
                      <div>
                        <p className="text-[15px] font-bold">{m.name}</p>
                        <p className="text-[12.5px] text-muted">Member since {new Date(m.since).toLocaleDateString("en-GB", { month: "short", year: "numeric" })}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <LockedPreview area={area} title="Meet the members" text="See who’s in the community and get introduced to the people you’d like to live with." count={props.counts.members ? `${props.counts.members} members` : "Be the first member"} />
              ))}

            {tab === "places" &&
              (props.places.length ? (
                <div className="grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 xl:grid-cols-3">
                  {props.places.map((l) => (
                    <ListingCard key={l.id} listing={l} />
                  ))}
                </div>
              ) : (
                <p className="rounded-[20px] bg-surface p-6 text-center text-[14.5px] text-ink-2">No places listed in {area.name} right now. Ask the community or WhatsApp us and we’ll look for you.</p>
              ))}
          </div>
        </div>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          {access.member ? (
            <div className="rounded-[26px] bg-brand-deep p-6 text-white">
              <p className="text-[12.5px] font-bold uppercase tracking-[0.14em] text-lime">{access.admin ? "Admin access" : "Your Stayshay Pass"}</p>
              <p className="font-display mt-2 text-[28px] leading-tight">{area.name}</p>
              <ul className="mt-4 space-y-2.5 text-[14px] text-white/85">
                {props.perks.slice(0, 4).map((p) => (
                  <li key={p.t} className="flex gap-2">
                    <span>{p.icon}</span>
                    {p.t}
                  </li>
                ))}
              </ul>
              <a
                href={stayshayWhatsapp(`Hi Stayshay, I'm a ${area.name} Pass member. Please introduce me to tenants / roommates who match me.\nI'm looking for: …\nBudget: …\nMove-in: …`)}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-6 flex h-12 items-center justify-center gap-2 rounded-[14px] bg-[#25d366] text-[15px] font-semibold text-white hover:brightness-95"
              >
                <Icon name="whatsapp" size={18} /> Request an introduction
              </a>
              {flags.billing && (
                <button onClick={manage} className="mt-3 w-full text-center text-[13px] font-semibold text-white/70 underline underline-offset-4 hover:text-white">
                  Manage membership
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-hidden rounded-[26px] border border-line bg-white shadow-[0_24px_60px_rgb(20_92_70/0.12)]">
              <div className="bg-brand-deep p-6 text-white">
                <p className="text-[12.5px] font-bold uppercase tracking-[0.14em] text-lime">Stayshay Pass</p>
                <p className="mt-2 flex items-baseline gap-1.5">
                  <span className="font-display text-[48px] leading-none">AED {PASS_PRICE}</span>
                  <span className="text-[14px] text-white/70">/ month</span>
                </p>
                <p className="mt-2 text-[14px] text-white/80">Unlock the {area.name} community. Cancel any time.</p>
              </div>
              <ul className="space-y-3.5 p-6">
                {props.perks.map((p) => (
                  <li key={p.t} className="flex gap-3">
                    <span className="text-[18px] leading-none">{p.icon}</span>
                    <span>
                      <span className="block text-[14.5px] font-bold">{p.t}</span>
                      <span className="text-[13px] text-ink-2">{p.d}</span>
                    </span>
                  </li>
                ))}
              </ul>
              <div className="border-t border-line p-6 pt-5">
                <button onClick={join} disabled={busy} className="flex h-13 w-full items-center justify-center gap-2 rounded-[14px] bg-lime py-3.5 text-[16px] font-bold text-brand-deep hover:brightness-95 disabled:opacity-60">
                  <Icon name="lock" size={16} /> {busy ? "Opening secure payment…" : `Join ${area.name} · AED ${PASS_PRICE}`}
                </button>
                <p className="mt-3 text-center text-[12px] text-muted">{access.signedIn ? "Secure card payment by Stripe" : "Sign in first (10 seconds with Google), then pay securely by Stripe"}</p>
                {!flags.payments && <p className="mt-2 text-center text-[12px] font-semibold text-red-600">Payments are being switched on. Try again shortly.</p>}
              </div>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
