/**
 * Every relative link in the documentation points at something that exists.
 *
 * These files cross-reference each other heavily — an invariant names its guard, a decision
 * names the file it governs, the release checklist names both — and that is the point of them.
 * A link that has rotted is invisible: the sentence around it still reads correctly, and
 * nothing renders differently until somebody clicks.
 *
 * It also checks the other direction. A document nobody links to is a document nobody finds,
 * and this repository has already shipped one generated file that no template included.
 */
import { readdir } from 'node:fs/promises'
import { join, dirname, resolve, relative } from 'node:path'

const ROOT = join(import.meta.dir, '..', '..')

async function walk(dir: string): Promise<string[]> {
  const out: string[] = []
  for (const e of await readdir(dir, { withFileTypes: true })) {
    if (e.name === 'node_modules' || e.name === '.git' || e.name === '.tmp') continue
    const p = join(dir, e.name)
    if (e.isDirectory()) out.push(...await walk(p))
    else out.push(p)
  }
  return out
}

const files = await walk(ROOT)
const markdown = files.filter((f) => f.endsWith('.md'))
const exists = new Set(files.map((f) => resolve(f)))

const broken: string[] = []
const linked = new Set<string>()

for (const file of markdown) {
  const text = await Bun.file(file).text()
  // `[label](target)` — relative targets only. An http link is somebody else's to keep alive,
  // and the release checklist checks the handful that matter by hand.
  for (const m of text.matchAll(/\]\(([^)\s]+)\)/g)) {
    const raw = m[1]!
    if (/^(https?:|mailto:|#)/.test(raw)) continue
    const target = resolve(dirname(file), raw.split('#')[0]!)
    if (!target) continue
    linked.add(target)
    // A link to a directory is a link to whatever index it holds.
    const ok = exists.has(target)
      || exists.has(join(target, 'README.md'))
      || files.some((f) => resolve(f).startsWith(target + '/'))
    if (!ok) broken.push(`${relative(ROOT, file)} → ${raw}`)
  }
}

// Every document under docs/ has to be reachable from another one.
const orphans: string[] = []
for (const file of markdown) {
  const rel = relative(ROOT, file)
  if (!rel.startsWith('docs/')) continue
  if (rel.endsWith('README.md')) continue
  if (!linked.has(resolve(file))) orphans.push(rel)
}

if (broken.length || orphans.length) {
  if (broken.length) console.error('docs: BROKEN LINKS\n  ' + broken.join('\n  '))
  if (orphans.length) {
    console.error((broken.length ? '\n' : '') + 'docs: LINKED FROM NOWHERE\n  '
      + orphans.join('\n  ') + '\n\n  A document nobody links to is a document nobody finds.')
  }
  process.exit(1)
}
console.log(`docs: ${markdown.length} files, every relative link resolves,`
  + ' every page reachable')
