---
name: stayshay
description: Build, run, deploy and operate Stayshay — the UAE monthly-rental marketplace (bed spaces, partitions, rooms, studios, roommates) with web (Next.js 16, stayshay.com), mobile app (Expo SDK 58), admin console, accounts (email + Google), Shay the AI assistant (Claude) and a self-serve listing flow with admin approval. Use whenever the user mentions Stayshay, stayshay.com, Shay, the roommate board, listing approval, tenancies, the EC2 deploy on qumak-ec2 port 3210, the Expo/EAS app build, or wants to spin up a copy of this rental platform for another market/brand — even if they don't name the skill.
---

# Stayshay

UAE marketplace for affordable monthly living: **"Live like it's luxury. Pay like it's shared."**
Repo: `~/Projects/startups/stayshay` → `github.com/Genesis671230/stayshay` (**public** repo, branch `main`).
Live: **https://stayshay.com** (EC2 `qumak-ec2`, pm2 `stayshay`, port 3210). App: Expo account `stayshay`.

## Map of the repo

| Path | What |
| --- | --- |
| `packages/core` | Platform-neutral domain: types, brand (`BRAND.whatsapp`), area search, filters, lead + inquiry validation, WhatsApp texts, roommate matching, listing-message parser. Tests: `npm test`. |
| `apps/web` | Next.js 16 site + admin + APIs. File store in `STAYSHAY_DATA_DIR`. |
| `apps/mobile` | Expo SDK 58 app (expo-router). Reads the web's public APIs. |
| `scripts/` | `deploy.sh` (web → EC2), `import-homebook.mjs` (test data), `ensure-data.mjs`, `normalize-photos.mjs` |
| `docs/` | `SHAY.md` (assistant persona + conversation design), `LAUNCH.md` (store publishing), `landing-brief.md` |

## Read the reference you need

- **Deploying or touching the server** → `references/deploy.md` (EC2 layout, nginx, certbot, pm2, env vars, other apps you must not touch)
- **How the system works / adding features** → `references/architecture.md` (data stores, APIs, auth, listing lifecycle, roommates, tenancies, announcements)
- **Brand, Shay character, design rules** → `references/brand.md`
- **Running the business from /admin** → `references/admin-ops.md`
- **Mobile app build + store release** → `references/app-release.md`
- **Known traps** (read before debugging) → `references/gotchas.md`
- **SEO, blog, GA4, MCP server for ChatGPT/Claude, backlinks** → `references/seo-ai.md` + repo `docs/SEO-PLAYBOOK.md`
- **Spinning up a copy for a new brand/market** → `references/spin-up.md`

## Non-negotiables

1. **Nothing user-submitted goes public without admin approval.** Owner listings arrive as `pending_review`; roommate profiles as `pending`. Approve in `/admin`.
2. **Never commit test data or secrets.** The repo is public. `packages/core/src/data/homebook.json`, `apps/web/public/hb/`, `.env*`, `.data/` are gitignored. homebook.ae data: founder confirmed on 2026-10-26 that Stayshay has permission to show it publicly (indexed, sitemap, MCP/ChatGPT/Claude). Still never commit it.
3. **Never touch other apps on the server** (ramza-app :3000, tmmt-backend :5002, qumak). Only the `stayshay` pm2 process, `~/workspace/stayshay*` and `/etc/nginx/sites-*/stayshay`.
4. **Real data only** in notifications/social proof. No fake "someone just booked".
5. **Ask for contact/login only at commitment** (booking a viewing, submitting a listing, publishing a profile) — never up front.
6. **Phone numbers never reach the public**: `getAllListings()` strips `listerPhone`; roommate cards have no phone.
7. Founder design taste: clean, premium, real photos; no Google-maps-pin logo; Shay has glowing capsule eyes, no realistic eyes, no tail.

## Everyday commands

```bash
cd ~/Projects/startups/stayshay
npm test && npm run typecheck          # core tests + both apps' types
npm run build                          # web production build (writes empty data stub if needed)
./scripts/deploy.sh                    # deploy web to stayshay.com (add --data to sync test listings/photos)
cd apps/mobile && npx expo start       # app in Expo Go (points at https://stayshay.com)
cd apps/mobile && npx eas-cli build -p android --profile preview   # shareable APK
```
