# 0001 — The engine's licence, because Ghost does not ask for another

**DECIDED, 2026-09-02. In force.** The theme ships under **PolyForm Noncommercial 1.0.0** —
the same licence as the Quire Ink blog engine it is generated from.

## The decision

Whatever Ghost requires of a theme, and nothing given away beyond it. Ghost requires **nothing**:
there is no directory rule about licences, no submission gate that asks for one, and the
themes Ghost itself publishes are MIT because their authors chose MIT.

So the CSS in this repository keeps the licence of the CSS it is generated from.

## Why this is not the sibling's answer

The [WordPress port](https://github.com/joiha-steven/quireink-wordpress-theme) is **GPL v2 or
later**, and its ADR 0005 is worth reading before anyone changes this one. It went GPL because
the WordPress.org review handbook requires a GPL-compatible licence of a free theme, and
PolyForm Noncommercial is not GPL-compatible — so the owner put *that copy* of the look under
GPL, knowing that **a version published under GPL cannot be withdrawn**: the look became
forkable and resellable by anyone, permanently, from the moment it shipped.

That was a real price, paid for a real reason. Ghost presents no reason to pay it again, and
paying it here would extend the same irreversible grant to a second copy for nothing in return.

## What is still the owner's to decide

The engine carries an [additional permission](https://github.com/joiha-steven/quireink/blob/main/LICENSE-EXCEPTION.md)
that lets anyone run and charge for **unmodified** Quire Ink, including selling hosting on it.
Nothing equivalent is shipped here, so as it stands this theme is noncommercial-use only.

Whether to extend that permission to the theme — so that somebody running a paid Ghost host
could offer it — is a commercial decision and not a technical one. It is **open**, it is the
owner's, and it is deliberately not answered by writing a document in this repository.
