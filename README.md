# Stayshay (سكني)

UAE monthly rentals: private rooms, bed spaces, partitions, studios and roommate matching, with a
compliance badge on every listing. Separate brand and codebase from RAMZA / Omnia.

## Layout

```
apps/web        Next.js 16 landing + marketplace (Tailwind 4, Leaflet)
packages/core   Platform-neutral domain: brand, types, areas, search, inquiry validation, WhatsApp text.
                The Expo mobile app (apps/mobile, next) imports this unchanged.
docs/           landing-brief.md (UX benchmark, copy, filters, SEO, phase-2 roadmap)
```

## Run

```
npm install
cp .env.example apps/web/.env.local   # set NEXT_PUBLIC_STAYSHAY_WHATSAPP
npm run dev                            # http://localhost:3000  (use -p 3210 if Cursor holds 3000)
npm test                               # core search / phone / inquiry tests
npm run typecheck && npm run build
```

## Test data (homebook)

Private testing only, on homebook.ae data used with the owner's permission. The whole site is `noindex`.

```
node scripts/import-homebook.mjs            # listings + photos → packages/core/src/data/homebook.json, apps/web/public/hb/ (gitignored)
node scripts/import-homebook.mjs --no-images
```

Phone numbers, emails and links are stripped from descriptions; every inquiry goes through Stayshay's WhatsApp.

## Pages

- `/` home: two-path hero (find a place / list your place), categories, listing rails, how it works for renters and owners, trust, areas, FAQ, final CTA
- `/search` list + sticky map (area clusters → price pins, hover sync, preview card); `?type=&area=&max=&view=map`
- `/listing/[id]` one page per listing: photo grid + viewer, all details, location map, 3-step viewing funnel, similar places
- `/find` tenant funnel (5 steps, live match count, matches + WhatsApp hand-off) → `POST /api/lead`
- `/list` owner funnel (5 steps, market rent guidance, listing preview) → `POST /api/lead`

## What the landing does

- Location search: typo-tolerant (`barsa` → Al Barsha 1), aliases (JLT, DSO), Arabic names, metro stations, "Near me".
- Filters: type, budget, move-in, gender, bills, deposit, commission, metro ≤10 min, verified only. All synced to the URL, so every search can be shared and deep-linked (`?area=jlt&type=bed_space`).
- Map: real listing pins from the source (area centre when missing), greyscale OSM tiles.
- Viewing requests are logged via `POST /api/inquiry`, then WhatsApp opens prefilled with ref, name, move-in and budget.

## Before launch

- Replace the homebook test data with Stayshay's own listings before any public launch.
- Set `STAYSHAY_INQUIRY_WEBHOOK` (n8n / Supabase function), or inquiries only reach server logs.
- Map tiles: OSM's public server is for light use; set `NEXT_PUBLIC_MAP_TILES` to a keyed provider before real traffic.
- Listing photos are homebook's (permission for testing). Unsplash is only a fallback for area tiles.
- Legal to confirm the shared-housing law details (Dubai Law No. 4 of 2026, effective date) used in the FAQ and trust copy.
- Arabic site (`/ar`, RTL) and the programmatic SEO pages (`/bed-space/{area}`) are not built yet.

## Phase 2 (see docs/landing-brief.md §10)

Lister dashboard · renter profile + UAE PASS / Emirates ID verification · deposit escrow via a licensed
payment partner · listing statuses (`draft → pending_review → live → reserved → rented → expired`, `reported`) · admin review queue.
