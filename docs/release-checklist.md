# Before this goes public

Measured, not remembered. As of the last run: **`check:all` green (seven guards),
`check:live` green, `check:a11y` green — on Ghost 5 AND Ghost 6.62.** gscan reports **0 errors
and 1 warning**, and that warning is [ADR 0002](decisions/0002-ship-the-faces.md).

## Settled

**Both ends of the version floor.** `engines.ghost` says `>=5.0.0`, and a floor is a claim
about both ends: the theme has to run on the oldest Ghost it admits and on the newest one
anybody will install it on today. `dev/docker-compose.yml` is Ghost 5 on 2368;
`dev/docker-compose.ghost6.yml` is Ghost 6.62 on 2369. Every guard runs against both
(`QUIREINK_ORIGIN=http://localhost:2369 bun run check:live`), and the things most likely to
break across a major were checked by hand on 6: the search shim still finds the Content API key
on the tag Ghost injects, the card stylesheet is still same-origin, and `jsdelivr` is still the
only third-party host — which is Ghost's, not the theme's.

**The font licence.** `quire-ink/assets/fonts/OFL.txt` — SIL Open Font License 1.1 from
`openfontlicense.org/documents/OFL.txt`, under the six copyright lines taken verbatim from each
family's own distribution (Inter, JetBrains Mono, Literata, IBM Plex Mono, Source Sans, Source
Serif). This is required by the **font** licence rather than by Ghost, which is why it would
still be needed if the theme never went anywhere near a marketplace.

The extractor used to `rm -rf` that directory on every run. It sweeps only `*.woff2` now and
refuses to finish if the licence file is gone, because shipping six OFL faces without it is a
violation no check anybody runs would have reported.

**The theme licence: PolyForm Noncommercial 1.0.0** ([ADR 0001](decisions/0001-polyform-not-gpl.md)),
the engine's own. Ghost requires nothing of a theme, so nothing is given away beyond what the
engine already gives — deliberately *not* the WordPress port's answer, which paid an
irreversible price for a rule that does not exist here.

**Accessibility** has [its own page](accessibility.md) with the numbers. Seven surfaces
audited including the three that only exist after a click; every control named; one defect
found and fixed (the listing had no `h1`); one item fails and is upstream.

**The zip is one command.** `bun run zip` runs every static guard first and refuses to package
if any is red. Last build: **530 KB, 54 files, exactly one top-level directory** named
`quire-ink`, which is what Ghost takes the theme id from. It goes into `.tmp/`, which is
gitignored — a release artefact committed to the repository is a second source of truth for the
same bytes.

## Open, and only the owner can close them

* **`author.email` in `quire-ink/package.json` says `hello@quireink.com`.** gscan requires the
  field, so something had to go there, and that address was written to satisfy the check rather
  than because anybody confirmed it exists. **It is the one field in a shipped file that nobody
  has verified.** An address in a file proves nothing about an address on a server.

* **The commercial permission.** The engine carries an
  [additional permission](https://github.com/joiha-steven/quireink/blob/main/LICENSE-EXCEPTION.md)
  letting anyone run and charge for *unmodified* Quire Ink, including selling hosting on it.
  Nothing equivalent is shipped here, so as it stands this theme is noncommercial-use only, and
  somebody running a paid Ghost host cannot offer it. Extending it is a commercial decision and
  not a technical one.

* **The repository is not public.** `github.com/joiha-steven/quireink-ghost-theme` answers 404
  today. The two siblings it links to answer 200. Publishing a repository publishes what it
  used to contain as well as what it contains — the WordPress port was opened only after 22
  commits of history were read for keys, and the same read is owed here.

* **No demo.** `demo.quireink.com` is the blog engine running itself and is *not* this theme, so
  the `demo` field was removed from `package.json` rather than left pointing at a different
  product. A Ghost site running this theme would earn the field back.

## Worth doing, not required

* **A theme screenshot.** Ghost does not require one to install a theme and gscan does not ask
  for it. A marketplace submission would. `tools/shot.sh` already renders at any size against
  the seeded stack.
* **A CI run.** [`.github/workflows/ci.yml`](../.github/workflows/ci.yml) runs `check:all` on
  every push. The two browser guards are not in it: they need a Ghost and a Chrome, and a
  guard that is flaky in CI is a guard people learn to ignore.
* **Translation.** English only, as the WordPress port decided for itself. Ghost themes
  translate through `locales/*.json` and `{{t}}`; every string this theme prints is either in a
  template or generated from the engine's `locales/en.ts`, so the work is bounded and has not
  been done.

## Already done

| | |
|---|---|
| Slug and folder | `quire-ink`, matching `package.json`'s `name`, which is what Ghost uses as the theme id |
| Templates | `default`, `index`, `post`, `page`, `tag`, `author`, `error-404`, plus eight partials |
| Theme settings | nine, in Ghost's own design panel, documented in [`appearance.md`](appearance.md) |
| Ghost features used | navigation (both), featured posts, tags, authors, feature images, excerpts, reading time, members and the sign-up card, native comments, `{{@page.show_title_and_feature_image}}` |
| Koenig cards | image (incl. wide and full), gallery, callout, toggle, bookmark, button, embed, blockquote-alt, header, signup, product, file, audio, video |
| Nothing fetched by the theme | six faces in the tree, no analytics, no font host, no avatar service |
| A first article | 121 KB — [`../README.md`](../README.md) has the breakdown, `check:filesize` re-measures it |
| Guards | seven static, two that open a browser; all nine listed in [`invariants.md`](invariants.md) |
