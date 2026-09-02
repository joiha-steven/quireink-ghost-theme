# 0004 — Ghost's comment thread, not the engine's

**DECIDED, 2026-09-02. In force.** The article page renders `{{comments}}`. Quire Ink's own
comment island never mounts.

## The decision

`post.js` mounts the engine's comment island on an element with `id="comments"`, and
`post.hbs` deliberately does not print that id — the section is `id="post-comments"`. So the
island finds nothing, starts nothing, and asks `/api/comments` for nothing.

Every `comment*` string is also left out of the `data-` labels on `<body>`, for the same
reason the WordPress port leaves them out: supplying them would put words on the page for
machinery that is not running.

## What was weighed

The engine's comment system is good, and it is the engine's: sign-in, replies, moderation,
notification mail, spam guards, a deletion flow. Ghost has all of the same things, built into
the platform, tied to Ghost's own members, and moderated from Ghost's admin.

Wiring the island to Ghost's `/members/api/comments/` would mean owning the half of that
surface Ghost already owns — and owning it from a theme, which has no server to hold a session
or a rate limit. The first wrong version of it would look like it worked.

## The cost, stated

Ghost renders its thread in an **iframe**, so nothing inside it can be styled by this theme.
A reader who has just read an article in Literata at 672px, on their chosen palette, meets a
comment box drawn in Ghost's own type and Ghost's own greys. The theme gives the frame around
it the page's measure and a rule above it, and that is as far as it can reach.

That seam is real and it is the price. It is a smaller price than a half-built comment system.
