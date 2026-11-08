"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { PublicRoommate } from "@/lib/roommates";
import { Icon, aed } from "./ui";
import { PASS_PRICE } from "./community-lock";
import { Sheet, Upgrade } from "./roomie/parts";
import { GiftCredits } from "./gift-credits";

interface Thread {
  profile: PublicRoommate;
  last: { text: string; mine: boolean; createdAt: string };
  unread: number;
}
interface Notice {
  title: string;
  line: string;
}
interface Msg {
  id: string;
  mine: boolean;
  text: string;
  createdAt: string;
}

const time = (iso: string) => {
  const d = new Date(iso);
  return Date.now() - d.getTime() < 86400_000 ? d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }) : d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
};

function Avatar({ p, size = 44 }: { p: PublicRoommate; size?: number }) {
  return p.photo ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={p.photo} alt="" style={{ width: size, height: size }} className="shrink-0 rounded-full object-cover" />
  ) : (
    <span style={{ width: size, height: size }} className="flex shrink-0 items-center justify-center rounded-full bg-mint font-bold text-brand">
      {p.firstName[0]}
    </span>
  );
}

function Conversation({ id }: { id: string }) {
  const [data, setData] = useState<{ pass: boolean; quota: { left: number; free: number }; canGift: boolean; profile: PublicRoommate; messages: Msg[] } | null>(null);
  const [missing, setMissing] = useState(false);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [warning, setWarning] = useState<Notice | null>(null);
  const [upgrade, setUpgrade] = useState<Notice | null>(null);
  const [gifting, setGifting] = useState(false);
  const end = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    const r = await fetch(`/api/messages?with=${encodeURIComponent(id)}`, { cache: "no-store" }).catch(() => null);
    if (!r) return;
    if (r.status === 401) return void (window.location.href = `/login?next=${encodeURIComponent(`/messages?with=${id}`)}`);
    if (!r.ok) return setMissing(true);
    setData(await r.json());
  }, [id]);

  useEffect(() => {
    load();
    const t = setInterval(load, 10_000);
    return () => clearInterval(t);
  }, [load]);
  useEffect(() => end.current?.scrollIntoView({ block: "end" }), [data?.messages.length]);

  const send = async () => {
    if (!text.trim()) return;
    setBusy(true);
    setError(null);
    setWarning(null);
    const r = await fetch("/api/messages", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ to: id, text }) }).catch(() => null);
    const j = await r?.json().catch(() => null);
    setBusy(false);
    if (j?.ok) {
      setText("");
      setData((d) => (d ? { ...d, quota: j.quota ?? d.quota, messages: [...d.messages, j.message] } : d));
    } else if (j?.error === "contact_upgrade" || j?.error === "limit") {
      setUpgrade(j.notice);
      if (j.quota) setData((d) => (d ? { ...d, quota: j.quota } : d));
    } else if (j?.notice) setWarning(j.notice);
    else setError(j?.error === "slow_down" ? "You’re sending a lot. Please wait a few minutes." : "Couldn’t send. Please try again.");
  };

  if (missing) return <p className="p-6 text-center text-muted">This conversation isn’t available.</p>;
  if (!data) return <div className="m-4 h-[420px] animate-pulse rounded-[20px] bg-surface" />;
  const p = data.profile;
  const canSend = data.pass || data.quota.left > 0;
  const limitCopy = { title: `Keep talking to ${p.firstName}`, line: `You’ve used your ${data.quota.free} free messages. The Stayshay Pass gives you unlimited messages, so you can agree the budget, the area and a viewing.` };

  return (
    <div className="flex h-[calc(100dvh-180px)] min-h-[460px] flex-col rounded-[24px] border border-line bg-white">
      <div className="flex items-center gap-3 border-b border-line p-3">
        <Link href="/messages" aria-label="Back" className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-surface">
          <Icon name="chevron-left" size={18} />
        </Link>
        <Avatar p={p} size={40} />
        <div className="min-w-0">
          <p className="truncate text-[15px] font-bold">
            {p.firstName}
            {p.age ? `, ${p.age}` : ""}
          </p>
          <p className="truncate text-[12.5px] text-muted">
            {aed(p.budget)}/mo · {p.mode === "has_place" ? "Has a place" : "Looking to share"}
          </p>
        </div>
        {data.canGift && (
          <button onClick={() => setGifting(true)} className="ml-auto flex h-10 shrink-0 items-center gap-1.5 rounded-full bg-mint px-3.5 text-[13.5px] font-semibold text-brand-deep">
            <Icon name="wallet" size={15} /> Gift
          </button>
        )}
      </div>
      <div className="flex-1 space-y-2 overflow-y-auto p-4">
        {!data.messages.length && <p className="pt-8 text-center text-[14px] text-muted">Say hello to {p.firstName}.</p>}
        {data.messages.map((m) => (
          <div key={m.id} className={`flex ${m.mine ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[80%] whitespace-pre-wrap rounded-[18px] px-3.5 py-2 text-[14.5px] ${m.mine ? "bg-brand text-white" : "bg-surface text-ink"}`}>
              {m.text}
              <span className={`mt-0.5 block text-right text-[11px] ${m.mine ? "text-white/60" : "text-muted"}`}>{time(m.createdAt)}</span>
            </div>
          </div>
        ))}
        <div ref={end} />
      </div>
      <div className="border-t border-line p-3">
        {warning && (
          <div role="alert" className="mb-3 rounded-[14px] bg-amber-50 p-3.5 text-[13.5px] text-amber-900">
            <b className="block">{warning.title}</b>
            {warning.line}
          </div>
        )}
        {canSend ? (
          <>
            <div className="flex gap-2">
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    send();
                  }
                }}
                maxLength={1000}
                rows={1}
                placeholder="Write a message"
                className="min-h-11 flex-1 resize-none rounded-[14px] border border-line px-3 py-2.5 text-[15px] outline-none focus:border-brand"
              />
              <button onClick={send} disabled={busy || !text.trim()} className="h-11 rounded-[14px] bg-brand px-5 text-[14.5px] font-semibold text-white disabled:opacity-50">
                Send
              </button>
            </div>
            {error && <p className="mt-2 text-[13px] font-semibold text-red-600">{error}</p>}
            {!data.pass && data.quota.left <= 3 && (
              <button onClick={() => setUpgrade(limitCopy)} className="mt-2 text-[12.5px] font-semibold text-brand">
                {data.quota.left} free {data.quota.left === 1 ? "message" : "messages"} left · Go unlimited
              </button>
            )}
          </>
        ) : (
          <button onClick={() => setUpgrade(limitCopy)} className="flex h-12 w-full items-center justify-center gap-2 rounded-[14px] bg-lime text-[15px] font-bold text-brand-deep">
            <Icon name="lock" size={16} /> Keep talking · AED {PASS_PRICE}/mo
          </button>
        )}
      </div>
      {upgrade && (
        <Sheet onClose={() => setUpgrade(null)}>
          <Upgrade area={p.areaSlugs[0] ?? null} returnTo="/messages" title={upgrade.title} line={upgrade.line} />
        </Sheet>
      )}
      {gifting && <GiftCredits to={p.id} name={p.firstName} onClose={() => setGifting(false)} onSent={() => { setGifting(false); load(); }} />}
    </div>
  );
}

function Inbox() {
  const [data, setData] = useState<{ threads: Thread[]; pass: boolean; hasProfile: boolean } | null>(null);
  useEffect(() => {
    fetch("/api/messages", { cache: "no-store" })
      .then((r) => {
        if (r.status === 401) window.location.href = "/login?next=/messages";
        return r.json();
      })
      .then((j) => j.ok && setData(j))
      .catch(() => {});
  }, []);
  if (!data) return <div className="h-[300px] animate-pulse rounded-[20px] bg-surface" />;
  if (!data.threads.length)
    return (
      <div className="card p-8 text-center">
        <p className="text-[20px] font-bold">No messages yet</p>
        <p className="mt-1.5 text-[14.5px] text-muted">Find someone you’d like to live with and say hello.</p>
        <Link href="/swipe" className="mt-5 inline-flex h-11 items-center rounded-[12px] bg-brand px-6 text-[14.5px] font-semibold text-white">
          {data.hasProfile ? "Back to Roommate Swipe" : "Make your profile and start swiping"}
        </Link>
      </div>
    );
  return (
    <ul className="divide-y divide-line rounded-[24px] border border-line bg-white">
      {data.threads.map((t) => (
        <li key={t.profile.id}>
          <Link href={`/messages?with=${t.profile.id}`} className="flex items-center gap-3 p-4 hover:bg-surface">
            <Avatar p={t.profile} />
            <div className="min-w-0 flex-1">
              <p className="flex justify-between gap-2 text-[15px]">
                <b className="truncate">{t.profile.firstName}</b>
                <span className="shrink-0 text-[12px] text-muted">{time(t.last.createdAt)}</span>
              </p>
              <p className={`truncate text-[13.5px] ${t.unread ? "font-semibold text-ink" : "text-muted"}`}>
                {t.last.mine ? "You: " : ""}
                {t.last.text}
              </p>
            </div>
            {t.unread > 0 && <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-brand px-1.5 text-[12px] font-bold text-white">{t.unread}</span>}
          </Link>
        </li>
      ))}
    </ul>
  );
}

export function MessagesPage() {
  const sp = useSearchParams();
  const router = useRouter();
  const id = sp.get("with");
  const welcome = sp.get("welcome") === "1";
  useEffect(() => {
    if (id && !/^[a-z0-9-]{4,40}$/i.test(id)) router.replace("/messages");
  }, [id, router]);
  return (
    <div className="mx-auto max-w-[640px] px-4 pb-16 pt-6">
      {!id && <h1 className="mb-4 text-[28px] font-bold tracking-[-0.02em]">Messages</h1>}
      {welcome && <p className="mb-4 rounded-[16px] bg-mint p-4 text-[14px] font-semibold text-brand-deep">Welcome to the Stayshay Pass. Your messages are unlimited now.</p>}
      {id ? <Conversation id={id} /> : <Inbox />}
    </div>
  );
}
