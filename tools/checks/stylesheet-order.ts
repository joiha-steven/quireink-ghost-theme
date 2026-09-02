/**
 * The sheets load base → ide → tokens → alias → bridge, and that order is load-bearing.
 *
 * The generated half is generated so that it can WIN: `.rail` is a slide-out drawer in the
 * base sheet, and only the computed media query in the tokens sheet promotes it into the
 * desktop gutter. Linked the intuitive way round — variables first, because everything reads
 * them — the drawer rule wins on source order and the table of contents silently never
 * appears on any desktop screen. Nothing errors, every element is present with the right
 * class, and three rounds of screenshots went past it in the sibling WordPress port.
 *
 * `{{ghost_head}}` comes after all five, which is deliberate and safe: Ghost's card sheet is
 * `.kg-*` at 0,1,0 and every rule this theme writes for a card is `.prose .kg-*` at 0,2,0, so
 * the theme wins on specificity without needing to come later — and the owner's own code
 * injection, which is the last thing in `{{ghost_head}}`, still beats the theme.
 */
const ORDER = [
  'css/quireink-base.css',
  'css/quireink-ide.css',
  'css/quireink-tokens.css',
  'css/quireink-alias.css',
  'css/bridge.css',
]

const html = await Bun.file(new URL('../../quire-ink/default.hbs', import.meta.url)).text()

const links = [...html.matchAll(/\{\{asset "(css\/[^"]+)"\}\}/g)].map((m) => m[1]!)
const seen = ORDER.filter((f) => links.includes(f))
const problems: string[] = []

for (const f of ORDER) {
  if (!links.includes(f)) problems.push(`${f} is not linked at all`)
}
if (JSON.stringify(links) !== JSON.stringify(seen)) {
  problems.push(`linked in the order ${links.join(' → ')}`)
}

const headEnd = html.indexOf('{{ghost_head}}')
const lastSheet = html.lastIndexOf('{{asset "css/')
if (headEnd === -1) problems.push('{{ghost_head}} is missing')
else if (lastSheet > headEnd) problems.push('a stylesheet is linked after {{ghost_head}}')

if (problems.length) {
  console.error('order: WRONG\n  ' + problems.join('\n  ')
    + `\n\n  Expected: ${ORDER.join(' → ')}, all before {{ghost_head}}.`)
  process.exit(1)
}
console.log(`order: ${ORDER.length} sheets, base → bridge, all before {{ghost_head}}`)
