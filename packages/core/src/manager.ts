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
  /** Asking rent for this space per month. A tenant can have their own agreed rent. */
  rentAed: number;
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
  /** Month the payment is for, YYYY-MM. */
  period: string;
  amountAed: number;
  date: string;
  method: PayMethod;
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

export interface TenantDue {
  tenant: MTenant;
  space: Space | undefined;
  due: number;
  paid: number;
  outstanding: number;
  dueDate: string;
  /** Past the due date and not fully paid. */
  late: boolean;
}

export type AlertLevel = "urgent" | "soon";
export interface Alert {
  level: AlertLevel;
  propertyId: string;
  text: string;
}

export interface PropertyReport {
  property: MProperty;
  period: string;
  spaces: number;
  occupied: number;
  vacant: Space[];
  /** Rent the owner should receive this month from tenants. */
  expected: number;
  collected: number;
  outstanding: number;
  /** Rent if every space were let at its asking rent. */
  potential: number;
  costs: number;
  paidOut: number;
  /** expected − costs: what the month is worth if everyone pays. */
  profit: number;
  /** collected − paid out so far. */
  cash: number;
  dues: TenantDue[];
  alerts: Alert[];
}

export function propertyReport(p: MProperty, tenants: MTenant[], payments: MPayment[], period: string, today: string): PropertyReport {
  const mine = tenants.filter((t) => t.propertyId === p.id);
  const live = mine.filter((t) => tenantActiveIn(t, period));
  const pays = payments.filter((x) => x.propertyId === p.id && x.period === period);
  const occupiedIds = new Set(mine.filter((t) => t.status === "active").map((t) => t.spaceId));

  const dues: TenantDue[] = live.map((t) => {
    const paid = pays.filter((x) => x.kind === "rent" && x.tenantId === t.id).reduce((s, x) => s + x.amountAed, 0);
    const dueDate = `${period}-${String(Math.min(Math.max(t.dueDay, 1), 28)).padStart(2, "0")}`;
    const outstanding = Math.max(0, t.rentAed - paid);
    return { tenant: t, space: p.spaces.find((s) => s.id === t.spaceId), due: t.rentAed, paid, outstanding, dueDate, late: outstanding > 0 && today > dueDate };
  });

  const expected = dues.reduce((s, d) => s + d.due, 0);
  const collected = pays.filter((x) => x.kind === "rent").reduce((s, x) => s + x.amountAed, 0);
  const paidOut = pays.filter((x) => !PAY_IN.has(x.kind) && x.kind !== "deposit_out").reduce((s, x) => s + x.amountAed, 0);
  const costs = monthlyCost(p);
  const vacant = p.spaces.filter((s) => !occupiedIds.has(s.id));

  const alerts: Alert[] = [];
  const soon = (date: string | null | undefined, days: number) => (date ? daysBetween(today, date) : null);
  const permitDays = soon(p.permitExpiry, 60);
  if (!p.permitNo) alerts.push({ level: "soon", propertyId: p.id, text: `${p.name}: add the shared-housing permit number` });
  else if (permitDays != null && permitDays < 0) alerts.push({ level: "urgent", propertyId: p.id, text: `${p.name}: permit expired ${-permitDays} days ago` });
  else if (permitDays != null && permitDays <= 60) alerts.push({ level: "soon", propertyId: p.id, text: `${p.name}: permit expires in ${permitDays} days` });
  const leaseDays = soon(p.lease?.endDate, 60);
  if (p.arrangement === "leased" && leaseDays != null && leaseDays <= 60)
    alerts.push({ level: leaseDays < 0 ? "urgent" : "soon", propertyId: p.id, text: leaseDays < 0 ? `${p.name}: your lease with the landlord ended` : `${p.name}: lease with the landlord ends in ${leaseDays} days` });
  for (const t of mine.filter((x) => x.status === "active")) {
    const v = soon(t.visaExpiry, 30);
    if (v != null && v <= 30) alerts.push({ level: v < 0 ? "urgent" : "soon", propertyId: p.id, text: v < 0 ? `${t.name}: visa expired` : `${t.name}: visa expires in ${v} days` });
  }
  for (const d of dues.filter((x) => x.late)) alerts.push({ level: "urgent", propertyId: p.id, text: `${d.tenant.name} owes AED ${d.outstanding.toLocaleString("en-US")} (due ${shortDay(d.dueDate)})` });
  if (vacant.length) alerts.push({ level: "soon", propertyId: p.id, text: `${p.name}: ${vacant.length} empty ${vacant.length === 1 ? "space" : "spaces"} losing AED ${vacant.reduce((s, v) => s + v.rentAed, 0).toLocaleString("en-US")} a month` });

  return {
    property: p,
    period,
    spaces: p.spaces.length,
    occupied: p.spaces.length - vacant.length,
    vacant,
    expected,
    collected,
    outstanding: dues.reduce((s, d) => s + d.outstanding, 0),
    potential: p.spaces.reduce((s, x) => s + x.rentAed, 0),
    costs,
    paidOut,
    profit: expected - costs,
    cash: collected - paidOut,
    dues,
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
  outstanding: number;
  potential: number;
  costs: number;
  paidOut: number;
  profit: number;
  cash: number;
  alerts: Alert[];
}

export function portfolioReport(props: MProperty[], tenants: MTenant[], payments: MPayment[], period: string, today: string): PortfolioReport {
  const reports = props.map((p) => propertyReport(p, tenants, payments, period, today));
  const sum = (k: keyof Pick<PropertyReport, "spaces" | "occupied" | "expected" | "collected" | "outstanding" | "potential" | "costs" | "paidOut" | "profit" | "cash">) => reports.reduce((s, r) => s + r[k], 0);
  return {
    period,
    properties: reports,
    spaces: sum("spaces"),
    occupied: sum("occupied"),
    expected: sum("expected"),
    collected: sum("collected"),
    outstanding: sum("outstanding"),
    potential: sum("potential"),
    costs: sum("costs"),
    paidOut: sum("paidOut"),
    profit: sum("profit"),
    cash: sum("cash"),
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
    })),
    bills: (Array.isArray(input.bills) ? input.bills : []).slice(0, 30).map((b: Record<string, unknown>) => ({
      id: /^[\w-]{4,20}$/.test(String(b.id ?? "")) ? String(b.id) : newId(),
      kind: oneOf(b.kind, BILLS, "other"),
      label: str(b.label, 40),
      amountAed: money(b.amountAed),
      every: oneOf(b.every, EVERYS, "month"),
    })),
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
      amountAed,
      date,
      method: oneOf(input.method, METHODS, "cash"),
      note: str(input.note, 200),
    },
  };
}
