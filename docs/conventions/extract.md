# How a value gets here

It comes through [`tools/extract.ts`](../../tools/extract.ts) or it does not come.

`tools/tsconfig.json` maps `@/*` at the sibling checkout, so the extractor **runs the engine's
own emitters** rather than reading its output. Every colour, size, breakpoint, font stack,
label and icon in this theme is the value the live blog renders with, and when the blog moves,
this is re-run rather than re-read.

## What it emits

| | |
|---|---|
| `assets/css/quireink-base.css` | `PUBLIC_CSS`, less the IDE chrome, which is lifted whole into its own sheet so switching it off stops it being downloaded |
| `assets/css/quireink-tokens.css` | the palette, the type scale, the shape knobs, the `@font-face` block, the computed rail geometry and the listing timeline |
| `assets/css/quireink-alias.css` | the engine's own declarations, re-emitted under the class names Koenig writes |
| `assets/fonts/*.woff2` | the faces the default preset can reach. **`OFL.txt` is not generated** and the sweep leaves it alone |
| `assets/js/{core,post}.js` | the engine's reader bundles, byte for byte |
| `partials/generated-labels*.hbs` | every string the bundles show a reader, with the KEY LIST parsed out of the engine's source |
| `partials/generated-site-actions.hbs` | the six controls in the site bar, icons and all |

## Three rules

**Never hand-copy.** One marked exception exists — the 20px `<svg>` wrapper and the
`.btn-token` span, which live inside a function the extractor cannot import — and it carries an
assertion: the extract stops if `chrome.ts` no longer contains the markup it is copying.

**Lift, do not retype.** `IDE_CSS` is a contiguous slice of `PUBLIC_CSS` and the extractor
removes exactly that slice. If the engine ever composes the sheet differently the slice stops
matching and the extract throws, which is the seam reporting rather than a theme quietly
shipping the chrome twice.

**Parse the key list, do not type it.** `label()` in the bundles is `dataset[key] ?? ''`, so a
key nobody supplies is not a missing translation — it is an empty string, and where that string
is the `aria-label` of a button whose whole content is an SVG, it is a control a screen reader
announces as "button". The keys are read out of the engine's `chromeLabels()` and `article.ts`,
so a label added upstream arrives on the next extract without anybody noticing it was needed.

## When it goes red

`check:generated` re-runs the extractor into a temporary directory and compares bytes. **A red
result is the seam reporting, not a failure** — Quire Ink has moved. Re-run `bun run extract`
and READ the diff before committing it.

It also checks the other direction: every `partials/generated-*.hbs` has to be included by some
template. A generated file nobody references renders perfectly and does nothing, which is
exactly the failure this repository is built to make visible — and it caught one.

## The sibling is read only

`../quireink` is a released product with production instances. Read it with **absolute paths**
and never `cd` into it: the shell keeps its working directory between commands, so a later
write lands in the wrong repository, and the symptom lies.

`../quireink-wordpress-theme` is read only too, for a second reason: it is GPL and this
repository is not ([ADR 0001](../decisions/0001-polyform-not-gpl.md)). Read it for how a
problem was solved; copy no file out of it.
