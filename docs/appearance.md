# Every knob, and what it cannot reach

The owner's map. It is a promise to the person running the site: if a control is here it
exists, and if a thing is under [What cannot be changed](#what-cannot-be-changed) then custom
CSS is the answer and not a support ticket.

**Ghost → Settings → Design → Quire Ink.** Nine controls, and what Ghost provides beside them.

## Colour

| Control | Default | What it does |
|---|---|---|
| `palette` | `mono` | Which of the six the site opens in: `mono`, `sepia`, `forest`, `ocean`, `scifi`, `amber`. All six are in the stylesheet whatever this says, so changing it costs a reader nothing. A reader who picks for themselves is remembered on their own device and always wins. |
| `reader_can_change_palette` | on | Offers the other five behind the palette control in the site bar. Off, the control does not render at all — a blog can be one palette and no widget. |
| `default_scheme` | `system` | What a first-time visitor sees before they choose: `system` follows their laptop, `light` and `dark` do not. Their own choice, once made, outranks it. |

Every palette clears WCAG AA against its own background in both schemes; the numbers are in
[`accessibility.md`](accessibility.md).

## Type and treatment

| Control | Default | What it does |
|---|---|---|
| `terminal_chrome` | on | The IDE treatment: bracketed tokens instead of icons in the site bar, numbers down the rail, `//` before a heading. Off, it is not merely hidden — the sheet is not linked, so a reader who does not want the terminal look does not download 5.6 KB of gzip for it. |
| `book_typography` | off | Indented paragraphs, justified lines, hyphenation at the break. Off by default because it is a taste and not an improvement. |

## The listing and the article

| Control | Default | What it does |
|---|---|---|
| `list_thumbnails` | `none` | Where a post's feature image goes in the list. `side` floats a small square and lets the words close up under it; `top` puts a 3:2 above them. A post without a feature image keeps exactly the layout it already had. |
| `post_feature_image` | off | Shows a post's feature image above its headline. Off by default, and deliberately: a default that switched pictures on would redesign every article a site had already published, at upgrade time, without anyone choosing it. The picture goes ABOVE the title rather than under it, because a hero under the title pushes the first sentence off a phone screen. |

## The furniture

| Control | Default | What it does |
|---|---|---|
| `show_tagline` | on | The site description, under the site name. |
| `footer_credit` | on | One line naming the theme at the foot of the page. It says **"Quire Ink theme"** and not "powered by Quire Ink": the site is running Ghost, and Quire Ink is the theme on top of it. |

## What Ghost provides, and this theme uses

| | |
|---|---|
| **Navigation** | The primary menu is the first block of the rail; the secondary menu is the line under the footer credit. |
| **Featured posts** | Marked per post in the editor, and they are what the rail's Featured block lists. |
| **Tags** | The rail's tag cloud, lowercased, no counts — a tag is a word, and thirty words each carrying a number is a table rather than a cloud. |
| **Authors** | A rail block, and only on a blog that has more than one. On a single-author blog it is a heading over the owner's own name. |
| **Feature image, excerpt, publish date, reading time** | Ghost's own fields, printed as they come. |
| **Members and newsletter** | The sign-up card at the foot of an article, and the mail control in the site bar, appear when members are enabled. |
| **Comments** | Ghost's own thread — [ADR 0004](decisions/0004-ghosts-comments.md). |
| **Accent colour** | Ghost's site accent paints its own cards; inside an article the palette's accent wins. |

## What cannot be changed

Not oversights. Each is either a decision written down, or a thing the platform does not offer.

| | Why |
|---|---|
| **The reading typeface** | Six faces ship and Literata is the one the reading column is set in. The blog engine makes this a setting and this theme does not, because Ghost's own font picker fetches from a font host and the theme's claim is that nothing is fetched from anyone else — [ADR 0002](decisions/0002-ship-the-faces.md). |
| **Density, corner radius, heading weight** | The engine's three shape knobs. They are generated into the stylesheet from its defaults; exposing them would mean shipping every combination or generating CSS at run time, and a Ghost theme cannot do the second. |
| **The pen, the highlighter, footnotes** | Koenig cannot author the markup — [ADR 0003](decisions/0003-what-ghost-cannot-express.md). |
| **A callout's background colour** | Koenig offers eight; the engine's callout is a rule down the left and no slab. Both together is the same idea said twice, and a bright panel on a dark palette — [`gaps.md`](gaps.md). |
| **Right to left** | Not built. Not refused either — [ADR 0003](decisions/0003-what-ghost-cannot-express.md). |
| **A year-by-year archive page** | Ghost has no date route without a `routes.yaml`, which is a site file and not something a theme can carry. The gutter timeline is unaffected and ships, because it points at nothing. |

## Adding a control

Ghost's theme settings are a short declarative list in `quire-ink/package.json` under
`config.custom`, and the types are `select`, `boolean`, `color`, `image` and `text`. There is
no place for a generated table the way the WordPress port has one, and no server side to
compute anything.

**Update this file in the same commit.** A knob nobody documented is a knob nobody finds.
