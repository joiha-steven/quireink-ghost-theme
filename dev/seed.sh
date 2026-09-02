#!/usr/bin/env bash
# Owner account, theme activated, ten posts across three years, one page, a menu.
set -euo pipefail
exec python3 "$(dirname "$0")/seed/seed.py"
