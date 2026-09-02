# 0005 — Intercept the bundles, never edit them

**DECIDED, 2026-09-02. In force.** `core.js` and `post.js` are copied out of the blog engine
byte for byte. `assets/js/ghost-bridge.js` wraps `fetch` and `sendBeacon` and answers the three
endpoints they expect.

## The problem

Those bundles are the reading experience: the palette switch, the search overlay, the rail
drawer, book mode, the lightbox, the code-copy buttons, the contents scrollspy. They were
written against a server that answers `/api/search`, `/api/subscribe` and `/api/track`.

A Ghost theme has **no server side at all** — Handlebars and static files. There is nowhere to
put a route. The sibling WordPress port had somewhere: `inc/search-api.php` answers
`/api/search` on a `parse_request` hook, precisely so the bundle would not have to change.

## The three options

1. **Fork the bundles.** Rewrite each call site to Ghost's APIs. Then the theme carries its own
   copy of book mode, and a fix upstream never arrives — the thing the WordPress port's
   `check:generated` exists to prevent.
2. **Reimplement the islands.** A second implementation of book mode is a second thing to be
   wrong.
3. **Answer the requests.** Wrap `fetch` once, before either bundle runs, and translate three
   paths. The bundles keep their own error handling and never learn they are somewhere else.

Three is the only one where a change upstream is a re-extract rather than a merge.

## What each of the three becomes

| The bundle asks for | Ghost answers with | Notes |
|---|---|---|
| `/api/search?q=` | the Content API, fetched once and matched in the page | which is what Ghost's own search does; the key is read off the tag Ghost injects for it |
| `/api/subscribe` | `/members/api/send-magic-link/` | with an integrity token where Ghost wants one |
| `/api/track` | **nothing, 204** | Ghost counts its own traffic. A theme that shipped a second collector would be collecting on the owner's behalf without the owner having asked |
| `/api/comments` | not shimmed | the island never mounts — [ADR 0004](./0004-ghosts-comments.md) |

## The bug this shape already caused, kept here because it is the shape's hazard

The shim resolves Ghost's Content API key by reading the `data-key` attribute off the script
tag Ghost injects into `{{ghost_head}}`. `ghost-bridge.js` is blocking and sits **above**
`{{ghost_head}}`, because it has to define `quireink.article()` before the inline call further
down the page reaches it — so at the moment it ran, that tag had not been parsed.

The key was `''`. Every search asked the Content API for `key=` and got 403. The overlay
opened, took focus, and said "No matching posts found." for every query, on every page. Nothing
errored and nothing logged, because the bundle's whole error handling for a failed fetch is
`if (!res.ok) return`.

It is resolved on **first use** now, which removes the ordering question rather than answering
it. Anything else this file reads out of the document should be read the same way.
