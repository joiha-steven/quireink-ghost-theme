# Changelog

## 0.1.0 — unreleased

The first version. The reading surface of the Quire Ink blog engine, running on Ghost content.

**What it is.** Five stylesheets, twenty-one font files, two reader bundles and eight partials,
of which one stylesheet and every template are written here and the rest are generated from the
engine by `tools/extract.ts`. A first article costs a reader 121 KB.

**What it does.** Three-column reading with the post's own contents in one gutter and its facts
in the other; six palettes in light and dark, remembered per reader; book mode; a search overlay
on `/`; a gutter timeline with a sticky year; nine settings in Ghost's own design panel.

**How Ghost's shape was answered.** A theme has no server side, so the three endpoints the
copied bundles expect are intercepted and translated to Ghost's own APIs
([ADR 0005](docs/decisions/0005-shim-not-fork.md)). The contents rail, the timeline and the word
count are built before first paint, because Handlebars has no state and cannot read the HTML it
just printed.

**Verified on Ghost 5 and Ghost 6.62**, by seven static guards plus two that open a browser.
Three bugs were found by the latter and by looking at the page: a search overlay that answered
nothing, a wide figure that crossed the contents rail, and a listing page with no `h1`.

**Not shipped, on purpose.** The pen and footnotes, series, the rail's archive block,
right-to-left, and Ghost's font picker — [`docs/gaps.md`](docs/gaps.md) and
[`docs/decisions/`](docs/decisions/README.md) have the measurement or the reason for each.

**Open before release.** Two items only the owner can close, both in
[`docs/release-checklist.md`](docs/release-checklist.md): an `author.email` nobody has verified,
and whether the engine's commercial permission extends to this theme.
