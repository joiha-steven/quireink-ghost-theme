/**
 * The guard that opens the page. `bun run check:live` — needs `dev/up.sh` and `dev/seed.sh`.
 *
 * NOT part of `check:all`, which is static, offline and takes seconds. This one drives a real
 * browser against the real Ghost, because the two things it measures cannot be seen any other
 * way, and both have already been wrong here:
 *
 *   1. A RULE THE BROWSER THREW AWAY. A selector that will not parse is dropped silently — no
 *      error, no console line, the rest of the sheet applies perfectly. The alias generator
 *      splits selector lists on commas, and `:is(figure.img-wide,.video-wide)` is one selector
 *      with a comma inside it; split naively it becomes two fragments with unmatched
 *      parentheses and both go on the floor. The sibling WordPress port lost 60 of 69 editor
 *      rules to exactly this and the canvas still looked *almost* right.
 *
 *   2. THE WIDE FIGURE AGAINST THE RAIL. The engine changes what "wide" means once the
 *      contents rail is in the gutter: flush with the column on the left, nosing RIGHT by one
 *      rail width into the gutter the rail is not using. Missing that rule left a figure with
 *      symmetric negative margins that crossed the rail's own edge by 18px — and every number
 *      about it measured symmetric, which is why it took somebody looking at the page.
 */
import { join } from 'node:path'
import { withPage, origins, ORIGIN } from '../browser'

if (!await origins()) {
  console.log(`live: SKIP — nothing answering on ${ORIGIN}. Run dev/up.sh && dev/seed.sh.`)
  process.exit(0)
}

const summary = await withPage(async (at) => {
const problems: string[] = []
  const post = `${ORIGIN}/every-card-koenig-can-write/`

  // ---- 1. nothing the theme ships was dropped by the parser -------------------------------
  const parsed = await at(post, 1440, `
    (() => {
      const out = {}
      for (const s of document.styleSheets) {
        const name = (s.href || '').split('/').pop()?.split('?')[0]
        if (!name || !/^(quireink-|bridge)/.test(name)) continue
        let kept = 0
        // keyText is a keyframe STEP -- 0% inside @keyframes. It opens a brace in the file
        // and has no selector, so counting only selectors made the base sheet look five
        // rules short. There are exactly five steps in it. (No backticks in here: this whole
        // block is a template literal.)
        const walk = (rules) => { for (const r of rules) {
          if (r.selectorText || r.keyText) kept++
          if (r.cssRules && r.cssRules.length) walk(r.cssRules)
        } }
        walk(s.cssRules)
        out[name] = kept
      }
      return out
    })()`)

  for (const [name, kept] of Object.entries(parsed) as [string, number][]) {
    const text = await Bun.file(join(import.meta.dir, '..', '..', 'quire-ink', 'assets', 'css', name)).text()
    // Braces that open a rule, less the ones that open an at-rule block, is the count of
    // selectors the file asks for. Close enough to catch a rule going missing, which is the
    // only thing this is looking for.
    //
    // COMMENTS FIRST. The sheets explain themselves in prose that contains braces, and
    // counting those made the guard report four phantom missing rules in two files on its
    // very first run — a check that cries wolf is a check somebody turns off.
    const body = text.replace(/\/\*[\s\S]*?\*\//g, '')
    const opens = (body.match(/\{/g) ?? []).length
    const atRules = (body.match(/@[a-z-]+[^{;]*\{/g) ?? []).length
    const want = opens - atRules
    if (kept < want) problems.push(`${name}: the browser kept ${kept} of ${want} rules`)
  }

  // ---- 2. the wide figure, above and below the rail breakpoint ----------------------------
  const geom = `
    (() => {
      const r = s => { const e = document.querySelector(s); if (!e) return null
        const b = e.getBoundingClientRect(); return { l: Math.round(b.left), r: Math.round(b.right) } }
      const fig = r('.kg-width-wide'), col = r('#post-body'), rail = r('.toc')
      const railInGutter = !!rail && rail.l >= 0
      return {
        railInGutter,
        flushLeft: fig.l - col.l,
        nosesRight: fig.r - col.r,
        crossesRail: railInGutter ? Math.max(0, rail.r - fig.l) : 0,
      }
    })()`

  const wide = await at(post, 1440, geom)
  if (!wide.railInGutter) problems.push('1440: the contents rail is not in the gutter')
  if (wide.flushLeft !== 0) {
    problems.push(`1440: the wide figure is ${wide.flushLeft}px off the column's left edge,`
      + ' and beside a rail it has to be flush with it')
  }
  if (wide.crossesRail > 0) problems.push(`1440: the wide figure crosses the rail by ${wide.crossesRail}px`)
  if (wide.nosesRight < 200) problems.push(`1440: the wide figure only noses ${wide.nosesRight}px right`)

  const narrow = await at(post, 1157, geom)
  if (narrow.railInGutter) problems.push('1157: the rail should be a drawer at this width')
  if (Math.abs(narrow.flushLeft + narrow.nosesRight) > 2) {
    problems.push(`1157: with no rail the figure should nose both ways evenly,`
      + ` and it is ${narrow.flushLeft} / ${narrow.nosesRight}`)
  }

  // ---- 3. no horizontal overflow on a phone, on every template ----------------------------
  for (const path of ['/', '/tag/typography/', '/every-card-koenig-can-write/', '/colophon/']) {
    const o = await at(ORIGIN + path, 375,
      '({ o: document.documentElement.scrollWidth - document.documentElement.clientWidth })')
    if (o.o > 0) problems.push(`375px ${path}: ${o.o}px of horizontal overflow`)
  }

  const total = Object.values(parsed).reduce((a, b) => a + (b as number), 0)
  return { problems, total, nosesRight: wide.nosesRight }
})

if (summary.problems.length) {
  console.error('live: WRONG ON THE PAGE\n  ' + summary.problems.join('\n  '))
  process.exit(1)
}
console.log(`live: ${summary.total} rules kept by the browser · wide figure flush beside the`
  + ` rail, noses right ${summary.nosesRight}px · no overflow at 375 on 4 templates`)
