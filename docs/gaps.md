# What does not carry over

Measured, not guessed. Everything here was found by putting the same content through Ghost and
looking at the result, or by reading what Ghost's own API answered.

## Decided, not missing

Five things are decisions and are written up where a decision belongs: the pen and footnotes,
series, the archive block, right-to-left, and Ghost's font picker —
[ADR 0003](./decisions/0003-what-ghost-cannot-express.md) and
[ADR 0002](./decisions/0002-ship-the-faces.md). The comment thread is
[ADR 0004](./decisions/0004-ghosts-comments.md).

## The "no third-party request" claim is Ghost's to keep, not the theme's

The theme fetches nothing from anyone: the six faces are in it, there is no analytics, no font
host, no avatar service. **Ghost is a different matter.** Measured on a stock Ghost 5 with this
theme active, `{{ghost_head}}` injects two scripts from `cdn.jsdelivr.net` — Portal (members)
and sodo-search — on every page, whether or not the theme uses either.

Nothing in a theme can prevent that. A self-hosted Ghost can be configured to serve them from
its own origin; a Ghost(Pro) site cannot. So the sentence a site running this theme can honestly
say is "the theme adds no third-party requests", and not "this page makes none".

The theme *uses* what those scripts bring rather than duplicating it: the search key is read
off sodo-search's own tag, and sign-up goes to the members endpoint Portal posts to.

## The newsletter cannot say "signed up, but no mail was sent"

The engine has a `pending_no_mail` state, and a label for it, because it writes the subscriber
down first and mails second. Ghost does not: with no mail server configured,
`/members/api/send-magic-link/` answers 500 with an `EmailError` and the members table is
**unchanged** — measured, on a Ghost with no mail set up.

So on a Ghost with no mail, the card reports a failure. That is the truth, and reporting
success there would tell a reader they had subscribed when nobody had recorded it.

## Word count is measured off the rendered page, not the source

Ghost stores reading time and not a word count. `{{reading_time}}` is Ghost's own number and is
printed as it comes. The count beside it is measured by `quireink.article()` — whitespace-split
of the rendered text, which is the engine's own `wordCount()` rule applied one step further
down the pipeline.

The two agree on prose. They disagree where markup carries text the source did not count, or
counts text the page does not render.

## Two things are built by script, before first paint

The **contents rail** and the **listing timeline**. Ghost gives headings no ids and a Handlebars
template cannot read the HTML it just printed; grouping consecutive posts by year is state,
which Handlebars does not have.

Both run from an inline `<script>` beside the markup they complete, while the parser is still
there, so neither arrives as a jump — the sheet's three-column layout keys off a `.rail` being
present, and a rail that arrives after first paint is a page that moves under the reader.

With JavaScript off, an article has no contents rail and a listing has no year tags. The sheet's
first timeline rule is `.tl-mark,.tl-year{display:none}`, so the fallback is a plain list rather
than a broken one. Everything else on the page — the measure, the palette, the gutters, the wide
figures — is CSS and is unaffected.

## A Koenig callout keeps its emoji and loses its colour

Ghost lets an author pick one of eight background colours per callout card, and paints it as a
fixed pastel. Given the engine's accent rule down the left as well, that is the same idea said
twice — and on a dark palette it is a bright panel in the middle of a dark page.

`bridge.css` removes the slab. The rule, the measure and the emoji stay. The author's colour
choice does not survive.

## Search reads the whole index once

Ghost's Content API has no full-text search, so the shim does what Ghost's own search does:
fetches every post's title and excerpt once, keeps them, and matches in the page. On a blog of a
few hundred posts that is one request of a few dozen KB, made only when a reader actually opens
the overlay.

On a blog of several thousand posts it will be worth revisiting.

## An open licence obligation, not a gap in the design

The six typefaces are SIL Open Font License 1.1, and the OFL asks that its text travel with the
font software. **`quire-ink/assets/fonts/OFL.txt` is not in this repository**, so shipping the
theme as it stands would be a licence violation regardless of what Ghost or anyone else checks.

It is one file: SIL's text, under a copyright block naming the six holders. It is not written
here because a licence text is not something to reconstruct from memory — it has to be copied
from the faces' own distributions.

The same obligation is open in the Quire Ink engine and in the WordPress port, both of which
ship the same six faces without it. The WordPress port's ADR 0005 describes the file as shipped;
it is not in that tree either.
