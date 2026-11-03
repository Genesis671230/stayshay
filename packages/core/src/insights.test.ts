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
