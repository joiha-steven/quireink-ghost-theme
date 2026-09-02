<!--
Anything that changes what a reader sees needs a picture or a number in it. `check:all` proves
the seams hold; it has been green on the day the listing page had no h1, on the day a wide
figure crossed the contents rail, and on the day the search overlay answered "no matching
posts" to every query.
-->

## What changes, and what a reader would notice

## Verified

- [ ] `bun run check:all`
- [ ] `bun run check:live` and `bun run check:a11y` against `dev/up.sh` — **or** they do not
      apply, and why
- [ ] Opened the page. A screenshot, or a measurement from `tools/measure.ts`, is below

## If a generated file moved

- [ ] `bun run extract` was re-run and the diff was READ, not just committed
- [ ] The invariant or decision this weakens is updated in **this** commit
