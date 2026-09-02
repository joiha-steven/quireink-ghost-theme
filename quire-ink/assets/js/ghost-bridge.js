/*
 * The only script in this theme that is not Quire Ink's own.
 *
 * `core.js` and `post.js` are copied out of the blog engine byte for byte, and
 * `check:generated` compares them with it. They were written against a server that answers
 * `/api/search`, `/api/subscribe` and `/api/track`. A Ghost theme has no server side at all —
 * Handlebars and static files, and nothing else — so those three requests can neither be
 * answered nor, without editing bundles that must not be edited, be asked differently.
 *
 * So they are INTERCEPTED. `fetch` and `sendBeacon` are wrapped once, before either bundle
 * runs, and the three paths are turned into calls Ghost does answer. The bundles keep their
 * own error handling and never learn they are somewhere else.
 *
 * The other half of this file is two DOM passes the platform makes necessary. Ghost gives
 * headings no ids and a Handlebars template cannot read the HTML it just printed, so the
 * contents rail is built here; and grouping consecutive posts by year is state, which
 * Handlebars does not have. Both are called from an inline <script> beside the markup they
 * complete, while the parser is still there and before the page is painted — a rail that
 * arrives after first paint is a page that jumps, because the sheet's three-column layout
 * keys off a `.rail` being present.
 *
 * BLOCKING, in the head, and deliberately so. It is small, it is same-origin, and both of
 * its jobs have to be done before anything else on the page happens.
 */
(function () {
  'use strict'

  // ------------------------------------------------------------------ Ghost's own keys
  //
  // The Content API key is not something a theme is given; it is on the tags Ghost injects
  // into `{{ghost_head}}` for Portal and for its own search, and reading it there is how
  // Ghost's own front-end scripts get it too.
  //
  // READ LATE, AND ONLY ONCE. This file is blocking and sits in the head ABOVE
  // `{{ghost_head}}`, because it has to define `quireink.article()` before the inline call
  // further down the page reaches it. At the moment it runs, the script tags carrying the
  // key have not been parsed yet — so reading them here returns null, and the shim asked the
  // Content API for `key=` and got 403 on every search while the overlay quietly said "no
  // matching posts". Nothing errored, nothing logged, and the only trace was an empty
  // parameter in the network panel.
  //
  // Resolving on FIRST USE removes the ordering question entirely: nothing asks until a
  // reader opens the search overlay, by which time the document is complete. It also means
  // this keeps working if the head is ever rearranged.
  var keys = null
  var ghost = function () {
    if (keys) return keys
    var tag = document.querySelector('script[data-sodo-search]')
      || document.querySelector('script[data-ghost][data-key]')
    var api = tag && (tag.getAttribute('data-api')
      || (tag.getAttribute('data-sodo-search') || '').replace(/\/?$/, '/') + 'ghost/api/content/')
    keys = {
      key: tag ? tag.getAttribute('data-key') : '',
      api: api || '/ghost/api/content/',
    }
    return keys
  }

  var json = function (body, status) {
    return new Response(JSON.stringify(body), {
      status: status || 200,
      headers: { 'content-type': 'application/json' },
    })
  }

  // ------------------------------------------------------------------ search
  //
  // Ghost's Content API has no full-text search, so this does what Ghost's own search does:
  // fetch the posts once, keep them, and match in the page. `limit=all` on a blog of a few
  // hundred posts is one request of a few dozen KB, and it is only ever made when a reader
  // actually opens the overlay — the bundle does not call this until somebody types.
  //
  // The shape is read off the bundle rather than guessed: it renders each result as
  // `<a href="/${slug}">${title}</a>`. So `slug` here carries the whole PATH under the site
  // root and not the post's slug, which is what keeps the links right under a Ghost that has
  // been given a `routes.yaml` with dated permalinks in it.
  var posts = null
  var loadPosts = function () {
    if (posts) return posts
    var g = ghost()
    // No key means Ghost is not offering its own search either, and there is nothing this
    // can do about that. The bundle's whole error handling for a failed fetch is to leave
    // the overlay showing its hint, which is the right thing to be left showing.
    if (!g.key) return Promise.resolve([])
    posts = fetch(g.api + 'posts/?key=' + encodeURIComponent(g.key)
      + '&limit=all&order=published_at%20desc&fields=title,url,excerpt')
      .then(function (r) { return r.ok ? r.json() : { posts: [] } })
      .then(function (d) { return (d && d.posts) || [] })
      .catch(function () { posts = null; return [] })
    return posts
  }

  var search = function (q) {
    var needle = q.toLowerCase()
    return loadPosts().then(function (all) {
      var out = []
      for (var i = 0; i < all.length && out.length < 8; i++) {
        var p = all[i]
        var hay = (p.title + ' ' + (p.excerpt || '')).toLowerCase()
        if (hay.indexOf(needle) === -1) continue
        var path = p.url
        try { path = new URL(p.url).pathname } catch (e) { /* already a path */ }
        out.push({ slug: path.replace(/^\//, ''), title: p.title })
      }
      return json(out)
    })
  }

  // ------------------------------------------------------------------ the newsletter
  //
  // Ghost's members endpoint, which is what Portal posts to. It answers 201 with a plain
  // string, and the bundle wants `res.ok` and an optional `{status}` — `pending_no_mail` is
  // the one value it treats specially, and Ghost never reports that, so a site with no mail
  // configured tells the reader to check an inbox nothing was sent to. Ghost's own Portal
  // says exactly the same thing in that situation.
  var subscribe = function (req) {
    return req.json().catch(function () { return {} }).then(function (body) {
      // The honeypot is the bundle's, and it is answered HERE rather than passed on: an
      // address only a script would have filled in should never reach Ghost's member list,
      // and telling the filler it worked is the point of a honeypot.
      if (body.website) return json({ status: 'pending' })

      // Ghost 5.87 and later want an integrity token with a sign-up, which is what Portal
      // sends. Older ones have no such route and do not ask. Fetched best-effort and simply
      // left out when it is not there, so one file works on both.
      return fetch('/members/api/integrity-token/')
        .then(function (r) { return r.ok ? r.text() : '' })
        .catch(function () { return '' })
        .then(function (token) {
          var payload = { email: body.email, emailType: 'subscribe', labels: [], name: '' }
          if (token) payload.integrityToken = token
          return fetch('/members/api/send-magic-link/', {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify(payload),
          })
        })
        .then(function (r) {
          if (r.ok) return json({ status: 'pending' })
          // 400 is what the bundle turns into "that is not an email address"; anything else
          // becomes its general failure line.
          //
          // AND NOT `pending_no_mail`, which is the one status the bundle has for "signed up,
          // but nothing was sent". The engine can say that because it writes the subscriber
          // down first and mails second. Ghost does not: with no mail server configured,
          // `send-magic-link` answers 500 with an EmailError and the members table is
          // unchanged — measured, on a Ghost with no mail set up. Reporting success there
          // would be telling a reader they had subscribed when nobody had recorded it.
          return json({ error: true }, r.status === 400 ? 400 : 500)
        })
    })
  }

  // ------------------------------------------------------------------ the fetch shim
  //
  // `/api/track` is Quire Ink's own analytics and has no counterpart here: Ghost counts its
  // own traffic, and a theme that shipped a second collector would be collecting on the
  // owner's behalf without the owner having asked. It is answered 204 rather than left to
  // 404, so nothing shows up in the console and no request leaves the page.
  //
  // `/api/comments` is NOT shimmed. Ghost has a comment system of its own with sign-in,
  // replies and moderation behind it, and this theme uses it — the engine's comment island
  // mounts on `#comments` and the article template deliberately does not print that id, so
  // the island never starts and never asks.
  var path = function (input) {
    var url = typeof input === 'string' ? input : (input && input.url) || ''
    if (url.indexOf('/api/') === -1) return ''
    try { return new URL(url, location.href).pathname } catch (e) { return '' }
  }

  var nativeFetch = window.fetch.bind(window)
  window.fetch = function (input, init) {
    var p = path(input)
    if (p === '/api/search') {
      var q = ''
      try { q = new URL(typeof input === 'string' ? input : input.url, location.href)
        .searchParams.get('q') || '' } catch (e) { /* fall through with '' */ }
      return q ? search(q) : Promise.resolve(json([]))
    }
    if (p === '/api/subscribe') {
      return subscribe(new Request(input, init))
    }
    if (p === '/api/track') {
      return Promise.resolve(new Response(null, { status: 204 }))
    }
    return nativeFetch(input, init)
  }

  // The analytics island prefers `sendBeacon`, which takes no promise and reports only a
  // boolean. Swallowing the call is the whole answer.
  if (navigator.sendBeacon) {
    var nativeBeacon = navigator.sendBeacon.bind(navigator)
    navigator.sendBeacon = function (url, data) {
      if (String(url).indexOf('/api/track') !== -1) return true
      return nativeBeacon(url, data)
    }
  }

  // ------------------------------------------------------------------ the slug rule
  //
  // Quire Ink's, matching `src/utils.ts`: lowercase, Vietnamese tone marks folded to ASCII,
  // everything else that is not a letter or a digit collapsed to a single hyphen. The tone
  // marks matter — a Vietnamese heading run through a rule that drops non-ASCII becomes an
  // empty string, and two of them become the same empty anchor.
  var slug = function (text) {
    var s = text.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[\u0111\u0110]/g, 'd').toLowerCase().trim()
      .replace(/[^a-z0-9\s-]/g, '').replace(/[\s-]+/g, '-')
      .replace(/^-+|-+$/g, '')
    return s || 'section'
  }

  var el = function (tag, attrs, text) {
    var node = document.createElement(tag)
    for (var k in attrs) if (attrs[k] !== undefined) node.setAttribute(k, attrs[k])
    if (text !== undefined) node.textContent = text
    return node
  }

  // ------------------------------------------------------------------ the one alias left
  //
  // Every other Koenig name is answered in `assets/css/quireink-alias.css`, which the
  // extractor generates from the engine's own declarations — because a layout that needs a
  // script to be a layout is not one, and because Ghost requires `.kg-width-wide` and
  // `.kg-width-full` to be styled in the theme's CSS.
  //
  // The embed card is the exception, and only because it carries a CONDITION no stylesheet
  // can express. `.video-embed` upstream is a 16:9 ratio box, which is right for a video and
  // wrong for a tweet — and Koenig gives both the same class. So the ratio is claimed only
  // where the embed is demonstrably a video, and every other embed keeps its own height.
  var alias = function (root) {
    var embeds = root.querySelectorAll('.kg-embed-card')
    for (var c = 0; c < embeds.length; c++) {
      if (embeds[c].querySelector('iframe[src*="youtube"], iframe[src*="youtu.be"],'
        + ' iframe[src*="vimeo"]')) embeds[c].classList.add('video-embed')
    }
  }

  // ------------------------------------------------------------------ the article passes
  var article = function () {
    var body = document.getElementById('post-body')
    if (!body) return

    alias(body)

    // The word count. Ghost stores reading time and not a count, so this measures the
    // rendered text the way the engine measures the source: split on whitespace, count what
    // is left. The same rule, one step further down the pipeline.
    var words = (body.innerText || body.textContent || '').trim().split(/\s+/).filter(Boolean)
    var slots = document.querySelectorAll('[data-word-count]')
    for (var i = 0; i < slots.length; i++) {
      slots[i].textContent = String(words.length).replace(/\B(?=(\d{3})+(?!\d))/g, ',')
    }

    var heads = body.querySelectorAll('h2, h3')
    // One heading is a title, not a table of contents. The blog engine applies the same floor.
    if (heads.length < 2) return

    var used = {}
    var items = []
    for (var j = 0; j < heads.length; j++) {
      var h = heads[j]
      var text = (h.textContent || '').trim()
      var id = h.id
      if (!id) {
        id = slug(text)
        if (used[id]) id = id + '-' + (++used[id])
        else used[id] = 1
        h.id = id
      }
      items.push({ id: id, text: text, level: h.tagName === 'H3' ? 3 : 2 })
    }

    // TWO-LEVEL ONLY WHEN THE ARTICLE IS. `rail-lead` and `rail-sub` are not "h2" and "h3":
    // they turn the gutter counter from a flat `1 2 3` into an outline `1, 1.1, 2`. An
    // article written entirely in h3 — which is most of them, because the title is the h1 and
    // the writer reaches for the next heading that looks right — has a FLAT contents, and
    // marking every row `rail-sub` numbers it `0.1 0.2 0.3`, because the outer counter never
    // increments.
    var outlined = false
    for (var k = 1; k < items.length; k++) if (items[k].level !== items[0].level) outlined = true

    var ul = el('ul')
    var title = document.querySelector('article > header h1')
    ul.appendChild(el('li')).appendChild(
      el('a', { class: 'rail-row link-accent t-small is-active', href: '#top' },
        title ? (title.textContent || '').trim() : 'Top'))
    for (var m = 0; m < items.length; m++) {
      var mark = outlined ? (items[m].level === 3 ? ' rail-sub' : ' rail-lead') : ''
      ul.appendChild(el('li')).appendChild(
        el('a', { class: 'rail-row link-accent t-small' + mark, href: '#' + items[m].id },
          items[m].text))
    }

    // The way out of the article, at the foot of the index. The sheet drops its number
    // (`li:has(.toc-end)`), so it reads as a destination rather than another section.
    var foot = []
    if (document.getElementById('post-tags')) foot.push('Tags')
    if (document.getElementById('post-comments')) foot.push('Comments')
    if (foot.length) {
      ul.appendChild(el('li')).appendChild(
        el('a', {
          class: 'rail-row link-accent t-small toc-end',
          href: '#' + (document.getElementById('post-tags') ? 'post-tags' : 'post-comments'),
        }, foot.join(' / ')))
    }

    var inner = el('div', { class: 'rail-inner' })
    inner.appendChild(el('h2', {}, 'Table of contents'))
    inner.appendChild(ul)
    var nav = el('nav', { class: 'toc rail', 'aria-label': 'Table of contents' })
    nav.appendChild(inner)
    body.parentNode.insertBefore(nav, body)
  }

  // ------------------------------------------------------------------ the listing timeline
  //
  // The shape is the blog engine's and it is load-bearing. The YEAR tag is a sticky
  // zero-size anchor that has to be the first child of a `.tl-yr` wrapper around that year's
  // posts, because it pins while its own group scrolls and the next group pushes it out. The
  // MONTH marker is a child of the article itself, absolutely positioned against it, so it
  // lines up with that card without anything measuring anything.
  //
  // A month marker is NOT printed for the first month inside a year group: the year tag is
  // already standing there, and two labels on one line reads as a mistake.
  var timeline = function () {
    var list = document.querySelector('.post-list.tl-feed')
    if (!list) return
    var cards = []
    for (var n = 0; n < list.children.length; n++) {
      if (list.children[n].tagName === 'ARTICLE') cards.push(list.children[n])
    }
    if (!cards.length) return

    var lang = document.documentElement.lang || undefined
    var year = null
    var month = null
    var group = null

    for (var i = 0; i < cards.length; i++) {
      var card = cards[i]
      var time = card.querySelector('time[datetime]')
      if (!time) continue
      var d = new Date(time.getAttribute('datetime'))
      if (isNaN(d)) continue
      var y = d.getFullYear()
      var mo = d.getMonth()

      if (y !== year) {
        group = el('div', { class: 'tl-yr' })
        var tag = el('span', { class: 'tl-year-tag' })
        tag.appendChild(el('span', { class: 'tl-dot' }))
        tag.appendChild(document.createTextNode(String(y)))
        var yearRow = el('div', { class: 'tl-year', 'aria-hidden': 'true' })
        yearRow.appendChild(tag)
        group.appendChild(yearRow)
        list.insertBefore(group, card)
        year = y
        // The year tag speaks for this month too.
        month = mo
      } else if (mo !== month) {
        var mark = el('span', { class: 'tl-mark t-small', 'aria-hidden': 'true' })
        mark.appendChild(el('span', { class: 'tl-dot' }))
        mark.appendChild(document.createTextNode(
          d.toLocaleDateString(lang, { month: 'long' })))
        card.insertBefore(mark, card.firstChild)
        month = mo
      }
      if (group) group.appendChild(card)
    }
  }

  window.quireink = { article: article, timeline: timeline }
}())
