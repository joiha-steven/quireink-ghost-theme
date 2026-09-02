/**
 * Every palette clears WCAG AA against its own background.
 *
 * Text at 4.5:1, accent marks and meta text at 3:1, in all six palettes and both schemes.
 * The colours are the blog engine's, so this is a TRIPWIRE ON A RE-EXTRACT rather than a rule
 * about code here: it goes red when Quire Ink changes a palette in a way this theme should
 * not ship silently.
 */
import { THEME_PRESETS } from '@/content/themes'

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

// `bg` is the ground everything is measured against. `text` is body copy and needs 4.5;
// the rest are large or decorative and need 3.
const AGAINST_BG: [string, number][] = [
  ['text', 4.5], ['heading', 4.5], ['link', 4.5], ['meta', 3], ['accent', 3],
]

const bad: string[] = []
let measured = 0
for (const preset of THEME_PRESETS) {
  for (const scheme of ['light', 'dark'] as const) {
    const t = preset.theme[scheme] as unknown as Record<string, string>
    const bg = t.bg
    if (!bg) { bad.push(`${preset.id}/${scheme}: no background colour`); continue }
    for (const [key, floor] of AGAINST_BG) {
      const value = t[key]
      if (!value || !value.startsWith('#')) continue
      measured++
      const r = ratio(value, bg)
      if (r < floor) {
        bad.push(`${preset.id}/${scheme} ${key} ${value} on ${bg} = ${r.toFixed(2)}:1`
          + ` (needs ${floor})`)
      }
    }
  }
}

if (bad.length) {
  console.error('contrast: BELOW WCAG AA\n  ' + bad.join('\n  ')
    + "\n\n  The colours are the blog engine's. Fix them there, then re-extract.")
  process.exit(1)
}
console.log(`contrast: ${measured} colours across ${THEME_PRESETS.length} palettes, all AA`)
