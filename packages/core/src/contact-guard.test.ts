import { test } from "node:test";
import assert from "node:assert/strict";
import { checkContact } from "./contact-guard.ts";

const blocked = [
  "call 050 123 4567",
  "+971 50 123 4567",
  "0501234567",
  "zero five zero one two three four five six seven",
  "o50 123 4567",
  "٠٥٠١٢٣٤٥٦٧",
  "0️⃣5️⃣0️⃣1️⃣2️⃣3️⃣4️⃣5️⃣6️⃣7️⃣",
  "whatsapp me",
  "w h a t s a p p",
  "whats app?",
  "wh4ts4pp",
  "watsap pe aao",
  "wаtsapp",
  "insta?",
  "my ig is sara.dxb",
  "@sara_dxb",
  "instagram",
  "1nstagram",
  "tele gram",
  "find me on telegram",
  "t.me/sara",
  "wa.me/971501234567",
  "facebook",
  "face book",
  "fb mo?",
  "snapchat",
  "add me on snap",
  "tiktok",
  "on signal?",
  "botim",
  "wechat",
  "viber",
  "line id sara12",
  "sara at gmail dot com",
  "sara@gmail.com",
  "the green app?",
  "lets talk on the blue app",
  "can we chat on another app",
  "whats your number",
  "share your number",
  "send me your digits",
  "mera number le lo",
  "number mo?",
  "واتساب",
  "رقمك",
  "check mysite.com",
];

for (const t of blocked) {
  test(`blocks: ${t}`, () => assert.equal(checkContact(t).blocked, true));
}

const allowed = [
  "Hi Sara, I saw your profile",
  "My budget is 2500 per month",
  "budget 1500-2000",
  "2500 3500 4000 are the options",
  "Move in on 12/11/2026",
  "2026-11-08",
  "The flat is on the red line, close to the metro",
  "I take the green line every day",
  "Is there good signal in the flat?",
  "One or two people, three rooms",
  "Do you cook?",
  "I can do five days a week",
  "Call me Sam",
  "Flat number 1204, tower 3",
  "What number of people live there?",
  "I work at Emirates in the marina",
  "I'd like a viewing on Saturday",
  "The app is great",
  "Lots of snap decisions this week",
  "imo the marina is nicer",
  "Rent is AED 3,500 and deposit 1,750",
  "the kitchen is off the living room",
];

for (const t of allowed) {
  test(`allows: ${t}`, () => assert.equal(checkContact(t).blocked, false));
}

test("catches a number split across messages", () => {
  assert.equal(checkContact("4567", ["050", "123"]).blocked, true);
});

test("catches an app name split across messages", () => {
  assert.equal(checkContact("app", ["whats"]).blocked, true);
});

test("does not join with a long earlier message", () => {
  assert.equal(checkContact("ok", ["I would really like to see the room this weekend"]).blocked, false);
});

test("reports why", () => {
  assert.deepEqual(checkContact("0501234567"), { blocked: true, reason: "phone" });
  assert.deepEqual(checkContact("sara@gmail.com"), { blocked: true, reason: "email" });
});
