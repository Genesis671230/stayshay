import { test } from "node:test";
import assert from "node:assert/strict";
import { makeRefCode, normalizeRefCode, referralLink } from "./referral.ts";
import { stripPhones } from "./text.ts";
import { whatsappMessage } from "./inquiry.ts";
import type { Listing } from "./types.ts";

test("referral codes normalise and validate", () => {
  assert.equal(normalizeRefCode(" ahmed-7k2 "), "AHMED7K2");
  assert.equal(normalizeRefCode("ab"), null);
  assert.equal(normalizeRefCode("x".repeat(13)), null);
  assert.match(makeRefCode("Ahmed Khan", () => 0.5), /^AHMEDK[A-Z0-9]{3}$/);
  assert.match(makeRefCode("محمد", () => 0), /^SHAY[A-Z0-9]{3}$/);
  assert.equal(referralLink("AHMED7K2"), "https://stayshay.com/?ref=AHMED7K2");
});

test("phone numbers are removed from public text", () => {
  assert.equal(stripPhones("bed space near satwa bus station 0529270189"), "bed space near satwa bus station");
  assert.equal(stripPhones("call +971 52 927 0189 now"), "call now");
  assert.equal(stripPhones("call 052-927-0189."), "call.");
  assert.equal(stripPhones("AED 1500 per month, 2 beds"), "AED 1500 per month, 2 beds");
});

test("WhatsApp message carries link, ref and location", () => {
  const l = { id: "SS1008", type: "bed_space", title: "Bed space", areaSlug: "al-satwa", areaName: "Al Satwa", city: "Dubai", building: "Al Satwa", priceAed: 700, lat: 25.2251, lng: 55.2731 } as Listing;
  const m = whatsappMessage(l, { name: "Sara", moveIn: "2026-11-05" });
  assert.match(m, /^Hi Stayshay.*\nhttps:\/\/stayshay\.com\/listing\/ss1008\n/);
  assert.match(m, /Ref SS1008 · Bed space · AED 700\/month/);
  assert.match(m, /Location: Al Satwa, Dubai/);
  assert.match(m, /Map: https:\/\/maps\.google\.com\/\?q=25\.22510,55\.27310/);
  assert.match(m, /Name: Sara/);
});
