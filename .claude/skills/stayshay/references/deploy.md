# Deploy (web)

## Server
- SSH host alias `qumak-ec2` (3.29.98.3, Ubuntu 24.04, 2 GB RAM + 2 GB swap). Key `~/.ssh/qumak-key.pem` (in `~/.ssh/config`).
- Node 24 via nvm: `export PATH=$HOME/.nvm/versions/node/v24.21.0/bin:$PATH` in every ssh command.
- Shared box. **Do not touch**: `ramza-app` (pm2, :3000, ramzaworks.com), `tmmt-backend` (:5002, api.tmmt.ae), `qumak-backend`/api.qumak.io, their nginx sites and certs.

## Stayshay layout on the server
| What | Where |
| --- | --- |
| Code | `~/workspace/stayshay` (git clone of `main`) |
| Data (survives deploys) | `~/workspace/stayshay-data` = `STAYSHAY_DATA_DIR`: `listings.json`, `leads.json`, `users.json`, `roommates.json`, `tenancies.json`, `overrides.json`, `announcements.json`, `chats.json`, `uploads/` |
| Env | `apps/web/.env` (mode 600). **Only `apps/web/.env` is read** — a root `.env` exists but Next ignores it. Backups: `apps/web/.env.bak-*` |
| Process | pm2 `stayshay` → `npm run start -- -p 3210 -H 127.0.0.1` (cwd `apps/web`) |
| nginx | `/etc/nginx/sites-available/stayshay` → symlink in `sites-enabled`; `client_max_body_size 30m`; certbot-managed SSL + http→https |
| TLS | Let's Encrypt cert `stayshay.com` + `www`, auto-renew via `certbot.timer` |
| DNS | Cloudflare (proxied). HTTP-01 works through the proxy. |

## Env vars (`apps/web/.env`) — names only; values live on the server
`ADMIN_PASSWORD`, `ADMIN_EMAILS` (comma list; Google/email accounts with admin), `SESSION_SECRET` (32+ chars), `STAYSHAY_DATA_DIR`, `PUBLIC_BASE_URL=https://stayshay.com`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` (redirect URI `https://stayshay.com/api/auth/google/callback`), `ANTHROPIC_API_KEY` (Shay; absent → guided mode), optional `STAYSHAY_INQUIRY_WEBHOOK`, `NEXT_PUBLIC_HERO_VIDEO`, `NEXT_PUBLIC_MAP_TILES`.

Edit safely:
```bash
ssh qumak-ec2 'cd ~/workspace/stayshay/apps/web && cp .env .env.bak-$(date +%s) && sed -i "/^KEY=/d" .env && echo "KEY=value" >> .env && chmod 600 .env && export PATH=$HOME/.nvm/versions/node/v24.21.0/bin:$PATH && pm2 restart stayshay --update-env'
```
Never echo secret values back; list names with `grep -o "^[A-Z_]*=" .env`.

## Deploy
`./scripts/deploy.sh` = `git pull --ff-only` → `npm ci -w @stayshay/web -w @stayshay/core --include-workspace-root` (skips the heavy mobile deps) → `NODE_OPTIONS=--max-old-space-size=1280 npm run build` → `pm2 restart stayshay --update-env` → curl checks.
- If `git pull` refuses because of local edits on the server: inspect `git diff`, then `git stash push -m "…"` (never discard). A stash from 2026-10-25 holds someone's debug `console.log` of the admin password — don't pop it.
- `--data` rsyncs `homebook.json` + `public/hb/` (gitignored test catalogue).

## Verify after deploy
```bash
for p in / /search /roommates /list /login /admin /api/listings /api/activity; do curl -s -o /dev/null -w "$p %{http_code}\n" https://stayshay.com$p; done
curl -s https://stayshay.com/api/auth/me      # {"google":true} when Google is configured
curl -s https://ramzaworks.com -o /dev/null -w "%{http_code}\n"   # neighbours still fine
ssh qumak-ec2 'sudo nginx -t'
```

## First-time setup of a new nginx site (pattern used)
```nginx
server { listen 80; server_name example.com www.example.com; client_max_body_size 30m;
  location / { proxy_pass http://127.0.0.1:3210; proxy_http_version 1.1; proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade"; proxy_set_header Host $host; proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for; proxy_set_header X-Forwarded-Proto $scheme;
    proxy_set_header X-Forwarded-Host $host; } }
```
then `sudo ln -sf … sites-enabled/ && sudo nginx -t && sudo systemctl reload nginx && sudo certbot --nginx -d example.com -d www.example.com --non-interactive --agree-tos --redirect`.
