/**
 * `bridge.css` translates, it never decides.
 *
 * No hex, no colour function, no length that is not 0 / 1px / 2px / 100%. A value that is not
 * already a Quire Ink variable means the two surfaces have started to drift, and the place to
 * fix it is upstream in the blog engine, where the extractor brings it across on the next run.
 *
 * The first version of a bridge stylesheet always copies declarations across instead. That is
 * how the gutter geometry ends up written down twice, and how a palette change stops reaching
 * half the page.
 */
const file = Bun.file(new URL('../../quire-ink/assets/css/bridge.css', import.meta.url))
const text = await file.text()

// Comments carry prose, hex examples and measurements. Only declarations are checked.
const css = text.replace(/\/\*[\s\S]*?\*\//g, '')

const ALLOWED_LENGTH = new Set(['0', '1px', '2px', '100%'])
const bad: string[] = []

for (const [i, line] of css.split('\n').entries()) {
  const at = () => `bridge.css:${text.split('\n').findIndex((l) => l === line) + 1 || i + 1}`

  if (/#[0-9a-fA-F]{3,8}\b/.test(line)) bad.push(`${at()} — a hex colour: ${line.trim()}`)
  if (/\b(rgba?|hsla?|oklch|color-mix)\s*\(/.test(line)) {
    bad.push(`${at()} — a colour function: ${line.trim()}`)
  }
  for (const m of line.matchAll(/(?<![\w-])(\d*\.?\d+)(px|rem|em|vw|vh|%)/g)) {
    const value = m[1]! + m[2]!
    if (ALLOWED_LENGTH.has(value)) continue
    // Inside calc() every length is multiplied into a variable, which is the point.
    const before = line.slice(0, m.index)
    if (/calc\([^)]*$/.test(before)) continue
    bad.push(`${at()} — a bare length ${value}: ${line.trim()}`)
  }
}

if (bad.length) {
  console.error('bridge: VALUES THAT ARE NOT QUIRE INK\'S\n  ' + bad.join('\n  ')
    + '\n\n  Put the value upstream in the blog engine, then re-extract.')
  process.exit(1)
}
const rules = (css.match(/\{/g) ?? []).length
console.log(`bridge: ${rules} rules, every value a Quire Ink variable`)
