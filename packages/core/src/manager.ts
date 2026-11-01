/**
 * Stayshay Manager: the owner's side. An owner (or a main tenant who sublets) has properties; each property
 * has rentable spaces (beds, partitions, rooms), running costs (the head lease, DEWA, Wi-Fi, cleaner...),
 * tenants and a payment ledger. Everything here is pure so web, app and tests share the same numbers.
 */

export type Layout = "studio" | "1bhk" | "2bhk" | "3bhk" | "4bhk" | "villa";
export type SpaceKind = "bed_space" | "partition" | "room" | "studio";
export type BillKind = "dewa" | "wifi" | "gas" | "chiller" | "cleaner" | "maintenance" | "service" | "other";
export type Every = "month" | "quarter" | "year";
export type PayKind = "rent" | "deposit_in" | "deposit_out" | "lease" | "bill" | "other_in" | "other_out";
export type PayMethod = "cash" | "transfer" | "cheque" | "card";

export const LAYOUT_LABEL: Record<Layout, string> = { studio: "Studio", "1bhk": "1 BHK", "2bhk": "2 BHK", "3bhk": "3 BHK", "4bhk": "4 BHK", villa: "Villa" };
export const SPACE_LABEL: Record<SpaceKind, string> = { bed_space: "Bed space", partition: "Partition", room: "Room", studio: "Whole unit" };
export const BILL_LABEL: Record<BillKind, string> = { dewa: "DEWA", wifi: "Wi-Fi", gas: "Gas", chiller: "Chiller / A/C", cleaner: "Cleaner", maintenance: "Maintenance", service: "Service charge", other: "Other" };
export const EVERY_LABEL: Record<Every, string> = { month: "monthly", quarter: "quarterly", year: "yearly" };
export const PAY_LABEL: Record<PayKind, string> = {
  rent: "Rent received",
  deposit_in: "Deposit received",
  deposit_out: "Deposit returned",
  lease: "Rent paid to landlord",
  bill: "Bill paid",
  other_in: "Other income",
  other_out: "Other expense",
};
export const PAY_IN: ReadonlySet<PayKind> = new Set(["rent", "deposit_in", "other_in"]);

export interface Space {
  id: string;
  label: string;
  kind: SpaceKind;
  /** Asking rent for the whole space per month. Shared by its tenants when more than one live there. */
  rentAed: number;
  /** How many people can live in it (a partition for a couple = 2, a room with 3 beds = 3). */
  capacity: number;
}

export interface Bill {
  id: string;
  kind: BillKind;
  label: string;
  amountAed: number;
  every: Every;
}

/** The main tenant's own contract with the landlord, when the owner sublets a flat they rent. */
export interface HeadLease {
  landlord: string;
  /** Total rent for the contract year. */
  yearlyRentAed: number;
  cheques: number;
  startDate: string;
  endDate: string;
  depositAed: number;
}

export interface MProperty {
  id: string;
  ownerId: string;
  name: string;
  areaSlug: string;
  building: string;
  unitNo: string;
  layout: Layout;
  /** "leased": the owner rents the flat and sublets spaces (the usual Dubai bed-space side business). */
  arrangement: "owned" | "leased";
  lease: HeadLease | null;
  permitNo: string;
  permitExpiry: string | null;
  spaces: Space[];
  bills: Bill[];
  /** Photos of the apartment (served from Stayshay's media store). */
  photos: string[];
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface MTenant {
  id: string;
  ownerId: string;
  propertyId: string;
  spaceId: string;
  name: string;
  phone: string;
  nationality: string;
  visaExpiry: string | null;
  moveIn: string;
  moveOut: string | null;
  rentAed: number;
  depositAed: number;
  /** Day of the month rent is due (1–28). */
  dueDay: number;
  status: "active" | "left";
  notes: string;
  createdAt: string;
}

export interface MPayment {
  id: string;
  ownerId: string;
  propertyId: string;
  kind: PayKind;
  tenantId: string | null;
  billId: string | null;
  /** First month the payment is for, YYYY-MM. */
  period: string;
  /** How many months it covers (a 3-month cheque = 3). The amount is spread evenly over them. */
  months: number;
  amountAed: number;
  date: string;
  method: PayMethod;
  chequeNo: string;
  /** Cheques count only once cleared. Pending ones are shown separately; bounced ones are ignored. */
  chequeStatus: "pending" | "cleared" | "bounced" | null;
  /** Which head-lease cheque this pays (0-based), for the landlord cheque schedule. */
  chequeIndex: number | null;
  note: string;
  createdAt: string;
}

/* ---------- dates ---------- */

export const periodOf = (iso: string) => iso.slice(0, 7);
export function shiftPeriod(period: string, by: number): string {
  const [y, m] = period.split("-").map(Number);
  const d = new Date(Date.UTC(y, m - 1 + by, 1));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}
export function periodLabel(period: string): string {
  const [y, m] = period.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, 1)).toLocaleDateString("en-GB", { month: "long", year: "numeric", timeZone: "UTC" });
}
/** "1 Nov" style date for alerts and reminders. */
export const shortDay = (iso: string) => new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "UTC" });
const daysBetween = (a: string, b: string) => Math.round((Date.parse(`${b}T00:00:00Z`) - Date.parse(`${a}T00:00:00Z`)) / 86_400_000);

/** A tenant owes rent for a month when they lived there for any part of it. */
export function tenantActiveIn(t: MTenant, period: string): boolean {
  if (periodOf(t.moveIn) > period) return false;
  if (t.moveOut && periodOf(t.moveOut) < period) return false;
  return t.status === "active" || !!t.moveOut;
}

/* ---------- money ---------- */

const PER_MONTH: Record<Every, number> = { month: 1, quarter: 1 / 3, year: 1 / 12 };

export const billMonthly = (b: Bill) => Math.round(b.amountAed * PER_MONTH[b.every]);
export const leaseMonthly = (p: MProperty) => (p.arrangement === "leased" && p.lease ? Math.round(p.lease.yearlyRentAed / 12) : 0);
/** What the property costs to run each month: head-lease rent plus bills, spread evenly. */
export const monthlyCost = (p: MProperty) => leaseMonthly(p) + p.bills.reduce((s, b) => s + billMonthly(b), 0);

/* ---------- payments over several months, cheques ---------- */

/** Share of a payment that falls in a month (0 when it doesn't cover it). */
export function shareIn(x: MPayment, period: string): number {
  const months = Math.max(1, x.months || 1);
  for (let i = 0; i < months; i++) if (shiftPeriod(x.period, i) === period) return x.amountAed / months;
  return 0;
}
/** Money that has actually arrived (cash, transfer, card, or a cleared cheque). */
export const settled = (x: MPayment) => x.method !== "cheque" || x.chequeStatus === "cleared";

export interface LeaseCheque {
  index: number;
  dueDate: string;
  amountAed: number;
  months: number;
  status: "due" | "pending" | "cleared" | "bounced";
  paymentId: string | null;
}

/** The landlord cheque schedule: the yearly rent split into equal cheques from the lease start. */
export function leaseCheques(p: MProperty, payments: MPayment[]): LeaseCheque[] {
  const l = p.lease;
  if (p.arrangement !== "leased" || !l || !l.startDate || !l.cheques) return [];
  const n = Math.min(12, Math.max(1, l.cheques));
  const months = Math.max(1, Math.round(12 / n));
  return Array.from({ length: n }, (_, i) => {
    const pay = payments.find((x) => x.propertyId === p.id && x.kind === "lease" && x.chequeIndex === i && x.chequeStatus !== "bounced") ?? payments.find((x) => x.propertyId === p.id && x.kind === "lease" && x.chequeIndex === i);
    const d = new Date(`${l.startDate}T00:00:00Z`);
    d.setUTCMonth(d.getUTCMonth() + i * months);
    return {
      index: i,
      dueDate: d.toISOString().slice(0, 10),
      amountAed: Math.round(l.yearlyRentAed / n),
      months,
      status: pay ? (pay.chequeStatus === "pending" ? "pending" : pay.chequeStatus === "bounced" ? "bounced" : "cleared") : "due",
      paymentId: pay?.id ?? null,
    };
  });
}

/* ---------- reports ---------- */

export interface TenantDue {
  tenant: MTenant;
  space: Space | undefined;
  due: number;
  paid: number;
  /** Cheques received for this month that haven't cleared yet. */
  pending: number;
  outstanding: number;
  dueDate: string;
  /** Past the due date and not fully paid (pending cheques don't count). */
  late: boolean;
}

export type AlertLevel = "urgent" | "soon";
export interface Alert {
  level: AlertLevel;
  propertyId: string;
  text: string;
}

export interface FreeSlot {
  space: Space;
  /** People who could still move in. */
  free: number;
  /** Rent the space is missing compared with its asking rent. */
  missingAed: number;
  /** Suggested rent per new person. */
  perPersonAed: number;
}

export interface PropertyReport {
  property: MProperty;
  period: string;
  /** Total people the apartment can hold. */
  spaces: number;
  /** People living there now. */
  occupied: number;
  vacant: FreeSlot[];
  /** Rent the owner should receive this month from tenants. */
  expected: number;
  collected: number;
  /** Tenant cheques for this month still waiting to clear. */
  pendingCheques: number;
  outstanding: number;
  /** Rent if every space were let at its asking rent. */
  potential: number;
  costs: number;
  paidOut: number;
  /** expected − costs: what the month is worth if everyone pays. */
  profit: number;
  /** collected − paid out so far. */
  cash: number;
  /** More tenants needed to cover running costs (0 when already covered). */
  toBreakEven: number;
  /** More tenants needed to fill every space. */
  toFill: number;
  dues: TenantDue[];
  cheques: LeaseCheque[];
  alerts: Alert[];
}

export function propertyReport(p: MProperty, tenants: MTenant[], payments: MPayment[], period: string, today: string): PropertyReport {
  const mine = tenants.filter((t) => t.propertyId === p.id);
  const live = mine.filter((t) => tenantActiveIn(t, period));
  const pays = payments.filter((x) => x.propertyId === p.id && shareIn(x, period) > 0);
  const active = mine.filter((t) => t.status === "active");

  const dues: TenantDue[] = live.map((t) => {
    const mineP = pays.filter((x) => x.kind === "rent" && x.tenantId === t.id);
    const paid = Math.round(mineP.filter(settled).reduce((s, x) => s + shareIn(x, period), 0));
    const pending = Math.round(mineP.filter((x) => x.method === "cheque" && x.chequeStatus === "pending").reduce((s, x) => s + shareIn(x, period), 0));
    const dueDate = `${period}-${String(Math.min(Math.max(t.dueDay, 1), 28)).padStart(2, "0")}`;
    const outstanding = Math.max(0, t.rentAed - paid);
    return { tenant: t, space: p.spaces.find((s) => s.id === t.spaceId), due: t.rentAed, paid, pending, outstanding, dueDate, late: outstanding - pending > 0 && today > dueDate };
  });

  const vacant: FreeSlot[] = p.spaces
    .map((s) => {
      const here = active.filter((t) => t.spaceId === s.id);
      const cap = Math.max(1, s.capacity || 1);
      const free = Math.max(0, cap - here.length);
      const missingAed = free ? Math.max(0, s.rentAed - here.reduce((x, t) => x + t.rentAed, 0)) : 0;
      return { space: s, free, missingAed, perPersonAed: Math.round(s.rentAed / cap) };
    })
    .filter((v) => v.free > 0);

  const expected = dues.reduce((s, d) => s + d.due, 0);
  const collected = Math.round(pays.filter((x) => x.kind === "rent" && settled(x)).reduce((s, x) => s + shareIn(x, period), 0));
  const pendingCheques = dues.reduce((s, d) => s + d.pending, 0);
  const paidOut = Math.round(pays.filter((x) => !PAY_IN.has(x.kind) && x.kind !== "deposit_out" && settled(x)).reduce((s, x) => s + shareIn(x, period), 0));
  const costs = monthlyCost(p);
  const capacity = p.spaces.reduce((s, x) => s + Math.max(1, x.capacity || 1), 0);
  const toFill = vacant.reduce((s, v) => s + v.free, 0);
  const gap = Math.max(0, costs - expected);
  const freeRents = vacant.flatMap((v) => Array.from({ length: v.free }, () => v.perPersonAed)).sort((a, b) => b - a);
  let toBreakEven = 0;
  for (let covered = 0; covered < gap && toBreakEven < freeRents.length; toBreakEven++) covered += freeRents[toBreakEven];
  if (gap > 0 && freeRents.reduce((s, r) => s + r, 0) < gap) toBreakEven = freeRents.length + 1;

  const cheques = leaseCheques(p, payments);
  const alerts: Alert[] = [];
  const daysTo = (date: string | null | undefined) => (date ? daysBetween(today, date) : null);
  const permitDays = daysTo(p.permitExpiry);
  if (!p.permitNo) alerts.push({ level: "soon", propertyId: p.id, text: `${p.name}: add the shared-housing permit number` });
  else if (permitDays != null && permitDays < 0) alerts.push({ level: "urgent", propertyId: p.id, text: `${p.name}: permit expired ${-permitDays} days ago` });
  else if (permitDays != null && permitDays <= 60) alerts.push({ level: "soon", propertyId: p.id, text: `${p.name}: permit expires in ${permitDays} days` });
  const leaseDays = daysTo(p.lease?.endDate);
  if (p.arrangement === "leased" && leaseDays != null && leaseDays <= 60)
    alerts.push({ level: leaseDays < 0 ? "urgent" : "soon", propertyId: p.id, text: leaseDays < 0 ? `${p.name}: your lease with the landlord ended` : `${p.name}: lease with the landlord ends in ${leaseDays} days` });
  for (const c of cheques) {
    const d = daysBetween(today, c.dueDate);
    if (c.status === "bounced") alerts.push({ level: "urgent", propertyId: p.id, text: `${p.name}: landlord cheque ${c.index + 1} bounced` });
    else if (c.status === "due" && d <= 14 && d >= -60) alerts.push({ level: d < 0 ? "urgent" : "soon", propertyId: p.id, text: `${p.name}: landlord cheque ${c.index + 1} (AED ${c.amountAed.toLocaleString("en-US")}) ${d < 0 ? "is overdue" : `due ${shortDay(c.dueDate)}`}` });
  }
  for (const x of payments.filter((y) => y.propertyId === p.id && y.kind === "rent" && y.chequeStatus === "bounced" && shareIn(y, period) > 0)) {
    const t = mine.find((y) => y.id === x.tenantId);
    alerts.push({ level: "urgent", propertyId: p.id, text: `${t?.name ?? "A tenant"}'s cheque${x.chequeNo ? ` ${x.chequeNo}` : ""} bounced` });
  }
  for (const t of active) {
    const v = daysTo(t.visaExpiry);
    if (v != null && v <= 30) alerts.push({ level: v < 0 ? "urgent" : "soon", propertyId: p.id, text: v < 0 ? `${t.name}: visa expired` : `${t.name}: visa expires in ${v} days` });
  }
  for (const d of dues.filter((x) => x.late)) alerts.push({ level: "urgent", propertyId: p.id, text: `${d.tenant.name} owes AED ${d.outstanding.toLocaleString("en-US")} (due ${shortDay(d.dueDate)})` });
  if (toFill) alerts.push({ level: "soon", propertyId: p.id, text: `${p.name}: room for ${toFill} more ${toFill === 1 ? "tenant" : "tenants"}, missing AED ${vacant.reduce((s, v) => s + v.missingAed, 0).toLocaleString("en-US")} a month` });

  return {
    property: p,
    period,
    spaces: capacity,
    occupied: Math.min(capacity, active.length),
    vacant,
    expected,
    collected,
    pendingCheques,
    outstanding: dues.reduce((s, d) => s + d.outstanding, 0),
    potential: p.spaces.reduce((s, x) => s + x.rentAed, 0),
    costs,
    paidOut,
    profit: expected - costs,
    cash: collected - paidOut,
    toBreakEven,
    toFill,
    dues,
    cheques,
    alerts,
  };
}

export interface PortfolioReport {
  period: string;
  properties: PropertyReport[];
  spaces: number;
  occupied: number;
  expected: number;
  collected: number;
  pendingCheques: number;
  outstanding: number;
  potential: number;
  costs: number;
  paidOut: number;
  profit: number;
  cash: number;
  toBreakEven: number;
  toFill: number;
  missing: number;
  alerts: Alert[];
}

type SumKey = "spaces" | "occupied" | "expected" | "collected" | "pendingCheques" | "outstanding" | "potential" | "costs" | "paidOut" | "profit" | "cash" | "toBreakEven" | "toFill";

export function portfolioReport(props: MProperty[], tenants: MTenant[], payments: MPayment[], period: string, today: string): PortfolioReport {
  const reports = props.map((p) => propertyReport(p, tenants, payments, period, today));
  const sum = (k: SumKey) => reports.reduce((s, r) => s + r[k], 0);
  return {
    period,
    properties: reports,
    spaces: sum("spaces"),
    occupied: sum("occupied"),
    expected: sum("expected"),
    collected: sum("collected"),
    pendingCheques: sum("pendingCheques"),
    outstanding: sum("outstanding"),
    potential: sum("potential"),
    costs: sum("costs"),
    paidOut: sum("paidOut"),
    profit: sum("profit"),
    cash: sum("cash"),
    toBreakEven: sum("toBreakEven"),
    toFill: sum("toFill"),
    missing: reports.reduce((s, r) => s + r.vacant.reduce((x, v) => x + v.missingAed, 0), 0),
    alerts: reports.flatMap((r) => r.alerts).sort((a, b) => (a.level === b.level ? 0 : a.level === "urgent" ? -1 : 1)),
  };
}

/** Ready-to-send WhatsApp text from the owner to a tenant. */
export function rentReminder(t: MTenant, p: MProperty, d: { outstanding: number; dueDate: string }): string {
  const first = t.name.trim().split(/\s+/)[0];
  return `Hi ${first}, a friendly reminder that your rent for ${periodLabel(periodOf(d.dueDate))} at ${p.name} is AED ${d.outstanding.toLocaleString("en-US")}, due on ${shortDay(d.dueDate)}. Thank you!`;
}

/* ---------- input cleaning (shared by the API) ---------- */

const str = (v: unknown, max: number) => String(v ?? "").replace(/\s+/g, " ").trim().slice(0, max);
const money = (v: unknown) => {
  const n = Math.round(Number(v));
  return Number.isFinite(n) && n >= 0 && n <= 10_000_000 ? n : 0;
};
const isoDate = (v: unknown) => (/^\d{4}-\d{2}-\d{2}$/.test(String(v ?? "")) ? String(v) : null);
const oneOf = <T extends string>(v: unknown, all: readonly T[], d: T): T => (all.includes(v as T) ? (v as T) : d);
const LAYOUTS = Object.keys(LAYOUT_LABEL) as Layout[];
const SPACES = Object.keys(SPACE_LABEL) as SpaceKind[];
const BILLS = Object.keys(BILL_LABEL) as BillKind[];
const EVERYS = Object.keys(EVERY_LABEL) as Every[];
const PAYS = Object.keys(PAY_LABEL) as PayKind[];
const METHODS: PayMethod[] = ["cash", "transfer", "cheque", "card"];

export function cleanProperty(input: Record<string, unknown>, newId: () => string): Omit<MProperty, "id" | "ownerId" | "createdAt" | "updatedAt"> {
  const leased = input.arrangement === "leased";
  const l = (input.lease ?? {}) as Record<string, unknown>;
  return {
    name: str(input.name, 60) || "My apartment",
    areaSlug: str(input.areaSlug, 60),
    building: str(input.building, 80),
    unitNo: str(input.unitNo, 20),
    layout: oneOf(input.layout, LAYOUTS, "2bhk"),
    arrangement: leased ? "leased" : "owned",
    lease: leased
      ? { landlord: str(l.landlord, 60), yearlyRentAed: money(l.yearlyRentAed), cheques: Math.min(12, Math.max(1, Math.round(Number(l.cheques) || 1))), startDate: isoDate(l.startDate) ?? "", endDate: isoDate(l.endDate) ?? "", depositAed: money(l.depositAed) }
      : null,
    permitNo: str(input.permitNo, 40),
    permitExpiry: isoDate(input.permitExpiry),
    spaces: (Array.isArray(input.spaces) ? input.spaces : []).slice(0, 60).map((s: Record<string, unknown>) => ({
      id: /^[\w-]{4,20}$/.test(String(s.id ?? "")) ? String(s.id) : newId(),
      label: str(s.label, 40) || "Space",
      kind: oneOf(s.kind, SPACES, "bed_space"),
      rentAed: money(s.rentAed),
      capacity: Math.min(12, Math.max(1, Math.round(Number(s.capacity) || 1))),
    })),
    bills: (Array.isArray(input.bills) ? input.bills : []).slice(0, 30).map((b: Record<string, unknown>) => ({
      id: /^[\w-]{4,20}$/.test(String(b.id ?? "")) ? String(b.id) : newId(),
      kind: oneOf(b.kind, BILLS, "other"),
      label: str(b.label, 40),
      amountAed: money(b.amountAed),
      every: oneOf(b.every, EVERYS, "month"),
    })),
    photos: (Array.isArray(input.photos) ? input.photos : []).map(String).filter((u) => /^\/api\/media\/manager\/[\w./-]+$/.test(u)).slice(0, 20),
    notes: str(input.notes, 600),
  };
}

export function cleanTenant(input: Record<string, unknown>, phone: (s: string) => string | null): { value?: Omit<MTenant, "id" | "ownerId" | "createdAt">; error?: string } {
  const name = str(input.name, 60);
  if (name.length < 2) return { error: "Enter the tenant's name" };
  const moveIn = isoDate(input.moveIn);
  if (!moveIn) return { error: "Pick the move-in date" };
  const ph = input.phone ? phone(String(input.phone)) : "";
  if (ph === null) return { error: "That phone number doesn't look right" };
  return {
    value: {
      propertyId: str(input.propertyId, 20),
      spaceId: str(input.spaceId, 20),
      name,
      phone: ph,
      nationality: str(input.nationality, 40),
      visaExpiry: isoDate(input.visaExpiry),
      moveIn,
      moveOut: isoDate(input.moveOut),
      rentAed: money(input.rentAed),
      depositAed: money(input.depositAed),
      dueDay: Math.min(28, Math.max(1, Math.round(Number(input.dueDay) || 1))),
      status: input.status === "left" ? "left" : "active",
      notes: str(input.notes, 400),
    },
  };
}

export function cleanPayment(input: Record<string, unknown>): { value?: Omit<MPayment, "id" | "ownerId" | "createdAt">; error?: string } {
  const amountAed = money(input.amountAed);
  if (!amountAed) return { error: "Enter the amount" };
  const date = isoDate(input.date);
  if (!date) return { error: "Pick the date" };
  const period = /^\d{4}-\d{2}$/.test(String(input.period ?? "")) ? String(input.period) : periodOf(date);
  return {
    value: {
      propertyId: str(input.propertyId, 20),
      kind: oneOf(input.kind, PAYS, "rent"),
      tenantId: input.tenantId ? str(input.tenantId, 20) : null,
      billId: input.billId ? str(input.billId, 20) : null,
      period,
      months: Math.min(12, Math.max(1, Math.round(Number(input.months) || 1))),
      amountAed,
      date,
      method: oneOf(input.method, METHODS, "cash"),
      chequeNo: str(input.chequeNo, 30),
      chequeStatus: input.method === "cheque" ? oneOf(input.chequeStatus, ["pending", "cleared", "bounced"] as const, "pending") : null,
      chequeIndex: Number.isInteger(Number(input.chequeIndex)) && input.chequeIndex !== null && input.chequeIndex !== "" ? Math.max(0, Math.min(11, Number(input.chequeIndex))) : null,
      note: str(input.note, 200),
    },
  };
}
