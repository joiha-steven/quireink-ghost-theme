# Quire Ink for Ghost

The reading surface of [Quire Ink](https://quireink.com) as a Ghost theme. `quire-ink/` is the
theme; everything else exists to generate it, run it, or explain it.

**PolyForm Noncommercial 1.0.0** ([ADR 0001](./docs/decisions/0001-polyform-not-gpl.md)) — the
engine's own licence, because Ghost, unlike WordPress.org, requires nothing of a theme. Do not
"align" this with the sibling WordPress port, which is GPL for a reason that does not apply here
and paid a price to be.

## Verify

```
bun run check:all
```

Seven static guards — `filesize` · `order` · `bridge` · `contrast` · `classes` · `generated` ·
`gscan`. Seconds, offline. `check:generated` skips with a warning when there is no Quire Ink
checkout beside this one.

```
bun run check:live
```

The eighth, and the only one that opens the page: it needs `dev/up.sh` and drives a real
browser, so it is deliberately not in `check:all`. It measures the two things nothing static
can see — that no rule the theme ships was thrown away by the parser, and that the wide figure
sits where the engine puts it on both sides of the rail breakpoint.

`check:all` proves the seams hold. It cannot tell you the rail is empty, a figure crosses the
rail it is supposed to stop beside, or the search overlay answers "no matching posts" to every
query. All three happened here and all three passed every static check.

```
dev/up.sh                  # Ghost on http://localhost:2368, first run about a minute
dev/seed.sh                # owner, theme activated, 10 posts across 3 years, a page, a menu
dev/down.sh                # throws the database away

tools/shot.sh <url> .tmp/shots/<name>.png [w] [h]
bun tools/measure.ts <url> <width> '<expression>'
```

**Open the page. Then measure it.** `shot.sh` answers "does this look right"; `measure.ts`
answers "is it the number it is supposed to be". The wide figure needed both: it looked
plausible in a screenshot and was 58px narrower on each side than it should have been, because
a `margin` shorthand in `bridge.css` had zeroed the alias sheet's negative side margins.

## Read first

| Doing | Read |
|---|---|
| Anything at all | [`docs/invariants.md`](./docs/invariants.md) — the 7 load-bearing rules |
| Going against a past decision | [`docs/decisions/`](./docs/decisions/README.md) |
| Wondering what does not survive | [`docs/gaps.md`](./docs/gaps.md) |
| Taking something new from the engine | [`tools/extract.ts`](./tools/extract.ts) — the comments are the convention |

## Debug router — a symptom, and the files to open first

| Symptom / area | Read these first |
|---|---|
| A colour, size or breakpoint is wrong | `tools/extract.ts`, then the engine's `src/web/*.css.ts` — never edit the generated CSS |
| A Koenig card looks wrong | `quire-ink/assets/css/bridge.css`, then `quireink-alias.css` (generated) |
| A wide figure sits wrong beside the rail | `quireink-alias.css` — the rules under `@media (min-width:1272px)` come from the engine's `singleRailCss()`, which is in the GENERATED half |
| The contents rail, the timeline, the word count | `quire-ink/assets/js/ghost-bridge.js` — all three are built there, before first paint |
| Search, sign-up or tracking | the fetch shim in `ghost-bridge.js`, and [ADR 0005](./docs/decisions/0005-shim-not-fork.md) |
| An article's furniture — byline, tags, read next | `quire-ink/post.hbs` |
| The listing page | `quire-ink/index.hbs`, `quire-ink/partials/list-row.hbs` |
| A block looks unstyled although its class is spelled right | `bun run check:classes` first — the sheet usually has it under the engine's own name |
| A theme setting | `quire-ink/package.json`, `config.custom` |
| Strings the reader JS puts on screen | `quire-ink/partials/generated-labels*.hbs` — GENERATED, change them upstream |
| Ghost complains on upload | `bun run check:gscan` |

## Hard rules — each one is a bug that already shipped, here or next door

- **Quire Ink is READ ONLY.** `../quireink` is a released product with production instances.
  Read it with ABSOLUTE paths and never `cd` into it: the shell keeps its working directory
  between commands, so a later write lands in the wrong repository. The sibling repo did this
  once and the symptom lies — the file it wrote passes a syntax check while `ls` says it does
  not exist.
- **`../quireink-wordpress-theme` is READ ONLY too**, and for a second reason: it is GPL and
  this is not. Read it for how a problem was solved; copy no file out of it.
- **Never hand-copy a value out of the blog engine.** It comes through `tools/extract.ts` or it
  does not come. One marked exception, and it carries its own assertion.
- **`bridge.css` translates, it never decides.** No hex, no colour function, no length that is
  not `0`/`1px`/`2px`/`100%`. Prefer generating an alias rule over writing a new one.
- **The alias generator reads BOTH halves of the sheet — the static one AND the generated
  tokens.** The engine puts its rail-aware geometry in the generated half, so scanning only
  `PUBLIC_CSS` silently drops it and the wide figure crosses the rail. Every measurement of it
  still comes out symmetric, which is why `check:live` exists.
- **Use `margin-block`, never the `margin` shorthand, on anything that is also a `.kg-width-*`.**
  A shorthand writes `margin-left:0` at the same specificity as the generated alias and, coming
  later, wins.
- **Anything `ghost-bridge.js` reads out of the document is read on FIRST USE, not at load.**
  That file is blocking and above `{{ghost_head}}`, so at load time Ghost's own script tags do
  not exist yet. Reading the Content API key early made every search return nothing, silently.
- **`localhost:2368`, never `127.0.0.1:2368`.** Ghost writes its asset URLs against its
  configured `url`; on any other host CORS refuses every module script and every font, and the
  type falls back to something close enough that nobody looks twice. `tools/shot.sh` and
  `tools/measure.ts` both refuse the wrong origin.
- **The zip's FILENAME is the theme id.** Not `package.json`. `bun run zip` writes
  `quire-ink.zip` for that reason; a version in the name installs a second theme instead of
  upgrading the one that is there.
- **A theme upload cannot replace the dev stack's bind-mounted `quire-ink`.** Ghost answers 500,
  and it is the mount rather than the theme: the same zip installs and activates cleanly on a
  Ghost with nothing mounted. Test an upload on a throwaway instance, not on `dev/up.sh`.
- **A new `.hbs` file needs Ghost restarted or the theme re-activated.** Edits to an existing
  template are live on the next request; a NEW template is not registered until Ghost re-reads
  the theme, and the symptom is that your page silently falls back to `index.hbs`.
- **Never quote the owner** — not in code, comments, docs, ADRs or commit messages. State the
  fact or the measurement.
- **All scratch goes under `.tmp/`** — one gitignored root, never a new one.

## Danger zones

- **`quire-ink/assets/css/quireink-{base,ide,tokens,alias}.css`, `assets/fonts/`,
  `assets/js/{core,post}.js`, and `partials/generated-*.hbs` are GENERATED.** Editing them is
  not wrong so much as pointless: the next extract overwrites them and `check:generated` is red
  until it does.
- **The blog engine moves.** A red `check:generated` is the seam reporting, not a failure.
  Re-run `bun run extract` and READ the diff before committing it.
- **`dev/down.sh` throws the database away.** Nothing in that stack is worth keeping.
