import { test } from "node:test";
import assert from "node:assert/strict";
import { cleanProperty, leaseCheques, monthlyCost, portfolioReport, propertyReport, rentReminder, shiftPeriod, type MPayment, type MProperty, type MTenant } from "./manager.ts";

let n = 0;
const id = () => `x${++n}xx`;
const flat: MProperty = {
  id: "p1", ownerId: "o", createdAt: "", updatedAt: "",
  ...cleanProperty({
    name: "Al Rigga 2BHK", layout: "2bhk", arrangement: "leased",
    lease: { landlord: "Mr A", yearlyRentAed: 96000, cheques: 4, startDate: "2026-01-01", endDate: "2026-12-15", depositAed: 5000 },
    permitNo: "DM-123", permitExpiry: "2027-06-01",
    spaces: [{ label: "Room 1 bed A", kind: "bed_space", rentAed: 900 }, { label: "Room 1 bed B", kind: "bed_space", rentAed: 900 }, { label: "Partition 1", kind: "partition", rentAed: 1600 }, { label: "Partition 2", kind: "partition", rentAed: 1600, capacity: 2 }],
    bills: [{ kind: "dewa", amountAed: 900, every: "month" }, { kind: "wifi", amountAed: 400, every: "month" }, { kind: "cleaner", amountAed: 1500, every: "quarter" }],
  }, id),
};
const t = (i: number, spaceIdx: number, rent: number, extra: Partial<MTenant> = {}): MTenant => ({
  id: `t${i}`, ownerId: "o", propertyId: "p1", spaceId: flat.spaces[spaceIdx].id, name: `Tenant ${i}`, phone: "971500000000", nationality: "", visaExpiry: null,
  moveIn: "2026-09-01", moveOut: null, rentAed: rent, depositAed: rent, dueDay: 1, status: "active", notes: "", createdAt: "", ...extra,
});
const tenants = [t(1, 0, 900), t(2, 1, 850, { visaExpiry: "2026-11-20" }), t(3, 2, 1600, { dueDay: 5 })];
const pay = (tenantId: string | null, kind: MPayment["kind"], amountAed: number, extra: Partial<MPayment> = {}): MPayment => ({ id: id(), ownerId: "o", propertyId: "p1", kind, tenantId, billId: null, period: "2026-11", months: 1, amountAed, date: "2026-11-01", method: "cash", chequeNo: "", chequeStatus: null, chequeIndex: null, note: "", createdAt: "", ...extra });

test("monthly running cost = head lease / 12 + bills spread per month", () => {
  assert.equal(monthlyCost(flat), 8000 + 900 + 400 + 500);
});

test("property report: collections, outstanding, late, vacancy, profit, alerts", () => {
  const r = propertyReport(flat, tenants, [pay("t1", "rent", 900), pay("t2", "rent", 500), pay(null, "lease", 8000)], "2026-11", "2026-11-03");
  assert.equal(r.expected, 3350);
  assert.equal(r.collected, 1400);
  assert.equal(r.outstanding, 1950);
  assert.deepEqual(r.dues.filter((d) => d.late).map((d) => d.tenant.id), ["t2"]); // t3 due on the 5th: not late yet
  assert.equal(r.vacant.length, 1);
  assert.equal(r.spaces, 5); // partition 2 holds two people
  assert.equal(r.toFill, 2);
  assert.equal(r.potential, 5000);
  assert.equal(r.profit, 3350 - 9800);
  assert.equal(r.cash, 1400 - 8000);
  const texts = r.alerts.map((a) => a.text).join(" | ");
  assert.match(texts, /Tenant 2 owes AED 350/);
  assert.match(texts, /visa expires in 17 days/);
  assert.match(texts, /room for 2 more tenants, missing AED 1,600/);
});

test("lease ending soon and tenants who left are handled", () => {
  const r = propertyReport(flat, [...tenants, t(4, 3, 1500, { moveIn: "2026-06-01", moveOut: "2026-10-31", status: "left" })], [], "2026-11", "2026-11-03");
  assert.equal(r.dues.length, 3);
  assert.match(r.alerts.map((a) => a.text).join(" "), /lease with the landlord ends in 42 days/);
  const oct = propertyReport(flat, [t(4, 3, 1500, { moveIn: "2026-06-01", moveOut: "2026-10-31", status: "left" })], [], "2026-10", "2026-11-03");
  assert.equal(oct.expected, 1500);
});

test("portfolio sums properties; reminders and periods", () => {
  const p = portfolioReport([flat], tenants, [], "2026-11", "2026-11-10");
  assert.equal(p.expected, 3350);
  assert.equal(p.alerts[0].level, "urgent");
  assert.equal(shiftPeriod("2026-01", -1), "2025-12");
  assert.match(rentReminder(tenants[0], flat, { outstanding: 900, dueDate: "2026-11-01" }), /Hi Tenant, .*November 2026 at Al Rigga 2BHK is AED 900, due on 1 Nov/);
});

test("a shared partition splits rent between its tenants", () => {
  const sp = flat.spaces[3];
  const couple = [t(5, 3, 800), t(6, 3, 800)];
  const r = propertyReport(flat, [...tenants, ...couple], [], "2026-11", "2026-11-01");
  assert.equal(r.vacant.length, 0);
  assert.equal(r.occupied, 5);
  const one = propertyReport(flat, [...tenants, couple[0]], [], "2026-11", "2026-11-01");
  assert.deepEqual(one.vacant.map((v) => [v.space.id, v.free, v.missingAed, v.perPersonAed]), [[sp.id, 1, 800, 800]]);
});

test("a 3-month cheque covers three months, and only counts once cleared", () => {
  const chq = pay("t3", "rent", 4800, { months: 3, method: "cheque", chequeStatus: "pending", chequeNo: "000123" });
  const pending = propertyReport(flat, tenants, [chq], "2026-12", "2026-12-10");
  const d = pending.dues.find((x) => x.tenant.id === "t3")!;
  assert.equal(d.paid, 0);
  assert.equal(d.pending, 1600);
  assert.equal(d.late, false);
  assert.equal(pending.pendingCheques, 1600);
  const cleared = propertyReport(flat, tenants, [{ ...chq, chequeStatus: "cleared" }], "2027-01", "2027-01-10");
  assert.equal(cleared.dues.find((x) => x.tenant.id === "t3")!.paid, 1600);
  assert.equal(propertyReport(flat, tenants, [{ ...chq, chequeStatus: "cleared" }], "2027-02", "2027-02-10").dues.find((x) => x.tenant.id === "t3")!.paid, 0);
  const bounced = propertyReport(flat, tenants, [{ ...chq, chequeStatus: "bounced" }], "2026-11", "2026-11-10");
  assert.match(bounced.alerts.map((a) => a.text).join(" "), /cheque 000123 bounced/);
});

test("landlord cheque schedule and break-even", () => {
  const cs = leaseCheques(flat, [pay(null, "lease", 24000, { months: 3, method: "cheque", chequeStatus: "cleared", chequeIndex: 0, period: "2026-01" })]);
  assert.deepEqual(cs.map((c) => [c.dueDate, c.amountAed, c.months, c.status]), [
    ["2026-01-01", 24000, 3, "cleared"],
    ["2026-04-01", 24000, 3, "due"],
    ["2026-07-01", 24000, 3, "due"],
    ["2026-10-01", 24000, 3, "due"],
  ]);
  const r = propertyReport(flat, tenants, [], "2026-11", "2026-11-03");
  // costs 9,800 vs expected 3,350: the 2 free slots (800 each) aren't enough, so more than 2 needed
  assert.equal(r.toBreakEven, 3);
  const full = propertyReport({ ...flat, lease: { ...flat.lease!, yearlyRentAed: 12000 } }, tenants, [], "2026-11", "2026-11-03");
  assert.equal(full.toBreakEven, 0);
});
