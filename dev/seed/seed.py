#!/usr/bin/env python3
"""Fill the throwaway Ghost with something worth looking at, and turn the theme on.

Everything here exists to be photographed: articles long enough to have a contents rail,
dates spread across three years and several months so the gutter timeline has groups to
draw, tags, a featured post for the rail, and one article carrying the Koenig cards the
bridge stylesheet is written for.

The card markup is Ghost's own RENDERED output, pasted in as html. Ghost keeps it verbatim
in an html card, so what reaches the page is byte for byte what a card written in the editor
produces — which is the markup bridge.css is aimed at, and the only thing worth testing.
"""
import json, sys, urllib.request, urllib.error, datetime, random

BASE = "http://localhost:2368"
EMAIL, PASSWORD, NAME = "owner@localhost.dev", "quire-ink-dev-2026", "Quire Ink"
TITLE = "A blog you host yourself"

def call(path, body=None, method=None, cookie=None, raw=False):
    url = BASE + path
    data = json.dumps(body).encode() if body is not None else None
    req = urllib.request.Request(url, data=data, method=method or ("POST" if data else "GET"))
    req.add_header("Content-Type", "application/json")
    req.add_header("Accept-Version", "v5.0")
    req.add_header("Origin", BASE)
    if cookie:
        req.add_header("Cookie", cookie)
    try:
        with urllib.request.urlopen(req) as r:
            return r.headers, (r.read().decode() if raw else (json.loads(r.read() or "{}") if r.length != 0 else {}))
    except urllib.error.HTTPError as e:
        payload = e.read().decode()
        raise SystemExit(f"{method or 'POST'} {path} -> {e.code}\n{payload[:800]}")

def setup():
    try:
        call("/ghost/api/admin/authentication/setup/", {"setup": [
            {"name": NAME, "email": EMAIL, "password": PASSWORD, "blogTitle": TITLE}]})
        print("owner created")
    except SystemExit as e:
        if "already" not in str(e) and "Setup has already been run" not in str(e):
            print(str(e)[:300])
        print("owner already exists")

def login():
    headers, _ = call("/ghost/api/admin/session/", {"username": EMAIL, "password": PASSWORD}, raw=True)
    cookie = headers.get("Set-Cookie", "")
    return cookie.split(";")[0]

CALLOUT = ('<div class="kg-card kg-callout-card kg-callout-card-blue">'
           '<div class="kg-callout-emoji">\U0001f4a1</div>'
           '<div class="kg-callout-text">A callout card, which is the one card Koenig has and '
           'Gutenberg does not. The rule down its left is the engine’s; the emoji beside '
           'the words is Ghost’s.</div></div>')
BOOKMARK = ('<figure class="kg-card kg-bookmark-card">'
            '<a class="kg-bookmark-container" href="https://quireink.com/">'
            '<div class="kg-bookmark-content"><div class="kg-bookmark-title">Quire Ink</div>'
            '<div class="kg-bookmark-description">A blog you host yourself, and an AI agent can '
            'run it for you.</div>'
            '<div class="kg-bookmark-metadata"><span class="kg-bookmark-author">quireink.com</span>'
            '</div></div></a></figure>')
BUTTON = ('<div class="kg-card kg-button-card kg-align-center">'
          '<a href="https://quireink.com/" class="kg-btn kg-btn-accent">Read the manual</a></div>')
TOGGLE = ('<div class="kg-card kg-toggle-card" data-kg-toggle-state="close">'
          '<div class="kg-toggle-heading"><h4 class="kg-toggle-heading-text">What does the '
          'bridge stylesheet actually do?</h4>'
          '<button class="kg-toggle-card-icon" aria-label="Expand toggle"></button></div>'
          '<div class="kg-toggle-content"><p>It translates, and it never decides. Every value '
          'in it is a Quire Ink variable.</p></div></div>')
WIDE = ('<figure class="kg-card kg-image-card kg-width-wide kg-card-hascaption">'
        '<img class="kg-image" src="https://images.unsplash.com/photo-1519682337058-a94d519337bc?w=1400&q=70" '
        'alt="A wide photograph" loading="lazy">'
        '<figcaption>A wide figure. Beside the contents rail it stays flush with the column '
        'and noses right into the free gutter; with no rail it noses both ways.'
        '</figcaption></figure>')

LOREM = [
    "The measure is about seventy characters, and the two gutters are what is left. That is "
    "the design rather than a detail of it: below the width that holds them the gutters fold "
    "away on their own and the column takes the screen.",
    "Nothing on this page is fetched from anyone else. The typefaces are in the theme, cut to "
    "Latin, Latin Extended and Vietnamese, and each face declares the characters it covers, so "
    "a browser fetches four of the twenty-one files that ship.",
    "A reader picks one of six palettes in light or dark and the site remembers it on their "
    "own device. Every one of them clears the contrast bar against its own background, and a "
    "static check re-measures all sixty colours on every run.",
    "Reading comfort is the point. Book mode resets the article in two columns with a drop "
    "cap, sized from the window, and keeps the reader’s place when they leave it.",
    "The parts that are furniture read as furniture: the date, the count, the tags. The parts "
    "that are writing read as writing. A list of headlines is reading, not chrome.",
]

def para(n):
    return "".join(f"<p>{LOREM[i % len(LOREM)]}</p>" for i in range(n))

def article(seed):
    r = random.Random(seed)
    out = [para(2)]
    for h in ["Where the words go", "What the gutters carry", "The six palettes",
              "Book mode", "What it costs a reader"][: 3 + seed % 3]:
        out.append(f"<h2>{h}</h2>{para(2)}")
        if r.random() > .5:
            out.append(f"<h3>{h}, in detail</h3>{para(1)}")
    out.append("<blockquote><p>A quote takes a hairline down its left, and only one.</p></blockquote>")
    out.append("<pre><code class=\"language-js\">const measure = 672 // px, and the sheet reads it from a variable\n</code></pre>")
    out.append("<ul><li>One</li><li>Two</li><li>Three</li></ul>")
    return "".join(out)

POSTS = [
    ("Dùng Synology để host một cái blog, không phải WordPress", "2024-03-14", ["viết", "máy chủ"], True),
    ("The reading column, and why it is seventy characters", "2024-07-02", ["typography"], False),
    ("Six palettes, and the one that is a mistake", "2024-11-21", ["typography", "colour"], False),
    ("A year of writing in one process", "2025-01-09", ["viết"], False),
    ("What a theme owes a reader on a weak signal", "2025-02-27", ["performance"], True),
    ("Book mode, and the drop cap that took three tries", "2025-06-15", ["typography"], False),
    ("Every card Koenig can write", "2025-09-04", ["ghost", "cards"], False),
    ("The gutter timeline is CSS and nothing else", "2026-01-19", ["css"], False),
    ("Measuring what a page actually costs", "2026-04-08", ["performance"], False),
    ("Nine guards, and the three bugs they did not catch", "2026-08-30", ["viết", "css"], False),
]

def drop_welcome(cookie):
    """Ghost ships a 'Coming soon' post on a new site. It is Ghost's copy about Ghost, and it
    sits at the top of every screenshot this repository takes."""
    _, body = call("/ghost/api/admin/posts/?limit=all&fields=id,slug", cookie=cookie)
    for post in body.get("posts", []):
        if post["slug"] in ("coming-soon", "welcome"):
            call(f"/ghost/api/admin/posts/{post['id']}/", method="DELETE", cookie=cookie)
            print("removed Ghost's own welcome post")


def main():
    setup()
    cookie = login()
    print("signed in")
    call("/ghost/api/admin/themes/quire-ink/activate/", {}, method="PUT", cookie=cookie)
    print("theme activated")

    made = 0
    for i, (title, date, tags, featured) in enumerate(POSTS):
        html = article(i)
        if title.startswith("Every card"):
            html = (para(1) + CALLOUT + para(1) + "<h2>A wide figure</h2>" + WIDE
                    + para(1) + "<h2>A link, boxed</h2>" + BOOKMARK + BUTTON
                    + "<h2>Something folded away</h2>" + TOGGLE + para(1))
        body = {"posts": [{
            "title": title,
            "html": html,
            "status": "published",
            "featured": featured,
            "published_at": date + "T09:00:00.000Z",
            "tags": [{"name": t} for t in tags],
            # WHOLE SENTENCES. Sliced at a character count, every card on the front page
            # stopped mid-word — which reads as a theme that truncates badly rather than as a
            # seeder that does.
            "custom_excerpt": LOREM[i % len(LOREM)],
        }]}
        call("/ghost/api/admin/posts/?source=html", body, cookie=cookie)
        made += 1
    print(f"{made} posts")

    call("/ghost/api/admin/pages/?source=html", {"pages": [{
        "title": "Colophon",
        "html": "<h2>The type</h2>" + para(2) + "<h2>The colours</h2>" + para(2)
                + "<h3>Contrast</h3>" + para(1) + "<h2>The engine</h2>" + para(2),
        "status": "published",
    }]}, cookie=cookie)
    print("1 page")

    # A rail menu, so the first block has something in it.
    call("/ghost/api/admin/settings/", {"settings": [
        {"key": "navigation", "value": json.dumps([
            {"label": "Home", "url": "/"},
            {"label": "Colophon", "url": "/colophon/"},
            {"label": "Tags", "url": "/tag/typography/"},
        ])},
        {"key": "secondary_navigation", "value": json.dumps([
            {"label": "RSS", "url": "/rss/"},
        ])},
        {"key": "description", "value": "One process. Two SQLite files. No cloud account anywhere in the path."},
    ]}, method="PUT", cookie=cookie)
    drop_welcome(cookie)
    print("settings")
    print(f"\n  {BASE}/  —  admin {BASE}/ghost/  ({EMAIL} / {PASSWORD})")

main()
