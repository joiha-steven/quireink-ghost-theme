# Accessibility: what was measured, and the one thing that fails

Measured on the local stack, on Ghost 5 and Ghost 6.62, in September 2026. Numbers rather than
intentions — every line here came out of a script, and both scripts are checks that run rather
than things somebody once did.

**One thing fails.** It is named at the bottom, it is measured, and it is not this repository's
to fix.

## Colour, all six palettes, both schemes

[`check:contrast`](../tools/checks/contrast.ts) reads the palettes out of the blog engine and
computes WCAG contrast against each palette's own background — 60 colours, twelve
combinations — and it is part of `check:all` rather than a thing somebody once ran. The
palettes are generated, so a re-extract can walk a ratio under the line with nothing on screen
looking different.

| Role | Floor | Worst measured |
|---|---|---|
| Body text | 4.5:1 | **10.22:1** (sepia, light) |
| Headings | 4.5:1 | **13.83:1** (sepia, light) |
| Links | 4.5:1 | **5.01:1** (sepia, light) |
| Meta and captions | 4.5:1 | **5.01:1** (sepia, light) |
| Accent marks | 3:1 (non-text) | **5.01:1** (sepia, light) |

## Everything colour cannot tell you

[`check:a11y`](../tools/checks/a11y.ts) drives a real browser and audits **seven surfaces**:
the listing, an article, a page, the same article at 375px, and the three that do not exist in
the served HTML at all — book mode, the search overlay, and the theme and palette menus.

**Opening the overlays is the point, not thoroughness for its own sake.** The sibling WordPress
port audited its article page and passed; the two defects it eventually found were both
controls whose entire content is an SVG, and seven of the thirteen missing strings behind them
were inside book mode, where nothing is visible until the dialog is open. An audit that only
looks at what is on screen at rest is an audit of the easy half.

| | |
|---|---|
| Every control has an accessible name | 7 surfaces, including every button the two reader bundles build at run time |
| One `h1` per page, no heading level skipped | listing, article and page each: `h1` → `h2` → `h3`, no jumps |
| Landmarks | `header.site`, `<main id="content">`, `<nav>`, `footer.site` |
| Skip link | `.skip-link` → `#content`, and the target exists on every template |
| Focus ring | a `:focus-visible` rule reaches the page on every surface; the accent it draws with measures 5.01:1 or better in every palette |
| Images | every `img` the theme renders carries an `alt` |
| Focusable things inside `aria-hidden` | none |
| `lang` | on `<html>`, from `{{@site.locale}}` |
| Autoplay | none |

## The defect it found

**The listing page had no `h1` at all,** and opened on an `h2`. Not a control, not a colour —
the shape of the document, on the page most readers arrive at first.

The engine has the answer and it is one line of its own `types.ts`: `leadPost`, *"first post of
page 1 gets the h1 role instead of h2"*, on by default. The lead row takes the `h1` now, and a
tag or author archive — which already has a heading of its own — does not grow a second one.

Worth noting what this says about the guards. Every static check was green. The rail was there,
the classes all reached rules, the contrast cleared AA with room to spare, gscan was clean, and
the page had no top-level heading.

## The one that fails, and why it is not fixed here

**Form field borders are 1.16:1 against the page.** `--c-rule` is `#ebebeb` on `#fcfcfc` in
mono light, and 1.16–1.33:1 in all twelve palette/scheme pairs. WCAG 2.1 SC 1.4.11 asks for 3:1
on anything needed to identify a control, and the newsletter card's email field — whose only
boundary is that hairline — does not meet it.

| | Worst | Best |
|---|---|---|
| `--c-rule` against `--c-bg` | 1.16:1 (mono, light) | 1.33:1 (forest, dark) |

**It is not fixable here.** `--c-rule` is the blog engine's value, the engine draws its own
forms with the same hairline, and overriding it in `bridge.css` would be this theme deciding a
colour — which is [invariant 2](invariants.md) broken to paper over somebody else's decision.
The place to fix it is the engine, and the fix helps three surfaces rather than one.

*(The sibling WordPress port measured the same values independently and reached the same
conclusion. Two ports have now hit it, which is the argument for raising it upstream rather
than working around it a third time.)*

## What this theme does not claim

Ghost has no `accessibility-ready` tag to declare, so there is nothing to withhold. This page
is the claim: what was measured, on what, and the one thing that is wrong.
