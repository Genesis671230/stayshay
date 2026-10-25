# Gotchas (each cost real time)

- **Effects must not return values.** `useEffect(() => el.scrollIntoView({behavior:"smooth"}))` crashes in current Chrome ("destroy is not a function") because smooth `scrollIntoView` returns a Promise. Always use a block body.
- **`/public` files added after build aren't served** by `next start` → uploads go through `/api/media/...`.
- **Only `apps/web/.env` is read.** A root `.env` on the server is ignored (caused "wrong admin password").
- **`next start` must restart after a rebuild**; pm2 `restart --update-env` to pick up env changes.
- **Photo URLs in `/api/listings`** must use the request Host / `PUBLIC_BASE_URL`, not `req.url` (was `0.0.0.0`).
- **AVIF** from the source breaks older Android → `normalize-photos.mjs` converts to JPG; uploads are re-encoded with sharp.
- **homebook import**: WordPress REST `/wp/v2/properties`; coordinates in `fave_property_location` are `"lng,lat"`; price ranges in `min/max_price`; media library includes MP4s (skip non-images); fetch media in batches of 25 with a 60s timeout; Cloudflare images resize with `/w=1200,fit=scale-down`.
- **Filters must follow the URL** on client navigation (`UrlSync` with `useSearchParams` inside Suspense) or nav links don't update results.
- **Mobile must not import `@stayshay/core` index** (bundles test data) — use `apps/mobile/lib/core.ts` subpaths.
- **Tight disk on the founder's Mac** (2–6 GB free). Don't download full photo sets; Expo node_modules ~1 GB.
- **Cursor grabs localhost:3000** → run locally on 3210 (`-H 127.0.0.1`).
- **Claude API on Opus 5.5**: no forced `tool_choice`, effort default is `medium` (set `low` for chat), thinking can't be disabled, keep history append-only, `fallbacks: "default"` needs beta `server-side-fallback-2026-07-01`.
