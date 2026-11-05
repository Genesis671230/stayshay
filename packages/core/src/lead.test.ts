import { test } from "node:test";
import assert from "node:assert/strict";
import { leadMessage, validateLead } from "./lead.ts";

test("family request validates and builds a WhatsApp message", () => {
  const r = validateLead({ kind: "family", home: "2bhk", budget: 9000, areaSlugs: ["al-nahda-dubai"], metro: true, furnished: false, moveIn: "2026-12-01", adults: 2, kids: 1, from: "London", name: "Sam Lee", phone: "0501234567" });
  assert.equal(r.ok, true, JSON.stringify(r.errors));
  assert.equal(r.value?.kind, "family");
  const msg = leadMessage(r.value!, (s) => (s === "al-nahda-dubai" ? "Al Nahda" : s));
  assert.match(msg, /2BHK apartment, near the metro/);
  assert.match(msg, /2 adults, 1 child/);
  assert.match(msg, /moving from London/);
});

test("family request rejects a missing home type and tiny budget", () => {
  const r = validateLead({ kind: "family", budget: 100, moveIn: "2026-12-01", name: "Sam", phone: "0501234567" });
  assert.equal(r.ok, false);
  assert.ok(r.errors.home && r.errors.budget);
});
