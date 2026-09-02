/**
 * The generated half of the theme still matches the blog engine — byte for byte.
 *
 * Runs the extractor into a temporary directory and compares. A check that has to modify the
 * tree to run is a check people turn off, so `EXTRACT_OUT` points it somewhere else and what
 * is committed is never touched.
 *
 * A red result here is the seam REPORTING, not a failure: Quire Ink has moved. Re-run
 * `bun run extract` and read the diff before committing it.
 *
 * It also checks the other direction — that every generated partial is actually included by
 * a template. A file that nobody references renders perfectly and does nothing, which is the
 * failure mode this whole repository is built to make visible.
 */
import { readdir, rm, mkdir } from 'node:fs/promises'
import { join } from 'node:path'
import { $ } from 'bun'

const ROOT = join(import.meta.dir, '..', '..')
const THEME = join(ROOT, 'quire-ink')
const OUT = join(ROOT, '.tmp', 'extract-check')

if (!(await Bun.file(join(ROOT, '..', 'quireink', 'package.json')).exists())) {
  console.log('generated: SKIP — no quireink checkout beside this one')
  process.exit(0)
}

await rm(OUT, { recursive: true, force: true })
await mkdir(OUT, { recursive: true })
const run = await $`EXTRACT_OUT=${OUT} bun ${join(ROOT, 'tools', 'extract.ts')}`.quiet().nothrow()
if (run.exitCode !== 0) {
  console.error('generated: the extractor did not run\n' + run.stderr.toString())
  process.exit(1)
}

const bad: string[] = []
async function walk(dir: string, base = ''): Promise<string[]> {
  const out: string[] = []
  for (const e of await readdir(join(dir, base), { withFileTypes: true })) {
    const rel = base ? `${base}/${e.name}` : e.name
    if (e.isDirectory()) out.push(...await walk(dir, rel))
    else out.push(rel)
  }
  return out
}

for (const rel of await walk(OUT)) {
  const a = Bun.file(join(OUT, rel))
  const b = Bun.file(join(THEME, rel))
  if (!(await b.exists())) { bad.push(`${rel} — generated, and not in the theme`); continue }
  const [x, y] = [await a.arrayBuffer(), await b.arrayBuffer()]
  if (x.byteLength !== y.byteLength
    || !new Uint8Array(x).every((v, i) => v === new Uint8Array(y)[i])) {
    bad.push(`${rel} — differs (${y.byteLength} B committed, ${x.byteLength} B generated)`)
  }
}

// Every generated partial has to be reachable from a template.
const templates: string[] = []
for (const rel of await walk(THEME)) {
  if (rel.endsWith('.hbs') && !rel.startsWith('partials/generated-')) {
    templates.push(await Bun.file(join(THEME, rel)).text())
  }
}
const all = templates.join('\n')
for (const rel of await walk(join(THEME, 'partials'))) {
  if (!rel.startsWith('generated-')) continue
  const name = rel.replace(/\.hbs$/, '')
  if (!all.includes(`"${name}"`)) bad.push(`partials/${rel} — generated, and no template includes it`)
}

if (bad.length) {
  console.error('generated: OUT OF SYNC\n  ' + bad.join('\n  ')
    + '\n\n  Run `bun run extract` and read the diff.')
  process.exit(1)
}
console.log('generated: in sync with quireink')
