#!/usr/bin/env bash
# Photograph a page. `tools/shot.sh <url> <out.png> [width] [height]`
#
# It refuses two things, each because the same picture lied in the sibling WordPress port.
#
# THE ORIGIN. Ghost writes every asset URL against its configured `url`, which on the dev
# stack is http://localhost:2368. Ask for the same page on 127.0.0.1 and every module script
# and every font is a cross-origin fetch that CORS refuses: no JavaScript at all — so no
# contents rail, no timeline, no book mode — and the type falls back to something close
# enough that nobody looks twice. `getComputedStyle(p).fontFamily` answers `Literata` either
# way, because a computed font-family is the request and not the result.
#
# THE WIDTH. `--headless=new` opens a real window and the window has an OS minimum around
# 500px, so a 390px request comes back as a 500px layout cropped to 390 — which reads as a
# theme that overflows. Below 500 the page is photographed inside an IFRAME instead, where
# the viewport is the iframe's own size and the minimum does not apply.
set -euo pipefail

URL="${1:?usage: shot.sh <url> <out.png> [width] [height]}"
OUT="${2:?usage: shot.sh <url> <out.png> [width] [height]}"
W="${3:-1440}"
H="${4:-1000}"
CHROME="${CHROME:-/Applications/Google Chrome.app/Contents/MacOS/Google Chrome}"
ORIGIN="${QUIREINK_ORIGIN:-http://localhost:2368}"

case "$URL" in
  "$ORIGIN"*) ;;
  *)
    echo "shot.sh: $URL is not on $ORIGIN." >&2
    echo "  Ghost writes its asset URLs against that origin; on any other host CORS refuses" >&2
    echo "  every script and every font, and the picture is of a theme with no behaviour." >&2
    echo "  Set QUIREINK_ORIGIN to photograph a site that really is served elsewhere." >&2
    exit 2 ;;
esac

mkdir -p "$(dirname "$OUT")"

if [ "$W" -ge 500 ]; then
  "$CHROME" --headless=new --disable-gpu --hide-scrollbars --window-size="$W,$H" \
    --virtual-time-budget=8000 --screenshot="$OUT" "$URL" 2>/dev/null
else
  FRAME="$(mktemp -t quireink-shot).html"
  cat > "$FRAME" <<HTML
<!doctype html><meta charset="utf-8">
<style>html,body{margin:0;background:#fff}iframe{border:0;width:${W}px;height:${H}px;display:block}</style>
<iframe src="${URL}"></iframe>
HTML
  "$CHROME" --headless=new --disable-gpu --hide-scrollbars --window-size="$W,$H" \
    --allow-file-access-from-files \
    --virtual-time-budget=8000 --screenshot="$OUT" "file://$FRAME" 2>/dev/null
  rm -f "$FRAME"
fi

echo "$OUT  ${W}x${H}  $(wc -c < "$OUT" | tr -d ' ') B"
