/**
 * A class a template prints reaches a rule.
 *
 * Prefer the blog engine's own name over a new one: the sheet already carries `.listing-head`,
 * `.pager`, `.empty` and a few hundred more, and a name it does not carry renders perfectly
 * and is styled by nothing. That is the failure mode this whole repository exists to make
 * visible — the sibling WordPress port shipped `link-plain` on every listing headline, which
 * is not a class its sheet defines, so every headline on the listing page carried a link
 * underline. Visible in one screenshot; invisible to everything else.
 *
 * Reads the templates AND `ghost-bridge.js`, because the contents rail and the timeline are
 * built there and their class names are the same contract with the same sheet.
 */
import { readdir } from 'node:fs/promises'
import { join } from 'node:path'

const THEME = join(import.meta.dir, '..', '..', 'quire-ink')

/**
 * Names that are deliberately not in the sheets, each with the reason.
 *
 * Ghost prints these itself through `{{post_class}}` and `{{body_class}}`. They are not this
 * theme's to style and not this theme's to rename.
 */
const EXCEPTIONS: Record<string, string> = {
  post: 'Ghost, via {{post_class}}',
  page: 'Ghost, via {{post_class}}',
  featured: 'Ghost, via {{post_class}}',
  'no-image': 'Ghost, via {{post_class}}',
}

/**
 * And the second way a name is legitimate: the blog engine PRINTS it.
 *
 * `.byline`, `.info-terms`, `.term-list`, `.taxo-rule` are in the engine's own markup and in
 * none of its rules — they are semantic hooks, styled by the block around them. Copying that
 * markup is the point of this theme, so the test is not "is there a rule" but "is this a name
 * Quire Ink uses". Read out of the engine's source, so a name it drops stops being allowed
 * here on the next run.
 */
const QUIRE = join(import.meta.dir, '..', '..', '..', 'quireink', 'src', 'web')
const enginePrints = new Set<string>()
try {
  for (const f of await readdir(QUIRE)) {
    if (!f.endsWith('.ts') || f.endsWith('.test.ts')) continue
    const text = await Bun.file(join(QUIRE, f)).text()
    for (const m of text.matchAll(/class="([^"$]*)"/g)) {
      for (const c of m[1]!.split(/\s+/)) if (c && /^[a-z][\w-]*$/.test(c)) enginePrints.add(c)
    }
  }
} catch {
  console.log('classes: no quireink checkout beside this one — engine names not checked')
}

const sheets: string[] = []
for (const f of await readdir(join(THEME, 'assets', 'css'))) {
  if (f.endsWith('.css')) sheets.push(await Bun.file(join(THEME, 'assets', 'css', f)).text())
}
const css = sheets.join('\n')

const printed = new Set<string>()

const addFrom = (text: string) => {
  for (const m of text.matchAll(/class="([^"]*)"/g)) {
    // Handlebars expressions inside the attribute are not class names.
    const raw = m[1]!.replace(/\{\{[^}]*\}\}/g, ' ')
    for (const c of raw.split(/\s+/)) if (c) printed.add(c)
  }
}

for (const f of await readdir(THEME)) {
  if (f.endsWith('.hbs')) addFrom(await Bun.file(join(THEME, f)).text())
}
for (const f of await readdir(join(THEME, 'partials'))) {
  if (f.endsWith('.hbs')) addFrom(await Bun.file(join(THEME, 'partials', f)).text())
}

// The script's own names: `el('nav', { class: '…' })` and `classList.add('…')`.
const js = await Bun.file(join(THEME, 'assets', 'js', 'ghost-bridge.js')).text()
for (const m of js.matchAll(/class: '([^']*)'/g)) {
  for (const c of m[1]!.split(/\s+/)) if (c) printed.add(c)
}
for (const m of js.matchAll(/classList\.add\('([^']*)'\)/g)) printed.add(m[1]!)

const orphans: string[] = []
for (const c of [...printed].sort()) {
  if (EXCEPTIONS[c]) continue
  if (enginePrints.has(c)) continue
  // A class reaches a rule if the sheets name it as a class token anywhere.
  const re = new RegExp('\\.' + c.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '(?![\\w-])')
  if (!re.test(css)) orphans.push(c)
}

if (orphans.length) {
  console.error('classes: PRINTED AND STYLED BY NOTHING\n  ' + orphans.join('\n  ')
    + '\n\n  The sheet usually already carries the block under the engine\'s own name.'
    + '\n  Use that name, or add the class here with the reason it is not in a sheet.')
  process.exit(1)
}
console.log(`classes: ${printed.size} printed, every one reaches a rule`
  + ` (${enginePrints.size} names the engine itself prints)`)
