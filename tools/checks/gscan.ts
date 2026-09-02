/**
 * Ghost's own theme linter. Zero errors, and the warnings that stand are listed here by name.
 *
 * It is not a formality: it caught the fact that `.kg-width-wide` and `.kg-width-full` were
 * only ever aliased by script, which meant a wide figure was not wide for a reader with
 * JavaScript off. The rules that produce them are generated from the engine now.
 */
import { $ } from 'bun'
import { join } from 'node:path'

// Warnings this theme has read and accepted. Each one is a decision written down somewhere.
const ACCEPTED = [
  // Ghost's design settings offer a font picker whose faces come from a font host. This
  // theme's six faces are the design and are in the theme, so nothing is fetched from anyone
  // else. docs/decisions/0002.
  'Missing support for custom fonts',
]

const theme = join(import.meta.dir, '..', '..', 'quire-ink')
const run = await $`npx --yes gscan ${theme}`.quiet().nothrow()
const out = run.stdout.toString() + run.stderr.toString()
// gscan paints its output; the colour codes get in the way of matching.
const plain = out.replace(new RegExp(String.fromCharCode(27) + '\\[[0-9;]*m', 'g'), '')

const errors = [...plain.matchAll(/^- Error: (.+)$/gm)].map((m) => m[1]!.trim())
const warnings = [...plain.matchAll(/^- Warning: (.+)$/gm)].map((m) => m[1]!.trim())
const unexpected = warnings.filter((w) => !ACCEPTED.some((a) => w.includes(a)))

if (!plain.includes('Checking theme compatibility')) {
  console.error('gscan: DID NOT RUN\n' + plain.slice(-800))
  process.exit(1)
}

if (errors.length || unexpected.length) {
  console.error('gscan: NOT CLEAN')
  for (const e of errors) console.error(`  error   ${e}`)
  for (const w of unexpected) console.error(`  warning ${w} — not in the accepted list`)
  console.error('\n  Fix it, or add the warning to ACCEPTED with the decision that allows it.')
  process.exit(1)
}
console.log(`gscan: 0 errors, ${warnings.length} accepted warning(s)`)
