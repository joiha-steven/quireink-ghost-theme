# What a template may do

The markup is Quire Ink's, element for element and class for class, because the stylesheet this
theme ships is Quire Ink's and it binds to those names. Where Ghost wants a helper the helper
goes in; where it wants a different shape, the shape here wins.

## Use the engine's name

The sheet already carries `.listing-head`, `.pager`, `.empty`, `.rail-row`, `.post-info`,
`.tl-year` and a few hundred more. A name it does not carry renders perfectly and is styled by
nothing — which is how the sibling WordPress port shipped `link-plain` on every listing headline
and gave every headline on the page a link underline.

[`check:classes`](../../tools/checks/dead-classes.ts) reads every class the templates and
`ghost-bridge.js` print and requires each to reach a rule — **or** to be a name the engine
itself prints. `.byline`, `.info-terms`, `.term-list` and `.taxo-rule` are in the engine's
markup and in none of its rules: semantic hooks, styled by the block around them. That list is
read out of the engine's source rather than typed here, so a name it drops stops being allowed
on the next run.

## Handlebars cannot do three things, and they all live in one file

Ghost gives a template no state, no way to read the HTML it just printed, and no server side at
all. Three things follow, and all three are in
[`assets/js/ghost-bridge.js`](../../quire-ink/assets/js/ghost-bridge.js):

| | Why it cannot be a template |
|---|---|
| The contents rail | Ghost gives headings no ids, and a template cannot read `{{content}}` after printing it |
| The listing timeline | Grouping consecutive posts by year is state |
| The word count | Ghost stores reading time and not a count |

Both DOM passes are called from an inline `<script>` **beside the markup they complete**, while
the parser is still there. That is not a preference: the sheet's three-column layout keys off a
`.rail` being present, and a rail that arrives after first paint is a page that moves under the
reader.

## Do not add a second implementation of something the bundles already do

`core.js` and `post.js` are the engine's own, copied byte for byte, and `check:generated`
compares them with it. When they want something Ghost does not have, the request is
**intercepted** — [ADR 0005](../decisions/0005-shim-not-fork.md) — never worked around by
rewriting the island.

## Helpers that turned out to matter

* `{{!< default}}` on the **first line** of every template. Without it Ghost renders the
  template with no layout at all: no `<html>`, no `<head>`, no stylesheets, and a page that
  looks like a stylesheet failed to load rather than like a missing directive.
* A **new** `.hbs` file needs Ghost restarted or the theme re-activated. Edits to an existing
  template are live on the next request; a new template silently falls back to `index.hbs`.
* `{{#match a "!=" b}}` for comparisons. `{{#has}}` does not take arbitrary values, and a
  subexpression like `(match …)` is not something to rely on.
* `@site.comments_enabled` is a **boolean** on Ghost 5, not the `off`/`all`/`paid` string the
  admin screen suggests. Matched against `"off"` it is never equal, so the section rendered on
  every article with an empty thread inside it.
* `{{#is "home"}}` is page 1 of the index and not `/page/2/`, which is what makes the lead
  post's `h1` land exactly once.

## Escaping

Handlebars escapes `{{value}}` by default. `{{{triple}}}` does not, and the only ones in this
theme are `{{{body}}}` in `default.hbs` and Ghost's own `{{content}}` — both of them Ghost's
own rendered output. Anything else printed with three braces needs a reason written beside it.
