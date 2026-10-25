"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AREA_BY_SLUG, TYPE_LABEL, roommateMatch, type Listing, type ListingStatus, type RoommateLead } from "@stayshay/core";
import type { Announcement, LeadRecord, LeadStatus, Tenancy } from "@/lib/store";
import type { RoommateProfile } from "@/lib/roommates";
import type { PublicUser } from "@/lib/auth";
import { broadcastText, fmtDate, renewalReminder, replyToLead, roommateIntro, tel, wa } from "@/lib/messages";
import { EMPTY, ListingForm, type Draft } from "./admin";
import { MarketplaceProvider } from "./marketplace";
import { Icon, Logo, aed } from "./ui";

type Tab = "inbox" | "listings" | "tenancies" | "roommates" | "people" | "announcements";
type AdminUser = PublicUser & { createdAt: string; lastLoginAt: string };

const field = "w-full rounded-[12px] border border-line bg-white px-3.5 py-2.5 text-[14px] focus:border-brand focus:outline-none";
const areaName = (s: string) => AREA_BY_SLUG.get(s)?.name ?? s;
const KIND: Record<LeadRecord["kind"], { label: string; tone: string }> = {
  inquiry: { label: "Viewing request", tone: "bg-mint text-brand" },
  tenant: { label: "Room request", tone: "bg-[#e7effc] text-[#24508f]" },
  owner: { label: "Owner listing", tone: "bg-[#fbefdc] text-[#8a5a14]" },
  roommate: { label: "Roommate", tone: "bg-[#f1e8f7] text-[#6b3d8a]" },
  chat: { label: "AI chat", tone: "bg-[#e6f4f1] text-[#0f6b5c]" },
};
const STATUS_TONE: Record<string, string> = {
  new: "bg-fresh text-white",
  contacted: "bg-mint text-brand",
  matched: "bg-[#f1e8f7] text-[#6b3d8a]",
  closed: "bg-surface text-muted",
  live: "bg-mint text-brand",
  reserved: "bg-[#fbefdc] text-[#8a5a14]",
  rented: "bg-ink text-white",
  draft: "bg-surface text-muted",
  expired: "bg-surface text-muted",
  pending_review: "bg-[#fbefdc] text-[#8a5a14]",
};

function ago(iso: string) {
  const m = Math.round((Date.now() - Date.parse(iso)) / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m} min ago`;
  if (m < 1440) return `${Math.round(m / 60)} h ago`;
  return `${Math.round(m / 1440)} d ago`;
}
const daysUntil = (iso: string) => Math.ceil((Date.parse(`${iso}T00:00:00`) - Date.now()) / 86400000);

async function api(path: string, method: string, body?: unknown) {
  const res = await fetch(path, { method, headers: { "content-type": "application/json" }, body: body ? JSON.stringify(body) : undefined });
  const j = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(j.error ?? `Request failed (${res.status})`);
  return j;
}

function Pill({ children, tone }: { children: React.ReactNode; tone: string }) {
  return <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11.5px] font-bold capitalize ${tone}`}>{children}</span>;
}

function WaButton({ href, onClick, label = "WhatsApp" }: { href: string; onClick?: () => void; label?: string }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" onClick={onClick} className="inline-flex h-9 items-center gap-1.5 rounded-full bg-whatsapp px-3.5 text-[13px] font-semibold text-white hover:brightness-95">
      <Icon name="whatsapp" size={15} /> {label}
    </a>
  );
}

function leadSummary(l: LeadRecord): string {
  const d = l.data as Record<string, unknown>;
  if (l.kind === "chat") return `Talked to Shay${d.language ? ` (${d.language})` : ""}${d.looking_for ? ` · ${d.looking_for}` : ""}`;
  if (l.kind === "inquiry") return `${l.listingTitle ?? l.listingId ?? "A listing"} · move-in ${d.moveIn ?? "?"}${d.message ? ` · “${d.message}”` : ""}`;
  if (l.kind === "owner") return `${TYPE_LABEL[d.type as Listing["type"]] ?? "Place"} in ${areaName(String(d.areaSlug ?? ""))} · ${aed(Number(d.rent) || 0)}/mo${d.billsIncluded ? ", bills incl." : ""} · ${d.spaces ?? 1} space(s) · for ${d.household}`;
  if (l.kind === "roommate") {
    const r = d as unknown as RoommateLead;
    return `${r.mode === "has_place" ? "Has a place" : "Looking to share"} · ${r.gender}${r.age ? `, ${r.age}` : ""}${r.profession ? ` · ${r.profession}` : ""} · ${aed(r.budget)} · ${r.areaSlugs.map(areaName).join(", ") || "any area"} · from ${r.moveIn}`;
  }
  const types = Array.isArray(d.types) && d.types.length ? (d.types as Listing["type"][]).map((t) => TYPE_LABEL[t]).join(", ") : "Any type";
  const areas = Array.isArray(d.areaSlugs) && d.areaSlugs.length ? (d.areaSlugs as string[]).map(areaName).join(", ") : "any area";
  return `${types} · ${areas} · up to ${aed(Number(d.budget) || 0)} · move-in ${d.moveIn} · ${d.household}`;
}

/* ================================================================ */

export function AdminConsole(props: {
  adminListings: Listing[];
  allListings: Listing[];
  leads: LeadRecord[];
  tenancies: Tenancy[];
  announcements: Announcement[];
  users: AdminUser[];
  roommates: RoommateProfile[];
}) {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("inbox");
  const [leads, setLeads] = useState(props.leads);
  const [all, setAll] = useState(props.allListings);
  const [adminIds, setAdminIds] = useState(new Set(props.adminListings.map((l) => l.id)));
  const [tenancies, setTenancies] = useState(props.tenancies);
  const [announcements, setAnnouncements] = useState(props.announcements);
  const [profiles, setProfiles] = useState(props.roommates);
  const [editing, setEditing] = useState<Draft | null>(null);
  const [assigning, setAssigning] = useState<Listing | null>(null);
  const [focusRoommate, setFocusRoommate] = useState<string | null>(null);
  const [toast, setToast] = useState("");

  const flash = (m: string) => {
    setToast(m);
    setTimeout(() => setToast(""), 2600);
  };

  const newLeads = leads.filter((l) => l.status === "new").length;
  const expiring = tenancies.filter((t) => t.status === "active" && daysUntil(t.endDate) <= 30).length;

  const patchLead = async (id: string, patch: { status?: LeadStatus; note?: string }) => {
    setLeads((cur) => cur.map((l) => (l.id === id ? { ...l, ...patch } : l)));
    await api("/api/admin/leads", "PATCH", { id, ...patch }).catch((e) => flash(e.message));
  };

  const setAvailability = async (l: Listing, status: ListingStatus) => {
    await api("/api/admin/availability", "POST", { id: l.id, status });
    setAll((cur) => cur.map((x) => (x.id === l.id ? { ...x, status } : x)));
    flash(`${l.id} is now ${status}`);
  };

  const TABS: [Tab, string, number?][] = [
    ["inbox", "Inbox", newLeads],
    ["listings", "Listings", all.filter((l) => l.status === "pending_review").length],
    ["tenancies", "Tenancies", expiring],
    ["roommates", "Roommates", profiles.filter((p) => p.status === "pending").length],
    ["people", "People", 0],
    ["announcements", "Announcements"],
  ];

  return (
    <MarketplaceProvider listings={all}>
      <div className="min-h-screen bg-surface">
        <header className="sticky top-0 z-30 border-b border-line bg-white">
          <div className="mx-auto flex h-16 max-w-[1280px] items-center justify-between px-4 md:px-8">
            <div className="flex items-center gap-3">
              <Logo />
              <span className="rounded-full bg-mint px-2.5 py-1 text-[12px] font-bold text-brand">Admin</span>
            </div>
            <div className="flex items-center gap-2">
              <a href="/" target="_blank" className="hidden h-9 items-center rounded-full px-3 text-[13.5px] text-muted hover:text-ink sm:flex">
                View site
              </a>
              <button
                onClick={async () => {
                  await fetch("/api/admin/login", { method: "DELETE" });
                  router.refresh();
                }}
                className="h-9 rounded-full border border-line px-3.5 text-[13.5px]"
              >
                Sign out
              </button>
            </div>
          </div>
          <nav className="mx-auto flex max-w-[1280px] gap-1 overflow-x-auto px-4 md:px-8" aria-label="Admin sections">
            {TABS.map(([t, label, n]) => (
              <button
                key={t}
                onClick={() => {
                  setTab(t);
                  setEditing(null);
                }}
                className={`-mb-px flex h-11 shrink-0 items-center gap-2 border-b-2 px-3 text-[14px] ${tab === t ? "border-brand font-semibold text-brand" : "border-transparent text-muted hover:text-ink"}`}
              >
                {label}
                {n ? <span className="rounded-full bg-fresh px-1.5 py-0.5 text-[11px] font-bold leading-none text-white">{n}</span> : null}
              </button>
            ))}
          </nav>
        </header>

        <main className="mx-auto max-w-[1280px] px-4 py-7 md:px-8">
          {editing ? (
            <>
              <h1 className="mb-5 text-[22px] font-bold">{editing.id ? `Edit ${editing.id}` : "New listing"}</h1>
              <ListingForm
                initial={editing}
                onCancel={() => setEditing(null)}
                onSaved={(l) => {
                  setAll((cur) => [l, ...cur.filter((x) => x.id !== l.id)]);
                  setAdminIds((s) => new Set(s).add(l.id));
                  setEditing(null);
                  setTab("listings");
                  flash(`Saved ${l.id}`);
                }}
              />
            </>
          ) : tab === "inbox" ? (
            <Inbox
              leads={leads}
              listings={all}
              onPatch={patchLead}
              onCreateListing={(l) => {
                const d = l.data as Record<string, unknown>;
                setEditing({
                  ...EMPTY,
                  type: (d.type as Listing["type"]) ?? "bed_space",
                  areaSlug: String(d.areaSlug ?? ""),
                  priceAed: Number(d.rent) || undefined,
                  deposit: Number(d.deposit) || 0,
                  billsIncluded: !!d.billsIncluded,
                  gender: d.household === "male" || d.household === "female" ? d.household : "any",
                  occupancy: d.household === "couple" ? "couple" : "single",
                  bedsAvailable: Number(d.spaces) || 1,
                  bedsInRoom: Math.max(2, Number(d.spaces) || 1),
                  listerName: l.name,
                  listerPhone: l.phone,
                  title: `${TYPE_LABEL[(d.type as Listing["type"]) ?? "room"]} in ${areaName(String(d.areaSlug ?? ""))}`,
                });
              }}
              onMatch={(id) => {
                setFocusRoommate(id);
                setTab("roommates");
              }}
            />
          ) : tab === "listings" ? (
            <Listings
              listings={all}
              adminIds={adminIds}
              tenancies={tenancies}
              onNew={() => setEditing({ ...EMPTY })}
              onEdit={(l) => setEditing({ ...EMPTY, ...l, amenities: l.amenities ?? [] })}
              onDelete={async (l) => {
                if (!window.confirm(`Delete ${l.id}? This removes it and its photos.`)) return;
                const res = await fetch(`/api/admin/listings?id=${encodeURIComponent(l.id)}`, { method: "DELETE" });
                if (res.ok) setAll((cur) => cur.filter((x) => x.id !== l.id));
              }}
              onStatus={setAvailability}
              onAssign={setAssigning}
            />
          ) : tab === "tenancies" ? (
            <Tenancies
              tenancies={tenancies}
              onChange={(t) => setTenancies((cur) => cur.map((x) => (x.id === t.id ? t : x)))}
              onEnded={(t) => {
                setTenancies((cur) => cur.map((x) => (x.id === t.id ? t : x)));
                setAll((cur) => cur.map((x) => (x.id === t.listingId ? { ...x, status: "live", bedsAvailable: (x.bedsAvailable ?? 0) + t.beds } : x)));
                flash("Tenancy ended, the place is available again");
              }}
            />
          ) : tab === "roommates" ? (
            <>
              <PublicBoard profiles={profiles} setProfiles={setProfiles} flash={flash} />
              <Roommates leads={leads} focus={focusRoommate} onFocus={setFocusRoommate} onPatch={patchLead} />
            </>
          ) : tab === "people" ? (
            <People users={props.users} leads={leads} />
          ) : (
            <Announcements list={announcements} setList={setAnnouncements} leads={leads} tenancies={tenancies} flash={flash} />
          )}
        </main>

        {assigning && (
          <AssignTenant
            listing={assigning}
            onClose={() => setAssigning(null)}
            onDone={(t) => {
              setTenancies((cur) => [t, ...cur]);
              const taken = [t, ...tenancies].filter((x) => x.listingId === t.listingId && x.status === "active").reduce((n, x) => n + x.beds, 0);
              const cap = assigning.type === "bed_space" || assigning.type === "partition" ? Math.max(1, assigning.bedsInRoom ?? 1) : 1;
              setAll((cur) => cur.map((x) => (x.id === t.listingId ? { ...x, bedsAvailable: Math.max(0, cap - taken), status: cap - taken <= 0 ? "rented" : "live" } : x)));
              setAssigning(null);
              flash(`${t.tenantName} assigned until ${fmtDate(t.endDate)}`);
            }}
          />
        )}

        {toast && <div className="fixed bottom-5 left-1/2 z-50 -translate-x-1/2 rounded-full bg-ink px-5 py-3 text-[14px] font-medium text-white shadow-lg">{toast}</div>}
      </div>
    </MarketplaceProvider>
  );
}

/* ================================ Inbox ================================ */

function Inbox({ leads, listings, onPatch, onCreateListing, onMatch }: { leads: LeadRecord[]; listings: Listing[]; onPatch: (id: string, p: { status?: LeadStatus; note?: string }) => void; onCreateListing: (l: LeadRecord) => void; onMatch: (id: string) => void }) {
  const [kind, setKind] = useState<"all" | LeadRecord["kind"]>("all");
  const [view, setView] = useState<"open" | "all" | "closed">("open");
  const [q, setQ] = useState("");
  const [notes, setNotes] = useState<Record<string, string>>({});

  const shown = leads.filter(
    (l) =>
      (kind === "all" || l.kind === kind) &&
      (view === "all" || (view === "open" ? l.status !== "closed" : l.status === "closed")) &&
      (!q || `${l.name} ${l.phone} ${leadSummary(l)}`.toLowerCase().includes(q.toLowerCase())),
  );
  const today = leads.filter((l) => Date.now() - Date.parse(l.createdAt) < 86400000).length;

  return (
    <div>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        {[
          ["New", leads.filter((l) => l.status === "new").length],
          ["Last 24 h", today],
          ["Viewing requests", leads.filter((l) => l.kind === "inquiry").length],
          ["Owners", leads.filter((l) => l.kind === "owner").length],
          ["AI chats", leads.filter((l) => l.kind === "chat").length],
        ].map(([label, n]) => (
          <div key={label as string} className="rounded-[18px] bg-white p-4">
            <p className="text-[26px] font-extrabold leading-none tracking-[-0.03em] text-brand">{n}</p>
            <p className="mt-1.5 text-[12.5px] text-muted">{label}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-2">
        {(["all", "inquiry", "tenant", "owner", "roommate", "chat"] as const).map((k) => (
          <button key={k} onClick={() => setKind(k)} className={`h-9 rounded-full border px-3.5 text-[13px] font-medium ${kind === k ? "border-brand bg-brand text-white" : "border-line bg-white"}`}>
            {k === "all" ? "Everything" : KIND[k].label}
          </button>
        ))}
        <span className="mx-1 h-6 w-px bg-line-strong" />
        {(["open", "all", "closed"] as const).map((v) => (
          <button key={v} onClick={() => setView(v)} className={`h-9 rounded-full px-3 text-[13px] capitalize ${view === v ? "bg-ink font-semibold text-white" : "text-muted"}`}>
            {v}
          </button>
        ))}
        <input className={`${field} ml-auto max-w-[260px]`} placeholder="Search name, phone, area…" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>

      <div className="mt-4 space-y-3">
        {shown.length === 0 && (
          <div className="rounded-[22px] border border-dashed border-line-strong bg-white px-6 py-14 text-center">
            <p className="text-[17px] font-bold">Nothing here yet</p>
            <p className="mt-1 text-[14px] text-muted">Viewing requests, room requests, owner listings and roommate profiles from the website and app land here.</p>
          </div>
        )}
        {shown.map((l) => {
          const listing = l.listingId ? listings.find((x) => x.id === l.listingId) : undefined;
          const reply = replyToLead(l.kind, l.name, l.data, { listingTitle: l.listingTitle ?? listing?.title, listingId: l.listingId, areaName });
          return (
            <div key={l.id} className={`rounded-[20px] border bg-white p-4 md:p-5 ${l.status === "new" ? "border-fresh/50" : "border-line"}`}>
              <div className="flex flex-wrap items-center gap-2">
                <Pill tone={KIND[l.kind].tone}>{KIND[l.kind].label}</Pill>
                <Pill tone={STATUS_TONE[l.status]}>{l.status}</Pill>
                <span className="text-[12.5px] text-muted">
                  {ago(l.createdAt)} · {l.source === "app" ? "App" : "Website"}
                </span>
              </div>
              <div className="mt-3 flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div className="min-w-0">
                  <p className="text-[16px] font-bold">
                    {l.name} {l.phone ? <span className="font-medium text-muted">· +{l.phone}</span> : null}
                    {l.email ? <span className="font-medium text-muted"> · {l.email}</span> : null}
                    {l.userId ? <span className="ml-2 rounded-full bg-mint px-2 py-0.5 text-[11px] font-bold text-brand">Account</span> : null}
                  </p>
                  <p className="mt-1 text-[14px] text-ink-2">{leadSummary(l)}</p>
                  {l.kind === "inquiry" && l.listingId && (
                    <a href={`/listing/${l.listingId.toLowerCase()}`} target="_blank" className="mt-1 inline-block text-[13px] font-semibold text-brand underline">
                      Open listing {l.listingId}
                    </a>
                  )}
                  {l.kind === "roommate" && (l.data as Record<string, unknown>).about ? <p className="mt-1 text-[13.5px] italic text-muted">“{String((l.data as Record<string, unknown>).about)}”</p> : null}
                </div>
                <div className="flex shrink-0 flex-wrap items-center gap-2">
                  {l.phone ? (
                    <>
                      <WaButton href={wa(l.phone, reply)} onClick={() => l.status === "new" && onPatch(l.id, { status: "contacted" })} label="Reply" />
                      <a href={tel(l.phone)} className="inline-flex h-9 items-center rounded-full border border-line px-3.5 text-[13px] font-semibold">
                        Call
                      </a>
                    </>
                  ) : null}
                  {l.email ? (
                    <a href={`mailto:${l.email}?subject=${encodeURIComponent("Stayshay")}&body=${encodeURIComponent(reply)}`} className="inline-flex h-9 items-center rounded-full border border-line px-3.5 text-[13px] font-semibold">
                      Email
                    </a>
                  ) : null}
                  {l.kind === "owner" &&
                    (l.listingId ? (
                      <a href={`/listing/${l.listingId.toLowerCase()}`} target="_blank" className="inline-flex h-9 items-center rounded-full bg-brand px-3.5 text-[13px] font-semibold text-white">
                        {listings.find((x) => x.id === l.listingId)?.status === "pending_review" ? "Review in Listings" : "Open listing"}
                      </a>
                    ) : (
                      <button onClick={() => onCreateListing(l)} className="h-9 rounded-full bg-brand px-3.5 text-[13px] font-semibold text-white">
                        Create listing
                      </button>
                    ))}
                  {l.kind === "roommate" && (
                    <button onClick={() => onMatch(l.id)} className="h-9 rounded-full bg-brand px-3.5 text-[13px] font-semibold text-white">
                      Find matches
                    </button>
                  )}
                  <select value={l.status} onChange={(e) => onPatch(l.id, { status: e.target.value as LeadStatus })} className="h-9 rounded-full border border-line bg-white px-3 text-[13px]">
                    {["new", "contacted", "matched", "closed"].map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="mt-3 flex gap-2">
                <input
                  className={`${field} h-9 py-1.5 text-[13px]`}
                  placeholder="Note (e.g. viewing booked Thu 6pm)"
                  value={notes[l.id] ?? l.note ?? ""}
                  onChange={(e) => setNotes({ ...notes, [l.id]: e.target.value })}
                  onBlur={() => notes[l.id] != null && notes[l.id] !== (l.note ?? "") && onPatch(l.id, { note: notes[l.id] })}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ================================ Listings ================================ */

function Listings({ listings, adminIds, tenancies, onNew, onEdit, onDelete, onStatus, onAssign }: { listings: Listing[]; adminIds: Set<string>; tenancies: Tenancy[]; onNew: () => void; onEdit: (l: Listing) => void; onDelete: (l: Listing) => void; onStatus: (l: Listing, s: ListingStatus) => void; onAssign: (l: Listing) => void }) {
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<"all" | ListingStatus>(listings.some((l) => l.status === "pending_review") ? "pending_review" : "all");
  const [shown, setShown] = useState(40);
  const filtered = listings.filter(
    (l) => (status === "all" || (l.status ?? "live") === status) && (!q || `${l.id} ${l.title} ${areaName(l.areaSlug)} ${TYPE_LABEL[l.type]}`.toLowerCase().includes(q.toLowerCase())),
  );
  const counts = (s: ListingStatus) => listings.filter((l) => (l.status ?? "live") === s).length;

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-[24px] font-bold">Listings</h1>
          <p className="text-[14px] text-muted">
            {counts("live")} live · {counts("reserved")} reserved · {counts("rented")} rented. Rented and reserved places are hidden from renters.
          </p>
        </div>
        <button onClick={onNew} className="flex h-11 items-center gap-2 rounded-full bg-brand px-5 text-[14.5px] font-semibold text-white">
          + New listing
        </button>
      </div>
      <div className="mt-5 flex flex-wrap items-center gap-2">
        {(["pending_review", "all", "live", "reserved", "rented", "draft"] as const).map((s) => (
          <button key={s} onClick={() => setStatus(s)} className={`h-9 rounded-full border px-3.5 text-[13px] font-medium capitalize ${status === s ? "border-brand bg-brand text-white" : "border-line bg-white"}`}>
            {s === "pending_review" ? `Pending review (${counts("pending_review")})` : s}
          </button>
        ))}
        <input className={`${field} ml-auto max-w-[280px]`} placeholder="Search ref, title, area…" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>

      <div className="mt-4 overflow-hidden rounded-[20px] border border-line bg-white">
        {filtered.slice(0, shown).map((l) => {
          const st = l.status ?? "live";
          const active = tenancies.filter((t) => t.listingId === l.id && t.status === "active");
          const shared = l.type === "bed_space" || l.type === "partition";
          return (
            <div key={l.id} className="flex flex-col gap-3 border-b border-line p-3 last:border-b-0 md:flex-row md:items-center">
              <div className="flex min-w-0 flex-1 items-center gap-3">
                <div className="h-14 w-20 shrink-0 overflow-hidden rounded-[10px] bg-surface">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  {l.photos[0] && <img src={l.photos[0]} alt="" className="h-full w-full object-cover" />}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-[14.5px] font-semibold">{l.title}</p>
                  <p className="truncate text-[12.5px] text-muted">
                    {l.id} · {TYPE_LABEL[l.type]} · {areaName(l.areaSlug)} · {aed(l.priceAed)}/mo
                    {shared ? ` · ${l.bedsAvailable ?? 1}/${l.bedsInRoom ?? 1} beds free` : ""}
                    {active.length ? ` · ${active.map((t) => t.tenantName).join(", ")}` : ""}
                    {adminIds.has(l.id) ? " · yours" : ""}
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Pill tone={STATUS_TONE[st] ?? "bg-surface text-muted"}>{st === "pending_review" ? "pending review" : st}</Pill>
                {st === "pending_review" ? (
                  <>
                    <button onClick={() => onStatus(l, "live")} className="h-9 rounded-full bg-brand px-3.5 text-[13px] font-semibold text-white">
                      Approve & publish
                    </button>
                    <button onClick={() => window.confirm(`Reject ${l.id}? It stays hidden; you can still edit and publish it later.`) && onStatus(l, "draft")} className="h-9 rounded-full border border-line px-3.5 text-[13px] font-medium">
                      Reject
                    </button>
                    {l.listerPhone && <WaButton href={wa(l.listerPhone, `Hi ${l.listerName}, this is Stayshay about your listing "${l.title}" (${l.id}).`)} label="Ask lister" />}
                  </>
                ) : (
                  <button onClick={() => onAssign(l)} className="h-9 rounded-full bg-brand px-3.5 text-[13px] font-semibold text-white">
                    Assign tenant
                  </button>
                )}
                <select value={st} onChange={(e) => onStatus(l, e.target.value as ListingStatus)} className="h-9 rounded-full border border-line bg-white px-3 text-[13px]" aria-label="Availability">
                  <option value="live">Available</option>
                  <option value="reserved">Reserved</option>
                  <option value="rented">Rented</option>
                  <option value="draft">Hidden</option>
                  <option value="pending_review">Pending review</option>
                </select>
                {adminIds.has(l.id) && (
                  <>
                    <button onClick={() => onEdit(l)} className="h-9 rounded-full border border-line px-3.5 text-[13px] font-medium">
                      Edit
                    </button>
                    <button onClick={() => onDelete(l)} className="h-9 rounded-full px-2 text-[13px] text-warn">
                      Delete
                    </button>
                  </>
                )}
                <a href={`/listing/${l.id.toLowerCase()}`} target="_blank" className="px-1 text-[13px] text-brand underline">
                  View
                </a>
              </div>
            </div>
          );
        })}
        {filtered.length === 0 && <p className="p-8 text-center text-[14px] text-muted">No listings match.</p>}
      </div>
      {shown < filtered.length && (
        <button onClick={() => setShown(shown + 40)} className="mx-auto mt-4 block h-10 rounded-full border border-line bg-white px-5 text-[13.5px] font-semibold">
          Show more ({filtered.length - shown})
        </button>
      )}
    </div>
  );
}

function AssignTenant({ listing, onClose, onDone }: { listing: Listing; onClose: () => void; onDone: (t: Tenancy) => void }) {
  const [f, setF] = useState({ tenantName: "", tenantPhone: "", startDate: new Date().toISOString().slice(0, 10), months: "6", rentAed: String(listing.priceAed), beds: "1", note: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const shared = listing.type === "bed_space" || listing.type === "partition";
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 md:items-center" onClick={onClose}>
      <div className="w-full max-w-[520px] rounded-t-[24px] bg-white p-6 md:rounded-[24px]" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-label="Assign tenant">
        <h2 className="text-[20px] font-bold">Assign a tenant</h2>
        <p className="mt-1 text-[13.5px] text-muted">
          {listing.id} · {listing.title}. The place (or the beds taken) stops showing as available, and the tenancy appears under Tenancies with its end date.
        </p>
        <div className="mt-5 grid grid-cols-2 gap-3">
          <label className="col-span-2 block">
            <span className="mb-1 block text-[12.5px] font-semibold">Tenant name</span>
            <input className={field} value={f.tenantName} onChange={(e) => setF({ ...f, tenantName: e.target.value })} />
          </label>
          <label className="col-span-2 block">
            <span className="mb-1 block text-[12.5px] font-semibold">Tenant WhatsApp</span>
            <input className={field} value={f.tenantPhone} onChange={(e) => setF({ ...f, tenantPhone: e.target.value })} placeholder="050 123 4567" />
          </label>
          <label className="block">
            <span className="mb-1 block text-[12.5px] font-semibold">Start date</span>
            <input type="date" className={field} value={f.startDate} onChange={(e) => setF({ ...f, startDate: e.target.value })} />
          </label>
          <label className="block">
            <span className="mb-1 block text-[12.5px] font-semibold">Length</span>
            <select className={field} value={f.months} onChange={(e) => setF({ ...f, months: e.target.value })}>
              {[1, 2, 3, 6, 12].map((m) => (
                <option key={m} value={m}>
                  {m} month{m > 1 ? "s" : ""}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="mb-1 block text-[12.5px] font-semibold">Rent (AED / month)</span>
            <input className={field} inputMode="numeric" value={f.rentAed} onChange={(e) => setF({ ...f, rentAed: e.target.value.replace(/\D/g, "") })} />
          </label>
          {shared && (
            <label className="block">
              <span className="mb-1 block text-[12.5px] font-semibold">Beds taken</span>
              <input className={field} inputMode="numeric" value={f.beds} onChange={(e) => setF({ ...f, beds: e.target.value.replace(/\D/g, "") })} />
            </label>
          )}
          <label className="col-span-2 block">
            <span className="mb-1 block text-[12.5px] font-semibold">Note</span>
            <input className={field} value={f.note} onChange={(e) => setF({ ...f, note: e.target.value })} placeholder="Deposit paid, contract signed…" />
          </label>
        </div>
        {error && <p className="mt-3 text-[13px] font-medium text-warn">{error}</p>}
        <div className="mt-5 flex justify-end gap-2">
          <button onClick={onClose} className="h-11 px-4 text-[14px] text-muted">
            Cancel
          </button>
          <button
            disabled={busy}
            onClick={async () => {
              setBusy(true);
              setError("");
              try {
                const j = await api("/api/admin/tenancies", "POST", { listingId: listing.id, ...f, months: Number(f.months), beds: Number(f.beds) || 1 });
                onDone(j.tenancy);
              } catch (e) {
                setError((e as Error).message);
              } finally {
                setBusy(false);
              }
            }}
            className="h-11 rounded-full bg-brand px-6 text-[14.5px] font-semibold text-white disabled:opacity-50"
          >
            {busy ? "Saving…" : "Assign"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ================================ Tenancies ================================ */

function Tenancies({ tenancies, onChange, onEnded }: { tenancies: Tenancy[]; onChange: (t: Tenancy) => void; onEnded: (t: Tenancy) => void }) {
  const active = tenancies.filter((t) => t.status === "active").sort((a, b) => a.endDate.localeCompare(b.endDate));
  const past = tenancies.filter((t) => t.status === "ended");
  const act = async (t: Tenancy, action: "end" | "renew" | "reminded", months?: number) => {
    const j = await api("/api/admin/tenancies", "PATCH", { id: t.id, action, months });
    if (action === "end") onEnded(j.tenancy);
    else onChange(j.tenancy);
  };

  return (
    <div>
      <h1 className="text-[24px] font-bold">Tenancies</h1>
      <p className="text-[14px] text-muted">Who is living where, and when each stay ends. Send a renewal reminder about a month before.</p>
      <div className="mt-5 space-y-3">
        {active.length === 0 && (
          <div className="rounded-[22px] border border-dashed border-line-strong bg-white px-6 py-14 text-center">
            <p className="text-[17px] font-bold">No active tenancies</p>
            <p className="mt-1 text-[14px] text-muted">In Listings, use “Assign tenant” when a place is taken.</p>
          </div>
        )}
        {active.map((t) => {
          const d = daysUntil(t.endDate);
          const tone = d < 0 ? "bg-warn text-white" : d <= 14 ? "bg-[#fde2e2] text-[#9b1c1c]" : d <= 30 ? "bg-[#fbefdc] text-[#8a5a14]" : "bg-mint text-brand";
          return (
            <div key={t.id} className="flex flex-col gap-3 rounded-[20px] border border-line bg-white p-4 md:flex-row md:items-center md:justify-between md:p-5">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <Pill tone={tone}>{d < 0 ? `Ended ${-d} d ago` : d === 0 ? "Ends today" : `Ends in ${d} d`}</Pill>
                  {t.lastReminderAt && <span className="text-[12.5px] text-muted">Reminder sent {ago(t.lastReminderAt)}</span>}
                </div>
                <p className="mt-2 text-[16px] font-bold">
                  {t.tenantName} <span className="font-medium text-muted">· +{t.tenantPhone}</span>
                </p>
                <p className="text-[13.5px] text-ink-2">
                  {t.listingTitle} ({t.listingId}) · {fmtDate(t.startDate)} → {fmtDate(t.endDate)} · {aed(t.rentAed)}/mo{t.beds > 1 ? ` · ${t.beds} beds` : ""}
                </p>
                {t.note && <p className="text-[13px] text-muted">{t.note}</p>}
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <WaButton href={wa(t.tenantPhone, renewalReminder(t))} onClick={() => act(t, "reminded")} label="Renewal reminder" />
                <select
                  defaultValue=""
                  onChange={(e) => {
                    if (e.target.value) act(t, "renew", Number(e.target.value));
                    e.target.value = "";
                  }}
                  className="h-9 rounded-full border border-line bg-white px-3 text-[13px]"
                  aria-label="Renew"
                >
                  <option value="">Renew…</option>
                  {[1, 3, 6, 12].map((m) => (
                    <option key={m} value={m}>
                      +{m} month{m > 1 ? "s" : ""}
                    </option>
                  ))}
                </select>
                <button onClick={() => window.confirm(`End ${t.tenantName}'s tenancy and make the place available again?`) && act(t, "end")} className="h-9 rounded-full border border-line px-3.5 text-[13px] font-medium">
                  End tenancy
                </button>
              </div>
            </div>
          );
        })}
      </div>
      {past.length > 0 && (
        <details className="mt-8">
          <summary className="cursor-pointer text-[14px] font-semibold text-muted">Past tenancies ({past.length})</summary>
          <div className="mt-3 overflow-hidden rounded-[18px] border border-line bg-white">
            {past.map((t) => (
              <p key={t.id} className="border-b border-line px-4 py-3 text-[13.5px] last:border-b-0">
                <span className="font-semibold">{t.tenantName}</span> · {t.listingTitle} · {fmtDate(t.startDate)} → {fmtDate(t.endDate)}
              </p>
            ))}
          </div>
        </details>
      )}
    </div>
  );
}

/* ================================ Roommates ================================ */

function Roommates({ leads, focus, onFocus, onPatch }: { leads: LeadRecord[]; focus: string | null; onFocus: (id: string) => void; onPatch: (id: string, p: { status?: LeadStatus }) => void }) {
  const profiles = leads.filter((l) => l.kind === "roommate" && l.status !== "closed");
  const current = profiles.find((p) => p.id === focus) ?? profiles[0];
  const ranked = useMemo(() => {
    if (!current) return [];
    const me = current.data as unknown as RoommateLead;
    return profiles
      .filter((p) => p.id !== current.id)
      .map((p) => ({ p, m: roommateMatch(me, p.data as unknown as RoommateLead) }))
      .filter((x) => x.m.score > 0)
      .sort((a, b) => b.m.score - a.m.score);
  }, [current, profiles]);

  if (!profiles.length) {
    return (
      <div className="rounded-[22px] border border-dashed border-line-strong bg-white px-6 py-14 text-center">
        <p className="text-[17px] font-bold">No roommate profiles yet</p>
        <p className="mt-1 text-[14px] text-muted">Profiles sent from /roommates on the website or the app appear here, ready to match.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]">
      <div>
        <h1 className="text-[24px] font-bold">Roommates</h1>
        <p className="text-[14px] text-muted">Pick a profile to see who fits best. Gender must match; then budget, area, move-in date and habits.</p>
        <div className="mt-4 space-y-2">
          {profiles.map((p) => {
            const r = p.data as unknown as RoommateLead;
            return (
              <button key={p.id} onClick={() => onFocus(p.id)} className={`w-full rounded-[18px] border bg-white p-3.5 text-left ${current?.id === p.id ? "border-brand ring-1 ring-brand" : "border-line"}`}>
                <p className="flex items-center justify-between gap-2 text-[15px] font-bold">
                  {p.name}
                  <Pill tone={STATUS_TONE[p.status]}>{p.status}</Pill>
                </p>
                <p className="mt-0.5 text-[13px] text-muted">
                  {r.mode === "has_place" ? "Has a place" : "Looking"} · {r.gender} · {aed(r.budget)} · {r.areaSlugs.map(areaName).join(", ") || "any area"}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      <div>
        {current && (
          <div className="rounded-[22px] bg-brand p-5 text-white">
            <p className="text-[12px] font-bold uppercase tracking-[0.1em] text-[#8fe3bd]">Matching for</p>
            <p className="mt-1 text-[20px] font-bold">{current.name}</p>
            <p className="text-[14px] text-white/80">{leadSummary(current)}</p>
          </div>
        )}
        <div className="mt-4 space-y-3">
          {ranked.length === 0 && <p className="rounded-[18px] bg-white p-6 text-center text-[14px] text-muted">No compatible profiles yet. New profiles are scored automatically.</p>}
          {ranked.map(({ p, m }) => {
            const a = current!.data as unknown as RoommateLead;
            const b = p.data as unknown as RoommateLead;
            return (
              <div key={p.id} className="rounded-[20px] border border-line bg-white p-4">
                <div className="flex items-center gap-4">
                  <div className="relative h-14 w-14 shrink-0">
                    <svg viewBox="0 0 36 36" className="h-14 w-14 -rotate-90">
                      <circle cx="18" cy="18" r="15.5" fill="none" stroke="var(--mint)" strokeWidth="4" />
                      <circle cx="18" cy="18" r="15.5" fill="none" stroke="var(--brand)" strokeWidth="4" strokeDasharray={`${(m.score / 100) * 97.4} 97.4`} strokeLinecap="round" />
                    </svg>
                    <span className="absolute inset-0 flex items-center justify-center text-[14px] font-extrabold text-brand">{m.score}</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[15.5px] font-bold">{p.name}</p>
                    <p className="text-[13px] text-muted">{leadSummary(p)}</p>
                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                      {m.reasons.map((r) => (
                        <span key={r} className="rounded-full bg-mint px-2.5 py-1 text-[11.5px] font-semibold text-brand">
                          {r}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap gap-2 border-t border-line pt-3">
                  <WaButton href={wa(current!.phone, roommateIntro(current!, { ...b, name: p.name }, b.areaSlugs.map(areaName).join(", "), m.reasons))} label={`Introduce to ${current!.name.split(" ")[0]}`} />
                  <WaButton href={wa(p.phone, roommateIntro(p, { ...a, name: current!.name }, a.areaSlugs.map(areaName).join(", "), m.reasons))} label={`Introduce to ${p.name.split(" ")[0]}`} />
                  <button
                    onClick={() => {
                      onPatch(current!.id, { status: "matched" });
                      onPatch(p.id, { status: "matched" });
                    }}
                    className="h-9 rounded-full border border-line px-3.5 text-[13px] font-medium"
                  >
                    Mark both matched
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ================================ Announcements ================================ */

const AUDIENCES: [string, string][] = [
  ["all", "Everyone who contacted us"],
  ["tenant", "Room requests"],
  ["inquiry", "Viewing requests"],
  ["roommate", "Roommate profiles"],
  ["owner", "Owners"],
  ["tenants", "Current tenants"],
];

function Announcements({ list, setList, leads, tenancies, flash }: { list: Announcement[]; setList: (a: Announcement[]) => void; leads: LeadRecord[]; tenancies: Tenancy[]; flash: (m: string) => void }) {
  const blank = { title: "", message: "", link: "", expiresAt: "", active: true };
  const [f, setF] = useState<Partial<Announcement>>(blank);
  const [audience, setAudience] = useState("all");
  const [selected, setSelected] = useState<Announcement | null>(list[0] ?? null);
  const [sent, setSent] = useState<Set<string>>(new Set());

  const contacts = useMemo(() => {
    const people =
      audience === "tenants"
        ? tenancies.filter((t) => t.status === "active").map((t) => ({ name: t.tenantName, phone: t.tenantPhone }))
        : leads.filter((l) => audience === "all" || l.kind === audience).map((l) => ({ name: l.name, phone: l.phone }));
    const seen = new Map<string, { name: string; phone: string }>();
    for (const p of people) if (!seen.has(p.phone)) seen.set(p.phone, p);
    return [...seen.values()];
  }, [audience, leads, tenancies]);

  const save = async (a: Partial<Announcement>) => {
    try {
      const j = await api("/api/admin/announcements", "POST", a);
      setList(j.announcements);
      setSelected(j.announcement);
      setF(blank);
      flash(j.announcement.active ? "Announcement is live on the site and app" : "Saved");
    } catch (e) {
      flash((e as Error).message);
    }
  };

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <div>
        <h1 className="text-[24px] font-bold">Announcements</h1>
        <p className="text-[14px] text-muted">The live one shows as a banner on the website and in the app. You can also send it on WhatsApp.</p>
        <div className="mt-4 space-y-3 rounded-[22px] border border-line bg-white p-5">
          <input className={field} placeholder="Title, e.g. New bed spaces in Al Barsha" value={f.title ?? ""} onChange={(e) => setF({ ...f, title: e.target.value })} />
          <textarea className={`${field} min-h-[110px]`} placeholder="Message" value={f.message ?? ""} onChange={(e) => setF({ ...f, message: e.target.value })} />
          <div className="grid grid-cols-2 gap-3">
            <input className={field} placeholder="Link (optional)" value={f.link ?? ""} onChange={(e) => setF({ ...f, link: e.target.value })} />
            <label className="flex items-center gap-2 text-[13px] text-muted">
              Until
              <input type="date" className={field} value={f.expiresAt ?? ""} onChange={(e) => setF({ ...f, expiresAt: e.target.value })} />
            </label>
          </div>
          <label className="flex items-center gap-2 text-[14px]">
            <input type="checkbox" checked={!!f.active} onChange={(e) => setF({ ...f, active: e.target.checked })} className="h-4 w-4 accent-[var(--brand)]" />
            Show as banner on the site and app now
          </label>
          <button onClick={() => save(f)} className="h-11 rounded-full bg-brand px-6 text-[14.5px] font-semibold text-white">
            {f.id ? "Save changes" : "Publish"}
          </button>
        </div>

        <div className="mt-5 space-y-2">
          {list.map((a) => (
            <div key={a.id} className={`rounded-[18px] border bg-white p-4 ${selected?.id === a.id ? "border-brand" : "border-line"}`}>
              <div className="flex items-start justify-between gap-3">
                <button onClick={() => setSelected(a)} className="min-w-0 text-left">
                  <p className="text-[15px] font-bold">{a.title}</p>
                  <p className="line-clamp-2 text-[13px] text-muted">{a.message}</p>
                </button>
                <Pill tone={a.active ? "bg-fresh text-white" : "bg-surface text-muted"}>{a.active ? "Live" : "Off"}</Pill>
              </div>
              <div className="mt-2 flex gap-3 text-[13px]">
                <button onClick={() => save({ ...a, active: !a.active })} className="font-semibold text-brand">
                  {a.active ? "Turn off" : "Make live"}
                </button>
                <button onClick={() => setF(a)} className="text-muted">
                  Edit
                </button>
                <button
                  onClick={async () => {
                    const j = await api(`/api/admin/announcements?id=${a.id}`, "DELETE");
                    setList(j.announcements);
                  }}
                  className="text-warn"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <div className="rounded-[22px] border border-line bg-white p-5">
          <h2 className="text-[18px] font-bold">Send on WhatsApp</h2>
          <p className="text-[13.5px] text-muted">{selected ? `“${selected.title}”` : "Pick an announcement on the left."} WhatsApp opens one chat at a time with the message ready.</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {AUDIENCES.map(([k, label]) => (
              <button key={k} onClick={() => setAudience(k)} className={`h-9 rounded-full border px-3.5 text-[13px] font-medium ${audience === k ? "border-brand bg-brand text-white" : "border-line"}`}>
                {label}
              </button>
            ))}
          </div>
          <div className="mt-3 flex items-center justify-between text-[13px] text-muted">
            <span>
              {contacts.length} contacts · {sent.size} sent
            </span>
            <button
              onClick={() => {
                navigator.clipboard?.writeText(contacts.map((c) => `+${c.phone}`).join("\n"));
                flash("Numbers copied (for a WhatsApp Business broadcast list)");
              }}
              className="font-semibold text-brand"
            >
              Copy all numbers
            </button>
          </div>
          <div className="mt-3 max-h-[520px] space-y-1.5 overflow-y-auto">
            {contacts.map((c) => (
              <div key={c.phone} className="flex items-center justify-between gap-3 rounded-[14px] bg-surface px-3.5 py-2.5">
                <span className="min-w-0 truncate text-[14px]">
                  <span className="font-semibold">{c.name}</span> <span className="text-muted">+{c.phone}</span>
                </span>
                {selected ? (
                  <a
                    href={wa(c.phone, broadcastText(selected))}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => setSent((s) => new Set(s).add(c.phone))}
                    className={`inline-flex h-8 shrink-0 items-center gap-1 rounded-full px-3 text-[12.5px] font-semibold ${sent.has(c.phone) ? "bg-mint text-brand" : "bg-whatsapp text-white"}`}
                  >
                    {sent.has(c.phone) ? "Sent ✓" : "Send"}
                  </a>
                ) : null}
              </div>
            ))}
            {contacts.length === 0 && <p className="py-6 text-center text-[13.5px] text-muted">No contacts in this group yet.</p>}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ================================ Public roommate board ================================ */

function PublicBoard({ profiles, setProfiles, flash }: { profiles: RoommateProfile[]; setProfiles: (p: RoommateProfile[]) => void; flash: (m: string) => void }) {
  const [show, setShow] = useState<"pending" | "approved" | "hidden">("pending");
  const list = profiles.filter((p) => p.status === show);
  const set = async (p: RoommateProfile, status: RoommateProfile["status"]) => {
    await api("/api/admin/roommates", "PATCH", { id: p.id, status });
    setProfiles(profiles.map((x) => (x.id === p.id ? { ...x, status } : x)));
    flash(status === "approved" ? `${p.firstName} is now on the public board` : `${p.firstName} is ${status}`);
  };
  return (
    <section className="mb-10">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-[24px] font-bold">Public roommate board</h1>
          <p className="text-[14px] text-muted">Profiles people agreed to show. Check the photo and text, then approve. Phone numbers are never shown publicly.</p>
        </div>
        <div className="flex gap-1">
          {(["pending", "approved", "hidden"] as const).map((s) => (
            <button key={s} onClick={() => setShow(s)} className={`h-9 rounded-full px-3.5 text-[13px] font-medium capitalize ${show === s ? "bg-brand text-white" : "border border-line bg-white"}`}>
              {s} ({profiles.filter((p) => p.status === s).length})
            </button>
          ))}
        </div>
      </div>
      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {list.length === 0 && <p className="col-span-full rounded-[18px] bg-white p-6 text-center text-[14px] text-muted">Nothing {show}.</p>}
        {list.map((p) => (
          <div key={p.id} className="flex gap-3 rounded-[20px] border border-line bg-white p-3">
            <div className="h-20 w-20 shrink-0 overflow-hidden rounded-[14px] bg-mint">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              {p.photo ? <img src={p.photo} alt="" className="h-full w-full object-cover" /> : <span className="flex h-full items-center justify-center text-[24px] font-bold text-brand">{p.firstName[0]}</span>}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[15px] font-bold">
                {p.firstName}
                {p.age ? `, ${p.age}` : ""} <span className="text-[12.5px] font-medium text-muted">· {p.gender}</span>
              </p>
              <p className="truncate text-[12.5px] text-muted">
                {p.mode === "has_place" ? "Has a place" : "Looking"} · {aed(p.budget)} · {p.areaSlugs.map(areaName).join(", ") || "any area"}
              </p>
              {p.about && <p className="mt-1 line-clamp-2 text-[12.5px] italic text-ink-2">“{p.about}”</p>}
              <div className="mt-2 flex gap-2">
                {p.status !== "approved" && (
                  <button onClick={() => set(p, "approved")} className="h-8 rounded-full bg-brand px-3 text-[12.5px] font-semibold text-white">
                    Approve
                  </button>
                )}
                {p.status !== "hidden" && (
                  <button onClick={() => set(p, "hidden")} className="h-8 rounded-full border border-line px-3 text-[12.5px]">
                    Hide
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ================================ People (accounts) ================================ */

function People({ users, leads }: { users: AdminUser[]; leads: LeadRecord[] }) {
  const [q, setQ] = useState("");
  const shown = users
    .filter((u) => !q || `${u.name} ${u.email} ${u.phone ?? ""}`.toLowerCase().includes(q.toLowerCase()))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-[24px] font-bold">People</h1>
          <p className="text-[14px] text-muted">
            {users.length} accounts · {users.filter((u) => u.provider === "google").length} with Google · {users.filter((u) => !u.phone).length} without a phone yet
          </p>
        </div>
        <input className={`${field} max-w-[280px]`} placeholder="Search name, email, phone…" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>
      <div className="mt-4 overflow-hidden rounded-[20px] border border-line bg-white">
        {shown.length === 0 && <p className="p-8 text-center text-[14px] text-muted">No accounts yet. People sign up at /login.</p>}
        {shown.map((u) => {
          const requests = leads.filter((l) => l.userId === u.id).length;
          return (
            <div key={u.id} className="flex flex-col gap-3 border-b border-line p-3.5 last:border-b-0 md:flex-row md:items-center">
              <div className="flex min-w-0 flex-1 items-center gap-3">
                <div className="h-10 w-10 shrink-0 overflow-hidden rounded-full bg-mint">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  {u.picture ? <img src={u.picture} alt="" className="h-full w-full object-cover" referrerPolicy="no-referrer" /> : <span className="flex h-full items-center justify-center font-bold text-brand">{u.name[0]}</span>}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-[14.5px] font-semibold">
                    {u.name} {u.admin && <span className="ml-1 rounded-full bg-ink px-2 py-0.5 text-[10.5px] font-bold text-white">ADMIN</span>}
                  </p>
                  <p className="truncate text-[12.5px] text-muted">
                    {u.email} · {u.phone ? `+${u.phone}` : "no phone yet"} · {u.provider === "google" ? "Google" : "Email"} · joined {ago(u.createdAt)} · {requests} request{requests === 1 ? "" : "s"}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                {u.phone && <WaButton href={wa(u.phone, `Hi ${u.name.split(" ")[0]}, this is Stayshay.`)} />}
                <a href={`mailto:${u.email}`} className="inline-flex h-9 items-center rounded-full border border-line px-3.5 text-[13px] font-semibold">
                  Email
                </a>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
