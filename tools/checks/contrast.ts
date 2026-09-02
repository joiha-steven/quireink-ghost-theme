/**
 * Every palette clears WCAG AA against its own background.
 *
 * Text at 4.5:1, links the same, accent marks and meta at 3:1, in all six palettes and both
 * schemes.
 *
 * IT READS THE SHIPPED STYLESHEET, not the blog engine. That is a correction rather than a
 * convenience: the first version imported the engine's `THEME_PRESETS`, which measured what the
 * engine intends and not what this theme puts on a reader's screen — and it could not run at
 * all without the sibling checkout, which is how it failed on the first CI run this repository
 * ever had.
 *
 * Reading `quireink-tokens.css` measures the bytes that actually ship, catches anything the
 * extractor does to a colour on the way through, and works anywhere. Same argument as
 * `check:live` counting the rules the BROWSER kept rather than the rules the file contains.
 *
 * The colours are still the engine's, so a red result here is usually a tripwire on a
 * re-extract rather than a bug in this repository.
 */
const css = await Bun.file(
  new URL('../../quire-ink/assets/css/quireink-tokens.css', import.meta.url)).text()

const hex = (c: string): [number, number, number] => {
  const s = c.replace('#', '')
  const full = s.length === 3 ? s.split('').map((x) => x + x).join('') : s
  return [0, 2, 4].map((i) => parseInt(full.slice(i, i + 2), 16)) as [number, number, number]
}
const lum = (c: string): number => {
  const [r, g, b] = hex(c).map((v) => {
    const s = v / 255
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4
  }) as [number, number, number]
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}
const ratio = (a: string, b: string): number => {
  const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p) as [number, number]
  return (x + 0.05) / (y + 0.05)
}

/**
 * The selectors the sheet declares a palette under, and what each one is.
 *
 * LOOKBEHIND for the boundary, never a consuming group. The blocks are emitted back to back —
 * `…}[data-palette="mono"]{…}[data-palette="mono"].dark{…}` — so a leading `[}\s]` that the
 * match CONSUMES eats the delimiter the next block needs, and the scan silently returns every
 * other block. It found 7 of 14 and the failure looked like a changed stylesheet.
 */
function blocks(): Map<string, Record<string, string>> {
  const out = new Map<string, Record<string, string>>()
  for (const m of css.matchAll(/(?<=^|[};])((?::root|\.dark|\[data-palette="[a-z]+"\](?:\.dark)?))\{([^}]*)\}/gm)) {
    const selector = m[1]!
    const vars: Record<string, string> = {}
    for (const v of m[2]!.matchAll(/--c-([a-z-]+):(#[0-9a-fA-F]{3,8})/g)) vars[v[1]!] = v[2]!
    if (!('bg' in vars)) continue
    const id = selector === ':root' ? 'default/light'
      : selector === '.dark' ? 'default/dark'
      : selector.replace(/\[data-palette="([a-z]+)"\](\.dark)?/, (_, p, d) => `${p}/${d ? 'dark' : 'light'}`)
    out.set(id, vars)
  }
  return out
}

// `text`, `heading` and `link` are read as running text and need 4.5. `meta` is small print
// and `accent` is a mark rather than a word; both are held to 3, which is the non-text floor.
const FLOORS: Record<string, number> = {
  text: 4.5, heading: 4.5, link: 4.5, meta: 3, accent: 3,
}

const found = blocks()
if (found.size < 12) {
  console.error(`contrast: only ${found.size} palette blocks found in quireink-tokens.css,`
    + ' expected at least 12 (six palettes, light and dark).\n'
    + '  The sheet is generated — if its shape changed, this parser has to change with it.')
  process.exit(1)
}

const bad: string[] = []
const worst: Record<string, { r: number; where: string }> = {}
let measured = 0
for (const [where, vars] of found) {
  for (const [role, floor] of Object.entries(FLOORS)) {
    const value = vars[role]
    if (!value) continue
    measured++
    const r = ratio(value, vars.bg!)
    if (!worst[role] || r < worst[role]!.r) worst[role] = { r, where }
    if (r < floor) bad.push(`${where} ${role} ${value} on ${vars.bg} = ${r.toFixed(2)}:1 (needs ${floor})`)
  }
}

if (bad.length) {
  console.error('contrast: BELOW WCAG AA\n  ' + bad.join('\n  ')
    + "\n\n  The colours are the blog engine's. Fix them there, then re-extract.")
  process.exit(1)
}
const summary = Object.entries(worst)
  .map(([role, w]) => `${role} ${w.r.toFixed(2)}`).join(' · ')
console.log(`contrast: ${measured} colours across ${found.size} palette/scheme pairs, all AA`)
console.log(`          worst measured — ${summary}`)
