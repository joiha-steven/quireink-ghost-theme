#!/usr/bin/env bash
# Ghost on http://localhost:2368 with the theme mounted. First run takes about a minute.
set -euo pipefail
cd "$(dirname "$0")"
docker compose up -d
printf 'waiting for Ghost'
for _ in $(seq 1 90); do
  if curl -fsS -o /dev/null http://localhost:2368/ 2>/dev/null; then
    echo " — up"
    echo "  site   http://localhost:2368        <- localhost, never 127.0.0.1"
    echo "  admin  http://localhost:2368/ghost/"
    echo "  signin owner@localhost.dev / quire-ink-dev-2026   (after dev/seed.sh)"
    echo "  theme  Settings -> Design -> Quire Ink, for the nine settings"
    exit 0
  fi
  printf '.'
  sleep 2
done
echo
echo "Ghost did not answer in 180s. docker compose logs ghost" >&2
exit 1
