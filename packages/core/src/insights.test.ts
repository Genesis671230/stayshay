import { test } from "node:test";
import assert from "node:assert/strict";
import { rentBudget, rentVerdict, typicalRent } from "./insights.ts";
import type { Listing } from "./types.ts";

const L = (type: Listing["type"], areaSlug: string, priceAed: number) => ({ type, areaSlug, priceAed }) as Listing;

test("typical rent prefers the area when it has 3+ listings", () => {
  const ls = [L("bed_space", "deira", 600), L("bed_space", "deira", 700), L("bed_space", "deira", 800), L("bed_space", "al-barsha-1", 1200)];
  assert.deepEqual(typicalRent(ls, "bed_space", "deira"), { median: 700, count: 3, scope: "area" });
  assert.deepEqual(typicalRent(ls, "bed_space", "al-barsha-1"), { median: 750, count: 4, scope: "uae" });
  assert.equal(typicalRent(ls, "studio"), null);
});

test("verdicts and budgets", () => {
  assert.equal(rentVerdict(500, 700).verdict, "steal");
  assert.equal(rentVerdict(640, 700).verdict, "good");
  assert.equal(rentVerdict(720, 700).verdict, "fair");
  assert.equal(rentVerdict(800, 700).verdict, "high");
  assert.equal(rentVerdict(1000, 700).verdict, "overpriced");
  assert.deepEqual(rentBudget(4000), { comfortable: 1000, max: 1350 });
});

test("moveInCost: unfurnished, 4 cheques, via agent, apartment", async () => {
  const { moveInCost } = await import("./insights.ts");
  const r = moveInCost({ yearlyRent: 60000, cheques: 4, furnished: false, viaAgent: true, villa: false });
  assert.equal(r.lines.find((l) => l.label === "First rent cheque")!.amount, 15000);
  assert.equal(r.lines.find((l) => l.label === "Security deposit")!.amount, 3000);
  assert.equal(r.lines.find((l) => l.label === "Agency fee")!.amount, 3000);
  assert.equal(r.lines.find((l) => l.label === "VAT on agency fee")!.amount, 150);
  assert.equal(r.total, 15000 + 3000 + 3000 + 150 + 220 + 2000);
  assert.equal(r.refundable, 5000);
  assert.equal(r.monthly, 5000);
});

test("moveInCost: furnished direct villa, no agency lines", async () => {
  const { moveInCost } = await import("./insights.ts");
  const r = moveInCost({ yearlyRent: 120000, cheques: 1, furnished: true, viaAgent: false, villa: true });
  assert.ok(!r.lines.some((l) => l.label.startsWith("Agency")));
  assert.equal(r.lines[1].amount, 12000);
  assert.equal(r.total, 120000 + 12000 + 220 + 4000);
});
