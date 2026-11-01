"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  AREAS,
  AREA_BY_SLUG,
  BILL_LABEL,
  EVERY_LABEL,
  LAYOUT_LABEL,
  PAY_IN,
  PAY_LABEL,
  SPACE_LABEL,
  billMonthly,
  leaseMonthly,
  periodLabel,
  portfolioReport,
  rentReminder,
  settled,
  shareIn,
  shiftPeriod,
  shortDay,
  whatsappLink,
  type Bill,
  type BillKind,
  type Every,
  type LeaseCheque,
  type Layout,
  type MPayment,
  type MProperty,
  type MTenant,
  type PayKind,
  type PayMethod,
  type PropertyReport,
  type Space,
  type SpaceKind,
} from "@stayshay/core/src/client.ts";
import { Logo } from "./ui";

/* ---------- helpers ---------- */

const aed = (n: number) => `AED ${Math.round(n).toLocaleString("en-US")}`;
const signed = (n: number) => (n < 0 ? `−${aed(-n)}` : aed(n));
const today = () => new Date().toISOString().slice(0, 10);
const tmpId = () => Math.random().toString(36).slice(2, 10);
const areaName = (slug: string) => AREA_BY_SLUG.get(slug)?.name ?? slug;
const field = "w-full rounded-[14px] border border-line bg-white px-3.5 py-3 text-[15px] focus:border-brand focus:outline-none";
const label = "block text-[12.5px] font-semibold text-ink-2";
const ghost = "inline-flex h-9 items-center rounded-[11px] border border-line bg-white px-3 text-[13px] font-semibold text-ink hover:border-brand";
const primary = "inline-flex h-11 items-center justify-center rounded-[13px] bg-brand px-5 text-[14.5px] font-semibold text-white";

type Data = { properties: MProperty[]; tenants: MTenant[]; payments: MPayment[] };
type Tab = "overview" | "apartments" | "tenants" | "payments";
type Sheet =
  | { kind: "property"; value: Partial<MProperty> }
  | { kind: "tenant"; value: Partial<MTenant> }
  | { kind: "payment"; value: Partial<MPayment> }
  | null;

async function call(body: Record<string, unknown>): Promise<{ ok: boolean; error?: string } & Partial<Data>> {
  const res = await fetch("/api/manager", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) }).catch(() => null);
  if (!res) return { ok: false, error: "No connection. Try again." };
  return res.json().catch(() => ({ ok: false, error: "Something went wrong" }));
}

/* ---------- app ---------- */

export function ManagerApp({ initial, ownerName }: { initial: Data; ownerName: string }) {
  const [data, setData] = useState<Data>(initial);
  const [period, setPeriod] = useState(today().slice(0, 7));
  const [tab, setTab] = useState<Tab>("overview");
  const [openId, setOpenIdState] = useState<string | null>(null);
  // Each apartment has its own link (#p=<id>) so the back button and bookmarks work.
  const setOpenId = (id: string | null) => {
    setOpenIdState(id);
    history.replaceState(null, "", id ? `#p=${id}` : location.pathname);
    window.scrollTo({ top: 0 });
  };
  useEffect(() => {
    const m = location.hash.match(/^#p=([\w-]+)$/);
    if (m) setOpenIdState(m[1]);
  }, []);
  const [sheet, setSheet] = useState<Sheet>(null);
  const [toast, setToast] = useState<string | null>(null);

  const report = useMemo(() => portfolioReport(data.properties, data.tenants, data.payments, period, today()), [data, period]);
  const flash = (m: string) => {
    setToast(m);
    setTimeout(() => setToast(null), 2600);
  };

  const run = async (body: Record<string, unknown>, done: string) => {
    const r = await call(body);
    if (!r.ok) {
      flash(r.error ?? "Couldn't save");
      return false;
    }
    setData({ properties: r.properties ?? [], tenants: r.tenants ?? [], payments: r.payments ?? [] });
    flash(done);
    return true;
  };

  const markPaid = (t: MTenant, amount: number) =>
    run({ action: "payment.add", payment: { propertyId: t.propertyId, kind: "rent", tenantId: t.id, period, amountAed: amount, date: today(), method: "cash" } }, `Rent from ${t.name.split(" ")[0]} recorded`);

  const chequeStatus = (id: string, status: "cleared" | "bounced") => run({ action: "payment.cheque", id, status }, status === "cleared" ? "Cheque marked cleared" : "Cheque marked bounced");

  const open = openId ? report.properties.find((r) => r.property.id === openId) : undefined;
  const firstName = ownerName.split(" ")[0];

  return (
    <div className="min-h-screen bg-surface pb-24">
      <header className="sticky top-0 z-30 border-b border-line bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-[1200px] items-center justify-between gap-3 px-4 md:px-8">
          <Link href="/" className="flex items-center gap-2">
            <Logo size={28} />
            <span className="hidden rounded-full bg-mint px-2.5 py-1 text-[11.5px] font-bold uppercase tracking-[0.1em] text-brand sm:inline">Manager</span>
          </Link>
          <div className="flex items-center gap-1 rounded-full border border-line bg-white p-1">
            <button className="h-8 w-8 rounded-[12px] text-[16px] text-ink-2 hover:bg-surface" onClick={() => setPeriod((p) => shiftPeriod(p, -1))} aria-label="Previous month">
              ‹
            </button>
            <span className="min-w-[118px] text-center text-[13.5px] font-semibold">{periodLabel(period)}</span>
            <button className="h-8 w-8 rounded-[12px] text-[16px] text-ink-2 hover:bg-surface" onClick={() => setPeriod((p) => shiftPeriod(p, 1))} aria-label="Next month">
              ›
            </button>
          </div>
        </div>
        <nav className="mx-auto flex max-w-[1200px] gap-1 overflow-x-auto px-4 md:px-8" aria-label="Manager sections">
          {(
            [
              ["overview", "Overview"],
              ["apartments", `Apartments (${data.properties.length})`],
              ["tenants", `Tenants (${data.tenants.filter((t) => t.status === "active").length})`],
              ["payments", "Payments"],
            ] as [Tab, string][]
          ).map(([t, l]) => (
            <button
              key={t}
              onClick={() => {
                setTab(t);
                setOpenId(null);
              }}
              className={`-mb-px h-11 shrink-0 border-b-2 px-3 text-[14px] ${tab === t && !openId ? "border-brand font-semibold text-brand" : "border-transparent text-muted hover:text-ink"}`}
            >
              {l}
            </button>
          ))}
        </nav>
      </header>

      <main className="mx-auto max-w-[1200px] px-4 pt-6 md:px-8">
        {!data.properties.length ? (
          <Welcome name={firstName} onAdd={() => setSheet({ kind: "property", value: starterProperty() })} />
        ) : open ? (
          <PropertyView
            r={open}
            tenants={data.tenants.filter((t) => t.propertyId === open.property.id)}
            payments={data.payments.filter((p) => p.propertyId === open.property.id && shareIn(p, period) > 0)}
            allPayments={data.payments.filter((p) => p.propertyId === open.property.id)}
            period={period}
            onBack={() => setOpenId(null)}
            onEdit={() => setSheet({ kind: "property", value: open.property })}
            onDelete={async () => {
              if (!confirm(`Delete ${open.property.name} with its tenants and payments? This can't be undone.`)) return;
              if (await run({ action: "property.delete", id: open.property.id }, "Apartment deleted")) setOpenId(null);
            }}
            onAddTenant={(space, each) => setSheet({ kind: "tenant", value: { propertyId: open.property.id, spaceId: space.id, rentAed: each, depositAed: each, dueDay: 1, moveIn: today(), status: "active" } })}
            onEditTenant={(t) => setSheet({ kind: "tenant", value: t })}
            onMarkPaid={markPaid}
            onPayCost={(kind, amount, billId, note) => run({ action: "payment.add", payment: { propertyId: open.property.id, kind, billId, period, amountAed: amount, date: today(), method: "transfer", note } }, "Payment recorded")}
            onLeaseCheque={(c, status) =>
              run(
                { action: "payment.add", payment: { propertyId: open.property.id, kind: "lease", period: c.dueDate.slice(0, 7), months: c.months, amountAed: c.amountAed, date: today(), method: "cheque", chequeStatus: status, chequeIndex: c.index, note: `Landlord cheque ${c.index + 1}` } },
                status === "cleared" ? `Cheque ${c.index + 1} marked cleared` : `Cheque ${c.index + 1} recorded as given`,
              )
            }
            onChequeStatus={chequeStatus}
            onPhoto={async (f) => {
              const fd = new FormData();
              fd.set("propertyId", open.property.id);
              fd.set("photo", f);
              const res = await fetch("/api/manager/photo", { method: "POST", body: fd }).catch(() => null);
              const j = await res?.json().catch(() => null);
              if (res?.ok && j) {
                setData({ properties: j.properties, tenants: j.tenants, payments: j.payments });
                flash("Photo added");
              } else flash(j?.error ?? "Upload failed");
            }}
            onPhotoRemove={(url) => run({ action: "photo.remove", propertyId: open.property.id, url }, "Photo removed")}
            onRecord={() => setSheet({ kind: "payment", value: { propertyId: open.property.id, period, date: today(), kind: "rent", method: "cash", months: 1 } })}
            onDeletePayment={(p) => run({ action: "payment.delete", id: p.id }, "Payment removed")}
          />
        ) : tab === "overview" ? (
          <Overview report={report} name={firstName} onOpen={setOpenId} onMarkPaid={markPaid} onAdd={() => setSheet({ kind: "property", value: starterProperty() })} />
        ) : tab === "apartments" ? (
          <Apartments report={report} onOpen={setOpenId} onAdd={() => setSheet({ kind: "property", value: starterProperty() })} />
        ) : tab === "tenants" ? (
          <Tenants data={data} onEdit={(t) => setSheet({ kind: "tenant", value: t })} />
        ) : (
          <Payments
            data={data}
            period={period}
            onRecord={() => setSheet({ kind: "payment", value: { propertyId: data.properties[0]?.id, period, date: today(), kind: "rent", method: "cash", months: 1 } })}
            onDelete={(p) => run({ action: "payment.delete", id: p.id }, "Payment removed")}
            onChequeStatus={chequeStatus}
          />
        )}
      </main>

      {sheet && (
        <SheetFrame title={sheet.kind === "property" ? (sheet.value.id ? "Edit apartment" : "Add an apartment") : sheet.kind === "tenant" ? (sheet.value.id ? "Edit tenant" : "Add a tenant") : "Record a payment"} onClose={() => setSheet(null)}>
          {sheet.kind === "property" ? (
            <PropertyForm
              initial={sheet.value}
              onSave={async (p) => {
                const r = await call({ action: "property.save", property: p });
                if (!r.ok) return flash(r.error ?? "Couldn't save");
                setData({ properties: r.properties ?? [], tenants: r.tenants ?? [], payments: r.payments ?? [] });
                setSheet(null);
                flash("Apartment saved");
                if (!p.id && "id" in r && typeof r.id === "string") setOpenId(r.id);
              }}
            />
          ) : sheet.kind === "tenant" ? (
            <TenantForm
              initial={sheet.value}
              properties={data.properties}
              tenants={data.tenants}
              onSave={async (t) => (await run({ action: "tenant.save", tenant: t }, "Tenant saved")) && setSheet(null)}
              onDelete={sheet.value.id ? async () => confirm("Delete this tenant and keep their payments?") && (await run({ action: "tenant.delete", id: sheet.value.id }, "Tenant deleted")) && setSheet(null) : undefined}
            />
          ) : (
            <PaymentForm initial={sheet.value} data={data} onSave={async (p) => (await run({ action: "payment.add", payment: p }, "Payment recorded")) && setSheet(null)} />
          )}
        </SheetFrame>
      )}

      {toast && <p className="fixed bottom-6 left-1/2 z-[70] -translate-x-1/2 rounded-full bg-ink px-5 py-2.5 text-[13.5px] font-medium text-white shadow-lg">{toast}</p>}
    </div>
  );
}

/* ---------- overview ---------- */

function Kpi({ k, v, sub, tone }: { k: string; v: string; sub?: string; tone?: "good" | "bad" }) {
  return (
    <div className="rounded-[20px] border border-white/12 bg-white/[0.06] p-4">
      <p className="text-[12px] font-semibold text-white/60">{k}</p>
      <p className={`font-figure mt-1 whitespace-nowrap text-[18px] font-bold sm:text-[22px] md:text-[26px] ${tone === "bad" ? "text-[#ffb4a2]" : tone === "good" ? "text-[#a7f3d0]" : "text-white"}`}>{v}</p>
      {sub && <p className="mt-0.5 text-[12px] text-white/55">{sub}</p>}
    </div>
  );
}

function Bar({ value, max }: { value: number; max: number }) {
  const pct = max ? Math.min(100, Math.round((value / max) * 100)) : 0;
  return (
    <div className="h-2 overflow-hidden rounded-full bg-white/10">
      <div className="h-full rounded-full bg-[linear-gradient(90deg,#6ee7b7,#d6f88c)] shadow-[0_0_14px_rgb(110_231_183/0.7)] transition-all" style={{ width: `${pct}%` }} />
    </div>
  );
}

function Overview({ report, name, onOpen, onMarkPaid, onAdd }: { report: ReturnType<typeof portfolioReport>; name: string; onOpen: (id: string) => void; onMarkPaid: (t: MTenant, amount: number) => void; onAdd: () => void }) {
  const late = report.properties.flatMap((r) => r.dues.filter((d) => d.late).map((d) => ({ d, p: r.property })));
  const other = report.alerts.filter((a) => !/ owes AED /.test(a.text));
  return (
    <div className="space-y-6">
      <section className="glow-panel overflow-hidden rounded-[28px] p-5 text-white md:p-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-[12px] font-bold uppercase tracking-[0.14em] text-[#8fe3bd]">Hello {name}</p>
            <h1 className="font-display mt-2 text-[28px] leading-[1.05] md:text-[38px]">
              {aed(report.collected)} <span className="text-white/50">of {aed(report.expected)} collected</span>
            </h1>
          </div>
          <p className="text-[13.5px] text-white/65">
            {report.occupied} of {report.spaces} spaces let · {report.properties.length} {report.properties.length === 1 ? "apartment" : "apartments"}
          </p>
        </div>
        <div className="mt-5">
          <Bar value={report.collected} max={report.expected} />
        </div>
        <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4">
          <Kpi k="Still to collect" v={aed(report.outstanding)} tone={report.outstanding ? "bad" : "good"} sub={late.length ? `${late.length} late` : "Nobody late"} />
          <Kpi k="Running costs" v={aed(report.costs)} sub="Rent to landlord + bills" />
          <Kpi k="Profit this month" v={signed(report.profit)} tone={report.profit >= 0 ? "good" : "bad"} sub="If everyone pays" />
          <Kpi k="Empty spaces cost you" v={aed(report.missing)} sub="a month in missed rent" />
        </div>
      </section>

      <Snapshot r={report} />

      {(late.length > 0 || other.length > 0) && (
        <section className="rounded-[24px] border border-line bg-white p-5">
          <h2 className="text-[17px] font-bold">Needs attention</h2>
          <ul className="mt-3 divide-y divide-line">
            {late.map(({ d, p }) => (
              <li key={d.tenant.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                <span className="text-[14.5px]">
                  <span className="mr-2 inline-block h-2 w-2 rounded-full bg-[#e8735a] shadow-[0_0_10px_#e8735a]" />
                  <b>{d.tenant.name}</b> owes {aed(d.outstanding)} · {p.name}, {d.space?.label ?? "space"} · due {shortDay(d.dueDate)}
                </span>
                <span className="flex gap-2">
                  {d.tenant.phone && (
                    <a className={ghost} href={whatsappLink(d.tenant.phone, rentReminder(d.tenant, p, d))} target="_blank" rel="noopener noreferrer">
                      Remind on WhatsApp
                    </a>
                  )}
                  <button className={ghost} onClick={() => onMarkPaid(d.tenant, d.outstanding)}>
                    Mark paid
                  </button>
                </span>
              </li>
            ))}
            {other.map((a, i) => (
              <li key={i} className="flex items-center justify-between gap-3 py-3 text-[14.5px]">
                <span>
                  <span className={`mr-2 inline-block h-2 w-2 rounded-full ${a.level === "urgent" ? "bg-[#e8735a] shadow-[0_0_10px_#e8735a]" : "bg-[#f2c14e] shadow-[0_0_10px_#f2c14e]"}`} />
                  {a.text}
                </span>
                <button className="shrink-0 text-[13px] font-semibold text-brand" onClick={() => onOpen(a.propertyId)}>
                  Open
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      <Apartments report={report} onOpen={onOpen} onAdd={onAdd} />
    </div>
  );
}

function Apartments({ report, onOpen, onAdd }: { report: ReturnType<typeof portfolioReport>; onOpen: (id: string) => void; onAdd: () => void }) {
  return (
    <section>
      <div className="flex items-center justify-between">
        <h2 className="text-[19px] font-bold">Your apartments</h2>
        <button className={primary} onClick={onAdd}>
          Add apartment
        </button>
      </div>
      <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
        {report.properties.map((r) => (
          <button key={r.property.id} onClick={() => onOpen(r.property.id)} className="rounded-[22px] border border-line bg-white p-5 text-left transition-shadow hover:shadow-[0_18px_40px_rgb(20_92_70/0.12)]">
            <div className="flex items-start justify-between gap-3">
              <span>
                <span className="block text-[16.5px] font-bold">{r.property.name}</span>
                <span className="block text-[13px] text-muted">
                  {LAYOUT_LABEL[r.property.layout]} · {areaName(r.property.areaSlug) || "Area not set"}
                </span>
              </span>
              <span className="rounded-full bg-mint px-2.5 py-1 text-[11.5px] font-semibold text-brand">{r.property.arrangement === "leased" ? "Sublet" : "Owned"}</span>
            </div>
            <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-surface">
              <div className="h-full rounded-full bg-fresh" style={{ width: `${r.spaces ? (r.occupied / r.spaces) * 100 : 0}%` }} />
            </div>
            <p className="mt-1.5 text-[12.5px] text-muted">
              {r.occupied}/{r.spaces} spaces let
            </p>
            <dl className="mt-4 grid grid-cols-3 gap-2 text-[12px]">
              <div>
                <dt className="text-muted">Collected</dt>
                <dd className="font-figure text-[14px] font-bold">{aed(r.collected)}</dd>
              </div>
              <div>
                <dt className="text-muted">Costs</dt>
                <dd className="font-figure text-[14px] font-bold">{aed(r.costs)}</dd>
              </div>
              <div>
                <dt className="text-muted">Profit</dt>
                <dd className={`font-figure text-[14px] font-bold ${r.profit < 0 ? "text-[#c2410c]" : "text-brand"}`}>{signed(r.profit)}</dd>
              </div>
            </dl>
          </button>
        ))}
      </div>
    </section>
  );
}

/* ---------- one apartment ---------- */

function PropertyView(props: {
  r: PropertyReport;
  tenants: MTenant[];
  payments: MPayment[];
  allPayments: MPayment[];
  period: string;
  onBack: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onAddTenant: (s: Space, perPerson: number) => void;
  onEditTenant: (t: MTenant) => void;
  onMarkPaid: (t: MTenant, amount: number) => void;
  onPayCost: (kind: PayKind, amount: number, billId: string | null, note: string) => void;
  onLeaseCheque: (c: LeaseCheque, status: "pending" | "cleared") => void;
  onChequeStatus: (paymentId: string, status: "cleared" | "bounced") => void;
  onPhoto: (f: File) => void;
  onPhotoRemove: (url: string) => void;
  onRecord: () => void;
  onDeletePayment: (p: MPayment) => void;
}) {
  const { r } = props;
  const p = r.property;
  const active = props.tenants.filter((t) => t.status === "active");
  const paidFor = (billId: string | null, kind: PayKind) => props.payments.some((x) => x.kind === kind && x.billId === billId && settled(x));
  const listHref = (s: Space) => `/list?type=${s.kind === "studio" ? "studio" : s.kind}&area=${p.areaSlug}&price=${Math.round(s.rentAed / Math.max(1, s.capacity || 1))}`;
  const [uploading, setUploading] = useState(false);

  return (
    <div className="space-y-5">
      <button onClick={props.onBack} className="text-[13.5px] font-semibold text-brand">
        ‹ All apartments
      </button>
      <section className="glow-panel relative overflow-hidden rounded-[28px] p-5 text-white md:p-8">
        {p.photos[0] && (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={p.photos[0]} alt="" className="absolute inset-0 h-full w-full object-cover" />
            <div className="absolute inset-0 bg-[linear-gradient(100deg,rgb(9_29_21/0.95)_0%,rgb(9_29_21/0.82)_55%,rgb(9_29_21/0.5)_100%)]" />
          </>
        )}
        <div className="relative flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-[12px] font-bold uppercase tracking-[0.14em] text-[#8fe3bd]">
              {LAYOUT_LABEL[p.layout]} · {p.arrangement === "leased" ? "Sublet from landlord" : "Owned"}
            </p>
            <h1 className="font-display mt-2 text-[28px] leading-[1.05] md:text-[38px]">{p.name}</h1>
            <p className="mt-1 text-[14px] text-white/65">{[p.building, p.unitNo && `Unit ${p.unitNo}`, areaName(p.areaSlug)].filter(Boolean).join(" · ")}</p>
          </div>
          <div className="flex gap-2">
            <button onClick={props.onEdit} className="h-10 rounded-[12px] border border-white/25 px-4 text-[13.5px] font-semibold hover:bg-white/10">
              Edit
            </button>
            <button onClick={props.onDelete} className="h-10 rounded-[12px] border border-white/15 px-4 text-[13.5px] text-white/70 hover:bg-white/10">
              Delete
            </button>
          </div>
        </div>
        <div className="relative mt-6 grid grid-cols-2 gap-3 md:grid-cols-4">
          <Kpi k="Collected" v={aed(r.collected)} sub={r.pendingCheques ? `+ ${aed(r.pendingCheques)} in cheques` : `of ${aed(r.expected)}`} />
          <Kpi k="Still to collect" v={aed(r.outstanding)} tone={r.outstanding ? "bad" : "good"} />
          <Kpi k="Running costs" v={aed(r.costs)} sub={p.arrangement === "leased" ? `incl. ${aed(leaseMonthly(p))} to landlord` : "bills"} />
          <Kpi k="Profit this month" v={signed(r.profit)} tone={r.profit >= 0 ? "good" : "bad"} sub={`Full house: ${signed(r.potential - r.costs)}`} />
        </div>
      </section>

      <Snapshot r={r} />

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <section className="card p-5">
          <h2 className="text-[17px] font-bold">Spaces and tenants</h2>
          {!p.spaces.length && <p className="mt-3 text-[14px] text-muted">No spaces yet. Edit the apartment to add beds, partitions or rooms.</p>}
          <ul className="mt-3 divide-y divide-line">
            {p.spaces.map((s) => {
              const here = active.filter((x) => x.spaceId === s.id);
              const slot = r.vacant.find((v) => v.space.id === s.id);
              const cap = Math.max(1, s.capacity || 1);
              return (
                <li key={s.id} className="py-3.5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-[14.5px] font-semibold">
                      {s.label} <span className="font-normal text-muted">· {SPACE_LABEL[s.kind]}{cap > 1 ? ` for ${cap}` : ""} · {aed(s.rentAed)}</span>
                    </p>
                    {cap > 1 && <span className="chip">{here.length}/{cap} filled</span>}
                  </div>
                  {here.map((t) => {
                    const due = r.dues.find((d) => d.tenant.id === t.id);
                    return (
                      <div key={t.id} className="mt-2 flex flex-wrap items-center justify-between gap-2 rounded-[14px] bg-surface px-3 py-2">
                        <button className="text-left text-[13.5px] text-ink hover:text-brand" onClick={() => props.onEditTenant(t)}>
                          <b className="font-semibold">{t.name}</b> · {aed(t.rentAed)} · due {t.dueDay}
                          {due && (
                            <span className={`ml-2 rounded-full px-2 py-0.5 text-[11.5px] font-semibold ${due.outstanding === 0 ? "bg-mint text-brand" : due.late ? "bg-[#fde4dc] text-[#b4472c]" : due.pending ? "bg-[#fff3cd] text-[#7a5a00]" : "bg-white text-ink-2"}`}>
                              {due.outstanding === 0 ? "Paid" : due.late ? `Late · ${aed(due.outstanding)}` : due.pending ? "Cheque pending" : `Due ${aed(due.outstanding)}`}
                            </span>
                          )}
                        </button>
                        {due && due.outstanding > 0 && (
                          <span className="flex gap-2">
                            {t.phone && (
                              <a className={ghost} href={whatsappLink(t.phone, rentReminder(t, p, due))} target="_blank" rel="noopener noreferrer">
                                Remind
                              </a>
                            )}
                            <button className={ghost} onClick={() => props.onMarkPaid(t, due.outstanding)}>
                              Mark paid
                            </button>
                          </span>
                        )}
                      </div>
                    );
                  })}
                  {slot && (
                    <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                      <p className="text-[13px] text-[#b4472c]">
                        {here.length ? `Room for ${slot.free} more · ${aed(slot.perPersonAed)} each` : `Empty · asking ${aed(s.rentAed)}${cap > 1 ? ` (${aed(slot.perPersonAed)} each)` : ""}`}
                      </p>
                      <span className="flex gap-2">
                        <button className={ghost} onClick={() => props.onAddTenant(s, slot.perPersonAed)}>
                          Add tenant
                        </button>
                        <Link className={ghost} href={listHref(s)}>
                          List on Stayshay
                        </Link>
                      </span>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </section>

        <div className="space-y-5">
          <section className="card p-5">
            <h2 className="text-[17px] font-bold">Running costs this month</h2>
            <ul className="mt-3 divide-y divide-line text-[14px]">
              {p.arrangement === "leased" && p.lease && (
                <CostRow name={`Rent to ${p.lease.landlord || "landlord"}`} sub={`${aed(p.lease.yearlyRentAed)} a year · ${p.lease.cheques} ${p.lease.cheques === 1 ? "cheque" : "cheques"}`} monthly={leaseMonthly(p)} paid={props.payments.some((x) => x.kind === "lease" && settled(x))} onPay={() => props.onPayCost("lease", leaseMonthly(p), null, "Monthly share of head lease")} />
              )}
              {p.bills.map((b) => (
                <CostRow key={b.id} name={b.label || BILL_LABEL[b.kind]} sub={`${aed(b.amountAed)} ${EVERY_LABEL[b.every]}`} monthly={billMonthly(b)} paid={paidFor(b.id, "bill")} onPay={() => props.onPayCost("bill", billMonthly(b), b.id, b.label || BILL_LABEL[b.kind])} />
              ))}
              {!p.bills.length && p.arrangement !== "leased" && <li className="py-3 text-muted">No costs added. Edit the apartment to add DEWA, Wi-Fi, cleaner and more.</li>}
            </ul>
            <p className="mt-3 flex justify-between border-t border-line pt-3 text-[14px] font-bold">
              <span>Total a month</span> <span className="font-figure">{aed(r.costs)}</span>
            </p>
          </section>

          {r.cheques.length > 0 && (
            <section className="card p-5">
              <h2 className="text-[17px] font-bold">Cheques to the landlord</h2>
              <p className="text-[13px] text-muted">Each cheque covers {r.cheques[0].months} {r.cheques[0].months === 1 ? "month" : "months"}.</p>
              <ul className="mt-3 divide-y divide-line text-[14px]">
                {r.cheques.map((c) => (
                  <li key={c.index} className="flex flex-wrap items-center justify-between gap-2 py-3">
                    <span>
                      <span className="block font-semibold">
                        Cheque {c.index + 1} · {aed(c.amountAed)}
                      </span>
                      <span className="block text-[12.5px] text-muted">
                        Due {shortDay(c.dueDate)} {c.dueDate.slice(0, 4)}
                      </span>
                    </span>
                    {c.status === "cleared" ? (
                      <span className="chip">Cleared</span>
                    ) : c.status === "pending" ? (
                      <span className="flex gap-2">
                        <button className={ghost} onClick={() => props.onChequeStatus(c.paymentId!, "cleared")}>
                          Mark cleared
                        </button>
                        <button className={ghost} onClick={() => props.onChequeStatus(c.paymentId!, "bounced")}>
                          Bounced
                        </button>
                      </span>
                    ) : (
                      <span className="flex gap-2">
                        {c.status === "bounced" && <span className="rounded-full bg-[#fde4dc] px-2 py-0.5 text-[11.5px] font-semibold text-[#b4472c]">Bounced</span>}
                        <button className={ghost} onClick={() => props.onLeaseCheque(c, "pending")}>
                          Given
                        </button>
                        <button className={ghost} onClick={() => props.onLeaseCheque(c, "cleared")}>
                          Cleared
                        </button>
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section className="card p-5">
            <div className="flex items-center justify-between">
              <h2 className="text-[17px] font-bold">Photos</h2>
              <label className={`${ghost} cursor-pointer`}>
                {uploading ? "Uploading" : "Add photos"}
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={async (e) => {
                    const files = [...(e.target.files ?? [])].slice(0, 10);
                    e.target.value = "";
                    setUploading(true);
                    for (const f of files) await props.onPhoto(f);
                    setUploading(false);
                  }}
                />
              </label>
            </div>
            {p.photos.length ? (
              <div className="mt-3 grid grid-cols-3 gap-2">
                {p.photos.map((u) => (
                  <div key={u} className="group relative aspect-square overflow-hidden rounded-[14px] bg-surface">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={u} alt="" className="h-full w-full object-cover" loading="lazy" />
                    <button onClick={() => confirm("Remove this photo?") && props.onPhotoRemove(u)} className="absolute right-1.5 top-1.5 rounded-[8px] bg-white/90 px-2 py-0.5 text-[11.5px] font-semibold text-ink opacity-100 md:opacity-0 md:group-hover:opacity-100">
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-2 text-[13.5px] text-muted">Add photos of the rooms, kitchen and building. They help when you list empty spaces.</p>
            )}
          </section>

          <section className="card p-5">
            <h2 className="text-[17px] font-bold">Details</h2>
            <dl className="mt-3 space-y-2 text-[14px]">
              <Detail k="Permit" v={p.permitNo ? `${p.permitNo}${p.permitExpiry ? ` · expires ${shortDay(p.permitExpiry)} ${p.permitExpiry.slice(0, 4)}` : ""}` : "Not added"} />
              {p.lease && <Detail k="Lease" v={`${p.lease.startDate || "?"} to ${p.lease.endDate || "?"} · deposit ${aed(p.lease.depositAed)}`} />}
              <Detail k="Holds" v={`${r.spaces} ${r.spaces === 1 ? "person" : "people"} · full house ${aed(r.potential)} a month`} />
              {p.notes && <Detail k="Notes" v={p.notes} />}
            </dl>
          </section>
        </div>
      </div>

      <Ledger payments={props.payments} period={props.period} tenants={props.tenants} bills={p.bills} title={`Payments in ${periodLabel(props.period)}`} onRecord={props.onRecord} onDelete={props.onDeletePayment} onChequeStatus={props.onChequeStatus} />
    </div>
  );
}

/** Where the apartment (or the whole portfolio) stands, and how many more tenants it needs. */
function Snapshot({ r }: { r: { spaces: number; occupied: number; toBreakEven: number; toFill: number; pendingCheques: number; expected: number; costs: number } }) {
  const pct = r.spaces ? Math.round((r.occupied / r.spaces) * 100) : 0;
  const items: [string, string, string][] = [
    ["Occupancy", `${pct}%`, `${r.occupied} of ${r.spaces} people`],
    ["To cover costs", r.toBreakEven ? `${r.toBreakEven} more` : "Covered", r.toBreakEven ? `rent ${aed(r.expected)} vs costs ${aed(r.costs)}` : `rent ${aed(r.expected)} covers ${aed(r.costs)}`],
    ["To fill up", r.toFill ? `${r.toFill} more` : "Full", r.toFill ? "tenants until every space is let" : "every space is let"],
    ["Cheques pending", aed(r.pendingCheques), "received, not cleared yet"],
  ];
  return (
    <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
      {items.map(([k, v, sub]) => (
        <div key={k} className="card p-4">
          <p className="text-[12px] font-semibold text-muted">{k}</p>
          <p className="font-figure mt-1 text-[20px] font-bold text-brand md:text-[24px]">{v}</p>
          <p className="mt-0.5 text-[12px] text-muted">{sub}</p>
        </div>
      ))}
    </section>
  );
}

function CostRow({ name, sub, monthly, paid, onPay }: { name: string; sub: string; monthly: number; paid: boolean; onPay: () => void }) {
  return (
    <li className="flex items-center justify-between gap-3 py-3">
      <span className="min-w-0">
        <span className="block font-semibold">{name}</span>
        <span className="block text-[12.5px] text-muted">{sub}</span>
      </span>
      <span className="flex items-center gap-2">
        <span className="font-figure whitespace-nowrap font-semibold">{aed(monthly)}</span>
        {paid ? <span className="chip">Paid</span> : <button className={`${ghost} whitespace-nowrap`} onClick={onPay}>Mark paid</button>}
      </span>
    </li>
  );
}

function Detail({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-muted">{k}</dt>
      <dd className="text-right font-medium">{v}</dd>
    </div>
  );
}

/* ---------- tenants + payments tabs ---------- */

function Tenants({ data, onEdit }: { data: Data; onEdit: (t: MTenant) => void }) {
  const prop = (id: string) => data.properties.find((p) => p.id === id);
  const sorted = [...data.tenants].sort((a, b) => (a.status === b.status ? a.name.localeCompare(b.name) : a.status === "active" ? -1 : 1));
  return (
    <section>
      <h2 className="text-[19px] font-bold">Tenants</h2>
      <p className="mt-1 text-[14px] text-muted">Add a tenant from an empty space in any apartment.</p>
      <ul className="mt-4 divide-y divide-line overflow-hidden rounded-[22px] border border-line bg-white">
        {!sorted.length && <li className="p-5 text-[14px] text-muted">No tenants yet.</li>}
        {sorted.map((t) => {
          const p = prop(t.propertyId);
          const s = p?.spaces.find((x) => x.id === t.spaceId);
          return (
            <li key={t.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5">
              <button className="text-left" onClick={() => onEdit(t)}>
                <span className="block text-[15px] font-semibold">
                  {t.name} {t.status === "left" && <span className="ml-1 rounded-full bg-surface px-2 py-0.5 text-[11.5px] font-medium text-muted">Moved out</span>}
                </span>
                <span className="block text-[13px] text-muted">
                  {p?.name ?? "?"} · {s?.label ?? "space"} · {aed(t.rentAed)} due {t.dueDay} · since {shortDay(t.moveIn)}
                  {t.visaExpiry ? ` · visa to ${t.visaExpiry}` : ""}
                </span>
              </button>
              {t.phone && (
                <a className={ghost} href={whatsappLink(t.phone, `Hi ${t.name.split(" ")[0]}, `)} target="_blank" rel="noopener noreferrer">
                  WhatsApp
                </a>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function Payments({ data, period, onRecord, onDelete, onChequeStatus }: { data: Data; period: string; onRecord: () => void; onDelete: (p: MPayment) => void; onChequeStatus: (id: string, status: "cleared" | "bounced") => void }) {
  const list = data.payments.filter((p) => shareIn(p, period) > 0);
  const csv = () => {
    const prop = (id: string) => data.properties.find((p) => p.id === id)?.name ?? "";
    const ten = (id: string | null) => data.tenants.find((t) => t.id === id)?.name ?? "";
    const rows = [["Date", "From month", "Months", "Apartment", "Type", "Tenant", "Amount AED", "In/Out", "Method", "Cheque no", "Cheque status", "Note"], ...list.map((p) => [p.date, p.period, String(p.months || 1), prop(p.propertyId), PAY_LABEL[p.kind], ten(p.tenantId), String(p.amountAed), PAY_IN.has(p.kind) ? "in" : "out", p.method, p.chequeNo ?? "", p.chequeStatus ?? "", p.note])];
    const blob = new Blob([rows.map((r) => r.map((c) => `"${c.replace(/"/g, '""')}"`).join(",")).join("\n")], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `stayshay-payments-${period}.csv`;
    a.click();
  };
  return (
    <div className="space-y-3">
      <Ledger payments={list} tenants={data.tenants} bills={data.properties.flatMap((p) => p.bills)} properties={data.properties} period={period} title={`All payments in ${periodLabel(period)}`} onRecord={onRecord} onDelete={onDelete} onChequeStatus={onChequeStatus} />
      {list.length > 0 && (
        <button className={ghost} onClick={csv}>
          Download as spreadsheet (CSV)
        </button>
      )}
    </div>
  );
}

function Ledger({ payments, period, tenants, bills, properties, title, onRecord, onDelete, onChequeStatus }: { payments: MPayment[]; period: string; tenants: MTenant[]; bills: Bill[]; properties?: MProperty[]; title: string; onRecord: () => void; onDelete: (p: MPayment) => void; onChequeStatus: (id: string, status: "cleared" | "bounced") => void }) {
  const counted = payments.filter(settled);
  const inn = Math.round(counted.filter((p) => PAY_IN.has(p.kind)).reduce((s, p) => s + shareIn(p, period), 0));
  const out = Math.round(counted.filter((p) => !PAY_IN.has(p.kind)).reduce((s, p) => s + shareIn(p, period), 0));
  return (
    <section className="card p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-[17px] font-bold">{title}</h2>
          <p className="text-[13px] text-muted">
            In {aed(inn)} · Out {aed(out)} · Net <b className={inn - out < 0 ? "text-[#b4472c]" : "text-brand"}>{signed(inn - out)}</b>
          </p>
        </div>
        <button className={primary} onClick={onRecord}>
          Record payment
        </button>
      </div>
      <ul className="mt-3 divide-y divide-line">
        {!payments.length && <li className="py-4 text-[14px] text-muted">Nothing recorded for this month yet.</li>}
        {payments.map((p) => {
          const who = p.tenantId ? tenants.find((t) => t.id === p.tenantId)?.name : p.billId ? bills.find((b) => b.id === p.billId)?.label || BILL_LABEL[bills.find((b) => b.id === p.billId)?.kind ?? "other"] : p.chequeIndex != null ? `Cheque ${p.chequeIndex + 1}` : "";
          const where = properties?.find((x) => x.id === p.propertyId)?.name;
          const isIn = PAY_IN.has(p.kind);
          const months = Math.max(1, p.months || 1);
          const span = months > 1 ? `${periodLabel(p.period).split(" ")[0].slice(0, 3)}–${periodLabel(shiftPeriod(p.period, months - 1)).slice(0, 3)} (${months} months)` : "";
          return (
            <li key={p.id} className="flex flex-wrap items-center justify-between gap-2 py-3 text-[14px]">
              <span className="min-w-0">
                <span className="block font-semibold">
                  {PAY_LABEL[p.kind]}
                  {who ? ` · ${who}` : ""}
                  {p.method === "cheque" && (
                    <span className={`ml-2 rounded-full px-2 py-0.5 text-[11px] font-semibold ${p.chequeStatus === "cleared" ? "bg-mint text-brand" : p.chequeStatus === "bounced" ? "bg-[#fde4dc] text-[#b4472c]" : "bg-[#fff3cd] text-[#7a5a00]"}`}>
                      Cheque {p.chequeNo} {p.chequeStatus === "cleared" ? "cleared" : p.chequeStatus === "bounced" ? "bounced" : "pending"}
                    </span>
                  )}
                </span>
                <span className="block truncate text-[12.5px] text-muted">
                  {shortDay(p.date)} · {p.method}
                  {span ? ` · ${span}` : ""}
                  {where ? ` · ${where}` : ""}
                  {p.note ? ` · ${p.note}` : ""}
                </span>
              </span>
              <span className="flex shrink-0 items-center gap-2">
                {p.method === "cheque" && p.chequeStatus === "pending" && (
                  <>
                    <button className={ghost} onClick={() => onChequeStatus(p.id, "cleared")}>
                      Cleared
                    </button>
                    <button className={ghost} onClick={() => onChequeStatus(p.id, "bounced")}>
                      Bounced
                    </button>
                  </>
                )}
                <span className={`font-figure font-bold ${isIn ? "text-brand" : "text-ink"}`}>
                  {isIn ? "+" : "−"}
                  {aed(p.amountAed)}
                </span>
                <button className="text-[12.5px] text-muted hover:text-[#b4472c]" onClick={() => confirm("Remove this payment?") && onDelete(p)}>
                  Remove
                </button>
              </span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

/* ---------- welcome ---------- */

function Welcome({ name, onAdd }: { name: string; onAdd: () => void }) {
  return (
    <section className="glow-panel overflow-hidden rounded-[28px] p-6 text-white md:p-12">
      <p className="text-[12px] font-bold uppercase tracking-[0.14em] text-[#8fe3bd]">Welcome, {name}</p>
      <h1 className="font-display mt-3 max-w-[640px] text-[32px] leading-[1.05] md:text-[48px]">Run your beds, rooms and partitions from one place.</h1>
      <p className="mt-4 max-w-[560px] text-[15.5px] leading-relaxed text-white/75">Add an apartment, split it into the spaces you rent out, add your tenants and costs. Stayshay shows who has paid, who is late, and what you actually make each month.</p>
      <ol className="mt-6 grid max-w-[760px] grid-cols-1 gap-3 sm:grid-cols-3">
        {["Add the apartment and your rent to the landlord", "Add beds, partitions or rooms with their rent", "Add tenants and mark rent as paid"].map((t, i) => (
          <li key={t} className="rounded-[18px] border border-white/12 bg-white/[0.06] p-4 text-[14px]">
            <span className="font-figure text-[12px] font-bold text-[#8fe3bd]">0{i + 1}</span>
            <span className="mt-1 block">{t}</span>
          </li>
        ))}
      </ol>
      <button onClick={onAdd} className="mt-8 h-13 rounded-[16px] bg-[#6ee7b7] px-7 py-3.5 text-[16px] font-bold text-brand-deep">
        Add my first apartment
      </button>
    </section>
  );
}

/* ---------- forms ---------- */

function SheetFrame({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-[rgb(5_11_8/0.55)] backdrop-blur-sm md:items-center" onClick={onClose}>
      <div className="max-h-[92vh] w-full overflow-y-auto rounded-t-[28px] bg-white p-5 md:max-w-[640px] md:rounded-[28px] md:p-7" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-label={title}>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-[20px] font-bold">{title}</h2>
          <button onClick={onClose} className="h-9 rounded-[12px] px-3 text-[13.5px] font-semibold text-muted hover:bg-surface">
            Close
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function starterProperty(): Partial<MProperty> {
  return {
    name: "",
    layout: "2bhk",
    arrangement: "leased",
    lease: { landlord: "", yearlyRentAed: 0, cheques: 4, startDate: "", endDate: "", depositAed: 0 },
    spaces: [],
    bills: [
      { id: tmpId(), kind: "dewa", label: "DEWA", amountAed: 0, every: "month" },
      { id: tmpId(), kind: "wifi", label: "Wi-Fi", amountAed: 0, every: "month" },
      { id: tmpId(), kind: "cleaner", label: "Cleaner", amountAed: 0, every: "month" },
    ],
  };
}

function PropertyForm({ initial, onSave }: { initial: Partial<MProperty>; onSave: (p: Partial<MProperty>) => void }) {
  const [p, setP] = useState<Partial<MProperty>>(initial);
  const [busy, setBusy] = useState(false);
  const set = <K extends keyof MProperty>(k: K, v: MProperty[K]) => setP((x) => ({ ...x, [k]: v }));
  const lease = p.lease ?? { landlord: "", yearlyRentAed: 0, cheques: 4, startDate: "", endDate: "", depositAed: 0 };
  const setLease = (k: keyof typeof lease, v: string | number) => set("lease", { ...lease, [k]: v });
  const spaces = p.spaces ?? [];
  const bills = p.bills ?? [];
  const addSpaces = (kind: SpaceKind, n: number, rent: number, capacity = 1) => {
    const count = (k: SpaceKind) => spaces.filter((s) => s.kind === k).length;
    const name = { bed_space: "Bed", partition: "Partition", room: "Room", studio: "Unit" }[kind];
    set("spaces", [...spaces, ...Array.from({ length: n }, (_, i) => ({ id: tmpId(), label: `${name} ${count(kind) + i + 1}`, kind, rentAed: rent, capacity }))]);
  };
  const full = spaces.reduce((s, x) => s + Number(x.rentAed || 0), 0);
  const cost = (p.arrangement === "leased" ? Number(lease.yearlyRentAed || 0) / 12 : 0) + bills.reduce((s, b) => s + billMonthly({ ...b, amountAed: Number(b.amountAed || 0) }), 0);

  return (
    <form
      className="space-y-5"
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        await onSave(p);
        setBusy(false);
      }}
    >
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <label className="sm:col-span-2">
          <span className={label}>Name</span>
          <input className={field} required placeholder="e.g. Al Rigga 2BHK, Flat 504" value={p.name ?? ""} onChange={(e) => set("name", e.target.value)} />
        </label>
        <label>
          <span className={label}>Area</span>
          <select className={field} value={p.areaSlug ?? ""} onChange={(e) => set("areaSlug", e.target.value)}>
            <option value="">Choose area</option>
            {[...AREAS].sort((a, b) => a.name.localeCompare(b.name)).map((a) => (
              <option key={a.slug} value={a.slug}>
                {a.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span className={label}>Layout</span>
          <select className={field} value={p.layout ?? "2bhk"} onChange={(e) => set("layout", e.target.value as Layout)}>
            {Object.entries(LAYOUT_LABEL).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span className={label}>Building</span>
          <input className={field} value={p.building ?? ""} onChange={(e) => set("building", e.target.value)} />
        </label>
        <label>
          <span className={label}>Unit number</span>
          <input className={field} value={p.unitNo ?? ""} onChange={(e) => set("unitNo", e.target.value)} />
        </label>
      </div>

      <fieldset>
        <legend className={label}>How do you hold this apartment?</legend>
        <div className="mt-2 grid grid-cols-2 gap-2">
          {(
            [
              ["leased", "I rent it and sublet", "You pay a landlord and rent out beds or rooms"],
              ["owned", "I own it", "No rent to a landlord"],
            ] as const
          ).map(([v, t, d]) => (
            <button type="button" key={v} aria-pressed={p.arrangement === v} onClick={() => set("arrangement", v)} className={`rounded-[16px] border p-3.5 text-left ${p.arrangement === v ? "border-brand bg-mint" : "border-line"}`}>
              <span className="block text-[14px] font-semibold">{t}</span>
              <span className="block text-[12px] text-muted">{d}</span>
            </button>
          ))}
        </div>
      </fieldset>

      {p.arrangement === "leased" && (
        <div className="grid grid-cols-2 gap-3 rounded-[18px] bg-surface p-4">
          <p className="col-span-2 text-[13.5px] font-bold">Your contract with the landlord</p>
          <label>
            <span className={label}>Landlord</span>
            <input className={field} value={lease.landlord} onChange={(e) => setLease("landlord", e.target.value)} />
          </label>
          <label>
            <span className={label}>Yearly rent (AED)</span>
            <input className={field} inputMode="numeric" value={lease.yearlyRentAed || ""} onChange={(e) => setLease("yearlyRentAed", Number(e.target.value.replace(/\D/g, "")))} />
          </label>
          <label>
            <span className={label}>Cheques</span>
            <input className={field} inputMode="numeric" value={lease.cheques || ""} onChange={(e) => setLease("cheques", Number(e.target.value.replace(/\D/g, "")))} />
          </label>
          <label>
            <span className={label}>Deposit (AED)</span>
            <input className={field} inputMode="numeric" value={lease.depositAed || ""} onChange={(e) => setLease("depositAed", Number(e.target.value.replace(/\D/g, "")))} />
          </label>
          <label>
            <span className={label}>Starts</span>
            <input className={field} type="date" value={lease.startDate} onChange={(e) => setLease("startDate", e.target.value)} />
          </label>
          <label>
            <span className={label}>Ends</span>
            <input className={field} type="date" value={lease.endDate} onChange={(e) => setLease("endDate", e.target.value)} />
          </label>
        </div>
      )}

      <div>
        <p className={label}>Spaces you rent out</p>
        <p className="text-[12px] text-muted">Rent is for the whole space; the last box is how many people share it. The rent splits between them.</p>
        <div className="mt-2 flex flex-wrap gap-2">
          <button type="button" className={ghost} onClick={() => addSpaces("bed_space", 1, 800)}>
            Add a bed
          </button>
          <button type="button" className={ghost} onClick={() => addSpaces("bed_space", 4, 800)}>
            Add 4 beds
          </button>
          <button type="button" className={ghost} onClick={() => addSpaces("partition", 1, 1500)}>
            Add a partition
          </button>
          <button type="button" className={ghost} onClick={() => addSpaces("partition", 1, 1800, 2)}>
            Partition for 2
          </button>
          <button type="button" className={ghost} onClick={() => addSpaces("room", 1, 2500)}>
            Add a room
          </button>
          <button type="button" className={ghost} onClick={() => addSpaces("room", 1, 2700, 3)}>
            Shared room for 3
          </button>
          <button type="button" className={ghost} onClick={() => addSpaces("studio", 1, 4000)}>
            Whole unit
          </button>
        </div>
        <ul className="mt-3 space-y-2">
          {spaces.map((s, i) => (
            <li key={s.id} className="grid grid-cols-[minmax(0,1fr)_92px_64px_auto] items-center gap-2">
              <input className={field} value={s.label} onChange={(e) => set("spaces", spaces.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)))} aria-label="Space name" />
              <input className={field} inputMode="numeric" value={s.rentAed || ""} placeholder="Rent" onChange={(e) => set("spaces", spaces.map((x, j) => (j === i ? { ...x, rentAed: Number(e.target.value.replace(/\D/g, "")) } : x)))} aria-label="Monthly rent for the whole space" />
              <select className={field} value={s.capacity || 1} onChange={(e) => set("spaces", spaces.map((x, j) => (j === i ? { ...x, capacity: Number(e.target.value) } : x)))} aria-label="People">
                {[1, 2, 3, 4, 5, 6].map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
              <button type="button" className="h-11 px-2 text-[13px] text-muted hover:text-[#b4472c]" onClick={() => set("spaces", spaces.filter((_, j) => j !== i))}>
                Remove
              </button>
            </li>
          ))}
        </ul>
      </div>

      <div>
        <p className={label}>Bills and running costs</p>
        <ul className="mt-2 space-y-2">
          {bills.map((b, i) => (
            <li key={b.id} className="grid grid-cols-[minmax(0,1fr)_100px_110px_auto] items-center gap-2">
              <select className={field} value={b.kind} onChange={(e) => set("bills", bills.map((x, j) => (j === i ? { ...x, kind: e.target.value as BillKind, label: BILL_LABEL[e.target.value as BillKind] } : x)))} aria-label="Cost type">
                {Object.entries(BILL_LABEL).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </select>
              <input className={field} inputMode="numeric" placeholder="AED" value={b.amountAed || ""} onChange={(e) => set("bills", bills.map((x, j) => (j === i ? { ...x, amountAed: Number(e.target.value.replace(/\D/g, "")) } : x)))} aria-label="Amount" />
              <select className={field} value={b.every} onChange={(e) => set("bills", bills.map((x, j) => (j === i ? { ...x, every: e.target.value as Every } : x)))} aria-label="How often">
                {Object.entries(EVERY_LABEL).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </select>
              <button type="button" className="h-11 px-2 text-[13px] text-muted hover:text-[#b4472c]" onClick={() => set("bills", bills.filter((_, j) => j !== i))}>
                Remove
              </button>
            </li>
          ))}
        </ul>
        <button type="button" className={`${ghost} mt-2`} onClick={() => set("bills", [...bills, { id: tmpId(), kind: "other", label: "", amountAed: 0, every: "month" }])}>
          Add a cost
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <label>
          <span className={label}>Permit number</span>
          <input className={field} value={p.permitNo ?? ""} onChange={(e) => set("permitNo", e.target.value)} />
        </label>
        <label>
          <span className={label}>Permit expiry</span>
          <input className={field} type="date" value={p.permitExpiry ?? ""} onChange={(e) => set("permitExpiry", e.target.value || null)} />
        </label>
        <label className="col-span-2">
          <span className={label}>Notes</span>
          <textarea className={`${field} min-h-[72px]`} value={p.notes ?? ""} onChange={(e) => set("notes", e.target.value)} />
        </label>
      </div>

      <div className="sticky bottom-0 -mx-5 flex items-center justify-between gap-3 border-t border-line bg-white px-5 py-4 md:-mx-7 md:px-7">
        <p className="text-[13px] text-muted">
          Full house {aed(full)} · costs {aed(cost)} · <b className={full - cost < 0 ? "text-[#b4472c]" : "text-brand"}>margin {signed(full - cost)}</b>
        </p>
        <button disabled={busy} className={`${primary} disabled:opacity-60`}>
          {busy ? "Saving" : "Save"}
        </button>
      </div>
    </form>
  );
}

function TenantForm({ initial, properties, tenants, onSave, onDelete }: { initial: Partial<MTenant>; properties: MProperty[]; tenants: MTenant[]; onSave: (t: Partial<MTenant>) => void; onDelete?: () => void }) {
  const [t, setT] = useState<Partial<MTenant>>(initial);
  const set = <K extends keyof MTenant>(k: K, v: MTenant[K]) => setT((x) => ({ ...x, [k]: v }));
  const prop = properties.find((p) => p.id === t.propertyId);
  const used = (spaceId: string) => tenants.filter((x) => x.status === "active" && x.id !== t.id && x.spaceId === spaceId).length;
  const taken = new Set((prop?.spaces ?? []).filter((sp) => used(sp.id) >= Math.max(1, sp.capacity || 1)).map((sp) => sp.id));
  return (
    <form
      className="grid grid-cols-2 gap-3"
      onSubmit={(e) => {
        e.preventDefault();
        onSave(t);
      }}
    >
      <label className="col-span-2">
        <span className={label}>Name</span>
        <input className={field} required value={t.name ?? ""} onChange={(e) => set("name", e.target.value)} />
      </label>
      <label>
        <span className={label}>WhatsApp</span>
        <input className={field} inputMode="tel" placeholder="05x xxx xxxx" value={t.phone ?? ""} onChange={(e) => set("phone", e.target.value)} />
      </label>
      <label>
        <span className={label}>Nationality</span>
        <input className={field} value={t.nationality ?? ""} onChange={(e) => set("nationality", e.target.value)} />
      </label>
      <label>
        <span className={label}>Apartment</span>
        <select className={field} value={t.propertyId ?? ""} onChange={(e) => set("propertyId", e.target.value)}>
          {properties.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </label>
      <label>
        <span className={label}>Space</span>
        <select className={field} value={t.spaceId ?? ""} onChange={(e) => set("spaceId", e.target.value)}>
          <option value="">Choose</option>
          {prop?.spaces.map((s) => (
            <option key={s.id} value={s.id} disabled={taken.has(s.id)}>
              {s.label}
              {(s.capacity || 1) > 1 ? ` (${used(s.id)}/${s.capacity})` : ""}
              {taken.has(s.id) ? " full" : ""}
            </option>
          ))}
        </select>
      </label>
      <label>
        <span className={label}>Monthly rent (AED)</span>
        <input className={field} inputMode="numeric" value={t.rentAed || ""} onChange={(e) => set("rentAed", Number(e.target.value.replace(/\D/g, "")))} />
      </label>
      <label>
        <span className={label}>Deposit (AED)</span>
        <input className={field} inputMode="numeric" value={t.depositAed || ""} onChange={(e) => set("depositAed", Number(e.target.value.replace(/\D/g, "")))} />
      </label>
      <label>
        <span className={label}>Rent due on day</span>
        <input className={field} inputMode="numeric" value={t.dueDay || ""} onChange={(e) => set("dueDay", Math.min(28, Number(e.target.value.replace(/\D/g, "")) || 1))} />
      </label>
      <label>
        <span className={label}>Visa expiry (optional)</span>
        <input className={field} type="date" value={t.visaExpiry ?? ""} onChange={(e) => set("visaExpiry", e.target.value || null)} />
      </label>
      <label>
        <span className={label}>Moved in</span>
        <input className={field} type="date" required value={t.moveIn ?? ""} onChange={(e) => set("moveIn", e.target.value)} />
      </label>
      <label>
        <span className={label}>Moved out</span>
        <input
          className={field}
          type="date"
          value={t.moveOut ?? ""}
          onChange={(e) => setT((x) => ({ ...x, moveOut: e.target.value || null, status: e.target.value ? "left" : "active" }))}
        />
      </label>
      <label className="col-span-2">
        <span className={label}>Notes</span>
        <textarea className={`${field} min-h-[64px]`} value={t.notes ?? ""} onChange={(e) => set("notes", e.target.value)} />
      </label>
      <p className="col-span-2 text-[12px] text-muted">Keep copies of IDs and contracts in your own records. Stayshay doesn't store ID documents.</p>
      <div className="col-span-2 flex justify-between gap-3">
        {onDelete ? (
          <button type="button" onClick={onDelete} className="text-[13.5px] text-muted hover:text-[#b4472c]">
            Delete tenant
          </button>
        ) : (
          <span />
        )}
        <button className={primary}>Save tenant</button>
      </div>
    </form>
  );
}

function PaymentForm({ initial, data, onSave }: { initial: Partial<MPayment>; data: Data; onSave: (p: Partial<MPayment>) => void }) {
  const [p, setP] = useState<Partial<MPayment>>(initial);
  const set = <K extends keyof MPayment>(k: K, v: MPayment[K]) => setP((x) => ({ ...x, [k]: v }));
  const prop = data.properties.find((x) => x.id === p.propertyId);
  const tenants = data.tenants.filter((t) => t.propertyId === p.propertyId);
  const needsTenant = p.kind === "rent" || p.kind === "deposit_in" || p.kind === "deposit_out";
  return (
    <form
      className="grid grid-cols-2 gap-3"
      onSubmit={(e) => {
        e.preventDefault();
        onSave(p);
      }}
    >
      <label className="col-span-2">
        <span className={label}>Type</span>
        <select className={field} value={p.kind} onChange={(e) => set("kind", e.target.value as PayKind)}>
          {Object.entries(PAY_LABEL).map(([k, v]) => (
            <option key={k} value={k}>
              {v}
            </option>
          ))}
        </select>
      </label>
      <label>
        <span className={label}>Apartment</span>
        <select className={field} value={p.propertyId ?? ""} onChange={(e) => setP((x) => ({ ...x, propertyId: e.target.value, tenantId: null, billId: null }))}>
          {data.properties.map((x) => (
            <option key={x.id} value={x.id}>
              {x.name}
            </option>
          ))}
        </select>
      </label>
      {needsTenant ? (
        <label>
          <span className={label}>Tenant</span>
          <select
            className={field}
            value={p.tenantId ?? ""}
            onChange={(e) => {
              const t = tenants.find((x) => x.id === e.target.value);
              setP((x) => ({ ...x, tenantId: e.target.value || null, amountAed: x.amountAed || (t ? (p.kind === "rent" ? t.rentAed * (x.months ?? 1) : t.depositAed) : 0) }));
            }}
          >
            <option value="">Choose</option>
            {tenants.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </label>
      ) : p.kind === "bill" ? (
        <label>
          <span className={label}>Bill</span>
          <select
            className={field}
            value={p.billId ?? ""}
            onChange={(e) => {
              const b = prop?.bills.find((x) => x.id === e.target.value);
              setP((x) => ({ ...x, billId: e.target.value || null, amountAed: x.amountAed || (b ? b.amountAed : 0) }));
            }}
          >
            <option value="">Choose</option>
            {prop?.bills.map((b) => (
              <option key={b.id} value={b.id}>
                {b.label || BILL_LABEL[b.kind]}
              </option>
            ))}
          </select>
        </label>
      ) : (
        <span />
      )}
      <label>
        <span className={label}>Amount (AED)</span>
        <input className={field} required inputMode="numeric" value={p.amountAed || ""} onChange={(e) => set("amountAed", Number(e.target.value.replace(/\D/g, "")))} />
      </label>
      <label>
        <span className={label}>Paid on</span>
        <input className={field} type="date" required value={p.date ?? ""} onChange={(e) => set("date", e.target.value)} />
      </label>
      <label>
        <span className={label}>For month</span>
        <input className={field} type="month" value={p.period ?? ""} onChange={(e) => set("period", e.target.value)} />
      </label>
      <label>
        <span className={label}>Method</span>
        <select className={field} value={p.method} onChange={(e) => set("method", e.target.value as PayMethod)}>
          {(["cash", "transfer", "cheque", "card"] as PayMethod[]).map((m) => (
            <option key={m} value={m}>
              {m[0].toUpperCase() + m.slice(1)}
            </option>
          ))}
        </select>
      </label>
      <label>
        <span className={label}>Covers how many months</span>
        <select className={field} value={p.months ?? 1} onChange={(e) => set("months", Number(e.target.value))}>
          {[1, 2, 3, 4, 6, 12].map((n) => (
            <option key={n} value={n}>
              {n === 1 ? "1 month" : `${n} months`}
            </option>
          ))}
        </select>
      </label>
      {p.method === "cheque" ? (
        <>
          <label>
            <span className={label}>Cheque number</span>
            <input className={field} value={p.chequeNo ?? ""} onChange={(e) => set("chequeNo", e.target.value)} />
          </label>
          <label className="col-span-2">
            <span className={label}>Cheque status</span>
            <select className={field} value={p.chequeStatus ?? "pending"} onChange={(e) => set("chequeStatus", e.target.value as "pending" | "cleared")}>
              <option value="pending">Received, not cleared yet</option>
              <option value="cleared">Cleared</option>
            </select>
          </label>
        </>
      ) : (
        <span />
      )}
      {(p.months ?? 1) > 1 && !!p.amountAed && <p className="col-span-2 text-[12.5px] text-muted">Counts as {aed(Math.round(p.amountAed / (p.months ?? 1)))} a month for {p.months} months.</p>}
      <label className="col-span-2">
        <span className={label}>Note</span>
        <input className={field} value={p.note ?? ""} onChange={(e) => set("note", e.target.value)} />
      </label>
      <div className="col-span-2 flex justify-end">
        <button className={primary}>Save payment</button>
      </div>
    </form>
  );
}
