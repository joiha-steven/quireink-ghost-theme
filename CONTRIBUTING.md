# Contributing

Read [`CLAUDE.md`](CLAUDE.md) first. It is the working guide, and most of it is bugs that have
already been paid for.

## The one rule that explains the others

**This theme has no design of its own.** Every visual decision was made in
[Quire Ink](https://github.com/joiha-steven/quireink) and measured there. When something looks
wrong here, the question is *which of its decisions failed to come across* — not what would look
better.

So a change that makes the page prettier is usually the wrong change, and a change that makes
`tools/extract.ts` bring across something it was missing is usually the right one.

## Before you open a pull request

```bash
bun run check:all      # seven static guards, offline, seconds
dev/up.sh && dev/seed.sh
bun run check:live     # nothing dropped by the parser, the wide figure, no overflow at 375
bun run check:a11y     # seven surfaces, including the three that only exist after a click
```

And then **open the page**. Every one of the three worst bugs in this repository's history
passed every static check that existed at the time:

| | Every check green, and | Found by |
|---|---|---|
| The search overlay | answered "no matching posts" to every query, on every page | the network panel |
| The wide figure | crossed the contents rail by 18px | somebody looking at it |
| The listing page | had no `h1` at all and opened on an `h2` | writing `check:a11y` |

A pull request that changes what a reader sees needs a screenshot (`tools/shot.sh`) or a
measurement (`bun tools/measure.ts`) in it.

## What not to do

* **Do not edit a generated file.** `quire-ink/assets/css/quireink-*.css`, `assets/fonts/`,
  `assets/js/{core,post}.js` and `partials/generated-*.hbs` are overwritten by
  `bun run extract`. Change the extractor, or change the engine.
* **Do not put a value in `bridge.css`** that is not already a Quire Ink variable. `check:bridge`
  will say so, and the place to fix it is upstream.
* **Do not write to `../quireink` or `../quireink-wordpress-theme`.** Both are read only, the
  first because it is a released product with production instances, the second because it is
  GPL and this repository is not.
* **Do not add a second implementation of something the reader bundles already do.** They are
  the engine's, copied byte for byte. When they want something Ghost does not have, the request
  is intercepted — [ADR 0005](docs/decisions/0005-shim-not-fork.md).

## Going against a decision

Write the next one. [`docs/decisions/`](docs/decisions/README.md) is in force newest last, and a
decision is re-opened by adding to that list rather than by editing the entry that stands.

The same goes for [`docs/invariants.md`](docs/invariants.md): a change that weakens an invariant
updates its guard **in the same commit**, which is what makes the weakening visible in review.

## Commit messages

State the fact or the measurement. Say what a reader would notice, and what the change cost.
Never quote the owner.
