import { test } from "node:test";
import assert from "node:assert/strict";
import { cleanProperty, monthlyCost, portfolioReport, propertyReport, rentReminder, shiftPeriod, type MPayment, type MProperty, type MTenant } from "./manager.ts";

let n = 0;
const id = () => `x${++n}xx`;
const flat: MProperty = {
  id: "p1", ownerId: "o", createdAt: "", updatedAt: "",
  ...cleanProperty({
    name: "Al Rigga 2BHK", layout: "2bhk", arrangement: "leased",
    lease: { landlord: "Mr A", yearlyRentAed: 96000, cheques: 4, startDate: "2026-01-01", endDate: "2026-12-15", depositAed: 5000 },
    permitNo: "DM-123", permitExpiry: "2027-06-01",
    spaces: [{ label: "Room 1 bed A", kind: "bed_space", rentAed: 900 }, { label: "Room 1 bed B", kind: "bed_space", rentAed: 900 }, { label: "Partition 1", kind: "partition", rentAed: 1600 }, { label: "Partition 2", kind: "partition", rentAed: 1600 }],
    bills: [{ kind: "dewa", amountAed: 900, every: "month" }, { kind: "wifi", amountAed: 400, every: "month" }, { kind: "cleaner", amountAed: 1500, every: "quarter" }],
  }, id),
};
const t = (i: number, spaceIdx: number, rent: number, extra: Partial<MTenant> = {}): MTenant => ({
  id: `t${i}`, ownerId: "o", propertyId: "p1", spaceId: flat.spaces[spaceIdx].id, name: `Tenant ${i}`, phone: "971500000000", nationality: "", visaExpiry: null,
  moveIn: "2026-09-01", moveOut: null, rentAed: rent, depositAed: rent, dueDay: 1, status: "active", notes: "", createdAt: "", ...extra,
});
const tenants = [t(1, 0, 900), t(2, 1, 850, { visaExpiry: "2026-11-20" }), t(3, 2, 1600, { dueDay: 5 })];
const pay = (tenantId: string | null, kind: MPayment["kind"], amountAed: number): MPayment => ({ id: id(), ownerId: "o", propertyId: "p1", kind, tenantId, billId: null, period: "2026-11", amountAed, date: "2026-11-01", method: "cash", note: "", createdAt: "" });

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
  assert.equal(r.potential, 5000);
  assert.equal(r.profit, 3350 - 9800);
  assert.equal(r.cash, 1400 - 8000);
  const texts = r.alerts.map((a) => a.text).join(" | ");
  assert.match(texts, /Tenant 2 owes AED 350/);
  assert.match(texts, /visa expires in 17 days/);
  assert.match(texts, /1 empty space losing AED 1,600/);
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
