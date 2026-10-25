#!/usr/bin/env bash
# Deploy Stayshay to the EC2 box (ssh host "qumak-ec2"): pull main, build the website, restart only the
# "stayshay" pm2 process (port 3210). Other apps on the server (ramza-app, tmmt-backend, qumak) are not touched.
#   ./scripts/deploy.sh            # code only
#   ./scripts/deploy.sh --data     # also sync local test listings + photos (gitignored)
set -euo pipefail
HOST=${STAYSHAY_HOST:-qumak-ec2}
ROOT=$(cd "$(dirname "$0")/.." && pwd)

if [[ "${1:-}" == "--data" ]]; then
  rsync -az "$ROOT/packages/core/src/data/homebook.json" "$HOST:workspace/stayshay/packages/core/src/data/"
  rsync -az --delete "$ROOT/apps/web/public/hb/" "$HOST:workspace/stayshay/apps/web/public/hb/"
fi

ssh "$HOST" 'set -e
  export PATH=$HOME/.nvm/versions/node/v24.21.0/bin:$PATH
  cd ~/workspace/stayshay
  git pull -q --ff-only
  npm ci -w @stayshay/web -w @stayshay/core --include-workspace-root --no-audit --no-fund --loglevel=error
  NODE_OPTIONS=--max-old-space-size=1280 npm run build > /tmp/stayshay-build.log 2>&1 || { tail -30 /tmp/stayshay-build.log; exit 1; }
  pm2 restart stayshay --update-env > /dev/null
  sleep 4
  curl -s -o /dev/null -w "local: %{http_code}\n" http://127.0.0.1:3210/
  git log --oneline -1'
curl -s -o /dev/null -w "https://stayshay.com: %{http_code}\n" https://stayshay.com/
