# Five stylesheets, and only one of them may be edited

| Sheet | Where it comes from | Editable |
|---|---|---|
| `quireink-base.css` | the engine's `PUBLIC_CSS`, verbatim, less the IDE chrome | **no** |
| `quireink-ide.css` | the engine's `IDE_CSS`, lifted whole | **no** |
| `quireink-tokens.css` | the engine's emitters run against its default settings | **no** |
| `quireink-alias.css` | the engine's own declarations, re-emitted under the class names Koenig writes | **no** |
| `bridge.css` | written here, for Ghost | **yes, and only this one** |

Editing a generated sheet is not wrong so much as pointless: the next `bun run extract`
overwrites it and `check:generated` is red until it does.

## What belongs in `bridge.css`

Only what Ghost invents. Quire Ink's sheet styles the ELEMENTS inside `.prose` — `p`, `h2`,
`ul`, `blockquote`, `pre`, `table` — so most of what Koenig emits is already styled the moment
it lands in the right wrapper. What is left is the handful of places where Ghost's editor adds
a class name or an extra element the engine's markdown pipeline never produced.

**Every rule is a translation, never a new opinion.** No hex, no colour function, no length
that is not `0`, `1px`, `2px` or `100%`. A value that is not already a Quire Ink variable means
the two surfaces have started to drift, and the place to fix it is upstream.
[`check:bridge`](../../tools/checks/bridge-tokens.ts) is the guard.

## Prefer an alias to a rule

If the engine already draws the thing under a different name, **generate the alias** rather
than copy the declarations. `tools/extract.ts` lifts the engine's own rules and re-emits them
under Koenig's selector, so there is exactly one definition of what "wide" means and it stays
upstream where a re-extract keeps it current.

The alias generator reads **both halves** of the sheet — the static one and the generated
tokens. That is not a detail: the engine puts its rail-aware geometry in the generated half,
and an earlier version that scanned only the static half produced a wide figure which crossed
the contents rail by 18px while every number about it measured symmetric.

## Two mechanical rules that have each cost a bug

**`margin-block`, never the `margin` shorthand,** on anything that is also a `.kg-width-*`. A
shorthand writes `margin-left: 0` at the same specificity as the alias sheet and, coming later,
wins — leaving a figure that sits exactly inside the column while every rule that widens it
measures correct.

**Scope to `.prose`.** Ghost's card stylesheet is injected by `{{ghost_head}}`, which comes
after everything this theme links. `.prose .kg-*` is 0,2,0 against Ghost's unscoped 0,1,0, so
the theme wins on specificity rather than on order — which is what lets `{{ghost_head}}` stay
last, so the owner's own code injection still beats the theme.

## The order

`base → ide → tokens → alias → bridge`, all before `{{ghost_head}}`, wired in `default.hbs` and
pinned by [`check:order`](../../tools/checks/stylesheet-order.ts). [Invariant 1](../invariants.md)
explains what breaks silently when it is wrong.
