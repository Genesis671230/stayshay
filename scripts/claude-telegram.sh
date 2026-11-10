#!/usr/bin/env bash
# Runs a Claude Code session in this repo that you drive from Telegram (@stayshay_manager_bot).
# It lives in a screen session called "stayshay-tg" (screen ships with macOS) and keeps the Mac awake while it runs.
#
#   ./scripts/claude-telegram.sh          start (or say it's already running)
#   ./scripts/claude-telegram.sh attach   watch / type into it from this Mac (detach: Ctrl-a then d)
#   ./scripts/claude-telegram.sh stop     end it
#
# One-time setup (already done on the founder's Mac): `claude plugin install telegram@claude-plugins-official`,
# token in ~/.claude/channels/telegram/.env, your Telegram user ID in ~/.claude/channels/telegram/access.json.
set -euo pipefail
cd "$(dirname "$0")/.."
NAME=stayshay-tg

case "${1:-start}" in
  attach) exec screen -r "$NAME" ;;
  stop) screen -S "$NAME" -X quit 2>/dev/null && echo "stopped" || echo "not running"; exit 0 ;;
esac

if screen -ls | grep -q "\.$NAME[[:space:]]"; then
  echo "already running: ./scripts/claude-telegram.sh attach"
  exit 0
fi

read -r -d '' BRIEF <<'TXT' || true
You are the Stayshay operator, driven by the founder from Telegram (@stayshay_manager_bot). Reply on Telegram, not only in the terminal.
- Messages starting "Stayshay task." come from action buttons on the live-alerts bot (@Stayshay_bot). Do the task with the stayshay skill.
- Before you start, reply with a one-line plan. Use edit_message for progress on long jobs. Finish with the live link and a two-line summary.
- Deploy with ./scripts/deploy.sh only after npm test and npm run typecheck pass. Never touch other apps on the server.
- Drafts only for anything sent to other people (WhatsApp, groups, email, social). Ask before deleting data, changing secrets or spending money.
- Visit logs are on the server: ssh qumak-ec2 'ls ~/workspace/stayshay-data/visits'. Leads: ~/workspace/stayshay-data/leads.json.
- Keep Telegram replies short: plain sentences, no tables.
TXT

screen -dmS "$NAME" \
  caffeinate -dis claude --channels plugin:telegram@claude-plugins-official --permission-mode acceptEdits --append-system-prompt "$BRIEF"
echo "started. Message @stayshay_manager_bot on Telegram. Watch here: ./scripts/claude-telegram.sh attach"
