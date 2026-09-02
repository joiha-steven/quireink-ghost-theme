# Invariants

The load-bearing rules. Break one and nothing crashes — the page just quietly stops being the
thing it was copied from, and no test goes red.

Each is enforced in ONE place and pinned by a guard, all run by `bun run check:all`. A change
that weakens one updates its guard in the SAME commit, which is what makes the weakening
visible in review.

| # | Rule | Enforced at | Pinned by |
|---|---|---|---|
| 1 | **The sheets load base → ide → tokens → alias → bridge, and all of them before `{{ghost_head}}`.** The generated half is generated so that it can win: `.rail` is a slide-out drawer in the base sheet and only the computed media query in the tokens sheet promotes it into the desktop gutter | [`quire-ink/default.hbs`](../quire-ink/default.hbs) | `check:order` |
| 2 | **`bridge.css` translates, it never decides.** No hex, no colour function, no length that is not `0`/`1px`/`2px`/`100%`. A value that is not already a Quire Ink variable means the two surfaces have started to drift | [`quire-ink/assets/css/bridge.css`](../quire-ink/assets/css/bridge.css) | `check:bridge` |
| 3 | **Nothing is hand-copied out of the blog engine.** Colours, sizes, breakpoints, font stacks, the header's controls, every string the bundles show a reader, and the rules that answer a Koenig class name — all come through the extractor or they do not come. One marked exception, and it carries its own assertion: the 20px `<svg>` wrapper in `tools/extract.ts` | [`tools/extract.ts`](../tools/extract.ts) | `check:generated` |
| 4 | **Every palette clears WCAG AA against its own background.** Text at 4.5:1, accent and meta at 3:1, in all six palettes and both schemes. The colours are the engine's, so this is a tripwire on a re-extract rather than a rule about code here | the engine's `THEME_PRESETS` | `check:contrast` |
| 5 | **A class a template prints reaches a rule — or the engine prints it too.** The sheet already carries `.listing-head`, `.pager`, `.empty` and a few hundred more, and a name it does not carry renders perfectly and is styled by nothing | every template under [`quire-ink/`](../quire-ink) | `check:classes` |
| 6 | **Quire Ink is READ ONLY.** This repository imports and reads its modules and writes nothing to it | [`tools/tsconfig.json`](../tools/tsconfig.json) | nothing — procedural, see [`../CLAUDE.md`](../CLAUDE.md) |
| 7 | **Ghost's own linter is clean.** Zero errors; every warning that stands is listed by name with the decision that allows it | [`quire-ink/`](../quire-ink) | `check:gscan` |

## Why 1 is the first one

It is the bug the sibling WordPress port exists to not repeat, and the shape of it is worth
reading. Enqueued the intuitive way round — variables first, because everything reads them —
the static sheet's mobile drawer rule beats the generated desktop geometry on source order. The
rail then renders as a fixed, translated-off-screen drawer at every width. Nothing errors,
nothing logs, the HTML is correct, every element is present with the right class, and the table
of contents is simply never visible on a desktop screen. Three rounds of screenshots went past
it there.

**`{{ghost_head}}` after all five is the Ghost-shaped half of the same rule**, and it is safe
for a reason rather than by luck. Ghost injects its card stylesheet there, after everything
this theme links — but every rule this theme writes for a Koenig card is `.prose .kg-*` at
0,2,0 against Ghost's unscoped `.kg-*` at 0,1,0, so the theme wins on specificity without
needing to come later. Which leaves `{{ghost_head}}` last, so the owner's own code injection
still beats the theme, which is the correct order of authority.

## Why 3 grew

It began as "colours, sizes and breakpoints", which is where the WordPress port drew it. Three
more things moved across the line while this theme was built, each after being typed by hand
first:

* **Every label the bundles read.** `label()` in those bundles is `dataset[key] ?? ''`, so a
  key nobody supplies is not a missing translation — it is an empty string, and where that
  string is the `aria-label` of a button whose whole content is an SVG, it is a control a
  screen reader announces as "button". The key list is now parsed out of the engine's own
  `chromeLabels()` and `article.ts`, so a label added upstream arrives without anyone noticing
  it was needed.
* **The header's six controls.** Each is a contract with a bundle: the attribute the island
  looks for, the icon, and the short bracketed token the IDE chrome shows instead of the icon.
  Typed out, that row is six chances to spell an attribute nearly right and get a control that
  renders and does nothing.
* **The Koenig alias rules.** These were `classList.add()` calls in `ghost-bridge.js` until
  gscan pointed out that `.kg-width-wide` has to be styled in a Ghost theme's CSS — and behind
  that rule is a reader with JavaScript off, for whom a wide figure was not wide. The engine's
  own declarations are lifted and re-emitted under Koenig's selector now.

## Why 6 has no guard

It is a rule about what this repository does to a DIFFERENT one, and a check that ran here
could only ever look at a tree it has no business touching. The protection is procedural and
written down in [`../CLAUDE.md`](../CLAUDE.md): read with absolute paths, never `cd` into the
sibling, because the shell keeps its working directory between commands and a later write lands
in the wrong repository.
