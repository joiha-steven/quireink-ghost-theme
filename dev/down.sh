#!/usr/bin/env bash
# Throws the database away. Nothing in this stack is worth keeping, and a half-migrated
# database is the one way it could lie.
set -euo pipefail
cd "$(dirname "$0")"
docker compose down -v
