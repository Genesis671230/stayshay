# Stayshay growth plan (founder notes, 2026-11-01)

One sentence: don't be another listings site. Be the software that keeps Dubai's bed-space operators legal and full, and let the marketplace grow out of that.

## What's live now
- Marketplace (bed spaces, partitions, rooms, studios, roommates). Free for renters.
- Every contact goes through Stayshay's WhatsApp: listing number, photo link, location and map pin arrive with each message. Owner and roommate numbers are never public (also stripped from text).
- **Refer & earn** (`/refer`, dashboard `/account/referrals`, admin `/admin/referrals`): anyone shares `stayshay.com/?ref=CODE`. People who arrive are tied to the code for 90 days (first referrer wins), across sign-ups (email or Google), viewing requests, find-me-a-room, roommate profiles and owner listings. Rewards (`REFERRAL_REWARDS` in `packages/core/src/referral.ts`): AED 100 per referred renter who moves in, AED 150 per referred owner's first tenant. Admin records the reward when a move-in is confirmed and marks it paid.
- **Partner brokers** (`/partners`): brokers/agents create a public profile from their dashboard; admin approves. Their profile page sets their referral code on every visitor, and renters still message Stayshay, never the broker directly.

⚠️ Referral rewards are paid by Stayshay for introductions, not brokerage commission. Taking commission for brokering rentals in Dubai needs RERA registration. Have a lawyer confirm the wording and amounts before paying the first reward.

## Risks, in order, and how we survive them
1. **Regulation** (shared-housing permits, occupancy limits, tenancy register, large fines). List permitted units, or label the rest clearly; never advertise an illegal partition.
2. **A trust scandal**. Verify owners, never hold deposits, report-and-ban.
3. **Going asset-heavy**. Never lease or furnish property ourselves.
4. **Owners not adopting**. Give them compliance and rent collection, which WhatsApp can't.
5. **No liquidity**. Win Al Rigga / Deira first, then expand.
6. **Founder bandwidth**. Fixed weekly hours.

## Next build: Stayshay Manager (owner platform)
Beds list, tenants, rent due, WhatsApp rent reminders, permit expiry, occupancy-limit alerts, resident register export. Every bed marked "free on the 1st" goes live on the marketplace automatically. Admin already has tenancies + renewal reminders, which is the seed of this.

Money (estimates to validate): AED 5–10 per bed per month subscription; AED 1,000–2,500 compliance setup with a PRO partner; ~AED 100–150 move-in fee per filled bed; employer housing contracts. Tenants pay nothing.

## Next 30 days
- Interview 15 operators: "Would you pay AED 7 a bed for permit tracking, the register and rent reminders?" Fewer than 5 yes → rethink.
- Two evenings at Al Rigga and Al Barsha metro: 20 conversations with people waiting for brokers. Recruit the regular "metro guides" as referral partners.
- QR posters at metro-adjacent buildings, with permission (no fly-posting).
- B2B: recruitment agencies and staffing firms need beds for new staff.

## Stayshay Manager (built 2026-11-02) — `/manager`
Free owner dashboard. Data in `manager.json` (properties, tenants, payments, each stamped with the owner's user id; every API lookup is owner-scoped). Pure logic + tests in `packages/core/src/manager.ts`.
- Apartment: layout (studio to villa), area, building/unit, owned or **leased and sublet** (landlord, yearly rent, cheques, dates, deposit), permit number + expiry, spaces (bed / partition / room / whole unit with asking rent), running costs (DEWA, Wi-Fi, gas, chiller, cleaner, maintenance, service charge, other; monthly/quarterly/yearly).
- Tenants: space, rent, deposit, due day, WhatsApp, nationality, visa expiry, move-in/out. One active tenant per space.
- Report per month: expected vs collected, outstanding and late tenants, running costs (head-lease rent / 12 + bills spread monthly), profit if everyone pays, full-house margin, empty spaces and missed rent, alerts (late rent, permit/lease/visa expiry, missing permit, vacancies). WhatsApp rent reminder, mark paid, CSV export.
- Empty space → "List on Stayshay" pre-fills the listing form (type, area, rent).
Next: rent reminders sent automatically, tenant receipts, resident register export for the shared-housing permit, multi-user (partner/caretaker) access.

### Manager update (2026-11-02)
- Spaces hold 1–6 people (`capacity`); rent splits per person; "room for N more" and per-person asking rent.
- Payments can cover several months (`months`); cheques have number + status (pending / cleared / bounced) and only count once cleared.
- Landlord cheque schedule from the lease (yearly rent ÷ cheques, months each), mark given / cleared / bounced.
- Apartment photos (`/api/manager/photo`, max 20, resized, EXIF stripped).
- Snapshot: occupancy, tenants needed to cover costs, tenants needed to fill, cheques pending.
- Admin `/admin/manager`: all owners' occupancy and where tenants are needed (area × type) — demand to feed from the marketplace.
