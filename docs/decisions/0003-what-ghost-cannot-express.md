# 0003 — Skip what Ghost cannot express

**DECIDED, 2026-09-02. In force.** Four parts of the blog engine's reading surface are not
shipped. Each is absent because Ghost gives nobody a way to author or address it, not because
it was hard.

## The pen, the highlighter, footnotes

Quire Ink's pen sheet is 273 KB of generated SVG keyed on `data-pen="0..N"` and `data-form=o`,
attributes only Quire Ink's own editor produces. Koenig has no way to write one. Shipped, it
would be 273 KB that can never match a single element on the page.

The WordPress port reached the same conclusion about Gutenberg, and reached it after shipping
the sheet for an afternoon before anybody asked who would author the markup it styles.

## Series

The engine's rail has a **Loạt bài / series** block. Ghost has tags and authors and nothing
else. Inventing a series taxonomy in a theme would put content structure in the layer that is
supposed to be about looks, and it would strand every post in it the day the owner switched
themes.

An **Authors** block stands where the engine's Categories block does, and only on a blog with
more than one author. It is the nearest thing Ghost has to a second way through the archive.

## The archive block, and the timeline that survived it

The rail's **Archive** block is a list of years, and a year is a URL. Ghost has no date route:
`/2026/` is a 404 unless the site owner installs a `routes.yaml`, which is a **site** file
uploaded in Ghost's settings and not something a theme can carry. A block of links to 404s is
worse than no block.

**The gutter timeline is not that block and it does ship** — the spine, the sticky year tag,
the month markers beside the first post of each month. It needs no routes because it points at
nothing: it is a label positioned against cards that are already on the page. The groups are
built by `quireink.timeline()` because grouping consecutive posts by year is state and
Handlebars has none; the sheet's first timeline rule is `.tl-mark,.tl-year{display:none}`, so a
reader with no JavaScript gets a plain list rather than a broken one.

## Right-to-left

The WordPress port ships a generated `rtl.css`: a mirrored diff of every directional
declaration, 13 KB raw and 3 KB gzipped, paid only by readers in an RTL locale. It ships there
because WordPress links `rtl.css` from a theme's root by itself, with no code of the theme's —
`locale_stylesheet()` on `wp_head`, after the sheets, which is exactly where an override sheet
has to land.

Ghost has no such convention. The mirror would need plumbing of its own — a locale list in the
template, a conditional link — and the flipper itself is 200 lines of the sibling repository's
GPL code, which cannot be copied into a PolyForm repository ([ADR 0001](./0001-polyform-not-gpl.md)).

So it is **not shipped, and it is not refused**. It is the one item on this list that is only
waiting for somebody to want it.
