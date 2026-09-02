# Security Policy

## Reporting a vulnerability

**Please do not open a public issue for security problems.**

Report privately through GitHub's **Report a vulnerability** (Security → Advisories on this
repository). If that is unavailable, open a minimal public issue asking a maintainer to make
private contact — without any exploit detail.

Include what you can: the theme version, the Ghost version, a description, reproduction steps,
and the impact you foresee.

## What this is, and what it can and cannot do

A Ghost theme is Handlebars templates and static files. **It has no server side**: no route, no
database access, no session, no place to put a secret. Ghost renders it, and everything the
theme can reach is what Ghost hands a template.

That shape means most of the usual surface does not exist here. What is left:

**Reports we care about**

* Anything the theme prints unescaped that a non-owner can influence. Handlebars escapes
  `{{value}}` by default; the only unescaped output in this theme is `{{{body}}}` in
  `default.hbs` and Ghost's own `{{content}}`, both of which are Ghost's rendered output.
* A way to make `assets/js/ghost-bridge.js` do something other than what it documents. It wraps
  `fetch` and `sendBeacon` and answers three paths from Ghost's own APIs; anything that turns
  that into a request somewhere else is a real finding.
* Data leaving the reader's browser to a third party. The theme's claim is that it fetches
  nothing from anyone else, and a counter-example is a bug even if it is only a font.
* A theme setting that reaches a page in a way its type does not allow.

**Not vulnerabilities**

* Anything the site owner does deliberately — code injection, custom CSS, an SVG upload. Ghost
  gives the owner those, and the owner is trusted.
* Ghost's own behaviour, including Portal and its search script, which load from
  `cdn.jsdelivr.net` on every page whether or not a theme uses them. That is Ghost's to change
  and is measured in [`docs/gaps.md`](docs/gaps.md); report it to Ghost.
* Content a reader can see because the owner published it.

## Fixes

There is no long-term-support branch. A fix ships as a new version of the theme, and the theme
is a zip somebody re-uploads — so a security fix here is only real once site owners have been
told, which is what the changelog and the release notes are for.
