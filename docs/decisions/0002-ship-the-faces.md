# 0002 — Six faces in the theme, not Ghost's font picker

**DECIDED, 2026-09-02. In force.** The theme ships its own typefaces and does not implement
Ghost's custom-font setting. `gscan` warns about this on every run and the warning is accepted
by name in `tools/checks/gscan.ts`.

## The decision

Ghost's design settings offer the site owner a font picker. A theme "supports" it by rendering
`@site.heading_font` and `@site.body_font`, and Ghost then serves those faces — from a font
host, as a request to a third party on every page load.

This theme does not. Twenty-one `.woff2` files ship inside it, cut to Latin, Latin Extended and
Vietnamese; each face declares the characters it covers, so a browser fetches four of them.
Nothing on the page is fetched from anyone else.

## What is being weighed

Reading comfort is the product here, and the six faces are not decoration around the design —
they are the design, together with the measure and the palette. A picker that lets an owner put
any face into the reading column is a picker that lets them undo it.

Against that: an owner who wants their own face has to fork, and the theme wears a permanent
gscan warning.

**And the third-party request is the part that settles it.** The theme's claim is that a
stranger on a weak signal is waiting for the words and nothing else. A font host in the
critical path makes that claim false, and it would be false on every page of every site
running this theme — not only on the sites whose owner used the picker, because Ghost injects
the preconnect either way.

## What would change it

Ghost serving picked faces from the site's own origin. Then the argument is only about the
design, which is a smaller argument.

## Not affected

**RTL** is a different absence and a different reason — see [ADR 0003](./0003-what-ghost-cannot-express.md).
