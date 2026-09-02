/**
 * The accessibility audit, run rather than remembered. `bun run check:a11y` — needs dev/up.sh.
 *
 * Colour is somebody else's job here: `check:contrast` reads the palettes out of the engine
 * and measures all sixty against their own backgrounds, offline, as part of `check:all`. This
 * is everything colour cannot tell you, and it has to open the page because most of it is
 * about elements that do not exist until a script has built them.
 *
 * IT OPENS THE OVERLAYS, and that is the point rather than thoroughness for its own sake. The
 * sibling WordPress port audited its article page and passed; the two defects it eventually
 * found were both controls whose entire content is an SVG, and SEVEN of the thirteen missing
 * strings behind them were inside book mode, where nothing is visible until the dialog is
 * open. An audit that only looks at what is on screen at rest is an audit of the easy half.
 *
 * The accessible name computed here is an APPROXIMATION of the browser's own algorithm —
 * aria-label, aria-labelledby, title, text content, a contained image's alt, an associated
 * label. It is deliberately generous: anything it calls nameless really is nameless, which is
 * the failure worth stopping a release for.
 */
import { withPage, origins, ORIGIN } from '../browser'

if (!await origins()) {
  console.log(`a11y: SKIP — nothing answering on ${ORIGIN}. Run dev/up.sh && dev/seed.sh.`)
  process.exit(0)
}

const AUDIT = `
(() => {
  const name = (el) => {
    const aria = (el.getAttribute('aria-label') || '').trim()
    if (aria) return aria
    const by = el.getAttribute('aria-labelledby')
    if (by) {
      const t = by.split(/\\s+/).map(id => document.getElementById(id))
        .filter(Boolean).map(n => n.textContent.trim()).join(' ').trim()
      if (t) return t
    }
    const title = (el.getAttribute('title') || '').trim()
    if (title) return title
    const text = (el.textContent || '').trim()
    if (text) return text
    const img = el.querySelector('img[alt]')
    if (img && img.getAttribute('alt').trim()) return img.getAttribute('alt').trim()
    if (el.id) {
      const lab = document.querySelector('label[for="' + CSS.escape(el.id) + '"]')
      if (lab && lab.textContent.trim()) return lab.textContent.trim()
    }
    if (el.closest('label')) return (el.closest('label').textContent || '').trim()
    const ph = (el.getAttribute('placeholder') || '').trim()
    if (ph) return ph
    return ''
  }

  const describe = (el) => el.tagName.toLowerCase()
    + (el.className && typeof el.className === 'string' ? '.' + el.className.trim().split(/\\s+/).join('.') : '')
    + [...el.attributes].filter(a => a.name.startsWith('data-') && !a.value)
        .map(a => '[' + a.name + ']').join('')

  const out = { nameless: [], headings: [], noAlt: [], hiddenFocusable: [], notes: {} }

  // Every control a reader can reach.
  const controls = document.querySelectorAll(
    'a[href], button, input:not([type=hidden]), select, textarea, summary, [role=button]')
  for (const el of controls) {
    if (el.closest('[aria-hidden="true"]')) continue
    if (el.hasAttribute('hidden')) continue
    if (el.offsetParent === null && el.getClientRects().length === 0
      && !el.closest('dialog[open]') && !el.classList.contains('skip-link')) continue
    if (!name(el)) out.nameless.push(describe(el))
  }

  // A focusable thing inside aria-hidden is reachable by keyboard and invisible to a screen
  // reader, which is the worst of both.
  for (const h of document.querySelectorAll('[aria-hidden="true"]')) {
    for (const f of h.querySelectorAll('a[href], button, input, select, textarea, [tabindex]')) {
      if (f.getAttribute('tabindex') === '-1') continue
      out.hiddenFocusable.push(describe(f))
    }
  }

  for (const h of document.querySelectorAll('h1,h2,h3,h4,h5,h6')) {
    if (h.closest('[aria-hidden="true"]')) continue
    out.headings.push(Number(h.tagName[1]))
  }

  for (const img of document.querySelectorAll('img')) {
    if (!img.hasAttribute('alt')) out.noAlt.push(describe(img))
  }

  const skip = document.querySelector('.skip-link')
  out.notes = {
    lang: document.documentElement.lang || '',
    h1: document.querySelectorAll('h1').length,
    main: !!document.querySelector('main#content'),
    header: !!document.querySelector('header.site'),
    footer: !!document.querySelector('footer.site'),
    skipTarget: skip ? !!document.querySelector(skip.getAttribute('href')) : false,
    focusVisible: [...document.styleSheets].some(s => {
      try { return [...s.cssRules].some(r => (r.selectorText || '').includes(':focus-visible')) }
      catch { return false }
    }),
  }
  return out
})()`

// The overlays, opened before the audit runs. Each is a dialog the engine's bundles build from
// nothing, so none of its controls exists in the served HTML.
const OPEN_BOOK = `(() => { document.querySelector('[data-book-open]').click(); return true })()`
const OPEN_SEARCH = `(() => { document.querySelector('[data-search-open]').click(); return true })()`
const OPEN_MENUS = `(() => {
  document.querySelector('[data-theme-toggle]').click()
  document.querySelector('[data-palettes]')?.click()
  return true
})()`

const problems: string[] = []
const seen: Record<string, number> = {}

await withPage(async (at) => {
  const post = `${ORIGIN}/six-palettes-and-the-one-that-is-a-mistake/`

  const check = (where: string, r: any) => {
    seen[where] = (r.headings as number[]).length
    for (const c of r.nameless) problems.push(`${where}: no accessible name — ${c}`)
    for (const c of r.hiddenFocusable) problems.push(`${where}: focusable inside aria-hidden — ${c}`)
    for (const c of r.noAlt) problems.push(`${where}: <img> with no alt — ${c}`)
    // Heading order: one h1, and no level skipped on the way down.
    if (r.notes.h1 !== 1) problems.push(`${where}: ${r.notes.h1} <h1> elements, expected 1`)
    let prev = 0
    for (const level of r.headings as number[]) {
      if (prev && level > prev + 1) problems.push(`${where}: heading jumps h${prev} → h${level}`)
      prev = level
    }
    if (!r.notes.lang) problems.push(`${where}: <html> carries no lang`)
    if (!r.notes.main) problems.push(`${where}: no <main id="content">`)
    if (!r.notes.header) problems.push(`${where}: no <header class="site">`)
    if (!r.notes.footer) problems.push(`${where}: no <footer class="site">`)
    if (!r.notes.skipTarget) problems.push(`${where}: the skip link points at nothing`)
    if (!r.notes.focusVisible) problems.push(`${where}: no :focus-visible rule reached the page`)
  }

  check('listing', await at(ORIGIN + '/', 1440, AUDIT))
  check('article', await at(post, 1440, AUDIT))
  check('page', await at(ORIGIN + '/colophon/', 1440, AUDIT))
  check('phone', await at(post, 375, AUDIT))

  // ...and the three surfaces that do not exist until something is clicked.
  await at(post, 1440, OPEN_BOOK)
  check('book mode', await at(post, 1440, `(() => { document.querySelector('[data-book-open]').click(); return null })() || ${AUDIT}`))
  check('search overlay', await at(post, 1440, `(() => { document.querySelector('[data-search-open]').click(); return null })() || ${AUDIT}`))
  check('theme + palette menus', await at(post, 1440, `${OPEN_MENUS} && ${AUDIT}`))
})

if (problems.length) {
  const unique = [...new Set(problems)]
  console.error('a11y: DEFECTS\n  ' + unique.join('\n  '))
  console.error('\n  A control whose whole content is an SVG announces as "button" when its'
    + '\n  label is an empty string. The labels are generated — fix them in tools/extract.ts.')
  process.exit(1)
}
console.log(`a11y: ${Object.keys(seen).length} surfaces audited, every control named,`
  + ' heading order intact, landmarks and skip link present')
