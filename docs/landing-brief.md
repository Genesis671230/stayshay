# Stayshay — Landing Brief v1

Positioning: UAE monthly rooms, bed spaces, partitions and studios, with consent and permit status shown on every listing. Look: white, generous whitespace, one accent colour, real photos. No government logos or colours, and no claims of approval.

Legal basis (re-verify before launch): Dubai Law No. 4 of 2026 (shared housing). Shared units need a permit, and only owners or licensed establishments may operate them. Tenants may not sublet without the landlord's written consent. Reports give different effective dates (one says 26 Aug 2026), so legal should confirm the date.

---

## 1. Top 12 UX patterns to steal

1. Search pill that opens step by step (Where → Type → Move-in → Budget), not one long form — Airbnb.
2. Area autocomplete grouped by city, community and metro station, with listing counts — Bayut / Property Finder.
3. Split list + map with price pins, plus a "Search as I move the map" toggle — Airbnb.
4. Room-level listing (not whole flat) with household details: who lives there, ages, gender, number of bathrooms — SpareRoom.
5. "Filters (3)" button that shows how many are applied, and a sticky "Show 214 places" result count — Airbnb.
6. Image carousel on the card, with a heart/save button that needs no login until the third save — Airbnb.
7. Lifestyle tags plus a compatibility score on each person — Badi.
8. Flatmate profiles that show rooms *and* people looking for rooms (two-sided feed) — SpareRoom / Roomster.
9. Verified badges at the account level (phone, ID) as a separate tier from listing-level checks — Bayut "TruCheck" / Property Finder "Verified".
10. Free first listing with a 3-step wizard (photos → price → rules); pay to boost later — Dubizzle / Badi.
11. Contact on WhatsApp with a prefilled message carrying the listing reference — Dubizzle / homebook.ae.
12. "Report listing" with reason chips (scam, already rented, wrong price, illegal partition) — homebook.ae / Dubizzle.

---

## 2. Landing page — section order and copy

**Order:** Nav → Hero + search → Category cards → Budget chips → Featured verified listings → How it works → Trust & safety → Roommate matcher → For listers → Testimonials → FAQ → Final CTA → Footer.

### Nav
Logo · Rooms · Bed spaces · Studios · Find a roommate · **List for free** (button) · Sign in · عربي

### Hero
Headline options:
- A. "Monthly rooms you can actually trust."
- B. "Find your room in the UAE. Verified, compliant, no surprises."
- C. "Rooms, bed spaces and studios — checked before you call." **← pick**

Pick: **C**. It names the inventory, and "checked before you call" is the trust edge in five words, linked to the WhatsApp behaviour renters already have.

Sub: "Every listing shows whether landlord consent and a shared-housing permit are declared. Monthly rent, no commission listings marked clearly."
Search: `Area or metro station` · `Room type` · `Move-in` · `Budget` → **Search**
Microcopy under search: "Popular: Al Barsha 1 · JLT · Deira · Al Nahda · Business Bay"
Secondary CTA: **List your room for free**

Arabic:
- Headline: «غرف وأسرّة واستوديوهات — تم التحقق منها قبل أن تتصل.»
- Search: **ابحث** · Secondary: **أعلن عن غرفتك مجاناً** · Roommate: **ابحث عن شريك سكن**

### Category cards
- **Bed space** — "Shared room, own bed. From AED 600." → *See bed spaces*
- **Private room** — "Your own door in a shared flat." → *See rooms*
- **Partition** — "Only listings that declare a permit." → *See partitions*
- **Studio** — "Your own place, monthly." → *See studios*
(The "From" price is pulled live from listings. Never hardcode it.)

### Budget chips
"Shop by monthly budget": Under AED 1,000 · 1,500 · 2,500 · 3,500 · 5,000 · 5,000+

### Featured listings
Headline: "Verified this week"
Card: photo carousel · ♡ · badge row (`Verified compliant` / `Verified lister`) · title "Private room · Al Barsha 1" · "6 min walk to Mall of the Emirates metro" · tags (max 3: Bills included · No deposit · No commission) · gender chip (Female only / Male only / Mixed) · **AED 2,200/month** · "Available 1 Nov"
CTA on card: **WhatsApp** (green, secondary) · tap card → details
Link: *See all 1,240 listings →*

### How it works
1. **Search** — "Filter by area, budget, move-in date and who you'll live with."
2. **Check** — "See what's verified: the lister, the landlord's consent, the permit."
3. **Message** — "WhatsApp the lister with your details already filled in."
4. **View, then pay** — "Never transfer money before you've seen the room."

### Final CTA
"Your next room is a message away." → **Start searching** · *List for free*

### Footer microcopy
"Stayshay is a listings marketplace. We are not a government body and do not issue permits. Badges reflect documents listers provide to us and the checks we run on them."

---

## 3. Search filters

| Field | Options |
|---|---|
| Location | Autocomplete: emirate → community → sub-community → metro station; multi-select, max 5 |
| Room type | Bed space · Private room · Master room (en-suite) · Partition · Studio · 1BR (whole) |
| Budget (AED/month) | Dual slider 300–10,000; step 50 under 2,000, 100 above; presets as chips |
| Move-in | Date picker + "Flexible ±7 days" toggle; quick: Now · This month · Next month |
| Stay length | 1 month+ · 3 months+ · 6 months+ · 12 months |
| Gender | Female only · Male only · Mixed · Couples allowed · Family |
| Occupancy | Bed space: 2 / 3 / 4 / 5+ per room · Flat total: up to 3 / 4–6 / 7+ people |
| Bills | Bills included (DEWA, Wi-Fi, gas) · Partial · Not included |
| Deposit | No deposit · Up to 1 month · Any |
| Commission | No commission (toggle) |
| Near metro | ≤5 min walk · ≤10 min · ≤15 min; or a named line (Red / Green) |
| Furnishing | Furnished · Semi · Unfurnished |
| Bathroom | Private · Shared (≤2) · Shared (3+) |
| Amenities | AC (chiller-free), Parking, Gym, Pool, Kitchen access, Laundry, Balcony, Window |
| House rules | Non-smoking, Pets allowed, Visitors allowed, Cooking allowed |
| Trust | Verified compliant · Verified lister · Photos verified |
| Sort | Recommended · Newest · Price ↑ · Price ↓ · Nearest metro |

---

## 4. WhatsApp inquiry

**Prefilled message** (URL-encoded into `wa.me/<number>?text=`):

```
Hi, I saw your listing on Stayshay.
Ref: SK-{listing_id} — {title}, {area}
Name: {name}
Move-in: {move_in_date}
Budget: AED {budget}/month
Occupants: {count} ({gender})
{message}
Is it still available, and when can I view it?
```

**Inquiry form fields (minimum viable):**
1. Name (required)
2. WhatsApp number (required, +971 default, E.164 validation)
3. Move-in date (required, date picker)
4. Budget AED/month (required, prefilled from the listing price)
5. Message (optional, 300 chars, placeholder "Anything the lister should know — job, hours, cooking")

Submit label: **Send on WhatsApp**. Microcopy: "We log the request so we can step in if something goes wrong. Your number is shared only with this lister." Fallback when WhatsApp isn't installed: **Request a call back**.

---

## 5. Landlord / lister section

Headline: "Fill your room without the back-and-forth."
Sub: "List for free in under 5 minutes. Get WhatsApp inquiries that already include name, move-in date and budget."
CTA: **List for free** · *How verification works*

Benefits of List for free:
- **Free to list.** No commission and no card needed.
- **Pre-qualified leads.** Each inquiry arrives with move-in date, budget and number of occupants.
- **Compliance badge.** Upload landlord consent and permit details to earn *Verified compliant*. Renters filter for it.
- **Fewer time-wasters.** Gender, occupancy and house rules sit up front.
- **Reserved / rented in one tap.** Stops calls after you've let the room.
- **Arabic and English listings** created from the same form.

Microcopy: "Listings that declare a partition or bed space need landlord consent and the applicable permit. We may pause listings we can't check."

---

## 6. Roommate matcher

**Concept:** a renter builds a profile in 60 seconds (budget, area, move-in, 8 lifestyle tags). Stayshay shows (a) rooms whose current household matches, and (b) other seekers to team up with and rent a whole flat legally under one lease. The compatibility % is a weighted overlap: budget 25 · area/commute 20 · move-in window 15 · schedule 15 · lifestyle tags 25. Hard filters (gender preference, smoking) exclude a profile rather than score it.

Headline: "Live with people you'd actually choose."
Sub: "Tell us how you live. We'll show rooms and flatmates that fit — with a match score you can see."
CTA: **Build my profile** · Microcopy: "60 seconds. Only verified members can see your profile."

Lifestyle tags: Early riser · Night shift · Works from home · Non-smoker · Cooks daily · Quiet evenings · Social · Gym regular · Pet-friendly · Vegetarian kitchen · Practising faith · Guests rarely

Card example: "Aisha · 27 · Marketing · Female · **86% match** — Same budget, both early risers, 10 min apart on the Red Line."

---

## 7. Trust & safety

Headline: "Safety you can see on every listing."

- **Verified compliant** — "The lister uploaded landlord written consent and declared a shared-housing permit number. We check that the documents are complete and match the listing. The badge is our check, not a government approval."
- **Verified lister** — "Phone verified, with identity checked against Emirates ID. UAE PASS sign-in coming soon."
- **Report a listing** — "Wrong price, already rented, unsafe or looks like a scam? Report it in two taps. We review reports within 24 hours and pause listings while we check."
- **Never pay before viewing** — "Don't transfer a deposit or rent before you've seen the room and met the lister. Stayshay will never ask you to pay through WhatsApp."

Microcopy: "Badges show what we've checked. They are not a legal guarantee. Read the listing and your contract before you sign."

---

## 8. FAQ

1. **Are partitions legal in Dubai?**
   Only with the right approvals. Under Dubai's shared-housing rules, partitioned rooms and bed spaces need a permit, and only owners or licensed operators may rent them out. A tenant needs the landlord's written consent to sublet. On Stayshay, listings that declare consent and a permit get a *Verified compliant* badge after we check the documents. Stayshay is not a government body and does not issue or confirm permits. For a definitive answer, check with Dubai Municipality.

2. **Is Stayshay free?** Yes, for renters. Listing is free for landlords too. Optional boosts come later.

3. **Does Stayshay charge commission?** No. Some listers do, and their listings show it. Filter by *No commission* to hide them.

4. **What does "Verified lister" mean?** We've confirmed the lister's phone number and identity. It doesn't mean we've inspected the property.

5. **How do I contact a lister?** Tap *WhatsApp*. Your name, move-in date and budget are already filled in.

6. **Should I pay a deposit to hold a room?** Not before you've viewed it in person. If someone pressures you to pay first, report the listing.

7. **Can I find a roommate instead of a room?** Yes. Build a profile and we'll show people with matching budgets, areas and habits.

8. **Which cities do you cover?** Dubai first, then Sharjah, Abu Dhabi and Ajman. Rules differ by emirate, and badges reflect Dubai rules unless the listing says otherwise.

---

## 9. SEO

- **Title:** `Stayshay — Rooms, Bed Spaces & Studios for Monthly Rent in UAE`
- **Meta description:** `Find verified monthly rooms, bed spaces, partitions and studios in Dubai and across the UAE. See landlord consent and permit status, filter by budget and metro, and WhatsApp the lister directly.`

Programmatic page patterns:
1. `/bed-space/{area}` — /bed-space/al-barsha-1
2. `/room/{area}` — /room/jlt
3. `/partition/{area}` — /partition/al-nahda-1 (verified compliant listings only)
4. `/studio/{area}` — /studio/business-bay
5. `/{type}/near-{metro-station}-metro` — /room/near-mashreq-metro
6. `/{type}/{area}/under-{budget}` — /bed-space/deira/under-1000
7. `/{type}/{area}/female-only` (and `/male-only`, `/couples`)
8. `/{type}/{area}/bills-included` (and `/no-deposit`, `/no-commission`)
9. `/roommates/{area}` — /roommates/dubai-marina
10. `/ar/{type-ar}/{area}` — /ar/سرير/البرشاء-1 (Arabic mirror, hreflang paired)

Rules: index a page only with ≥5 live listings. Each page gets a unique intro, median-rent stat, metro list and FAQ schema. Add `ItemList` + `Offer` JSON-LD on results pages.

---

## 10. Phase-2 roadmap

- **Lister dashboard:** listings, inquiry inbox (WhatsApp log), views → inquiries → viewings funnel, renew/boost, document upload for compliance badge.
- **Renter profile + identity:** saved searches and alerts, shortlist, roommate profile; identity verification via UAE PASS (OIDC), with an Emirates ID OCR + selfie liveness fallback.
- **Payments:** deposit escrow held until move-in confirmation, with a dispute window; monthly rent collection later; licensed payment partner only.
- **Listing statuses:** `draft` → `pending_review` → `live` → `reserved` → `rented` → `expired`; side state `reported` (auto-pauses at N reports or on a critical reason); `rejected` with reason.
- **Admin:** review queue (docs, photos, duplicates), report triage with SLA timer, lister trust score, bans, audit log, area/metro taxonomy editor, SEO page index controls.
- **Later:** viewing scheduler, e-signed sub-tenancy consent templates, reviews after move-out, Sharjah/Abu Dhabi rule sets.
