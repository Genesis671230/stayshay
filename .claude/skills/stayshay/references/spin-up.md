# Spin up a copy (new brand / city / market)

1. **Fork** the repo; rename in `packages/core/src/brand.ts` (`BRAND.name/domain/tagline/supportEmail/whatsapp`), `apps/web/app/layout.tsx` metadata, `apps/mobile/app.json` (name, slug, scheme, bundle ids), `eas.json` API URLs.
2. **Areas**: replace `packages/core/src/data/areas.json` (slug, name, nameAr, emirate/region, lat, lng, nearMetro, aliases). Search, maps, Shay's `nearby_areas` and notifications all read it.
3. **Brand look**: palette tokens in `apps/web/app/globals.css` (`:root` + `@theme inline`) and `apps/mobile/lib/theme.ts`; Shay gradient colours in `components/shay.tsx` (web + app) and `public/brand/stayshay-mark.svg`; regenerate icons with `node apps/mobile/scripts/make-icons.mjs`.
4. **Catalogue**: start empty (`scripts/ensure-data.mjs` writes a stub) and let owners submit via `/list`, or write an importer like `scripts/import-homebook.mjs` (only with the source owner's permission; keep data gitignored).
5. **Server**: new pm2 name + free port + nginx site + certbot (deploy.md pattern). Separate `STAYSHAY_DATA_DIR` per brand.
6. **Env**: `ADMIN_PASSWORD`, `ADMIN_EMAILS`, `SESSION_SECRET`, `PUBLIC_BASE_URL`, Google OAuth client (new redirect URI), `ANTHROPIC_API_KEY`.
7. **Shay**: adjust persona/areas/rules in `lib/agent.ts` SYSTEM prompt and `docs/SHAY.md`; legal lines (shared-housing rules) are UAE-specific.
8. **Legal pages**: `/terms`, `/privacy` mention UAE law and Anthropic/Google processing — update per jurisdiction.
9. **App**: `npx eas-cli init` under the new Expo account, then preview build.
