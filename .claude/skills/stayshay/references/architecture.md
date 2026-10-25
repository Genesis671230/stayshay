# Architecture

## Data (file store, `apps/web/lib/store.ts`)
All JSON files in `STAYSHAY_DATA_DIR`, written atomically (tmp + rename) through a per-file queue. One server only; move to Postgres/Supabase before scaling out.

| File | Owner module | Notes |
| --- | --- | --- |
| `listings.json` | store | Admin- and owner-created listings (`SS1001…`). `status`: `pending_review` → `live` / `draft` / `reserved` / `rented` |
| `overrides.json` | store | Availability for ANY listing incl. imported ones (`status`, `bedsAvailable`) |
| `leads.json` | store | Inbox: `inquiry` (viewing), `tenant` (find-me-a-room), `owner`, `roommate`, `chat`; status new/contacted/matched/closed; `userId`/`email` when signed in |
| `tenancies.json` | store | Listing ↔ tenant for N months; ending one frees beds |
| `announcements.json` | store | One active → site banner + app card |
| `users.json` | `lib/auth.ts` | email + scrypt password and/or Google `sub`; phone required to finish profile |
| `roommates.json` | `lib/roommates.ts` | Public board profiles: `pending` → `approved`/`hidden`; photo cropped 600² by sharp |
| `chats.json` | `lib/agent.ts` | Shay conversations, append-only API history + transcript |
| `uploads/` | — | Served by `/api/media/[...path]` (files added after build aren't served from `/public`) |

Imported test catalogue: `packages/core/src/data/homebook.json` → `LISTINGS` (static import). `getAllListings()` = admin listings + imported, overrides applied, **live only, `listerPhone` stripped**.

## Listing lifecycle
owner submits (`/list` web or app List tab → `POST /api/listings/submit`, ≥1 photo, sharp-normalised, rate-limited 6/h/IP, honeypot) → `pending_review` + `owner` lead → admin **Approve & publish** (`POST /api/admin/availability {status:"live"}`) or Reject (`draft`) → live listing → **Assign tenant** (`POST /api/admin/tenancies`) hides it when no beds left → **End tenancy** makes it live again. Admins can preview non-public listings at `/listing/<id>`.

## Public APIs
`GET /api/listings` (feed for the app; absolute photo URLs via Host/`PUBLIC_BASE_URL`), `GET /api/roommates`, `GET /api/announcement`, `GET /api/activity` (real events), `POST /api/inquiry`, `POST /api/lead`, `POST /api/roommates` (multipart), `POST /api/listings/submit` (multipart), `GET/POST /api/agent`, `/api/auth/*`.

## Admin APIs (cookie from `ADMIN_PASSWORD` or signed-in `ADMIN_EMAILS` account; `lib/admin-guard.ts`)
`/api/admin/login`, `/api/admin/listings` (create/edit/delete own listings + photos), `/api/admin/availability`, `/api/admin/tenancies` (POST assign, PATCH end/renew/reminded), `/api/admin/leads` (PATCH status/note), `/api/admin/roommates` (PATCH approve/hide), `/api/admin/announcements`.

## Auth (`lib/auth.ts`)
Email+password (scrypt) and Google OAuth code flow (ID token checked via Google tokeninfo: aud, iss, email_verified). Session = signed cookie `ss_session` (`uid.exp.hmac`, `SESSION_SECRET`, 60 days). Google users without phone → `/account?complete=1`. `QuickSignIn` component offers Google only at commitment points and restores drafts from `sessionStorage` after the round trip.

## Shay (AI) — `lib/agent.ts`, design in `docs/SHAY.md`
Claude `claude-opus-5-5`, `output_config.effort: "low"`, server-side refusal fallback (`betas: ["server-side-fallback-2026-07-01"]`, `fallbacks: "default"`), manual tool loop (≤6 steps), tools: `search_listings`, `get_listing`, `nearby_areas`, `save_contact`, `request_viewing` (all `strict: true`). Context (signed-in details, nearest area from browser location, current listing) is appended to the user turn — history stays append-only. Replies return `cards` for listings named in the text. 30 msgs/10 min/IP, 40 turns/chat. No key → widget runs the guided finder (type → budget → area/near me → real cards).

## Shared core (`packages/core`)
Mobile imports **subpaths** (`@stayshay/core/src/search.ts` etc. via `apps/mobile/lib/core.ts`) — the package index statically imports test data and must not be bundled into the app.
